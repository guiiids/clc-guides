export function parseHeadings(html) {
  if (!html) return []
  const matches = [...html.matchAll(/<h2[^>]*\sid="([^"]+)"[^>]*>(.*?)<\/h2>/gi)]
  return matches.map(m => ({
    id: m[1],
    title: m[2].replace(/<[^>]+>/g, '').trim(),
  }))
}
