import { useEffect, useState, CSSProperties } from 'react'
import { useStore } from './store'
import { registerPresets } from './lib/groove'
import { startTransport, stopTransport, syncBpm } from './lib/scheduler'
import { downloadMIDI } from './lib/midi'
import { mutate } from './lib/mutate'
import type { Pack, GrooveStudy, GroovePreset, PatternDocument, MutationParams } from './types'

import chicagoStudy from '../../content/studies/arch-chicago-house-001.json'
import chicagoPack  from '../../content/packs/chicago-house.json'
import berlinStudy  from '../../content/studies/arch-berlin-techno-001.json'
import berlinPack   from '../../content/packs/berlin-techno.json'
import detroitStudy from '../../content/studies/arch-detroit-techno-001.json'
import detroitPack  from '../../content/packs/detroit-techno.json'
import nycStudy     from '../../content/studies/arch-nyc-garage-001.json'
import nycPack      from '../../content/packs/nyc-garage.json'
import ukStudy      from '../../content/studies/arch-uk-acid-001.json'
import ukPack       from '../../content/packs/uk-acid.json'

// ─── Groove presets ────────────────────────────────────────────────────────────

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
    stepOffsets:    [0, 28, 0, 28,  0, 28, 0, 28,  0, 28, 0, 28,  0, 28, 0, 28],
    velocityOffsets:[0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1],
  },
  {
    id: 'detroit-techno-push',
    name: 'Detroit Techno Push',
    description: 'Subtle 16th-note rush on steps 3 and 11.',
    stepOffsets:    [0, 0, -12, 0,  0, 0, 0, 0,  0, 0, 0, -12,  0, 0, 0, 0],
    velocityOffsets: new Array(16).fill(0),
  },
  {
    id: 'detroit-house-swing',
    name: 'Detroit House Swing',
    description: 'Tight 20-tick push on off-beats. More soulful than straight, tighter than Chicago.',
    stepOffsets:    [0, 20, 0, 20,  0, 20, 0, 20,  0, 20, 0, 20,  0, 20, 0, 20],
    velocityOffsets:[0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1],
  },
  {
    id: 'uk-acid-shuffle',
    name: 'UK Acid Shuffle',
    description: 'Hard swing on hats. Off-beats pulled back.',
    stepOffsets:    [0, 38, 0, 38,  0, 38, 0, 38,  0, 38, 0, 38,  0, 38, 0, 38],
    velocityOffsets:[0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1,  0, -1, 0, -1],
  },
  {
    id: 'nyc-garage-lilt',
    name: 'NYC Garage Lilt',
    description: 'Soft swing with lazy open-hat float. "And" positions drift 8 ticks behind.',
    stepOffsets:    [0, 16, 8, 0,   0, 16, 8, 0,   0, 16, 8, 0,   0, 16, 8, 0],
    velocityOffsets:[0,  0, 0, 0,   1,  0, 1, 0,   0,  0, 0, 0,   1,  0, 1, 0],
  },
  {
    id: 'minimal-straight',
    name: 'Minimal Straight',
    description: 'Near-straight. Fractional velocity humanisation only.',
    stepOffsets: new Array(16).fill(0),
    velocityOffsets:[0, 0, -1, 0,  0, 0, -1, 0,  0, 0, -1, 0,  0, 0, -1, 0],
  },
]

const ALL_PACKS    = [chicagoPack, berlinPack, detroitPack, nycPack, ukPack] as Pack[]
const ALL_STUDIES  = [chicagoStudy, berlinStudy, detroitStudy, nycStudy, ukStudy] as unknown as GrooveStudy[]

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:         '#0e0e0f',
  bgSidebar:  '#111112',
  bgDeck:     '#161617',
  bgCell:     'rgba(255,255,255,0.03)',
  accent:     '#E2FF46',
  accentDim:  'rgba(226,255,70,0.1)',
  accentGlow: '0 0 12px rgba(226,255,70,0.35)',
  border:     'rgba(255,255,255,0.07)',
  borderMid:  'rgba(255,255,255,0.12)',
  text:       '#ffffff',
  textSub:    'rgba(255,255,255,0.70)',
  textDim:    'rgba(255,255,255,0.50)',
  textFaint:  'rgba(255,255,255,0.32)',
}

// ─── Dot grid helper ───────────────────────────────────────────────────────────

