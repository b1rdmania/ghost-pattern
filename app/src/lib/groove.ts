import type { GroovePreset } from '../types'

// Preset registry — populated at app init
const presets = new Map<string, GroovePreset>()

export function registerPresets(list: GroovePreset[]): void {
  list.forEach(p => presets.set(p.id, p))
}

function getPreset(presetId: string): GroovePreset {
  const p = presets.get(presetId)
  if (!p) throw new Error(`Groove preset not found: ${presetId}`)
  return p
}

// Upsample 16-step offsets to 32 by repeating each value twice.
function upsample(offsets: number[], stepsPerBar: number): number[] {
  if (stepsPerBar === 16) return offsets
  return Array.from({ length: 32 }, (_, i) => offsets[Math.floor(i / 2)])
}

// Timing offset in seconds for a given step.
// Used by live scheduler and exportMIDI — never inline these calls.
export function grooveTimingOffsetSeconds(
  groove: { presetId: string; intensity: number },
  stepIndex: number,
  bpm: number,
  stepsPerBar: 16 | 32,
): number {
  const preset = getPreset(groove.presetId)
  const stepInBar = stepIndex % stepsPerBar
  const offsets = upsample(preset.stepOffsets, stepsPerBar)
  const ticks = offsets[stepInBar] * groove.intensity
  // 480 PPQ standard: 1 step at 16th resolution = 120 ticks = (60/bpm)/4 seconds
  const secondsPerTick = (60 / bpm) / (stepsPerBar === 16 ? 4 : 8) / 120
  return ticks * secondsPerTick
}

// Adjusted velocity (0-3, clamped) for a given step.
// Used by live scheduler and exportMIDI — never inline these calls.
export function grooveVelocity(
  rawVelocity: number,
  groove: { presetId: string; intensity: number },
  stepIndex: number,
  stepsPerBar: 16 | 32,
): number {
  if (rawVelocity === 0) return 0  // off steps stay off
  const preset = getPreset(groove.presetId)
  const stepInBar = stepIndex % stepsPerBar
  const offsets = upsample(preset.velocityOffsets, stepsPerBar)
  const adjusted = rawVelocity + offsets[stepInBar] * groove.intensity
  return Math.max(0, Math.min(3, Math.round(adjusted)))
}
