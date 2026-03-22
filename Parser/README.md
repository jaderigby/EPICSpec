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

Run this to test: node ./Parser/test-runner.mjs Examples/Elem-en_Ellow_Vo.lyric
