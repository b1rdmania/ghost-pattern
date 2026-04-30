import { create } from 'zustand'
import type { GrooveStudy, Pack, PatternDocument, GroovePreset } from '../types'

const MAX_HISTORY = 20

interface AppState {
  // content
  packs: Pack[]
  studies: Record<string, GrooveStudy>
  groovePresets: GroovePreset[]

  // session
  activeStudy: GrooveStudy | null
  playgroundDoc: PatternDocument | null
  activeKitId: string
  isPlaying: boolean
  currentStep: number
  history: PatternDocument[]

  // actions
  loadContent: (packs: Pack[], studies: GrooveStudy[], presets: GroovePreset[]) => void
  openStudy: (studyId: string) => void
  loadVariation: (doc: PatternDocument) => void
  setPlaygroundDoc: (doc: PatternDocument) => void
  setIsPlaying: (v: boolean) => void
  setCurrentStep: (step: number) => void
  setActiveKitId: (kitId: string) => void
  undo: () => void
}

export const useStore = create<AppState>((set, get) => ({
  packs: [],
  studies: {},
  groovePresets: [],
  activeStudy: null,
  playgroundDoc: null,
  activeKitId: 'chicago-house',
  isPlaying: false,
  currentStep: 0,
  history: [],

  loadContent: (packs, studies, presets) => {
    const studyMap: Record<string, GrooveStudy> = {}
    studies.forEach(s => { studyMap[s.id] = s })
    set({ packs, studies: studyMap, groovePresets: presets })
  },

  openStudy: (studyId) => {
    const study = get().studies[studyId]
    if (!study) return
    set({
      activeStudy: study,
      playgroundDoc: study.canonicalPattern,
      activeKitId: study.kitPairing,
      history: [],
      isPlaying: false,
      currentStep: 0,
    })
  },

  loadVariation: (doc) => {
    const { playgroundDoc, history } = get()
    set({
      playgroundDoc: doc,
      history: playgroundDoc
        ? [...history.slice(-(MAX_HISTORY - 1)), playgroundDoc]
        : history,
    })
  },

  setPlaygroundDoc: (doc) => {
    const { playgroundDoc, history } = get()
    set({
      playgroundDoc: doc,
      history: playgroundDoc
        ? [...history.slice(-(MAX_HISTORY - 1)), playgroundDoc]
        : history,
    })
  },

  setIsPlaying: (v) => set({ isPlaying: v }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setActiveKitId: (kitId) => set({ activeKitId: kitId }),

  undo: () => {
    const { history } = get()
    if (history.length === 0) return
    const prev = history[history.length - 1]
    set({ playgroundDoc: prev, history: history.slice(0, -1) })
  },
}))
