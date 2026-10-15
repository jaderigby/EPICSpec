'use strict';
const http = require('node:http');
const path = require('node:path');
const { entries, milliseconds } = require('./entry-normalization.cjs');

function timingEdits(text, snapshot) {
  const local = entries(text), remote = snapshot.entries;
  if (!local.length || !Array.isArray(remote) || local.length !== remote.length) throw new Error('Entry counts differ. Save your edits or open the matching EPICX file in Studio.');
  return local.flatMap((entry, i) => {
    const timing = String(remote[i].timingLine || '').trim();
    const match = /^(\d{2,}:\d{2}(?::\d{2})?\.\d{3})(?: --> (\d{2,}:\d{2}(?::\d{2})?\.\d{3}))?$/.exec(timing);
    if (Number(entry.index) !== i + 1 || Number(remote[i].index) !== i + 1 || !match || milliseconds(match[1]) === null || (match[2] && (milliseconds(match[2]) === null || milliseconds(match[2]) < milliseconds(match[1])))) throw new Error('Invalid entry numbering or timing; synchronization paused.');
    return text.slice(entry.timeStart, entry.insertedEnd) === timing ? [] : [{ start: entry.timeStart, end: entry.insertedEnd, text: timing }];
  });
}
function request(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const body = payload === undefined ? null : JSON.stringify(payload);
    const req = http.request({ hostname: '127.0.0.1', port: 48731, path: `/media-writer/${endpoint}`, method: body === null ? 'GET' : 'POST', headers: body === null ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; if (data.length > 4 * 1024 * 1024) req.destroy(new Error('Studio response is too large.')); });
      res.on('error', reject);
      res.on('end', () => {
        try {
          const value = JSON.parse(data);
          if (res.statusCode !== 200 || value.ok === false) throw new Error(value.message || 'Studio is unavailable.');
          resolve(value);
        } catch (error) { reject(error); }
      });
    });
    const timeout = setTimeout(() => req.destroy(new Error('Studio connection timed out.')), 3000);
    req.on('close', () => clearTimeout(timeout));
    req.on('error', reject);
    req.end(body);
  });
}
function registerStudioLink(context, applying, vscode = require('vscode'), bridge = request) {
  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  bar.name = 'EPIC Studio link';
  bar.command = 'epic.studioLink.toggle';
  let enabled = false, disposed = false, link = null, generation = 0, busy = false, timer;
  const automaticSaves = new Set();
  const status = (icon, message) => { bar.text = `$(${icon}) EPIC Studio`; bar.tooltip = message; };
  const unlink = message => { generation++; link = null; status('debug-disconnect', message || 'Disconnected. Click to link the active EPICX file.'); };
  const current = (target, epoch) => enabled && !disposed && link === target && generation === epoch && !target.document.isClosed;
  const sameFile = (snapshot, document) => typeof snapshot.context?.lyricsPath === 'string' && path.resolve(snapshot.context.lyricsPath) === path.resolve(document.uri.fsPath);
  let operations = Promise.resolve(), pollPending = false;
  function poll() {
    if (pollPending) return operations;
    pollPending = true;
    operations = operations.catch(() => {}).then(pollNow).finally(() => { pollPending = false; });
    return operations;
  }
  async function pollNow() {
    if (!enabled || !link || busy || disposed) return;
    busy = true;
    const target = link, epoch = generation, document = target.document;
    const version = document.version;
    try {
      const snapshot = await bridge('timing');
      if (!current(target, epoch) || version !== document.version) return;
      if (!sameFile(snapshot, document) || (target.revision !== null && target.revision !== snapshot.context.contextRevision)) {
        unlink('Studio changed projects. Click to link again.'); return;
      }
      target.revision = snapshot.context.contextRevision;
      const edits = timingEdits(document.getText(), snapshot);
      if (edits.length) {
        const wasClean = !document.isDirty;
        const edit = new vscode.WorkspaceEdit();
        for (const item of edits) edit.replace(document.uri, new vscode.Range(document.positionAt(item.start), document.positionAt(item.end)), item.text);
        const key = document.uri.toString();
        applying.add(key);
        let applied;
        try { applied = await vscode.workspace.applyEdit(edit); } finally { applying.delete(key); }
        if (!current(target, epoch)) return;
        if (!applied) throw new Error('Document changed; timing update will be retried.');
        // Never auto-save an existing draft or edits made while applying timing.
        if (wasClean && document.version === version + 1) {
          automaticSaves.add(key);
          try { if (!await document.save()) throw new Error('Timing updated, but the file could not be saved.'); }
          finally { automaticSaves.delete(key); }
        }
      }
      if (current(target, epoch)) status('plug', `Linked: ${document.uri.fsPath}\nTiming updates automatically. Save sends edits to Studio. Click to disconnect.`);
    } catch (error) { if (current(target, epoch)) status('warning', `${error.message}\nYour edits are preserved. Retrying; click to disconnect.`); }
    finally { busy = false; }
  }
  // Serialize saves with polling, so an old timing response cannot overwrite a saved edit.
  function saved(document) {
    if (!enabled || link?.document !== document || automaticSaves.has(document.uri.toString())) return;
    const target = link;
    const epoch = ++generation;
    operations = operations.catch(() => {}).then(async () => {
      if (!current(target, epoch)) return;
      busy = true;
      try {
        const snapshot = await bridge('timing');
        if (!current(target, epoch)) return;
        if (!sameFile(snapshot, document)) { unlink('Studio changed projects. Click to link again.'); return; }
        const result = await bridge('saved', { filePath: document.uri.fsPath, savedAt: new Date().toISOString() });
        if (!current(target, epoch)) return;
        if (!result.reloaded || result.ignored) throw new Error('Studio did not reload this file.');
        // Studio advances its context revision when reloading the saved file.
        target.revision = null;
        status('plug', 'Linked. Saved edits loaded in Studio. Click to disconnect.');
      } catch (error) {
        if (current(target, epoch)) unlink(`File saved locally, but Studio did not confirm the update: ${error.message} Click to reconnect, then save again.`);
      } finally { busy = false; }
    });
  }
  function configure() {
    enabled = vscode.workspace.isTrusted && vscode.workspace.getConfiguration('epic').get('studioLink.enabled', false) === true;
    clearInterval(timer);
    unlink();
    if (enabled) { bar.show(); timer = setInterval(() => { void poll(); }, 1200); }
    else bar.hide();
  }
  context.subscriptions.push(bar,
    vscode.commands.registerCommand('epic.studioLink.toggle', async () => {
      if (!enabled) return;
      if (link) { unlink(); return; }
      const document = vscode.window.activeTextEditor?.document;
      if (!document || document.uri.scheme !== 'file' || !/\.epicx$/i.test(document.uri.fsPath)) {
        vscode.window.showInformationMessage('Open a saved EPICX file, and open the same file in EPIC Studio.'); return;
      }
      link = { document, revision: null };
      generation++;
      status('sync~spin', 'Connecting to EPIC Studio… Click to disconnect.');
      await poll();
    }),
    vscode.workspace.onDidSaveTextDocument(saved),
    vscode.workspace.onDidCloseTextDocument(document => { if (link?.document === document) unlink(); }),
    vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('epic.studioLink.enabled')) configure(); }),
    vscode.workspace.onDidGrantWorkspaceTrust(configure),
    { dispose() { disposed = true; enabled = false; generation++; clearInterval(timer); link = null; } }
  );
  configure();
}
module.exports = { timingEdits, request, registerStudioLink };
