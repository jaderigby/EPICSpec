const {test}=require('node:test');
const assert=require('node:assert/strict');
const {freeflowLines}=require('../src/freeflow-backgrounds.cjs');
test('background covers blank lines and closer, stops after closer and extends unclosed block to EOF',()=>{
 assert.deepEqual(freeflowLines('[{&}]\n\nText\n:::\nordinary\n[{&}]\nmore'),{openers:[0,5],body:[1,2,3,6]});
});
test('header content is excluded and consecutive openers get their own band',()=>{
 assert.deepEqual(freeflowLines('---\n[{&}]\n---\n[{&}]\n[{&}]\n:::'),{openers:[3,4],body:[5]});
});
