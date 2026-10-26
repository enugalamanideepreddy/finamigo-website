const test=require('node:test'),assert=require('node:assert/strict');
const {decision}=require('../model-test-decision.js');
test('save unchanged confirms original prediction',()=>{
 const prediction=Object.freeze({suggested_category_id:'groceries',score_margin:.7});
 const result=decision(prediction,'Groceries','Groceries');
 assert.equal(result.prediction_correct,true);assert.equal(result.review_action,'confirmed');
 assert.equal(result.original_prediction.category_id,'groceries');
});
test('correction preserves original and records actual separately',()=>{
 const prediction=Object.freeze({suggested_category_id:'groceries'});
 const result=decision(prediction,'Food & Dining','Groceries');
 assert.equal(result.prediction_correct,false);assert.equal(result.actual_category,'Food & Dining');
 assert.equal(result.predicted_category,'Groceries');assert.equal(result.original_prediction.category_id,'groceries');
});
test('empty selection cannot produce a confirmed result',()=>{
 assert.throws(()=>decision({suggested_category_id:'x'},'','Other Expense'));
});
