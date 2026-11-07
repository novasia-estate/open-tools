const {test}=require('node:test'),a=require('node:assert/strict'),T=require('../docs/tools.js');
test('cleaning audit reconciles multiline source records, blanks and duplicates',()=>{
 const r=T.cleanCSVAudit('name,note\nA,"two\nlines"\n,\n A ,"two\nlines"\nB,x\n');
 a.deepEqual(r.audit.records,[{record:1,status:'kept',outputRecord:1},{record:2,status:'blank'},{record:3,status:'duplicate',duplicateOf:1},{record:4,status:'kept',outputRecord:2}]);
 a.equal(r.audit.inputRecords,4);a.equal(r.audit.outputRecords,2);a.equal(r.rows.length+r.blank+r.duplicates,r.audit.inputRecords);
});
test('trim changes equality only when chosen',()=>{
 const text='name\nA\n A \n';a.equal(T.cleanCSVAudit(text).duplicates,1);a.equal(T.cleanCSVAudit(text,{trim:false}).duplicates,0);
});
test('disabled dedupe preserves each output mapping',()=>{
 const r=T.cleanCSVAudit('id\nA\nA',{dedupe:false});a.deepEqual(r.audit.records,[{record:1,status:'kept',outputRecord:1},{record:2,status:'kept',outputRecord:2}]);
});
test('protection positions include header0 and original record numbers, not removed copies',()=>{
 const r=T.cleanCSVAudit('=header,n\n@person,1\n,\n@person,1\nordinary,2');a.deepEqual(r.audit.protectedPositions,[{record:0,column:1},{record:1,column:1}]);a.equal(r.protectedCells,2);a.match(r.csv,/"'@person"/);a.doesNotMatch(JSON.stringify(r.audit),/@person|ordinary|=header/);
});
test('legacy result shape and clean output are preserved',()=>{
 const text='a,b\n1,2\n1,2\n3,4';const legacy=T.cleanCSV(text),rich=T.cleanCSVAudit(text);a.ok(!('audit' in legacy));const {audit,...same}=rich;a.deepEqual(same,legacy);
});
test('audit records bad shapes as errors and handles BOM/tab separator',()=>{
 a.throws(()=>T.cleanCSVAudit('a,b\nx'));const r=T.cleanCSVAudit('\uFEFFa\tb\n1\t2');a.equal(r.audit.delimiter,'\t');a.equal(r.audit.records[0].outputRecord,1);
});
test('long duplicate chain stays linear with first source reference',()=>{
 const r=T.cleanCSVAudit('id\n'+Array(1000).fill('same').join('\n'));a.equal(r.audit.records.length,1000);a.ok(r.audit.records.slice(1).every(x=>x.duplicateOf===1));
});
