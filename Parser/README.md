# EPIC parser package

This package parses, validates, and stringifies `.epic` and `.epicx` documents.

Exports:
- `parseDocument(text, options?)`
- `parseEpic(text, options?)`
- `parseEpicx(text, options?)`
- `validateDocument(document)`
- `stringifyDocument(document)`

It runs directly in Node as plain ESM JavaScript, with no build step.

Example: node ./Parser/test-runner.mjs path/to/file.[epic | epicx]

Run this to test: node ./Parser/test-runner.mjs examples/Elem-en_Ellow_Vo.epic


Run regression tests with `npm test`. Run the example CLI with `npm run test:example`.

Each numbered `Styles` option occupies one line, with exactly one empty line
between options and after the last option (before the next field or closing
header delimiter).
`UseStyle` must be an integer matching an option index. Single freeform styles
continue to support multiline text and empty lines.

```text
[Generation]
Styles:
1. Ambient

2. Techno

UseStyle: 2
```
