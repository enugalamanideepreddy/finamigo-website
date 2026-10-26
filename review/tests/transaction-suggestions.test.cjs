const test=require('node:test'),assert=require('node:assert/strict');
const {suggest}=require('../transaction-suggestions.js');
const row=(id,amount,narration)=>{const r=[];r[0]=id;r[2]=amount;r[6]='Flipkart';r[7]=narration;r[8]='Lifestyle';return r;};
test('cashback reversals never inherit shopping labels',()=>{
 const r=row(1,-94,'CASHBACK DEBIT MAR26 FLIPKART');
 assert.equal(suggest(r,[r],{}).category,'Cashback & Rewards');assert.equal(suggest(r,[r],{}).group,'Income');
});
test('refund follows original group and does not contaminate purchase category',()=>{
 const purchase=row(1,-500,'FLIPKART'),refund=row(2,200,'FLIPKART REFUND'),next=row(3,-600,'FLIPKART');
 const reviews={'transactions:1':{category:'Clothing & Accessories',group:'Lifestyle'},'transactions:2':{category:'Refunds & Reimbursements',group:'Lifestyle'}};
 assert.equal(suggest(refund,[purchase,refund,next],reviews).category,'Refunds & Reimbursements');
 assert.equal(suggest(refund,[purchase,refund,next],reviews).group,'Lifestyle');
 assert.equal(suggest(next,[purchase,refund,next],reviews).category,'Clothing & Accessories');
});
test('ambiguous mixed purchases share only a consistent group',()=>{
 const a=row(1,-100,'FLIPKART'),b=row(2,-200,'FLIPKART'),c=row(3,-300,'FLIPKART');
 const s=suggest(c,[a,b,c],{'transactions:1':{category:'Electronics',group:'Lifestyle'},'transactions:2':{category:'Clothing & Accessories',group:'Lifestyle'}});
 assert.equal(s.category,undefined);assert.equal(s.group,'Lifestyle');
});
test('reversals default to money movement; cashback takes precedence',()=>{
 const r=row(1,50,'UPI/REV/123');
 assert.equal(suggest(r,[r],{}).category,'Reversals');
 assert.equal(suggest(r,[r],{}).group,'Money movement');
 const c=row(2,-50,'CASHBACK REVERSAL');
 assert.equal(suggest(c,[c],{}).category,'Cashback & Rewards');
});
