// Turn NWS alert text into a clean, structured shape for display.
//
// NWS descriptions use a "* HEADER...body" template (WHAT / WHERE / WHEN /
// IMPACTS / ADDITIONAL DETAILS) with hard line breaks every ~68 chars. We split
// it into labeled sections, collapse the soft-wraps into flowing text, and turn
// "- " lines into real bullet lists.

const LABELS = {
  WHAT: 'What',
  WHERE: 'Where',
  WHEN: 'When',
  IMPACTS: 'Impacts',
  'ADDITIONAL DETAILS': 'Details',
}

function titleize(label) {
  return LABELS[label] ?? label.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase())
}

/**
 * Turn a block of NWS text into paragraphs and bullet lists, joining the
 * soft-wrapped lines back into flowing sentences.
 * @returns {Array<{kind:'p', text:string} | {kind:'ul', items:string[]}>}
 */
export function formatText(text) {
  if (!text) return []
  const out = []
  let para = []
  let items = []
  const flushPara = () => {
    if (para.length) out.push({ kind: 'p', text: para.join(' ') })
    para = []
  }
  const flushList = () => {
    if (items.length) out.push({ kind: 'ul', items: [...items] })
    items = []
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line === '') {
      flushPara()
      flushList()
    } else if (line.startsWith('- ')) {
      flushPara()
      items.push(line.slice(2))
    } else if (items.length) {
      // Soft-wrapped continuation of the current bullet.
      items[items.length - 1] += ` ${line}`
    } else {
      para.push(line)
    }
  }
  flushPara()
  flushList()
  return out
}

/**
 * Parse an NWS description into labeled sections.
 * @returns {Array<{ label:string, blocks:ReturnType<typeof formatText> }>}
 */
export function parseSections(description) {
  if (!description) return []
  const re = /\*\s+([A-Z][A-Z /]*?)\.\.\.([\s\S]*?)(?=\n\*\s+[A-Z]|$)/g
  const sections = []
  let m
  while ((m = re.exec(description))) {
    sections.push({ label: titleize(m[1].trim()), blocks: formatText(m[2].trim()) })
  }
  // Fallback: no recognizable template — show the whole thing as prose.
  if (!sections.length) return [{ label: '', blocks: formatText(description.trim()) }]
  return sections
}

/**
 * Format an ISO expiry into a short local label, e.g. "Tue 10:30 PM".
 */
export function formatExpires(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
