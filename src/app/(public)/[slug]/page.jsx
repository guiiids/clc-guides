import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

import { sanitizeHtml } from '@/lib/sanitize'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const guide = await prisma.guide.findUnique({
    where: { slug },
    select: { title: true, seoTitle: true, seoDescription: true }
  })
  return {
    title: guide?.seoTitle || guide?.title,
    description: guide?.seoDescription || ''
  }
}

export default async function GuideSlugPage({ params, searchParams }) {
  const { slug }    = await params
  const { preview } = await searchParams

  // Draft preview: only accessible to authenticated admins
  if (preview === '1') {
    const session = await getServerSession(authOptions)
    if (!session) notFound()

    const guide = await prisma.guide.findUnique({ where: { slug } })
    if (!guide) notFound()

    return (
      <article>
        {/* Draft banner */}
        <div style={{
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4,
          padding: '8px 16px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13, color: '#92400e',
        }}>
          <span>⚠ Draft preview — not visible to the public</span>
          <a href={`/admin/${guide.slug}`} style={{ color: '#92400e', fontWeight: 500 }}>
            ← Back to editor
          </a>
        </div>

        <div style={{
          background: 'var(--light-gray)', padding: '20px 30px',
          borderBottom: '1px solid var(--lighter-gray)', marginBottom: 24,
          borderRadius: 4,
        }}>
          <h1 style={{ margin: 0, color: 'var(--dark-gray)' }}>
            {guide.title}
          </h1>
        </div>

        {guide.content ? (
          <div className="guide-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content) }} />
        ) : (
          <p style={{ color: 'var(--medium-gray)', fontStyle: 'italic' }}>Content coming soon.</p>
        )}
      </article>
    )
  }

  // Normal access → redirect to the home page scrolled to this guide
  redirect(`/#${slug}`)
}
