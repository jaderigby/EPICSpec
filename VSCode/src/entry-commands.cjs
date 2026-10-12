'use strict';
const { entries, timestamp } = require('./entry-normalization.cjs');

// All offsets refer to the original document; one edit is one undo step.
function planEntry(source, from, to, startMarker = false) {
  if (from < 0 || to < from || to > source.length || (!startMarker && from === to)) return null;
  const all = entries(source);
  const lineStart = entry => source.lastIndexOf('\n', entry.indexStart - 1) + 1;
  const owner = all.findIndex((entry, i) => {
    const end = i + 1 < all.length ? lineStart(all[i + 1]) : source.length;
    return from >= lineStart(entry) && to <= end && (from < end || end === source.length);
  });
  if (owner < 0) return null;
  const entry = all[owner];
  const start = lineStart(entry);
  const end = owner + 1 < all.length ? lineStart(all[owner + 1]) : source.length;
  const prefix = /^([^\r\n]*\r?\n[^\r\n]*\r?\n)([ \t]*\[[^\r\n]*\][ \t]*)(\r?\n|$)/.exec(source.slice(start, end));
  if (!prefix) return null;
  const payloadStart = start + prefix[0].length;
  const payloadEnd = payloadStart + source.slice(payloadStart, end).replace(/(?:\r?\n)+$/, '').length;
  if (!startMarker && (from < payloadStart || to > payloadEnd || /[\r\n]/.test(source.slice(from, to)))) return null;
  // Do not create entries from freeflow or multiline instruction contents.
  const atCursor = source.slice(payloadStart, from);
  if (atCursor.lastIndexOf('{{') > atCursor.lastIndexOf('}}') || /(?:^|\n)\s*\[\s*\{&\}/.test(atCursor)) return null;
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const payload = startMarker ? source.slice(payloadStart, payloadEnd)
    : source.slice(payloadStart, from) + source.slice(to, payloadEnd);
  const content = startMarker ? '{{start}}' : source.slice(from, to);
  const beforeNew = source.slice(start, payloadStart).replace(/(?:\r?\n)?$/, newline) + payload + newline + newline;
  const inserted = `${Number(entry.index) + 1}${newline}${timestamp(entry.startMs + 2000, entry.start)}${newline}${prefix[2]}${newline}${content}`;
  const edits = [{ start, end, text: beforeNew + inserted + (end < source.length ? newline + newline : '') }];
  for (const next of all.slice(owner + 1)) {
    edits.push({ start: next.indexStart, end: next.indexStart + next.index.length, text: String(Number(next.index) + 1) });
  }
  return { edits, cursor: start + beforeNew.length + inserted.length };
}

function registerEntryCommands(context, applying) {
  const vscode = require('vscode');
  for (const [name, startMarker] of [['epic.splitEntry', false], ['epic.addStartEntry', true]]) {
    context.subscriptions.push(vscode.commands.registerCommand(name, async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'epic' || editor.selections.length !== 1) return;
      const document = editor.document, key = document.uri.toString();
      if (applying.has(key)) return;
      const plan = planEntry(document.getText(), document.offsetAt(editor.selection.start), document.offsetAt(editor.selection.end), startMarker);
      if (!plan) return;
      applying.add(key);
      try {
        const applied = await editor.edit(builder => {
          for (const edit of plan.edits) builder.replace(new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)), edit.text);
        }, { undoStopBefore: true, undoStopAfter: true });
        if (applied && vscode.window.activeTextEditor === editor) {
          const position = document.positionAt(plan.cursor);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(new vscode.Range(position, position));
        }
      } finally { applying.delete(key); }
    }));
  }
}
module.exports = { planEntry, registerEntryCommands };
