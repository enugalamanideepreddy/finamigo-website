/* Local-only phone metadata. External lookups require a user-opened link. */
(function(root){
 'use strict';
 const lib=typeof module==='object'&&module.exports?require('./vendor/libphonenumber-max.js'):root.libphonenumber;
 function normalize(value,country='IN'){
  try{const p=lib.parsePhoneNumberFromString(String(value||'').trim(),{defaultCountry:country,extract:false});if(!p||!p.isValid())return null;return {number:p.number,country:p.country||null,type:p.getType()||'UNKNOWN',national:p.formatNational(),international:p.formatInternational(),lookupUrl:`https://www.truecaller.com/search/${(p.country||country).toLowerCase()}/${encodeURIComponent(p.nationalNumber)}`};}catch{return null;}
 }
 function fromNarration(text){
  // Only a fully numeric UPI handle: never treat RRN, account or IFSC fields as phone numbers.
  const matches=[...String(text||'').matchAll(/(?:^|[\s/:-])((?:\+?91)?[6-9]\d{9})@[a-z][\w.-]*/gi)];
  const numbers=[...new Set(matches.map(m=>normalize(m[1])?.number).filter(Boolean))];return numbers.length===1?numbers[0]:null;
 }
 function confirmedName(reviews,number){
  const names=[...new Set(Object.values(reviews).filter(r=>r.status!=='undone'&&r.phone_number===number&&r.confirmed_entity).map(r=>r.confirmed_entity.trim()).filter(Boolean))];return names.length===1?names[0]:null;
 }
 const api={normalize,fromNarration,confirmedName};if(typeof module==='object'&&module.exports)module.exports=api;else root.PhoneLookup=api;
})(globalThis);
