import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (newPassword.length < 8)
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })

  const user = await prisma.adminUser.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.adminUser.update({ where: { id: user.id }, data: { password_hash: hash } })

  return NextResponse.json({ ok: true })
}
