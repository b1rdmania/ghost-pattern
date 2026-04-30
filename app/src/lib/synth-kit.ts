import * as Tone from 'tone'

type AnyInstrument = Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth

const VELOCITY_GAIN: Record<number, number> = { 1: 0.3, 2: 0.65, 3: 1.0 }

export class SynthKit {
  private synths: Map<string, AnyInstrument> = new Map()
  private chokeGroups: Map<string, string[]> = new Map()  // groupId → laneIds
  private laneToGroup: Map<string, string> = new Map()    // laneId → groupId
  private laneToMidi: Map<number, string> = new Map()     // midiNote → laneId

  constructor() {
    this.build()
  }

  private build(): void {
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
    }).toDestination()

    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    }).toDestination()

    const clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
    }).toDestination()

    const chat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination()

    const ohat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination()

    // GM note → lane id
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

    const gain = VELOCITY_GAIN[velocity] ?? 0.65

    // Choke siblings before triggering
    const groupId = this.laneToGroup.get(laneId)
    if (groupId) {
      const siblings = this.chokeGroups.get(groupId) ?? []
      for (const sibId of siblings) {
        if (sibId === laneId) continue
        const sib = this.synths.get(sibId)
        // Release at time + 5ms (open-hat decay spec)
        sib?.triggerRelease(time + 0.005)
      }
    }

    if (synth instanceof Tone.MembraneSynth) {
      synth.volume.value = Tone.gainToDb(gain)
      synth.triggerAttackRelease('C1', '8n', time)
    } else if (synth instanceof Tone.NoiseSynth) {
      synth.volume.value = Tone.gainToDb(gain)
      synth.triggerAttackRelease('8n', time)
    } else if (synth instanceof Tone.MetalSynth) {
      synth.volume.value = Tone.gainToDb(gain)
      synth.triggerAttackRelease('8n', time)
    }
  }

  dispose(): void {
    this.synths.forEach(s => s.dispose())
    this.synths.clear()
  }
}
