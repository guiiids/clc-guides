'use client'

import { useState } from 'react'
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

function PasswordField({ label, value, onChange, id }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          style={{
            width: '100%', padding: '9px 40px 9px 12px', border: '1px solid #d1d5db',
            borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', padding: 2, display: 'flex', alignItems: 'center',
          }}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (next !== confirm) { setError('New passwords do not match.'); return }
    if (next.length < 8)  { setError('New password must be at least 8 characters.'); return }

    setLoading(true)
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
    setSuccess(true)
    setTimeout(() => router.push('/admin'), 2000)
  }

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 24px' }}>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '36px 40px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>Change Password</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px' }}>
          Update your admin account password.
        </p>

        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6,
            padding: '10px 14px', color: '#15803d', fontSize: 13, marginBottom: 20,
          }}>
            Password updated. Redirecting…
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
            padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <PasswordField label="Current password"  id="current" value={current} onChange={e => setCurrent(e.target.value)} />
          <PasswordField label="New password"       id="next"    value={next}    onChange={e => setNext(e.target.value)} />
          <PasswordField label="Confirm new password" id="confirm" value={confirm} onChange={e => setConfirm(e.target.value)} />

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                flex: 1, padding: '9px', background: '#f8fafc',
                color: '#374151', border: '1px solid #e2e8f0', borderRadius: 6,
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              style={{
                flex: 2, padding: '9px', background: loading || success ? '#93c5fd' : '#0085d5',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 500, cursor: loading || success ? 'not-allowed' : 'pointer',
                transition: 'background 150ms',
              }}
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
