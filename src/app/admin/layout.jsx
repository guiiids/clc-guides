import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '@/components/admin/UserMenu'

export const metadata = { title: 'Admin — CLC Help Center' }

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      {/* Top bar */}
      <nav style={{
        background: '#0f1629', borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <Link href="/admin" style={{ color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            CLC Help Center
          </Link>
          <span style={{ color: '#3d5275', fontSize: 11 }}>Content Manager</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/admin" className="nav-icon-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="nav-icon-label">Dashboard</span>
          </Link>
          <Link href="/admin/articles-list" className="nav-icon-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="nav-icon-label">Articles</span>
          </Link>
          <Link href="/" target="_blank" className="nav-icon-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="nav-icon-label">View site</span>
          </Link>
          {(session.user.role === 'Admin' || session.user.role === 'Developer') && (
            <Link href="/admin/members" className="nav-icon-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="nav-icon-label">Members</span>
            </Link>
          )}
          <UserMenu user={session.user} />
        </div>
      </nav>

      {/* Nav icon-link hover-expand styles */}
      <style>{`
        .nav-icon-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 8px;
          border-radius: 6px;
          overflow: hidden;
          transition: color 150ms, background 150ms;
        }
        .nav-icon-link:hover {
          color: #e2e8f0;
          background: rgba(255,255,255,0.06);
        }
        .nav-icon-label {
          display: inline-block;
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          opacity: 0;
          transition: max-width 250ms ease, opacity 200ms ease, margin-left 250ms ease;
          margin-left: 0;
        }
        .nav-icon-link:hover .nav-icon-label {
          max-width: 100px;
          opacity: 1;
          margin-left: 2px;
        }
      `}</style>

      {children}
    </div>
  )
}
