'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* ── Design tokens (Agilent CLC palette) ── */
const T = {
  primary:    '#0085d5',
  darkBlue:   '#00426a',
  medBlue:    '#2281c4',
  white:      '#ffffff',
  bg:         '#f1f5f9',
  darkGray:   '#202020',
  medGray:    '#888b8d',
  lightGray:  '#f4f3f1',
  border:     '#e2e8f0',
  borderLight:'#f1f5f9',
  text:       '#0f172a',
  textMuted:  '#64748b',
  textFaint:  '#94a3b8',
  danger:     '#dc2626',
  dangerBg:   '#fef2f2',
  successBg:  '#d1fae5',
  successText:'#065f46',
  warnBg:     '#fef3c7',
  warnText:   '#92400e',
}

/* ── Role badge colors ── */
const ROLE_STYLE = {
  Admin:     { background: T.darkBlue, color: T.white },
  Developer: { background: '#0d9488', color: T.white },
  Editor:    { background: '#e6f0fa', color: T.primary },
}

/* ── Initials from name/email ── */
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

/* ── Time formatting ── */
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

function timeAgo(d) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(diff / 86_400_000)
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(d)
}


/* ══════════════════════════════════════════════════════════════════════════
   MembersClient — main export
   ══════════════════════════════════════════════════════════════════════════ */
