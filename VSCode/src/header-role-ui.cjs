'use strict';
const vscode = require('vscode');
const { headerRoles, alternatives } = require('./header-roles.cjs');
function registerHeaderRoles(context) {
  let pickerOpen = false;
  let focusedField = null;
  function target(document, selection) {
    if (document.languageId !== 'epic' || selection.start.line !== selection.end.line) return null;
    const fields = headerRoles(document.getText());
    const field = fields.find(f => f.line === selection.start.line && selection.start.character <= f.end && selection.end.character >= f.start);
    return field ? { field, fields } : null;
  }
  const range = field => new vscode.Range(field.line, field.start, field.line, field.end);
  function refresh() {
    const editor = vscode.window.activeTextEditor;
    void vscode.commands.executeCommand('setContext', 'epic.headerRoleSelected', Boolean(editor && editor.selections.length === 1 && target(editor.document, editor.selection)));
  }
  async function focusRole(editor) {
    refresh();
    if (!editor || editor !== vscode.window.activeTextEditor || editor.selections.length !== 1) {
      focusedField = null;
      return;
    }
    const selection = editor.selection;
    const found = target(editor.document, selection);
    const position = selection.active || selection.end;
    if (!found || position.line !== found.field.line ||
        position.character < found.field.start || position.character >= found.field.end) {
      focusedField = null;
      return;
    }
    if (focusedField?.document === editor.document && focusedField.line === found.field.line) return;
    focusedField = { document: editor.document, line: found.field.line };
    if (pickerOpen || !alternatives(found.fields, found.field).length) return;
    await vscode.commands.executeCommand('epic.changeHeaderRole');
  }
  context.subscriptions.push(
    vscode.commands.registerCommand('epic.changeHeaderRole', async () => {
      if (pickerOpen) return;
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selections.length !== 1) return;
      const document = editor.document;
      const found = target(document, editor.selection);
      if (!found) { vscode.window.showInformationMessage('Select Artist, Author, or Creator in the EPIC header first.'); return; }
      const choices = alternatives(found.fields, found.field);
      if (!choices.length) { vscode.window.showInformationMessage('The other authorship roles already exist in this header.'); return; }
      const version = document.version;
      pickerOpen = true;
      try {
      const chosen = await vscode.window.showQuickPick(choices, { title: `Change ${found.field.role} to…`, placeHolder: 'The value after the colon will stay unchanged.' });
      if (!chosen) return;
      if (document.isClosed || document.version !== version || vscode.window.activeTextEditor !== editor) {
        vscode.window.showInformationMessage('The editor changed while the picker was open. Select the header field and try again.'); return;
      }
      await editor.edit(builder => builder.replace(range(found.field), chosen));
      } finally { pickerOpen = false; }
    }),
    vscode.languages.registerCodeActionsProvider('epic', {
      provideCodeActions(document, selection) {
        const found = target(document, selection);
        if (!found) return [];
        return alternatives(found.fields, found.field).map(role => {
          const action = new vscode.CodeAction(`Change ${found.field.role} to ${role}`, vscode.CodeActionKind.QuickFix);
          action.edit = new vscode.WorkspaceEdit();
          action.edit.replace(document.uri, range(found.field), role);
          return action;
        });
      }
    }, { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }),
    vscode.window.onDidChangeTextEditorSelection(event => focusRole(event.textEditor)),
    vscode.window.onDidChangeActiveTextEditor(editor => focusRole(editor)),
    vscode.workspace.onDidChangeTextDocument(event => { if (event.document === vscode.window.activeTextEditor?.document) refresh(); }),
    { dispose: () => { void vscode.commands.executeCommand('setContext', 'epic.headerRoleSelected', false); } }
  );
  refresh();
}
module.exports = { registerHeaderRoles };
