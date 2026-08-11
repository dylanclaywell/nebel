// Bakes the "Liquid + Depth" glass treatment into the vendored Meteocons SVGs
// and writes runtime modules of ready-to-render icon markup.
//
// Two sets are produced:
//   - Static (src/icons/meteocons)          -> weatherIcons.generated.js
//   - Animated (src/icons/meteocons-animated)-> weatherIconsAnimated.generated.js
//
// Treatment:
//   - Depth: intensify each icon's own top->bottom gradient (lighten the top
//     stop, deepen the bottom) so flat clouds gain volume.
//   - Glass: paint a top specular gloss through the icon's own silhouette.
//   - Animated only: rewrite the looping SMIL to run for ~MOTION_SECONDS then
//     freeze, so the hero icon animates on load and settles (no forever motion).
//
// Internal ids are templated as `__UID__-<id>`; WeatherIcon.vue swaps `__UID__`
// for a per-instance value so repeated icons never share gradient/mask ids.
//
// Run: npm run build:icons   (regenerate after changing icons or the mapping)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src', 'data')
const STATIC_DIR = join(ROOT, 'src', 'icons', 'meteocons')
const ANIM_DIR = join(ROOT, 'src', 'icons', 'meteocons-animated')

// Depth strength — the two knobs. Raise for more contrast/volume.
const LIGHTEN_TOP = 0.34
const DARKEN_BOTTOM = 0.3
// How long the hero animation plays before freezing (seamless loops settle back
// to a neutral pose at whole-cycle boundaries).
const MOTION_SECONDS = 6

function parts(svg) {
  const open = svg.indexOf('>') + 1
  const close = svg.lastIndexOf('</svg>')
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 128 128'
  return { inner: svg.slice(open, close).trim(), vb }
}

// --- color helpers ---
function hex(c) {
  if (c === 'white') return [255, 255, 255]
  if (c === 'black') return [0, 0, 0]
  const m = c.replace('#', '')
  const n = m.length === 3 ? m.split('').map((x) => x + x).join('') : m
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16))
}
const toHex = (rgb) =>
  '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

// Widen the tonal range of every gradient stop by its offset.
function intensify(inner) {
  return inner.replace(/<linearGradient[\s\S]*?<\/linearGradient>/g, (grad) =>
    grad.replace(/<stop([^>]*)\/>/g, (stop, attrs) => {
      const off = parseFloat((attrs.match(/offset="([^"]+)"/) || [, '0'])[1]) || 0
      const colM = attrs.match(/stop-color="([^"]+)"/)
      if (!colM) return stop
      let rgb = hex(colM[1])
      rgb = mix(rgb, [255, 255, 255], (1 - off) * LIGHTEN_TOP)
      rgb = mix(rgb, [0, 0, 0], off * DARKEN_BOTTOM)
      return `<stop${attrs.replace(/stop-color="[^"]+"/, `stop-color="${toHex(rgb)}"`)}/>`
    }),
  )
}

// Convert looping SMIL (repeatCount="indefinite") to a finite run that freezes,
// so the icon animates briefly on mount and then holds.
function limitAnimations(inner) {
  return inner.replace(/<(animate|animateTransform|animateMotion)\b([^>]*?)(\/?)>/g, (m, tag, attrs, sc) => {
    const durM = attrs.match(/dur="([\d.]+)s"/)
    const dur = durM ? parseFloat(durM[1]) : 1
    const count = Math.max(1, Math.round(MOTION_SECONDS / dur))
    let a = attrs
    a = /repeatCount="[^"]*"/.test(a)
      ? a.replace(/repeatCount="[^"]*"/, `repeatCount="${count}"`)
      : `${a} repeatCount="${count}"`
    a = /\sfill="[^"]*"/.test(a)
      ? a.replace(/\sfill="[^"]*"/, ' fill="freeze"')
      : `${a} fill="freeze"`
    return `<${tag}${a}${sc}>`
  })
}

// Prefix every id and #ref with the __UID__ template token.
function template(inner) {
  const ids = [...inner.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
  ids.sort((a, b) => b.length - a.length)
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    inner = inner.replace(new RegExp(`id="${esc}"`, 'g'), `id="__UID__-${id}"`)
    inner = inner.replace(new RegExp(`#${esc}(?=["')])`, 'g'), `#__UID__-${id}`)
  }
  return inner
}

function treat(rawSvg, { animate = false } = {}) {
  const { inner, vb } = parts(rawSvg)
  const processed = animate ? limitAnimations(inner) : inner
  const tpl = template(intensify(processed))
  const defs =
    `<defs>` +
    `<linearGradient id="__UID__-gloss" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity=".72"/>` +
    `<stop offset=".45" stop-color="#fff" stop-opacity="0"/>` +
    `</linearGradient>` +
    `<g id="__UID__-icon">${tpl}</g>` +
    `<mask id="__UID__-mask" style="mask-type:alpha" maskUnits="userSpaceOnUse">` +
    `<use href="#__UID__-icon"/></mask>` +
    `</defs>`
  const body =
    `<use href="#__UID__-icon"/>` +
    `<rect width="128" height="128" fill="url(#__UID__-gloss)" mask="url(#__UID__-mask)"/>`
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${defs}${body}</svg>`
}

function build({ srcDir, outFile, exportName, animate }) {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.svg'))
  const entries = files
    .map((f) => {
      const name = f.replace('.svg', '')
      const svg = treat(readFileSync(join(srcDir, f), 'utf8'), { animate })
      return `  ${JSON.stringify(name)}: ${JSON.stringify(svg)},`
    })
    .sort()
  const out =
    `// GENERATED by scripts/build-weather-icons.mjs — do not edit by hand.\n` +
    `// Meteocons (MIT, Bas Milius) with Nebel's baked-in "Liquid + Depth" glass\n` +
    `// treatment${animate ? ' + finite/freeze motion' : ''}. \`__UID__\` is replaced per-instance by WeatherIcon.vue.\n\n` +
    `export const ${exportName} = {\n${entries.join('\n')}\n}\n`
  writeFileSync(outFile, out)
  console.log(`wrote ${files.length} icons to ${outFile.replace(ROOT, '.')}`)
}

build({
  srcDir: STATIC_DIR,
  outFile: join(DATA, 'weatherIcons.generated.js'),
  exportName: 'WEATHER_ICONS',
  animate: false,
})
build({
  srcDir: ANIM_DIR,
  outFile: join(DATA, 'weatherIconsAnimated.generated.js'),
  exportName: 'WEATHER_ICONS_ANIMATED',
  animate: true,
})
