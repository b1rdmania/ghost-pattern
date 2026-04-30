# Ghost Pattern — White Paper & Implementation Plan

**Version:** 1.4  
**Status:** Pre-build — ready for engineering review  
**Last updated:** 2026-04-30  
**Audience:** Lead engineer, design partner, reviewing agents  

---

## 1. Executive summary

**Ghost Pattern** is a browser-first groove learning environment built around **Groove Studies** — curated encounters with one rhythmic idea from the 1988–2008 electronic music canon: house, techno, garage, acid, and the scenes that crossed between them.

A user does not open an empty grid. They open a study: a named, annotated groove from a specific scene and era, with a canonical pattern, authored variations, and a short explanation of what gives it its feel and what not to "correct." From there they listen, edit, mutate, and export.

**The product thesis:** groove knowledge is the product, not the sequencer. The grid is in service of the study. Curation is the moat. Export is a by-product.

**Object hierarchy:**
- **Groove Study** — primary authored object. One focused encounter with a rhythmic idea from a scene tradition.
- **Pack** — editorial collection of Groove Studies from one scene, era, or rhythmic family. The browsing unit.
- **PatternDocument** — canonical technical format. The substrate inside every study. Never surfaces directly in the UI.

**Dig integration** provides the scene taxonomy backbone. Pattern Lab projects Groove Studies onto Dig's existing `enrich.scenes` graph. Phase 1 this is a label and a link. Phase 3 it becomes a browse surface between catalog and rhythm.

**Key technical bets:**
- Own `PatternDocument` — the small canonical format that MIDI, the scheduler, and the UI all project from.
- `GrooveStudy` wraps one or more `PatternDocument`s with annotation, groove profile, kit pairing, and authored variations.
- Tone.js for audio scheduling; `@tonejs/midi` for MIDI I/O.
- Mutation generator: `mutate(doc, params) → doc`. Stateless, seeded, no ML required in Phase 1.
- Static JSON for Phase 1. No backend required until editorial velocity demands it.

---

## 2. Problem statement

Producers, music students, and curious listeners lack a low-friction, opinionated place to:

- Understand how **specific scenes** treat rhythm — swing, ghost snares, off-grid hats, four-on-the-floor variations.
- Hear the **same groove through different kits** to separate timbre from feel.
- **Start from something real** — an archetype — rather than a blank grid or an opaque AI generation.
- Get a pattern **into their DAW** in one step.

Existing tools cluster at two extremes: sample marketplaces with static loops, and full DAWs. Between them sits a gap: a concise, visual, scene-aware drum lab where every pattern has a story.

**Competitive landscape (from research spike, April 2026):**

| Tool | What it does | Gap vs this |
|------|-------------|-------------|
| Drumbit, Lil Beat Maker | Generic browser step sequencers | No scene context, no education, no generator |
| Studio Brootle techno guide | Static pattern guide with MIDI downloads | No interactivity, no editor, no generator |
| io-808, webaudio-drum-machine (GitHub) | TR-808/909 browser emulations | No education, no scenes, no generator |
| ChordChord AI Drum Machine | AI pattern generator | No historical grounding, black box output |
| Google Chrome Music Lab | Educational sequencer | Not genre-specific, not producer-oriented |
| PyDrums | Few-shot MIDI generation from curated datasets | Desktop/CLI only, no UI |

**Conclusion:** No tool currently combines browser step sequencer + scene-specific education + curated Groove Study library + traceable mutation generator + MIDI export. The space is open.

---

## 3. Dig integration

Dig is a Postgres-backed catalog of recorded music releases with Discogs lineage and enriched scene/style metadata (`enrich.scenes`, style tags, artist/label data). Its scope is catalog-wide; it is not filtered to house and techno. **Ghost Pattern scopes editorially** to the 1988–2008 house and techno window — that is a content decision in Pattern Lab, not a constraint in Dig's database. Engineers should not assume a filtered Dig view or a separate schema partition for this integration.

**What Ghost Pattern borrows from Dig:**

| Dig field | Use in Pattern Lab |
|----------|-------------------|
| `enrich.scenes` | Canonical scene tags on every `PatternDocument` |
| Artist / label IDs | Attribution on archetype pages ("associated with this production lineage") |
| Style taxonomy | Pack browser filter surface |
| Release IDs | Optional `digRefs[]` on patterns for "releases from this scene" links |

**What Ghost Pattern does NOT do:**

- Store MIDI or drum patterns in Dig's database. Pattern Lab owns that data.
- Re-implement Dig's catalog. Dig is the metadata authority; Pattern Lab is a consumer.
- Require Dig to be live for Phase 1. Dig refs are optional fields in `PatternDocument` and can be null until the integration is wired.

**Phase 3 browse surface:** A user browsing a scene in Dig can link through to Pattern Lab with that scene pre-filtered. A user in Pattern Lab can link out to releases associated with a pattern's scene. The loop: Dig → Pattern Lab → DAW.

---

## 3.5 The Groove Study — primary authored object

A **Groove Study** is what a user opens, not what they build. The sequencer grid is a window inside the study; the study is not a container bolted onto the sequencer.

**Definition:** one canonical rhythmic idea from a scene or pocket tradition, packaged for listening, editing, comparison, and internalisation.

### Contents

| Field | Purpose |
|-------|---------|
| `title` | Named groove — e.g. "Chicago House — Four Four Foundation" |
| `subtitle` | One-line pedagogical hook — e.g. "The swing that made 1991 feel inevitable" |
| `annotation` | 150 words max. What gives this groove its feel. What not to "correct." |
| `grooveProfile` | Human-language description: swing feel, accent logic, microtiming tendencies |
| `canonicalPattern` | The root `PatternDocument`. Hand-authored. |
| `variations` | 2–4 authored `PatternDocument` variants. Each illustrates one dimension of change. |
| `kitPairing` | Recommended kit ID for this study |
| `sceneTag` | Aligned with Dig `enrich.scenes` vocabulary |
| `era` | e.g. `"1990-1993"` |
| `bpmRange` | e.g. `[120, 128]` — guidance, not enforcement |
| `digSceneRef` | Optional Dig scene ID |
| `packId` | Optional Pack membership |

