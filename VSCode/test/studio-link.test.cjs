'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { timingEdits, registerStudioLink } = require('../src/studio-link.cjs');
const text = '1\r\n00:01.000\r\n[V]\r\nDraft lyrics\r\n';
const snapshot = { context: { lyricsPath: '/song.epicx', contextRevision: 1 }, entries: [{ index: 1, timingLine: '00:02.000 --> 00:03.000' }] };
test('only timing is replaced, preserving draft and CRLF', () => {
  const [edit] = timingEdits(text, snapshot);
  assert.equal(text.slice(0, edit.start) + edit.text + text.slice(edit.end), text.replace('00:01.000', snapshot.entries[0].timingLine));
  assert.deepEqual(timingEdits(text, { entries: [{ index: 1, timingLine: '00:01.000' }] }), []);
});
test('reject mismatched counts, indexes, invalid timestamps and backwards ranges', () => {
  for (const entries of [[], [{ index: 2, timingLine: '00:02.000' }], [{ index: 1, timingLine: '00:99.000' }], [{ index: 1, timingLine: '00:03.000 --> 00:02.000' }]]) assert.throws(() => timingEdits(text, { entries }));
});
function setup(enabled = false) {
  const handlers = {}, calls = [];
  const doc = { uri: { fsPath: '/song.epicx', scheme: 'file', toString: () => 'file:///song.epicx' }, version: 1, isDirty: false, getText: () => text, positionAt: n => n, save: async () => { calls.push('save'); handlers.save(doc); return true; } };
  const bar = { show() { this.visible = true; }, hide() { this.visible = false; }, dispose() {} };
  const event = name => callback => { handlers[name] = callback; return { dispose() {} }; };
  const vscode = {
    StatusBarAlignment: { Right: 1 }, Range: class { constructor(start, end) { this.start = start; this.end = end; } },
    WorkspaceEdit: class { replace() {} },
    commands: { registerCommand: (_, callback) => { handlers.toggle = callback; return { dispose() {} }; } },
    window: { createStatusBarItem: () => bar, activeTextEditor: { document: doc }, showInformationMessage() {} },
    workspace: { isTrusted: true, getConfiguration: () => ({ get: () => enabled }), applyEdit: async () => { doc.version++; return true; }, onDidSaveTextDocument: event('save'), onDidCloseTextDocument: event('close'), onDidChangeConfiguration: event('config'), onDidGrantWorkspaceTrust: event('trust') }
  };
  const context = { subscriptions: [] };
  let response = snapshot;
  const bridge = async (endpoint, payload) => { calls.push(endpoint); if (endpoint === 'saved') return { ok: true, reloaded: true }; return response; };
  registerStudioLink(context, new Set(), vscode, bridge);
  return { handlers, calls, doc, bar, setResponse: value => { response = value; }, disable: () => { enabled = false; handlers.config({ affectsConfiguration: () => true }); }, dispose: () => context.subscriptions.forEach(d => d.dispose()) };
}
test('disabled feature hides status and performs no requests', async () => {
  const state = setup();
  try { await state.handlers.toggle(); state.handlers.save(state.doc); assert.equal(state.bar.visible, false); assert.deepEqual(state.calls, []); } finally { state.dispose(); }
});
test('clean timing updates save without notifying Studio in a loop', async () => {
  const state = setup(true);
  try { await state.handlers.toggle(); assert.deepEqual(state.calls, ['timing', 'save']); assert.match(state.bar.text, /plug/); state.disable(); assert.equal(state.bar.visible, false); } finally { state.dispose(); }
});
test('dirty drafts are not automatically saved; explicit saves notify Studio', async () => {
  const state = setup(true); state.doc.isDirty = true;
  try { await state.handlers.toggle(); assert.deepEqual(state.calls, ['timing']); state.handlers.save(state.doc); await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(state.calls, ['timing', 'timing', 'saved']); } finally { state.dispose(); }
});
test('different Studio file disconnects without editing or saving', async () => {
  const state = setup(true); state.setResponse({ ...snapshot, context: { lyricsPath: '/other.epicx', contextRevision: 2 } });
  try { await state.handlers.toggle(); assert.deepEqual(state.calls, ['timing']); assert.match(state.bar.text, /debug-disconnect/); } finally { state.dispose(); }
});
