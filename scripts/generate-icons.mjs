// Dependency-free icon + OG image generator.
//
// Draws Nebel's placeholder mark — a cool fog-gradient with soft mist bands —
// and writes the PWA icon set, a favicon.ico, and an Open Graph image. No native
// image libs; pixels are composited by hand and encoded with Node's zlib.
//
// Run: node scripts/generate-icons.mjs
// Real icon + OG art will replace these later (see project notes).

import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// --- tiny PNG encoder (RGBA, 8-bit) ---

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// --- artwork ---

const TOP = [90, 120, 160] // #5a78a0
const BOTTOM = [20, 30, 52] // #141e34

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

// Vertical fog gradient with soft horizontal mist bands. `safe` (0..0.5) keeps
// the bands within a central safe zone — used for maskable icons so the OS mask
// never crops the mark.
function paint(width, height, safe = 0) {
  const rgba = Buffer.alloc(width * height * 4)
  const bands = [
    { center: 0.5, half: 0.05, alpha: 0.16 },
    { center: 0.6, half: 0.04, alpha: 0.12 },
    { center: 0.42, half: 0.03, alpha: 0.1 },
  ]
  const bandLeft = Math.round(width * (0.24 + safe))
  const bandRight = Math.round(width * (0.76 - safe))

  for (let y = 0; y < height; y++) {
    const ty = y / (height - 1)
    let r = lerp(TOP[0], BOTTOM[0], ty)
    let g = lerp(TOP[1], BOTTOM[1], ty)
    let b = lerp(TOP[2], BOTTOM[2], ty)

    let mist = 0
    for (const band of bands) {
      const d = Math.abs(ty - band.center)
      if (d < band.half) mist = Math.max(mist, band.alpha * (1 - d / band.half))
    }
    const mr = lerp(r, 255, mist)
    const mg = lerp(g, 255, mist)
    const mb = lerp(b, 255, mist)

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const inBand = mist > 0 && x >= bandLeft && x <= bandRight
      rgba[i] = inBand ? mr : r
      rgba[i + 1] = inBand ? mg : g
      rgba[i + 2] = inBand ? mb : b
      rgba[i + 3] = 255
    }
  }
  return rgba
}

function square(size, safe = 0) {
  return encodePng(size, size, paint(size, size, safe))
}

// --- favicon.ico (wraps a 32x32 PNG; supported since Windows Vista) ---

function encodeIco(pngBuf, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count

  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size // width
  entry[1] = size >= 256 ? 0 : size // height
  entry[2] = 0 // palette
  entry[3] = 0 // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8) // size of image data
  entry.writeUInt32LE(6 + 16, 12) // offset to image data

  return Buffer.concat([header, entry, pngBuf])
}

// --- write files ---

const pngs = [
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
]

for (const { name, size } of pngs) {
  writeFileSync(join(PUBLIC_DIR, name), square(size))
  console.log(`wrote ${name} (${size}x${size})`)
}

// Maskable: keep the mark inside the central safe zone.
writeFileSync(join(PUBLIC_DIR, 'maskable-512x512.png'), square(512, 0.1))
console.log('wrote maskable-512x512.png (512x512, safe zone)')

// favicon.ico from a 32x32 PNG.
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), encodeIco(square(32), 32))
console.log('wrote favicon.ico (32x32)')

// Open Graph image (1200x630).
writeFileSync(join(PUBLIC_DIR, 'og.png'), encodePng(1200, 630, paint(1200, 630)))
console.log('wrote og.png (1200x630)')
