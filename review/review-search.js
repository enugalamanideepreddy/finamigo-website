(function(root){
'use strict';
function matches(row,query){
 const flatten=v=>v==null?'':typeof v==='object'?Object.values(v).map(flatten).join(' '):String(v);
 const text=flatten(row).toLowerCase();
 // Normalize thousands separators and currency formatting in amount searches.
 const normalized=text.replace(/[,₹]/g,'');
 return String(query).toLowerCase().trim().split(/\s+/).every(term=>text.includes(term)||normalized.includes(term.replace(/[,₹]/g,'')));
}
function sort(rows,order){
 const indexed=rows.map((row,index)=>({row,index}));
 const name=row=>String(row[6]||row[7]||'').trim();
 const amount=row=>Math.abs(Number(row[2])||0);
 const date=row=>{const n=Date.parse(row[1]);return Number.isFinite(n)?n:0;};
 const compare={
  'name-asc':(a,b)=>name(a).localeCompare(name(b),undefined,{sensitivity:'base',numeric:true}),
  'name-desc':(a,b)=>name(b).localeCompare(name(a),undefined,{sensitivity:'base',numeric:true}),
  'amount-desc':(a,b)=>amount(b)-amount(a),
  'amount-asc':(a,b)=>amount(a)-amount(b),
  'date-desc':(a,b)=>date(b)-date(a),
  'date-asc':(a,b)=>date(a)-date(b)
 }[order];
 return compare?indexed.sort((a,b)=>compare(a.row,b.row)||a.index-b.index).map(x=>x.row):rows;
}
root.ReviewSearch={matches,sort};
if(typeof module!=='undefined')module.exports=root.ReviewSearch;
})(typeof window!=='undefined'?window:globalThis);
