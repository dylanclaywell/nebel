// Embed the current widget source into the preview template so the preview runs
// the real nebel-widget.js. Produces a self-contained widget/preview.html you can
// open directly in a browser.
//
// Run: npm run build:widget-preview   (after changing the widget)

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const template = readFileSync(join(ROOT, 'widget', 'preview.template.html'), 'utf8')
const widgetSrc = readFileSync(join(ROOT, 'widget', 'nebel-widget.js'), 'utf8')

// Function replacer so `$` sequences in the source aren't treated specially.
const out = template.replace('__WIDGET_SOURCE__', () => widgetSrc)
writeFileSync(join(ROOT, 'widget', 'preview.html'), out)
console.log('wrote widget/preview.html — open it in a browser')
