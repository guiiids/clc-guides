'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      rememberMe: rememberMe.toString(),
    })

    if (res?.error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#00426a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 4, padding: '48px 40px',
        width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 200, color: '#00426a', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 300, fontSize: 18, display: 'block', color: '#888b8d' }}>Agilent</span>
            CrossLab Connect
          </div>
          <div style={{ fontSize: 12, color: '#888b8d', marginTop: 6 }}>Help Center — Admin</div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4,
            padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
                borderRadius: 4, fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '9px 40px 9px 12px', border: '1px solid #d1d5db',
                  borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', padding: 2, display: 'flex', alignItems: 'center',
                }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#0085d5', cursor: 'pointer' }}
            />
            <label htmlFor="remember-me" style={{ fontSize: 13, color: '#4b5563', cursor: 'pointer', userSelect: 'none' }}>
              Remember me for 30 days
            </label>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '10px', background: loading ? '#93c5fd' : '#0085d5',
              color: '#fff', border: 'none', borderRadius: 4,
              fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
