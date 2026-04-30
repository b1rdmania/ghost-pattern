import * as Tone from 'tone'

type AnyInstrument = Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth

// Gain per velocity level — conservative to leave headroom for the limiter
const VELOCITY_GAIN: Record<number, number> = { 1: 0.25, 2: 0.55, 3: 0.85 }

// Per-kit synth parameter profiles modelled on the actual drum machines:
// 909: tight punchy kick (short decay, high pitch), crisp snare, bright metallic hats
// 808: deep sub-heavy kick (long boom, low pitch), roomy snare, darker hats
// linn: dry snappy kick, sharp snare, relatively clean hats

export interface KitProfile {
  kick: {
    pitchDecay: number   // seconds — 909: fast (~0.03), 808: slow (~0.08)
    octaves: number      // pitch sweep range — 909: high (8), 808: low (4)
    decay: number        // envelope decay — 909: tight (~0.2), 808: boomy (~0.55)
    note: string         // root note — 909: 'C2', 808: 'A0'
  }
  snare: {
    type: 'white' | 'pink' | 'brown'
    decay: number        // 909: ~0.15, 808: ~0.25, linn: ~0.12
  }
  clap: {
    type: 'white' | 'pink'
    decay: number
  }
  hat: {
    decay: number        // closed hat — 909: 0.04, 808: 0.06
    ohatDecay: number    // open hat
    freq: number         // metallic frequency — 909: 400, 808: 280
    harmonicity: number  // 909: 5.1, 808: 3.5
    modulationIndex: number
  }
}

const PROFILES: Record<string, KitProfile> = {
  // Roland TR-909 — Chicago House, NYC Garage
  // Punchy short kick, cutting snare/clap, bright crisp hats
  '909': {
    kick:  { pitchDecay: 0.03, octaves: 8, decay: 0.22, note: 'C2' },
    snare: { type: 'white', decay: 0.15 },
    clap:  { type: 'pink',  decay: 0.10 },
    hat:   { decay: 0.04, ohatDecay: 0.28, freq: 440, harmonicity: 5.1, modulationIndex: 32 },
  },

  // Roland TR-808 — Detroit Techno, UK Acid Rave
  // Long sub-heavy kick with pitch sweep, roomy snare, darker warmer hats
  '808': {
    kick:  { pitchDecay: 0.08, octaves: 4, decay: 0.55, note: 'A0' },
    snare: { type: 'brown', decay: 0.25 },
    clap:  { type: 'pink',  decay: 0.14 },
    hat:   { decay: 0.06, ohatDecay: 0.35, freq: 280, harmonicity: 3.5, modulationIndex: 20 },
  },

  // Linn LM-1 / LinnDrum — Berlin Techno
  // Drier, more clinical character — shorter decay overall, moderate pitch
  'linn': {
    kick:  { pitchDecay: 0.05, octaves: 6, decay: 0.30, note: 'B1' },
    snare: { type: 'white', decay: 0.18 },
    clap:  { type: 'white', decay: 0.08 },
    hat:   { decay: 0.035, ohatDecay: 0.22, freq: 380, harmonicity: 4.8, modulationIndex: 28 },
  },
}

// Map kit IDs (from study JSON kitPairing) to profiles
const KIT_TO_PROFILE: Record<string, string> = {
  'chicago-house':  '909',
  'nyc-garage':     '909',
  'berlin-techno':  'linn',
  'detroit-techno': '808',
  'uk-acid-rave':   '808',
}

export class SynthKit {
  private synths: Map<string, AnyInstrument> = new Map()
  private chokeGroups: Map<string, string[]> = new Map()
  private laneToGroup: Map<string, string> = new Map()
  private laneToMidi: Map<number, string> = new Map()
  private masterBus: Tone.Volume
  private limiter: Tone.Limiter
  private kickNote: string = 'C2'

  constructor(kitId = 'chicago-house') {
    // Hard limiter at -1 dBFS + -12 dB master bus = ~12 dB headroom for simultaneous hits
    this.limiter = new Tone.Limiter(-1).toDestination()
    this.masterBus = new Tone.Volume(-12).connect(this.limiter)
    this.build(kitId)
  }

  private build(kitId: string): void {
    const profileId = KIT_TO_PROFILE[kitId] ?? '909'
    const p = PROFILES[profileId]

    this.kickNote = p.kick.note

    const kick = new Tone.MembraneSynth({
      pitchDecay: p.kick.pitchDecay,
      octaves: p.kick.octaves,
      envelope: { attack: 0.001, decay: p.kick.decay, sustain: 0, release: 0.05 },
    }).connect(this.masterBus)

    const snare = new Tone.NoiseSynth({
      noise: { type: p.snare.type },
      envelope: { attack: 0.001, decay: p.snare.decay, sustain: 0, release: 0.04 },
    }).connect(this.masterBus)

    const clap = new Tone.NoiseSynth({
      noise: { type: p.clap.type },
      envelope: { attack: 0.001, decay: p.clap.decay, sustain: 0, release: 0.03 },
    }).connect(this.masterBus)

    const chat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: p.hat.decay, release: 0.01 },
      harmonicity: p.hat.harmonicity,
      modulationIndex: p.hat.modulationIndex,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.masterBus)
    chat.frequency.value = p.hat.freq

    const ohat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: p.hat.ohatDecay, release: 0.08 },
      harmonicity: p.hat.harmonicity,
      modulationIndex: p.hat.modulationIndex,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.masterBus)
    ohat.frequency.value = p.hat.freq

    this.synths.set('kick',  kick)
    this.synths.set('snare', snare)
    this.synths.set('clap',  clap)
    this.synths.set('chat',  chat)
    this.synths.set('ohat',  ohat)

    this.laneToMidi.set(36, 'kick')
    this.laneToMidi.set(38, 'snare')
    this.laneToMidi.set(39, 'clap')
    this.laneToMidi.set(42, 'chat')
    this.laneToMidi.set(46, 'ohat')
  }

  registerChokeGroup(groupId: string, laneIds: string[]): void {
    this.chokeGroups.set(groupId, laneIds)
    laneIds.forEach(id => this.laneToGroup.set(id, groupId))
  }

  trigger(laneId: string, time: number, velocity: number): void {
    const synth = this.synths.get(laneId)
    if (!synth) return

    const gain = VELOCITY_GAIN[velocity] ?? 0.55
    const db = Tone.gainToDb(gain)

    // Choke siblings
    const groupId = this.laneToGroup.get(laneId)
    if (groupId) {
      const siblings = this.chokeGroups.get(groupId) ?? []
      for (const sibId of siblings) {
        if (sibId === laneId) continue
        this.synths.get(sibId)?.triggerRelease(time + 0.005)
      }
    }

    // Schedule volume at the exact trigger time, not at callback execution time.
    // Immediate .value = x causes gain discontinuities → distortion that compounds over loops.
    synth.volume.setValueAtTime(db, time)

    if (synth instanceof Tone.MembraneSynth) {
      synth.triggerAttackRelease(this.kickNote, '8n', time)
    } else if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease('8n', time)
    } else if (synth instanceof Tone.MetalSynth) {
      synth.triggerAttackRelease('8n', time)
    }
  }

  dispose(): void {
    this.synths.forEach(s => s.dispose())
    this.synths.clear()
    this.masterBus.dispose()
    this.limiter.dispose()
  }
}
