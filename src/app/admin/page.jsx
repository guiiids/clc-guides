import { prisma } from '@/lib/db'
import Link from 'next/link'

const STATUS_STYLE = {
  published: { background: '#d1fae5', color: '#065f46' },
  draft:     { background: '#fef3c7', color: '#92400e' },
  archived:  { background: '#f1f5f9', color: '#64748b' },
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

export default async function AdminPage({ searchParams }) {
  const { status } = await searchParams
  const where = status && status !== 'all' ? { status } : {}

  const [guides, counts] = await Promise.all([
    prisma.guide.findMany({ where, orderBy: { order: 'asc' } }),
    prisma.guide.groupBy({ by: ['status'], _count: true }),
  ])

  const countMap = { all: 0, published: 0, draft: 0, archived: 0 }
  counts.forEach(c => {
    countMap[c.status] = c._count
    countMap.all += c._count
  })

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Drafts' },
    { id: 'archived', label: 'Archived' },
  ]
  const activeTab = status || 'all'

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}>Guides</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            Manage and publish help center content
          </p>
        </div>
        <Link href="/admin/new" style={{
          background: '#2563eb', color: '#fff', borderRadius: 6,
          padding: '9px 18px', fontSize: 13, fontWeight: 500,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          + New Guide
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.id === 'all' ? '/admin' : `/admin?status=${tab.id}`}
              style={{
                padding: '8px 14px', fontSize: 13, textDecoration: 'none',
                color: active ? '#2563eb' : '#64748b',
                borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                fontWeight: active ? 500 : 400,
                marginBottom: -1,
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: 6, fontSize: 11, background: active ? '#eff6ff' : '#f1f5f9',
                color: active ? '#2563eb' : '#94a3b8',
                borderRadius: 9999, padding: '1px 7px', fontWeight: 500,
              }}>
                {countMap[tab.id]}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Guide list */}
      <style>{`.admin-list-item:hover { background: #f8fafc !important; }`}</style>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {guides.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            No guides found.
          </div>
        ) : (
          guides.map((guide, i) => (
            <Link
              key={guide.id}
              href={`/admin/${guide.slug}`}
              className="admin-list-item"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', textDecoration: 'none',
                borderBottom: i < guides.length - 1 ? '1px solid #f1f5f9' : 'none',
                transition: 'background 150ms',
              }}
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
          ))
        )}
      </div>
    </div>
  )
}
