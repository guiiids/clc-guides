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
  const guideRef = useRef(initialGuide)
  const [saveState, setSaveState] = useState('saved') // 'saved' | 'saving' | 'error'
  const [showMeta, setShowMeta] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
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
      const updated = { ...guideRef.current, content: html }
      guideRef.current = updated
      setGuide(updated)
      debouncedSave(updated)
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
    const updated = { ...guideRef.current, [field]: value }
    guideRef.current = updated
    setGuide(updated)
    debouncedSave(updated)
  }

  async function setStatus(status) {
    const updated = { ...guideRef.current, status }
    guideRef.current = updated
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

  // ── PDF download ──────────────────────────────────────────────
  async function handleDownloadPdf() {
    if (exporting) return
    setExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default

      const exportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
      const statusLabel = guide.status.charAt(0).toUpperCase() + guide.status.slice(1)
      const categoryLabel = guide.category || 'General'

      // Build a professional document template
      const container = document.createElement('div')
      // Must be in DOM for html2canvas to render, but hide offscreen
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px'  // A4 width in px at 96dpi
      container.style.zIndex = '-1'
      document.body.appendChild(container)
      container.innerHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; color: #1e293b; line-height: 1.7;">

          <!-- ── Accent bar ── -->
          <div style="height: 4px; background: linear-gradient(90deg, #2563eb 0%, #3b82f6 40%, #60a5fa 100%); border-radius: 2px; margin-bottom: 28px;"></div>

          <!-- ── Document header ── -->
          <div style="margin-bottom: 32px;">
            <div style="font-size: 11px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">
              CLC Guide
            </div>
            <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 14px; color: #0f172a; line-height: 1.3;">
              ${guide.title}
            </h1>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;">
              <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 3px 10px; border-radius: 9999px;">
                📂 ${categoryLabel}
              </span>
              <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 3px 10px; border-radius: 9999px;">
                ${statusLabel === 'Published' ? '🟢' : statusLabel === 'Draft' ? '🟡' : '⚪'} ${statusLabel}
              </span>
              <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 3px 10px; border-radius: 9999px;">
                📅 ${exportDate}
              </span>
            </div>
            <div style="height: 1px; background: #e2e8f0;"></div>
          </div>

          <!-- ── Article body ── -->
          <div style="font-size: 14px; color: #334155; line-height: 1.75;">
            ${guide.content || '<p style="color:#94a3b8; font-style:italic;">No content yet.</p>'}
          </div>

          <!-- ── Footer ── -->
          <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #94a3b8;">
              ${guide.slug || 'guide'} • CLC Guides
            </span>
            <span style="font-size: 10px; color: #94a3b8;">
              Generated on ${exportDate}
            </span>
          </div>
        </div>
      `

      // ── Style inner elements for clean PDF rendering ──
      container.querySelectorAll('h1').forEach((el, i) => {
        if (i > 0) { // skip the title h1 which is already styled
          el.style.fontSize = '22px'; el.style.fontWeight = '700'; el.style.color = '#0f172a'
          el.style.marginTop = '32px'; el.style.marginBottom = '10px'
        }
      })
      container.querySelectorAll('h2').forEach(el => {
        el.style.fontSize = '18px'; el.style.fontWeight = '600'; el.style.color = '#0f172a'
        el.style.marginTop = '32px'; el.style.marginBottom = '10px'
        el.style.paddingBottom = '6px'; el.style.borderBottom = '1px solid #f1f5f9'
      })
      container.querySelectorAll('h3').forEach(el => {
        el.style.fontSize = '15px'; el.style.fontWeight = '600'; el.style.color = '#1e293b'
        el.style.marginTop = '24px'; el.style.marginBottom = '8px'
      })
      container.querySelectorAll('p').forEach(el => {
        el.style.marginTop = '0'; el.style.marginBottom = '12px'
      })
      container.querySelectorAll('pre').forEach(el => {
        el.style.background = '#f8fafc'; el.style.padding = '14px 18px'
        el.style.borderRadius = '8px'; el.style.fontSize = '12px'
        el.style.overflowX = 'auto'; el.style.lineHeight = '1.65'
        el.style.border = '1px solid #e2e8f0'; el.style.margin = '16px 0'
      })
      container.querySelectorAll('code').forEach(el => {
        if (el.parentElement?.tagName !== 'PRE') {
          el.style.background = '#f1f5f9'; el.style.padding = '2px 6px'
          el.style.borderRadius = '4px'; el.style.fontSize = '13px'
          el.style.color = '#e11d48'; el.style.fontWeight = '500'
        }
      })
      container.querySelectorAll('table').forEach(el => {
        el.style.width = '100%'; el.style.borderCollapse = 'collapse'
        el.style.fontSize = '13px'; el.style.margin = '16px 0'
      })
      container.querySelectorAll('th, td').forEach(el => {
        el.style.border = '1px solid #e2e8f0'; el.style.padding = '8px 12px'
        el.style.textAlign = 'left'
      })
      container.querySelectorAll('th').forEach(el => {
        el.style.background = '#f8fafc'; el.style.fontWeight = '600'
        el.style.color = '#334155'; el.style.fontSize = '12px'
        el.style.textTransform = 'uppercase'; el.style.letterSpacing = '0.03em'
      })
      container.querySelectorAll('img').forEach(el => {
        el.style.maxWidth = '100%'; el.style.borderRadius = '8px'
        el.style.margin = '16px 0'; el.style.border = '1px solid #f1f5f9'
      })
      container.querySelectorAll('ul, ol').forEach(el => {
        el.style.paddingLeft = '22px'; el.style.margin = '12px 0'
      })
      container.querySelectorAll('li').forEach(el => {
        el.style.marginBottom = '4px'
      })
      container.querySelectorAll('blockquote').forEach(el => {
        el.style.borderLeft = '3px solid #3b82f6'; el.style.margin = '16px 0'
        el.style.paddingLeft = '16px'; el.style.color = '#475569'
        el.style.background = '#f8fafc'; el.style.padding = '12px 16px'
        el.style.borderRadius = '0 6px 6px 0'
      })
      container.querySelectorAll('hr').forEach(el => {
        el.style.border = 'none'; el.style.height = '1px'
        el.style.background = '#e2e8f0'; el.style.margin = '24px 0'
      })
      // Task list checkboxes
      container.querySelectorAll('ul[data-type="taskList"] li').forEach(el => {
        el.style.listStyleType = 'none'
      })
      container.querySelectorAll('a').forEach(el => {
        el.style.color = '#2563eb'; el.style.textDecoration = 'underline'
      })
      container.querySelectorAll('strong').forEach(el => {
        el.style.fontWeight = '600'; el.style.color = '#0f172a'
      })

      const slug = guide.slug || 'guide'
      await html2pdf().set({
        margin:       [10, 14, 14, 14],  // mm
        filename:     `${slug}.pdf`,
        image:        { type: 'jpeg', quality: 0.96 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(container).save()
      // Cleanup: remove the offscreen container
      document.body.removeChild(container)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed. Check the console for details.')
    } finally {
      setExporting(false)
    }
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
        width: 240, flexShrink: 0, background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <a href="/admin" style={{ color: '#2563eb', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← All guides
          </a>
        </div>
        <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Editing
          </div>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
            {guide.title}
          </div>
        </div>
        <div style={{ padding: '8px 12px 12px', flexShrink: 0, borderBottom: '1px solid #e2e8f0' }}>
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
                  fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase',
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
                        color: isActive ? '#0f172a' : '#64748b',
                        textDecoration: 'none',
                        background: isActive ? '#f1f5f9' : 'transparent',
                        borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                        transition: 'all 120ms',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f8fafc'
                          e.currentTarget.style.color = '#334155'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#64748b'
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
              onClick={handleDownloadPdf}
              disabled={exporting}
              style={{
                padding: '5px 12px', background: '#f1f5f9', color: '#64748b',
                borderRadius: 5, fontSize: 12, border: '1px solid #e2e8f0',
                cursor: exporting ? 'wait' : 'pointer', fontFamily: 'inherit',
                opacity: exporting ? 0.6 : 1, transition: 'opacity 150ms',
              }}
            >
              {exporting ? 'Exporting…' : 'PDF ↓'}
            </button>

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