### Schema

```typescript
interface GrooveStudy {
  id: string;
  version: string;
  title: string;
  subtitle: string;
  annotation: string;             // 150 words max. Feel + what not to correct.
  grooveProfile: {
    swingFeel: string;             // e.g. "lazy behind the beat", "urgent 16th push"
    accentLogic: string;           // Where accents live and why they feel right
    microtimingTendencies: string; // Rushing, dragging, cross-bar patterns
  };
  canonicalPattern: PatternDocument;
  variations: PatternDocument[];   // 2-4. Each has sourceStudyId set in metadata.
  kitPairing: string;              // Kit ID
  sceneTag: string;
  era: string;
  bpmRange: [number, number];
  digSceneRef: string | null;
  packId: string | null;
}

interface Pack {
  id: string;
  title: string;
  description: string;            // One or two sentences on editorial intent.
  sceneTag: string;
  studyIds: string[];
}
```

### User experience of a study

App loads → user is placed inside a study. The study title and subtitle are visible. The canonical pattern is armed and ready — grid populated, BPM set, transport at step 0. The annotation panel sits alongside the grid, not in a separate "learn" mode. The grid is editable from the moment they land. Playback starts on the user's first interaction (play button or grid tap), not on page load — this is a hard browser constraint (Web Audio requires user gesture to start `AudioContext`; see §12 risk "Safari / mobile audio unlock").

From there: listen → understand via annotation → diverge via mutation → export to DAW. The word "studying" is deliberate — it implies attention and iteration, not passive consumption or blank-slate creativity.

### What this is not

The distinction matters enough to state explicitly, because scope creep always targets the nearest adjacent category:

- Not a lesson with slides, progress bars, or quizzes.
- Not a sample pack or loop library.
- Not a DAW. The grid exists to make the groove editable, not to build full arrangements.
- Not a social feed or beat-sharing platform.
- Not a generic preset dumping ground — every study requires a curatorial point of view.

### The hierarchy in practice

A **Pack** groups 3–6 studies from one scene (e.g. "Chicago House, 1990–1993"). It is the browsing and discovery unit. A user might return to a Pack; they will spend time inside a Study. A `PatternDocument` is the data format inside every study — it never surfaces by name in the UI.

---

## 4. Product shape (phased)

### Phase 0 — Concept lock (this document)

- `GrooveStudy` and `Pack` schemas finalised as JSON Schema files in-repo.
- `PatternDocument` v1.0 schema finalised as JSON Schema file in-repo.
- One complete `GrooveStudy` authored per target scene — canonical pattern + at least one variation + annotation + groove profile.
- Groove preset format agreed (see §6 — this is the one upstream dependency).
- OSS spike completed: libraries chosen, ADRs written (see §9).
- Phase 1 one-pager written with explicit out-of-scope list.
- CC0 sample sources identified per scene kit (see §8).

### Phase 1 — Toy (ship something shareable)

The user enters a Groove Study, not an empty grid.

**In scope:**
- **Study entry point:** app loads directly into a Groove Study. Title, subtitle, and annotation visible alongside the grid. Canonical pattern armed and ready at step 0. Playback starts on first user interaction — not on page load (browser audio constraint).
- **Study browser:** browsable list of 12–18 Groove Studies grouped by Pack. Scene tag filter. Each entry shows title, subtitle, and era.
- Step grid editor: per-cell velocity (off / soft / medium / accent). Edits the active `PatternDocument` within the study's playground state.
- Variation switcher: load canonical pattern or any authored variation into the playground. One click, non-destructive.
- One transport: play/stop, BPM slider, loop length selector (1–4 bars).
- Groove preset selector (named presets, not raw %).
- Mutation panel: 3–5 params (swing amount, ghost note density, hat variation, accent shift). Applies to playground pattern; sets `sourceStudyId`.
- Kit selector: 3 scene kits (Chicago house, Detroit techno, UK acid/rave). Each kit is 8–10 CC0 samples.
- Playhead visualisation: highlighted column, triggered cell flash.
- Persistence: URL state (compressed JSON) for sharing. No account required.
- MIDI export: Type 0 `.mid` file, GM channel 10 drum map.

**Out of scope for Phase 1:**
- Multiple simultaneous patterns / layers.
- Accounts, saved projects server-side.
- MIDI input / device I/O.
- AI/ML generation.
- Dig browse integration.
- Per-hit micro-offsets (groove presets only).
- Mobile optimisation (desktop-first).
- Community annotation or user-contributed studies.

**Definition of done:** A producer can enter a Chicago house Groove Study, understand what makes it feel the way it does, mutate the canonical pattern toward something personal, export MIDI, and share a URL that plays back identically.

### Phase 2 — Lab (interpretation layer)

Phase 2 deepens engagement with groove identity. It does not add generic sequencer utility.

- **Side-by-side study compare:** load two studies simultaneously, play them alternately or in a split view. Hear what changes between Chicago house and NYC garage through the same kit.
- **Groove morph:** a slider that interpolates between two groove presets. Shows what changing the underlying feel sounds like without touching the pattern.
- **Accent map visualisation:** overlay showing which steps carry structural weight vs ornamental velocity. Teaches accent architecture.
- **Per-hit micro-offsets** exposed in an advanced panel — for producers who want to go deeper than named presets.
- **Dig scene links:** `digSceneRef` rendered as a link to Dig releases from the same scene.
- **Seeded variation:** "Surprise me" applies random mutation within genre-appropriate parameter bounds. Seeded and shareable.
- **Kit upload:** user can drop WAV/MP3 files to build a custom kit (session-only, no server).

### Phase 3 — Desk

