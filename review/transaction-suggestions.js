(function(root){
'use strict';
const normalize=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
function intent(row){
 const s=String(row[7]||'');
 if(/cashback|cash back|reward/i.test(s))return 'cashback';
 if(/platform fee|handling fee|delivery fee|convenience fee|booking fee|service charge/i.test(s))return 'fee';
 if(/\b(reversal|reversed|void|rev)\b/i.test(s))return 'reversal';
 if(Number(row[2])>0&&/refund/i.test(s))return 'refund';
 return Number(row[2])>0?'credit':'purchase';
}
function suggest(row,rows,reviews,pairs=[]){
 const entity=normalize(row[6]);if(!entity||['unknown','transaction','unclassified','other'].includes(entity))return null;
 const purpose=intent(row);
 if(purpose==='cashback')return {category:'Cashback & Rewards',group:'Income',count:0,reason:'Cashback credit or reversal identified in narration'};
 const examples=rows.filter(r=>r[0]!==row[0]&&normalize(r[6])===entity).map(r=>({row:r,review:reviews[`transactions:${r[0]}`]})).filter(e=>e.review&&e.review.status!=='undone');
 const purchaseGroups=[...new Set(examples.filter(e=>intent(e.row)==='purchase').map(e=>e.review.group).filter(g=>g&& !['Unclassified','Income','Money movement','Debt Repayment'].includes(g)))];
 const purchaseGroup=purchaseGroups.length===1?purchaseGroups[0]:undefined;
 for(const p of pairs){
  const review=reviews[`pairs:${p[0]}`];
  if(Number(p[8])===Number(row[0])&&review?.status!=='undone'&&['Refund','Reversal'].includes(review?.relationship)){
   const original=rows.find(r=>Number(r[0])===Number(p[1]));
   const group=original&&(reviews[`transactions:${original[0]}`]?.group||original[8]);
   return {category:review.relationship==='Reversal'?'Reversals':'Refunds & Reimbursements',group:group||purchaseGroup||'Money movement',count:0,reason:'Confirmed relationship; group follows original purchase'};
  }
 }
 if(purpose==='credit'&&purchaseGroup&&/flipkart|myntra|amazon|swiggy|instamart|zomato/i.test(entity))return {category:'Refunds & Reimbursements',group:purchaseGroup,count:0,reason:'Possible merchant refund; confirm against the original purchase'};
 if(purpose==='reversal')return {category:'Reversals',group:purchaseGroup||'Money movement',count:0,reason:'Reversal narration; verify the original transaction'};
 if(purpose==='refund')return {category:'Refunds & Reimbursements',group:purchaseGroup||'Unclassified',count:0,reason:'Refund narration; check the original purchase group'};
 if(purpose==='fee')return {category:'Service Fees & Charges',group:purchaseGroup||'Unclassified',count:0,reason:'Service fee narration; check the purchase group'};
 const same=examples.filter(e=>intent(e.row)===purpose);
 const categories=[...new Set(same.map(e=>e.review.category).filter(Boolean))];
 const groups=[...new Set(same.map(e=>e.review.group).filter(Boolean))];
 if(categories.length===1&&groups.length===1)return {category:categories[0],group:groups[0],count:same.length,reason:'Suggested from confirmed transactions with the same purpose'};
 if(purpose==='purchase'&&purchaseGroup)return {group:purchaseGroup,count:examples.length,reason:'Entity spending group is consistent; category needs review'};
 return null;
}
root.TransactionSuggestions={intent,suggest};
if(typeof module!=='undefined')module.exports=root.TransactionSuggestions;
})(typeof window!=='undefined'?window:globalThis);
