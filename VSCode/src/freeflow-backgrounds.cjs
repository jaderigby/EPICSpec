'use strict';
function freeflowLines(text) {
  const body = [], openers = [];
  let active = false, header = false;
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (index === 0 && trimmed === '---') { header = true; return; }
    if (header) { if (trimmed === '---') header = false; return; }
    if (/^\s*\[\s*\{&\}.*\]\s*$/.test(line)) {
      active = true; openers.push(index);
    } else if (active) body.push(index);
    if (active && trimmed === ':::') active = false;
  });
  return { body, openers };
}
function registerFreeflowBackgrounds(context) {
  const vscode = require('vscode');
  // Translucent overlays preserve selections underneath; over #050505 these
  // composite to Writer's #1d1622 body and #31213c opener backgrounds.
  const body = vscode.window.createTextEditorDecorationType({isWholeLine:true, backgroundColor:'rgba(125, 90, 150, 0.2)'});
  const opener = vscode.window.createTextEditorDecorationType({isWholeLine:true, backgroundColor:'rgba(181, 117, 225, 0.25)'});
  function refresh() {
    const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    const enabled = ['EPIC Blackberries', 'Blackberries'].includes(theme);
    for (const editor of vscode.window.visibleTextEditors) {
      const lines = enabled && editor.document.languageId === 'epic' && !editor.document.isClosed
        ? freeflowLines(editor.document.getText()) : {body:[],openers:[]};
      const ranges = list => list.map(line => new vscode.Range(line, 0, line, 0));
      editor.setDecorations(body, ranges(lines.body));
      editor.setDecorations(opener, ranges(lines.openers));
    }
  }
  context.subscriptions.push(body, opener,
    vscode.window.onDidChangeVisibleTextEditors(refresh),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (vscode.window.visibleTextEditors.some(e => e.document === event.document)) refresh();
    }),
    vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('workbench.colorTheme')) refresh(); })
  );
  refresh();
}
module.exports = { freeflowLines, registerFreeflowBackgrounds };
