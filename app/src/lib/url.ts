import LZString from 'lz-string'
import type { PatternDocument } from '../types'

const MAX_URL_LENGTH = 2000

interface ShortForm {
  sourcePatternId: string
  seed: number
  mutationParams: PatternDocument['mutationParams']
}

interface FullForm extends ShortForm {
  bpm: number
  groove: PatternDocument['groove']
  steps: PatternDocument['steps']
}

function isCleanMutation(doc: PatternDocument): boolean {
  return (
    doc.metadata.role === 'user-generated' &&
    doc.seed !== null &&
    doc.mutationParams !== null
  )
}

export function encodeDoc(doc: PatternDocument, sourcePatternId: string): string | null {
  const short: ShortForm = {
    sourcePatternId,
    seed: doc.seed ?? 0,
    mutationParams: doc.mutationParams,
  }

  if (isCleanMutation(doc)) {
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(short))
    if (compressed.length < MAX_URL_LENGTH) return compressed
  }

  const full: FullForm = {
    ...short,
    bpm: doc.bpm,
    groove: doc.groove,
    steps: doc.steps,
  }
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(full))
  if (compressed.length > MAX_URL_LENGTH) return null  // caller shows fallback UX
  return compressed
}

export function decodeDoc(param: string): ShortForm | FullForm | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param)
    if (!json) return null
    return JSON.parse(json) as ShortForm | FullForm
  } catch {
    return null
  }
}

export function isFullForm(decoded: ShortForm | FullForm): decoded is FullForm {
  return 'steps' in decoded
}
