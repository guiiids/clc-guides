import { prisma } from '@/lib/db'
import PublicHeader from '@/components/public/PublicHeader'
import PublicSidebar from '@/components/public/PublicSidebar'

export default async function PublicLayout({ children }) {
  const guides = await prisma.guide.findMany({
    where: { status: 'published' },
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, shortTitle: true, category: true, content: true },
  })

  return (
    <div style={{ background: 'var(--lighter-gray)', minHeight: '100vh' }}>
      <PublicHeader guides={guides} />
      <div style={{
        width: '80%', margin: '0 auto', background: '#fff',
        display: 'flex', minHeight: 'calc(100vh - var(--header-height))',
        boxShadow: '0 0 15px rgba(0,0,0,0.05)',
      }}>
        <PublicSidebar guides={guides} />
        <main style={{ flex: 1, padding: '40px', minHeight: '100vh', background: '#fff' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
