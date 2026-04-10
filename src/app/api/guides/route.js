import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const guides = await prisma.guide.findMany({ orderBy: { order: 'asc' } })
  return Response.json(guides)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { slug, title, shortTitle, category } = body

  if (!slug || !title) {
    return Response.json({ error: 'slug and title are required' }, { status: 400 })
  }

  // Check slug uniqueness
  const existing = await prisma.guide.findUnique({ where: { slug } })
  if (existing) {
    return Response.json({ error: 'A guide with this slug already exists.' }, { status: 409 })
  }

  // Next order value
  const last = await prisma.guide.findFirst({ orderBy: { order: 'desc' } })
  const order = (last?.order ?? 0) + 1

  const guide = await prisma.guide.create({
    data: {
      slug,
      title,
      shortTitle: shortTitle || title,
      category: category || 'Guides',
      order,
      status: 'draft',
    },
  })

  return Response.json(guide, { status: 201 })
}
