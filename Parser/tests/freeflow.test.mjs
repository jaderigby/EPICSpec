import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDocument, stringifyDocument } from '../src/index.js';

const header = '---\nTitle: Test\nArtist: Test\n---\n\n';
const parse = body => parseDocument(header + body, { format: 'epic' });
function valid(result) {
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  return result.document.body;
}
function content(body) {
  const line = ({ loc, ...rest }) => rest;
  return {
    preamble: body.preamble.map(line),
    sections: body.sections.map(s => ({ name: s.section.name, lines: s.lines.map(line) })),
    notes: body.notes && line(body.notes),
  };
}

test('freeflow isolates raw content and preserves surrounding section and instruction', () => {
  const raw = '  keep spaces  \n\n[Chorus]\n{{not: valid: instruction}}\nref:: raw\n@ raw\n[{&} literal opener]\n :: : \ntext :: : text';
  const result = parse('[Verse {{whispered}}]\nBefore\n[{&} Ideas]\n' + raw + '\n:::\nAfter\n[Outro]\nEnd');
  const body = valid(result);
  assert.deepEqual(body.sections.map(s => s.section.name), ['Verse', 'Outro']);
  assert.deepEqual(body.sections[0].lines.map(l => l.type), ['EpicLyricLine', 'EpicFreeflow', 'EpicLyricLine']);
  assert.equal(body.sections[0].lines[0].text, 'Before');
  assert.equal(body.sections[0].lines[2].text, 'After');
  assert.equal(body.sections[0].lines[1].text, raw);
  assert.equal(body.sections[0].lines[1].label, 'Ideas');
  assert.ok(body.sections[0].section.instruction);
  assert.deepEqual(content(valid(parseDocument(stringifyDocument(result.document), { format: 'epic' }))), content(body));
});

test('first standalone terminator closes each independent freeflow', () => {
  const body = valid(parse('[Verse]\n[{&} One]\nfirst\n:::\nBetween\n[{&} Two]\nsecond\n:::\nAfter'));
  assert.equal(body.sections.length, 1);
  assert.deepEqual(body.sections[0].lines.map(l => l.text), ['first', 'Between', 'second', 'After']);
});

test('freeflows before any section roundtrip without becoming sections', () => {
  const result = parse('[{&} Ideas]\n\n raw \n\n:::\n[Verse]\nLyric');
  const body = valid(result);
  assert.equal(body.preamble[0].type, 'EpicFreeflow');
  assert.equal(body.preamble[0].text, '\n raw \n');
  assert.deepEqual(body.sections.map(s => s.section.name), ['Verse']);
  assert.deepEqual(content(valid(parseDocument(stringifyDocument(result.document), { format: 'epic' }))), content(body));
});

test('notes consume all remaining text literally, including terminators and openers', () => {
  const raw = '  notes\n:::\n[Chorus]\n[{&}]\n{{x: y: z}}\n';
  const result = parse('[Verse]\nLyric\n\n[{&}]\n' + raw);
  const body = valid(result);
  assert.equal(body.sections.length, 1);
  assert.equal(body.sections[0].lines.length, 1);
  assert.equal(body.notes.text, raw);
  assert.deepEqual(content(valid(parseDocument(stringifyDocument(result.document), { format: 'epic' }))), content(body));
});

test('notes-only body roundtrips', () => {
  const result = parse('[{&}]\nnotes');
  const body = valid(result);
  assert.equal(body.sections.length, 0);
  assert.deepEqual(content(valid(parseDocument(stringifyDocument(result.document), { format: 'epic' }))), content(body));
});

test('notes require a preceding empty line', () => {
  const result = parse('[Verse]\nLyric\n[{&}]\nnotes');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(i => i.code === 'FREEFLOW_NOTES_SEPARATOR'));
  assert.equal(result.document.body.sections.length, 1);
});

test('unterminated freeflow is reported without parsing its contents as lyrics', () => {
  const result = parse('[Verse]\nBefore\n[{&} Ideas]\n[Chorus]\n{{invalid: x: y}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map(i => i.code), ['UNTERMINATED_FREEFLOW']);
  assert.equal(result.document.body.sections.length, 1);
  assert.equal(result.document.body.sections[0].lines[1].text, '[Chorus]\n{{invalid: x: y}}');
  assert.ok(!stringifyDocument(result.document).endsWith(':::'));
});

for (const body of ['[{&} Ideas]\n:::', '[{&}]\n']) {
  test(`reject empty freeflow ${JSON.stringify(body)}`, () => {
    assert.ok(parse(body).issues.some(i => i.code === 'EMPTY_FREEFLOW'));
  });
}

test('malformed freeflow opener is not reclassified as a section', () => {
  const result = parse('[Verse]\nBefore\n[{&}Ideas]\nAfter');
  assert.ok(result.issues.some(i => i.code === 'INVALID_FREEFLOW_OPENER'));
  assert.deepEqual(result.document.body.sections.map(s => s.section.name), ['Verse']);
});

test('CRLF input preserves freeflow lines using parser newline normalization', () => {
  const result = parseDocument((header + '[Verse]\n[{&} Ideas]\n raw \n\n:::\nAfter').replaceAll('\n', '\r\n'), { format: 'epic' });
  const body = valid(result);
  assert.equal(body.sections[0].lines[0].text, ' raw \n');
  assert.equal(body.sections[0].lines[1].text, 'After');
});

for (const padding of [' ', '\t', ' \t']) {
  test(`marker whitespace ${JSON.stringify(padding)} does not leak notes`, () => {
    const raw = '  preserve this  \n\n[Chorus]';
    const result = parse('[Verse]\nBefore\n' + padding + '[{&} Ideas]' + padding + '\n' + raw + '\n' + padding + ':::' + padding + '\nAfter\n' + padding + '\n' + padding + '[{&}]' + padding + '\n  trailing notes  ');
    const body = valid(result);
    assert.deepEqual(body.sections.map(s => s.section.name), ['Verse']);
    assert.deepEqual(body.sections[0].lines.map(l => l.text), ['Before', raw, 'After']);
    assert.equal(body.notes.text, '  trailing notes  ');
    assert.deepEqual(content(valid(parseDocument(stringifyDocument(result.document), { format: 'epic' }))), content(body));
  });
}
