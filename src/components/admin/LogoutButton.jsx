'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
        color: '#94a3b8', borderRadius: 4, padding: '4px 10px',
        fontSize: 12, cursor: 'pointer', transition: 'all 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
    >
      Sign out
    </button>
  )
}
