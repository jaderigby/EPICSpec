const {test}=require('node:test');
const assert=require('node:assert/strict');
const {insideLabel}=require('../src/freeflow-label.cjs');
test('Enter shortcut targets only the label, including an empty label',()=>{
 assert.equal(insideLabel('[{&}]',4,4),true);
 assert.equal(insideLabel('[{&}Notes]',4,9),true);
 assert.equal(insideLabel('[{&}Notes]',9,9),true);
 for (const [line,start,end] of [['[{&}]',5,5],['[Verse]',1,1],['text [{&}]',9,9],['[{&}Notes]',0,9],['[{&}Notes',4,4]]) assert.equal(insideLabel(line,start,end),false);
});
test('freeflow snippet has label first and next-line exit; Enter binding requires active snippet',()=>{
 const snippet=require('../snippets/epic.json')['Freeflow section'];
 assert.deepEqual(snippet.body,['[{&}${1}]','$0']);
 const binding=require('../package.json').contributes.keybindings.find(b=>b.key==='enter');
 assert.equal(binding.command,'jumpToNextSnippetPlaceholder');
 assert.match(binding.when,/inSnippetMode && hasNextTabstop && epic.freeflowLabel/);
});
