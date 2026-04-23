/**
 * export_content_json.js
 *
 * Reads ../../iteration-1-standalone.html, extracts each guide's content
 * (same logic as import_standalone.js), and writes guide_content.json to
 * the repo root.
 *
 * Upload guide_content.json to /home/data/guide_content.json via Kudu, then
 * restart the Azure app — startup.sh will import it automatically.
 *
 * Run from clc-guides-site/:
 *   node scripts/export_content_json.js
 */

const { parse } = require('node-html-parser')
const fs        = require('fs')
const path      = require('path')
const crypto    = require('crypto')

const HTML_FILE  = path.join(__dirname, '..', '..', 'iteration-1-standalone.html')
const OUT_FILE   = path.join(__dirname, '..', '..', 'guide_content.json')
const IMAGES_DIR = path.join(__dirname, '..', '..', 'guide_images')

const SECTION_MAP = {
  'introduction-guide':  'introduction',
  'logging-guide':       'logging-in',
  'insights-dashboard':  'insights-dashboard',
  'inventory-manager':   'inventory-manager',
  'service-manager':     'service-manager',
  'asset-faults':        'asset-faults',
  'administrator-guide': 'administrator-guide',
  'technical-security':  'technical-security',
}

function toId(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .slice(0, 80)
}

function mimeToExt(mime) {
  const map = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' }
  return map[mime] || '.png'
}

// Extracts base64 data URIs from img tags, saves them as files in guide_images/,
// and replaces the src with /uploads/<filename> so Azure can serve them.
function extractImages(node) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
  let count = 0
  node.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || ''
    if (!src.startsWith('data:')) return
    const [meta, b64] = src.split(',')
    const mime = meta.replace('data:', '').replace(';base64', '')
    const filename = `${crypto.randomUUID()}${mimeToExt(mime)}`
    fs.writeFileSync(path.join(IMAGES_DIR, filename), Buffer.from(b64, 'base64'))
    img.setAttribute('src', `/uploads/${filename}`)
    img.setAttribute('loading', 'lazy')
    count++
  })
  return count
}

function extractContent(sectionNode) {
  const contentDiv = sectionNode.querySelector('.section-content')
  if (!contentDiv) return sectionNode.innerHTML

  const parts = []

  contentDiv.querySelectorAll('.subsection').forEach(sub => {
    const originalId = sub.getAttribute('id') || ''
    const h3 = sub.querySelector('h3')
    if (h3) {
      const headingText = h3.text.trim()
      const headingId   = originalId || toId(headingText)
      parts.push(`<h2 id="${headingId}">${headingText}</h2>`)
    }

    sub.childNodes.forEach(node => {
      const tag = node.tagName?.toLowerCase()
      if (!tag || tag === 'h3') return

      if (tag === 'p') {
        const text = node.innerHTML.trim()
        if (text) parts.push(`<p>${text}</p>`)
        return
      }

      if (tag === 'ul' || tag === 'ol') {
        parts.push(node.outerHTML)
        return
      }

      if (node.classList?.contains('figure')) {
        const img     = node.querySelector('img')
        const caption = node.querySelector('.figure-caption')
        if (img) {
          const captionHtml = caption
            ? `<figcaption>${caption.text.trim()}</figcaption>`
            : ''
          parts.push(`<figure>${img.outerHTML}${captionHtml}</figure>`)
        }
        return
      }

      const html = node.outerHTML?.trim()
      if (html) parts.push(html)
    })
  })

  return parts.join('\n')
}

if (!fs.existsSync(HTML_FILE)) {
  console.error(`File not found: ${HTML_FILE}`)
  process.exit(1)
}

console.log('Reading standalone HTML…')
const raw  = fs.readFileSync(HTML_FILE, 'utf-8')
const root = parse(raw, { blockTextElements: { script: false } })

const output = []

for (const [sectionId, slug] of Object.entries(SECTION_MAP)) {
  const section = root.querySelector(`#${sectionId}`)
  if (!section) {
    console.warn(`  ⚠ Section #${sectionId} not found — skipping ${slug}`)
    continue
  }

  const imgCount = extractImages(section)
  const content  = extractContent(section)
  output.push({ slug, content, status: 'published' })
  console.log(`  ✓ ${slug} (${imgCount} images extracted)`)
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2))
console.log(`\nWrote ${output.length} guides → ${OUT_FILE}`)
console.log(`Images saved → ${IMAGES_DIR}/`)
console.log('\nNext steps:')
console.log('  1. Upload all files from guide_images/ to /home/uploads/ via Kudu file browser')
console.log('  2. Upload guide_content.json to /home/data/ via Kudu file browser')
console.log('  3. Restart the Azure app — startup.sh will import and delete the file')
