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

In `.epic`, labeled freeflows are `EpicFreeflow` nodes interleaved with ordinary
nodes in `body.preamble` or a section's `lines`, preserving their source position.
They do not create or change sections. Their `text` is opaque freeform content:
section labels, instruction blocks, and other syntax inside it are not parsed.
Whitespace is preserved, with line endings normalized to LF as elsewhere in the
parser. Standalone opener and terminator lines allow surrounding whitespace. The first
standalone `:::` closes a labeled freeflow; content whitespace remains intact.

Trailing unlabeled Freeflow Notes are stored in `body.notes` as an
`EpicFreeflowNotes` node and consume everything through EOF. They require a
preceding empty line. Missing labeled terminators, empty freeflows, and malformed
openers produce parse errors. Stringification preserves freeflow contents and
placement; it does not silently add a missing terminator.
