'use strict';
const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const { readAuthorship, observeAuthorship, snippetBody } = require('./artist-memory.cjs');
const STORAGE_KEY = 'epic.artistMemory.v1';
function registerSnippets(context) {
  const definitions = JSON.parse(fs.readFileSync(path.join(context.extensionPath, 'snippets/epic.json'), 'utf8'));
  const snippets = Object.entries(definitions).flatMap(([name, definition]) =>
    (Array.isArray(definition.prefix) ? definition.prefix : [definition.prefix]).map(prefix => ({ name, definition, prefix })));
  let memory = context.globalState.get(STORAGE_KEY, { seen: [], recent: [], preferred: null });
  // Serialize persistence so fast saves/reset cannot overwrite newer observations.
  let writeQueue = Promise.resolve();
  function persist() {
    const snapshot = memory;
    writeQueue = writeQueue.then(() => context.globalState.update(STORAGE_KEY, snapshot))
      .catch(error => vscode.window.showWarningMessage(`EPIC authorship memory could not be saved: ${error.message}`));
    return writeQueue;
  }
  function textBefore(document, position) {
    // Document changes can arrive before the corresponding selection update.
    // Skip stale positions rather than clamping them onto unrelated text.
    if (document.isClosed || position.line < 0 || position.line >= document.lineCount) return null;
    const text = document.lineAt(position.line).text;
    if (position.character < 0 || position.character > text.length) return null;
    return text.slice(0, position.character);
  }
  function currentPrefix(editor) {
    if (!editor || editor.document.languageId !== 'epic' || editor.selections.length !== 1 || !editor.selection.isEmpty) return null;
    const position = editor.selection.active;
    const before = textBefore(editor.document, position);
    if (before === null) return null;
    const match = /(?:^|\s)([A-Za-z][\w-]*)$/.exec(before);
    const item = match && snippets.find(s => s.prefix === match[1]);
    return item ? { item, range: new vscode.Range(position.line, position.character - item.prefix.length, position.line, position.character) } : null;
  }
  function refresh() {
    return vscode.commands.executeCommand('setContext', 'epic.snippetPrefix', Boolean(currentPrefix(vscode.window.activeTextEditor)));
  }
  const body = item => new vscode.SnippetString(snippetBody(item.definition, memory.preferred, memory.preferredRole || 'Author'));
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider('epic', {
      provideCompletionItems(document, position) {
        const before = textBefore(document, position);
        if (before === null) return [];
        const word = /[A-Za-z][\w-]*$/.exec(before)?.[0] || '';
        const range = new vscode.Range(position.line, position.character - word.length, position.line, position.character);
        return snippets.map(item => {
          const completion = new vscode.CompletionItem(item.prefix, vscode.CompletionItemKind.Snippet);
          completion.detail = item.name;
          completion.documentation = item.definition.description;
          completion.insertText = body(item);
          completion.range = range;
          return completion;
        });
      }
    }),
    vscode.commands.registerCommand('epic.expandSnippet', async () => {
      const editor = vscode.window.activeTextEditor;
      const match = currentPrefix(editor);
      if (!match) return vscode.commands.executeCommand('tab');
      await editor.insertSnippet(body(match.item), match.range);
      await refresh();
    }),
    vscode.commands.registerCommand('epic.resetArtistMemory', async () => {
      memory = { seen: [], recent: [], preferred: null };
      await persist();
      vscode.window.showInformationMessage('EPIC authorship memory reset. New headers use Author and the snippet’s default value.');
    }),
    vscode.workspace.onDidSaveTextDocument(document => {
      if (document.languageId !== 'epic' || document.isUntitled || document.uri.scheme !== 'file') return;
      const next = observeAuthorship(memory, document.uri.toString(), readAuthorship(document.getText()));
      if (next !== memory) { memory = next; void persist(); }
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document === vscode.window.activeTextEditor?.document) void refresh();
    }),
    vscode.window.onDidChangeTextEditorSelection(() => { void refresh(); }),
    vscode.window.onDidChangeActiveTextEditor(() => { void refresh(); }),
    { dispose: () => { void vscode.commands.executeCommand('setContext', 'epic.snippetPrefix', false); } }
  );
  void refresh();
}
module.exports = { registerSnippets };
