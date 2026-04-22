'use client'

import { useState, useEffect, useMemo } from 'react'

import { parseHeadings } from '@/lib/headings'

export default function RightSidebar({ guides }) {
  const [activeId, setActiveId] = useState(null)

  // Collect all h2s from all guides
  const allHeadings = useMemo(() => {
    const headings = []
    guides.forEach(g => {
      const parsed = parseHeadings(g.content)
      // Add the guide itself as a top-level entry
      headings.push({ id: g.slug, title: g.title, isGuide: true })
      parsed.forEach(h => headings.push({ ...h, isGuide: false }))
    })
    return headings
  }, [guides])

  useEffect(() => {
    const container = document.getElementById('main-scroll-container')
    if (!container) return

    function onScroll() {
      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 64
      const threshold = window.innerHeight * 0.4

      let currentId = allHeadings[0]?.id
      for (const h of allHeadings) {
        const el = document.getElementById(h.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= threshold) currentId = h.id
      }
      setActiveId(currentId)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => container.removeEventListener('scroll', onScroll)
  }, [allHeadings])

  function scrollTo(id, e) {
    e.preventDefault()
    const el = document.getElementById(id)
    const container = document.getElementById('main-scroll-container')
    if (!el || !container) return
    const headerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height')
    ) || 64
    const top = el.getBoundingClientRect().top + container.scrollTop - headerH - 16
    container.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <aside style={{ width: 256, flexShrink: 0 }} className="right-sidebar-desktop">
      <div style={{ position: 'sticky', top: 'calc(var(--header-height) + 32px)' }}>
        <h3 style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#0f172a',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 16,
        }}>
          On this page
        </h3>

        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          borderLeft: '2px solid #e2e8f0',
          marginLeft: 4,
        }}>
          {allHeadings.map(h => {
            const isActive = activeId === h.id
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={e => scrollTo(h.id, e)}
                  style={{
                    display: 'block',
                    paddingLeft: 16,
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: 14,
                    color: isActive ? '#0f172a' : '#64748b',
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: 'none',
                    borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                    marginLeft: -2,
                    transition: 'all 150ms',
                  }}
                >
                  {h.title}
                </a>
              </li>
            )
          })}
        </ul>

        {/* Tool Actions */}
        {/* TODO (L-4): Implement feedback/tool actions backend. Currently UI only. */}
        <div style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <ToolAction icon="share" label="Share" />
          <ToolAction icon="print" label="Print" />
          <ToolAction icon="feedback" label="Feedback" />
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

function ToolAction({ icon, label }) {
  const icons = {
    share: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    print: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    feedback: (
      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
  }

  return (
    <button
      style={{
        display: 'flex', alignItems: 'center',
        color: '#475569', fontSize: 14,
        background: 'transparent', border: 'none',
        cursor: 'pointer', transition: 'color 150ms',
        padding: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
      onMouseLeave={e => e.currentTarget.style.color = '#475569'}
    >
      <span style={{ marginRight: 12, color: '#94a3b8', display: 'flex' }}>{icons[icon]}</span>
      {label}
    </button>
  )
}
