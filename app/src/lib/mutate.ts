import type { PatternDocument, MutationParams } from '../types'
import { mulberry32 } from './rng'

export function mutate(source: PatternDocument, params: MutationParams): PatternDocument {
  const rng = mulberry32(params.seed)
  const doc = structuredClone(source) as PatternDocument

  const kickId = doc.lanes.find(l => l.midiNote === 36)?.id
  const snareId = doc.lanes.find(l => l.midiNote === 38)?.id
  const chatId = doc.lanes.find(l => l.midiNote === 42)?.id
  const ohatId = doc.lanes.find(l => l.midiNote === 46)?.id
  const totalSteps = doc.stepsPerBar * doc.bars

  // 1. ghostNoteDensity — snare and closed hat only, never kick
  for (const laneId of [snareId, chatId]) {
    if (!laneId) continue
    for (let i = 0; i < totalSteps; i++) {
      if (doc.steps[laneId][i] === 0 && rng() < params.ghostNoteDensity) {
        doc.steps[laneId][i] = 1
      }
    }
  }

  // 2. hatVariation — flip hat steps; enforce choke after
  if (chatId) {
    for (let i = 0; i < totalSteps; i++) {
      if (rng() < params.hatVariation) {
        if (doc.steps[chatId][i] > 0) {
          doc.steps[chatId][i] = 0
        } else {
          const prev = doc.steps[chatId][(i - 1 + totalSteps) % totalSteps]
          const next = doc.steps[chatId][(i + 1) % totalSteps]
          if (prev > 0 || next > 0) doc.steps[chatId][i] = 1
        }
      }
    }
  }
  // choke: closed hat clears open hat at same step
  if (chatId && ohatId) {
    for (let i = 0; i < totalSteps; i++) {
      if (doc.steps[chatId][i] > 0) doc.steps[ohatId][i] = 0
    }
  }

  // 3. accentShift — shift accent (3) steps within beat groups, non-kick lanes
  for (const lane of doc.lanes) {
    if (lane.id === kickId) continue
    const beatSize = doc.stepsPerBar / 4
    for (let beat = 0; beat < doc.bars * 4; beat++) {
      const start = beat * beatSize
      for (let s = start; s < start + beatSize; s++) {
        if (doc.steps[lane.id][s] === 3) {
          const dir = params.accentShift >= 0 ? 1 : -1
          if (rng() < Math.abs(params.accentShift)) {
            const target = s + dir
            if (target >= start && target < start + beatSize) {
              doc.steps[lane.id][s] = doc.steps[lane.id][target] > 0
                ? doc.steps[lane.id][target]
                : 1
              doc.steps[lane.id][target] = 3
            }
          }
        }
      }
    }
  }

  // 4. swingAmount — write to groove.intensity only
  doc.groove = { ...doc.groove, intensity: params.swingAmount }

  doc.id = crypto.randomUUID()
  doc.sourceStudyId = source.metadata.studyId
  doc.seed = params.seed
  doc.mutationParams = params
  doc.metadata = {
    ...doc.metadata,
    role: 'user-generated',
    studyId: null,
  }

  return doc
}
