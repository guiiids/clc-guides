import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, action } = await req.json()
  if (!ids?.length || !action) return Response.json({ error: 'Missing ids or action' }, { status: 400 })

  const status = action === 'publish' ? 'published'
    : action === 'unpublish' ? 'draft'
    : action === 'archive' ? 'archived'
    : null

  if (!status) return Response.json({ error: 'Invalid action' }, { status: 400 })

  await prisma.guide.updateMany({ where: { id: { in: ids } }, data: { status } })

  return Response.json({ ok: true, updated: ids.length })
}
