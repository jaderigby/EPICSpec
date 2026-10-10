'use strict';
function insideLabel(text, start, end) {
  const match = /^(\s*\[\s*\{&\})([^\]\r\n]*)(\])\s*$/.exec(text);
  return Boolean(match && start >= match[1].length && end <= match[1].length + match[2].length);
}
function registerFreeflowLabel(context) {
  const vscode = require('vscode');
  function refresh() {
    const editor = vscode.window.activeTextEditor;
    let active = false;
    if (editor && editor.document.languageId === 'epic' && !editor.document.isClosed && editor.selections.length === 1) {
      const {start, end} = editor.selection;
      if (start.line === end.line && start.line >= 0 && start.line < editor.document.lineCount) {
        active = insideLabel(editor.document.lineAt(start.line).text, start.character, end.character);
      }
    }
    void vscode.commands.executeCommand('setContext', 'epic.freeflowLabel', active);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(refresh),
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.workspace.onDidChangeTextDocument(event => {if (event.document === vscode.window.activeTextEditor?.document) refresh();}),
    {dispose:()=>{void vscode.commands.executeCommand('setContext','epic.freeflowLabel',false);}}
  );
  refresh();
}
module.exports = {insideLabel, registerFreeflowLabel};
