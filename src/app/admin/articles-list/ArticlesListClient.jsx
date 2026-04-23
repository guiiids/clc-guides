'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLE = {
  published: { background: '#d1fae5', color: '#065f46' },
  draft:     { background: '#fef3c7', color: '#92400e' },
  archived:  { background: '#f1f5f9', color: '#64748b' },
}

export default function ArticlesListClient({ guides }) {
  const router = useRouter()
  const [selected, setSelected] = useState(new Set())
  const [pending, startTransition] = useTransition()

  const allSelected = guides.length > 0 && selected.size === guides.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(guides.map(g => g.id)))
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function bulkAction(action) {
    const ids = [...selected]
    await fetch('/api/guides/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action }),
    })
    setSelected(new Set())
    startTransition(() => router.refresh())
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 500 }}>
            {selected.size} selected
          </span>
          <div style={{ flex: 1 }} />
          <BulkBtn color="#16a34a" onClick={() => bulkAction('publish')} disabled={pending}>
            Publish
          </BulkBtn>
          <BulkBtn color="#92400e" bg="#fef3c7" onClick={() => bulkAction('unpublish')} disabled={pending}>
            Unpublish
          </BulkBtn>
          <BulkBtn color="#64748b" bg="#f1f5f9" onClick={() => bulkAction('archive')} disabled={pending}>
            Archive
          </BulkBtn>
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* List */}
      <style>{`.articles-list-item:hover { background: #f8fafc !important; }`}</style>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {guides.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            No guides found.
          </div>
        ) : (
          <>
            {/* Header row with select-all */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 20px', borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={toggleAll}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select all
              </span>
            </div>

            {guides.map((guide, i) => (
              <div
                key={guide.id}
                className="articles-list-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px',
                  borderBottom: i < guides.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 150ms',
                  background: selected.has(guide.id) ? '#eff6ff' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(guide.id)}
                  onChange={() => toggleOne(guide.id)}
                  style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563eb', flexShrink: 0 }}
                />
                <Link
                  href={`/admin/${guide.slug}`}
                  style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 3 }}>
                      {guide.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {guide.category} · Updated {timeAgo(guide.updatedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{
                      ...(STATUS_STYLE[guide.status] || STATUS_STYLE.draft),
                      borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 500,
                    }}>
                      {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
                  </div>
                </Link>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}

function BulkBtn({ children, onClick, disabled, color = '#fff', bg = null }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        border: `1px solid ${color}`, color, background: bg || 'transparent',
        cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1,
        transition: 'opacity 150ms',
      }}
    >
      {children}
    </button>
  )
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(diff / 86_400_000)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}
