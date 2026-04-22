'use client'

import { useState, useEffect, useMemo } from 'react'

import { parseHeadings } from '@/lib/headings'

/* Icon components for sidebar sections */
function HomeIcon() {
  return (
    <svg style={{ width: 20, height: 20, color: '#94a3b8', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg style={{ width: 20, height: 20, color: '#94a3b8', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg style={{ width: 20, height: 20, color: '#94a3b8', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg style={{ width: 20, height: 20, color: '#94a3b8', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function ChevronDown({ open }) {
  return (
    <svg style={{
      width: 16, height: 16,
      transition: 'transform 200ms',
      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

/* Map category names to icons */
const CATEGORY_ICONS = {
  'Getting Started': BookIcon,
  'Features': BoxIcon,
  'Administration': GearIcon,
}

export default function PublicSidebar({ guides }) {
  const [activeGuideSlug, setActiveGuideSlug] = useState(guides[0]?.slug || null)
  const [activeSubId, setActiveSubId]         = useState(null)
  const [mobileOpen, setMobileOpen]           = useState(false)
  const [expanded, setExpanded] = useState(() => new Set([guides[0]?.slug]))

  function toggleExpanded(slug) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  const guidesWithSections = useMemo(
    () => guides.map(g => ({ ...g, sections: parseHeadings(g.content) })),
    [guides]
  )

  const categories = useMemo(() => guidesWithSections.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = []
    acc[g.category].push(g)
    return acc
  }, {}), [guidesWithSections])

  const [catExpanded, setCatExpanded] = useState(() => {
    const s = new Set()
    Object.keys(categories).forEach(cat => s.add(cat))
    return s
  })

  // Ensure new categories are expanded by default if data changes
  useEffect(() => {
    setCatExpanded(prev => {
      const next = new Set(prev)
      let changed = false
      Object.keys(categories).forEach(cat => {
        if (!next.has(cat)) {
          next.add(cat)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [categories])

  function toggleCategory(cat) {
    setCatExpanded(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // Auto-expand subsections when a guide becomes active via scroll
  useEffect(() => {
    if (activeGuideSlug) {
      setExpanded(prev => {
        if (prev.has(activeGuideSlug)) return prev
        const next = new Set(prev)
        next.add(activeGuideSlug)
        return next
      })
    }
  }, [activeGuideSlug])

  // Auto-scroll sidebar when active guide/section changes
  useEffect(() => {
    const targetId = activeSubId ? `nav-${activeSubId}` : (activeGuideSlug ? `nav-${activeGuideSlug}` : null)
    if (targetId) {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeGuideSlug, activeSubId])

  useEffect(() => {
    if (!guides.length) return
    const container = document.getElementById('main-scroll-container')
    if (!container) return

    function onScroll() {
      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 64
      const guideThreshold = headerH + 20
      const subThreshold = window.innerHeight * 0.5

      let currentSlug = guides[0]?.slug
      for (const g of guides) {
        const el = document.getElementById(g.slug)
        if (!el) continue
        if (el.getBoundingClientRect().top <= guideThreshold) currentSlug = g.slug
      }
      setActiveGuideSlug(currentSlug)

      const activeGuide = guidesWithSections.find(g => g.slug === currentSlug)
      if (activeGuide?.sections.length) {
        let currentSub = activeGuide.sections[0]?.id
        for (const sec of activeGuide.sections) {
          const el = document.getElementById(sec.id)
          if (!el) continue
          if (el.getBoundingClientRect().top <= subThreshold) currentSub = sec.id
        }
        setActiveSubId(currentSub)
      } else {
        setActiveSubId(null)
      }
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => container.removeEventListener('scroll', onScroll)
  }, [guides, guidesWithSections])

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
    setMobileOpen(false)
  }

  const nav = (
    <nav className="no-scrollbar" style={{
      width: 'var(--sidebar-width)', flexShrink: 0,
      background: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      overflowY: 'auto',
      height: '100%',
      paddingTop: 16,
    }}>
      <div style={{ padding: '0 16px 40px' }}>
        {/* Overview link */}
        <button
          className="sidebar-link"
          style={{
            display: 'flex', alignItems: 'center', width: '100%',
            padding: '8px 8px',
            background: 'transparent', border: 'none', borderRadius: 6,
            cursor: 'pointer', transition: 'background 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <HomeIcon />
          <span style={{ marginLeft: 12 }}>Overview</span>
        </button>

        {/* Category sections */}
        {Object.entries(categories).map(([cat, catGuides]) => {
          const IconComponent = CATEGORY_ICONS[cat] || BookIcon
          const isCatOpen = catExpanded.has(cat)

          return (
            <div key={cat} style={{ marginTop: 24 }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 8px',
                  fontSize: 14, fontWeight: 600, color: '#0f172a',
                  background: 'transparent', border: 'none', borderRadius: 6,
                  cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IconComponent />
                  <span style={{ marginLeft: 12 }}>{cat}</span>
                </div>
                <ChevronDown open={isCatOpen} />
              </button>

              {/* Guide links within category */}
              {isCatOpen && (
                <div style={{ marginTop: 4, marginLeft: 32, paddingLeft: 16 }}>
                  {catGuides.map(guide => {
                    const isActive = guide.slug === activeGuideSlug
                    const isExpanded = expanded.has(guide.slug)

                    return (
                      <div key={guide.slug}>
                        <a
                          id={`nav-${guide.slug}`}
                          href={`#${guide.slug}`}
                          className={`sidebar-link${isActive ? ' active' : ''}`}
                          onClick={e => {
                            scrollTo(guide.slug, e)
                            if (guide.sections.length > 0) toggleExpanded(guide.slug)
                          }}
                          style={{
                            display: 'block',
                            padding: '8px 10px',
                            textDecoration: 'none',
                            borderRadius: 0,
                            borderLeft: isActive ? '2px solid #0265DC' : '2px solid transparent',
                            background: 'transparent',
                            transition: 'all 150ms',
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#0f172a' }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '' }}
                        >
                          {guide.shortTitle}
                        </a>

                        {/* Subsection links */}
                        {isExpanded && guide.sections.length > 0 && (
                          <div style={{ marginLeft: 16, borderLeft: '2px solid #e2e8f0', marginBottom: 4 }}>
                            {guide.sections.map(sec => {
                              const secActive = activeSubId === sec.id
                              return (
                                <a
                                  key={sec.id}
                                  id={`nav-${sec.id}`}
                                  href={`#${sec.id}`}
                                  className={`sidebar-link${secActive ? ' active' : ''}`}
                                  onClick={e => scrollTo(sec.id, e)}
                                  style={{
                                    display: 'block',
                                    padding: '5px 12px',
                                    fontSize: 13,
                                    textDecoration: 'none',
                                    background: 'transparent',
                                    borderRadius: '0 4px 4px 0',
                                    transition: 'all 120ms',
                                  }}
                                  onMouseEnter={e => { if (!secActive) e.currentTarget.style.color = '#0f172a' }}
                                  onMouseLeave={e => { if (!secActive) e.currentTarget.style.color = '#64748b' }}
                                >
                                  {sec.title}
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
        className="mobile-menu-btn"
        style={{
          display: 'none', position: 'fixed', bottom: 16, left: 16, zIndex: 60,
          background: '#fff', color: '#475569', border: '1px solid #e2e8f0',
          borderRadius: '50%', padding: 8, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          width: 44, height: 44,
        }}
      >
        <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </button>

      <div className="sidebar-desktop">{nav}</div>

      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 'var(--sidebar-width)', height: '100%' }}>
            {nav}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none; }
          .mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; }
        }
      `}</style>
    </>
  )
}
