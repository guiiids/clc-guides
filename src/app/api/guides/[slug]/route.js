import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session
}

export async function GET(req, { params }) {
  if (!await requireAuth()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const guide = await prisma.guide.findUnique({ where: { slug } })
  if (!guide) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(guide)
}

export async function PUT(req, { params }) {
  if (!await requireAuth()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await req.json()

  // Whitelist updatable fields
  const {
    title, shortTitle, category, icon, order,
    status, content, seoTitle, seoDescription, tags,
  } = body

  const data = {}
  if (title !== undefined) data.title = title
  if (shortTitle !== undefined) data.shortTitle = shortTitle
  if (category !== undefined) data.category = category
  if (icon !== undefined) data.icon = icon
  if (order !== undefined) data.order = order
  if (status !== undefined) data.status = status
  if (content !== undefined) data.content = content
  if (seoTitle !== undefined) data.seoTitle = seoTitle
  if (seoDescription !== undefined) data.seoDescription = seoDescription
  if (tags !== undefined) data.tags = tags

  try {
    const guide = await prisma.guide.update({ where: { slug }, data })
    // Bust the server-component cache so sidebar/header pick up title changes
    revalidatePath('/', 'layout')
    revalidatePath(`/${slug}`)
    revalidatePath('/admin')
    revalidatePath(`/admin/${slug}`)
    return Response.json(guide)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(req, { params }) {
  if (!await requireAuth()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  try {
    await prisma.guide.delete({ where: { slug } })
    revalidatePath('/', 'layout')
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
