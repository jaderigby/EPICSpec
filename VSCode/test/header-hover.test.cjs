const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
test('hover shows only alternative roles, links change only the key, stale and forged links do nothing', async () => {
  const commands = new Map(); let hoverProvider, edits = []; const executed = [];
  const document = {languageId:'epic', version:1, uri:{toString:()=> 'file:///test.epic'}, getText:()=> '---\nAuthor: Jade\n---'};
  const selection = {start:{line:1,character:0},end:{line:1,character:0}};
  const editor = {document, selection, selections:[selection], edit:async callback=>{callback({replace:(range,text)=>edits.push({range,text})});return true;}};
  const vscode = {
    Range: class {constructor(...args){this.args=args;}},
    MarkdownString: class {constructor(value){this.value=value;}},
    Hover: class {constructor(contents,range){this.contents=contents;this.range=range;}},
    CodeActionKind:{QuickFix:'quickfix'},
    commands:{executeCommand:async name=>{executed.push(name);},registerCommand:(name,cb)=>{commands.set(name,cb);return {}; }},
    languages:{registerHoverProvider:(_,p)=>{hoverProvider=p;return {};},registerCodeActionsProvider:()=>({})},
    workspace:{onDidChangeTextDocument:()=>({})},
    window:{activeTextEditor:editor,visibleTextEditors:[editor],onDidChangeTextEditorSelection:()=>({}),onDidChangeActiveTextEditor:()=>({}),setStatusBarMessage:()=>{}}
  };
  const sandbox={module:{exports:{}}, require:name=>name==='vscode'?vscode:require('../src/header-roles.cjs')};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/header-role-ui.cjs'),'utf8'),sandbox);
  sandbox.module.exports.registerHeaderRoles({subscriptions:[]});
  const hover=hoverProvider.provideHover(document,{line:1,character:2});
  assert.match(hover.contents.value,/Change to: \[Artist\]/);
  assert.match(hover.contents.value,/\[Creator\]/);
  assert.doesNotMatch(hover.contents.value,/\[Author\]/);
  assert.deepEqual(Array.from(hover.contents.isTrusted.enabledCommands),['epic.applyHeaderRole']);
  assert.equal(hoverProvider.provideHover(document,{line:1,character:9}),undefined);
  assert.equal(hoverProvider.provideHover(document,{line:2,character:0}),undefined);
  const encoded=hover.contents.value.match(/command:epic.applyHeaderRole\?([^)]*)/)[1];
  const [id, role]=JSON.parse(decodeURIComponent(encoded));
  assert.equal(typeof id, 'string');
  assert.doesNotMatch(decodeURIComponent(encoded), /file:|uri|version/);
  await commands.get('epic.applyHeaderRole')(id, role);
  assert.equal(edits[0].text,'Artist');
  assert.equal(executed.at(-1), 'editor.action.hideHover');
  assert.deepEqual(Array.from(edits[0].range.args),[1,0,1,6]);
  await commands.get('epic.applyHeaderRole')(id, 'Title');
  await commands.get('epic.applyHeaderRole')('missing', role);
  document.version++;
  await commands.get('epic.applyHeaderRole')(id, role);
  assert.equal(edits.length,1);
});
