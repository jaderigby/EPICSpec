# Lyric / Lyricx Specification

A lightweight, human-readable format for modern music production ---
designed for both traditional workflows and the AI era.

------------------------------------------------------------------------

## Why This Exists

Music production has evolved.

We now work across:

-   DAWs
-   Collaboration tools
-   Git repositories
-   AI music generation platforms
-   Live performance cue systems

But lyric files are still mostly:

-   Plain text with no structure
-   Or closed proprietary formats

**Lyric / Lyricx** is a simple, open standard that bridges:

-   Human readability
-   Producer usability
-   Machine parsing
-   AI integration

Without sacrificing simplicity.

------------------------------------------------------------------------

## The Two Formats

### `.lyric`

A structured lyric format with section labels.

Use when you want:

-   Clear section delineation
-   Producer-friendly organization
-   AI-ready generation metadata
-   Clean readability in plain text

Example:

    ---
    Title: Elem-en Ellow Vo
    Artist: Kozzality

    [Generation]
    Styles: edm, techno, industrial, trip hop
    ---

    [Verse]
    Epulote row span nisa con

    [Chorus]
    Melon car stay voy

Line breaks represent lyrical phrasing.

------------------------------------------------------------------------

### `.lyricx`

An extended format that adds precise timing metadata.

Use when you need:

-   Timestamp-aligned vocals
-   Structured cueing
-   Synchronization with audio
-   AI singing alignment
-   Arrangement reconstruction

Example:

    1
    00:48:633
    [Verse]
    Epulote row span nisa con

Timestamp format:

    MM:SS:mmm

Optional exit time:

    00:48:633 --> 00:52:100

Each entry is separated by exactly one blank line.

------------------------------------------------------------------------

## Header Structure

Both `.lyric` and `.lyricx` share the same header format.

### Required Fields

    Title:
    Artist:

These must appear first, in that order.

### Optional Fields

-   BPM
-   Key
-   TimeSignature
-   Version
-   LXVersion

By convention:

-   `Version` and `LXVersion` appear last in the optional block.
-   A single blank line must precede `[Generation]`.

### Generation Section

    [Generation]
    Styles: ...

-   Must be capitalized exactly as shown.
-   Is optional.
-   Field order is unrestricted.
-   `Styles` is freeform and may contain empty lines.

This allows both AI directives and human production notes.

------------------------------------------------------------------------

## Design Principles

### 1. Human First

Readable in any plain text editor.

### 2. Machine Parsable

Deterministic ordering and timestamp format.

### 3. Producer Friendly

Supports BPM, key, time signature, and arrangement structure.

### 4. AI Compatible

Supports generation directives without locking the format to a single
platform.

### 5. Extensible Without Bloat

Minimal core.
Open-ended generation metadata.

------------------------------------------------------------------------

## Who This Is For

-   Music producers
-   Songwriters
-   AI music creators
-   Tool developers
-   DAW plugin authors
-   Live performance engineers

If you work with lyrics, structure, or timed vocal data --- this format
is for you.

------------------------------------------------------------------------

## Why Not Just Markdown?

Markdown is flexible but:

-   Has no timing structure
-   Has no ordering rules
-   Has no defined musical metadata fields
-   Is inconsistent across implementations

Lyric / Lyricx defines:

-   Order
-   Timing precision
-   Section rules
-   Header semantics

While remaining as readable as Markdown.

------------------------------------------------------------------------

## Status

**Spec Version:** 1.0

This is a stable foundational release.

Future revisions will prioritize backward compatibility.

------------------------------------------------------------------------

## Goals

-   Provide a universal plain-text lyric format
-   Bridge traditional production and AI generation
-   Enable tool integration
-   Remain simple enough to survive long-term

------------------------------------------------------------------------

## License

Copyright 2026 Jade Rigby

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

------------------------------------------------------------------------

## Contributing

Contributions, discussion, and implementation experiments are welcome.

This format is intended to evolve with the industry --- without losing
its simplicity.
