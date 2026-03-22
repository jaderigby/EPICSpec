# EPIC parser package

This package parses, validates, and stringifies `.epic` and `.epicx` documents.

Exports:
- `parseDocument(text, options?)`
- `parseEpic(text, options?)`
- `parseEpicx(text, options?)`
- `validateDocument(document)`
- `stringifyDocument(document)`

It runs directly in Node as plain ESM JavaScript, with no build step.

Example: node test-runner.js path/to/file.[epic | epicx]

