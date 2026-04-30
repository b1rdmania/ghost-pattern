import { Midi } from '@tonejs/midi'
import type { PatternDocument } from '../types'
import { grooveTimingOffsetSeconds, grooveVelocity } from './groove'

const VELOCITY_MAP: Record<number, number> = { 1: 40, 2: 80, 3: 110 }

function velocityToMidi(v: number): number {
  return VELOCITY_MAP[v] ?? 80
}

export function exportMIDI(doc: PatternDocument): Uint8Array {
  const midi = new Midi()
  midi.header.setTempo(doc.bpm)
  const track = midi.addTrack()
  const secondsPerStep = (60 / doc.bpm) / (doc.stepsPerBar / 4)

  for (const lane of doc.lanes) {
    const stepArr = doc.steps[lane.id]
    if (!stepArr) continue
    stepArr.forEach((rawVelocity, stepIndex) => {
      if (rawVelocity === 0) return
      const velocity = grooveVelocity(rawVelocity, doc.groove, stepIndex, doc.stepsPerBar)
      const timingOffset = grooveTimingOffsetSeconds(doc.groove, stepIndex, doc.bpm, doc.stepsPerBar)
      track.addNote({
        midi: lane.midiNote,
        time: stepIndex * secondsPerStep + timingOffset,
        duration: secondsPerStep * 0.9,
        velocity: velocityToMidi(velocity) / 127,
      })
    })
  }

  return midi.toArray()
}

export function downloadMIDI(doc: PatternDocument, filename = 'ghost-pattern.mid'): void {
  const bytes = exportMIDI(doc)
  const blob = new Blob([bytes], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
