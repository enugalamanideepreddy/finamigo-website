'use strict';
firebase.initializeApp(window.FINAMIGO_FIREBASE);
const auth=firebase.auth();
let cloudKnown={},activeUid=null;
window.cloudUser=null;
const cloudBase=uid=>`https://firestore.googleapis.com/v1/projects/${FINAMIGO_FIREBASE.projectId}/databases/(default)/documents/phoneReviews/${uid}`;
async function cloudRequest(path,method='GET',data){const user=auth.currentUser;if(!user)throw Error('Sign in to sync reviews');const response=await fetch(`${cloudBase(user.uid)}/${path}`,{method,headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify({fields:{payload:{stringValue:JSON.stringify(data)}}})}:{})});if(!response.ok){if(response.status===404&&method==='GET')return null;throw Error(`Cloud sync failed (${response.status}). Please retry.`);}return response.status===204?null:response.json();}
window.syncReviewChanges=async function(reviews){if(!cloudUser)return;for(const [key,value]of Object.entries(reviews)){if(JSON.stringify(cloudKnown[key])!==JSON.stringify(value)){await cloudRequest(`reviews/${encodeURIComponent(key)}`,'PATCH',value);cloudKnown[key]=structuredClone(value);}}for(const key of Object.keys(cloudKnown)){if(!reviews[key]){await cloudRequest(`reviews/${encodeURIComponent(key)}`,'PATCH',{key,mode:cloudKnown[key].mode,status:'undone',target_time:cloudKnown[key].reviewed_at,reviewed_at:new Date().toISOString()});delete cloudKnown[key];}}};
async function loadCloud(){const uid=auth.currentUser?.uid;if(!uid)return;document.getElementById('status').textContent='Loading your synced transactions…';const manifest=await cloudRequest('snapshots/current');if(!manifest){document.getElementById('status').textContent='No synced transactions yet. In FinAmigo, open Review transactions and tap Sync to phone once.';return;}const info=JSON.parse(manifest.fields.payload.stringValue),next={transactions:[],pairs:[],splits:[],categories:info.categories,reviews:{},history:[],cloudUid:uid,filename:'FinAmigo cloud sync'};for(const chunk of info.chunks){const data=await cloudRequest(`snapshots/${encodeURIComponent(chunk)}`);if(!data)throw Error('Sync is incomplete. Retry after syncing FinAmigo.');const part=JSON.parse(data.fields.payload.stringValue);next[part.kind].push(...part.rows);}let pageToken;do{const data=await cloudRequest(`reviews?pageSize=100${pageToken?'&pageToken='+encodeURIComponent(pageToken):''}`);for(const doc of data?.documents||[]){const value=JSON.parse(doc.fields.payload.stringValue);if(value.status!=='undone')next.reviews[value.key]=value;}pageToken=data?.nextPageToken;}while(pageToken);if(auth.currentUser?.uid!==uid)return;cloudKnown=structuredClone(next.reviews);await window.loadCloudState(next);document.getElementById('status').textContent='Cloud reviews loaded. Changes sync when you save.';}
document.addEventListener('DOMContentLoaded',()=>{
 const params=new URLSearchParams(location.search),desktopPort=Number(params.get('desktopPort')),desktopState=params.get('desktopState');
 const desktopMode=Number.isInteger(desktopPort)&&desktopPort>1024&&desktopPort<65536&&/^[A-Za-z0-9_=-]{40,50}$/.test(desktopState||'');
 if(desktopMode){
  document.getElementById('desktop-connect').hidden=false;
  const connect=document.getElementById('connect-desktop');connect.textContent='Sync this computer';
  connect.onclick=async()=>{
   connect.disabled=true;
   const status=document.getElementById('desktop-status');
   const local=`http://127.0.0.1:${desktopPort}`;
   try{
    const user=auth.currentUser;if(!user)throw Error('Sign in with Google first.');
    status.textContent='Connecting to FinAmigo on this computer…';
    const source=await fetch(`${local}/snapshot?state=${encodeURIComponent(desktopState)}`);
    if(!source.ok)throw Error('Desktop connection expired. Tap Sync to phone again.');
    const data=await source.json();
    if(data.expectedUid&&data.expectedUid!==user.uid)throw Error('Use the Google account from your original review sync.');
    const remote={};let next;
    do{const page=await cloudRequest(`reviews?pageSize=100${next?'&pageToken='+encodeURIComponent(next):''}`);for(const doc of page?.documents||[]){const r=JSON.parse(doc.fields.payload.stringValue);remote[r.key]=r;}next=page?.nextPageToken;}while(next);
    for(const [key,review]of Object.entries(data.localReviews||{})){
     const prior=remote[key];
     if(!prior||Date.parse(review.reviewed_at||0)>Date.parse(prior.reviewed_at||0)){await cloudRequest(`reviews/${encodeURIComponent(key)}`,'PATCH',review);remote[key]=review;}
    }
    // Retain reviewed pairs from the previous snapshot; new rules only replace pending candidates.
    const oldManifest=await cloudRequest('snapshots/current');
    if(oldManifest){
     const info=JSON.parse(oldManifest.fields.payload.stringValue);
     for(const name of info.chunks||[]){
      if(!name.includes('-pairs-'))continue;
      const chunk=await cloudRequest(`snapshots/${encodeURIComponent(name)}`);
      if(!chunk)continue;
      const part=JSON.parse(chunk.fields.payload.stringValue);
      for(const row of part.rows||[]){
       const review=remote[`pairs:${row[0]}`];
       if(review&&review.status!=='undone'&&!data.datasets.pairs.some(p=>p[0]===row[0]))data.datasets.pairs.push(row);
      }
     }
    }
    const generation=crypto.randomUUID(),chunks=[];
    for(const [kind,rows]of Object.entries(data.datasets)){
     for(let i=0;i<rows.length;i+=100){status.textContent=`Syncing ${kind}: ${Math.min(i+100,rows.length)} of ${rows.length}…`;const name=`${generation}-${kind}-${i}`;await cloudRequest(`snapshots/${name}`,'PATCH',{kind,rows:rows.slice(i,i+100)});chunks.push(name);}
    }
    await cloudRequest('snapshots/current','PATCH',{generation,chunks,categories:data.categories,updated_at:new Date().toISOString()});
    const done=await fetch(`${local}/complete?state=${encodeURIComponent(desktopState)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:desktopState,uid:user.uid,reviews:Object.values(remote)})});
    if(!done.ok)throw Error('Transactions uploaded; some review decisions need attention in FinAmigo.');
    status.textContent='Synced. You can now open this page on your phone.';
    history.replaceState(null,'','/review/');document.getElementById('desktop-connect').hidden=true;await loadCloud();
   }catch(e){status.textContent=e.message;connect.disabled=false;}
  };
 }
 document.getElementById('signin').onclick=()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e=>{document.getElementById('status').textContent=`Sign-in failed: ${e.code}. Please retry.`;});
 for(const id of ['signout','logout'])document.getElementById(id).onclick=()=>auth.signOut();
 document.getElementById('refresh-cloud').onclick=()=>loadCloud().catch(e=>document.getElementById('status').textContent=e.message);
 auth.onAuthStateChanged(async user=>{window.cloudUser=user;if(desktopMode)document.getElementById('connect-desktop').disabled=!user;document.getElementById('signout').hidden=!user;document.getElementById('logout').hidden=!user;document.getElementById('refresh-cloud').hidden=!user;document.getElementById('signin').hidden=!!user;document.getElementById('signed-account').textContent=user?.email||'';document.getElementById('account').textContent=user?.email||'';if(activeUid&&activeUid!==user?.uid){await window.loadCloudState({transactions:[],pairs:[],splits:[],categories:[],reviews:{},history:[]});cloudKnown={};}activeUid=user?.uid||null;if(user&&desktopMode){document.getElementById('status').textContent='Signed in. Press Sync this computer to continue.';return;}if(user)try{await window.loadCloudState({transactions:[],pairs:[],splits:[],categories:[],reviews:{},history:[],cloudUid:user.uid});await loadCloud();}catch(e){document.getElementById('status').textContent=e.message;}});
});
