const test=require('node:test'),assert=require('node:assert/strict');
const {needsReview}=require('../receipt-breakdown.js');
test('receipt arrivals reopen prior reviews; source changes and undo reopen item review',()=>{const row=[];row[22]={order_id:'order',source_message_id:'mail',confirmed:false};assert.equal(needsReview(row,{category:'Food & Dining'}),true);const review={item_breakdown:{order_id:'order',source_message_id:'mail',confirmed:true}};assert.equal(needsReview(row,review),false);row[22].confirmed=true;assert.equal(needsReview(row,undefined),true);row[22].source_message_id='new';assert.equal(needsReview(row,review),true);assert.equal(needsReview([],undefined),false);});

test('rounding inherits product labels without changing paise amounts',()=>{
 const api=require('../receipt-breakdown.js');
 const items=[{id:'food',kind:'product',amount_cents:7600,category:'Groceries',group:'Essentials'},{id:'rounding',kind:'rounding',amount_cents:66,category:'Unclassified',group:'Unclassified'}];
 const output=api.inheritAdjustments(items);
 assert.equal(output[1].category,'Groceries');assert.equal(output[1].group,'Essentials');assert.equal(output[1].amount_cents,66);
 assert.equal(items[1].category,'Unclassified');
});

test('mismatched receipt draft leaves unreviewed queue and reopens on source correction',()=>{
 const {sourceSignature}=require('../receipt-breakdown.js');
 const row=[];row[22]={order_id:'247398163196162',source_message_id:'mail',gap_cents:-7500,items:[{name:'Backpack',quantity:1,amount_cents:159900,kind:'product'},{name:'Handling Fee',amount_cents:1200,kind:'fee'}]};
 const review={item_breakdown:{...row[22],confirmed:false,reviewed:true,source_signature:sourceSignature(row[22])}};
 assert.equal(needsReview(row,review),false);
 assert.equal(review.item_breakdown.confirmed,false);
 row[22].gap_cents=0;
 assert.equal(needsReview(row,review),true);
});
