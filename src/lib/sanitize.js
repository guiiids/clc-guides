import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Allows semantic tags used by the TipTap editor and guide prose styles
 * while stripping scripts, event handlers, and dangerous attributes.
 */
export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['figure', 'figcaption', 'iframe'],
    ADD_ATTR: ['id', 'loading', 'target', 'rel', 'data-type'],
    FORBID_TAGS: ['script', 'style', 'form', 'input', 'textarea', 'select'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}
