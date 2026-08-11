// Nebel — Scriptable weather widget
// ----------------------------------
// A standalone iOS home-screen widget powered by Open-Meteo, matching the Nebel
// PWA's condition-driven gradients. Small + Medium supported.
//
// Install: copy this whole file into a new script in the Scriptable app, add a
// Scriptable widget to your home screen, and pick this script.
//
// Widget parameter (long-press widget → Edit Widget → Parameter):
//   • empty        → your current location (GPS)
//   • "Chicago"    → a place name (geocoded)
//   • "40.05,-86"  → explicit "lat,lon"
//
// Icons are SF Symbols for now; a later version swaps in the PWA's glass icons.

const CONFIG = {
  units: { temperature: 'fahrenheit', windSpeed: 'mph', precipitation: 'inch' },
  // TODO: replace with the real deploy URL once the PWA is live.
  pwaUrl: 'https://nebel.pages.dev/',
  refreshMinutes: 30,
}

// --- condition palette (ported from the PWA's weatherCodes.js) ---
const PALETTE = {
  clear: {
    day: { from: '#4a90e2', to: '#7ec8f0', text: '#ffffff', sub: 'rgba(255,255,255,0.82)' },
    night: { from: '#0b1836', to: '#1c3a63', text: '#eef4ff', sub: 'rgba(238,244,255,0.72)' },
  },
  partlyCloudy: {
    day: { from: '#5b8bc0', to: '#9cbdd8', text: '#ffffff', sub: 'rgba(255,255,255,0.82)' },
    night: { from: '#141d33', to: '#2a3b56', text: '#eef4ff', sub: 'rgba(238,244,255,0.7)' },
  },
  cloudy: {
    day: { from: '#6b7a8f', to: '#9aa7b6', text: '#ffffff', sub: 'rgba(255,255,255,0.82)' },
    night: { from: '#1a2130', to: '#333d4d', text: '#eef1f6', sub: 'rgba(238,241,246,0.7)' },
  },
  fog: {
    day: { from: '#8a97a6', to: '#c3ccd6', text: '#1b2430', sub: 'rgba(27,36,48,0.7)' },
    night: { from: '#20272f', to: '#3b444e', text: '#eef1f6', sub: 'rgba(238,241,246,0.7)' },
  },
  drizzle: {
    day: { from: '#5f7d99', to: '#93aec2', text: '#ffffff', sub: 'rgba(255,255,255,0.82)' },
    night: { from: '#141e2b', to: '#2a3a4c', text: '#eef4ff', sub: 'rgba(238,244,255,0.7)' },
  },
  rain: {
    day: { from: '#465a70', to: '#6e8399', text: '#ffffff', sub: 'rgba(255,255,255,0.8)' },
    night: { from: '#0f1620', to: '#243141', text: '#eaf1fa', sub: 'rgba(234,241,250,0.7)' },
  },
  snow: {
    day: { from: '#8fa9c4', to: '#d6e4f0', text: '#1b2430', sub: 'rgba(27,36,48,0.7)' },
    night: { from: '#1b2634', to: '#3a4a5e', text: '#eef4ff', sub: 'rgba(238,244,255,0.72)' },
  },
  thunderstorm: {
    day: { from: '#3a3f52', to: '#5b5f78', text: '#ffffff', sub: 'rgba(255,255,255,0.8)' },
    night: { from: '#0d0f1a', to: '#242739', text: '#eef1fa', sub: 'rgba(238,241,250,0.7)' },
  },
}

