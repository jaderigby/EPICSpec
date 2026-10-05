const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/first-run.cjs'), 'utf8');
function fixture(choice, fail = false) {
  const stored = new Map(), writes = [], prompts = [], errors = [];
  const context = {globalState: {get:(k,d)=>stored.get(k) ?? d, update:async(k,v)=>stored.set(k,v)}};
  const vscode = {
    ConfigurationTarget: {Global: 1},
    window: {showInformationMessage:async(...args)=>{prompts.push(args); return choice;},showErrorMessage:message=>errors.push(message)},
    workspace: {getConfiguration:section=>{assert.equal(section,'files');return {update:async(...args)=>{if(fail)throw new Error('Read only');writes.push(args);}};}}
  };
  const load = () => {const sandbox={module:{exports:{}},require:()=>vscode};vm.runInNewContext(source,sandbox);return sandbox.module.exports.offerDefaultLanguage;};
  return {context, writes, prompts, errors, load};
}
test('accept writes user default once; persisted marker prevents prompts and rewrites after restart/update', async()=>{
  const f=fixture('Use EPIC');
  await f.load()(f.context);
  assert.deepEqual(f.writes,[['defaultLanguage','epic',1]]);
  await f.load()(f.context);
  assert.equal(f.prompts.length,1);
  assert.equal(f.writes.length,1);
});
for(const choice of ['Keep Current Default', undefined]) test(`opt out or dismiss (${choice}) leaves settings alone and does not repeat`,async()=>{
  const f=fixture(choice);await f.load()(f.context);await f.load()(f.context);
  assert.equal(f.prompts.length,1);assert.equal(f.writes.length,0);
});
test('failed settings write explains manual recovery without repeating onboarding',async()=>{
  const f=fixture('Use EPIC',true);await f.load()(f.context);await f.load()(f.context);
  assert.equal(f.errors.length,1);assert.equal(f.prompts.length,1);assert.equal(f.writes.length,0);
});
test('onboarding activates without needing an EPIC file open',()=>{
  const pkg=require('../package.json');assert.ok(pkg.activationEvents.includes('onStartupFinished'));
});
