const test=require('node:test'),assert=require('node:assert/strict'),rules=require('../../../app/assets/counterparty_rules.json');
const {analyze,classify}=require('../counterparty.js');
const row=(id,name,amount=-10,narration=name)=>{const r=[];r[0]=id;r[1]='2024-01-01';r[2]=amount;r[6]=name;r[7]=narration;return r;};
test('business direction and abstention for personal names, cities and payment routes',()=>{
assert.equal(classify(row(1,'Zomato'),rules).type,'C2B');assert.equal(classify(row(2,'Zomato',10),rules).type,'B2C');
for(const name of ['Ravi Kumar','Hyderabad','Nagar','Google Pay','PhonePe','Gpay','Vijay','Unknown'])assert.equal(classify(row(3,name),rules).type,'Unclassified',name);
assert.equal(classify(row(4,'X',10,'UPI SELF TRANSFER'),rules).type,'Self');
});
test('confirmed identity propagates as suggestion; conflict abstains; frequency ordering is stable',()=>{
const rows=[row(1,'Zomato'),row(2,'Ravi Kumar'),row(3,'Zomato',10),row(4,'Ravi Kumar',10),row(5,'Cafe Once'),row(6,'Unknown')];
const reviews={'transactions:2':{counterparty_type:'C2C'}};const a=analyze(rows,reviews,rules);
assert.equal(a.labels.get(4).type,'C2C');assert.equal(a.labels.get(4).source,'suggested from confirmed entity');
assert.deepEqual(a.order(rows).map(r=>r[0]),[1,3,5,2,4,6]);assert.deepEqual(a.order([rows[4],rows[2]]).map(r=>r[0]),[3,5]);
reviews['transactions:4']={counterparty_type:'B2C'};const more=[...rows,row(7,'Ravi Kumar')];assert.equal(analyze(more,reviews,rules).labels.get(7).type,'Unclassified');
assert.equal(analyze(rows,reviews,rules).labels.get(2).type,'C2C');
});
test('shared web rules match app rules',()=>{const fs=require('node:fs'),vm=require('node:vm');const context={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../counterparty-rules.js','utf8'),context);assert.equal(JSON.stringify(context.window.counterpartyRules),JSON.stringify(rules));});
test('confirmed self-transfer membership remains separate from C2C',()=>{const rows=[row(1,'Ravi Kumar')];const reviews={'pairs:1:2':{relationship:'Self Transfer',member_ids:[1,2]}};assert.equal(analyze(rows,reviews,rules).labels.get(1).type,'Self');});
