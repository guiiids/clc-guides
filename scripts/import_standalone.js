/**
 * import_standalone.js
 *
 * Reads ../../iteration-1-standalone.html, extracts each guide's content,
 * saves embedded base64 images to /public/uploads/, and upserts clean HTML
 * into the Guide table via Prisma.
 *
 * Run from clc-guides-site/:
 *   node scripts/import_standalone.js
 */

const { PrismaClient } = require('@prisma/client')
const { parse }        = require('node-html-parser')
const fs               = require('fs')
const path             = require('path')
const crypto           = require('crypto')

const prisma      = new PrismaClient()
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads')
const HTML_FILE   = path.join(__dirname, '..', '..', 'iteration-1-standalone.html')

// Maps section IDs in the HTML → guide slugs in the DB
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

// ── Helpers ────────────────────────────────────────────────────────────────

function mimeToExt(mime) {
  const map = {
    'image/png':  '.png',
    'image/jpeg': '.jpg',
    'image/jpg':  '.jpg',
    'image/gif':  '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  }
  return map[mime] || '.png'
}

/**
 * Walk every <img> in a parsed node tree.
 * If src is a data URI, write the image to /public/uploads/ and replace src
 * with /uploads/<uuid>.<ext>.
 * Returns count of images extracted.
 */
function extractImages(rootNode, sectionId) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  let count = 0

  rootNode.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || ''
    if (!src.startsWith('data:')) return

    const [meta, b64] = src.split(',')
    const mime = meta.replace('data:', '').replace(';base64', '')
    const ext  = mimeToExt(mime)
    const uuid = crypto.randomUUID()
    const filename = `${uuid}${ext}`
    const filepath = path.join(UPLOADS_DIR, filename)

    fs.writeFileSync(filepath, Buffer.from(b64, 'base64'))
    img.setAttribute('src', `/uploads/${filename}`)
    img.setAttribute('loading', 'lazy')
    count++
  })

  return count
}

/**
 * Slugify a string for use as an HTML id.
 */
function toId(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .slice(0, 80)
}

/**
 * Extract clean content HTML from a guide's <section> element.
 *
 * Structure in standalone:
 *   <section id="GUIDE_ID">
 *     <div class="section-header"><h2>Title</h2></div>
 *     <div class="section-content">
 *       <div id="SUB_ID" class="subsection scroll-target">
 *         <h3>Subsection heading</h3>
 *         <p>...</p>
 *         <div class="figure">
 *           <img src="...">
 *           <div class="figure-caption">Caption text</div>
 *         </div>
 *       </div>
 *     </div>
 *   </section>
 *
 * Output: clean HTML where each subsection <h3> becomes <h2 id="...">
 * and figures become <figure><img><figcaption>.
 */
function extractContent(sectionNode, sectionId) {
  const contentDiv = sectionNode.querySelector('.section-content')
  if (!contentDiv) {
    // Some guides may not have the wrapper — use section directly
    return sectionNode.innerHTML
  }

  const parts = []

  contentDiv.querySelectorAll('.subsection').forEach(sub => {
    const originalId = sub.getAttribute('id') || ''

    // h3 → h2 with id (primary heading level in TipTap content)
    const h3 = sub.querySelector('h3')
    if (h3) {
      const headingText = h3.text.trim()
      const headingId   = originalId || toId(headingText)
      parts.push(`<h2 id="${headingId}">${headingText}</h2>`)
    }

    // Paragraphs and lists (skip h3 — already handled above)
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

      // .figure → <figure><img><figcaption>
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

      // Fallback: include anything else as-is
      const html = node.outerHTML?.trim()
      if (html) parts.push(html)
    })
  })

  return parts.join('\n')
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`\nFile not found: ${HTML_FILE}`)
    process.exit(1)
  }

  console.log('Reading standalone HTML…')
  const raw  = fs.readFileSync(HTML_FILE, 'utf-8')
  const root = parse(raw, { blockTextElements: { script: false } })

  let totalImages = 0

  for (const [sectionId, slug] of Object.entries(SECTION_MAP)) {
    const section = root.querySelector(`#${sectionId}`)

    if (!section) {
      console.warn(`  ⚠ Section #${sectionId} not found — skipping ${slug}`)
      continue
    }

    process.stdout.write(`  Processing ${slug}… `)

    // 1. Extract & save images (mutates img src attributes in-place)
    const imgCount = extractImages(section, sectionId)
    totalImages += imgCount

    // 2. Build clean content HTML
    const content = extractContent(section, sectionId)

    // 3. Upsert into DB
    await prisma.guide.update({
      where: { slug },
      data:  { content, status: 'draft' },
    })

    console.log(`✓  (${imgCount} images)`)
  }

  console.log(`\nDone. ${totalImages} images saved to public/uploads/`)
  console.log('All 8 guides updated with status=draft. Publish them from /admin when ready.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
