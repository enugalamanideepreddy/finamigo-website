(function(root){
'use strict';
const types=['C2B','B2C','C2C','Self','Unclassified'];
const normalize=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const entityKey=r=>['','UNKNOWN','TRANSACTION','UNCLASSIFIED','OTHER'].includes(normalize(r[6]))?`ID:${r[0]}`:normalize(r[6]);
const contains=(text,phrase)=>` ${text} `.includes(` ${normalize(phrase)} `);
function classify(row,rules){
 const name=normalize(row[6]),narration=normalize(row[7]);
 if(['ME','SELF','SELF TRANSFER','INTERNAL TRANSFER'].includes(name)||/\bSELF TRANSFER\b/.test(narration))return {type:'Self',source:'explicit self transfer'};
 if(rules.payment_routes.includes(name))return {type:'Unclassified',source:'payment route only'};
 const business=[...rules.businesses,...rules.business_words].some(b=>contains(name,b)||contains(narration,b));
 return {type:business&&Number(row[2])!==0?(Number(row[2])<0?'C2B':'B2C'):'Unclassified',source:business?'business evidence':'insufficient evidence'};
}
function analyze(rows,reviews,rules){
 const confirmed=new Map(),counts=new Map(),labels=new Map();
 const selfIds=new Set(Object.values(reviews).filter(r=>r.status!=='undone'&&r.relationship==='Self Transfer').flatMap(r=>r.member_ids||r.members||[]).map(String));
 for(const r of rows){const k=entityKey(r);counts.set(k,(counts.get(k)||0)+1);const saved=reviews[`transactions:${r[0]}`];if(saved?.status!=='undone'&&types.includes(saved?.counterparty_type)&&saved.counterparty_type!=='Unclassified'){const kind=['C2B','B2C'].includes(saved.counterparty_type)?'business':saved.counterparty_type;if(!confirmed.has(k))confirmed.set(k,new Set());confirmed.get(k).add(kind);}}
 for(const r of rows){const saved=reviews[`transactions:${r[0]}`],kinds=confirmed.get(entityKey(r));let label;
 if(saved?.status!=='undone'&&types.includes(saved?.counterparty_type))label={type:saved.counterparty_type,source:'confirmed'};
 else if(selfIds.has(String(r[0])))label={type:'Self',source:'confirmed self-transfer pair'};
 else if(kinds?.size>1)label={type:'Unclassified',source:'conflicting confirmed labels'};
 else if(kinds?.size===1){const kind=[...kinds][0];label={type:kind==='business'?(Number(r[2])<0?'C2B':Number(r[2])>0?'B2C':'Unclassified'):kind,source:'suggested from confirmed entity'};}
 else label=classify(r,rules);
 labels.set(r[0],label);}
 const rank=r=>({C2B:0,B2C:0,C2C:1,Self:2}[labels.get(r[0]).type]??3);
 const compare=(a,b)=>rank(a)-rank(b)||counts.get(entityKey(b))-counts.get(entityKey(a))||(entityKey(a)<entityKey(b)?-1:entityKey(a)>entityKey(b)?1:0)||Number(new Date(a[1]))-Number(new Date(b[1]))||Number(a[0])-Number(b[0]);
 return {labels,counts,order:items=>[...items].sort(compare)};
}
root.Counterparty={types,normalize,entityKey,classify,analyze};if(typeof module!=='undefined')module.exports=root.Counterparty;
})(typeof window!=='undefined'?window:globalThis);
