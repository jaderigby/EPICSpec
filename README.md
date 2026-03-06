# EPIC Format

**EPIC (Extended Performance & Intelligence Cues)** is a lightweight,
human‑readable format for writing, generating, and performing structured
lyrics and timed performance cues.

EPIC bridges the gap between:

-   lyric writing
-   AI music generation prompts
-   subtitle / cue formats
-   performance timing systems

while remaining **plain text, deterministic, and version‑control
friendly**.

------------------------------------------------------------------------

# Quick Start

Create a file called:

    song.epic

Example:

    ---
    Title: Elem-en Ellow Vo
    Author: Jade Rigby

    BPM: 128
    Tags: techno, hypnotic

    Production:
    Warehouse reverb
    Dry analog kick

    [Generation]
    Styles:
    1. Deep hypnotic minimal techno
    2. Dark warehouse techno

    UseStyle: 1
    Persona: Female vocalist
    Energy: 0.75
    ---

    [Verse]
    Standing in the pulse of a neon light

    [Chorus]
    Right here — right now

This file can be used for:

-   lyric writing
-   AI music generation prompts
-   structured song documentation

Later it can be aligned to timing using:

    song.epicx

------------------------------------------------------------------------

# Overview

EPIC defines two complementary formats.

  -----------------------------------------------------------------------
  Format                              Purpose
  ----------------------------------- -----------------------------------
  `.epic`                             Authoring format for lyrics,
                                      structure, and generation metadata

  `.epicx`                            Timed performance format for lyric
                                      synchronization and cues
  -----------------------------------------------------------------------

This separation allows creators to write lyrics first and align timing
later.

------------------------------------------------------------------------

# Why EPIC Exists

Modern music workflows span multiple environments:

-   AI music generation
-   DAWs
-   collaboration tools
-   Git repositories
-   subtitle systems
-   lyric video tools

Existing formats usually support only **one part** of this workflow.

EPIC aims to provide a single format that supports:

-   human readability
-   machine parsing
-   AI prompt integration
-   lyric structure
-   performance timing
-   extensibility

------------------------------------------------------------------------

# Key Features

## Structured Song Sections

    [Verse]
    Standing in the pulse of a neon light

    [Chorus]
    Right here, right now

Supported section styles include:

-   Verse
-   Chorus
-   Bridge
-   Intro
-   Outro
-   Final Chorus

------------------------------------------------------------------------

## Generation Metadata

The `[Generation]` block contains parameters useful for AI music
generation.

    [Generation]
    Styles:
    1. Deep hypnotic minimal techno
    2. Dark warehouse techno

    UseStyle: 1
    Persona: Female vocalist
    Energy: 0.75

AI systems can automatically populate generation inputs from these
fields.

------------------------------------------------------------------------

## Production Notes

Production notes describe sonic or musical intent.

    Production:
    Warehouse reverb
    Dry analog kick
    Long evolving pads

Production blocks must contain **at least one non‑empty line**.

------------------------------------------------------------------------

## Instruction Blocks

EPIC distinguishes between **lyrics** and **instructions** using double
curly braces.

    {{ instruction }}

Instruction blocks may appear as:

  Type            Example
  --------------- ----------------------------
  Sectional       `[Verse {{choral chant}}]`
  Contextual      `tear {{ipa: /tɛr/}}`
  Instructional   `{{big drop}}`
  Timestamp       `word{{00:48.633}}`

Instruction items may be:

-   phrases
-   key/value pairs
-   timestamps

Example:

    {{ipa: /tɛr/, whispered}}

------------------------------------------------------------------------

## Word-Level Timing

`.epicx` supports precise lyric synchronization.

Example:

    tear{{00:48.633}} fell{{00:48.800}} from{{00:48.900}} my{{00:49.000}} eye{{00:49.200}}

This enables:

-   karaoke rendering
-   lyric video generation
-   vocal alignment
-   performance cues

------------------------------------------------------------------------

# Example `.epic`

    ---
    Title: Elem-en Ellow Vo
    Author: Jade Rigby

    BPM: 128
    Tags: techno, hypnotic

    Production:
    Warehouse reverb
    Dry analog kick

    [Generation]
    Styles:
    1. Deep hypnotic minimal techno
    2. Dark warehouse techno

    UseStyle: 1
    Persona: Female vocalist
    Energy: 0.75
    ---

    [Verse]
    Standing in the pulse of a neon light

    [Chorus]
    Right here — right now

------------------------------------------------------------------------

# Example `.epicx`

    1
    00:48.633
    [Verse]
    Standing{{00:48.633}} in{{00:48.800}} the{{00:48.900}} pulse{{00:49.200}}

    2
    00:51.000
    [Chorus]
    Right{{00:51.000}} here{{00:51.200}} right{{00:51.400}} now{{00:51.600}}

Entries are separated by **exactly one blank line**.

------------------------------------------------------------------------

# Timestamp Format

EPIC uses a deterministic timestamp format:

    MM:SS.mmm

Examples:

    03:15.200
    142:04.900

Minutes may contain **one or more digits** to support long performances.

------------------------------------------------------------------------

# Design Principles

EPIC follows several core principles.

### Plain Text

Files remain readable and editable in any text editor.

### Deterministic Grammar

The format avoids ambiguous syntax to simplify parsing.

### Separation of Concerns

`.epic` focuses on **authoring**, while `.epicx` focuses on **timed
performance**.

### AI Compatibility

Generation metadata and instructions integrate with AI music systems.

### Extensibility

Unknown properties or instructions may be safely ignored by parsers.

------------------------------------------------------------------------

# Potential Use Cases

EPIC can support many workflows:

-   AI music generation
-   lyric writing
-   synchronized lyrics
-   lyric videos
-   karaoke systems
-   stage cue systems
-   spoken word performances
-   subtitle conversion

------------------------------------------------------------------------

# Implementation

Because EPIC is plain text, implementing a parser typically requires:

1.  Header parsing
2.  Section detection
3.  Instruction block parsing
4.  Optional timing interpretation

No binary formats or complex dependencies are required.

------------------------------------------------------------------------

# Future Tooling

Possible tools around EPIC include:

-   EPIC‑aware lyric editors
-   AI generation import tools
-   subtitle converters
-   lyric video generators
-   DAW plugins
-   synchronization tools

------------------------------------------------------------------------

# License

EPIC is intended to be an **open specification** for creative and
technical communities.