- **Ableton-oriented export:** test round-trip MIDI → Live drum rack → re-import; document note range and clip length conventions.
- **MIDI clock / device I/O** via Web MIDI API where browser support allows.
- **Dig browse integration:** bidirectional links. Scene landing pages in Dig surface both releases and Groove Studies. A study's `digSceneRef` becomes a live link both ways.
- **Community annotation:** producers can submit notes on studies — production context, hardware associations, what to try. Curated before display.

---

## 5. Data schemas

**Object hierarchy:** `GrooveStudy` (§3.5) is the user-facing object. `PatternDocument` is its technical substrate. The UI never exposes `PatternDocument` directly — users interact with studies, not documents.

`PatternDocument` is the single canonical format for rhythm data. MIDI export, the scheduler, the generator, and URL persistence all read and write `PatternDocument`. Nothing else is the source of truth for step data.

### PatternDocument schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PatternDocument",
  "type": "object",
  "required": ["version", "id", "bpm", "timeSignature", "stepsPerBar", "bars", "lanes", "groove", "metadata"],
  "properties": {
    "version": { "type": "string", "const": "1.0" },
    "id": { "type": "string", "description": "UUID v4 recommended for generated/mutated patterns. Hand-authored archetypes may use human-readable IDs (e.g. 'arch-chicago-house-001') for editorial clarity. Either form is valid." },
    "sourceStudyId": {
      "type": ["string", "null"],
      "description": "ID of the GrooveStudy this pattern was generated from. Null on canonical and variation patterns authored directly inside a study."
    },
    "bpm": { "type": "number", "minimum": 60, "maximum": 200 },
    "timeSignature": {
      "type": "object",
      "properties": {
        "numerator": { "type": "integer" },
        "denominator": { "type": "integer" }
      },
      "required": ["numerator", "denominator"]
    },
    "stepsPerBar": {
      "type": "integer",
      "description": "16 = 16th note grid. 32 for higher resolution.",
      "enum": [16, 32]
    },
    "bars": {
      "type": "integer",
      "minimum": 1,
      "maximum": 8
    },
    "lanes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "midiNote"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string", "description": "e.g. 'Kick', 'Snare', 'Closed Hat'" },
          "midiNote": {
            "type": "integer",
            "description": "GM channel 10 note number. Kick=36, Snare=38, CHat=42, OHat=46, Clap=39, etc."
          }
        }
      }
    },
    "steps": {
      "type": "object",
      "description": "Keyed by lane ID. Each value is an array of length (stepsPerBar * bars). 0=off, 1=soft, 2=medium, 3=accent.",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "integer", "enum": [0, 1, 2, 3] }
      }
    },
    "groove": {
      "type": "object",
      "required": ["presetId", "intensity"],
      "properties": {
        "presetId": {
          "type": "string",
          "description": "References a named preset in the groove preset library. e.g. 'straight', 'chicago-house-swing', 'detroit-16th-push'."
        },
        "intensity": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Scalar applied to preset offsets. 0 = straight, 1 = full preset feel."
        }
      }
    },
    "seed": {
      "type": ["integer", "null"],
      "description": "RNG seed used during mutation. If set, mutation is deterministic and the pattern is reproducible from sourceArchetypeId + seed + mutation params."
    },
    "mutationParams": {
      "type": ["object", "null"],
      "description": "The params object passed to mutate() that produced this document. Null on canonical and variation patterns.",
      "properties": {
        "swingAmount": { "type": "number", "minimum": 0, "maximum": 1 },
        "ghostNoteDensity": { "type": "number", "minimum": 0, "maximum": 1 },
        "hatVariation": { "type": "number", "minimum": 0, "maximum": 1 },
        "accentShift": { "type": "number", "minimum": -1, "maximum": 1 }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["title", "sceneTag"],
      "properties": {
        "title": { "type": "string" },
        "packId": { "type": ["string", "null"] },
        "sceneTag": {
          "type": "string",
          "description": "Canonical scene identifier aligned with Dig's enrich.scenes vocabulary. e.g. 'chicago-house', 'detroit-techno', 'uk-acid', 'nyc-garage', 'minimal-techno'."
        },
        "era": {
          "type": "string",
          "description": "Approximate period. e.g. '1990-1993'."
        },
        "description": {
          "type": ["string", "null"],
          "description": "Editorial copy. What makes this groove distinctive. 150 words max."
        },
        "digSceneRef": {
          "type": ["string", "null"],
          "description": "Dig scene ID for linking to releases from this scene."
        },
        "studyId": {
          "type": ["string", "null"],
          "description": "ID of the GrooveStudy this pattern belongs to. Null on user-generated patterns that have been exported and re-imported."
        },
        "role": {
          "type": "string",
          "enum": ["canonical", "variation", "user-generated"],
          "description": "canonical = hand-authored root pattern for a study. variation = hand-authored variant. user-generated = produced by mutate() or manual editing."
        }
      }
    }
  }
}
```

### Example canonical pattern (Chicago house, 1991)

```json
{
  "version": "1.0",
  "id": "arch-chicago-house-001",
  "sourceStudyId": null,
  "bpm": 124,
  "timeSignature": { "numerator": 4, "denominator": 4 },
  "stepsPerBar": 16,
  "bars": 2,
  "lanes": [
    { "id": "kick",  "name": "Kick",        "midiNote": 36 },
    { "id": "snare", "name": "Snare",        "midiNote": 38 },
    { "id": "clap",  "name": "Clap",         "midiNote": 39 },
    { "id": "chat",  "name": "Closed Hat",   "midiNote": 42 },
    { "id": "ohat",  "name": "Open Hat",     "midiNote": 46 }
  ],
  "steps": {
    "kick":  [3,0,0,0, 0,0,0,0, 3,0,0,0, 0,0,0,0,  3,0,0,0, 0,0,0,0, 3,0,0,0, 0,0,0,0],
    "snare": [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0,  0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
    "clap":  [0,0,0,0, 2,0,0,0, 0,0,0,0, 2,0,0,0,  0,0,0,0, 2,0,0,0, 0,0,0,0, 2,0,0,0],
    "chat":  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,  1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    "ohat":  [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1,  0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1]
  },
  "groove": {
    "presetId": "chicago-house-swing",
    "intensity": 0.7
  },
  "seed": null,
  "mutationParams": null,
  "metadata": {
    "title": "Chicago House — Four Four Foundation",
    "packId": "pack-chicago-house",
    "sceneTag": "chicago-house",
    "era": "1990-1993",
    "description": "The foundational four-on-the-floor pattern of early Chicago house. Kick on every beat, snare and clap locked to beats 2 and 4, hats running 8th notes with swing pulled toward that lazy-behind feel. Open hat lands on the 'and' of 4. Pattern loops every two bars to give the kick room to breathe.",
    "digSceneRef": "dig-scene-chicago-house",
    "studyId": "study-chicago-house-001",
    "role": "canonical"
  }
}
```

---

## 6. Groove preset format

This is the most upstream dependency in the system. The scheduler reads it, the generator mutates it, the editor displays it. **Define this before writing any audio code.**

### Structure

```typescript
interface GroovePreset {
  id: string;           // e.g. "chicago-house-swing"
  name: string;         // Display name
  description: string;  // One sentence — what feel does this produce
  stepOffsets: number[];// Per-step timing offset in ticks (+/-). Length = stepsPerBar.
                        // Positive = late, negative = early.
                        // At intensity=1, applied as-is. Scaled linearly by intensity.
  velocityOffsets: number[]; // Per-step velocity modifier (+/-). Clamped to 0–3 after application (no wrapping).
}
```

**v1 periodicity constraint:** In v1, groove repeats every bar. `stepOffsets.length` must equal `stepsPerBar`. The scheduler applies `stepOffsets[currentStep % stepsPerBar]` — a 2-bar or cross-bar feel cannot be expressed in a v1 preset without a schema version bump. This is an explicit v1 limitation, not a bug to work around in the scheduler.

**16 vs 32 step presets:** All presets are authored at `stepsPerBar = 16`. If a pattern uses `stepsPerBar = 32`, the preset is upsampled by repeating each offset twice: `offsets32[i] = offsets16[Math.floor(i / 2)]`. This upsample rule lives in the shared groove module (§9) and must not be reimplemented elsewhere.

**`velocityOffsets` clamping:** Applied additively to the 0–3 velocity scale. Result is `Math.max(0, Math.min(3, Math.round(stepVelocity + velocityOffset)))`. No wrapping. A step at velocity 3 with an offset of +1 stays at 3. A step at velocity 0 (off) is not activated by a positive offset — off steps are structurally off.

**Shared module requirement — two separate utilities, not one:** Groove application is split into two exported functions in a shared `groove.ts` module:

```typescript
// Returns timing offset in seconds for a given step. Used by scheduler and exportMIDI.
function grooveTimingOffsetSeconds(groove: GrooveRef, stepIndex: number, bpm: number, stepsPerBar: number): number;

// Returns adjusted velocity (0–3, clamped) for a given step. Used by scheduler and exportMIDI.
function grooveVelocity(rawVelocity: number, groove: GrooveRef, stepIndex: number, stepsPerBar: number): number;
```

Both must be used by the live scheduler and by `exportMIDI`. Both must have unit tests. A `grooveOffsetSeconds` function that also carries velocity semantics is a type-level mistake — timing is measured in seconds, velocity is a dimensionless 0–3 integer, and they should never share a function boundary. This is the highest-risk integration point in the system.

### Tick resolution

At 16 steps/bar: 1 step = 1 beat / 4. With 480 MIDI PPQ standard, 1 step = 120 ticks. Offset range: -60 to +60 ticks (±50% of one step). For audio scheduling in Tone.js: convert ticks to seconds at runtime using current BPM.

### Starter preset library (Phase 1 minimum)

| Preset ID | Description |
|-----------|-------------|
| `straight` | All offsets zero. Reference point. |
| `chicago-house-swing` | 8th-note triplet push. Odd steps (off-beats) delayed ~30 ticks. Velocity dip on weak steps. |
| `detroit-techno-push` | Subtle 16th-note rush on steps 3 and 11. Industrial urgency. |
| `uk-acid-shuffle` | Hard swing on hats. Steps 3, 7, 11, 15 pulled back 40 ticks. |
| `nyc-garage-lilt` | Soft swing, slight velocity accent on steps 5 and 13. Gospel-influenced warmth. |
| `minimal-straight` | Near-straight with fractional velocity humanisation only. Grid-locked feel. |

**Authoring process:** Each preset should be validated by playing it through the scheduler at intensity=1 and comparing to a reference recording from the target scene. This is an editorial act, not an engineering one. Recommend building the internal groove editor (§11.1) before authoring more than 2 presets — hand-writing offset arrays without visual feedback produces inconsistent results.

---

## 7. Generator design

The generator is a **pure function**. No network calls. No ML. No side effects.

```typescript
interface MutationParams {
  swingAmount: number;       // 0–1. Overrides groove preset intensity.
  ghostNoteDensity: number;  // 0–1. Probability of inserting ghost notes on snare/hat lanes.
  hatVariation: number;      // 0–1. Probability of flipping hat steps (open↔closed, omit, add).
  accentShift: number;       // -1–1. Redistributes accent (velocity=3) steps by ±1 step.
  seed: number;              // Integer seed for seeded RNG. Determines all random choices.
}

function mutate(source: PatternDocument, params: MutationParams): PatternDocument;
```

The source is always a `PatternDocument` with `role: "canonical"` or `role: "variation"` from a `GrooveStudy`. The output has `role: "user-generated"` and `sourceStudyId` set to the study the source belongs to.

### Mutation rules

**swingAmount:** Writes directly to `groove.intensity` on the output document. Does not touch `groove.presetId`. The UI exposes this as a single "swing" slider — there is no separate `groove.intensity` control visible to the user. When a user loads a generated pattern and adjusts swing in the editor, they are editing `groove.intensity` on the current doc, not re-running `mutate()`. These are the same field; there is no precedence ambiguity.

**ghostNoteDensity:** For each step in the snare lane where `steps[step] === 0`, roll seeded RNG against `ghostNoteDensity`. If triggered, insert a ghost note (velocity = 1). Same logic for closed hat. Never ghosts the kick. Ghost inserts happen before `accentShift` is applied — accents are shifted after the full step array is populated, so ghosts on empty steps cannot interfere with accent positions.

**hatVariation:** For each closed hat step, roll against `hatVariation`. If triggered: if step is on, flip to off; if step is off and adjacent to an on step, insert with velocity 1. Constrains open hat via choke logic — if closed hat is on at step N, open hat at step N is cleared (909 choke behaviour). Hat mutation runs after ghost insertion and before accent shift.

**accentShift:** For each accent step (velocity = 3) in all non-kick lanes, shift its position by ±1 step within its beat group (steps 0–3, 4–7, etc.). Clamps to beat group boundaries. Prevents accents from crossing beat lines unintentionally. If the destination step was a ghost (velocity = 1 inserted by ghostNoteDensity), the accent overwrites it.

**Execution order:** `ghostNoteDensity` → `hatVariation` → `accentShift` → `swingAmount`. Fixed order ensures reproducibility given the same seed.

### Kick locked / presetId locked — explicit product rationale

The kick pattern and groove preset ID never change during mutation. This is a **product decision**, not an engineering constraint:

- The kick is the genre fingerprint. Changing it would blur scene identity across mutations.
- Locking `presetId` keeps mutations within the scene's rhythmic vocabulary — a Chicago house pattern mutated 10 times still feels like Chicago house.

The limit this creates: a user who wants a kick variant must load a different Groove Study or switch to a variation. This is by design. **Multiple Groove Studies per scene are expected** — the Chicago house Pack should include studies with different kick characters (syncopated, rolling, half-time) rather than exposing kick mutation as a generator param. If a reviewer believes `presetId` is too restrictive for repeat play, the solution is richer study variety, not unlocking the param.

### Reproducibility

The output `PatternDocument` stores `seed` and `mutationParams`. Given the same **source `PatternDocument` ID** + seed + params, `mutate()` always returns the same document. The key is the source pattern's `id`, not `sourceStudyId` + role — two variations in the same study share a `studyId` and `role: "variation"` and would collide under that scheme. The short URL form encodes `{ sourcePatternId, seed, mutationParams }` instead of the full step array — but only when the document is a pure `mutate()` output with no post-mutate edits. Any manual cell edit, BPM change, or groove change after mutation invalidates the short form; see §9 for the full URL state scheme including when `bpm`, `groove`, and `steps` must be encoded.

### What the generator deliberately does NOT do

- Change BPM.
- Change the kick pattern. Kick is structural — genre identity lives in the kick.
- Change scene tag or groove preset ID (only intensity).
- Insert notes that violate the step grid resolution.
- Generate from nothing. There is always a source pattern from a Groove Study.

---

## 8. Sample kit strategy

### Kit structure

Each kit is a named collection of 8–10 WAV files mapped to GM channel 10 note numbers. Stored in `/public/kits/{kit-id}/` as self-hosted static assets.

```
/public/kits/chicago-house/
  kick.wav      → note 36
  snare.wav     → note 38
  clap.wav      → note 39
  chat.wav      → note 42
  ohat.wav      → note 46
  rim.wav       → note 37
  cymbal.wav    → note 49
  manifest.json
```

`manifest.json` defines the kit name, scene tag, notes on sound character, and license attribution.

### Phase 1 kits (3)

| Kit | Scene | Source strategy |
|-----|-------|----------------|
| `chicago-house` | Chicago house, 1990–1993 | CC0 909-style samples from Freesound (CC0 filter). Curate 8 samples that sit in the pocket together. |
| `detroit-techno` | Detroit techno, 1990–1996 | CC0 808-style kick + processed electronic snare/hat from Freesound. |
| `uk-acid` | UK acid/rave, 1991–1994 | Synthesised 909-clone sounds. Dustyroom Fake Acoustic Kit (CC0, 504 samples) as source material. |

### Licensing posture

- **Phase 1:** CC0 only. No "royalty-free" without explicit license confirmation. No samples derived from commercial recordings.
- **Source priority:** Freesound.org (CC0 filter) → Dustyroom Fake Acoustic Kit (CC0) → Kenneth Reitz Infinite State Pack (MIT-like) → synthesised via Tone.js for anything not found.
- Every kit ships with a `manifest.json` that lists source URL and license for every sample.
- Do not use: BVKER, LANDR, MusicRadar sample packs until licenses are confirmed in writing.

### Synthesis fallback

If a convincing CC0 sample cannot be sourced for a specific sound, synthesise it using Tone.js (`MembraneSynth` for kick, `NoiseSynth` for snare, `MetalSynth` for hats). Label these kits as "Synthesised" in the UI. Phase 2 can replace with sampled versions.

---

## 9. Technical architecture

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React + TypeScript + Vite | Fast dev server, small bundle, TypeScript for schema safety |
| Audio scheduling | Tone.js (`Transport`, `Sequence`, `Sampler`) | `Transport` handles BPM, groove offset application, and loop; `Sampler` handles kit loading with GM note map |
| MIDI I/O | `@tonejs/midi` | Same ecosystem, handles GM channel 10 drum maps, R/W, actively maintained |
| State | Zustand | Minimal; PatternDocument is the store's core atom |
| URL persistence | LZ-string compressed JSON → base64 URL param | Keeps URLs shareable without a server |
| Styling | Tailwind CSS | Utility-first, no design system overhead for Phase 1 |
| Hosting | Vercel static | No backend needed Phase 1 |

### Audio pipeline

```
Transport tick (Tone.js)
  → currentStep = tick % totalSteps
  → stepInBar = currentStep % stepsPerBar
  → for each lane:
      rawVelocity = steps[lane][currentStep]          // 0-3
      if rawVelocity > 0:
        velocity     = grooveVelocity(rawVelocity, doc.groove, stepInBar, doc.stepsPerBar)
        timingOffset = grooveTimingOffsetSeconds(doc.groove, stepInBar, doc.bpm, doc.stepsPerBar)
        scheduleTime = Tone.Transport.toSeconds(tick) + timingOffset
        sampler[lane].triggerAttack(lane.midiNote, scheduleTime, velocityToGain(velocity))
```

Both `grooveTimingOffsetSeconds` and `grooveVelocity` are called identically in `exportMIDI`. Both live in `groove.ts`. A preset that defines non-zero `velocityOffsets` but is only applied via one of the two call sites is a bug. `groove.ts` is the enforcement point — never inline the offset logic in the scheduler or exporter.

**Clock stability:** Use `Tone.Transport` (AudioContext-based, not setTimeout). Tab background throttling is mitigated by Tone's lookahead scheduling. Target lookahead: 100ms. If AudioWorklet scheduling is needed for sub-millisecond precision in Phase 2, benchmark first — overkill for Phase 1.

### State shape

```typescript
interface AppState {
  activeStudy: GrooveStudy;          // The study the user is currently inside
  playgroundDoc: PatternDocument;    // Active pattern being edited/played (canonical, variation, or user-generated)
  isPlaying: boolean;
  currentStep: number;               // For playhead
  activeKitId: string;
  groovePresets: GroovePreset[];
  packs: Pack[];                     // Loaded from static JSON — browsing surface
  studies: GrooveStudy[];            // All loaded studies, indexed by id
  history: PatternDocument[];        // Undo stack on playgroundDoc (last 20)
}
```

### URL state scheme

On every doc change: serialise `{ sourcePatternId, seed, mutationParams, bpm, groove, steps }` → LZ-compress → base64 → set as `?p=` query param. On load: parse param → reconstruct `PatternDocument`. If no param: load the default Groove Study.

**Short form (clean mutations only):** encode `{ sourcePatternId, seed, mutationParams }` — omits `bpm`, `groove`, and `steps` because those can be reproduced deterministically from `mutate(sourceLookup(sourcePatternId), params, seed)`. Valid only when the document is a pure `mutate()` output with no subsequent edits.

**Full form (everything else):** encode `{ sourcePatternId, seed, mutationParams, bpm, groove, steps }`. Required when the user has made any manual edit, changed BPM, or adjusted the groove preset after mutation. The UI must detect departure from clean-mutation state and silently promote to full form — never lose a BPM change in a shared URL.

### MIDI export

```typescript
function exportMIDI(doc: PatternDocument): ArrayBuffer {
  const midi = new Midi();
  const track = midi.addTrack();
  const secondsPerStep = (60 / doc.bpm) / (doc.stepsPerBar / 4);
  const totalSteps = doc.stepsPerBar * doc.bars;

  doc.lanes.forEach(lane => {
    doc.steps[lane.id].forEach((velocity, stepIndex) => {
      if (velocity === 0) return;
      const time = stepIndex * secondsPerStep;
      const adjustedVelocity = grooveVelocity(velocity, doc.groove, stepIndex, doc.stepsPerBar);
      const timingOffset = grooveTimingOffsetSeconds(doc.groove, stepIndex, doc.bpm, doc.stepsPerBar);
      track.addNote({
        midi: lane.midiNote,
        time: time + timingOffset,
        duration: secondsPerStep * 0.9,
        velocity: velocityToMidi(adjustedVelocity) / 127
      });
    });
  });
  return midi.toArray();
}
```

Output: Type 0 MIDI, channel 10, GM drum map. Tested against: Ableton Live 11+ drum rack, Logic Pro X, FL Studio 21.

---

## 10. Content strategy — Groove Study library

### Phase 1 target: 12–18 Groove Studies across 4–6 Packs

Intentional, not encyclopedic. 2–4 studies per scene is enough to feel curated. More dilutes quality and editorial focus before the authoring process is proven.

| Scene / Pack | Studies | Era | BPM range | Differentiator from adjacent scenes |
|-------------|---------|-----|-----------|-------------------------------------|
| Chicago house | 3–4 | 1990–1993 | 120–128 | Four-on-the-floor with swing, clap on 2+4, open hat on the "and" of 4. Warmer, more soulful feel than NYC garage despite BPM overlap. Studies should cover: foundation groove, rolling kick variant, late-bar open hat variation. |
| Detroit techno | 3–4 | 1990–1996 | 130–138 | Industrial rigidity. Hats aggressive and mechanical. Kick accented but not swung. Distinct from minimal techno by density and accent weight. Studies should include a hi-hat-dominant study alongside the standard kick-snare architecture. |
| UK acid / rave | 2–3 | 1991–1994 | 130–140 | Hard swing on hats, snare often off-grid, energy is urgent not hypnotic. BPM overlap with Detroit is real — differentiation is groove preset and hat logic, not tempo. |
| NYC garage | 2–3 | 1990–1995 | 118–124 | Gospel-inflected lilt, kick syncopation more varied than Chicago house, clap humanised. Despite BPM overlap with Chicago house, the swing character and kick patterns are the tell. |
| Minimal techno | 2–3 | 1999–2005 | 130–134 | Near-grid. Velocity variation is the primary textural tool. Sparse by intent — fewer on-steps than all other scenes. Temporal boundary (post-1999) is the clearest differentiator from Detroit techno. |

**Producer test:** Before finalising the study set, a production-knowledgeable reviewer should answer: *"If you loaded these studies through the same kit, would any two scenes feel interchangeable?"* If yes, the problem is in the studies or groove presets — fix before launch. Chicago/NYC garage BPM overlap is the most likely failure point; the fix is swing character and kick variation, not BPM separation.

### Authoring process per Groove Study

Each Groove Study requires:

1. **Editorial brief** — one sentence on the specific rhythmic idea this study teaches. Not "Chicago house pattern" but "the lazy-behind-the-beat 8th note swing that defines early Trax Records productions."
2. **Canonical `PatternDocument`** — hand-authored. No MIDI transcription of specific commercial recordings. The pattern should be playable and feel right through all 3 Phase 1 kits.
3. **2–3 authored variations** — each illustrating one dimension of the groove. Examples: ghost note density, hat rhythm alternate, accent position shift, kick syncopation variant. Each variation has `role: "variation"` and `sourceStudyId` set.
4. **Groove profile** — `swingFeel`, `accentLogic`, `microtimingTendencies` in human language. Not technical descriptions — these surface in the UI.
5. **Annotation** — 150 words max. What makes this groove distinctive. What not to "correct." Tone: producer talking to producer, not textbook.
6. **Groove preset** — choose from library. Tune `intensity`. Validate by ear at intensity=1 against the feel described in the annotation.
7. **Kit pairing** — confirm the canonical pattern works as intended through the recommended kit. Adjust velocities if needed.
8. **Scene credibility check** — second set of ears confirms the scene attribution holds.
9. **Minimal techno boundary note** — for minimal techno studies specifically, `annotation` must articulate the sonic boundary from Detroit techno. The temporal marker (post-1999) alone is not enough.

### Editorial standards — avoiding caricature

The risk in scene-tagged content is flattening a rich tradition into a cliché. Each study must:

- Make a specific claim about rhythm, not a general claim about genre.
- Acknowledge what varies within the scene, not only what is canonical.
- Tell a producer something they can act on — not just historical context.

If a study annotation reads like a Wikipedia summary, it fails the editorial standard.

### Legal posture

- All canonical patterns and variations are **original compositions** inspired by scene traditions. They are not transcriptions of specific commercial recordings.
- Copy reads "inspired by the [X] tradition" — not "as heard on [specific track]."
- No cover art, trademarks, or artist names in study metadata without explicit permission.
- `digSceneRef` links to Dig scene pages, not to specific release pages (avoids implying direct musical lineage from a specific recording).

---

## 11. Open problems (for reviewing agents)

### 11.1 Groove preset authoring tooling

How do we efficiently author and validate groove presets? Options:
- (a) Hand-write offset arrays, validate by ear in the scheduler.
- (b) Build a small groove editor UI (visualise offset curve, scrub intensity) as a Phase 0.5 internal tool.
- (c) Extract groove curves from existing MIDI files (risky — IP questions on the MIDI source).

**Recommendation:** (b) for Phase 1 launch quality. Offset arrays authored blindly produce inconsistent results.

### 11.2 Choke groups

909-style hi-hats choke: open hat silences closed hat at the same step and vice versa. This needs to be modelled in both the scheduler and the generator.

Current plan: `Tone.Sampler` doesn't natively support choke groups. Workaround: maintain a `chokeMap` in lane definitions (e.g. `{ chat: ['ohat'], ohat: ['chat'] }`). On trigger of any lane in a choke group, call `sampler.triggerRelease()` on all others.

**Outstanding prototype requirements before this is considered solved:**

1. **Same-tick race:** Two choke-group lanes triggered at the same scheduled time. Define ordering — closed hat always wins when both are scheduled identically (matches 909 behaviour where closed hat cuts open hat).
2. **Open-hat decay:** `triggerRelease()` is immediate. Real 909 open hat has a short natural decay after choke. Prototype must define whether to schedule release at `time + epsilon` (e.g. 5ms) or accept the abrupt cut.
3. **Golden test:** One mock timeline (e.g. steps: `ohat on step 2, chat on step 3`) with expected output — `ohat` playing, then `ohat` cut at step 3's schedule time when `chat` triggers. Isolate in a `chokeScheduler` module with this test before integrating into the main audio pipeline.

### 11.3 URL length for full step arrays

At 32 steps/bar × 2 bars × 6 lanes × 2 bits/step = 768 bits of raw step data. After LZ-compression and base64, this typically produces ~200 character URLs — well within limits. However, at 32 steps and 4 bars it approaches 400 characters. Test at maximum complexity before committing to URL-only persistence.

**Hard cap and fallback UX required:** Before shipping, define a maximum URL character limit (recommend 2000 — safe across browsers and link-shorteners). If the serialised state exceeds the cap, the UI must: (1) warn the user, and (2) offer a fallback — "Copy pattern JSON" to clipboard. Do not silently truncate or fail. The fallback UX should be designed before the URL scheme is finalised, not after it breaks in production.

### 11.4 Mobile

Phase 1 is desktop-first. Grid cells at 16 steps need ~30px per cell minimum for tap targets on mobile. At 16 cells + lane labels + controls, this requires horizontal scroll on mobile. Decision required before Phase 2: native scroll vs pinch-zoom vs collapsible mobile layout. Motif codebase has iOS audio unlock handling — audit that before building Phase 1 audio init.

### 11.5 Seeded RNG choice

`Math.random()` is not seedable. Options: `mulberry32` (100 lines, well-tested, MIT), `seedrandom` npm package (2KB, MIT). Recommend `mulberry32` inline — zero dependency, fits in a utility file.

---

## 12. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Editorial voice becomes taxonomic, not cultural | High if unchecked | Use `annotation` and `grooveProfile` as quality gates. If a study reads like a Wikipedia summary, it fails. Producer review before launch. |
| Groove presets sound wrong / generic | High without tooling | Build groove editor (§11.1) before content authoring. Validate every preset by ear at intensity=1 against a reference feel. |
| IP exposure from pattern similarity to specific recordings | Medium | Original compositions only; legal once-over on study copy before launch. |
| Scope creep toward DAW | High (music tools always) | Phase gates enforced. Generator stays stateless. No live recording, no arrangement view in Phase 1 or Phase 2. |
| Studies feel interchangeable across scenes | Medium | Producer test (§10) before launch. Fix is more distinct groove presets + kick variation, not more patterns. |
| Safari / mobile audio unlock | Medium | Audit Motif iOS handling early. Standard Tone.js `start()` on user gesture required. |
| CC0 sample quality | Medium | Curate carefully. Synthesis fallback for anything that doesn't sit right in the kit. |
| Choke group implementation complexity | Low-medium | Isolate in a `chokeScheduler` module. Unit test against expected 909 behaviour. |

---

## 13. Recommended immediate next steps

**In order:**

1. **Agree groove preset format** (§6) with lead engineer — this unblocks everything else. One half-day.
2. **Finalise schemas** — `GrooveStudy`, `Pack`, and `PatternDocument` as JSON Schema files in `/schema/`. One day. These are the contract everything else builds against.
3. **OSS spike** — `@tonejs/midi` vs `midi-file` bundle test; Tone.js `Transport` + `Sampler` prototype with one kit and one hardcoded `PatternDocument`; `mulberry32` seeded RNG utility. Two days. Output: short ADR doc.
4. **Kit curation** — Source CC0 samples for 3 Phase 1 kits from Freesound. Write kit `manifest.json` files. One to two days.
5. **Author 3 Chicago house Groove Studies** — editorial brief + canonical `PatternDocument` + 2 variations + annotation + groove profile per study. Validate through scheduler prototype. Two days. This is the hardest step to estimate — the quality of these studies determines whether the product works.
6. **Build groove editor internal tool** (§11.1) — before authoring the remaining studies. One to two days. Don't author more than 2 presets without it.
7. **Phase 1 one-pager** — explicit scope and out-of-scope list for sprint planning. Half day.
8. **Legal once-over** — study copy, kit licenses, "inspired by" attribution posture. Before any public deployment.

---

## 14. Document control

- **Predecessor:** `ghost-pattern-handoff-whitepaper.md` (concept / decision table)
- **This document supersedes:** §6 (decisions now resolved), §7.5 (OSS reconnaissance now complete), §7.6 (competitive landscape now complete)
- **Successor:** `implementation-plan-phase1.md` (sprint breakdown, once §13 steps 1–3 complete)
- **Authoring context:** Design dialogue + Perplexity competitive research (April 2026) + Dig schema review + Motif README analysis
- **v1.4 changes:** Five surgical fixes from engineering review. (1) Reproducibility key corrected — source pattern `id` is the unique key, not `sourceStudyId + role`; two variations in the same study share a study ID and would have collided. (2) URL scheme updated throughout — `sourceArchetypeId` replaced with `sourcePatternId`; short-form and full-form URL logic specified explicitly including the rule that BPM changes force full encoding. (3) Autoplay-on-load fixed in §3.5 and §4 Phase 1 — pattern is "armed and ready at step 0," playback starts on first user interaction, not page load; browser AudioContext constraint noted. (4) Shared groove module split into two typed utilities: `grooveTimingOffsetSeconds` (seconds) and `grooveVelocity` (0–3 integer) in `groove.ts`; audio pipeline pseudocode and `exportMIDI` updated to use both; stale `grooveOffsetSeconds` name removed. (5) §1 scope sentence broadened to match actual scene list: "house, techno, garage, acid, and the scenes that crossed between them."
- **v1.3 changes:** Primary authored object established as **Groove Study**. Added §3.5 (full definition, schema, user experience, hierarchy). §1 executive summary rewritten around Groove Studies and the `GrooveStudy / Pack / PatternDocument` hierarchy. §4 phases reframed: user enters a study not an empty grid; Phase 1 scope updated to 12–18 studies; Phase 2 reframed around interpretation depth (side-by-side compare, groove morph, accent map visualisation) rather than generic sequencer features. §5 renamed to "Data schemas"; `GrooveStudy` and `Pack` added; `PatternDocument` demoted to technical substrate; `isArchetype` replaced with `role` enum; `studyId` added; `sourceArchetypeId` renamed `sourceStudyId`. §7 generator updated to reference `sourceStudyId` and study canonical patterns. §9 state shape updated to `activeStudy` and `playgroundDoc`. §10 content strategy renamed to "Groove Study library"; target revised to 12–18 studies across 4–6 Packs; authoring process expanded to include all Groove Study fields; editorial standards section added. §12 risks: added "editorial voice becomes taxonomic" and "studies feel interchangeable" risks. §13 next steps reordered around schema-first → OSS spike → kit curation → 3 Chicago house studies → groove editor.
- **v1.2 changes:** §4 Phase 0 cross-ref corrected (groove is §6, not §7). `PatternDocument.id` schema relaxed — UUID recommended for mutations, human-readable IDs permitted on hand-authored archetypes. §3 Dig scope clarified — Dig is catalog-wide, Pattern Lab scopes editorially to 1988–2008. §9 audio pipeline updated to apply `velocityOffsets` with correct clamping; shared module mandate extended to cover both timing and velocity. §7 reproducibility clarified — short URL form only valid for pure `mutate()` output; BPM and manual edits force full encoding (cross-ref to §9).
- **v1.1 changes:** §6 — added v1 periodicity constraint, 16→32 upsample rule, `velocityOffsets` clamping spec, shared module mandate. §7 — clarified `swingAmount`/`groove.intensity` single-field precedence, documented mutation execution order, formalised kick-locked / presetId-locked product rationale. §11.2 — added choke prototype requirements (race condition, open-hat decay, golden test). §11.3 — added URL hard cap and fallback UX requirement. §10 — added scene differentiator column to archetype table, producer test question, minimal techno description requirement.

---

*End of white paper.*
