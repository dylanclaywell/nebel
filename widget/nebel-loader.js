// Nebel widget loader
// -------------------
// Install THIS script in Scriptable once (instead of nebel-widget.js). It keeps
// the widget up to date from GitHub automatically — you never copy-paste again.
//
// How it works: each run it asks GitHub for the widget with the ETag it saw last
// time. GitHub replies "304 Not Modified" (tiny) when nothing changed, or sends
// the new code when it did. No manual hash/version step — GitHub maintains the
// ETag on every push. Offline? It runs the last cached copy.
//
// Setup: add a Scriptable widget → set its Script to "Nebel Loader". Location
// parameter works exactly like the widget (blank = GPS, or a city / "lat,lon").

const REPO = 'dylanclaywell/nebel'
const BRANCH = 'main'
const URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/widget/nebel-widget.js`

// Module name importModule() resolves (the file is written to the same dir).
const MODULE_NAME = 'nebel-widget'

const fm = FileManager.local()
const dir = fm.documentsDirectory()
const scriptPath = fm.joinPath(dir, `${MODULE_NAME}.js`)
const etagPath = fm.joinPath(dir, `${MODULE_NAME}.etag`)

function headerValue(headers, name) {
  const lname = name.toLowerCase()
  for (const k of Object.keys(headers || {})) {
    if (k.toLowerCase() === lname) return headers[k]
  }
  return null
}

function showError(message) {
  const w = new ListWidget()
  w.backgroundColor = new Color('#0b1020')
  const t = w.addText('Nebel')
  t.textColor = Color.white()
  t.font = Font.semiboldSystemFont(14)
  w.addSpacer(6)
  const m = w.addText(message)
  m.textColor = new Color('#9aa3bd')
  m.font = Font.systemFont(11)
  Script.setWidget(w)
  Script.complete()
}

// Conditional fetch: only download the body when the ETag changed.
try {
  const req = new Request(URL)
  req.timeoutInterval = 15
  const haveCache = fm.fileExists(scriptPath) && fm.fileExists(etagPath)
  if (haveCache) req.headers = { 'If-None-Match': fm.readString(etagPath).trim() }

  const body = await req.loadString()
  const status = req.response.statusCode

  if (status === 200 && body) {
    fm.writeString(scriptPath, body)
    const etag = headerValue(req.response.headers, 'ETag')
    if (etag) fm.writeString(etagPath, etag)
  }
  // 304 Not Modified → the cached copy is current; nothing to do.
} catch (e) {
  // Offline or fetch failed — fall through and run whatever is cached.
}

if (!fm.fileExists(scriptPath)) {
  showError('Couldn’t download the widget. Connect to the internet and run once.')
} else {
  try {
    // Tell the widget not to auto-run (globals are shared); we call it here.
    globalThis.__NEBEL_EMBEDDED__ = true
    const run = importModule(MODULE_NAME)
    await run()
  } catch (e) {
    showError('Widget failed: ' + ((e && e.message) || e))
  }
}
