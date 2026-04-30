export interface Lane {
  id: string
  name: string
  midiNote: number
  chokeGroup: string | null
}

export interface PatternDocument {
  version: string
  id: string
  sourceStudyId: string | null
  bpm: number
  timeSignature: { numerator: number; denominator: number }
  stepsPerBar: 16 | 32
  bars: number
  lanes: Lane[]
  steps: Record<string, number[]>  // lane id → 0|1|2|3 per step
  groove: { presetId: string; intensity: number }
  seed: number | null
  mutationParams: MutationParams | null
  metadata: {
    title: string
    studyId: string | null
    role: 'canonical' | 'variation' | 'user-generated'
    packId: string | null
    sceneTag: string
    era: string
    description: string | null
    digSceneRef: string | null
  }
}

export interface MutationParams {
  swingAmount: number
  ghostNoteDensity: number
  hatVariation: number
  accentShift: number
  seed: number
}

export interface GroovePreset {
  id: string
  name: string
  description: string
  stepOffsets: number[]     // ticks, length = stepsPerBar (always 16)
  velocityOffsets: number[] // additive, clamped 0-3
}

export interface GrooveStudy {
  id: string
  version: string
  title: string
  subtitle: string
  annotation: string
  grooveProfile: {
    swingFeel: string
    accentLogic: string
    microtimingTendencies: string
  }
  canonicalPattern: PatternDocument
  variations: PatternDocument[]
  kitPairing: string
  sceneTag: string
  era: string
  bpmRange: [number, number]
  digSceneRef: string | null
  packId: string | null
}

export interface Pack {
  id: string
  title: string
  description: string
  sceneTag: string
  studyIds: string[]
}

export interface KitSample {
  laneId: string
  midiNote: number
  file: string
  source: string
  license: string
}

export interface Kit {
  id: string
  name: string
  sceneTag: string
  description: string
  samples: KitSample[]
}
