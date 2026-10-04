'use strict';

const TIME = '(?:\\d{2,}:)?\\d{2}:\\d{2}\\.\\d{3}';
const TIME_LINE = new RegExp(`^([ \\t]*)(${TIME})(?:([ \\t]*-->[ \\t]*)(${TIME}))?[ \\t]*$`);
function milliseconds(text) {
  const parts = text.split(':');
  const [seconds, fraction] = parts.pop().split('.');
  const minutes = Number(parts.pop());
  const hours = parts.length ? Number(parts.pop()) : 0;
  if (Number(seconds) > 59 || minutes > 59) return null;
  return ((hours * 60 + minutes) * 60 + Number(seconds)) * 1000 + Number(fraction);
}
function timestamp(ms, original) {
  const totalSeconds = Math.floor(ms / 1000);
  const pad = n => String(n).padStart(2, '0');
  const hours = Math.floor(totalSeconds / 3600);
  const prefix = original.split(':').length === 3 || hours ? `${pad(hours)}:` : '';
  return `${prefix}${pad(Math.floor(totalSeconds / 60) % 60)}:${pad(totalSeconds % 60)}.${String(ms % 1000).padStart(3, '0')}`;
}
function entries(text) {
  const lines = [];
  for (const m of text.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g)) {
    if (!m[0]) continue;
    lines.push({ text: m[0].replace(/[\r\n]+$/, ''), offset: m.index });
  }
  const result = [];
  let header = false, freeflow = false, instruction = false, firstContent = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], trimmed = line.text.trim();
    if (firstContent && trimmed) { header = trimmed === '---'; firstContent = false; if (header) continue; }
    if (header) { if (trimmed === '---') header = false; continue; }
    if (freeflow) { if (trimmed === ':::') freeflow = false; continue; }
    if (!instruction && /^\[\s*\{&\}.*\]$/.test(trimmed)) { freeflow = true; continue; }
    if (!instruction) {
      const index = /^([ \t]*)(\d+)([ \t]*)$/.exec(line.text);
      const time = lines[i + 1] && TIME_LINE.exec(lines[i + 1].text);
      if (index && time && (i === 0 || !lines[i - 1].text.trim())) {
        const startMs = milliseconds(time[2]);
        const endMs = time[4] ? milliseconds(time[4]) : null;
        if (startMs !== null && (!time[4] || (endMs !== null && endMs >= startMs))) {
          const timeStart = lines[i + 1].offset + time[1].length;
          result.push({ index: index[2], indexStart: line.offset + index[1].length,
            start: time[2], startMs, timeStart,
            end: time[4], endMs, endStart: time[4] ? timeStart + time[2].length + time[3].length : null,
            insertedEnd: timeStart + time[2].length + (time[4] ? time[3].length + time[4].length : 0) });
        }
      }
    }
    for (const marker of line.text.matchAll(/\{\{|\}\}/g)) {
      if (marker[0] === '{{') instruction = true;
      else instruction = false;
    }
  }
  return result;
}
// Changes use pre-edit offsets, as in TextDocumentChangeEvent. Only complete
// inserted index/timestamp pairs qualify; editing an existing time never does.
function planNormalization(before, after, changes) {
  if (!changes.length || changes.some(c => c.rangeOffset === 0 && c.rangeLength >= before.length && before.length > 0)) return [];
  const ranges = [];
  let delta = 0;
  for (const c of [...changes].sort((a, b) => a.rangeOffset - b.rangeOffset)) {
    const start = c.rangeOffset + delta;
    ranges.push({ start, end: start + c.text.length });
    delta += c.text.length - c.rangeLength;
  }
  const all = entries(after);
  const added = new Set(all.filter(e => ranges.some(r => e.indexStart >= r.start && e.insertedEnd <= r.end)));
  if (!added.size) return [];
  const occupied = new Set(all.filter(e => !added.has(e)).map(e => e.startMs));
  // Reserve distinct new timestamps too, so repairing a duplicate cannot steal
  // the time of a later inserted entry that was already unique.
  for (const e of added) occupied.add(e.startMs);
  const seen = new Set(all.filter(e => !added.has(e)).map(e => e.startMs));
  const edits = [];
  all.forEach((e, i) => {
    if (e.index !== String(i + 1)) edits.push({ start: e.indexStart, end: e.indexStart + e.index.length, text: String(i + 1) });
    if (!added.has(e)) return;
    let next = e.startMs;
    if (seen.has(next)) {
      do { next += 2000; } while (occupied.has(next));
      edits.push({ start: e.timeStart, end: e.timeStart + e.start.length, text: timestamp(next, e.start) });
      if (e.end) edits.push({ start: e.endStart, end: e.endStart + e.end.length, text: timestamp(e.endMs + next - e.startMs, e.end) });
    }
    seen.add(next);
    occupied.add(next);
  });
  return edits;
}
module.exports = { entries, milliseconds, timestamp, planNormalization };
