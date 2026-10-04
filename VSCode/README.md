# EPIC syntax highlighting for Visual Studio Code

A VS Code extension with EPIC / EPICX syntax highlighting and an optional **Blackberries** dark theme. Colors are taken from EPIC Media Writer’s own editor.

## Install

1. In VS Code, open Extensions and choose **… → Install from VSIX…**.
2. Select `epic-media-writer-highlighter-0.2.3.vsix`.
3. Run **Preferences: Color Theme** and choose **Blackberries**.
4. Open a `.epic` or `.epicx` file. For another extension, select **EPIC Media** from the language selector.

The language grammar also works with other themes. Exact Media Writer colors require the bundled Blackberries theme. Syntax color rules are scoped to EPIC; the optional theme also applies the navy palette to VS Code’s interface.

## Highlighting

- Header blocks: sky blue
- Sections: orange; section instructions: pink
- Instructions: purple, including multiline blocks
- Timestamps: mint; range arrows: muted green
- Entry numbers: slate blue
- Freeflow sections and freeform notes: lavender
- Markdown bold, italic, links, images, lists and inline code

VS Code token themes do not reproduce Media Writer’s inline background blocks. Freeform notes use lavender text instead. Standalone integer lines are treated as entry numbers; the grammar does not validate EPIC structure or metadata.

## Development

Open this directory in VS Code and press F5 to launch an Extension Development Host. Select the Blackberries theme and open `examples/demo.epicx`.

Package with `npx @vscode/vsce package --allow-missing-repository`. This is a local extension; the publisher identifier is a local placeholder, not a claimed Marketplace account. The extension runs locally and has no network access or telemetry.

Theme and grammar format: https://code.visualstudio.com/api/extension-guides/color-theme

If timestamps appear pale or sections appear blue, check that **Blackberries** is selected: installing a grammar does not activate its theme.

EPIC files disable rainbow bracket coloring so section brackets inherit the section color. Curly apostrophes (`’` and `‘`) are allowed without Unicode warning boxes. These defaults apply only to EPIC language mode.

## Theme compatibility

The grammar describes EPIC syntax using standard TextMate scope families. Your active theme supplies the colors; exact colors are only promised by the optional Blackberries theme. No theme is activated automatically.

| EPIC content | Standard fallback |
| --- | --- |
| Metadata keys / values | Attribute names / unquoted strings |
| Sections, brackets, Generation label | Headings |
| Instructions | Control keywords |
| Timestamps and entry numbers | Numeric constants |
| Freeflow content / boundaries | Quoted prose / headings |
| Freeform production notes | Block comments |
| Image references | Link strings |
| Inline Markdown | Bold, italic, links and raw code |

Section brackets share the exact scope of their title. EPIC disables nesting-based bracket colors in its language configuration. Other languages retain their own behavior. Curly-apostrophe allowances are also limited to EPIC.

To check compatibility: `npm install`, then `npm test`. Tests use VS Code’s TextMate engine and installed built-in themes. Set `VSCODE_THEMES_DIR` to the `extensions/theme-defaults/themes` directory in your VS Code installation when it is not in the standard macOS location. High-contrast themes may distinguish syntax by weight rather than separate colors.

## Distribution

This extension is distributed with the EPIC specification in `VSCode/`. The grammar is editor tooling, not a normative parser or validator. Install the included VSIX directly, or run `npm install`, `npm test`, and `npm run package` to build it.

Licensed under Apache 2.0; see `LICENSE`.

## Tab snippets

In an EPIC or EPICX file, type a prefix and press Tab:

| Prefix | Expansion |
| --- | --- |
| `ff` | `[{&}]`, with the cursor before the closing bracket |
| `gen` | `[Generation]` followed by `Styles:` on the next line |
| `head` | `Title: Untitled` and `Author: Me`, enclosed by `---` lines |

For `head`, **Untitled** is selected first. Tab selects **Me**, and another Tab finishes the snippet. Snippet Tab completion is enabled by default only for EPIC language mode; explicit user settings can override it.

The definitions are in `snippets/epic.json`.

## Automatic EPICX entry repair

Enabled by default for `.epicx` files in EPIC language mode. After a complete numbered entry (index line followed by timestamp line) is pasted or duplicated, entry numbers are rewritten as 1, 2, 3… in document order. Content is never sorted or moved.

Only **newly inserted** entries with a start timestamp exactly equal to another entry are moved forward by 2 seconds. Further exact collisions advance another 2 seconds until the start is unused. Both endpoints of a time range move together, preserving duration. Existing timestamps and distinct new timestamps less than 2 seconds apart remain unchanged. This can leave a new entry later in time than the following original entry; existing timing is deliberately preserved.

Opening or saving a file does not repair it. Ordinary typing, timestamp-only edits, full-document replacements, undo, and redo do not trigger normalization. The repair is undoable; VS Code can use separate undo steps for the repair and the original paste. Undo does not immediately trigger the repair again. Repairs are applied only to the active editor, without saving the file.

Disable **EPIC: Auto Normalize Pasted Entries** (`epic.autoNormalizePastedEntries`) in Settings to opt out. This is a convenience for complete numbered entry blocks, not a substitute for EPIC validation.

## Remembered authorship

New `head` / `hd` headers start with **Author: Me**. The first save of a complete header with exactly one nonempty `Author:`, `Creator:`, or `Artist:` field counts once per local EPIC file. Repeated saves do not count again. Opening files, incomplete headers, and headers with multiple authorship fields do not contribute.

The **role** learns the most common key across those distinct files. A unique leader with at least three uses becomes the default. Ties retain the current default (initially Author). The **value** keeps the existing rule: three consecutive distinct files with the same value establish a preference, regardless of which role those files use. A learned value remains until another three-file sequence replaces it.

Memory is local to the VS Code profile and persists across restarts. Existing learned values are preserved when upgrading; role counting starts with this version because prior versions did not record keys. Existing documents are never rewritten. **EPIC: Reset Authorship Memory** clears both histories and restores Author with the snippet’s default value.

Templates remain in `snippets/epic.json`. Keep the authorship value as a numbered placeholder, such as `Author: ${2:Me}`. The extension fills in the learned role and value at expansion time. Tab selects Title first and the authorship value second. Source changes require rebuilding and reinstalling the extension.

## Change header authorship role

Click **Artist**, **Author**, or **Creator** inside the fenced header to open a picker of the other roles. No right-click or modifier key is required. Keyboard navigation does not open the picker. The right-click command **EPIC: Change Header Role…** remains available as an alternative. You can also press **Cmd+.** on macOS (**Ctrl+.** on Windows/Linux) for direct Quick Fix choices, or run the command from the Command Palette.

Only the field name changes; its value and spacing remain intact. Roles already present elsewhere in the header are omitted to avoid duplicate fields. Body text and Generation settings are excluded. Escape cancels the popup, and a change can be undone normally. Authorship memory learns from any of the three roles.
