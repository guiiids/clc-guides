import { prisma } from '@/lib/db'
import Link from 'next/link'
import ArticlesListClient from './ArticlesListClient'

export default async function ArticlesListPage({ searchParams }) {
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
    { id: 'all',       label: 'All' },
    { id: 'published', label: 'Published' },
    { id: 'draft',     label: 'Drafts' },
    { id: 'archived',  label: 'Archived' },
  ]
  const activeTab = status || 'all'

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}>Articles</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            Browse and manage all help center articles
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
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.id === 'all' ? '/admin/articles-list' : `/admin/articles-list?status=${tab.id}`}
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
                marginLeft: 6, fontSize: 11,
                background: active ? '#eff6ff' : '#f1f5f9',
                color: active ? '#2563eb' : '#94a3b8',
                borderRadius: 9999, padding: '1px 7px', fontWeight: 500,
              }}>
                {countMap[tab.id]}
              </span>
            </Link>
          )
        })}
      </div>

      <ArticlesListClient guides={guides} />
    </div>
  )
}
