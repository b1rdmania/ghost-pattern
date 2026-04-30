import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { mutate } from '../lib/mutate'
import type { MutationParams } from '../types'

interface SliderConfig {
  key: keyof Omit<MutationParams, 'seed'>
  label: string
  hint: string
  min: number
  max: number
  step: number
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'swingAmount',
    label: 'Swing',
    hint: '0 = straight · 1 = full preset feel',
    min: 0, max: 1, step: 0.01,
  },
  {
    key: 'ghostNoteDensity',
    label: 'Ghost Notes',
    hint: 'Probability of ghost insert on snare + hat',
    min: 0, max: 1, step: 0.01,
  },
  {
    key: 'hatVariation',
    label: 'Hat Chaos',
    hint: 'Probability of flipping hat steps',
    min: 0, max: 1, step: 0.01,
  },
  {
    key: 'accentShift',
    label: 'Accent Drift',
    hint: 'Shift accent steps within beat groups',
    min: -1, max: 1, step: 0.01,
  },
]

function fmt(v: number) {
  return v.toFixed(2)
}

function randomSeed() {
  return Math.floor(Math.random() * 999983)
}

export function MutationPanel() {
  const basePattern = useStore(s => s.basePattern)
  const playgroundDoc = useStore(s => s.playgroundDoc)
  const setPlaygroundDocLive = useStore(s => s.setPlaygroundDocLive)
  const addToHistory = useStore(s => s.addToHistory)
  const undo = useStore(s => s.undo)
  const historyLength = useStore(s => s.history.length)

  const [params, setParams] = useState<Omit<MutationParams, 'seed'>>({
    swingAmount: 0,
    ghostNoteDensity: 0,
    hatVariation: 0,
    accentShift: 0,
  })
  const [seed, setSeed] = useState(randomSeed)

  // Apply mutation live whenever params, seed, or base pattern changes
  useEffect(() => {
    if (!basePattern) return
    const result = mutate(basePattern, { ...params, seed })
    setPlaygroundDocLive(result)
  }, [params, seed, basePattern, setPlaygroundDocLive])

  function setParam(key: keyof typeof params, value: number) {
    setParams(p => ({ ...p, [key]: value }))
  }

  function handleNewSeed() {
    // Commit current state to history before rolling to a new seed
    if (playgroundDoc) addToHistory(playgroundDoc)
    setSeed(randomSeed())
  }

  return (
    <div style={{
      borderTop: '1px solid #1e1e1e',
      paddingTop: 20,
      marginTop: 4,
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: 3,
        color: '#444',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        Mutate
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px 32px',
        marginBottom: 20,
      }}>
        {SLIDERS.map(({ key, label, hint, min, max, step }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#888', letterSpacing: 0.5 }}>{label}</span>
              <span style={{ fontSize: 11, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(params[key])}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key]}
              onChange={e => setParam(key, parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 10, color: '#333', marginTop: 4 }}>{hint}</div>
          </div>
        ))}
      </div>

      {/* Seed row + undo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#333', letterSpacing: 1, textTransform: 'uppercase' }}>Seed</span>
          <input
            type="number"
            value={seed}
            onChange={e => setSeed(parseInt(e.target.value, 10) || 0)}
            style={{
              width: 72,
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 3,
              color: '#555',
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '3px 6px',
            }}
          />
          <button
            onClick={handleNewSeed}
            title="New seed — commits current state to history"
            style={{
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 3,
              color: '#444',
              fontSize: 13,
              cursor: 'pointer',
              padding: '2px 7px',
              lineHeight: 1,
            }}
          >
            ↺
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {historyLength > 0 && (
            <button
              onClick={undo}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: 3,
                color: '#444',
                fontSize: 11,
                fontFamily: 'monospace',
                letterSpacing: 1,
                textTransform: 'uppercase',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              ← Undo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
