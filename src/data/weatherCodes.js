// WMO weather-code mapping + condition-driven palette.
//
// This is the shared design layer: every WMO code (returned by Open-Meteo in
// `weather_code`) maps to a human label, an icon, and a `group`. The group,
// combined with day/night, selects a gradient + accent used to color both the
// PWA background and the Scriptable widget.
//
// WMO code reference: https://open-meteo.com/en/docs (Weather variable docs)

/**
 * Condition groups. Kept small on purpose — the palette keys off these, not off
 * every individual code, so the whole app has a consistent, limited color set.
 * @typedef {'clear'|'partlyCloudy'|'cloudy'|'fog'|'drizzle'|'rain'|'snow'|'thunderstorm'} ConditionGroup
 */

/**
 * @typedef {Object} WeatherCode
 * @property {string} label     Human-readable description.
 * @property {string} icon      Emoji used by the PWA (and as a widget fallback).
 * @property {string} sfSymbol  SF Symbol name for the Scriptable widget.
 * @property {ConditionGroup} group
 */

/** @type {Record<number, WeatherCode>} */
export const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️', sfSymbol: 'sun.max.fill', group: 'clear' },
  1: { label: 'Mainly clear', icon: '🌤️', sfSymbol: 'sun.max.fill', group: 'clear' },
  2: { label: 'Partly cloudy', icon: '⛅', sfSymbol: 'cloud.sun.fill', group: 'partlyCloudy' },
  3: { label: 'Overcast', icon: '☁️', sfSymbol: 'cloud.fill', group: 'cloudy' },

  45: { label: 'Fog', icon: '🌫️', sfSymbol: 'cloud.fog.fill', group: 'fog' },
  48: { label: 'Rime fog', icon: '🌫️', sfSymbol: 'cloud.fog.fill', group: 'fog' },

  51: { label: 'Light drizzle', icon: '🌦️', sfSymbol: 'cloud.drizzle.fill', group: 'drizzle' },
  53: { label: 'Drizzle', icon: '🌦️', sfSymbol: 'cloud.drizzle.fill', group: 'drizzle' },
  55: { label: 'Heavy drizzle', icon: '🌧️', sfSymbol: 'cloud.drizzle.fill', group: 'drizzle' },
  56: { label: 'Freezing drizzle', icon: '🌧️', sfSymbol: 'cloud.sleet.fill', group: 'drizzle' },
  57: { label: 'Freezing drizzle', icon: '🌧️', sfSymbol: 'cloud.sleet.fill', group: 'drizzle' },

  61: { label: 'Light rain', icon: '🌧️', sfSymbol: 'cloud.rain.fill', group: 'rain' },
  63: { label: 'Rain', icon: '🌧️', sfSymbol: 'cloud.rain.fill', group: 'rain' },
  65: { label: 'Heavy rain', icon: '🌧️', sfSymbol: 'cloud.heavyrain.fill', group: 'rain' },
  66: { label: 'Freezing rain', icon: '🌧️', sfSymbol: 'cloud.sleet.fill', group: 'rain' },
  67: { label: 'Freezing rain', icon: '🌧️', sfSymbol: 'cloud.sleet.fill', group: 'rain' },

  71: { label: 'Light snow', icon: '🌨️', sfSymbol: 'cloud.snow.fill', group: 'snow' },
  73: { label: 'Snow', icon: '🌨️', sfSymbol: 'cloud.snow.fill', group: 'snow' },
  75: { label: 'Heavy snow', icon: '❄️', sfSymbol: 'cloud.snow.fill', group: 'snow' },
  77: { label: 'Snow grains', icon: '🌨️', sfSymbol: 'cloud.snow.fill', group: 'snow' },

  80: { label: 'Light showers', icon: '🌦️', sfSymbol: 'cloud.rain.fill', group: 'rain' },
  81: { label: 'Showers', icon: '🌧️', sfSymbol: 'cloud.rain.fill', group: 'rain' },
  82: { label: 'Heavy showers', icon: '🌧️', sfSymbol: 'cloud.heavyrain.fill', group: 'rain' },

  85: { label: 'Snow showers', icon: '🌨️', sfSymbol: 'cloud.snow.fill', group: 'snow' },
  86: { label: 'Heavy snow showers', icon: '❄️', sfSymbol: 'cloud.snow.fill', group: 'snow' },

  95: { label: 'Thunderstorm', icon: '⛈️', sfSymbol: 'cloud.bolt.rain.fill', group: 'thunderstorm' },
  96: { label: 'Thunderstorm, hail', icon: '⛈️', sfSymbol: 'cloud.bolt.rain.fill', group: 'thunderstorm' },
  99: { label: 'Thunderstorm, heavy hail', icon: '⛈️', sfSymbol: 'cloud.bolt.rain.fill', group: 'thunderstorm' },
}

