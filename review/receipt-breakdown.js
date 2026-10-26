(function(root){
'use strict';
function pending(row){return !!row[22];}
function complete(row,review){const b=review?.item_breakdown;return !!b?.confirmed&&b.order_id===row[22]?.order_id&&b.source_message_id===row[22]?.source_message_id;}
function sourceSignature(source){return JSON.stringify([source.order_id,source.source_message_id,source.gap_cents,(source.items||[]).map(i=>[i.name,i.quantity,i.amount_cents,i.kind])]);}
function savedDraft(row,review){const b=review?.item_breakdown;return !!row[22]&&b?.reviewed===true&&b.source_signature===sourceSignature(row[22]);}
function needsReview(row,review){return pending(row)&&!complete(row,review)&&!savedDraft(row,review);}
function inheritAdjustments(items){
 const anchor=items.filter(i=>i.kind==='product'&&i.amount_cents>0).sort((a,b)=>b.amount_cents-a.amount_cents)[0];
 return items.map(i=>i.kind==='rounding'&&anchor?{...i,category:anchor.category,group:anchor.group}:i);
}
function editor(parent,row,prior,categories,groups,defaultGroups){
 const source=row[22];if(!source)return null;
 const chosen=complete(row,prior)||savedDraft(row,prior)?prior.item_breakdown:source;
 const details=document.createElement('details');details.open=true;
 const summary=document.createElement('summary');summary.textContent=`${source.merchant||'Receipt'} breakdown · ${source.items.length} lines · Order ${source.order_id}`;details.append(summary);
 const text=document.createElement('p');text.textContent=source.gap_cents?`Receipt mismatch: ₹${(source.gap_cents/100).toFixed(2)}. Review the source; item labels can be saved as a draft, but this breakdown will not replace the payment in reports.`:'Item amounts reconcile to the payment. Review each category below; the payment will be counted once.';details.append(text);
 for(const adjustment of source.adjustments||[]){const p=document.createElement('p');p.textContent=`${adjustment.name}: ₹${(adjustment.amount_cents/100).toFixed(2)} · reflected in item amounts`;details.append(p);}
 const controls=[];
 for(const originalItem of chosen.items){
  const item={...originalItem};
  if(!complete(row,prior)&&item.kind==='fee'&&/fee|delivery|handling|convenience|booking|service charge/i.test(item.name)&&! /membership/i.test(item.name)){
   item.category='Service Fees & Charges';
   if(!item.group||item.group==='Unclassified'){
    const contexts=[...new Set(chosen.items.filter(i=>i.kind==='product').map(i=>i.group).filter(g=>g&&g!=='Unclassified'))];
    if(contexts.length===1)item.group=contexts[0];
   }
  }
  if(item.kind==='rounding'){
   const note=document.createElement('p');note.className='muted';
   note.textContent=`Rounding adjustment: ₹${(item.amount_cents/100).toFixed(2)} · follows the largest product’s category automatically.`;
   details.append(note);controls.push({item});continue;
  }
  const box=document.createElement('section');box.className='receipt-item';
  const name=document.createElement('p');name.textContent=`${item.name} ×${item.quantity} · ${source.merchant||'Receipt'} · ₹${(item.amount_cents/100).toFixed(2)}`;box.append(name);
  function select(label,options,value){const wrap=document.createElement('label');wrap.className='field';wrap.textContent=label;const el=document.createElement('select');el.setAttribute('aria-label',`${label}: ${item.name}`);for(const v of options){const o=document.createElement('option');o.textContent=o.value=v;el.append(o);}el.value=options.includes(value)?value:options[0];wrap.append(el);box.append(wrap);return el;}
  const category=select('Item category',['Choose category',...new Set(categories)],item.category);
  const group=select('Item spending group',groups,item.group);
  category.onchange=()=>{if(category.value!=='Service Fees & Charges'&&defaultGroups[category.value])group.value=defaultGroups[category.value];};
  controls.push({item,category,group});details.append(box);
 }
 parent.append(details);
 return ()=>{
  const items=inheritAdjustments(controls.map(({item,category,group})=>({...item,...(category?{category:category.value,group:group.value}:{})})));
  const confirmed=source.gap_cents===0&&items.every(i=>!['Choose category','Unclassified'].includes(i.category)&&i.group!=='Unclassified');
  if(source.gap_cents===0&&!confirmed)throw Error('Choose a category and spending group for: '+items.filter(i=>['Choose category','Unclassified'].includes(i.category)||i.group==='Unclassified').map(i=>i.name).join(', '));
  return {...source,items,confirmed,reviewed:true,source_signature:sourceSignature(source)};
 };
}
root.ReceiptBreakdown={needsReview,editor,inheritAdjustments,sourceSignature};
if(typeof module!=='undefined')module.exports=root.ReceiptBreakdown;
})(typeof window!=='undefined'?window:globalThis);
