# 🚀 EPIC — Extended Performance & Intelligent Cues

### A Universal Language for Creative Direction

**Write once. Render anywhere.**

EPIC is a lightweight, human-readable, plain-text language for authoring lyrics, structuring creative works, directing performances, and synchronizing content to time.

It brings together information that traditionally lives in separate documents and applications:

- Lyrics, structure, and phrasing
- Authorship and production metadata
- AI generation instructions
- Vocal and instrumental performance direction
- Line-level and word-level timing
- Synchronized events and production cues

EPIC provides a common language for carrying creative intent from authoring through performance and rendering.

To experience a full integration, check out [EPIC Studio™](https://jaderigby.gumroad.com/l/epic-studio) and [EPIC Media Writer™](https://jaderigby.gumroad.com/l/epic-media-writer)

-----

## ⭐ Why EPIC?

Creative workflows are fragmented.

Lyrics are written in one application. Generation instructions are stored somewhere else. Timing is created in another tool. Performance cues and production notes are often scattered across multiple documents.

EPIC brings these elements together in a structured, portable format.

**Structure + Authorship + Direction + Timing**

The goal isn't to replace creative applications. It's to provide a common language they can understand and exchange.

## 🎵 Two Formats. One Language.

EPIC defines two complementary document formats.

| Format | Purpose |
|---|---|
| `.epic` | Authoring: lyrics, scripting, structure, phrasing, generation metadata, and creative intent |
| `.epicx` | Timed performance: synchronized lyrics, contextual instructions, and precise event timing |

Both formats use plain text and share the same header structure.

### 1. `.epic` — Creative Authoring

An `.epic` document contains a metadata header followed by the creative content.

```text
---
Title: The Open Road
Artist: Example Artist

[Generation]
Styles: Midtempo alternative rock,
melodic bass, steady acoustic drums,
restrained lead vocals
---

[Verse]
The morning sun is rising
The highway stretches on
Another day is waiting
Another night is gone

[Chorus]
We're heading for tomorrow
With miles of open sky
```

The document contains authorship, generation direction, song sections, and lyrics in a format that remains readable without specialized software.

**Line breaks in `.epic` indicate phrasing.**

Section labels identify the structure of the work. Common labels include `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`, `[Spoken]`, and `[Outro]`.

Custom section labels are also supported.

Performance instructions can be added without changing the underlying lyric structure.

### 2. `.epicx` — Timed Performance

An `.epicx` document adds timing and entry structure to the authored work.

The header remains intact, including its generation metadata.

```text
---
Title: The Open Road
Artist: Example Artist

[Generation]
Styles: Midtempo alternative rock,
melodic bass, steady acoustic drums,
restrained lead vocals
---

1
00:05.000
[Verse]
The morning sun is rising

2
00:08.500
[Verse]
The highway stretches on

3
00:12.000
[Verse]
Another day is waiting

4
00:15.500
[Verse]
Another night is gone

5
00:22.000
[Chorus]
We're heading for tomorrow

6
00:26.000
[Chorus]
With miles of open sky
```

Each timed entry consists of a sequential numeric identifier, a timestamp, an optional section label, and one or more content lines.

Entry identifiers start at `1` and increase sequentially.

**In `.epicx`, line breaks within an entry indicate screen layout, not phrasing.**

### Timestamp Formats

EPICX supports millisecond-precision timestamps in either form:

```text
MM:SS.mmm
HH:MM:SS.mmm
```

A timestamp identifies the entry's starting time.

When an explicit end time is needed, an optional time range can be used:

```text
5
00:22.000 --> 00:26.000
[Chorus]
We're heading for tomorrow
```

Both forms are part of the EPICX specification. An explicit exit timestamp is not required.

---

## 🎤 Performance Instructions

EPIC can express not only what is performed, but how it should be performed.

Instruction blocks use double curly braces:

```text
{{whispered}}
{{guitar solo}}
{{vocals: choir}}
```

Instructions are human-readable and machine-parseable.

They can describe vocal delivery, pronunciation, instrumental performance, production direction, or other contextual behavior.

EPIC supports three instruction contexts.

**Sectional instructions** are attached to section labels and apply to the section:

```text
[Intro {{choral chant}}]
```

**Inline instructions** accompany line content:

```text
The road goes on {{whispered}}
```

**Standalone instructions** appear on their own line:

```text
{{guitar solo}}
```

### Instruction Syntax

An instruction block may contain descriptive phrases:

```text
{{whispered, distant}}
```

Structured key/value instructions:

```text
{{vocals: choir}}
```

Or combinations:

```text
{{whispered, emotion: sorrowful}}
```

Items are separated by commas.

Quoted string literals enclosed in backticks allow commas, colons, and other literal characters to appear within values.

```text
{{social: `like, comment: subscribe`}}
```

Instruction blocks are extensible. Parsers should ignore unknown instruction keys or phrases rather than rejecting an otherwise valid document.

This allows different applications to interpret the instructions relevant to their capabilities.

---

## ⏱️ Timing and Micro-Events

EPICX supports timing beyond the entry level.

**Micro-events** provide precise timing for events occurring within an entry.

They are introduced with `@`, optionally followed by a timestamp.

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

Micro-events can represent lighting cues, instrumental events, visual effects, or other synchronized actions.

If a micro-event omits its timestamp, it inherits the containing entry's starting-time relevance.

Micro-events belong to their containing entry and are not independent top-level records.

When an entry defines an explicit time range, its micro-event timestamps must fall within that range.

### Word-Level Timing

Micro-events can also provide precise timing for individual words.

```text
4
00:49.500 --> 00:51.500
We sing together
@00:49.500 We
@00:49.800 sing
@00:50.200 together
```

The standard payload provides the complete lyric content. The micro-events assign timing to its individual words.

EPICX reserves `{{br}}` for inserting a rendered line break immediately after associated word-timed content.

This enables synchronized lyric presentation, karaoke-style highlighting, animated typography, and other timing-sensitive applications.

### Micro-Event References in `.epic`

Creative authors can also express intended micro-events before timing is assigned.

```text
[Verse]
The lights are fading {{@lights dim}}
```

When represented in `.epicx`, the reference becomes a micro-event associated with the timed entry.

This provides a connection between authoring intent and timed execution.

---

## 🧩 Metadata and Generation

Every EPIC document begins with a header enclosed by lines containing three hyphens:

```text
---
Title: Example Song
Artist: Example Artist
---
```

Two things are required:

- `Title`
- At least one authorship field: `Creator`, `Artist`, or `Author`

Multiple authorship fields may be included.

Optional metadata includes:

| Field | Purpose |
|---|---|
| `BPM` | Tempo |
| `Key` | Musical key |
| `TimeSignature` | Musical time signature |
| `Language` | Language identifier |
| `Tags` | Descriptive tags |
| `Offset` | Timing offset |
| `Production` | Production notes |
| `Version` | Document version |
| `EPICVersion` | EPIC specification version |

### AI Generation Metadata

An optional `[Generation]` subsection provides structured generation instructions.

```text
---
Title: Example Song
Artist: Example Artist
BPM: 120
Key: Am

[Generation]
Styles: Minimal electronic pop,
warm synthesizers, melodic bass,
restrained vocals, steady drums
Persona: Example Vocalist
Energy: 0.75
---
```

Supported generation properties include `Styles`, `UseStyle`, `Persona`, `Cover`, `VocalGender`, `Weirdness`, `StyleInfluence`, `Energy`, and `TempoHint`.

Multiple numbered styles can be defined and selected using `UseStyle`.

The `[Generation]` subsection is optional and, when present, appears last within the document header.

EPIC defines a portable structure for generation metadata without requiring a particular AI provider.

---

## 📝 Freeflows and References

EPIC includes additional authoring features for material that does not belong directly in the performance.

### Freeflows

Freeflows allow notes, ideas, and other information to be stored in labeled sections.

```text
[{&} Arrangement Notes]
Consider a quieter opening.
Bring in the bass before the drums.
:::
```

A labeled Freeflow is terminated by three consecutive colons.

EPIC also supports a single unlabeled Freeflow Notes section at the end of a document:

```text
[{&}]
General production notes.
Ideas for a future revision.
```

The final Freeflow Notes section does not require a terminator.

Freeflows are specific to `.epic`.

### Refs

Refs provide referential notation connecting content to definitions elsewhere in the document.

```text
This section needs another pass::revision

revision:: Review the vocal phrasing before recording.
```

Reference labels use `::` followed by a label without spaces.

Definitions appear toward the end of the document, before the Freeflow Notes section if one is present.

Refs are also specific to `.epic`.

---

## 🎭 Expressive Direction and Emotives

EPIC's instruction system supports expressive and perceptual direction.

An optional Emotives vocabulary provides descriptive terms for qualities such as energy, motion, atmosphere, and intensity.

For example:

```text
[Intro {{calm, dark}}]
```

Or:

```text
[Chorus {{energetic, swell, reveal}}]
```

Emotives describe intended perceptual behavior without prescribing a specific implementation.

A visualizer might interpret an instruction through typography, animation, lighting, or other effects.

Emotives are an extension of EPIC's general instruction system, not a requirement for lyric authoring, performance direction, or synchronization.

---

## ⚙️ For Developers

EPIC is designed to be straightforward to parse and integrate.

Its specification provides:

- Plain-text document formats
- Formal EBNF grammar
- Defined header and section structure
- Sequential timed entries
- Millisecond-precision timestamps
- Extensible instruction blocks
- Scoped micro-events
- Word-level timing
- Document validation rules

The repository includes a reference parser.

Applications can implement the capabilities relevant to their purpose without requiring every EPIC feature.

For example, a lyric editor may support `.epic` authoring, while a visualizer may use `.epicx` for synchronized lyric display.

## 🌐 Applications

| Application | EPIC capability |
|---|---|
| Songwriting | Lyrics, sections, phrasing, and notes |
| AI music generation | Structured generation and performance instructions |
| Lyric visualizers | Timed lines, words, and visual cues |
| Video and animation | Creative direction and timed events |
| Live performance | Synchronized production cues |
| Creative pipelines | Portable structured content |

EPIC is intended to connect creative applications, not replace them.

Adoption can be incremental.

---

## ⚡ First 60 Seconds with EPIC

Create a plain-text file named `song.epic`.

Paste:

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

You've created a structured lyric document with authorship, sections, and phrasing.

Add a performance instruction:

```text
[Chorus {{choral chant}}]
Sing it together
Let the music play
```

Or add a standalone production cue:

```text
{{guitar solo}}
```

When the work needs synchronization, use `.epicx` to represent its content as timed entries.

No specialized editor is required to begin.

---

## Visual Studio Code extension

The specification includes [VS Code language tooling](VSCode/README.md) for `.epic` and `.epicx` files, with theme-aware syntax highlighting and an optional EPIC Blackberries theme.

1. The extension is located in the repo: `VSCode/epic-media-writer-highlighter-*.*.*.vsix`
2. In VS Code, choose **Extensions → … → Install from VSIX…** and select this file.
3. Use your preferred theme, or select **EPIC Blackberries** for the EPIC Media Writer™ palette.

The [extension source, examples, and compatibility tests](VSCode/) are included. See its README for build instructions. This is editor support; the specification and parser define and validate the language.

---

## 📖 Specification

**EPIC Specification 1.6**

The specification defines both `.epic` and `.epicx`, including their document structures, metadata, instructions, timing, micro-events, authoring features, formal grammar, and validation rules.

The specification is the authoritative reference for language behavior.

## 🌱 Vision

Creative intent shouldn't disappear when a project moves between tools.

Lyrics, phrasing, authorship, performance direction, and timing are all parts of the same creative work.

EPIC provides a shared representation that creators can write, developers can interpret, and applications can exchange.

**Write once. Render anywhere.**

## ⭐ Support & Adoption

If EPIC is useful to you:

- ⭐ Star the repository
- 🧪 Build with it
- 🧩 Integrate it
- 📢 Share it

## 📜 License

Copyright © 2026 Jade Rigby

Licensed under the **Apache License, Version 2.0**.