import { prisma } from '@/lib/db'

export default async function HomePage() {
  const guides = await prisma.guide.findMany({
    where: { status: 'published' },
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, content: true },
  })

  if (!guides.length) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--medium-gray)' }}>
        <p style={{ fontSize: 18 }}>No published guides yet.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Go to <a href="/admin" style={{ color: 'var(--primary-blue)' }}>/admin</a> to publish your first guide.
        </p>
      </div>
    )
  }

  return (
    <>
      {guides.map(guide => (
        <section
          key={guide.slug}
          id={guide.slug}
          style={{
            marginBottom: 60,
            background: '#fff',
            borderRadius: 4,
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            scrollMarginTop: 'calc(var(--header-height) + 16px)',
          }}
        >
          <div style={{
            background: 'var(--light-gray)',
            padding: '20px 30px',
            borderBottom: '1px solid var(--lighter-gray)',
          }}>
            <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0, color: 'var(--dark-gray)' }}>
              {guide.title}
            </h1>
          </div>
          <div
            className="guide-prose"
            style={{ padding: 30 }}
            dangerouslySetInnerHTML={{
              __html: guide.content || '<p style="color:#888;font-style:italic">Content coming soon.</p>',
            }}
          />
        </section>
      ))}
    </>
  )
}
