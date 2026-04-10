import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

/** PATCH /api/members/:id — update a member's role or name */
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || !['Admin','Developer'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const data = {}

  if (body.name !== undefined) data.name = body.name
  if (body.role !== undefined) data.role = body.role
  if (body.password) data.password_hash = await bcrypt.hash(body.password, 12)

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  try {
    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}

/** DELETE /api/members/:id — remove a member */
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || !['Admin','Developer'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  try {
    await prisma.adminUser.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
