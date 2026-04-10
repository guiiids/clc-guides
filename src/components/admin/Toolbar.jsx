'use client'

import { useState, useEffect } from 'react'

function Sep() {
  return <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 3px', flexShrink: 0 }} />
}

function Btn({ active, onClick, title, children }) {
  return (
    <button
      title={title} onClick={onClick}
      style={{
        width: 30, height: 30, flexShrink: 0, border: 'none', borderRadius: 4,
        background: active ? '#eff6ff' : 'transparent',
        color: active ? '#2563eb' : '#64748b',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 13, fontWeight: 500,
        transition: 'all 150ms ease',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.color = '#0f172a' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
    >
      {children}
    </button>
  )
}

export default function Toolbar({ editor, onImageUpload }) {
  const [, tick] = useState(0)

  useEffect(() => {
    if (!editor) return
    const cb = () => tick(n => n + 1)
    editor.on('transaction', cb)
    return () => editor.off('transaction', cb)
  }, [editor])

  if (!editor) return null

  const blockType = editor.isActive('heading', { level: 1 }) ? 'h1'
    : editor.isActive('heading', { level: 2 }) ? 'h2'
    : editor.isActive('heading', { level: 3 }) ? 'h3'
    : 'p'

  const setBlock = v => {
    if (v === 'p') editor.chain().focus().setParagraph().run()
    else editor.chain().focus().setHeading({ level: +v[1] }).run()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, padding: '5px 24px',
      borderBottom: '1px solid #e2e8f0', background: '#fff',
      overflowX: 'auto', flexShrink: 0, flexWrap: 'wrap',
    }}>
      {/* Block type */}
      <select
        value={blockType} onChange={e => setBlock(e.target.value)}
        style={{
          height: 28, padding: '0 8px', border: '1px solid #e2e8f0',
          borderRadius: 4, fontSize: 12, color: '#0f172a', background: '#fff',
          cursor: 'pointer', flexShrink: 0, marginRight: 2, fontFamily: 'inherit',
        }}
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <Sep />

      {/* Inline formatting */}
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><b>B</b></Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><i>I</i></Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></Btn>
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></Btn>
      <Btn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
        <span style={{ background: '#fde68a', borderRadius: 2, padding: '1px 3px', fontSize: 11, fontWeight: 700 }}>A</span>
      </Btn>
      <Btn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
        <code style={{ fontSize: 12 }}>`</code>
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </Btn>
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
          <polyline points="3 6 4 5 4 9"/><path d="M3 15h2a1 1 0 010 2H3a1 1 0 010 2h2"/>
        </svg>
      </Btn>
      <Btn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="3" y="5" width="6" height="6" rx="1"/><polyline points="4.5 8 6 9.5 8.5 7"/>
          <line x1="13" y1="8" x2="21" y2="8"/><line x1="13" y1="15" x2="21" y2="15"/>
          <rect x="3" y="12" width="6" height="6" rx="1"/>
        </svg>
      </Btn>
      <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
        </svg>
      </Btn>

      <Sep />

      {/* Inserts */}
      <Btn onClick={onImageUpload} title="Insert image">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="1"/>
          <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </Btn>
      <Btn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <span style={{ display: 'block', width: 14, height: 2, background: 'currentColor', borderRadius: 1 }}/>
      </Btn>

      <Sep />

      {/* History */}
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
        </svg>
      </Btn>
    </div>
  )
}
