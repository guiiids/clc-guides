import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Editor from '@/components/admin/Editor'

export default async function AdminEditorPage({ params }) {
  const { slug } = await params
  const guide = await prisma.guide.findUnique({ where: { slug } })
  if (!guide) notFound()

  const allGuides = await prisma.guide.findMany({
    orderBy: { order: 'asc' },
    select: { slug: true, shortTitle: true, title: true, status: true, category: true, order: true },
  })

  // Pass plain objects (not Prisma models) to client component
  return <Editor initialGuide={JSON.parse(JSON.stringify(guide))} allGuides={JSON.parse(JSON.stringify(allGuides))} />
}
