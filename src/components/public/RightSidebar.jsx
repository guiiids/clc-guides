'use client'

export default function RightSidebar({ guides }) {
  // Derive related resources from sibling guides (exclude the first/current one)
  const relatedGuides = guides.slice(1, 4)

  return (
    <aside style={{ width: 280, flexShrink: 0 }} className="right-sidebar-desktop" data-purpose="utility-hub">
      <div style={{ position: 'sticky', top: 'calc(var(--header-height) + 32px)' }}>

        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: 24,
        }}>
          Resources
        </h3>

        {/* ── Article Metadata ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <MetaRow icon="calendar" text="Last Updated: Oct 12, 2023" />
          <MetaRow icon="clock"    text="5 min read" />
        </div>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>Quick Actions</SectionLabel>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingLeft: 8,
            paddingRight: 8,
          }}>
            <QuickAction icon="download" label="Download PDF" />
            <QuickAction icon="print"    label="Print" />
            <QuickAction icon="share"    label="Share" />
          </div>
        </div>

        {/* ── Related Resources ─────────────────────────────────────── */}
        {relatedGuides.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <SectionLabel>Related Resources</SectionLabel>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {relatedGuides.map(g => (
                  <li key={g.slug}>
                    <a
                      href={`#${g.slug}`}
                      style={{
                        fontSize: 14,
                        color: '#334155',
                        textDecoration: 'none',
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#0068b5'}
                      onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                    >
                      {g.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Need Help? Card ──────────────────────────────────────── */}
        <div
          data-purpose="help-card"
          style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Need Help?
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#0068b5',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Contact Support
            </button>
            <button
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #0068b5',
                background: '#fff',
                color: '#0068b5',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e6f0f8'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Live Chat
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 1280px) {
          .right-sidebar-desktop { display: none; }
        }
      `}</style>
    </aside>
  )
}


/* ── Sub-components ──────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <h4 style={{
      fontSize: 11,
      fontWeight: 700,
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 16,
    }}>
      {children}
    </h4>
  )
}

function MetaRow({ icon, text }) {
  const icons = {
    calendar: (
      <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    clock: (
      <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#64748b' }}>
      <span style={{ display: 'flex', color: '#94a3b8' }}>{icons[icon]}</span>
      {text}
    </div>
  )
}

function QuickAction({ icon, label }) {
  const icons = {
    download: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    print: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    share: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
  }

  return (
    <button
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 8,
        cursor: 'pointer',
        padding: '12px 8px',
        transition: 'border-color 150ms, background 150ms',
        flex: 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#e2e8f0'
        e.currentTarget.style.background = '#f8fafc'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', color: '#475569' }}>
        {icons[icon]}
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{label}</span>
    </button>
  )
}