function getDotStyle(vel: number, isActive: boolean): CSSProperties {
  const base: CSSProperties = {
    borderRadius: '50%',
    transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    flexShrink: 0,
    display: 'block',
  }
  if (isActive && vel === 0) {
    return { ...base, width: 4, height: 4, background: 'rgba(255,255,255,0.45)' }
  }
  switch (vel) {
    case 1: return { ...base, width: 6,  height: 6,  background: '#ffffff', opacity: 0.45 }
    case 2: return { ...base, width: 12, height: 12, background: '#ffffff', opacity: 0.78 }
    case 3: return { ...base, width: 18, height: 18, background: C.accent,  opacity: 1, boxShadow: C.accentGlow }
    default: return { ...base, width: 3, height: 3, background: '#ffffff', opacity: 0.12 }
  }
}

// ─── Mutation slider config ────────────────────────────────────────────────────

const SLIDERS: { key: keyof Omit<MutationParams, 'seed'>; label: string; hint: string; min: number; max: number; step: number }[] = [
  { key: 'ghostNoteDensity', label: 'Ghost Notes', hint: 'Ghost insert probability',           min: 0,  max: 1,  step: 0.01 },
  { key: 'hatVariation',     label: 'Hat Chaos',   hint: 'Hat step flip probability',          min: 0,  max: 1,  step: 0.01 },
  { key: 'swingAmount',      label: 'Swing',       hint: '0 = straight · 1 = full preset',    min: 0,  max: 1,  step: 0.01 },
  { key: 'accentShift',      label: 'Accent Drift',hint: 'Shift accents within beat groups',   min: -1, max: 1,  step: 0.01 },
]

function randomSeed() { return Math.floor(Math.random() * 999983) }

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

// ─── Main app ──────────────────────────────────────────────────────────────────

