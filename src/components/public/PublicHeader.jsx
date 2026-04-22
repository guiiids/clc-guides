'use client'

import { useState, useEffect } from 'react'

export default function PublicHeader({ guides }) {
  const [currentTitle, setCurrentTitle] = useState(guides[0]?.title || 'User Guides')

  useEffect(() => {
    if (!guides.length) return

    function onScroll() {
      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 64

      const guideThreshold = headerH + 20
      let current = guides[0]
      for (const guide of guides) {
        const el = document.getElementById(guide.slug)
        if (!el) continue
        if (el.getBoundingClientRect().top <= guideThreshold) current = guide
      }
      setCurrentTitle(current.title)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [guides])

  return (
    <header style={{
      background: '#003057',
      color: '#fff',
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="Agilent CrossLab Connect" style={{ height: 48, objectFit: 'contain' }} />
      </div>

      {/* Center: Search Bar */}
      <div style={{ flex: 1, maxWidth: 640, padding: '0 32px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 12,
            display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>
            <svg style={{ width: 20, height: 20, color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search the Knowledge Base (Cmd+K)"
            style={{
              display: 'block',
              width: '100%',
              background: '#fff',
              color: '#0f172a',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px 8px 40px',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Right: Empty to balance flex-between if needed, or just removed entirely */}
    </header>
  )
}
