import { prisma } from '@/lib/db'
import RightSidebar from '@/components/public/RightSidebar'
import { sanitizeHtml } from '@/lib/sanitize'

export default async function HomePage() {
  const guides = await prisma.guide.findMany({
    where: { status: 'published' },
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, content: true },
  })

  if (!guides.length) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
        <p style={{ fontSize: 18 }}>No published guides yet.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Go to <a href="/admin" style={{ color: '#2563eb' }}>/admin</a> to publish your first guide.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumbs */}
      {/* TODO (L-2): Make breadcrumbs dynamic based on scroll position or mark as known limitation since this is a single-page list. */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          padding: '24px 32px',
          fontSize: 14,
          color: '#64748b',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid #e2e8f0', marginRight: 8,
          cursor: 'pointer', transition: 'background 150ms',
        }}>
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Home</a>
        <span style={{ color: '#cbd5e1' }}>&gt;</span>
        <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Getting Started</a>
        <span style={{ color: '#cbd5e1' }}>&gt;</span>
        <span style={{ color: '#0f172a', fontWeight: 500 }}>{guides[0]?.title || 'Introduction'}</span>
      </nav>

      {/* Content + Right Sidebar */}
      <div style={{ padding: '0 32px 48px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Main articles */}
        <div style={{ flex: 1, maxWidth: 896, minWidth: 0 }}>
          {guides.map(guide => (
            <article
              key={guide.slug}
              id={guide.slug}
              style={{
                background: '#fff',
                padding: 40,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                marginBottom: 32,
                scrollMarginTop: 'calc(var(--header-height) + 16px)',
              }}
            >
              <header style={{ marginBottom: 24 }}>
                <h1 style={{
                  color: '#0f172a',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  {guide.title}
                </h1>
              </header>
              <div
                className="guide-prose"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(guide.content) || '<p style="color:#94a3b8;font-style:italic">Content coming soon.</p>',
                }}
              />
              {/* Feedback footer */}
              {/* TODO (L-4): Implement feedback recording backend. Currently UI only. */}
              <footer style={{
                marginTop: 64,
                paddingTop: 32,
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <span style={{ color: '#475569', fontWeight: 500 }}>Was this helpful?</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{
                      padding: 8, border: '1px solid #e2e8f0', borderRadius: 4,
                      background: 'transparent', cursor: 'pointer',
                      transition: 'background 150ms',
                    }}>
                      <svg style={{ width: 20, height: 20, color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                    <button style={{
                      padding: 8, border: '1px solid #e2e8f0', borderRadius: 4,
                      background: 'transparent', cursor: 'pointer',
                      transition: 'background 150ms',
                    }}>
                      <svg style={{ width: 20, height: 20, color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M10 15v3.586a1 1 0 01-.293.707l-.707.707A1 1 0 018 19.586V15m0 0H4.414A2 2 0 012.76 14.05l1.33-8A2 2 0 016.09 4.5H10m0 10.5h4m0 0V5a3 3 0 013-3l4 9v11" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    padding: '8px 20px', border: '1px solid #2563eb',
                    color: '#2563eb', fontWeight: 500, borderRadius: 4,
                    background: 'transparent', cursor: 'pointer', fontSize: 14,
                    transition: 'background 150ms',
                  }}>Yes</button>
                  <button style={{
                    padding: '8px 20px', border: 'none',
                    color: '#334155', fontWeight: 500, borderRadius: 4,
                    background: '#e2e8f0', cursor: 'pointer', fontSize: 14,
                    transition: 'background 150ms',
                  }}>No</button>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {/* Right sidebar - On This Page */}
        <RightSidebar guides={guides} />
      </div>
    </>
  )
}
