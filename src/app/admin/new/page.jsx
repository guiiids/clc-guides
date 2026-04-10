'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Getting Started', 'Features', 'Administration', 'Guides']

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .slice(0, 60)
}

export default function NewGuidePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortTitle, setShortTitle] = useState('')
  const [category, setCategory] = useState('Guides')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function onTitleChange(v) {
    setTitle(v)
    if (!slug || slug === slugify(title)) setSlug(slugify(v))
    if (!shortTitle) setShortTitle(v)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return
    setSaving(true)
    setError('')

    const res = await fetch('/api/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, shortTitle: shortTitle || title, category }),
    })

    if (res.ok) {
      const guide = await res.json()
      router.push(`/admin/${guide.slug}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create guide.')
      setSaving(false)
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: 14, outline: 'none', color: '#0f172a',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>New Guide</h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 32 }}>
        Set the basic metadata. You'll add content in the editor.
      </p>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
          padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Full Title *
          </label>
          <input
            required style={inp} value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Guide to Logging in to Agilent CrossLab Connect"
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Short Title (sidebar label) *
          </label>
          <input
            required style={inp} value={shortTitle}
            onChange={e => setShortTitle(e.target.value)}
            placeholder="Login Guide"
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Slug (URL) *
          </label>
          <input
            required style={{ ...inp, fontFamily: 'monospace' }} value={slug}
            onChange={e => setSlug(slugify(e.target.value))}
            placeholder="logging-in"
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Will be accessible at: <code>/{slug || 'your-slug'}</code>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Category
          </label>
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            style={{ ...inp, cursor: 'pointer' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit" disabled={saving}
            style={{
              background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
              border: 'none', borderRadius: 6, padding: '10px 24px',
              fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Creating…' : 'Create Guide'}
          </button>
          <button
            type="button" onClick={() => router.back()}
            style={{
              background: '#f1f5f9', color: '#64748b', border: 'none',
              borderRadius: 6, padding: '10px 20px', fontSize: 14, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
