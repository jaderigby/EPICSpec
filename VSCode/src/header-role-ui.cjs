'use strict';
const vscode = require('vscode');
const { headerRoles, alternatives } = require('./header-roles.cjs');
function registerHeaderRoles(context) {
  let pickerOpen = false;
  const hoverTargets = new Map();
  let nextHoverId = 0;
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
    vscode.commands.registerCommand('epic.applyHeaderRole', async (id, role) => {
      const args = typeof id === 'string' ? hoverTargets.get(id) : undefined;
      if (!args || typeof role !== 'string') return;
      const editor = vscode.window.visibleTextEditors.find(item => item.document === args.document);
      if (!editor || editor.document.isClosed) return;
      const document = editor.document;
      if (document.version !== args.version) {
        vscode.window.setStatusBarMessage('EPIC: header changed. Hover over the field again.', 4000); return;
      }
      const fields = headerRoles(document.getText());
      const field = fields.find(item => item.line === args.line && item.start === args.start && item.role === args.from);
      if (!field || !alternatives(fields, field).includes(role)) return;
      const applied = await editor.edit(builder => builder.replace(range(field), role));
      if (applied) {
        hoverTargets.delete(id);
        await vscode.commands.executeCommand('editor.action.hideHover');
      }
      if (!applied) vscode.window.showWarningMessage('EPIC: could not change the header. Hover over the field and try again.');
    }),
    vscode.languages.registerHoverProvider('epic', {
      provideHover(document, position) {
        if (document.languageId !== 'epic') return;
        const fields = headerRoles(document.getText());
        const field = fields.find(item => item.line === position.line && position.character >= item.start && position.character < item.end);
        if (!field) return;
        const choices = alternatives(fields, field);
        if (!choices.length) return;
        // Keep document identity out of command URIs: VS Code rewrites URI-valued
        // arguments while rendering Markdown. Only an opaque ID crosses that boundary.
        const id = String(++nextHoverId);
        hoverTargets.set(id, { document, version: document.version, line: field.line, start: field.start, from: field.role });
        if (hoverTargets.size > 100) hoverTargets.delete(hoverTargets.keys().next().value);
        const links = choices.map(role =>
          `[${role}](command:epic.applyHeaderRole?${encodeURIComponent(JSON.stringify([id, role]))})`
        );
        const content = new vscode.MarkdownString(`Change to: ${links.join(' · ')}`);
        // Only our validated role-change command can execute from this hover.
        content.isTrusted = { enabledCommands: ['epic.applyHeaderRole'] };
        content.supportHtml = false;
        return new vscode.Hover(content, range(field));
      }
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
    vscode.window.onDidChangeTextEditorSelection(refresh),
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.workspace.onDidChangeTextDocument(event => { if (event.document === vscode.window.activeTextEditor?.document) refresh(); }),
    { dispose: () => { void vscode.commands.executeCommand('setContext', 'epic.headerRoleSelected', false); } }
  );
  refresh();
}
module.exports = { registerHeaderRoles };
