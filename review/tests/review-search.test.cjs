const test=require('node:test'),assert=require('node:assert/strict');
const {matches}=require('../review-search.js');
test('search covers narration, ID, account, amount and receipt items with all terms',()=>{
 const row=[1238,'2026-05-13',102148,'credit','IDFC Savings','savings','Vihaan','NEFT/REFERENCE',null,{items:[{name:'Eggs'}]}];
 for(const q of ['vihaan','1238','idfc savings','₹1,02,148','neft reference','eggs'])assert.equal(matches(row,q),true,q);
 assert.equal(matches(row,'vihaan zomato'),false);
 assert.equal(matches(row,''),true);
});
