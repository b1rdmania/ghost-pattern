import { useStore } from '../store'
import { StepGrid } from './StepGrid'
import { Transport } from './Transport'
import { MutationPanel } from './MutationPanel'

export function StudyView() {
  const activeStudy = useStore(s => s.activeStudy)
  const basePattern = useStore(s => s.basePattern)
  const playgroundDoc = useStore(s => s.playgroundDoc)
  const setPlaygroundDoc = useStore(s => s.setPlaygroundDoc)
  const loadVariation = useStore(s => s.loadVariation)

  if (!activeStudy || !playgroundDoc) return null

  const allPatterns = [activeStudy.canonicalPattern, ...activeStudy.variations]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#444', textTransform: 'uppercase', marginBottom: 12 }}>
          {activeStudy.sceneTag.replace(/-/g, ' ')} · {activeStudy.era}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#e5e5e5', margin: '0 0 6px', letterSpacing: -0.5 }}>
          {activeStudy.title}
        </h1>
        <p style={{ fontSize: 14, color: '#4ade80', margin: 0, letterSpacing: 0.5 }}>
          {activeStudy.subtitle}
        </p>
      </div>

      {/* Two-column layout: annotation + groove profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, marginBottom: 36 }}>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: '#888', margin: 0 }}>
          {activeStudy.annotation}
        </p>
        <div style={{ borderLeft: '1px solid #222', paddingLeft: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>
              Swing
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{activeStudy.grooveProfile.swingFeel}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>
              Accent
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{activeStudy.grooveProfile.accentLogic}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#444', textTransform: 'uppercase', marginBottom: 4 }}>
              Timing
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{activeStudy.grooveProfile.microtimingTendencies}</div>
          </div>
        </div>
      </div>

      {/* Variation switcher — highlights based on basePattern, not playgroundDoc */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {allPatterns.map((pattern, i) => {
          const isActive = pattern.id === basePattern?.id
          const label = i === 0 ? 'Canonical' : `Variation ${i}`
          return (
            <button
              key={pattern.id}
              onClick={() => loadVariation(pattern)}
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                letterSpacing: 1,
                textTransform: 'uppercase',
                padding: '5px 12px',
                borderRadius: 3,
                border: `1px solid ${isActive ? '#4ade80' : '#2a2a2a'}`,
                background: isActive ? '#0d2a18' : 'transparent',
                color: isActive ? '#4ade80' : '#444',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Step grid */}
      <StepGrid doc={playgroundDoc} onDocChange={setPlaygroundDoc} />

      {/* Transport */}
      <Transport />

      {/* Mutation panel */}
      <MutationPanel />
    </div>
  )
}
