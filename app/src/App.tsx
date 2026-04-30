import { useEffect } from 'react'
import { useStore } from './store'
import { registerPresets } from './lib/groove'
import { StudyView } from './components/StudyView'
import { SceneBrowser } from './components/SceneBrowser'
import type { Pack, GrooveStudy, GroovePreset } from './types'

import chicagoStudy from '../../content/studies/arch-chicago-house-001.json'
import chicagoPack from '../../content/packs/chicago-house.json'
import berlinStudy from '../../content/studies/arch-berlin-techno-001.json'
import berlinPack from '../../content/packs/berlin-techno.json'
import detroitStudy from '../../content/studies/arch-detroit-techno-001.json'
import detroitPack from '../../content/packs/detroit-techno.json'
import nycStudy from '../../content/studies/arch-nyc-garage-001.json'
import nycPack from '../../content/packs/nyc-garage.json'
import ukStudy from '../../content/studies/arch-uk-acid-001.json'
import ukPack from '../../content/packs/uk-acid.json'

const PRESETS: GroovePreset[] = [
  {
    id: 'straight',
    name: 'Straight',
    description: 'All offsets zero. Reference point.',
    stepOffsets: new Array(16).fill(0),
    velocityOffsets: new Array(16).fill(0),
  },
  {
    id: 'chicago-house-swing',
    name: 'Chicago House Swing',
    description: '8th-note triplet push. Off-beats sit behind the grid.',
    stepOffsets:   [0, 28, 0, 28,  0, 28, 0, 28,  0, 28, 0, 28,  0, 28, 0, 28],
    velocityOffsets:[0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1],
  },
  {
    id: 'detroit-techno-push',
    name: 'Detroit Techno Push',
    description: 'Subtle 16th-note rush on steps 3 and 11.',
    stepOffsets:   [0, 0, -12, 0,  0, 0, 0, 0,  0, 0, 0, -12,  0, 0, 0, 0],
    velocityOffsets: new Array(16).fill(0),
  },
  {
    id: 'detroit-house-swing',
    name: 'Detroit House Swing',
    description: 'Tight 20-tick push on off-beats. More soulful than straight, tighter than Chicago.',
    stepOffsets:   [0, 20, 0, 20,  0, 20, 0, 20,  0, 20, 0, 20,  0, 20, 0, 20],
    velocityOffsets:[0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1],
  },
  {
    id: 'uk-acid-shuffle',
    name: 'UK Acid Shuffle',
    description: 'Hard swing on hats. Off-beats pulled back.',
    stepOffsets:   [0, 38, 0, 38,  0, 38, 0, 38,  0, 38, 0, 38,  0, 38, 0, 38],
    velocityOffsets:[0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1],
  },
  {
    id: 'nyc-garage-lilt',
    name: 'NYC Garage Lilt',
    description: 'Soft swing, velocity accent on steps 5 and 13.',
    stepOffsets:   [0, 16, 0, 16,  0, 16, 0, 16,  0, 16, 0, 16,  0, 16, 0, 16],
    velocityOffsets:[0,  0, 0,  0,  1,  0, 0,  0,  0,  0, 0,  0,  1,  0, 0,  0],
  },
  {
    id: 'minimal-straight',
    name: 'Minimal Straight',
    description: 'Near-straight. Fractional velocity humanisation only.',
    stepOffsets: new Array(16).fill(0),
    velocityOffsets:[0, 0, -1, 0,  0, 0, -1, 0,  0, 0, -1, 0,  0, 0, -1, 0],
  },
]

const ALL_PACKS = [
  chicagoPack,
  berlinPack,
  detroitPack,
  nycPack,
  ukPack,
] as Pack[]

const ALL_STUDIES = [
  chicagoStudy,
  berlinStudy,
  detroitStudy,
  nycStudy,
  ukStudy,
] as unknown as GrooveStudy[]

export default function App() {
  const { loadContent, openStudy, activeStudy } = useStore()

  useEffect(() => {
    registerPresets(PRESETS)
    loadContent(ALL_PACKS, ALL_STUDIES, PRESETS)
  }, [loadContent])

  useEffect(() => {
    if (!activeStudy) openStudy('study-chicago-house-001')
  }, [activeStudy, openStudy])

  if (!activeStudy) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#333', fontSize: 12, letterSpacing: 2 }}>
        LOADING
      </div>
    )
  }

  return (
    <div>
      <SceneBrowser />
      <StudyView />
    </div>
  )
}
