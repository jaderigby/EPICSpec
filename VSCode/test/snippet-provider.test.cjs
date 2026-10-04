const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const memoryHelpers = require('../src/artist-memory.cjs');
test('save events feed memory, completion and Tab expansion; reset restores fallback', async () => {
  const handlers = {}, commands = new Map(), writes = [];
  let provider, inserted;
  const disposable = {};
  const vscode = {
    Range: class { constructor(...args) { this.args = args; } },
    SnippetString: class { constructor(value) { this.value = value; } },
    CompletionItem: class { constructor(label, kind) { this.label = label; this.kind = kind; } },
    CompletionItemKind: { Snippet: 27 },
    commands: { executeCommand: async () => {}, registerCommand: (name, callback) => { commands.set(name, callback); return disposable; } },
    languages: { registerCompletionItemProvider: (language, p) => { assert.equal(language, 'epic'); provider = p; return disposable; } },
    workspace: {
      onDidSaveTextDocument: cb => { handlers.save = cb; return disposable; },
      onDidChangeTextDocument: () => disposable
    },
    window: {
      onDidChangeTextEditorSelection: () => disposable,
      onDidChangeActiveTextEditor: () => disposable,
      showInformationMessage: () => {}, showWarningMessage: error => { throw Error(error); }
    }
  };
  const context = { extensionPath: path.resolve(__dirname, '..'), subscriptions: [], globalState: { get: (_, value) => value, update: async (_, value) => { writes.push(value); } } };
  const sandbox = { module: { exports: {} }, require: name => name === 'vscode' ? vscode : name === './artist-memory.cjs' ? memoryHelpers : require(name) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/snippets.cjs'), 'utf8'), sandbox);
  sandbox.module.exports.registerSnippets(context);
  function save(file, extra = {}) {
    handlers.save({ languageId: 'epic', isUntitled: false, uri: { scheme: 'file', toString: () => file }, getText: () => '---\nArtist: Jade\n---', ...extra });
  }
  const doc = { languageId: 'epic', lineAt: () => ({ text: 'hd' }) };
  const position = { line: 0, character: 2 };
  function header() { return provider.provideCompletionItems(doc, position).find(item => item.label === 'hd').insertText.value; }
  assert.match(header(), /\$\{2:Me\}/);
  save('one'); save('one'); save('two');
  save('not-epic', { languageId: 'plaintext' });
  save('unsaved', { isUntitled: true });
  assert.match(header(), /\$\{2:Me\}/);
  save('three');
  assert.match(header(), /\$\{2:Jade\}/);
  const selection = { isEmpty: true, active: position };
  vscode.window.activeTextEditor = { document: doc, selection, selections: [selection], insertSnippet: async snippet => { inserted = snippet.value; return true; } };
  await commands.get('epic.expandSnippet')();
  assert.match(inserted, /\$\{2:Jade\}/);
  await commands.get('epic.resetArtistMemory')();
  assert.match(header(), /\$\{2:Me\}/);
  assert.equal(writes.at(-1).seen.length, 0);
});
