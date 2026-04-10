'use client'

import { useState, useEffect } from 'react'

export default function PublicHeader({ guides }) {
  const [currentTitle, setCurrentTitle] = useState(guides[0]?.title || 'User Guides')

  useEffect(() => {
    if (!guides.length) return

    function onScroll() {
      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 120

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
      backgroundImage: "url('https://content.tst-34.aws.agilent.com/wp-content/uploads/2025/09/logo-2.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#00426a',
      color: '#fff',
      padding: '30px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      minHeight: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '80%', margin: '0 auto',
        padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Left: current guide title */}
        <div style={{ flex: '0 0 50%' }}>
          <p style={{ fontSize: 18, fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1.3 }}>
            {currentTitle}
          </p>
        </div>

        {/* Right: Agilent logo */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.agilent.com/cs/agilent_images/icon-agilent-logo-white-white-2x.png"
            alt="Agilent"
            style={{ height: 60, width: 'auto' }}
          />
        </div>
      </div>
    </header>
  )
}
