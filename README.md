# Ghost Pattern

Browser-first drum groove learning environment. You open a curated Groove Study — a named, annotated encounter with a rhythmic idea from the 1988–2008 electronic music canon (Chicago house, Detroit techno, NYC garage, UK acid/rave, Berlin techno) — then listen, edit, mutate, and export. The grid is in service of the study. Curation is the moat.

**Live:** [ghost-pattern.pages.dev](https://ghost-pattern.pages.dev)

---

## Features

- **Groove Studies** — named, annotated patterns with scene context, groove profile (swing feel, accent logic, microtiming), and 2–4 authored variations per study. You start from something real, not a blank grid.
- **Five scenes** — Chicago house (1990–1993), Detroit techno (1990–1996), NYC garage (1990–1995), UK acid/rave (1991–1994), Berlin techno.
- **Variation switcher** — load the canonical pattern or any authored variation into the playground. Non-destructive.
- **Dot grid editor** — per-cell velocity cycling (off / soft / medium / accent). Click to cycle. Playhead highlights current step.
- **Transport** — play/stop, BPM slider scoped to the study's era range, 1/2/4 bar loop length.
- **Mutation panel** — four sliders: Ghost Notes, Hat Chaos, Swing, Accent Drift. Live preview as you drag. Seeded RNG — enter any integer to reproduce a mutation exactly.
- **MIDI export** — Type 0 `.mid`, channel 10, GM drum map, groove offsets baked in. Tested against Ableton Live 11+, Logic Pro X, FL Studio 21.
- **Undo stack** — 20-step history on the playground document.
- **Responsive** — desktop sidebar layout; mobile drawer with 44px touch targets and horizontal scroll on the grid.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript + Vite |
| Audio scheduling | Tone.js 14 (`Transport`, `Sampler`) |
| MIDI I/O | `@tonejs/midi` |
| State | Zustand |
| URL persistence | LZ-string + base64 (`?p=` query param) |
| Styling | Inline styles (no CSS framework) |
| Hosting | Cloudflare Pages |

---

## Local dev

```bash
cd app
npm install
npm run dev
```

The app runs at `http://localhost:5173`. No environment variables required for local development.

To build:

```bash
npm run build
```

Output goes to `app/dist/`.

---

## Content structure

```
content/
  studies/        JSON files, one per Groove Study
  packs/          JSON files, one per Pack (editorial collection of studies)
  kits/           Sample kit directories — WAV files + manifest.json
```

### Groove Study

Each study in `content/studies/` is a `GrooveStudy` object: title, subtitle, 150-word annotation, groove profile (swing feel, accent logic, microtiming tendencies), a canonical `PatternDocument`, 2–4 authored variations, kit pairing, scene tag, era, and BPM range.

### Pack

Each pack in `content/packs/` groups 3–6 studies from one scene. It is the browsing unit.

### PatternDocument

The internal rhythm data format — step arrays keyed by lane ID (0=off, 1=soft, 2=medium, 3=accent), BPM, bars, lanes with GM note numbers, and a groove reference (`presetId` + `intensity`). All of MIDI export, the scheduler, and the mutation generator read and write this format. It never surfaces by name in the UI.

Full schemas live in `/schema/`.

---

## Groove study approach

Ghost Pattern is not a blank sequencer with presets bolted on. Every session starts inside a named Groove Study from a specific scene and era. The annotation tells you what gives the pattern its feel and, importantly, what not to "correct." The mutation panel lets you diverge from the canonical pattern in ways that stay inside the scene's rhythmic vocabulary — the kick and groove preset ID are locked per study; only hat density, ghost notes, accent position, and swing intensity are variable.

The goal is internalisation through interaction: load a pattern, understand why it sounds the way it does, push it somewhere personal, export to your DAW.

---

## Project docs

- [`whitepaper.md`](whitepaper.md) — full design rationale, schemas, generator spec, content strategy
- [`execution-brief.md`](execution-brief.md) — engineering reference: schemas, groove module API, audio pipeline, MIDI export
- [`founder-pitch.md`](founder-pitch.md) — product positioning

---

## License

MIT
