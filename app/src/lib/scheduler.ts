import * as Tone from 'tone'
import { grooveTimingOffsetSeconds, grooveVelocity } from './groove'
import { SynthKit } from './synth-kit'
import { useStore } from '../store'

let kit: SynthKit | null = null
let currentKitId = ''
let stepCount = 0
let initialized = false

export function getKit(): SynthKit {
  const kitId = useStore.getState().activeKitId
  // Rebuild the synth kit when the scene changes — different drum machine per genre
  if (!kit || kitId !== currentKitId) {
    kit?.dispose()
    kit = new SynthKit(kitId)
    currentKitId = kitId
  }
  return kit
}

export function initScheduler(): void {
  if (initialized) return
  initialized = true

  Tone.Transport.scheduleRepeat((time) => {
    const state = useStore.getState()
    const doc = state.playgroundDoc
    if (!doc || !state.isPlaying) return

    const totalSteps = doc.stepsPerBar * doc.bars
    const step = stepCount % totalSteps

    for (const lane of doc.lanes) {
      const rawVelocity = doc.steps[lane.id]?.[step] ?? 0
      if (rawVelocity === 0) continue

      const velocity = grooveVelocity(rawVelocity, doc.groove, step, doc.stepsPerBar)
      const offset = grooveTimingOffsetSeconds(doc.groove, step, doc.bpm, doc.stepsPerBar)

      getKit().trigger(lane.id, time + offset, velocity)
    }

    // Schedule UI update to coincide with when the audio fires
    Tone.getDraw().schedule(() => {
      useStore.getState().setCurrentStep(step)
    }, time)

    stepCount++
  }, '16n')
}

export async function startTransport(): Promise<void> {
  await Tone.start()
  initScheduler()

  const doc = useStore.getState().playgroundDoc
  if (doc) Tone.Transport.bpm.value = doc.bpm

  // Wire choke groups from current study lanes
  const study = useStore.getState().activeStudy
  if (study) {
    const kitEngine = getKit()
    const groups: Record<string, string[]> = {}
    for (const lane of study.canonicalPattern.lanes) {
      if (lane.chokeGroup) {
        groups[lane.chokeGroup] = groups[lane.chokeGroup] ?? []
        groups[lane.chokeGroup].push(lane.id)
      }
    }
    for (const [groupId, laneIds] of Object.entries(groups)) {
      kitEngine.registerChokeGroup(groupId, laneIds)
    }
  }

  Tone.Transport.start()
  useStore.getState().setIsPlaying(true)
}

export function stopTransport(): void {
  Tone.Transport.stop()
  stepCount = 0
  useStore.getState().setCurrentStep(0)
  useStore.getState().setIsPlaying(false)
}

export function syncBpm(bpm: number): void {
  Tone.Transport.bpm.value = bpm
}
