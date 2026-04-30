# Ghost Pattern — Execution Brief

**Version:** 1.0  
**Derived from:** `ghost-pattern-whitepaper.md` v1.4  
**Last updated:** 2026-04-30  
**Audience:** Lead engineer, build team  

This document is for builders. It contains decisions, schemas, rules, and constraints — not rationale. For rationale, see the whitepaper. Nothing in this brief should be re-decided without updating both documents.

---

## 1. Object hierarchy

| Object | Role | Who sees it |
|--------|------|-------------|
| `GrooveStudy` | Primary authored object. The unit a user opens and spends time inside. | UI — everywhere |
| `Pack` | Editorial collection of Groove Studies. The browsing unit. | UI — study browser |
| `PatternDocument` | Canonical rhythm data format. Substrate inside every study. | Never directly in UI |

---

## 2. Schemas

### GrooveStudy

```typescript
interface GrooveStudy {
  id: string;
  version: string;
  title: string;
  subtitle: string;
  annotation: string;             // 150 words max
  grooveProfile: {
    swingFeel: string;
    accentLogic: string;
    microtimingTendencies: string;
  };
  canonicalPattern: PatternDocument;
  variations: PatternDocument[];   // 2-4. Each has role: "variation" and sourceStudyId set.
  kitPairing: string;
  sceneTag: string;
  era: string;
  bpmRange: [number, number];
  digSceneRef: string | null;
  packId: string | null;
}
```

### Pack

```typescript
interface Pack {
  id: string;
  title: string;
  description: string;
  sceneTag: string;
  studyIds: string[];
}
```

### PatternDocument

Full JSON Schema in `/schema/PatternDocument.v1.json`. Key fields:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | UUID for mutations. Human-readable OK for hand-authored canonicals (e.g. `arch-chicago-house-001`). |
| `sourceStudyId` | string \| null | Study containing the source pattern this was mutated from. Set on `user-generated` patterns only. Not the reproducibility key — use source `PatternDocument.id` for that. Null on canonical and variation patterns. |
| `role` | `"canonical"` \| `"variation"` \| `"user-generated"` | Determines UI treatment and mutation eligibility. |
| `bpm` | number | 60–200. |
| `stepsPerBar` | 16 \| 32 | 16 for Phase 1. |
| `bars` | integer | 1–8. |
| `lanes` | array | `{ id, name, midiNote }`. GM channel 10 defaults. |
| `steps` | object | Keyed by lane ID. Values: arrays of 0–3 (0=off, 1=soft, 2=medium, 3=accent). |
| `groove` | `{ presetId, intensity }` | `intensity` 0–1. |
| `seed` | integer \| null | RNG seed. Set on all `mutate()` outputs. |
| `mutationParams` | object \| null | Params passed to `mutate()`. Null on canonical/variation. |
| `metadata.studyId` | string \| null | Study membership. |
| `metadata.sceneTag` | string | Aligned with Dig `enrich.scenes`. |
| `metadata.digSceneRef` | string \| null | Optional Dig scene ID. |

---

## 3. Groove preset format

```typescript
interface GroovePreset {
  id: string;
  name: string;
  description: string;           // One sentence on feel
  stepOffsets: number[];         // Length = stepsPerBar. Ticks (+/-). Positive = late.
  velocityOffsets: number[];     // Length = stepsPerBar. Applied additively, clamped 0-3.
}
```

**Rules:**
- v1 groove repeats every bar. `stepOffsets.length === stepsPerBar`. No cross-bar feel without schema version bump.
- All presets authored at `stepsPerBar = 16`. Upsample to 32: `offsets32[i] = offsets16[Math.floor(i / 2)]`. Lives in `groove.ts` only.
- `velocityOffsets` clamping: `Math.max(0, Math.min(3, Math.round(raw + offset)))`. Off steps (0) stay off regardless of offset.
- Tick range: ±60 ticks at 480 PPQ (±50% of one 16th step).

**Phase 1 preset library:**

| ID | Description |
|----|-------------|
| `straight` | All offsets zero. Reference. |
| `chicago-house-swing` | 8th-note triplet push. Off-beats ~+30 ticks. Velocity dip on weak steps. |
| `detroit-techno-push` | 16th-note rush on steps 3 and 11. |
| `uk-acid-shuffle` | Hard swing. Steps 3, 7, 11, 15 pulled back 40 ticks. |
| `nyc-garage-lilt` | Soft swing. Velocity accent on steps 5 and 13. |
| `minimal-straight` | Near-straight. Fractional velocity humanisation only. |

---

## 4. Shared groove module (`groove.ts`)

Two exports. Both used by the live scheduler and `exportMIDI`. Never inline these.