// WMO code -> { label, sfSymbol, group }
const WEATHER_CODES = {
  0: { label: 'Clear', sf: 'sun.max.fill', group: 'clear' },
  1: { label: 'Mainly Clear', sf: 'sun.max.fill', group: 'clear' },
  2: { label: 'Partly Cloudy', sf: 'cloud.sun.fill', group: 'partlyCloudy' },
  3: { label: 'Overcast', sf: 'cloud.fill', group: 'cloudy' },
  45: { label: 'Fog', sf: 'cloud.fog.fill', group: 'fog' },
  48: { label: 'Rime Fog', sf: 'cloud.fog.fill', group: 'fog' },
  51: { label: 'Light Drizzle', sf: 'cloud.drizzle.fill', group: 'drizzle' },
  53: { label: 'Drizzle', sf: 'cloud.drizzle.fill', group: 'drizzle' },
  55: { label: 'Heavy Drizzle', sf: 'cloud.drizzle.fill', group: 'drizzle' },
  56: { label: 'Freezing Drizzle', sf: 'cloud.sleet.fill', group: 'drizzle' },
  57: { label: 'Freezing Drizzle', sf: 'cloud.sleet.fill', group: 'drizzle' },
  61: { label: 'Light Rain', sf: 'cloud.rain.fill', group: 'rain' },
  63: { label: 'Rain', sf: 'cloud.rain.fill', group: 'rain' },
  65: { label: 'Heavy Rain', sf: 'cloud.heavyrain.fill', group: 'rain' },
  66: { label: 'Freezing Rain', sf: 'cloud.sleet.fill', group: 'rain' },
  67: { label: 'Freezing Rain', sf: 'cloud.sleet.fill', group: 'rain' },
  71: { label: 'Light Snow', sf: 'cloud.snow.fill', group: 'snow' },
  73: { label: 'Snow', sf: 'cloud.snow.fill', group: 'snow' },
  75: { label: 'Heavy Snow', sf: 'cloud.snow.fill', group: 'snow' },
  77: { label: 'Snow Grains', sf: 'cloud.snow.fill', group: 'snow' },
  80: { label: 'Light Showers', sf: 'cloud.rain.fill', group: 'rain' },
  81: { label: 'Showers', sf: 'cloud.rain.fill', group: 'rain' },
  82: { label: 'Heavy Showers', sf: 'cloud.heavyrain.fill', group: 'rain' },
  85: { label: 'Snow Showers', sf: 'cloud.snow.fill', group: 'snow' },
  86: { label: 'Heavy Snow Showers', sf: 'cloud.snow.fill', group: 'snow' },
  95: { label: 'Thunderstorm', sf: 'cloud.bolt.rain.fill', group: 'thunderstorm' },
  96: { label: 'Thunderstorm', sf: 'cloud.bolt.rain.fill', group: 'thunderstorm' },
  99: { label: 'Thunderstorm', sf: 'cloud.bolt.rain.fill', group: 'thunderstorm' },
}
const UNKNOWN = { label: 'Unknown', sf: 'questionmark', group: 'cloudy' }

function describeWeather(code, isDay) {
  const entry = WEATHER_CODES[code] || UNKNOWN
  const p = PALETTE[entry.group]
  return { ...entry, swatch: isDay ? p.day : p.night }
}

// Parse "rgba(r,g,b,a)" or "#hex" into a Scriptable Color.
function toColor(css) {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (m) {
    const hex =
      '#' +
      [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('')
    return new Color(hex, m[4] !== undefined ? +m[4] : 1)
  }
  return new Color(css)
}

// --- data ---
async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  const data = await new Request(url).loadJSON()
  const r = (data.results || [])[0]
  return r ? { latitude: r.latitude, longitude: r.longitude, name: r.name } : null
}

async function resolveLocation() {
  const param = (args.widgetParameter || '').trim()
  if (param) {
    const m = param.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/)
    if (m) return { latitude: +m[1], longitude: +m[2], name: null }
    const g = await geocode(param)
    if (g) return g
  }
  Location.setAccuracyToThreeKilometers()
  const cur = await Location.current()
  return { latitude: cur.latitude, longitude: cur.longitude, name: null }
}

async function reverseName(lat, lon) {
  try {
    const list = await Location.reverseGeocode(lat, lon)
    const p = list && list[0]
    return p ? p.locality || p.subAdministrativeArea || p.administrativeArea : null
  } catch {
    return null
  }
}

async function fetchForecast(lat, lon) {
  const u = CONFIG.units
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,is_day,weather_code,apparent_temperature` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=${u.temperature}&wind_speed_unit=${u.windSpeed}` +
    `&precipitation_unit=${u.precipitation}&timezone=auto&forecast_days=1`
  return new Request(url).loadJSON()
}

