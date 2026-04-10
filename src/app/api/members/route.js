import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

/** GET  /api/members — list all admin users (Admin only) */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !['Admin','Developer'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLogin: true,
    },
  })

  return NextResponse.json(members)
}

/** POST /api/members — create a new admin user (Admin only) */
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || !['Admin','Developer'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, role, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  // Check if user already exists
  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const user = await prisma.adminUser.create({
    data: {
      email,
      name: name || null,
      role: role || 'Editor',
      password_hash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLogin: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
