# 🚀 EPIC --- A Universal Language for Creative Direction

![Version](https://img.shields.io/badge/version-1.0-blue)
![Spec](https://img.shields.io/badge/spec-open-lightgrey)
![Format](https://img.shields.io/badge/format-plain--text-green)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)

> **Write once. Render anywhere.**

**EPIC (Extended Performance & Intelligent Cues)** is a lightweight,
human-readable language for expressing **creative intent, structure, and
timing** across mediums.

------------------------------------------------------------------------

## ⭐ Why EPIC

Creative workflows are fragmented.

-   Lyrics in one tool\
-   Timing in another\
-   AI prompts somewhere else\
-   Rendering somewhere else

EPIC unifies all of it into a **single source of truth**:

> Structure + Meaning + Timing

------------------------------------------------------------------------

## 🔥 What Makes EPIC Different

Most formats describe *what something is*.

EPIC describes:

> **what it should feel like, how it should behave, and when it should
> happen**

------------------------------------------------------------------------

## 🧩 Core Concepts

### 1. Two Formats

  Format     Purpose
  ---------- ----------------------------------
  `.epic`    Authoring (structure + intent)
  `.epicx`   Execution (timing + performance)

------------------------------------------------------------------------

### 2. Instruction Blocks

    {{ instruction }}

The core primitive of EPIC.

-   Human-readable\
-   Machine-parseable\
-   Context-aware

Examples:

    {{whispered}}
    {{camera: slow zoom}}
    {{social: like-subscribe}}

------------------------------------------------------------------------

### 3. Micro-Events

Precise, scoped timing events:

    @00:51.000 {{lights dim}}
    @00:52.000 {{cello swells}}

------------------------------------------------------------------------

### 4. Structured Authorship

Required and deterministic:

    Title: ...
    Artist: ...

Supports attribution, licensing, and collaboration.

------------------------------------------------------------------------

## 🎭 Emotives Module

EPIC includes a canonical **Emotives module** --- a universal vocabulary
for expressing **perceptual intent**.

Emotives do not prescribe *how* something is implemented.

They describe:

> **how something should feel**

This allows the same EPIC file to drive: - typography - animation -
lighting - particle systems - AI generation

------------------------------------------------------------------------

## 🧠 The Model

Emotives are organized as **independent axes**.

Each axis represents a dimension of perception.

You can combine them freely.

------------------------------------------------------------------------

## 🔁 Core Axes

### Energy

-   energetic ↔ calm

Controls activity level and intensity.

------------------------------------------------------------------------

### Movement (Direction)

-   rise ↔ fall\
-   converge ↔ drift

Describes directional motion and flow.

------------------------------------------------------------------------

### Dynamics (Intensity Envelope)

-   swell ↔ decay

Controls buildup vs release.

------------------------------------------------------------------------

### Atmosphere

-   dark ↔ light

Defines tonal weight and mood.

------------------------------------------------------------------------

### Visibility

-   reveal ↔ fade

Controls perceptual emergence and disappearance.

------------------------------------------------------------------------

### Distortion

-   warp ↔ blur

Alters clarity, structure, or meaning.

------------------------------------------------------------------------

### Motion Quality

-   smooth ↔ turbulent

Defines regular vs chaotic motion.

------------------------------------------------------------------------

### Timing Feel

-   tight ↔ loose

Controls alignment to rhythm or timing.

------------------------------------------------------------------------

## 🎯 Modifiers (Semantic Focus)

These do NOT describe motion.

They describe **importance**:

-   strong → primary anchor\
-   emphasis → increased prominence\
-   diminish → reduced prominence

------------------------------------------------------------------------

## 🧩 Example Combinations

``` epic
{{energetic, swell, reveal}}
{{calm, drift, fade}}
{{dark, warp, turbulent}}
{{strong, emphasis}}
```

These combinations form a **multi-dimensional intent vector**.

------------------------------------------------------------------------

## ⚙️ Why This Matters

Instead of saying:

-   "make the text bigger"
-   "add glow"
-   "increase motion"

You say:

``` epic
{{strong, energetic, swell}}
```

And the system interprets it.

------------------------------------------------------------------------

## 🔄 Key Idea

> Emotives separate **intent** from **implementation**

This enables:

-   cross-platform consistency\
-   renderer flexibility\
-   AI alignment\
-   future-proof design

------------------------------------------------------------------------

## 🚀 In Practice

Creators: - describe feeling and evolution

Developers: - map emotives → visuals / behavior

------------------------------------------------------------------------

## 🧠 One Line

> Emotives are the **emotional coordinate system of EPIC**


------------------------------------------------------------------------

## 🚀 Quick Example

``` epic
---
Title: Elem-en Ellow Vo
Artist: Kozzality
BPM: 128
Tags: techno, hypnotic

[Generation]
Styles:
1. Deep hypnotic minimal techno
2. Dark warehouse techno

UseStyle: 1
Energy: 0.75
---

[Verse {{calm, drift}}]
Standing in the pulse of a neon light

{{lights dim}}

[Chorus {{energetic, swell, reveal}}]
Right here — right now
```

------------------------------------------------------------------------

## 🧠 Where EPIC Fits

EPIC is domain-agnostic:

-   🎵 Music & lyrics\
-   🎬 Video & animation\
-   🤖 AI generation\
-   🎭 Live performance\
-   🧩 Creative pipelines

------------------------------------------------------------------------

## ⚙️ Parser Included

This repo includes a reference parser.

Use it to:

-   validate EPIC files\
-   enforce grammar\
-   build tooling\
-   integrate into pipelines

------------------------------------------------------------------------

## 📦 Adoption Strategy

You don't need full implementation.

Start by using EPIC as:

-   metadata\
-   prompt structure\
-   timing format\
-   creative direction layer

Adopt incrementally.

------------------------------------------------------------------------

## 🌱 Vision

EPIC is a foundation layer for:

-   creative tooling\
-   AI systems\
-   rendering engines\
-   cross-platform content pipelines

------------------------------------------------------------------------

# ⚡ First 60 Seconds with EPIC

## 1. Create a file

song.epic

## 2. Paste this

``` epic
---
Title: My First EPIC Song
Artist: You
---

[Verse]
Hello world

[Chorus {{energetic, swell}}]
This is EPIC
```

## 3. You just used:

-   Structure
-   Authorship
-   Instruction blocks

## 4. Add a cue

``` epic
{{lights dim}}
```

## 5. Add timing (optional)

``` epicx
1
00:01.000
[Verse]
Hello world
```

------------------------------------------------------------------------

# 🧭 Who EPIC Is For

EPIC sits at the intersection of **creativity and systems**.

------------------------------------------------------------------------

## 👨‍💻 Why Developers Care

-   Deterministic grammar\
-   Plain text\
-   Predictable parsing\
-   Extensible instruction system

### Example

``` epic
[Chorus {{energetic, swell}}]
Right here — right now
```

------------------------------------------------------------------------

## 🎨 Why Creators Care

-   One file for everything\
-   Expressive control\
-   AI-ready\
-   Timing + direction unified

### Example

``` epic
[Verse {{calm, drift}}]
Standing in the pulse of a neon light

{{lights dim}}
```

------------------------------------------------------------------------

## 🔄 Where They Meet

  Creators write   Developers interpret
  ---------------- ----------------------
  {{energetic}}    animation intensity
  {{lights dim}}   lighting trigger
  @00:51.000       timeline event

------------------------------------------------------------------------

# 🧩 Core Concepts

-   Instruction blocks → {{ }}\
-   Emotives → expressive vocabulary\
-   Micro-events → precise timing\
-   .epic vs .epicx separation

------------------------------------------------------------------------

## ⭐ Support & Adoption

If EPIC is useful to you:

-   ⭐ Star the repo\
-   🧪 Build with it\
-   🧩 Integrate it\
-   📢 Share it

------------------------------------------------------------------------

## 📜 License

Apache 2.0
