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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>
      <PublicHeader guides={guides} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <PublicSidebar guides={guides} />
        <main id="main-scroll-container" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: '#f8fafc',
          overflowY: 'auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