function hourLabel(iso) {
  let h = parseInt(iso.slice(11, 13), 10)
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}${ap}`
}

// --- rendering ---
function setGradient(widget, swatch) {
  const g = new LinearGradient()
  g.colors = [toColor(swatch.from), toColor(swatch.to)]
  g.locations = [0, 1]
  g.startPoint = new Point(0, 0)
  g.endPoint = new Point(0, 1)
  widget.backgroundGradient = g
}

function symbolImage(name, size, color) {
  const sym = SFSymbol.named(name)
  sym.applyFont(Font.systemFont(size))
  return sym.image
}

function buildSmall(widget, d) {
  const s = d.current.weather.swatch
  const text = toColor(s.text)
  const sub = toColor(s.sub)
  widget.setPadding(14, 16, 14, 16)

  const top = widget.addStack()
  top.centerAlignContent()
  const loc = top.addText(d.place)
  loc.font = Font.semiboldSystemFont(13)
  loc.textColor = text
  loc.lineLimit = 1
  top.addSpacer()

  widget.addSpacer()

  const mid = widget.addStack()
  mid.centerAlignContent()
  const icon = mid.addImage(symbolImage(d.current.weather.sf, 34, text))
  icon.imageSize = new Size(38, 38)
  icon.tintColor = text
  mid.addSpacer(8)
  const temp = mid.addText(`${d.current.temp}°`)
  temp.font = Font.regularSystemFont(40)
  temp.textColor = text

  widget.addSpacer(2)
  const cond = widget.addText(d.current.weather.label)
  cond.font = Font.mediumSystemFont(13)
  cond.textColor = text
  cond.lineLimit = 1

  const hilo = widget.addText(`H:${d.hi}°  L:${d.lo}°`)
  hilo.font = Font.systemFont(12)
  hilo.textColor = sub
}

function buildMedium(widget, d) {
  const s = d.current.weather.swatch
  const text = toColor(s.text)
  const sub = toColor(s.sub)
  widget.setPadding(14, 16, 14, 16)

  const row = widget.addStack()
  row.layoutHorizontally()

  // Left: current conditions
  const left = row.addStack()
  left.layoutVertically()
  const loc = left.addText(d.place)
  loc.font = Font.semiboldSystemFont(14)
  loc.textColor = text
  loc.lineLimit = 1
  left.addSpacer(4)
  const midl = left.addStack()
  midl.centerAlignContent()
  const icon = midl.addImage(symbolImage(d.current.weather.sf, 30, text))
  icon.imageSize = new Size(34, 34)
  icon.tintColor = text
  midl.addSpacer(6)
  const temp = midl.addText(`${d.current.temp}°`)
  temp.font = Font.regularSystemFont(36)
  temp.textColor = text
  const cond = left.addText(d.current.weather.label)
  cond.font = Font.mediumSystemFont(12)
  cond.textColor = text
  cond.lineLimit = 1
  const hilo = left.addText(`H:${d.hi}°  L:${d.lo}°`)
  hilo.font = Font.systemFont(11)
  hilo.textColor = sub

  row.addSpacer()

  // Right: next hours
  const right = row.addStack()
  right.layoutHorizontally()
  right.bottomAlignContent()
  d.hours.forEach((h, i) => {
    if (i > 0) right.addSpacer(10)
    const col = right.addStack()
    col.layoutVertically()
    col.centerAlignContent()
    const hl = col.addText(h.label)
    hl.font = Font.systemFont(11)
    hl.textColor = sub
    col.addSpacer(3)
    const hi = col.addImage(symbolImage(h.sf, 15, text))
    hi.imageSize = new Size(20, 20)
    hi.tintColor = text
    col.addSpacer(3)
    const ht = col.addText(`${h.temp}°`)
    ht.font = Font.mediumSystemFont(12)
    ht.textColor = text
  })
}

function errorWidget(message) {
  const w = new ListWidget()
  w.backgroundColor = new Color('#0b1020')
  const t = w.addText('Nebel')
  t.font = Font.semiboldSystemFont(14)
  t.textColor = new Color('#ffffff')
  w.addSpacer(6)
  const m = w.addText(message)
  m.font = Font.systemFont(12)
  m.textColor = new Color('#9aa3bd')
  return w
}

async function main() {
  const family = config.widgetFamily || 'medium'
  let widget

  try {
    const loc = await resolveLocation()
    const raw = await fetchForecast(loc.latitude, loc.longitude)
    const cur = raw.current
    const isDay = cur.is_day === 1

    // Current-hour index for the hourly strip.
    const key = cur.time.slice(0, 13)
    let start = raw.hourly.time.findIndex((t) => t.slice(0, 13) === key)
    if (start < 0) start = 0
    const hours = []
    for (let i = start; i < start + 4 && i < raw.hourly.time.length; i++) {
      hours.push({
        label: i === start ? 'Now' : hourLabel(raw.hourly.time[i]),
        temp: Math.round(raw.hourly.temperature_2m[i]),
        sf: describeWeather(raw.hourly.weather_code[i], true).sf,
      })
    }

    const place = loc.name || (await reverseName(loc.latitude, loc.longitude)) || 'Current Location'
    const d = {
      place,
      current: { temp: Math.round(cur.temperature_2m), weather: describeWeather(cur.weather_code, isDay) },
      hi: Math.round(raw.daily.temperature_2m_max[0]),
      lo: Math.round(raw.daily.temperature_2m_min[0]),
      hours,
    }

    widget = new ListWidget()
    setGradient(widget, d.current.weather.swatch)
    if (family === 'small') buildSmall(widget, d)
    else buildMedium(widget, d)

    widget.url = CONFIG.pwaUrl
    widget.refreshAfterDate = new Date(Date.now() + CONFIG.refreshMinutes * 60 * 1000)
  } catch (e) {
    widget = errorWidget(String(e.message || e))
  }

  if (config.runsInWidget) {
    Script.setWidget(widget)
  } else if (family === 'small') {
    await widget.presentSmall()
  } else {
    await widget.presentMedium()
  }
  Script.complete()
}

await main()
