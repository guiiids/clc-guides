'use client'

import { useState, useEffect, useMemo } from 'react'

function parseHeadings(html) {
  if (!html) return []
  const matches = [...html.matchAll(/<h2[^>]*\sid="([^"]+)"[^>]*>(.*?)<\/h2>/gi)]
  return matches.map(m => ({
    id: m[1],
    title: m[2].replace(/<[^>]+>/g, '').trim(),
  }))
}

export default function PublicSidebar({ guides }) {
  const [activeGuideSlug, setActiveGuideSlug] = useState(guides[0]?.slug || null)
  const [activeSubId, setActiveSubId]         = useState(null)
  const [mobileOpen, setMobileOpen]           = useState(false)
  // Which guides have their subsections expanded (click-controlled accordion)
  const [expanded, setExpanded] = useState(() => new Set([guides[0]?.slug]))

  function toggleExpanded(slug) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  // Parse h2 subsections for every guide
  const guidesWithSections = useMemo(
    () => guides.map(g => ({ ...g, sections: parseHeadings(g.content) })),
    [guides]
  )

  // Group by category
  const categories = useMemo(() => guidesWithSections.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = []
    acc[g.category].push(g)
    return acc
  }, {}), [guidesWithSections])

  // Track which guide + which subsection is in view
  useEffect(() => {
    if (!guides.length) return

    function onScroll() {
      const headerH  = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 120
      // Guide switches as soon as the section top reaches the header bottom
      const guideThreshold = headerH + 20
      // Subsection switches when the h2 is in the upper half of the viewport
      // (i.e. it's the heading the user is actively reading)
      const subThreshold = window.innerHeight * 0.5

      // Active guide
      let currentSlug = guides[0]?.slug
      for (const g of guides) {
        const el = document.getElementById(g.slug)
        if (!el) continue
        if (el.getBoundingClientRect().top <= guideThreshold) currentSlug = g.slug
      }
      setActiveGuideSlug(currentSlug)

      // Active h2 within the active guide
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

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [guides, guidesWithSections])

  function scrollTo(id, e) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const headerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height')
    ) || 120
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16
    window.scrollTo({ top, behavior: 'smooth' })
    setMobileOpen(false)
  }

  const nav = (
    <nav style={{
      width: 'var(--sidebar-width)', flexShrink: 0,
      position: 'sticky', top: 'var(--header-height)',
      height: 'calc(100vh - var(--header-height))',
      background: '#fff', borderRight: '1px solid var(--lighter-gray)',
      overflowY: 'auto', paddingTop: 20,
    }}>
      <div style={{ padding: '0 0 40px' }}>
        {Object.entries(categories).map(([cat, catGuides]) => (
          <div key={cat} style={{ marginBottom: 24 }}>

            {/* Category header */}
            <div style={{
              fontSize: 11, fontWeight: 500, color: 'var(--medium-gray)',
              textTransform: 'uppercase', letterSpacing: '1px',
              padding: '5px 20px 8px',
            }}>
              {cat}
            </div>

            {catGuides.map(guide => {
              const isActive   = guide.slug === activeGuideSlug
              const isExpanded = expanded.has(guide.slug)

              return (
                <div key={guide.slug}>
                  {/* Guide anchor link — click scrolls AND toggles subsections */}
                  <a
                    href={`#${guide.slug}`}
                    onClick={e => {
                      scrollTo(guide.slug, e)
                      toggleExpanded(guide.slug)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 15px', fontSize: 14, borderRadius: 4, margin: '0 8px 2px',
                      color: isActive ? '#fff' : 'var(--dark-gray)',
                      fontWeight: isActive ? 500 : 400,
                      textDecoration: 'none',
                      background: isActive ? 'var(--primary-blue)' : 'transparent',
                      transition: 'all 150ms',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--light-gray)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{guide.shortTitle}</span>
                    {guide.sections.length > 0 && (
                      <span style={{
                        fontSize: 10,
                        color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--medium-gray)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                        transition: 'transform 200ms',
                      }}>▶</span>
                    )}
                  </a>

                  {/* Subsection anchor links — shown when manually expanded */}
                  {isExpanded && guide.sections.length > 0 && (
                    <div style={{
                      marginLeft: 28,
                      borderLeft: '2px solid var(--lighter-gray)',
                      marginBottom: 4,
                    }}>
                      {guide.sections.map(sec => {
                        const secActive = activeSubId === sec.id
                        return (
                          <a
                            key={sec.id}
                            href={`#${sec.id}`}
                            onClick={e => scrollTo(sec.id, e)}
                            style={{
                              display: 'block',
                              padding: '5px 10px',
                              fontSize: 12,
                              color: secActive ? 'var(--primary-blue)' : 'var(--medium-gray)',
                              fontWeight: secActive ? 500 : 400,
                              textDecoration: 'none',
                              background: secActive ? '#f0f8ff' : 'transparent',
                              borderRadius: '0 3px 3px 0',
                              transition: 'all 120ms',
                            }}
                            onMouseEnter={e => { if (!secActive) e.currentTarget.style.color = 'var(--dark-gray)' }}
                            onMouseLeave={e => { if (!secActive) e.currentTarget.style.color = 'var(--medium-gray)' }}
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
        ))}
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
          display: 'none', position: 'fixed', top: 20, left: 20, zIndex: 60,
          background: 'var(--primary-blue)', color: '#fff', border: 'none',
          borderRadius: 4, padding: '8px 12px', cursor: 'pointer', fontSize: 18,
        }}
      >
        ☰
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
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  )
}
