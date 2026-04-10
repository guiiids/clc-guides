'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import UnderlineExtension from '@tiptap/extension-underline'
import ImageExtension from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { createLowlight, common } from 'lowlight'
import Toolbar from './Toolbar'

const lowlight = createLowlight(common)

const CATEGORIES = ['Getting Started', 'Features', 'Administration', 'Guides']
const STATUS_STYLE = {
  published: { background: '#d1fae5', color: '#065f46' },
  draft:     { background: '#fef3c7', color: '#92400e' },
  archived:  { background: '#f1f5f9', color: '#64748b' },
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').slice(0, 60)
}

export default function Editor({ initialGuide, allGuides = [] }) {
  const router = useRouter()
  const [guide, setGuide] = useState(initialGuide)
  const [saveState, setSaveState] = useState('saved') // 'saved' | 'saving' | 'error'
  const [showMeta, setShowMeta] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const saveTimer = useRef(null)

  // ── TipTap editor ────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: false }),
      // Heading with id preservation so anchor links survive editing
      Heading.configure({ levels: [1, 2, 3] }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            id: {
              default: null,
              parseHTML: el => el.getAttribute('id') || null,
              renderHTML: attrs => attrs.id ? { id: attrs.id } : {},
            },
          }
        },
      }),
      UnderlineExtension,
      ImageExtension,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: 'Start writing your guide…' }),
      Highlight,
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialGuide.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setGuide(g => ({ ...g, content: html }))
      debouncedSave({ ...guide, content: html })
    },
  })

  // ── Save (debounced) ─────────────────────────────────────────
  const save = useCallback(async (data) => {
    setSaveState('saving')
    const res = await fetch(`/api/guides/${data.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaveState(res.ok ? 'saved' : 'error')
    if (res.ok) {
      const updated = await res.json()
      setGuide(updated)
    }
  }, [])

  const debouncedSave = useCallback((data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(() => save(data), 1500)
  }, [save])

  // Save immediately (for status/meta changes)
  const saveNow = useCallback((data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    return save(data)
  }, [save])

  // ── Field update helpers ─────────────────────────────────────
  function updateField(field, value) {
    const updated = { ...guide, [field]: value }
    setGuide(updated)
    debouncedSave(updated)
  }

  async function setStatus(status) {
    const updated = { ...guide, status }
    setGuide(updated)
    await saveNow(updated)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${guide.title}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/guides/${guide.slug}`, { method: 'DELETE' })
    router.push('/admin')
    router.refresh()
  }

  // ── Image upload ─────────────────────────────────────────────
  async function handleImageUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        editor?.chain().focus().setImage({ src: url }).run()
      }
    }
    input.click()
  }

  // ── Save indicator ───────────────────────────────────────────
  const saveLabel = saveState === 'saving' ? 'Saving…'
    : saveState === 'error' ? 'Save failed'
    : 'Saved'
  const saveColor = saveState === 'error' ? '#dc2626' : '#94a3b8'

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

      {/* ── Left sidebar: guide list nav ── */}
      <aside style={{
        width: 240, flexShrink: 0, background: '#0f1629',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <a href="/admin" style={{ color: '#60a5fa', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← All guides
          </a>
        </div>
        <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#3d5275', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Editing
          </div>
          <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
            {guide.title}
          </div>
        </div>
        <div style={{ padding: '8px 12px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{
            ...(STATUS_STYLE[guide.status] || STATUS_STYLE.draft),
            borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 500,
          }}>
            {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
          </span>
        </div>

        {/* ── Guide nav list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {(() => {
            const grouped = {}
            allGuides.forEach(g => {
              const cat = g.category || 'Uncategorized'
              if (!grouped[cat]) grouped[cat] = []
              grouped[cat].push(g)
            })
            return Object.entries(grouped).map(([category, guides]) => (
              <div key={category} style={{ marginBottom: 4 }}>
                <div style={{
                  fontSize: 10, color: '#3d5275', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.06em', padding: '10px 16px 4px',
                }}>
                  {category}
                </div>
                {guides.map(g => {
                  const isActive = g.slug === guide.slug
                  const statusDot = g.status === 'published' ? '#22c55e'
                    : g.status === 'draft' ? '#f59e0b' : '#64748b'
                  return (
                    <a
                      key={g.slug}
                      href={`/admin/${g.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 16px',
                        fontSize: 12, fontWeight: isActive ? 500 : 400,
                        color: isActive ? '#e2e8f0' : '#94a3b8',
                        textDecoration: 'none',
                        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                        borderLeft: isActive ? '2px solid #60a5fa' : '2px solid transparent',
                        transition: 'all 120ms',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                          e.currentTarget.style.color = '#cbd5e1'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#94a3b8'
                        }
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: statusDot, flexShrink: 0,
                      }} />
                      <span style={{
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {g.shortTitle || g.title}
                      </span>
                    </a>
                  )
                })}
              </div>
            ))
          })()}
        </div>
      </aside>

      {/* ── Main editor area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

        {/* Editor top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 48, borderBottom: '1px solid #e2e8f0',
          background: '#fff', flexShrink: 0, gap: 12,
        }}>
          {/* Title input */}
          <input
            value={guide.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="Guide title"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 600,
              color: '#0f172a', fontFamily: 'inherit', background: 'transparent',
            }}
          />

          {/* Save state + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: saveColor }}>{saveLabel}</span>

            {guide.status !== 'published' && (
              <ActionBtn onClick={() => setStatus('published')} primary>Publish</ActionBtn>
            )}
            {guide.status === 'published' && (
              <ActionBtn onClick={() => setStatus('draft')}>Unpublish</ActionBtn>
            )}
            {guide.status !== 'archived' && (
              <ActionBtn onClick={() => setStatus('archived')}>Archive</ActionBtn>
            )}
            {guide.status === 'archived' && (
              <ActionBtn onClick={() => setStatus('draft')}>Restore</ActionBtn>
            )}

            <a
              href={`/${guide.slug}?preview=1`} target="_blank"
              style={{
                padding: '5px 12px', background: '#f1f5f9', color: '#64748b',
                borderRadius: 5, fontSize: 12, textDecoration: 'none',
                border: '1px solid #e2e8f0',
              }}
            >
              Preview ↗
            </a>

            <button
              onClick={() => setShowMeta(m => !m)}
              style={{
                padding: '5px 12px', background: showMeta ? '#eff6ff' : '#f1f5f9',
                color: showMeta ? '#2563eb' : '#64748b',
                border: `1px solid ${showMeta ? '#bfdbfe' : '#e2e8f0'}`,
                borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Details
            </button>

            <button
              onClick={handleDelete} disabled={deleting}
              style={{
                padding: '5px 10px', background: 'transparent', color: '#ef4444',
                border: '1px solid #fecaca', borderRadius: 5, fontSize: 12,
                cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {deleting ? '…' : 'Delete'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* TipTap content area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Toolbar editor={editor} onImageUpload={handleImageUpload} />
            <div className="tiptap-editor" style={{ flex: 1, overflowY: 'auto' }}>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Metadata panel */}
          {showMeta && (
            <MetaPanel guide={guide} onChange={updateField} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ────────────────────────────────────────────────────────────

function ActionBtn({ onClick, primary, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        background: primary ? '#2563eb' : '#f1f5f9',
        color: primary ? '#fff' : '#374151',
        border: primary ? 'none' : '1px solid #e2e8f0',
        borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
        fontWeight: 500, transition: 'background 150ms',
      }}
    >
      {children}
    </button>
  )
}

function MetaPanel({ guide, onChange }) {
  const INP = {
    width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: 13, color: '#0f172a', outline: 'none',
    fontFamily: 'inherit', background: '#fff',
  }

  return (
    <div style={{
      width: 300, flexShrink: 0, borderLeft: '1px solid #e2e8f0',
      background: '#f8fafc', display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff',
        fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        Details
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Short Title">
          <input style={INP} value={guide.shortTitle} onChange={e => onChange('shortTitle', e.target.value)} />
        </Field>

        <Field label="Slug">
          <input style={{ ...INP, fontFamily: 'monospace', fontSize: 12 }} value={guide.slug}
            onChange={e => onChange('slug', slugify(e.target.value))} />
        </Field>

        <Field label="Category">
          <select style={{ ...INP, cursor: 'pointer' }} value={guide.category}
            onChange={e => onChange('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Display Order">
          <input type="number" style={INP} value={guide.order}
            onChange={e => onChange('order', parseInt(e.target.value) || 999)} />
        </Field>

        <Field label="Tags (comma-separated)">
          <input style={INP} value={guide.tags} placeholder="admin, security"
            onChange={e => onChange('tags', e.target.value)} />
        </Field>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            SEO
          </div>
          <Field label="SEO Title">
            <input style={INP} value={guide.seoTitle} placeholder={guide.title}
              onChange={e => onChange('seoTitle', e.target.value)} />
          </Field>
          <Field label="SEO Description">
            <textarea
              rows={3} style={{ ...INP, resize: 'vertical' }}
              value={guide.seoDescription}
              onChange={e => onChange('seoDescription', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
