# 🚀 EPIC — Extended Performance & Intelligent Cues

### A Universal Language for Creative Direction

**Write once. Render anywhere.**

EPIC is an open, human-readable, plain-text language for authoring lyrics, defining song structure, directing performances, and synchronizing creative content to time.

It brings together information that traditionally lives in separate files and applications:

- Lyrics and composition
- Song structure and phrasing
- Authorship and production metadata
- AI generation instructions
- Vocal and instrumental performance direction
- Precise lyric and word timing
- Synchronized events and production cues

**One language. From the first written lyric to the final timed performance.**

---

## ⭐ Why EPIC?

A song is more than its lyrics.

It has sections, phrasing, delivery, timing, production decisions, and creative intentions. Yet most workflows scatter that information across lyric sheets, prompts, subtitle files, production notes, and application-specific formats.

EPIC provides a structured way to express these relationships in a single, portable language.

The goal isn't to replace creative tools. It's to give them a common language.

**Author → Generate → Perform → Synchronize → Render**

EPIC can travel through that entire process.

## 🎵 Two Formats. One Language.

EPIC defines two complementary document formats.

| Format | Purpose |
|---|---|
| `.epic` | Creative authoring: lyrics, structure, phrasing, metadata, and performance intent |
| `.epicx` | Timed execution: synchronized lyrics, performance instructions, and precise events |

Both are plain text, human-readable, and designed for machine parsing.

### 1. `.epic` — Authoring

An EPIC document starts with a header identifying the work and its authorship, followed by the creative content.

```text
---
Title: The Open Road
Artist: Example Artist

[Generation]
Styles: Midtempo alternative rock,
melodic bass, steady acoustic drums,
restrained lead vocals
---

[Intro]
{{instrumental}}

[Verse]
The morning sun is rising
The highway stretches on
Another day is waiting
Another night is gone

[Chorus]
We're heading for tomorrow
With miles of open sky
```

This is more than a lyric sheet.

It contains structured authorship, generation direction, section boundaries, performance instructions, and intentional phrasing.

In `.epic`, **line breaks are meaningful**. They express the phrasing and organization of the written performance.

Sections are identified using familiar labels such as `[Verse]`, `[Chorus]`, `[Bridge]`, `[Intro]`, and `[Outro]`. Custom section names are also supported.

The document remains readable and useful even without specialized software.

### 2. `.epicx` — Timed Performance

When the work needs synchronization, EPIC provides `.epicx`.

```text
---
Title: The Open Road
Artist: Example Artist
---

1
00:05.000 --> 00:08.500
[Verse]
The morning sun is rising

2
00:08.500 --> 00:12.000
[Verse]
The highway stretches on

3
00:12.000 --> 00:15.500
[Verse]
Another day is waiting

4
00:15.500 --> 00:19.000
[Verse]
Another night is gone

5
00:22.000 --> 00:26.000
[Chorus]
We're heading for tomorrow
```

*All timestamps are illustrative.*

Each timed entry contains a sequential identifier, a timestamp or optional time range, an optional section label, and the performance content with any associated instructions or events.

Timestamps support millisecond precision:

```text
MM:SS.mmm
HH:MM:SS.mmm
```

Optional ranges define explicit entry boundaries:

```text
00:22.000 --> 00:26.000
```

Unlike `.epic`, line breaks within an `.epicx` entry are for layout rather than phrasing.

This distinction lets EPIC preserve the creative structure of a song while providing a separate, precise representation for synchronized performance.

---

## 🎤 Performance Direction

EPIC doesn't just describe *what* is performed.

It can describe **how it should be performed**.

Instructions are enclosed in double curly braces:

```text
{{whispered}}
{{guitar solo}}
{{pronounced: /ter/}}
```

Instructions can be written in three contexts.

**Sectional instructions** apply to a section:

```text
[Chorus {{choral chant}}]
Sing together
```

**Inline instructions** accompany specific content:

```text
The road goes on {{male singer}}
```

**Standalone instructions** express performance or production cues:

```text
{{guitar solo}}
```

Instructions may be descriptive phrases, structured key/value expressions, or combinations of both.

```text
{{whispered, distant}}
{{vocals: choir}}
{{pronounced: /ter/, emotion: sorrowful}}
```

The instruction system is intentionally extensible.

EPIC defines how instructions are expressed and parsed without requiring every renderer or creative application to interpret them identically.

A vocal synthesis engine, a lyric visualizer, and a live-performance system can each interpret the instructions relevant to their capabilities.

## ⏱️ Precision Timing and Micro-Events

EPICX supports more than line-level synchronization.

Micro-events allow precise actions within an individual timed entry.

```text
3
00:49.500 --> 00:55.500
[Bridge]
{{vocals: choir}}
We sing together
@00:51.000 {{lights dim}}
@00:52.000 {{drums enter}}
@00:53.000 {{lights brighten}}
```

Micro-events can trigger production actions, direct visual behavior, or associate timing with individual words.

### Word-Level Timing

```text
4
00:49.500 --> 00:51.500
We sing together
@00:49.500 We
@00:49.800 sing
@00:50.200 together
```

This enables word-synchronized lyric presentation, karaoke-style displays, typography effects, and other time-sensitive rendering.

EPICX also provides the reserved `{{br}}` instruction for explicitly controlling line breaks during word-timed rendering.

Micro-events are scoped to their containing entry and can use explicit timestamps or inherit the entry's starting time.

**Timing is part of the language, not an afterthought.**

---

## 🧩 Metadata and Generation

EPIC includes structured metadata for identifying a work, recording authorship, and describing its production context.

Every document requires `Title` and at least one authorship field: `Creator`, `Artist`, or `Author`.

