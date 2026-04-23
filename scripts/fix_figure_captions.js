const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Matches <p ...> where the text content starts with "Figure" (case-insensitive)
const FIGURE_RE = /<p([^>]*)>(Figure\s+\d+[^<]*)<\/p>/gi

function replaceCaptions(html) {
  return html.replace(FIGURE_RE, (_, attrs, text) => {
    // Skip if already has figure-caption class
    if (attrs.includes('figure-caption')) return _
    return `<p${attrs} class="figure-caption">${text}</p>`
  })
}

async function main() {
  const guides = await prisma.guide.findMany({ select: { id: true, slug: true, content: true } })

  let updated = 0

  for (const guide of guides) {
    if (!guide.content) continue

    const fixed = replaceCaptions(guide.content)
    if (fixed === guide.content) continue

    await prisma.guide.update({
      where: { id: guide.id },
      data: { content: fixed },
    })

    console.log(`✓ ${guide.slug}`)
    updated++
  }

  console.log(`\nDone — ${updated} guide(s) updated.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
