import { CSSProperties } from 'react'

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
    borderRight: '1px solid rgba(255,255,255,0.1)',
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
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
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
    color: 'rgba(255,255,255,0.4)',
    textDecoration: 'none',
    transition: 'all 0.2s',
    borderLeft: '2px solid transparent',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    textAlign: 'left' as const,
    width: '100%',
    display: 'block',
    borderLeftWidth: '2px',
    borderLeftStyle: 'solid' as const,
    borderLeftColor: 'transparent',
  },
  sceneLinkActive: {
    borderLeftColor: '#E2FF46',
    color: '#ffffff',
    background: 'rgba(226,255,70,0.05)',
    fontWeight: 600,
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  headerSettings: {
    padding: '60px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  settingsContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: 0,
    flex: 1,
  },
  settingsGrid: {
    padding: '40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '60px',
    overflowY: 'auto',
  },
  settingsSectionTitle: {
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    color: '#E2FF46',
    marginBottom: '32px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '8px',
  },
  settingRow: {
    marginBottom: '32px',
  },
  settingLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#ffffff',
  },
  settingDesc: {
    display: 'block',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '12px',
    lineHeight: 1.4,
  },
  shortcutSidebar: {
    background: '#1a1a1b',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    padding: '40px',
    overflowY: 'auto',
  },
  shortcutSidebarTitle: {
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '24px',
  },
  shortcutItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  shortcutKey: {
    fontFamily: 'monospace',
    background: 'rgba(255,255,255,0.05)',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    color: '#E2FF46',
  },
  shortcutAction: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  footerActions: {
    padding: '24px 40px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    background: '#1a1a1b',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.4)',
    padding: '10px 24px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    background: '#E2FF46',
    border: '1px solid #E2FF46',
    color: '#121213',
    padding: '10px 24px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
    display: 'inline-block',
  },
  versionFooter: {
    marginTop: 'auto',
    padding: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  seedBox: {
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '11px',
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.4)',
  },
}

const scenes = [
  'Chicago House',
  'Berlin Techno',
  'Detroit Techno',
  'NYC Garage',
]

const links = [
  { label: 'Source Code', value: 'GitHub', href: 'https://github.com/b1rdmania/ghost-pattern' },
  { label: 'Builder', value: '@b1rdmania', href: 'https://x.com/b1rdmania' },
  { label: 'Live App', value: 'ghost-pattern.pages.dev', href: 'https://ghost-pattern.pages.dev' },
]

const stack = [
  { label: 'UI', value: 'React 18 + TypeScript' },
  { label: 'Audio', value: 'Tone.js 14' },
  { label: 'State', value: 'Zustand' },
  { label: 'Build', value: 'Vite' },
  { label: 'Deploy', value: 'Cloudflare Pages' },
  { label: 'MIDI Export', value: '@tonejs/midi' },
]

interface Props {
  onBack: () => void
}

export default function AboutPage({ onBack }: Props) {
  return (
    <div style={styles.body}>
      <aside style={styles.sideNav}>
        <div style={styles.brand} onClick={onBack}>GHOST PATTERN</div>
        <div style={styles.sceneLinks}>
          {scenes.map((s) => (
            <span key={s} style={{ ...styles.sceneLink, opacity: 0.3, pointerEvents: 'none' as const }}>{s}</span>
          ))}
          <span style={{ ...styles.sceneLink, ...styles.sceneLinkActive }}>About</span>
        </div>
        <div style={styles.versionFooter}>
          <div style={styles.seedBox}>V0.1.0 — APRIL 2026</div>
        </div>
      </aside>

      <div style={styles.mainContainer}>
        <header style={styles.headerSettings}>
          <h1 style={{ fontSize: '48px', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Drum patterns from the <strong>electronic music canon.</strong>
          </h1>
        </header>

        <div style={styles.settingsContent}>
          <div style={styles.settingsGrid}>

            <section>
              <h2 style={styles.settingsSectionTitle}>What It Is</h2>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>What It Is</label>
                <span style={styles.settingDesc}>
                  Open a scene, hear the pattern, load variations, move sliders, export MIDI. Each scene has a canonical pattern, authored variations, and a matched 909/808 kit.
                </span>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>Why</label>
                <span style={styles.settingDesc}>
                  Most tools are either static loops or full DAWs. This sits between — a drum lab where every pattern has a source and a story.
                </span>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>Scenes</label>
                <span style={styles.settingDesc}>
                  Chicago House · Berlin Techno · Detroit Techno · NYC Garage
                </span>
              </div>
            </section>

            <section>
              <h2 style={styles.settingsSectionTitle}>What's Coming</h2>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>Ableton Export</label>
                <span style={styles.settingDesc}>
                  Export directly into a Live set — MIDI on a drum rack, BPM matched.
                </span>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>Clip Analysis</label>
                <span style={styles.settingDesc}>
                  Drop in a drum loop. It maps the hits to the grid and lets you study it like a built-in scene.
                </span>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>More Scenes</label>
                <span style={styles.settingDesc}>
                  Jungle · Baltimore Club · Broken Beat · UKG · Footwork
                </span>
              </div>
            </section>

          </div>

          <aside style={styles.shortcutSidebar}>
            <h2 style={styles.shortcutSidebarTitle}>Links</h2>
            {links.map((item, i) => (
              <div key={i} style={{ ...styles.shortcutItem, ...(i === links.length - 1 ? { borderBottom: 'none' } : {}) }}>
                <span style={styles.shortcutAction}>{item.label}</span>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...styles.shortcutKey, textDecoration: 'none', color: '#E2FF46' }}
                >
                  {item.value}
                </a>
              </div>
            ))}

            <h2 style={{ ...styles.shortcutSidebarTitle, marginTop: '40px' }}>Stack</h2>
            {stack.map((item, i) => (
              <div key={i} style={{ ...styles.shortcutItem, ...(i === stack.length - 1 ? { borderBottom: 'none' } : {}) }}>
                <span style={styles.shortcutAction}>{item.label}</span>
                <span style={{ ...styles.shortcutKey, color: 'rgba(255,255,255,0.6)' }}>{item.value}</span>
              </div>
            ))}

            <div style={{ marginTop: '40px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
              Built in a day.<br />
              Patterns from source records.
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginBottom: '12px' }}>Deep Cuts</div>
              <a
                href="/#perlon"
                style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.05em' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E2FF46')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                Perlon — The Zip Ground →
              </a>
            </div>
          </aside>
        </div>

        <footer style={styles.footerActions}>
          <button style={styles.btnGhost} onClick={onBack}>Back to App</button>
          <a
            href="https://github.com/b1rdmania/ghost-pattern"
            target="_blank"
            rel="noreferrer"
            style={styles.btnPrimary}
          >
            View on GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}
