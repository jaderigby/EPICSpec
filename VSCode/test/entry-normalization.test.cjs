const { test } = require('node:test');
const assert = require('node:assert/strict');
const { entries, planNormalization, timestamp, milliseconds } = require('../src/entry-normalization.cjs');
const entry = (n, time, text = 'Lyrics') => `${n}\n${time}\n${text}\n\n`;
function apply(text, edits) {
  for (const e of [...edits].sort((a, b) => b.start - a.start)) text = text.slice(0, e.start) + e.text + text.slice(e.end);
  return text;
}
function insert(before, offset, text) {
  const after = before.slice(0, offset) + text + before.slice(offset);
  return apply(after, planNormalization(before, after, [{ rangeOffset: offset, rangeLength: 0, text }]));
}
test('duplicate entry is renumbered and shifted; subsequent originals keep timestamps', () => {
  const a = entry(1, '00:00.000') + entry(2, '00:01.100');
  const b = entry(3, '00:01.250');
  const result = entries(insert(a + b, a.length, entry(2, '00:01.100')));
  assert.deepEqual(result.map(e => e.index), ['1', '2', '3', '4']);
  assert.deepEqual(result.map(e => e.start), ['00:00.000', '00:01.100', '00:03.100', '00:01.250']);
});
test('legitimate close existing AND newly pasted timestamps are unchanged', () => {
  const before = entry(1, '00:01.000') + entry(2, '00:01.010');
  assert.deepEqual(entries(insert(before, before.length, entry(8, '00:01.020'))).map(e => e.start), ['00:01.000', '00:01.010', '00:01.020']);
});
test('paste before original shifts only the pasted copy', () => {
  const before = entry(1, '00:10.000');
  assert.deepEqual(entries(insert(before, 0, before)).map(e => e.start), ['00:12.000', '00:10.000']);
});
test('collision chains advance by two seconds; reserve unique pasted times', () => {
  const before = entry(1, '00:10.000') + entry(2, '00:12.000');
  const result = entries(insert(before, before.length, entry(2, '00:10.000') + entry(2, '00:14.000') + entry(2, '00:10.000')));
  assert.deepEqual(result.map(e => e.start), ['00:10.000', '00:12.000', '00:16.000', '00:14.000', '00:18.000']);
});
test('range duration and hour rollover are preserved', () => {
  const before = entry(1, '59:59.005 --> 01:00:01.005');
  const result = entries(insert(before, before.length, before));
  assert.equal(result[1].start, '01:00:01.005');
  assert.equal(result[1].end, '01:00:03.005');
  assert.equal(milliseconds('00:01.100'), 1100);
  assert.equal(timestamp(1100, '00:00.000'), '00:01.100');
});
test('pre-existing duplicates stay untouched when a distinct entry is pasted', () => {
  const before = entry(1, '00:10.000') + entry(2, '00:10.000');
  assert.deepEqual(entries(insert(before, before.length, entry(3, '00:11.000'))).map(e => e.start), ['00:10.000', '00:10.000', '00:11.000']);
});
test('timestamp-only edits, lyrics, deletions and full document replacement do not trigger repairs', () => {
  const before = entry(2, '00:10.000');
  for (const c of [
    { rangeOffset: 2, rangeLength: 9, text: '00:10.100' },
    { rangeOffset: 12, rangeLength: 0, text: 'more lyrics' },
    { rangeOffset: 0, rangeLength: 1, text: '' },
    { rangeOffset: 0, rangeLength: before.length, text: before + before }
  ]) {
    const after = before.slice(0, c.rangeOffset) + c.text + before.slice(c.rangeOffset + c.rangeLength);
    assert.deepEqual(planNormalization(before, after, [c]), []);
  }
});
test('metadata, freeflow and multiline instruction content is excluded', () => {
  const before = '---\nTitle: Test\n\n7\n00:10.000\n---\n\n[{&}Notes]\n\n8\n00:10.000\n:::\n\n{{notes\n\n9\n00:10.000\n}}\n\n';
  const result = insert(before, before.length, entry(8, '00:10.000'));
  assert.equal(result, before + entry(1, '00:10.000'));
});
test('CRLF, indent, trailing spaces and text are preserved', () => {
  const before = '  1 \r\n 00:00.000 \r\nLyrics\r\n\r\n';
  assert.equal(insert(before, before.length, before), before + '  2 \r\n 00:02.000 \r\nLyrics\r\n\r\n');
});
test('multiple simultaneous insertions use the correct post-change offsets', () => {
  const before = entry(1, '00:10.000') + entry(2, '00:20.000');
  const text = entry(1, '00:10.000');
  const changes = [{ rangeOffset: before.length, rangeLength: 0, text }, { rangeOffset: 0, rangeLength: 0, text }];
  const after = text + before + text;
  const result = entries(apply(after, planNormalization(before, after, changes)));
  assert.deepEqual(result.map(e => e.index), ['1', '2', '3', '4']);
  assert.deepEqual(result.map(e => e.start), ['00:12.000', '00:10.000', '00:20.000', '00:14.000']);
});
test('new empty document accepts first complete entry without changing a distinct time', () => {
  assert.equal(insert('', 0, entry(4, '00:10.000')), entry(1, '00:10.000'));
});