Optional fields include BPM, musical key, time signature, language, tags, production notes, document version, and specification version.

An optional `[Generation]` subsection can contain AI generation direction:

```text
---
Title: Example Song
Artist: Example Artist
BPM: 120
Key: Am
Version: 1.0

[Generation]
Styles: Midtempo electronic pop,
warm synthesizers, melodic bass,
restrained vocals, steady drums
Persona: Example Vocalist
Energy: 0.75
---
```

The generation subsection can also define multiple numbered styles and select one with `UseStyle`.

EPIC provides a portable structure for creative instructions without tying the document to any particular AI provider or generation system.

## 🎭 Expressive Direction and Emotives

EPIC supports expressive and perceptual direction through its general instruction system.

The optional **Emotives vocabulary** provides a consistent way to describe qualities such as energy, movement, atmosphere, intensity, and visual behavior.

For example:

```text
[Intro {{calm, dark}}]

[Chorus {{energetic, swell, reveal}}]
```

These instructions describe creative intent rather than prescribing a particular implementation.

A renderer might interpret them through typography, lighting, animation, or other available capabilities.

Emotives are one application of EPIC's instruction system. They are not required for lyric authoring, performance direction, or timing.

---

## 📝 Notes, References, and Creative Development

EPIC also supports features for the authoring process itself.

**Freeflows** allow labeled blocks of notes, ideas, and other material that sits outside the main document flow.

```text
[{&} Alternate chorus idea]
Try a quieter vocal delivery here.
Introduce the bass before the drums.
:::
```

A special unlabeled Freeflow Notes section can appear at the end of a document.

**Refs** provide a lightweight system for connecting text to reference definitions elsewhere in the document.

These authoring features are specific to `.epic`, allowing writers to develop material without confusing creative notes with timed performance content.

## ⚙️ Designed for Developers

EPIC is intended to be straightforward to implement.

- Plain-text files
- Defined grammar and syntax
- EBNF specification
- Deterministic structural rules
- Millisecond-precision timing
- Extensible instruction blocks
- Support for custom sections
- Forward-compatible instruction parsing

Unknown instruction keys or phrases should be ignored by parsers that do not recognize them, allowing implementations to support different capabilities without invalidating the underlying document.

The repository includes a reference parser for validating documents and supporting integration into creative software.

## 🌐 Where EPIC Fits

EPIC is designed to be useful across creative systems.

| Application | EPIC capability |
|---|---|
| Songwriting | Lyrics, sections, phrasing, and creative notes |
| AI music generation | Structured prompts and performance instructions |
| Lyric visualizers | Synchronized lines, words, and visual cues |
| Video production | Timeline events and creative direction |
| Live performance | Timed production and performance cues |
| Creative software | A common, parseable interchange format |

An application doesn't need to implement every feature to benefit from EPIC.

A lyric editor may support `.epic` authoring. A visualizer may consume `.epicx` timing. A performance system may respond to selected instructions and micro-events.

**Adoption can be incremental.**

---

## ⚡ Your First EPIC Document

Create a plain-text file named `song.epic`:

```text
---
Title: My First EPIC Song
Artist: Example Artist
---

[Verse]
Hello world
It's a brand new day

[Chorus]
Sing it together
Let the music play
```

That's a valid starting point for structured lyric authoring.

Add performance direction whenever you need it:

```text
[Chorus {{choral chant}}]
Sing it together
Let the music play
```

When you're ready to synchronize the performance, create a corresponding `song.epicx` document with timed entries.

You can begin with nothing more than a text editor.

## 🛠️ Visual Studio Code Support

The repository includes VS Code language tooling for `.epic` and `.epicx` files.

Features include theme-aware syntax highlighting and an optional **EPIC Blackberries** color theme.

The packaged extension is located under:

`VSCode/epic-media-writer-highlighter-..*.vsix`

To install, open VS Code, choose **Extensions → … → Install from VSIX…**, and select the package.

Extension source, examples, compatibility tests, and build instructions are included in the repository.

Editor tooling supports the language; the specification and parser define its structure and validation rules.

## 📖 Specification

**Current specification: EPIC 1.6**

The specification defines:

- Document headers and authorship
- Generation metadata
- Section and lyric structure
- Performance instructions
- Timed entry formatting
- Micro-events and word timing
- Freeflows and references
- Formal EBNF grammar
- Validation rules

The specification is the authoritative reference for language behavior.

## 🌱 The Vision

Creative intent shouldn't disappear every time a project moves between tools.

Lyrics, phrasing, performance instructions, and timing are all parts of the same creative work.

EPIC gives them a shared representation that creators can write, developers can interpret, and applications can exchange.

It is not a rendering engine, a music generator, or a replacement for creative software.

**It is the language connecting them.**

## Visual Studio Code extension

The specification includes [VS Code language tooling](VSCode/README.md) for `.epic` and `.epicx` files, with theme-aware syntax highlighting and an optional EPIC Blackberries theme.

1. The extension is located in the repo: VSCode/epic-media-writer-highlighter-*.*.*.vsix
2. In VS Code, choose **Extensions → … → Install from VSIX…** and select this file.
3. Use your preferred theme, or select **EPIC Blackberries** for the EPIC Media Writer™ palette.

The [extension source, examples, and compatibility tests](VSCode/) are included. See its README for build instructions. This is editor support; the specification and parser define and validate the language.

------------------------------------------------------------------------

## ⭐ Support EPIC

If EPIC is useful to you, star the repository, experiment with the format, build integrations, or contribute to its development.

## 📜 License

Copyright © 2026 Jade Rigby

Licensed under the **Apache License, Version 2.0**.