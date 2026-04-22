'use client'

import { useState, useEffect } from 'react'

export default function DevTypographyToggle() {
  const [open, setOpen] = useState(false)
  const [headingFontFamily, setHeadingFontFamily] = useState('inter')
  const [bodyFontFamily, setBodyFontFamily] = useState('inter')
  const [h1Size, setH1Size] = useState(32)
  const [h1Weight, setH1Weight] = useState(800)
  const [h2Size, setH2Size] = useState(22)
  const [h2Weight, setH2Weight] = useState(600)
  const [h3Size, setH3Size] = useState(16)
  const [h3Weight, setH3Weight] = useState(500)
  const [pSize, setPSize] = useState(16)
  const [pWeight, setPWeight] = useState(400)

  useEffect(() => {
    const root = document.documentElement
    if (headingFontFamily === 'inter') {
      root.style.setProperty('--doc-heading-font-family', 'var(--font-inter), "Inter", sans-serif')
    } else if (headingFontFamily === 'roboto') {
      root.style.setProperty('--doc-heading-font-family', 'var(--font-roboto), "Roboto", sans-serif')
    } else {
      root.style.setProperty('--doc-heading-font-family', 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif')
    }

    if (bodyFontFamily === 'inter') {
      root.style.setProperty('--doc-body-font-family', 'var(--font-inter), "Inter", sans-serif')
    } else if (bodyFontFamily === 'roboto') {
      root.style.setProperty('--doc-body-font-family', 'var(--font-roboto), "Roboto", sans-serif')
    } else {
      root.style.setProperty('--doc-body-font-family', 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif')
    }
    
    root.style.setProperty('--doc-h1-size', `${h1Size}px`)
    root.style.setProperty('--doc-h1-weight', h1Weight)
    root.style.setProperty('--doc-h2-size', `${h2Size}px`)
    root.style.setProperty('--doc-h2-weight', h2Weight)
    root.style.setProperty('--doc-h3-size', `${h3Size}px`)
    root.style.setProperty('--doc-h3-weight', h3Weight)
    root.style.setProperty('--doc-p-size', `${pSize}px`)
    root.style.setProperty('--doc-p-weight', pWeight)
  }, [headingFontFamily, bodyFontFamily, h1Size, h1Weight, h2Size, h2Weight, h3Size, h3Weight, pSize, pWeight])

  if (process.env.NODE_ENV !== 'development') return null

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
          background: '#1e293b', color: 'white', border: 'none',
          padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer',
          fontFamily: 'sans-serif'
        }}
      >
        🛠 Typography Dev
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
      background: 'white', border: '1px solid #cbd5e1',
      padding: '16px', borderRadius: '8px', width: '280px',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      fontFamily: 'sans-serif', fontSize: '13px', color: '#334155'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong style={{ fontSize: '14px', color: '#0f172a' }}>🛠 Typography Tools</strong>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Heading Font Family</label>
        <select 
          value={headingFontFamily} onChange={e => setHeadingFontFamily(e.target.value)}
          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          <option value="inter">Inter (Modern)</option>
          <option value="roboto">Roboto (Standard)</option>
          <option value="roboto-condensed">Roboto Condensed</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Body Font Family</label>
        <select 
          value={bodyFontFamily} onChange={e => setBodyFontFamily(e.target.value)}
          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          <option value="inter">Inter (Modern)</option>
          <option value="roboto">Roboto (Standard)</option>
          <option value="roboto-condensed">Roboto Condensed</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <label>H1 Size: {h1Size}px</label>
          <label>Weight: {h1Weight}</label>
        </div>
        <input type="range" min="20" max="60" value={h1Size} onChange={e => setH1Size(Number(e.target.value))} style={{ width: '100%', marginBottom: 4 }} />
        <input type="range" min="100" max="900" step="100" value={h1Weight} onChange={e => setH1Weight(Number(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <label>H2 Size: {h2Size}px</label>
          <label>Weight: {h2Weight}</label>
        </div>
        <input type="range" min="16" max="40" value={h2Size} onChange={e => setH2Size(Number(e.target.value))} style={{ width: '100%', marginBottom: 4 }} />
        <input type="range" min="100" max="900" step="100" value={h2Weight} onChange={e => setH2Weight(Number(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <label>H3 Size: {h3Size}px</label>
          <label>Weight: {h3Weight}</label>
        </div>
        <input type="range" min="12" max="32" value={h3Size} onChange={e => setH3Size(Number(e.target.value))} style={{ width: '100%', marginBottom: 4 }} />
        <input type="range" min="100" max="900" step="100" value={h3Weight} onChange={e => setH3Weight(Number(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <label>Body Size: {pSize}px</label>
          <label>Weight: {pWeight}</label>
        </div>
        <input type="range" min="12" max="24" value={pSize} onChange={e => setPSize(Number(e.target.value))} style={{ width: '100%', marginBottom: 4 }} />
        <input type="range" min="100" max="900" step="100" value={pWeight} onChange={e => setPWeight(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
    </div>
  )
}
