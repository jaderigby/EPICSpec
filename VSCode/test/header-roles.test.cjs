const { test } = require('node:test');
const assert = require('node:assert/strict');
const { headerRoles, alternatives } = require('../src/header-roles.cjs');
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
test('offers other roles for all three field names', () => {
  for (const role of ['Artist','Author','Creator']) {
    const fields = headerRoles(`---\nTitle: Example\n${role}: Jade\n---`);
    assert.equal(fields[0].role, role);
    assert.deepEqual(alternatives(fields, fields[0]), ['Artist','Author','Creator'].filter(r => r !== role));
  }
});
test('only keys in a complete header qualify; excludes Generation and body', () => {
  for (const text of ['Artist: Jade','---\nArtist: Jade','---\nTitle: Artist\n---\nArtist: Body','---\n[Generation]\nArtist: Wrong\n---']) assert.deepEqual(headerRoles(text), []);
  const text = '\uFEFF\r\n---\r\n  Author : Jade\r\n---\r\nCreator: Body';
  assert.deepEqual(headerRoles(text), [{ line: 2, start: 2, end: 8, role: 'Author' }]);
});
test('does not offer existing keys', () => {
  const fields = headerRoles('---\nArtist: One\nAuthor: Two\n---');
  assert.deepEqual(alternatives(fields, fields[0]), ['Creator']);
});
test('popup changes only key; quick fixes match, cancellation and stale editors are safe', async () => {
  const commands = new Map(); let selectionChanged, provider, choice = 'Author', edits = [], duringPick;
  const document = { languageId: 'epic', version: 1, isClosed: false, uri: 'test', getText: () => '---\n  Artist: Jade\n---' };
  const selection = { start: {line: 1, character: 2}, end: {line: 1, character: 8} };
  const editor = { document, selection, selections: [selection], edit: async cb => { cb({replace: (range, text) => edits.push({range, text})}); return true; } };
  const vscode = {
    TextEditorSelectionChangeKind: { Mouse: 2, Keyboard: 1, Command: 3 },
    Range: class { constructor(...args) { this.args = args; } },
    CodeAction: class { constructor(title, kind) { this.title = title; this.kind = kind; } },
    CodeActionKind: { QuickFix: 'quickfix' },
    WorkspaceEdit: class { replace(uri, range, text) { this.replacement = {uri, range, text}; } },
    commands: { executeCommand: async (name) => commands.get(name)?.(), registerCommand: (name, cb) => {commands.set(name, cb); return {};} },
    languages: { registerHoverProvider: () => ({}), registerCodeActionsProvider: (_, p) => { provider = p; return {}; } },
    workspace: { onDidChangeTextDocument: () => ({}) },
    window: { activeTextEditor: editor, onDidChangeTextEditorSelection: cb => { selectionChanged = cb; return {}; }, onDidChangeActiveTextEditor: () => ({}), showInformationMessage: () => {}, showQuickPick: async choices => { assert.deepEqual(Array.from(choices), ['Author', 'Creator']); duringPick?.(); return choice; } }
  };
  const sandbox = {module: {exports: {}}, require: name => name === 'vscode' ? vscode : require('../src/header-roles.cjs')};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/header-role-ui.cjs'), 'utf8'), sandbox);
  sandbox.module.exports.registerHeaderRoles({subscriptions: []});
  await commands.get('epic.changeHeaderRole')();
  assert.equal(edits.length, 1); assert.equal(edits[0].text, 'Author');
  assert.deepEqual(Array.from(edits[0].range.args), [1,2,1,8]);
  // Clicking or selecting the label no longer invokes a popup.
  await selectionChanged({ kind: 2, textEditor: editor });
  assert.equal(edits.length, 1);
  await selectionChanged({ kind: 1, textEditor: editor });
  await selectionChanged({ kind: 3, textEditor: editor });
  assert.equal(edits.length, 1);
  const selectedKey = editor.selection;
  editor.selection = { start: {line:1,character:11}, end: {line:1,character:11} };
  await selectionChanged({kind:2,textEditor:editor});
  assert.equal(edits.length, 1);
  editor.selection = selectedKey;
  const actions = provider.provideCodeActions(document, selection);
  assert.equal(actions.length, 2); assert.equal(actions[1].edit.replacement.text, 'Creator');
  assert.equal(provider.provideCodeActions(document, {start:{line:1,character:10},end:{line:1,character:14}}).length, 0);
  choice = undefined; await commands.get('epic.changeHeaderRole')(); assert.equal(edits.length, 1);
  choice = 'Creator'; duringPick = () => document.version++;
  await commands.get('epic.changeHeaderRole')(); assert.equal(edits.length, 1);
});
