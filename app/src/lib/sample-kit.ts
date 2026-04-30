import * as Tone from 'tone'

const VELOCITY_GAIN: Record<number, number> = { 1: 0.25, 2: 0.55, 3: 0.85 }

// Maps study kitPairing IDs to sample directories under /public/samples/
const KIT_TO_DIR: Record<string, string> = {
  'chicago-house':  '909',
  'nyc-garage':     '909',
  'berlin-techno':  'linn',
  'detroit-techno': '808',
  'uk-acid':        '808',
}

export class SampleKit {
  private players: Map<string, Tone.Player> = new Map()
  private chokeGroups: Map<string, string[]> = new Map()
  private laneToGroup: Map<string, string> = new Map()
  private masterBus: Tone.Volume
  private limiter: Tone.Limiter

  constructor(kitId: string) {
    this.limiter = new Tone.Limiter(-1).toDestination()
    this.masterBus = new Tone.Volume(-6).connect(this.limiter)
    this.build(kitId)
  }

  private build(kitId: string): void {
    const dir = KIT_TO_DIR[kitId] ?? '909'
    for (const lane of ['kick', 'snare', 'clap', 'chat', 'ohat']) {
      const player = new Tone.Player(`/samples/${dir}/${lane}.wav`).connect(this.masterBus)
      this.players.set(lane, player)
    }
  }

  // Resolves when all sample buffers have finished downloading and decoding
  load(): Promise<void> {
    return Tone.loaded()
  }

  registerChokeGroup(groupId: string, laneIds: string[]): void {
    this.chokeGroups.set(groupId, laneIds)
    laneIds.forEach(id => this.laneToGroup.set(id, groupId))
  }

  trigger(laneId: string, time: number, velocity: number): void {
    const player = this.players.get(laneId)
    if (!player?.loaded) return

    const gain = VELOCITY_GAIN[velocity] ?? 0.55
    player.volume.setValueAtTime(Tone.gainToDb(gain), time)

    // Choke siblings (open hat chokes closed hat and vice versa)
    const groupId = this.laneToGroup.get(laneId)
    if (groupId) {
      const siblings = this.chokeGroups.get(groupId) ?? []
      for (const sibId of siblings) {
        if (sibId === laneId) continue
        const sib = this.players.get(sibId)
        if (sib?.loaded) sib.stop(time)
      }
    }

    player.start(time)
  }

  dispose(): void {
    this.players.forEach(p => p.dispose())
    this.players.clear()
    this.masterBus.dispose()
    this.limiter.dispose()
  }
}