export default function MembersClient({ members: initialMembers, currentUserId }) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [toast, setToast] = useState(null)

  // Filtered members
  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (
      (m.name || '').toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    )
  })

  // Stats
  const totalCount = members.length
  const adminCount = members.filter(m => m.role === 'Admin').length
  const editorCount = members.filter(m => m.role === 'Editor').length
  const recentCount = members.filter(m => {
    if (!m.lastLogin) return false
    return Date.now() - new Date(m.lastLogin).getTime() < 7 * 86_400_000
  }).length

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Close action menus on outside click
  const menuRef = useRef(null)
  useEffect(() => {
    if (!actionMenuId) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActionMenuId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [actionMenuId])

  /* ── CRUD handlers ── */

  async function handleAddMember({ email, name, role, password }) {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to add member')
    }
    const newUser = await res.json()
    setMembers(prev => [newUser, ...prev])
    showToast(`${name || email} added successfully`)
    router.refresh()
  }

  async function handleUpdateMember(id, data) {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update member')
    }
    const updated = await res.json()
    setMembers(prev => prev.map(m => m.id === id ? updated : m))
    showToast('Member updated')
    router.refresh()
  }

  async function handleDeleteMember(id) {
    const member = members.find(m => m.id === id)
    if (!confirm(`Remove ${member?.name || member?.email}? This cannot be undone.`)) return

    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      showToast(err.error || 'Failed to remove', 'error')
      return
    }
    setMembers(prev => prev.filter(m => m.id !== id))
    showToast('Member removed')
    router.refresh()
  }

  async function handleChangeRole(id, newRole) {
    await handleUpdateMember(id, { role: newRole })
    setActionMenuId(null)
  }


  /* ══════════════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 68, right: 24, zIndex: 200,
          background: toast.type === 'error' ? T.dangerBg : T.successBg,
          color: toast.type === 'error' ? T.danger : T.successText,
          padding: '10px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          animation: 'toastSlideIn 200ms ease-out',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 16, marginBottom: 28,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 4 }}>
            Members
          </h1>
          <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>
            Manage user access and roles for the CLC Help Center.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.textFaint}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="members-search"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: 260, padding: '8px 12px 8px 34px',
                border: `1px solid ${T.border}`, borderRadius: 6,
                fontSize: 13, outline: 'none', background: T.white,
                transition: 'border-color 150ms',
              }}
              onFocus={e => e.target.style.borderColor = T.primary}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          {/* Add member button */}
          <button
            id="add-member-btn"
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.primary, color: T.white, border: 'none',
              borderRadius: 6, padding: '8px 16px', fontSize: 13,
              fontWeight: 500, cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.medBlue}
            onMouseLeave={e => e.currentTarget.style.background = T.primary}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Add Member
          </button>
        </div>
      </div>

      {/* ── Compact stat strip ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16,
      }}>
        <StatChip icon={<UsersIcon color={T.primary} />} value={totalCount} label="Members" accent={T.primary} />
        <StatChip icon={<ShieldIcon color={T.darkBlue} />} value={adminCount} label="Admins" accent={T.darkBlue} />
        <StatChip icon={<EditIcon color={T.medBlue} />} value={editorCount} label="Editors" accent={T.medBlue} />
        <StatChip icon={<ActivityIcon color="#22c55e" />} value={recentCount} label="Active (7d)" accent="#22c55e" />
      </div>

      {/* ── Members table ── */}
      <div style={{
        background: T.white, borderRadius: 8, border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: '#f8fafc' }}>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Last Login</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right', width: 60 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: '48px 0', textAlign: 'center', color: T.textFaint, fontSize: 14,
                  }}>
                    {search ? 'No members match your search.' : 'No members found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(member => {
                  const isYou = member.id === currentUserId
                  const isActive = member.lastLogin &&
                    Date.now() - new Date(member.lastLogin).getTime() < 7 * 86_400_000
                  const initials = getInitials(member.name, member.email)
                  const gradients = {
                    Admin: `linear-gradient(135deg, ${T.darkBlue} 0%, ${T.primary} 100%)`,
                    Editor: `linear-gradient(135deg, ${T.primary} 0%, ${T.medBlue} 100%)`,
                  }

                  return (
                    <tr
                      key={member.id}
                      className="member-row"
                      style={{
                        borderBottom: `1px solid ${T.borderLight}`,
                        transition: 'background 150ms',
                      }}
                    >
                      {/* User cell */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: gradients[member.role] || gradients.Editor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{
                              color: T.white, fontSize: 13, fontWeight: 600,
                              letterSpacing: '0.02em', userSelect: 'none',
                            }}>
                              {initials}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {member.name || member.email.split('@')[0]}
                              {isYou && (
                                <span style={{
                                  fontSize: 10, fontWeight: 600, color: T.primary,
                                  background: '#e6f0fa', borderRadius: 9999,
                                  padding: '1px 7px', letterSpacing: '0.04em',
                                }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role cell */}
                      <td style={tdStyle}>
                        <span style={{
                          ...(ROLE_STYLE[member.role] || ROLE_STYLE.Editor),
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: 9999, letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                          {member.role}
                        </span>
                      </td>

                      {/* Created cell */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13, color: T.text }}>
                          {formatDate(member.createdAt)}
                        </div>
                        <div style={{ fontSize: 11, color: T.textFaint }}>
                          {formatTime(member.createdAt)}
                        </div>
                      </td>

                      {/* Last Login cell */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13, color: T.text }}>
                          {member.lastLogin ? timeAgo(member.lastLogin) : '—'}
                        </div>
                        {member.lastLogin && (
                          <div style={{ fontSize: 11, color: T.textFaint }}>
                            {formatDate(member.lastLogin)}
                          </div>
                        )}
                      </td>

                      {/* Status cell */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: isActive ? '#22c55e' : T.textFaint,
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 12, color: isActive ? '#15803d' : T.textMuted,
                            fontWeight: 500,
                          }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Action cell */}
                      <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '4px 8px', borderRadius: 4,
                            color: T.textFaint, transition: 'all 150ms',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#f1f5f9'
                            e.currentTarget.style.color = T.text
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'none'
                            e.currentTarget.style.color = T.textFaint
                          }}
                          aria-label={`Actions for ${member.name || member.email}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5"  r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>

                        {/* Action dropdown */}
                        {actionMenuId === member.id && (
                          <div ref={menuRef} style={{
                            position: 'absolute', top: '100%', right: 8,
                            width: 180, background: T.white, borderRadius: 8,
                            border: `1px solid ${T.border}`,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                            zIndex: 50, overflow: 'hidden',
                            animation: 'menuFadeIn 120ms ease-out',
                          }}>
                            <ActionItem
                              label={member.role === 'Admin' ? 'Set as Editor' : 'Set as Admin'}
                              icon={<ShieldIcon />}
                              disabled={isYou}
                              onClick={() => handleChangeRole(member.id, member.role === 'Admin' ? 'Editor' : 'Admin')}
                            />
                            <ActionItem
                              label="Edit Details"
                              icon={<EditIcon />}
                              onClick={() => { setEditingMember(member); setActionMenuId(null) }}
                            />
                            <div style={{ height: 1, background: T.borderLight }} />
                            <ActionItem
                              label="Remove"
                              icon={<TrashIcon />}
                              danger
                              disabled={isYou}
                              onClick={() => { handleDeleteMember(member.id); setActionMenuId(null) }}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8fafc',
        }}>
          <span style={{ fontSize: 13, color: T.textMuted }}>
            Showing <strong style={{ color: T.text }}>{filtered.length}</strong> of{' '}
            <strong style={{ color: T.text }}>{totalCount}</strong> members
          </span>
        </div>
      </div>



      {/* ── Add Member Modal ── */}
      {showAdd && (
        <MemberModal
          title="Add New Member"
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            await handleAddMember(data)
            setShowAdd(false)
          }}
          showPassword
        />
      )}

      {/* ── Edit Member Modal ── */}
      {editingMember && (
        <MemberModal
          title="Edit Member"
          initial={editingMember}
          onClose={() => setEditingMember(null)}
          onSubmit={async (data) => {
            await handleUpdateMember(editingMember.id, data)
            setEditingMember(null)
          }}
        />
      )}

      {/* ── Animations ── */}
      <style>{`
        .member-row:hover { background: #f8fafc !important; }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


/* ══════════════════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Action menu item ── */
function ActionItem({ label, icon, danger, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', background: 'none', border: 'none',
        fontSize: 13, fontWeight: 400, cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? T.textFaint : danger ? T.danger : T.text,
        opacity: disabled ? 0.5 : 1,
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? T.dangerBg : '#f8fafc' }}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {label}
    </button>
  )
}

/* ── Compact stat chip ── */
function StatChip({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: T.white, borderRadius: 6, border: `1px solid ${T.border}`,
      padding: '6px 14px 6px 10px',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: `${accent}12`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}


/* ── Add/Edit Member Modal ── */
function MemberModal({ title, initial, onClose, onSubmit, showPassword }) {
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [role, setRole] = useState(initial?.role || 'Editor')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = { name, role }
      if (!initial) {
        // Adding new user
        data.email = email
        data.password = password
      }
      if (password && initial) {
        data.password = password
      }
      await onSubmit(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.35)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        animation: 'modalFadeIn 150ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.white, borderRadius: 10, padding: '28px 32px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          animation: 'modalSlideUp 200ms ease-out',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
          {initial ? 'Update member details below.' : 'Fill in the details for the new team member.'}
        </p>

        {error && (
          <div style={{
            background: T.dangerBg, border: '1px solid #fecaca', borderRadius: 4,
            padding: '8px 12px', color: T.danger, fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FieldGroup label="Full Name">
            <input
              id="member-name"
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              style={inputStyle}
            />
          </FieldGroup>

          <FieldGroup label="Email Address">
            <input
              id="member-email"
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jane@company.com"
              disabled={!!initial}
              style={{ ...inputStyle, ...(initial ? { background: '#f8fafc', color: T.textMuted, cursor: 'not-allowed' } : {}) }}
            />
          </FieldGroup>

          <FieldGroup label="Role">
            <select
              id="member-role"
              value={role} onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="Editor">Editor</option>
              <option value="Developer">Developer</option>
              <option value="Admin">Admin</option>
            </select>
          </FieldGroup>

          {(showPassword || initial) && (
            <FieldGroup label={initial ? 'New Password (optional)' : 'Password'}>
              <input
                id="member-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required={!initial}
                placeholder={initial ? 'Leave blank to keep current' : 'Minimum 8 characters'}
                style={inputStyle}
              />
            </FieldGroup>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px', border: `1px solid ${T.border}`, borderRadius: 6,
                background: T.white, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                color: T.text, transition: 'background 100ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = T.white}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px', border: 'none', borderRadius: 6,
                background: saving ? T.medBlue : T.primary, color: T.white,
                fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 150ms',
              }}
            >
              {saving ? 'Saving…' : initial ? 'Update' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Form field wrapper ── */
function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500,
        color: '#374151', marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}


/* ══════════════════════════════════════════════════════════════════════════
   Style constants
   ══════════════════════════════════════════════════════════════════════════ */

const thStyle = {
  padding: '12px 20px', fontSize: 11, fontWeight: 600,
  color: T.textMuted, textTransform: 'uppercase',
  letterSpacing: '0.05em', whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '14px 20px',
}

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: `1px solid ${T.border}`, borderRadius: 6,
  fontSize: 14, outline: 'none', transition: 'border-color 150ms',
}


/* ══════════════════════════════════════════════════════════════════════════
   SVG Icons — 2px stroke, line-only (Agilent iconography)
   ══════════════════════════════════════════════════════════════════════════ */

function UsersIcon({ color = '#64748b' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ShieldIcon({ color = '#64748b' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function EditIcon({ color = '#64748b' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function ActivityIcon({ color = '#64748b' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
