'use strict';
const vscode = require('vscode');
const { offerDefaultLanguage } = require('./first-run.cjs');
const { registerHeaderRoles } = require('./header-role-ui.cjs');
const { registerSnippets } = require('./snippets.cjs');
const { planNormalization } = require('./entry-normalization.cjs');
function isEpicx(document) {
  return document.languageId === 'epic' && /\.epicx(?:\.txt)?$/i.test(document.uri.path);
}
function activate(context) {
  void offerDefaultLanguage(context).catch(error => console.error('EPIC first-run setup failed:', error));
  registerSnippets(context);
  registerHeaderRoles(context);
  const snapshots = new Map();
  const applying = new Set();
  const remember = document => {
    if (isEpicx(document)) snapshots.set(document.uri.toString(), document.getText());
  };
  vscode.workspace.textDocuments.forEach(remember);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(remember),
    vscode.workspace.onDidCloseTextDocument(document => snapshots.delete(document.uri.toString())),
    vscode.workspace.onDidChangeTextDocument(async event => {
      const document = event.document, key = document.uri.toString();
      if (!isEpicx(document)) { snapshots.delete(key); return; }
      const before = snapshots.get(key), after = document.getText();
      snapshots.set(key, after);
      if (before === undefined || applying.has(key) || event.reason || !event.contentChanges.length) return;
      if (!vscode.workspace.getConfiguration('epic', document).get('autoNormalizePastedEntries', true)) return;
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document !== document) return;
      const version = document.version;
      const edits = planNormalization(before, after, event.contentChanges);
      if (!edits.length || document.version !== version) return;
      applying.add(key);
      try {
        // Avoid adding a leading undo stop; VS Code may still separate a paste
        // from this asynchronous repair. Undo/redo events are ignored.
        const applied = await editor.edit(builder => {
          for (const edit of edits) builder.replace(new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)), edit.text);
        }, { undoStopBefore: false, undoStopAfter: true });
        if (!applied) vscode.window.setStatusBarMessage('EPIC: insertion changed before repair could apply; automatic repair skipped.', 5000);
      } catch (error) {
        vscode.window.showWarningMessage(`EPIC entry repair could not apply: ${error.message}`);
      } finally { applying.delete(key); }
    })
  );
}
module.exports = { activate };