```typescript
// Timing offset in seconds for a given step.
function grooveTimingOffsetSeconds(
  groove: { presetId: string; intensity: number },
  stepIndex: number,
  bpm: number,
  stepsPerBar: number
): number;

// Adjusted velocity (0-3, clamped) for a given step.
function grooveVelocity(
  rawVelocity: number,
  groove: { presetId: string; intensity: number },
  stepIndex: number,
  stepsPerBar: number
): number;
```

Both must have unit tests. Any divergence between scheduler and MIDI export is a bug.

---

## 5. Generator (`mutate`)

```typescript
interface MutationParams {
  swingAmount: number;       // 0-1. Written directly to groove.intensity.
  ghostNoteDensity: number;  // 0-1. Probability of ghost note insert on snare/hat.
  hatVariation: number;      // 0-1. Probability of hat step flip.
  accentShift: number;       // -1 to 1. Shifts accent steps ±1 within beat group.
  seed: number;              // Seeded RNG. All random choices derive from this.
}

function mutate(source: PatternDocument, params: MutationParams): PatternDocument;
```

**Output:** `role: "user-generated"`, `sourceStudyId` copied from source, `seed` and `mutationParams` stored.

**Execution order (fixed):** ghostNoteDensity → hatVariation → accentShift → swingAmount.

**Immutable fields:** kick lane steps, `groove.presetId`, `sceneTag`, `bpm`.

**Reproducibility key:** unique source `PatternDocument.id` + seed + params. Not study ID + role (two variations in the same study share study ID and role — this would collide).

**What mutate() does NOT do:**
- Change BPM
- Change the kick
- Change `groove.presetId`
- Insert notes outside the step grid
- Generate from nothing

---

## 6. Audio pipeline

```typescript
// On each Transport tick:
const currentStep = tick % totalSteps;
const stepInBar = currentStep % stepsPerBar;

for (const lane of doc.lanes) {
  const rawVelocity = doc.steps[lane.id][currentStep];
  if (rawVelocity === 0) continue;

  const velocity = grooveVelocity(rawVelocity, doc.groove, stepInBar, doc.stepsPerBar);
  const timingOffset = grooveTimingOffsetSeconds(doc.groove, stepInBar, doc.bpm, doc.stepsPerBar);
  const scheduleTime = Tone.Transport.toSeconds(tick) + timingOffset;

  sampler[lane.id].triggerAttack(lane.midiNote, scheduleTime, velocityToGain(velocity));
}
```

**Clock:** `Tone.Transport`. Target lookahead: 100ms.

**Choke groups:** maintain `chokeMap: Record<string, string[]>` on lane definitions. On trigger of any lane in a choke group, call `triggerRelease()` on siblings. Same-tick ordering: closed hat wins. Open-hat decay: schedule release at `scheduleTime + 0.005` (5ms). Isolate in `chokeScheduler.ts` with a golden test before integrating.

**Audio init:** `AudioContext` requires user gesture. Pattern is armed at step 0 on load. Playback starts on first user interaction (play button or grid tap), never on page load.

---

## 7. MIDI export

```typescript
function exportMIDI(doc: PatternDocument): ArrayBuffer {
  const midi = new Midi();
  const track = midi.addTrack();
  const secondsPerStep = (60 / doc.bpm) / (doc.stepsPerBar / 4);

  for (const lane of doc.lanes) {
    doc.steps[lane.id].forEach((rawVelocity, stepIndex) => {
      if (rawVelocity === 0) return;
      const velocity = grooveVelocity(rawVelocity, doc.groove, stepIndex, doc.stepsPerBar);
      const timingOffset = grooveTimingOffsetSeconds(doc.groove, stepIndex, doc.bpm, doc.stepsPerBar);
      track.addNote({
        midi: lane.midiNote,
        time: (stepIndex * secondsPerStep) + timingOffset,
        duration: secondsPerStep * 0.9,
        velocity: velocityToMidi(velocity) / 127,
      });
    });
  }
  return midi.toArray();
}
```

Output: Type 0 MIDI, channel 10, GM drum map. Test against: Ableton Live 11+, Logic Pro X, FL Studio 21.

---

## 8. URL state scheme

**Short form** (clean `mutate()` output, no post-mutation edits):
```
{ sourcePatternId, seed, mutationParams }
```

**Full form** (any manual edit, BPM change, or groove change after mutation):
```
{ sourcePatternId, seed, mutationParams, bpm, groove, steps }
```

The UI must detect departure from clean-mutation state and promote to full form silently. Never lose a BPM change in a shared URL.

**Encoding:** LZ-string compress → base64 → `?p=` query param.  
**Hard cap:** 2000 characters. If exceeded: warn user, offer "Copy pattern JSON" fallback. Never silently truncate.  
**On load:** no `?p=` param → load default Groove Study.

---

## 9. App state

