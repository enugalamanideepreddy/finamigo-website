(function(root){
'use strict';
function decision(prediction,actualCategory,predictedCategory){
 if(!actualCategory||actualCategory==='Choose actual category')throw Error('Choose a category before saving.');
 return {actual_category:actualCategory,predicted_category:predictedCategory,
  original_prediction:{category_id:prediction.suggested_category_id,score_margin:prediction.score_margin??null},
  prediction_correct:actualCategory===predictedCategory,
  review_action:actualCategory===predictedCategory?'confirmed':'corrected'};
}
root.ModelTestDecision={decision};
if(typeof module!=='undefined')module.exports=root.ModelTestDecision;
})(typeof window!=='undefined'?window:globalThis);
