const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
test('authorship uses cursor focus with no hover provider, duplicate roles, or repeated picker', async () => {
  const commands = new Map(); let selectionChanged, picks = 0, finishPick;
  const document = { languageId: 'epic', version: 1, getText: () => '---\nAuthor: Jade\nArtist: Someone\n---' };
  const selection = { start: { line: 1, character: 2 }, end: { line: 1, character: 2 } };
  const editor = { document, selection, selections: [selection] };
  const vscode = {
    TextEditorSelectionChangeKind: { Mouse: 2 },
    CodeActionKind: { QuickFix: 'quickfix' },
    commands: { executeCommand: async name => commands.get(name)?.(), registerCommand: (name, fn) => { commands.set(name, fn); return {}; } },
    languages: { registerHoverProvider: () => assert.fail('Authorship must not register a hover'), registerCodeActionsProvider: () => ({}) },
    workspace: { onDidChangeTextDocument: () => ({}) },
    window: { activeTextEditor: editor,
      onDidChangeTextEditorSelection: fn => { selectionChanged = fn; return {}; }, onDidChangeActiveTextEditor: () => ({}),
      showQuickPick: choices => { picks++; assert.deepEqual(Array.from(choices), ['Creator']); return new Promise(resolve => { finishPick = resolve; }); }
    }
  };
  const sandbox = { module: { exports: {} }, require: name => name === 'vscode' ? vscode : require('../src/header-roles.cjs') };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/header-role-ui.cjs'), 'utf8'), sandbox);
  sandbox.module.exports.registerHeaderRoles({ subscriptions: [] });
  assert.equal(commands.has('epic.applyHeaderRole'), false);
  const event = { kind: 2, textEditor: editor };
  const open = selectionChanged(event);
  assert.equal(picks, 1);
  await selectionChanged(event);
  assert.equal(picks, 1);
  finishPick(undefined);
  await open;
  selection.start.character = selection.end.character = 6; // colon
  await selectionChanged(event);
  assert.equal(picks, 1);
  selection.start.character = selection.end.character = 2;
  editor.selections = [selection, selection];
  await selectionChanged(event);
  assert.equal(picks, 1);
  editor.selections = [selection];
  const keyboardOpen = selectionChanged({ kind: 1, textEditor: editor });
  assert.equal(picks, 2, 'Moving back into the key by keyboard opens the picker');
  finishPick(undefined);
  await keyboardOpen;
  selection.start.character = selection.end.character = 3;
  await selectionChanged({ kind: 1, textEditor: editor });
  assert.equal(picks, 2, 'Moving within the key does not reopen the picker');
  selection.start.character = selection.end.character = 9;
  await selectionChanged(event);
  selection.start.character = selection.end.character = 2;
  document.getText = () => '---\nAuthor: Jade\nArtist: Someone\nCreator: Another\n---';
  await selectionChanged(event);
  assert.equal(picks, 2);
});