```typescript
interface AppState {
  activeStudy: GrooveStudy;
  playgroundDoc: PatternDocument;    // canonical, variation, or user-generated
  isPlaying: boolean;
  currentStep: number;
  activeKitId: string;
  groovePresets: GroovePreset[];
  packs: Pack[];
  studies: GrooveStudy[];
  history: PatternDocument[];        // undo stack, last 20
}
```

---

## 10. Sample kit strategy

**Structure:** `/public/kits/{kit-id}/` — WAV files keyed to GM note numbers + `manifest.json`.

**Phase 1 kits:**

| Kit ID | Scene | Source |
|--------|-------|--------|
| `chicago-house` | Chicago house 1990–1993 | CC0 909-style from Freesound |
| `detroit-techno` | Detroit techno 1990–1996 | CC0 808-style kick + electronic snare/hat from Freesound |
| `uk-acid` | UK acid/rave 1991–1994 | Dustyroom Fake Acoustic Kit (CC0) |

**Licensing:** CC0 only for Phase 1. Every sample listed in `manifest.json` with source URL and license. Do not use BVKER, LANDR, or MusicRadar packs until licenses are confirmed in writing. Synthesis fallback: `MembraneSynth` (kick), `NoiseSynth` (snare), `MetalSynth` (hats) via Tone.js.

---

## 11. Content authoring — Groove Study checklist

Per study, before marking complete:

- [ ] Editorial brief: one sentence on the specific rhythmic idea this study teaches
- [ ] Canonical `PatternDocument` hand-authored (`role: "canonical"`)
- [ ] 2–3 authored variations (`role: "variation"`, `sourceStudyId` set)
- [ ] `grooveProfile` filled: `swingFeel`, `accentLogic`, `microtimingTendencies`
- [ ] `annotation` written: 150 words max, producer voice, includes what not to "correct"
- [ ] Groove preset chosen and validated at `intensity: 1` by ear
- [ ] Pattern validated through all 3 Phase 1 kits
- [ ] Scene credibility confirmed by second reviewer
- [ ] Minimal techno studies: `annotation` articulates sonic boundary from Detroit techno (not just date)

**Phase 1 target:** 12–18 studies across 4–6 Packs. Prefer depth over coverage. A scene with 3 well-authored studies is stronger than 5 thin ones.

---

## 12. Stack

| Layer | Choice |
|-------|--------|
| Framework | React + TypeScript + Vite |
| Audio | Tone.js (`Transport`, `Sequence`, `Sampler`) |
| MIDI | `@tonejs/midi` |
| State | Zustand |
| RNG | `mulberry32` inline utility |
| URL persistence | LZ-string + base64 |
| Styling | Tailwind CSS |
| Hosting | Vercel static (Phase 1) |

---

## 13. Risks (prioritised)

| Risk | Mitigation |
|------|------------|
| Editorial voice becomes taxonomic | Use annotation as quality gate. If it reads like Wikipedia, rewrite. Producer review before launch. |
| Groove presets sound generic | Build groove editor internal tool before authoring >2 presets. Validate by ear at intensity=1. |
| Studies feel interchangeable across scenes | Producer test: same kit, all 12-18 patterns. If two scenes blur, fix groove preset + kick variation. |
| Choke group race / decay bugs | `chokeScheduler.ts` isolated with golden test before integration. |
| URL length overflow | Hard cap at 2000 chars. Fallback UX: "Copy pattern JSON". Design before URL scheme ships. |
| Safari audio unlock | `AudioContext` starts on user gesture only. Audit Motif iOS handling before audio init. |
| Scope creep toward DAW | No live recording, no arrangement view, no piano roll — Phase 1 or Phase 2. |

---

## 14. Immediate next steps (ordered)

1. **Schema files** — `GrooveStudy.schema.json`, `Pack.schema.json`, `PatternDocument.v1.json` in `/schema/`. One day. This is the contract everything builds against.
2. **Groove preset format agreement** — sign off on `GroovePreset` interface and tick range with lead engineer. Half day. Unblocks all audio work.
3. **OSS spike** — `@tonejs/midi` vs `midi-file`; Tone.js `Transport` + `Sampler` prototype with one hardcoded `PatternDocument`; `mulberry32` utility. Output: short ADR. Two days.
4. **Kit curation** — source CC0 samples for 3 kits from Freesound. Write `manifest.json` files. One to two days.
5. **Author 3 Chicago house Groove Studies** — full checklist per study. Validate through scheduler prototype. Two days. Quality of these determines if the product works.
6. **Groove editor internal tool** — visual offset curve + intensity scrub. Build before authoring remaining studies. One to two days.
7. **Phase 1 one-pager** — explicit in/out-of-scope for sprint. Half day.
8. **Legal review** — study copy, kit licenses, "inspired by" attribution. Before any public deployment.

---

*Companion document: `ghost-pattern-founder-pitch.md`  
Full rationale: `ghost-pattern-whitepaper.md` v1.4*
