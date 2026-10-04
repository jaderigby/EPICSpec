import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDocument, stringifyDocument, validateDocument } from '../src/index.js';

function parse(generation, format = 'epic') {
  return parseDocument(`---\nTitle: Test\nArtist: Test\n\n[Generation]\n${generation}\n---\n`, { format });
}
function hasIssue(result, code) {
  assert.ok(result.issues.some(issue => issue.code === code), JSON.stringify(result.issues));
  assert.equal(result.ok, false);
}
for (const format of ['epic', 'epicx']) {
  test(`${format}: valid numbered styles survive roundtrip`, () => {
    const result = parse('Styles:\n1. Ambient\n\n2. Techno\n\nUseStyle: 2', format);
    assert.equal(result.ok, true, JSON.stringify(result.issues));
    assert.deepEqual(result.document.header.generation.fields.Styles.options.map(o => o.value), ['Ambient', 'Techno']);
    const text = stringifyDocument(result.document);
    assert.match(text, /1\. Ambient\n\n2\. Techno/);
    const again = parseDocument(text, { format });
    assert.equal(again.ok, true, JSON.stringify(again.issues));
    assert.deepEqual(again.document.header.generation.fields, result.document.header.generation.fields);
  });
}
for (const separator of ['\n', '\n\n\n']) {
  test(`invalid spacing ${JSON.stringify(separator)} preserves both options`, () => {
    const result = parse(`Styles:\n1. Ambient${separator}2. Techno\n\nUseStyle: 2`);
    hasIssue(result, 'INVALID_STYLE_OPTION_SEPARATOR');
    assert.equal(result.document.header.generation.fields.Styles.options.length, 2);
    assert.equal(result.issues.some(i => i.code === 'INVALID_USESTYLE_INDEX'), false);
    assert.ok(validateDocument(result.document).some(i => i.code === 'INVALID_STYLE_OPTION_SEPARATOR'));
  });
}
for (const value of ['1abc', '1.5', '+1', '-1', '1e0', '9007199254740993']) {
  test(`reject malformed UseStyle ${value}`, () => {
    hasIssue(parse(`Styles:\n1. Ambient\n\nUseStyle: ${value}`), 'INVALID_USESTYLE_VALUE');
  });
}
test('missing selection is rejected', () => {
  hasIssue(parse('Styles:\n1. Ambient\n\n2. Techno\n\nUseStyle: 3'), 'INVALID_USESTYLE_INDEX');
});
test('single freeform styles preserve paragraphs', () => {
  const result = parse('Styles: Ambient\nSoft textures\n\nGentle percussion\nEnergy: 0.50');
  assert.equal(result.ok, true);
  assert.equal(result.document.header.generation.fields.Styles.value, 'Ambient\nSoft textures\n\nGentle percussion');
});
test('UseStyle requires numbered styles', () => {
  hasIssue(parse('Styles: Ambient\n\nUseStyle: 1'), 'USESTYLE_WITHOUT_MULTIPLE_STYLES');
});
test('numbered options cannot silently consume continuation text', () => {
  hasIssue(parse('Styles:\n1. Ambient\nextra text\n\n2. Techno'), 'INVALID_GENERATION_FIELD');
});
test('malformed option marker is rejected', () => {
  hasIssue(parse('Styles:\n1. Ambient\n\n2.\n\nUseStyle: 2'), 'INVALID_STYLE_OPTION_MARKER');
});
test('style indices retain the specification integer semantics', () => {
  const result = parse('Styles:\n0. Ambient\n\n5. Techno\n\nUseStyle: 5');
  assert.equal(result.ok, true, JSON.stringify(result.issues));
});

for (const format of ['epic', 'epicx']) {
  for (const following of ['UseStyle: 2', 'Persona: Test', '']) {
    for (const count of [0, 1, 2]) {
      test(`${format}: ${count} trailing blank lines before ${following || 'header delimiter'}`, () => {
        const generation = 'Styles:\n1. Ambient\n\n2. Techno' + '\n'.repeat(count) + (following ? '\n' + following : '');
        const result = parse(generation, format);
        if (count === 1) {
          assert.equal(result.ok, true, JSON.stringify(result.issues));
        } else {
          hasIssue(result, 'INVALID_STYLES_TERMINATOR');
          assert.ok(validateDocument(result.document).some(i => i.code === 'INVALID_STYLES_TERMINATOR'));
        }
        const text = stringifyDocument(result.document);
        assert.match(text, /2\. Techno\n\n(?:UseStyle:|Persona:|---)/);
        assert.equal(parseDocument(text, { format }).ok, true);
      });
    }
  }
}
test('one numbered option also requires a trailing blank line', () => {
  hasIssue(parse('Styles:\n1. Ambient'), 'INVALID_STYLES_TERMINATOR');
  assert.equal(parse('Styles:\n1. Ambient\n').ok, true);
});
