const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Seeded from pipeline/config.json — metadata only, content added via admin UI
const GUIDES = [
  {
    slug: 'introduction',
    title: 'Introduction to Using Agilent CrossLab Connect',
    shortTitle: 'Introduction',
    category: 'Getting Started',
    icon: 'rocket',
    order: 1,
  },
  {
    slug: 'logging-in',
    title: 'Guide to Logging in to Agilent CrossLab Connect',
    shortTitle: 'Login Guide',
    category: 'Getting Started',
    icon: 'sign-in',
    order: 2,
  },
  {
    slug: 'insights-dashboard',
    title: 'Using the Insights Dashboard in Agilent CrossLab Connect',
    shortTitle: 'Insights Dashboard',
    category: 'Features',
    icon: 'chart',
    order: 3,
  },
  {
    slug: 'inventory-manager',
    title: 'Using Inventory Manager in Agilent CrossLab Connect',
    shortTitle: 'Inventory Manager',
    category: 'Features',
    icon: 'clipboard',
    order: 4,
  },
  {
    slug: 'service-manager',
    title: 'Using Service Manager and Service History in CrossLab Connect',
    shortTitle: 'Service Manager',
    category: 'Features',
    icon: 'wrench',
    order: 5,
  },
  {
    slug: 'asset-faults',
    title: 'Guide to Asset Faults in Agilent CrossLab Connect',
    shortTitle: 'Asset Faults',
    category: 'Features',
    icon: 'warning',
    order: 6,
  },
  {
    slug: 'administrator-guide',
    title: 'Guide to Admin Using CrossLab Connect',
    shortTitle: 'Administrator Guide',
    category: 'Administration',
    icon: 'shield',
    order: 7,
  },
  {
    slug: 'technical-security',
    title: 'Agilent CrossLab Service Management Technical Security Measures',
    shortTitle: 'Technical Security',
    category: 'Administration',
    icon: 'lock',
    order: 8,
  },
]

async function main() {
  console.log('Seeding guides...')
  for (const guide of GUIDES) {
    await prisma.guide.upsert({
      where: { slug: guide.slug },
      update: {},   // don't overwrite content if already edited
      create: { ...guide, status: 'published', content: '', seoTitle: '', seoDescription: '', tags: '' },
    })
    console.log(`  ✓ ${guide.slug}`)
  }

  console.log('\nSeeding admin user...')
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  let password = process.env.SEED_ADMIN_PASSWORD

  if (process.env.NODE_ENV === 'production' && !password) {
    console.error('FATAL: SEED_ADMIN_PASSWORD must be set in production')
    process.exit(1)
  }

  password = password || 'changeme123'
  const hash = await bcrypt.hash(password, 12)

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, password_hash: hash, name: 'Admin', role: 'Admin' },
  })
  console.log(`  ✓ ${email}`)

  console.log('\nDone.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
