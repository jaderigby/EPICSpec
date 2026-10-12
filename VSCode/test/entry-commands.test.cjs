const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planEntry } = require('../src/entry-commands.cjs');
const entry = (n,time,text='Keep these words',section='[Verse {{open}}]') => `${n}\n${time}\n${section}\n${text}`;
const apply = (source,plan) => [...plan.edits].sort((a,b)=>b.start-a.start).reduce((text,e)=>text.slice(0,e.start)+e.text+text.slice(e.end),source);
test('split moves only highlighted payload; start preserves it; both inherit section and renumber',()=>{
 const source=entry(1,'00:59.100')+'\n\n'+entry(2,'01:01.100','Next','[Chorus]');
 const from=source.indexOf('these');
 for(const marker of [false,true]) {
  const plan=planEntry(source,from,from+5,marker);
  const expected=entry(1,'00:59.100',marker?'Keep these words':'Keep  words')+'\n\n'+entry(2,'01:01.100',marker?'{{start}}':'these')+'\n\n'+entry(3,'01:01.100','Next','[Chorus]');
  assert.equal(apply(source,plan),expected);
  assert.equal(expected.slice(0,plan.cursor).endsWith(marker?'{{start}}':'these'),true);
 }
});
test('start works without selection, repeats and preserves milliseconds across hour rollover',()=>{
 for(const [time,next] of [['00:01.000','00:03.000'],['59:59.250','01:00:01.250'],['00:59:59.100','01:00:01.100']]) {
  const source=entry(1,time), plan=planEntry(source,source.length,source.length,true);
  const result=apply(source,plan);
  assert.equal(result,source+'\n\n'+entry(2,next,'{{start}}'));
  const repeated=planEntry(result,plan.cursor,plan.cursor,true);
  assert.ok(apply(result,repeated).includes('\n\n3\n'));
 }
});
test('CRLF and metadata are preserved; range starts produce a point timestamp',()=>{
 const source=('---\nTitle: Song\n---\n\n'+entry(1,'00:01.100 --> 00:04.100')).replaceAll('\n','\r\n');
 const plan=planEntry(source,source.length,source.length,true);
 assert.equal(apply(source,plan),source+'\r\n\r\n'+entry(2,'00:03.100','{{start}}').replaceAll('\n','\r\n'));
});
test('invalid and cross-entry selections, headers, untimed and freeflow content are ignored',()=>{
 assert.equal(planEntry('[Verse]\nWords',8,13,true),null);
 const source=entry(1,'00:01.000')+'\n\n'+entry(2,'00:04.000');
 assert.equal(planEntry(source,0,1),null);
 assert.equal(planEntry(source,source.indexOf('Keep'),source.length),null);
 assert.equal(planEntry(source,source.length,source.length),null);
 const free='[{&}Notes]\n\n'+entry(1,'00:01.000')+'\n:::\n';
 assert.equal(planEntry(free,free.indexOf('Keep'),free.indexOf('Keep'),true),null);
});
test('cursor on the next number belongs to that entry; selected multiline payload is not split',()=>{
 const source=entry(1,'00:01.000')+'\n\n'+entry(2,'00:10.000','Second\nLine','[Chorus]');
 const at=source.indexOf('2\n');
 assert.ok(apply(source,planEntry(source,at,at,true)).endsWith(entry(3,'00:12.000','{{start}}','[Chorus]')));
 assert.equal(planEntry(source,source.indexOf('Second'),source.length),null);
});
test('commands use one undoable edit, suppress automatic repair, place caret and release suppression on failure',async()=>{
 const fs=require('node:fs'), vm=require('node:vm');
 const commands=new Map(), applying=new Set();
 let source=entry(1,'00:01.000'), options, fail=false;
 const document={languageId:'epic',uri:{toString:()=> 'file:///song.epicx'},getText:()=>source,offsetAt:p=>p,positionAt:p=>p};
 const editor={document,selections:[{}],selection:{start:source.length,end:source.length},revealRange:()=>{},edit:async(callback,opts)=>{
  assert.equal(applying.has(document.uri.toString()),true);
  if(fail) throw new Error('test edit failure');
  options=opts; const edits=[]; callback({replace:(range,text)=>edits.push({start:range.start,end:range.end,text})});
  source=apply(source,{edits}); return true;
 }};
 const vscode={window:{activeTextEditor:editor},commands:{registerCommand:(name,cb)=>{commands.set(name,cb);return {};}},Range:class{constructor(start,end){this.start=start;this.end=end;}},Selection:class{constructor(start,end){this.start=start;this.end=end;}}};
 const sandbox={module:{exports:{}},require:name=>name==='vscode'?vscode:require('../src/entry-normalization.cjs')};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/entry-commands.cjs'),'utf8'),sandbox);
 sandbox.module.exports.registerEntryCommands({subscriptions:[]},applying);
 await commands.get('epic.addStartEntry')();
 assert.ok(source.endsWith('{{start}}'));
 assert.equal(editor.selection.start,source.length);
 assert.equal(options.undoStopBefore,true); assert.equal(options.undoStopAfter,true);
 assert.equal(applying.size,0);
 editor.selections=[{},{}]; const before=source; await commands.get('epic.addStartEntry')(); assert.equal(source,before);
 editor.selections=[{}]; fail=true;
 await assert.rejects(commands.get('epic.addStartEntry')(),/test edit failure/); assert.equal(applying.size,0);
});
test('both shortcuts and palette commands are scoped to writable EPIC editors',()=>{
 const manifest=require('../package.json');
 for(const [id,key] of [['epic.splitEntry','a'],['epic.addStartEntry','d']]) {
  const binding=manifest.contributes.keybindings.find(b=>b.command===id);
  assert.equal(binding.mac,`cmd+shift+${key}`); assert.equal(binding.key,`ctrl+shift+${key}`);
  assert.match(binding.when,/editorTextFocus.*editorLangId == epic.*!editorReadonly/);
  assert.ok(manifest.contributes.commands.some(c=>c.command===id));
 }
});

test('start shortcut remains active during autocomplete and snippets, only in writable EPIC editors',()=>{
 const binding=require('../package.json').contributes.keybindings.find(b=>b.command==='epic.addStartEntry');
 assert.equal(binding.when,'editorTextFocus && editorLangId == epic && !editorReadonly');
});
