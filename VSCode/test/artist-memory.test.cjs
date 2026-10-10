const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readArtist, observe, snippetBody } = require('../src/artist-memory.cjs');
const template = require('../snippets/epic.json')['Header fields'];
test('learns after three distinct files; repeated saves do not count', () => {
  let state = {};
  state = observe(state, 'one', 'Jade');
  for (let i = 0; i < 5; i++) state = observe(state, 'one', 'Jade');
  state = observe(state, 'two', 'Jade');
  assert.equal(state.preferred, null);
  state = observe(state, 'three', 'Jade');
  assert.equal(state.preferred, 'Jade');
  assert.equal(observe(state, 'one', 'Different'), state);
});
test('mixed sequence does not learn, new three-file sequence replaces preference', () => {
  let state = {};
  ['A','B','A','A'].forEach((artist, i) => state = observe(state, String(i), artist));
  assert.equal(state.preferred, null);
  state = observe(state, '4', 'A');
  assert.equal(state.preferred, 'A');
  state = observe(state, '5', 'B');
  state = observe(state, '6', 'B');
  assert.equal(state.preferred, 'A');
  state = observe(state, '7', 'B');
  assert.equal(state.preferred, 'B');
});
test('persisted file history survives reload and reset clears it', () => {
  let state = observe({}, 'one', 'Jade');
  state = JSON.parse(JSON.stringify(state));
  assert.equal(observe(state, 'one', 'Jade'), state);
  assert.deepEqual(observe({}, 'one', 'Jade').seen, ['one']);
});
test('extracts only one valid Artist in a complete header', () => {
  assert.equal(readArtist('---\r\nTitle: X\r\nArtist:  Jade  \r\n---\r\nArtist: Other'), 'Jade');
  for (const text of ['Artist: X','---\nArtist: X','---\nArtist: X\nArtist: Y\n---','---\nTitle: X\n---\nArtist: X','---\n[Generation]\nArtist: X\n---','---\nArtist: \n---']) assert.equal(readArtist(text), null);
});
test('header preserves both placeholders and fences with or without memory', () => {
  assert.equal(snippetBody(template, null), '---\nTitle: ${1:Untitled}\nAuthor: ${2:Me}\n---\n$0');
  assert.equal(snippetBody(template, 'Jade'), '---\nTitle: ${1:Untitled}\nAuthor: ${2:Jade}\n---\n$0');
  assert.ok([].concat(template.prefix).includes('hd'));
});
test('artist values cannot inject snippet variables or tab stops', () => {
  assert.equal(snippetBody(template, 'A$1}\\B'), '---\nTitle: ${1:Untitled}\nAuthor: ${2:A\\$1\\}\\\\B}\n---\n$0');
});
test('other snippets and customized header fallbacks remain intact', () => {
  const ff = require('../snippets/epic.json')['Freeflow section'];
  assert.equal(snippetBody(ff, 'Jade'), '[{&}${1}]\n$0');
  assert.equal(snippetBody({ body: 'Artist: ${4:Someone}' }, null), 'Artist: ${4:Someone}');
  assert.equal(snippetBody({ body: 'Artist: ${4:Someone}' }, 'Jade'), 'Artist: ${4:Jade}');
});
const { readAuthorship, observeAuthorship } = require('../src/artist-memory.cjs');
test('role starts Author and learns the unique most common role after three uses', () => {
  let state = {};
  const add = role => { state = observeAuthorship(state, String((state.roleSeen || []).length), { role, value: 'Jade' }); };
  add('Creator'); add('Artist'); add('Creator');
  assert.equal(state.preferredRole, 'Author');
  add('Creator');
  assert.equal(state.preferredRole, 'Creator');
  add('Artist'); add('Artist');
  assert.equal(state.preferredRole, 'Creator'); // tied 3–3
  add('Artist');
  assert.equal(state.preferredRole, 'Artist');
  assert.equal(state.preferred, 'Jade');
  assert.equal(observeAuthorship(state, '0', { role: 'Author', value: 'Other' }), state);
});
test('value learns across roles; prior value history survives upgrade', () => {
  let state = { seen: ['old'], recent: ['Jade'], preferred: 'Existing' };
  state = observeAuthorship(state, 'old', { role: 'Author', value: 'Changed' });
  assert.equal(state.preferred, 'Existing');
  assert.deepEqual(state.recent, ['Jade']);
  state = observeAuthorship(state, 'two', { role: 'Creator', value: 'Jade' });
  state = observeAuthorship(state, 'three', { role: 'Artist', value: 'Jade' });
  assert.equal(state.preferred, 'Jade');
  assert.deepEqual(state.roleCounts, {Author: 1, Creator: 1, Artist: 1});
});
test('reads all roles and ignores ambiguous or empty authorship', () => {
  for (const role of ['Author','Creator','Artist']) assert.deepEqual(readAuthorship(`---\n${role}: Jade\n---`), {role, value:'Jade'});
  assert.equal(readAuthorship('---\nAuthor: A\nArtist: B\n---'), null);
  assert.equal(readAuthorship('---\nAuthor: \nArtist: B\n---'), null);
});
test('snippet applies learned key with preserved placeholder order', () => {
  assert.equal(snippetBody(template, null, 'Author'), '---\nTitle: ${1:Untitled}\nAuthor: ${2:Me}\n---\n$0');
  assert.equal(snippetBody(template, 'Jade', 'Creator'), '---\nTitle: ${1:Untitled}\nCreator: ${2:Jade}\n---\n$0');
});