const UNKNOWN_CODE = {
  label: 'Unknown',
  icon: '❔',
  sfSymbol: 'questionmark',
  group: 'cloudy',
}

/**
 * @typedef {Object} Swatch
 * @property {string} from    Gradient start (top).
 * @property {string} to      Gradient end (bottom).
 * @property {string} accent  Accent / highlight color.
 * @property {string} text    Foreground text color.
 * @property {string} textMuted
 */

/**
 * @typedef {Object} Palette
 * @property {Swatch} day
 * @property {Swatch} night
 */

/**
 * Condition palettes. Each group has a day and night variant. Values are plain
 * hex/rgba so they work identically in CSS and in Scriptable's `Color`.
 * @type {Record<ConditionGroup, Palette>}
 */
export const PALETTE = {
  clear: {
    day: { from: '#4a90e2', to: '#7ec8f0', accent: '#ffd166', text: '#ffffff', textMuted: 'rgba(255,255,255,0.82)' },
    night: { from: '#0b1836', to: '#1c3a63', accent: '#8ec5ff', text: '#eef4ff', textMuted: 'rgba(238,244,255,0.72)' },
  },
  partlyCloudy: {
    day: { from: '#5b8bc0', to: '#9cbdd8', accent: '#ffd166', text: '#ffffff', textMuted: 'rgba(255,255,255,0.82)' },
    night: { from: '#141d33', to: '#2a3b56', accent: '#8ec5ff', text: '#eef4ff', textMuted: 'rgba(238,244,255,0.7)' },
  },
  cloudy: {
    day: { from: '#6b7a8f', to: '#9aa7b6', accent: '#cfd8e3', text: '#ffffff', textMuted: 'rgba(255,255,255,0.82)' },
    night: { from: '#1a2130', to: '#333d4d', accent: '#aeb9c7', text: '#eef1f6', textMuted: 'rgba(238,241,246,0.7)' },
  },
  fog: {
    day: { from: '#8a97a6', to: '#c3ccd6', accent: '#e8edf2', text: '#1b2430', textMuted: 'rgba(27,36,48,0.7)' },
    night: { from: '#20272f', to: '#3b444e', accent: '#c3ccd6', text: '#eef1f6', textMuted: 'rgba(238,241,246,0.7)' },
  },
  drizzle: {
    day: { from: '#5f7d99', to: '#93aec2', accent: '#bfe0ff', text: '#ffffff', textMuted: 'rgba(255,255,255,0.82)' },
    night: { from: '#141e2b', to: '#2a3a4c', accent: '#9fd0f5', text: '#eef4ff', textMuted: 'rgba(238,244,255,0.7)' },
  },
  rain: {
    day: { from: '#465a70', to: '#6e8399', accent: '#8ec5ff', text: '#ffffff', textMuted: 'rgba(255,255,255,0.8)' },
    night: { from: '#0f1620', to: '#243141', accent: '#7fb6ee', text: '#eaf1fa', textMuted: 'rgba(234,241,250,0.7)' },
  },
  snow: {
    day: { from: '#8fa9c4', to: '#d6e4f0', accent: '#ffffff', text: '#1b2430', textMuted: 'rgba(27,36,48,0.7)' },
    night: { from: '#1b2634', to: '#3a4a5e', accent: '#dceaf7', text: '#eef4ff', textMuted: 'rgba(238,244,255,0.72)' },
  },
  thunderstorm: {
    day: { from: '#3a3f52', to: '#5b5f78', accent: '#ffd166', text: '#ffffff', textMuted: 'rgba(255,255,255,0.8)' },
    night: { from: '#0d0f1a', to: '#242739', accent: '#ffd166', text: '#eef1fa', textMuted: 'rgba(238,241,250,0.7)' },
  },
}

/**
 * Resolve a WMO code to its full descriptor, including the day/night swatch.
 * @param {number} code
 * @param {boolean} [isDay=true]
 * @returns {{ code: number, label: string, icon: string, sfSymbol: string, group: ConditionGroup, isDay: boolean, swatch: Swatch }}
 */
export function describeWeather(code, isDay = true) {
  const entry = WEATHER_CODES[code] ?? UNKNOWN_CODE
  const palette = PALETTE[entry.group]
  const swatch = isDay ? palette.day : palette.night
  return { code, ...entry, isDay, swatch }
}