export default function App() {
  const { loadContent, openStudy } = useStore()

  // store slices
  const studies       = useStore(s => s.studies)
  const activeStudy   = useStore(s => s.activeStudy)
  const basePattern   = useStore(s => s.basePattern)
  const playgroundDoc = useStore(s => s.playgroundDoc)
  const isPlaying     = useStore(s => s.isPlaying)
  const currentStep   = useStore(s => s.currentStep)
  const historyLength = useStore(s => s.history.length)
  const setPlaygroundDoc     = useStore(s => s.setPlaygroundDoc)
  const setPlaygroundDocLive = useStore(s => s.setPlaygroundDocLive)
  const addToHistory         = useStore(s => s.addToHistory)
  const loadVariation        = useStore(s => s.loadVariation)
  const undo                 = useStore(s => s.undo)

  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  // mutation panel local state
  const [kitLoading, setKitLoading] = useState(false)

  const [params, setParams] = useState<Omit<MutationParams, 'seed'>>({
    swingAmount: 0, ghostNoteDensity: 0, hatVariation: 0, accentShift: 0,
  })
  const [seed, setSeed] = useState(randomSeed)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    registerPresets(PRESETS)
    loadContent(ALL_PACKS, ALL_STUDIES, PRESETS)
  }, [loadContent])

  useEffect(() => {
    if (!activeStudy) openStudy('study-chicago-house-001')
  }, [activeStudy, openStudy])

  // ── Reset sliders when pattern source changes (scene switch or variation) ──
  useEffect(() => {
    setParams({ swingAmount: 0, ghostNoteDensity: 0, hatVariation: 0, accentShift: 0 })
    setSeed(randomSeed())
  }, [basePattern?.id])

  // ── Live mutation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!basePattern) return
    const result = mutate(basePattern, { ...params, seed })
    setPlaygroundDocLive(result)
  }, [params, seed, basePattern, setPlaygroundDocLive])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handlePlayStop() {
    if (isPlaying) {
      stopTransport()
    } else {
      setKitLoading(true)
      try { await startTransport() } finally { setKitLoading(false) }
    }
  }

  function handleBpmChange(raw: string) {
    if (!playgroundDoc) return
    const bpm = parseInt(raw, 10)
    if (isNaN(bpm) || bpm < 60 || bpm > 200) return
    setPlaygroundDoc({ ...playgroundDoc, bpm } as typeof playgroundDoc)
    syncBpm(bpm)
  }

  function handleBarsChange(bars: number) {
    if (!playgroundDoc) return
    const totalSteps = playgroundDoc.stepsPerBar * bars
    const newSteps: typeof playgroundDoc.steps = {}
    for (const lane of playgroundDoc.lanes) {
      const existing = playgroundDoc.steps[lane.id] ?? []
      newSteps[lane.id] = Array.from({ length: totalSteps }, (_, i) => existing[i] ?? 0)
    }
    setPlaygroundDoc({ ...playgroundDoc, bars, steps: newSteps } as typeof playgroundDoc)
  }

  function cycleVelocity(doc: PatternDocument, laneId: string, stepIndex: number) {
    const current = doc.steps[laneId][stepIndex]
    const next = (current + 1) % 4
    setPlaygroundDoc({
      ...doc,
      steps: {
        ...doc.steps,
        [laneId]: doc.steps[laneId].map((v, i) => i === stepIndex ? next : v),
      },
      metadata: { ...doc.metadata, role: 'user-generated' },
    })
  }

  function handleNewSeed() {
    if (playgroundDoc) addToHistory(playgroundDoc)
    setSeed(randomSeed())
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!activeStudy || !playgroundDoc) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: C.textDim, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>
        Loading
      </div>
    )
  }

  const studyList  = Object.values(studies)
  const allPatterns = [activeStudy.canonicalPattern, ...activeStudy.variations]
  const totalSteps  = playgroundDoc.stepsPerBar * playgroundDoc.bars

  // ── Shared sub-components ─────────────────────────────────────────────────

  const cellSize = isMobile ? 20 : 26
  const cellGap  = isMobile ? 2  : 3
  const beatGap  = isMobile ? 5  : 7
  const labelW   = isMobile ? 44 : 80

  const DotGrid = (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as CSSProperties['WebkitOverflowScrolling'], marginBottom: 20 }}>
      <div style={{ display: 'inline-block', minWidth: labelW + totalSteps * (cellSize + cellGap) }}>
        {playgroundDoc.lanes.map(lane => (
          <div key={lane.id} style={{ display: 'flex', alignItems: 'center', marginBottom: cellGap }}>
            <div style={{ width: labelW, paddingRight: isMobile ? 8 : 16, textAlign: 'right', fontSize: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', color: C.textDim, flexShrink: 0 }}>
              {lane.name}
            </div>
            {playgroundDoc.steps[lane.id]?.map((vel, stepIndex) => {
              const isActive = isPlaying && stepIndex === currentStep
              const isBeatStart = stepIndex % 4 === 0 && stepIndex !== 0
              return (
                <button
                  key={stepIndex}
                  onClick={() => cycleVelocity(playgroundDoc, lane.id, stepIndex)}
                  style={{
                    width: cellSize, height: cellSize, flexShrink: 0,
                    marginRight: cellGap, marginLeft: isBeatStart ? beatGap : 0,
                    border: `1px solid ${isActive ? C.borderMid : C.border}`,
                    borderRadius: 3,
                    background: isActive ? 'rgba(255,255,255,0.04)' : C.bgCell,
                    cursor: 'pointer', padding: 0, outline: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    // Ensure 44px touch target on mobile via padding compensation
                    minHeight: isMobile ? 44 : cellSize,
                    transition: 'border-color 0.08s',
                  }}
                >
                  <span style={getDotStyle(vel, isActive)} />
                </button>
              )
            })}
          </div>
        ))}
        <div style={{ display: 'flex', marginLeft: labelW }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} style={{ width: cellSize, marginRight: cellGap, marginLeft: i % 4 === 0 && i !== 0 ? beatGap : 0, textAlign: 'center', fontSize: 8, color: i % 4 === 0 ? C.textDim : C.textFaint }}>
              {i % 4 === 0 ? i / 4 + 1 : '·'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const VariationSwitcher = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
      {allPatterns.map((pattern, i) => {
        const isActive = pattern.id === basePattern?.id
        return (
          <button
            key={pattern.id}
            onClick={() => loadVariation(pattern)}
            style={{
              fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: 1.5,
              textTransform: 'uppercase', padding: isMobile ? '10px 16px' : '5px 14px',
              borderRadius: 2, border: `1px solid ${isActive ? C.accent : C.border}`,
              background: isActive ? C.accentDim : 'transparent',
              color: isActive ? C.accent : C.textDim, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {i === 0 ? 'Canonical' : `Var ${i}`}
          </button>
        )
      })}
    </div>
  )

  const Transport = (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20, padding: '14px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
      <button
        onClick={handlePlayStop}
        disabled={kitLoading}
        style={{
          background: isPlaying ? 'transparent' : kitLoading ? C.bgDeck : C.accent,
          color: isPlaying ? C.accent : kitLoading ? C.textDim : '#000',
          border: `1px solid ${isPlaying ? C.accent : kitLoading ? C.border : 'transparent'}`,
          borderRadius: 3, padding: isMobile ? '12px 28px' : '6px 20px',
          fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
          cursor: kitLoading ? 'default' : 'pointer', transition: 'all 0.15s', minWidth: 80,
        }}
      >
        {kitLoading ? 'Loading' : isPlaying ? 'Stop' : 'Play'}
      </button>

      <div style={{ width: 1, height: 20, background: C.border }} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim, fontWeight: 500 }}>BPM</span>
        <input type="number" min={60} max={200} value={playgroundDoc.bpm} onChange={e => handleBpmChange(e.target.value)}
          style={{ width: 54, background: C.bgDeck, border: `1px solid ${C.border}`, borderRadius: 3, color: C.text, fontSize: 13, fontWeight: 300, fontFamily: 'inherit', padding: '4px 8px', textAlign: 'center' }}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim, fontWeight: 500 }}>Bars</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 4].map(n => (
            <button key={n} onClick={() => handleBarsChange(n)} style={{ width: isMobile ? 36 : 28, height: isMobile ? 36 : 28, background: playgroundDoc.bars === n ? C.accentDim : C.bgDeck, color: playgroundDoc.bars === n ? C.accent : C.textDim, border: `1px solid ${playgroundDoc.bars === n ? C.accent : C.border}`, borderRadius: 3, fontSize: 11, fontWeight: playgroundDoc.bars === n ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {n}
            </button>
          ))}
        </div>
      </label>

      {!isMobile && (
        <button onClick={() => downloadMIDI(playgroundDoc)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 3, color: C.textDim, fontSize: 9, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 14px', cursor: 'pointer', marginLeft: 'auto' }}>
          Export MIDI
        </button>
      )}
    </div>
  )

  const MutationPanel = (
    <div>
      <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, marginBottom: 16 }}>Mutate</div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '18px' : '20px 40px', marginBottom: 20 }}>
        {SLIDERS.map(({ key, label, hint, min, max, step }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.textSub, letterSpacing: 0.5 }}>{label}</span>
              <span style={{ fontSize: 11, color: C.accent, fontVariantNumeric: 'tabular-nums', fontWeight: 300 }}>{params[key].toFixed(2)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={params[key]} onChange={e => setParams(p => ({ ...p, [key]: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
            {!isMobile && <div style={{ fontSize: 9, color: C.textFaint, marginTop: 5 }}>{hint}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 500, color: C.textDim, letterSpacing: 2, textTransform: 'uppercase' }}>Seed</span>
        <input type="number" value={seed} onChange={e => setSeed(parseInt(e.target.value, 10) || 0)}
          style={{ width: 72, background: C.bgDeck, border: `1px solid ${C.border}`, borderRadius: 3, color: C.textSub, fontSize: 11, fontWeight: 300, fontFamily: 'inherit', padding: '4px 7px' }}
        />
        <button onClick={handleNewSeed} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 3, color: C.textDim, fontSize: 16, cursor: 'pointer', padding: isMobile ? '6px 12px' : '2px 8px', lineHeight: 1 }}>↺</button>
        {historyLength > 0 && (
          <button onClick={undo} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 3, color: C.textDim, fontSize: 9, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 12px', cursor: 'pointer' }}>← Undo</button>
        )}
      </div>
    </div>
  )

  const SceneList = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      {studyList.map(study => {
        const isActive = study.id === activeStudy.id
        return (
          <button key={study.id} onClick={() => { if (isPlaying) stopTransport(); openStudy(study.id); onSelect?.() }}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: isActive ? C.accentDim : 'transparent', border: 'none', borderLeft: `2px solid ${isActive ? C.accent : 'transparent'}`, color: isActive ? C.accent : C.textDim, fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: 1.5, textTransform: 'uppercase', padding: isMobile ? '14px 20px' : '8px 20px', cursor: 'pointer', lineHeight: 1.5, whiteSpace: 'pre-line', transition: 'all 0.15s' }}>
            {study.sceneTag.replace(/-/g, '\n')}
          </button>
        )
      })}
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Mobile header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: C.bgSidebar, position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.text }}>Ghost </span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.accent }}>Pattern</span>
          </div>
          <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: menuOpen ? C.accentDim : 'transparent', border: `1px solid ${menuOpen ? C.accent : C.border}`, borderRadius: 4, color: menuOpen ? C.accent : C.textSub, padding: '13px 20px', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>
            <span>{menuOpen ? '✕' : '☰'}</span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Scenes</span>
          </button>
        </div>

        {/* Scene drawer — inline, no fixed positioning, no z-index fights */}
        {menuOpen && (
          <div style={{ background: C.bgSidebar, borderBottom: `1px solid ${C.border}` }}>
            {studyList.map(study => {
              const isActive = study.id === activeStudy.id
              return (
                <button key={study.id}
                  onClick={() => { if (isPlaying) stopTransport(); openStudy(study.id); setMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', background: isActive ? C.accentDim : 'transparent', border: 'none', borderLeft: `3px solid ${isActive ? C.accent : 'transparent'}`, color: isActive ? C.accent : C.textSub, fontSize: 13, fontWeight: isActive ? 600 : 400, letterSpacing: 0.5, padding: '18px 20px', cursor: 'pointer', transition: 'background 0.1s' }}>
                  {study.title.split('—')[0].trim()}
                </button>
              )
            })}
          </div>
        )}

        {/* Mobile content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as CSSProperties['WebkitOverflowScrolling'] }}>
          {/* Header */}
          <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, marginBottom: 8, fontWeight: 500 }}>
              {activeStudy.era} · {activeStudy.sceneTag.replace(/-/g, ' ')}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 300, letterSpacing: -0.5, color: C.text, lineHeight: 1.1, marginBottom: 4 }}>
              {activeStudy.title.split('—')[0].trim()}
            </h1>
            <div style={{ fontSize: 12, color: C.textSub, fontWeight: 300, marginBottom: 16 }}>{activeStudy.subtitle}</div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Swing',  value: activeStudy.displayStats.swing },
                { label: 'Accent', value: activeStudy.displayStats.accent },
                { label: 'Shift',  value: activeStudy.displayStats.shift },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 300, color: C.text, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim, marginTop: 3, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div style={{ padding: '20px 20px 40px' }}>
            {VariationSwitcher}
            {DotGrid}
            {Transport}
            {MutationPanel}
          </div>
        </div>
      </div>
    )
  }

  // ── Desktop ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{ width: 176, flexShrink: 0, background: C.bgSidebar, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '28px 0 20px', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 28px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.text }}>Ghost</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.accent }}>Pattern</div>
        </div>
        <nav style={{ padding: '16px 0', flex: 1 }}>
          <div style={{ padding: '0 20px 10px', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: C.textDim, fontWeight: 500 }}>Scenes</div>
          <SceneList />
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '40px 48px 32px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: C.textDim, marginBottom: 14, fontWeight: 500 }}>
            {activeStudy.era} · {activeStudy.sceneTag.replace(/-/g, ' ')}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: -0.8, color: C.text, lineHeight: 1.1, marginBottom: 6 }}>
            {activeStudy.title.split('—')[0].trim()}
          </h1>
          <div style={{ fontSize: 14, color: C.textSub, fontWeight: 300, marginBottom: 24 }}>{activeStudy.subtitle}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: C.textSub, maxWidth: 500, margin: 0, fontWeight: 300 }}>
              {activeStudy.sceneTag.replace(/-/g, ' ')} patterns rely on{' '}
              <strong style={{ color: C.text, fontWeight: 500 }}>{activeStudy.tagline}</strong>
            </p>
            <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
              {[
                { label: 'Swing',  value: activeStudy.displayStats.swing },
                { label: 'Accent', value: activeStudy.displayStats.accent },
                { label: 'Shift',  value: activeStudy.displayStats.shift },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 300, color: C.text, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.textDim, marginTop: 4, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div style={{ padding: '28px 48px 40px', flex: 1 }}>
          {VariationSwitcher}
          {DotGrid}
          {Transport}
          {MutationPanel}

          {/* Annotation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 32, marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, lineHeight: 1.85, color: C.textDim, margin: 0, fontWeight: 300 }}>{activeStudy.annotation}</p>
            <div>
              {[
                { label: 'Swing Feel',  text: activeStudy.grooveProfile.swingFeel },
                { label: 'Accent',      text: activeStudy.grooveProfile.accentLogic },
                { label: 'Microtiming', text: activeStudy.grooveProfile.microtimingTendencies },
              ].map(({ label, text }, i) => (
                <div key={label} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2.5, textTransform: 'uppercase', color: C.textDim, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6, fontWeight: 300 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
