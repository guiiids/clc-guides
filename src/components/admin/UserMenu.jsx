'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'

/**
 * Extracts up to 2 initials from a name or email.
 *  - "Guilherme Vieira-Machado" → "GV"
 *  - "admin@example.com"        → "AD"
 *  - null                       → "?"
 */
function getInitials(name, email) {
  if (name) {
    const parts = name.split(/[\s\-]+/).filter(Boolean)
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  if (email) {
    const local = email.split('@')[0]
    const parts = local.split(/[.\-_]/).filter(Boolean)
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : local.slice(0, 2).toUpperCase()
  }
  return '?'
}

/** Format role label */
function roleBadge(role) {
  const colors = {
    Admin:     { bg: '#0057b8', text: '#fff' },
    Developer: { bg: '#0d9488', text: '#fff' },
    Editor:    { bg: '#e6f0fa', text: '#0057b8' },
  }
  const c = colors[role] || colors.Editor
  return { background: c.bg, color: c.text }
}

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const initials = getInitials(user?.name, user?.email)
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const role = user?.role || 'Editor'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* ── Avatar trigger ── */}
      <button
        id="user-menu-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="User menu"
        aria-expanded={open}
        style={{
          width: 32, height: 32, borderRadius: 6,
          /* Agilent Agent/Staff identity gradient */
          background: 'linear-gradient(135deg, #0085ca 0%, #0057b8 100%)',
          border: open ? '2px solid #60a5fa' : '2px solid transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'border-color 150ms',
          padding: 0,
        }}
      >
        <span style={{
          color: '#fff', fontSize: 12, fontWeight: 600,
          fontFamily: "'Inter', sans-serif", lineHeight: 1, letterSpacing: '0.02em',
          userSelect: 'none',
        }}>
          {initials}
        </span>
      </button>

      {/* ── Dropdown overlay ── */}
      {open && (
        <div
          id="user-menu-overlay"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 260, background: '#fff', borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            zIndex: 100, overflow: 'hidden',
            animation: 'userMenuFadeIn 120ms ease-out',
          }}
        >
          {/* User identity header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* Large avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #0085ca 0%, #0057b8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                color: '#fff', fontSize: 15, fontWeight: 600,
                fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em',
              }}>
                {initials}
              </span>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: '#0f172a',
                lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: 12, color: '#64748b', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.email}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  ...roleBadge(role),
                  fontSize: 10, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 9999, letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: '8px 0' }}>
            <MenuLink
              href="/admin"
              icon={<StackIcon />}
              label="All Guides"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/"
              icon={<ExternalIcon />}
              label="View Public Site"
              external
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/admin/account"
              icon={<KeyIcon />}
              label="Change Password"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f1f5f9' }} />

          {/* Sign out */}
          <div style={{ padding: '8px 0' }}>
            <button
              id="user-menu-sign-out"
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 20px', background: 'transparent', border: 'none',
                fontSize: 13, color: '#dc2626', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontWeight: 500,
                transition: 'background 100ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Keyframe for dropdown entrance */}
      <style>{`
        @keyframes userMenuFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


/* ── Tiny helper components ───────────────────────────────────────────────── */

function MenuLink({ href, icon, label, external, onClick }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 20px', textDecoration: 'none',
        fontSize: 13, color: '#334155', fontWeight: 400,
        transition: 'background 100ms',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      <span>{label}</span>
      {external && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>↗</span>}
    </a>
  )
}

/* SVG icons — 2px stroke, line-only per Agilent iconography constraints */

function StackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
