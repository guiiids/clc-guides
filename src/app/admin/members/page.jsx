import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import MembersClient from '@/components/admin/MembersClient'

export const metadata = { title: 'Members — CLC Help Center' }
export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Only admins can access members management
  if (session.user.role !== 'Admin' && session.user.role !== 'Developer') {
    return (
      <div style={{ maxWidth: 960, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          Access Restricted
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Only administrators can manage members. Contact your admin for access.
        </p>
      </div>
    )
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

  return <MembersClient members={members} currentUserId={session.user.id} />
}
