#!/usr/bin/env node
// Publishes all draft guides so they appear on the public site.
// Usage: npm run publish:all

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.guide.updateMany({
    where: { status: 'draft' },
    data:  { status: 'published' },
  })
  console.log(`Published ${result.count} guide(s).`)

  const all = await prisma.guide.findMany({ select: { slug: true, title: true, status: true } })
  for (const g of all) {
    console.log(`  [${g.status}] ${g.slug} — ${g.title}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
