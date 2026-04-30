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

  // 1. ghostNoteDensity — hats and snare (never kick); weight toward ohat when snare is sparse
  const snareActivity = snareId ? doc.steps[snareId].filter(v => v > 0).length : 0
  const ghostTargets = snareActivity <= 2
    ? [chatId, ohatId]   // Berlin-style: ride the hats
    : [snareId, chatId]  // Chicago/Detroit/NYC: ghost snare + chat
  for (const laneId of ghostTargets) {
    if (!laneId) continue
    for (let i = 0; i < totalSteps; i++) {
      if (doc.steps[laneId][i] === 0 && rng() < params.ghostNoteDensity) {
        doc.steps[laneId][i] = 1
        // if we just ghosted an ohat, clear chat so it isn't immediately choked
        if (laneId === ohatId && chatId) doc.steps[chatId][i] = 0
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

  // 3. accentShift — shift any active (vel >= 1) step within beat groups, non-kick lanes
  for (const lane of doc.lanes) {
    if (lane.id === kickId) continue
    const beatSize = doc.stepsPerBar / 4
    for (let beat = 0; beat < doc.bars * 4; beat++) {
      const start = beat * beatSize
      for (let s = start; s < start + beatSize; s++) {
        const vel = doc.steps[lane.id][s]
        if (vel > 0) {
          const dir = params.accentShift >= 0 ? 1 : -1
          if (rng() < Math.abs(params.accentShift)) {
            const target = s + dir
            if (target >= start && target < start + beatSize) {
              const displaced = doc.steps[lane.id][target]
              doc.steps[lane.id][target] = vel
              doc.steps[lane.id][s] = displaced
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
