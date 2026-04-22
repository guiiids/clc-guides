import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session || !['Admin', 'Developer', 'Editor'].includes(session.user?.role)) {
    return null
  }
  return session
}

/**
 * Walk through the saved HTML and ensure every h2/h3 has a stable
 * id="…" attribute so the sidebar can link to it as an anchor.
 */
function injectHeadingIds(html) {
  if (!html) return html

  const seen = new Map()

  function makeId(text) {
    const base = text
      .replace(/<[^>]+>/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      || 'section'

    const count = (seen.get(base) || 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base}-${count}`
  }

  return html.replace(/<(h[23])(\s[^>]*)?>[\s\S]*?<\/h[23]>/gi, (match, tag, attrs = '') => {
    if (/\bid=["'][^"']+["']/i.test(attrs)) return match
    const inner = match.replace(/^<[^>]+>/, '').replace(/<\/h[23]>$/i, '')
    const id = makeId(inner)
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`
  })
}

/**
 * Strip HTML tags and whitespace to determine if content is truly empty.
 */
function isContentEmpty(html) {
  if (!html) return true
  const trimmed = html.trim()
  if (trimmed === '<p></p>' || trimmed === '') return true
  if (/<(img|hr|iframe|video|audio)[^>]*>/i.test(trimmed)) return false
  const text = trimmed.replace(/<[^>]*>/g, '').trim()
  return text.length === 0
}

/**
 * Save a versioned snapshot of the guide's CURRENT content
 * into the GuideRevision table BEFORE overwriting it.
 */
async function snapshotBeforeSave(guideId, currentContent, currentTitle, savedBy) {
  if (isContentEmpty(currentContent)) return // nothing to snapshot

  // Get the latest version number for this guide
  const latest = await prisma.guideRevision.findFirst({
    where: { guideId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const nextVersion = (latest?.version || 0) + 1

  await prisma.guideRevision.create({
    data: {
      guideId,
      version: nextVersion,
      content: currentContent,
      title: currentTitle || '',
      savedBy,
    },
  })
}

export async function GET(req, { params }) {
  if (!await requireAuth()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const guide = await prisma.guide.findUnique({ where: { slug } })
  if (!guide) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(guide)
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || !['Admin', 'Developer', 'Editor'].includes(session.user?.role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const body = await req.json()

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
  if (seoTitle !== undefined) data.seoTitle = seoTitle
  if (seoDescription !== undefined) data.seoDescription = seoDescription
  if (tags !== undefined) data.tags = tags

  // ── CONTENT SAFETY GUARD ──────────────────────────────────────
  // 1. Never overwrite existing content with empty/blank HTML.
  // 2. Always snapshot existing content BEFORE overwriting.
  if (content !== undefined) {
    const existing = await prisma.guide.findUnique({
      where: { slug },
      select: { id: true, content: true, title: true },
    })

    if (isContentEmpty(content) && existing && !isContentEmpty(existing.content)) {
      // BLOCK: refuse to erase existing content with blank
      console.warn(`[GUARD] Blocked empty-content save for "${slug}" (existing: ${existing.content?.length} chars)`)
    } else {
      // SNAPSHOT: save the old version before overwriting
      if (existing && !isContentEmpty(existing.content)) {
        await snapshotBeforeSave(
          existing.id,
          existing.content,
          existing.title,
          session.user?.email || 'unknown'
        )
      }
      // Process heading IDs and save
      data.content = isContentEmpty(content) ? content : injectHeadingIds(content)
    }
  }

  try {
    const guide = await prisma.guide.update({ where: { slug }, data })
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
    // Snapshot before delete so content is never truly lost
    const existing = await prisma.guide.findUnique({
      where: { slug },
      select: { id: true, content: true, title: true },
    })
    if (existing && !isContentEmpty(existing.content)) {
      await snapshotBeforeSave(existing.id, existing.content, existing.title, 'delete')
    }

    await prisma.guide.delete({ where: { slug } })
    revalidatePath('/', 'layout')
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
