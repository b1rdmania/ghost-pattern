import { useStore } from '../store'

export function SceneBrowser() {
  const studies = useStore(s => s.studies)
  const activeStudy = useStore(s => s.activeStudy)
  const openStudy = useStore(s => s.openStudy)

  const studyList = Object.values(studies)
  if (studyList.length <= 1) return null

  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      padding: '0 32px',
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
    }}>
      {studyList.map(study => {
        const isActive = study.id === activeStudy?.id
        return (
          <button
            key={study.id}
            onClick={() => openStudy(study.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? '#4ade80' : 'transparent'}`,
              color: isActive ? '#e5e5e5' : '#3a3a3a',
              fontSize: 10,
              fontFamily: 'monospace',
              letterSpacing: 2,
              textTransform: 'uppercase',
              padding: '14px 16px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.target as HTMLButtonElement).style.color = '#888'
            }}
            onMouseLeave={e => {
              if (!isActive) (e.target as HTMLButtonElement).style.color = '#3a3a3a'
            }}
          >
            {study.sceneTag.replace(/-/g, ' ')}
          </button>
        )
      })}
    </div>
  )
}
