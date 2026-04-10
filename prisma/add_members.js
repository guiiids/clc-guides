const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const MEMBERS = [
  { email: 'ana.tatishvili@agilent.com',   name: 'Ana Tatishvili',    role: 'Editor' },
  { email: 'craig.kreutzberg@agilent.com', name: 'Craig Kreutzberg',  role: 'Editor' },
  { email: 'brittany.stille@agilent.com',  name: 'Brittany Stille',   role: 'Editor' },
]

async function main() {
  const password = 'changeme123'
  const hash = await bcrypt.hash(password, 12)

  console.log('Adding members...\n')
  for (const m of MEMBERS) {
    await prisma.adminUser.upsert({
      where: { email: m.email },
      update: {},
      create: { email: m.email, password_hash: hash, name: m.name, role: m.role },
    })
    console.log(`  ✓ ${m.name} (${m.email})`)
  }
  console.log('\nDone. Default password: changeme123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
