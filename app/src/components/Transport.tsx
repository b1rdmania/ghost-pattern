import { useStore } from '../store'
import { startTransport, stopTransport, syncBpm } from '../lib/scheduler'
import { downloadMIDI } from '../lib/midi'

export function Transport() {
  const isPlaying = useStore(s => s.isPlaying)
  const playgroundDoc = useStore(s => s.playgroundDoc)
  const setPlaygroundDoc = useStore(s => s.setPlaygroundDoc)

  if (!playgroundDoc) return null

  async function handlePlayStop() {
    if (isPlaying) {
      stopTransport()
    } else {
      await startTransport()
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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      padding: '16px 0',
      borderTop: '1px solid #222',
      marginTop: 16,
    }}>
      {/* Play / Stop */}
      <button
        onClick={handlePlayStop}
        style={{
          background: isPlaying ? '#222' : '#4ade80',
          color: isPlaying ? '#4ade80' : '#000',
          border: isPlaying ? '1px solid #4ade80' : 'none',
          borderRadius: 4,
          padding: '6px 20px',
          fontSize: 12,
          fontFamily: 'monospace',
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>

      {/* BPM */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#555' }}>
        <span style={{ letterSpacing: 1, textTransform: 'uppercase' }}>BPM</span>
        <input
          type="number"
          min={60}
          max={200}
          value={playgroundDoc.bpm}
          onChange={e => handleBpmChange(e.target.value)}
          style={{
            width: 56,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 4,
            color: '#eee',
            fontSize: 14,
            fontFamily: 'monospace',
            padding: '4px 8px',
            textAlign: 'center',
          }}
        />
      </label>

      {/* Bars */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#555' }}>
        <span style={{ letterSpacing: 1, textTransform: 'uppercase' }}>Bars</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 4].map(n => (
            <button
              key={n}
              onClick={() => handleBarsChange(n)}
              style={{
                width: 28,
                height: 28,
                background: playgroundDoc.bars === n ? '#4ade80' : '#1a1a1a',
                color: playgroundDoc.bars === n ? '#000' : '#555',
                border: `1px solid ${playgroundDoc.bars === n ? '#4ade80' : '#333'}`,
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </label>

      {/* MIDI export */}
      <button
        onClick={() => downloadMIDI(playgroundDoc)}
        style={{
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: 4,
          color: '#555',
          fontSize: 11,
          fontFamily: 'monospace',
          letterSpacing: 1,
          textTransform: 'uppercase',
          padding: '6px 12px',
          cursor: 'pointer',
          marginLeft: 'auto',
        }}
      >
        Export MIDI
      </button>
    </div>
  )
}
