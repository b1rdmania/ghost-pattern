import { useState, useEffect, CSSProperties } from 'react'
import { useStore } from '../store'

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: '#121213',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    display: 'flex',
    WebkitFontSmoothing: 'antialiased',
  } as CSSProperties,
  sideNav: {
    width: '240px',
    height: '100vh',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#121213',
    flexShrink: 0,
  },
  brand: {
    padding: '32px 24px',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '-0.02em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sceneLinks: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
  },
  sceneLink: {
    padding: '14px 24px',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'rgba(255, 255, 255, 0.4)',
    textDecoration: 'none',
    borderLeft: '2px solid transparent',
    pointerEvents: 'none',
    opacity: 0.5,
  },
  sidebarBottom: {
    marginTop: 'auto',
    padding: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  seedBox: {
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '11px',
    textAlign: 'center' as const,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  aboutLink: {
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    textAlign: 'center' as const,
    padding: '8px',
    textDecoration: 'none',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  onboardingHeader: {
    padding: '80px 60px 40px 60px',
  },
  h1: {
    fontSize: '64px',
    fontWeight: 300,
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    maxWidth: '800px',
  },
  h1Strong: {
    fontWeight: 600,
  },
  genreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  genreTile: {
    backgroundColor: '#121213',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  genreTileHover: {
    background: 'rgba(255, 255, 255, 0.02)',
  },
  featuredTile: {
    gridColumn: 'span 2',
    background: 'linear-gradient(45deg, #121213 0%, #161617 100%)',
  },
  genreMeta: {
    fontSize: '9px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '24px',
  },
  genreTitle: {
    fontSize: '32px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    marginBottom: '12px',
    transition: 'color 0.2s',
  },
  genreTitleHover: {
    color: '#E2FF46',
  },
  genreDesc: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 1.6,
    maxWidth: '280px',
  },
  genreArrow: {
    position: 'absolute',
    bottom: '40px',
    right: '40px',
    opacity: 0,
    transform: 'translateX(-10px)',
    transition: 'all 0.3s ease',
    color: '#E2FF46',
  },
  genreArrowHover: {
    opacity: 1,
    transform: 'translateX(0)',
  },
}

const genres = [
  {
    studyId: 'study-berlin-techno-001',
    meta: 'Engine 01 / High Energy',
    title: 'Berlin Techno',
    desc: 'Relentless 4/4 structures, industrial timbres, and peak-time momentum. 130-140 BPM.',
    featured: true,
  },
  {
    studyId: 'study-chicago-house-001',
    meta: 'Engine 02 / Soul',
    title: 'Chicago House',
    desc: 'The original swing. Jacking grooves and deep harmonic syncopation.',
    featured: false,
  },
  {
    studyId: 'study-detroit-techno-001',
    meta: 'Engine 03 / Futurist',
    title: 'Detroit Techno',
    desc: 'Machine soul. Complex percussion layering and hi-tech rhythmic tension.',
    featured: false,
  },
  {
    studyId: 'study-nyc-garage-001',
    meta: 'Engine 04 / Shuffle',
    title: 'NYC Garage',
    desc: 'Swing-heavy hi-hats and syncopated snare placements. The sound of the underground.',
    featured: false,
  },
  {
    studyId: 'study-uk-acid-001',
    meta: 'Engine 05 / Raw',
    title: 'UK Acid Rave',
    desc: 'Straight grid, maximum floor impact. The drum machine that survived the warehouse.',
    featured: false,
  },
]

const ArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

interface Genre {
  studyId: string
  meta: string
  title: string
  desc: string
  featured: boolean
}

const GenreTile = ({ genre, onSelect }: { genre: Genre; onSelect: (g: Genre) => void }) => {
  const [hovered, setHovered] = useState(false)

  const tileStyle: CSSProperties = {
    ...styles.genreTile,
    ...(genre.featured ? styles.featuredTile : {}),
    ...(hovered ? styles.genreTileHover : {}),
    ...(genre.featured && !hovered ? { background: 'linear-gradient(45deg, #121213 0%, #161617 100%)' } : {}),
  }

  const titleStyle: CSSProperties = {
    ...styles.genreTitle,
    ...(hovered ? styles.genreTitleHover : {}),
  }

  const arrowStyle: CSSProperties = {
    ...styles.genreArrow,
    ...(hovered ? styles.genreArrowHover : {}),
  }

  return (
    <div
      style={tileStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(genre)}
    >
      <div>
        <div style={styles.genreMeta}>{genre.meta}</div>
        <div style={titleStyle}>{genre.title}</div>
        <p style={styles.genreDesc}>{genre.desc}</p>
      </div>
      <div style={arrowStyle}>
        <ArrowIcon />
      </div>
    </div>
  )
}

const SessionModal = ({ genre, onClose, onBegin }: { genre: Genre | null; onClose: () => void; onBegin: (studyId: string) => void }) => {
  if (!genre) return null

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  }

  const modalStyle: CSSProperties = {
    backgroundColor: '#1a1a1b',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '48px',
    maxWidth: '480px',
    width: '90%',
  }

  const sessionId = `GH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
          {genre.meta}
        </div>
        <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px', color: '#E2FF46' }}>
          {genre.title}
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '32px' }}>
          {genre.desc}
        </p>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', textAlign: 'center', marginBottom: '24px' }}>
          SESSION ID: {sessionId}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onBegin(genre.studyId)}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#E2FF46',
              color: '#121213',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Begin Session
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  onEnter: (studyId: string) => void
  onAbout: () => void
}

export default function SplashPage({ onEnter, onAbout }: Props) {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const openStudy = useStore(s => s.openStudy)

  const sceneLinks = ['Chicago House', 'Berlin Techno', 'Detroit Techno', 'NYC Garage', 'UK Acid Rave']

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  function handleBegin(studyId: string) {
    openStudy(studyId)
    setSelectedGenre(null)
    onEnter(studyId)
  }

  return (
    <div style={styles.body}>
      <aside style={styles.sideNav}>
        <div style={styles.brand}>GHOST PATTERN</div>
        <div style={styles.sceneLinks}>
          {sceneLinks.map((link) => (
            <span key={link} style={styles.sceneLink}>{link}</span>
          ))}
        </div>
        <div style={styles.sidebarBottom}>
          <div style={styles.seedBox}>SELECT A SCENE TO BEGIN</div>
          <span style={styles.aboutLink} onClick={onAbout}>About</span>
        </div>
      </aside>

      <div style={styles.mainContainer}>
        <header style={styles.onboardingHeader}>
          <h1 style={styles.h1}>
            Select a <strong style={styles.h1Strong}>foundational engine</strong> to begin synthesizing.
          </h1>
        </header>

        <main style={styles.genreGrid}>
          {genres.map((genre) => (
            <GenreTile key={genre.studyId} genre={genre} onSelect={setSelectedGenre} />
          ))}
        </main>
      </div>

      <SessionModal genre={selectedGenre} onClose={() => setSelectedGenre(null)} onBegin={handleBegin} />
    </div>
  )
}
