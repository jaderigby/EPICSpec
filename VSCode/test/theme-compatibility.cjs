const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const tm = require('vscode-textmate');
const onig = require('vscode-oniguruma');
const { parse } = require('jsonc-parser');
const root = path.resolve(__dirname, '..');
const themeDir = process.env.VSCODE_THEMES_DIR || '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/theme-defaults/themes';
function loadTheme(file) {
  const data = parse(fs.readFileSync(file, 'utf8'));
  const base = data.include ? loadTheme(path.resolve(path.dirname(file), data.include)) : { colors: {}, tokenColors: [] };
  return { ...data, colors: { ...base.colors, ...data.colors }, tokenColors: [...base.tokenColors, ...(data.tokenColors || [])] };
}
async function main() {
  const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
  await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'syntaxes/epic.tmLanguage.json')));
  const themes = ['dark_plus', 'light_plus', 'dark_modern', 'light_modern', 'hc_black', 'hc_light'].map(name => [name, path.join(themeDir, name + '.json')]);
  themes.push(['Blackberries', path.join(root, 'themes/blackberries-color-theme.json')]);
  for (const [name, file] of themes) {
    const theme = loadTheme(file);
    const light = name.includes('light');
    theme.colors['editor.background'] ||= light ? '#FFFFFF' : '#1E1E1E';
    theme.colors['editor.foreground'] ||= light ? '#000000' : '#D4D4D4';
    const settings = [{ settings: { foreground: theme.colors['editor.foreground'], background: theme.colors['editor.background'] } }, ...theme.tokenColors];
    const registry = new tm.Registry({ theme: { settings }, onigLib: Promise.resolve({ createOnigScanner: p => new onig.OnigScanner(p), createOnigString: s => new onig.OnigString(s) }), loadGrammar: async () => raw });
    const grammar = await registry.loadGrammar('text.epic');
    let state = tm.INITIAL;
    function line(text, expected) {
      const scoped = grammar.tokenizeLine(text, state);
      const colored = grammar.tokenizeLine2(text, state);
      state = scoped.ruleStack;
      if (expected) assert(scoped.tokens.some(t => t.scopes.includes(expected)), `${name}: ${text} missing ${expected}`);
      function colorAt(index) {
        let metadata;
        for (let i = 0; i < colored.tokens.length; i += 2) if (colored.tokens[i] <= index) metadata = colored.tokens[i + 1];
        return registry.getColorMap()[(metadata >>> 15) & 511].toUpperCase();
      }
      return { scoped, colorAt };
    }
    line('---');
    line('Title: Test', 'entity.other.attribute-name.header.epic');
    line('continued metadata', 'string.unquoted.header.epic');
    line('[Generation]', 'markup.heading.generation.epic');
    line('---');
    const text = '[Verse 1 {{soft}}]';
    const section = line(text, 'markup.heading.section.epic');
    assert.equal(section.colorAt(0), section.colorAt(2), `${name}: opening bracket differs`);
    assert.equal(section.colorAt(text.length - 1), section.colorAt(2), `${name}: closing bracket differs`);
    const time = line('00:01.000 --> 00:02.500', 'constant.numeric.timestamp.epic');
    assert.notEqual(time.colorAt(0), theme.colors['editor.background'].toUpperCase());
    if (name === 'Blackberries') {
      assert.equal(section.colorAt(0), '#F4B36D');
      assert.equal(time.colorAt(0), '#8FE6C8');
    }
    line('{{soft', 'keyword.control.instruction.epic');
    line('continued}}', 'keyword.control.instruction.epic');
    assert.deepEqual(line('Ordinary lyrics').scoped.tokens[0].scopes, ['text.epic']);
    line('{{&}Production note}}', 'comment.block.freeform.epic');
    line('[{&}Notes]', 'markup.heading.freeflow.epic');
    line('Freeflow prose', 'markup.quote.freeflow.epic');
    line(':::');
    assert.deepEqual(line('Ordinary lyrics').scoped.tokens[0].scopes, ['text.epic']);
    for (const item of ['- Whole item', '* Whole item', '+ Whole item', '  1. Whole item']) {
      const result = line(item, 'markup.list.epic');
      const last = result.scoped.tokens.find(t => t.startIndex <= item.length - 1 && t.endIndex > item.length - 1);
      assert(last.scopes.includes('markup.list.epic'), `${name}: list text missing scope`);
      if (name === 'Blackberries') assert.equal(result.colorAt(item.length - 1), '#F3D9B8');
      assert.deepEqual(line('Ordinary lyrics').scoped.tokens[0].scopes, ['text.epic']);
    }
    line('- **Bold** item', 'markup.bold.epic');
    line('- {{soft}} item', 'keyword.control.instruction.epic');
    function blend(hex, opacity, bg) {
      return '#' + [1,3,5].map(i => Math.round(parseInt(hex.slice(i,i+2),16)*opacity + parseInt(bg.slice(i,i+2),16)*(1-opacity)).toString(16).padStart(2,'0')).join('').toUpperCase();
    }
    function checkReferences(bg) {
      for (const [text, label, target, marker, base, dest] of [
        ['[link](something)', 1, 7, 0, '#B3E2D6', '#9FD6C8'],
        ['![alt](image.png)', 2, 7, 0, '#CDACDE', '#CDACDE'],
        ['![](image.png)', null, 4, 0, '#CDACDE', '#CDACDE']
      ]) {
        const result = line(text);
        if (name === 'Blackberries') {
          if (label !== null) assert.equal(result.colorAt(label), base);
          assert.equal(result.colorAt(target), blend(dest, .65, bg));
          for (const i of [marker,text.indexOf(']'),text.indexOf('('),text.length-1]) {
            assert.equal(result.colorAt(i), blend(base, .44, bg), `${text}: punctuation at ${i}`);
          }
        }
      }
    }
    for (const text of ['**bold**', '*italic*']) {
      const result = line(text);
      if (name === 'Blackberries') {
        assert.equal(result.colorAt(0), blend('#F4F4F4', .44, '#050505'));
        assert.equal(result.colorAt(text.length-1), result.colorAt(0));
        assert.equal(result.colorAt(3), '#F4F4F4');
      }
    }
    checkReferences('#050505');
    const openerText = '[{&}Freeflow title]';
    const openerTokens = grammar.tokenizeLine2(openerText, state).tokens;
    line(openerText, 'markup.heading.freeflow.epic');
    if (name === 'Blackberries') for (let i=1;i<openerTokens.length;i+=2) assert.equal((openerTokens[i] >>> 11) & 15, 0, 'freeflow opener must have no bold or italic');
    checkReferences('#1D1622');
    line(':::');
    assert.deepEqual(line('Ordinary lyrics').scoped.tokens[0].scopes, ['text.epic']);
    console.log(`${name}: grammar boundaries, fallback scopes, bracket colors and timestamps passed`);
    registry.dispose();
  }
  const config = JSON.parse(fs.readFileSync(path.join(root, 'language-configuration.json')));
  assert.deepEqual(config.colorizedBracketPairs, []);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  assert.deepEqual(Object.keys(manifest.contributes.configurationDefaults), ['[epic]']);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
