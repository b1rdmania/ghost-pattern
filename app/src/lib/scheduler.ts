import * as Tone from 'tone'
import { grooveTimingOffsetSeconds, grooveVelocity } from './groove'
import { SampleKit } from './sample-kit'
import { useStore } from '../store'

let kit: SampleKit | null = null
let currentKitId = ''
let stepCount = 0
let initialized = false

function getKit(): SampleKit {
  const kitId = useStore.getState().activeKitId
  if (!kit || kitId !== currentKitId) {
    kit?.dispose()
    kit = new SampleKit(kitId)
    currentKitId = kitId
  }
  return kit
}

function initScheduler(): void {
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

    Tone.getDraw().schedule(() => {
      useStore.getState().setCurrentStep(step)
    }, time)

    stepCount++
  }, '16n')
}

export async function startTransport(): Promise<void> {
  await Tone.start()

  const kit = getKit()

  // Wire choke groups before loading so the kit is fully configured
  const study = useStore.getState().activeStudy
  if (study) {
    const groups: Record<string, string[]> = {}
    for (const lane of study.canonicalPattern.lanes) {
      if (lane.chokeGroup) {
        groups[lane.chokeGroup] = groups[lane.chokeGroup] ?? []
        groups[lane.chokeGroup].push(lane.id)
      }
    }
    for (const [groupId, laneIds] of Object.entries(groups)) {
      kit.registerChokeGroup(groupId, laneIds)
    }
  }

  // Wait for sample buffers to finish loading before starting the clock
  await kit.load()

  initScheduler()

  const doc = useStore.getState().playgroundDoc
  if (doc) Tone.Transport.bpm.value = doc.bpm

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
