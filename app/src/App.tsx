import { useEffect } from 'react'
import { useStore } from './store'
import { registerPresets } from './lib/groove'
import type { Pack, GrooveStudy, GroovePreset } from './types'

// TODO: replace with dynamic imports from /content
import chicagoStudy from '../../content/studies/arch-chicago-house-001.json'
import chicagoPack from '../../content/packs/chicago-house.json'

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
    stepOffsets: [0,30,0,30, 0,30,0,30, 0,30,0,30, 0,30,0,30],
    velocityOffsets: [0,-1,0,-1, 0,-1,0,-1, 0,-1,0,-1, 0,-1,0,-1],
  },
]

export default function App() {
  const { loadContent, openStudy, activeStudy, playgroundDoc } = useStore()

  useEffect(() => {
    registerPresets(PRESETS)
    loadContent(
      [chicagoPack as Pack],
      [chicagoStudy as unknown as GrooveStudy],
      PRESETS,
    )
  }, [loadContent])

  useEffect(() => {
    if (!activeStudy) openStudy('study-chicago-house-001')
  }, [activeStudy, openStudy])

  if (!activeStudy || !playgroundDoc) {
    return <div style={{ color: '#fff', padding: 40 }}>Loading...</div>
  }

  return (
    <div style={{ fontFamily: 'monospace', background: '#111', minHeight: '100vh', color: '#eee', padding: 32 }}>
      <h1 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.5 }}>
        Ghost Pattern
      </h1>
      <h2 style={{ fontSize: 24, margin: '8px 0 4px' }}>{activeStudy.title}</h2>
      <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 24px' }}>{activeStudy.subtitle}</p>
      <p style={{ fontSize: 13, maxWidth: 600, lineHeight: 1.6, opacity: 0.8 }}>
        {activeStudy.annotation}
      </p>
      <div style={{ marginTop: 32, opacity: 0.4, fontSize: 12 }}>
        — step grid, transport, mutation panel coming next
      </div>
    </div>
  )
}
