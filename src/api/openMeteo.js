// Open-Meteo API client.
//
// No API key or account is required. Two endpoints are used:
//   - Geocoding:  resolve a place name to coordinates.
//   - Forecast:   current conditions + hourly + daily for a coordinate.
//
// Docs: https://open-meteo.com/en/docs

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

// Fields requested from the forecast endpoint. Kept as arrays so they are easy
// to read and extend; joined into CSV at request time.
const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
]

const HOURLY_FIELDS = ['temperature_2m', 'weather_code', 'precipitation_probability']

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'precipitation_probability_max',
]

/**
 * @typedef {Object} Units
 * @property {'celsius'|'fahrenheit'} [temperature]
 * @property {'kmh'|'mph'|'ms'|'kn'} [windSpeed]
 * @property {'mm'|'inch'} [precipitation]
 */

/** @type {Units} */
const DEFAULT_UNITS = {
  temperature: 'fahrenheit',
  windSpeed: 'mph',
  precipitation: 'inch',
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (${res.status} ${res.statusText})`)
  }
  const data = await res.json()
  // Open-Meteo signals errors with { error: true, reason: string }.
  if (data && data.error) {
    throw new Error(`Open-Meteo error: ${data.reason || 'unknown reason'}`)
  }
  return data
}

/**
 * Search for places matching a name.
 * @param {string} name
 * @param {{ count?: number, language?: string }} [opts]
 * @returns {Promise<Array<{ id, name, latitude, longitude, country, countryCode, admin1, timezone }>>}
 */
export async function geocode(name, opts = {}) {
  const query = name.trim()
  if (!query) return []

  const params = new URLSearchParams({
    name: query,
    count: String(opts.count ?? 8),
    language: opts.language ?? 'en',
    format: 'json',
  })

  const data = await getJson(`${GEOCODING_URL}?${params}`)
  const results = data.results ?? []
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    countryCode: r.country_code,
    admin1: r.admin1, // state / region
    timezone: r.timezone,
  }))
}

/**
 * Fetch the full forecast for a coordinate.
 * @param {{ latitude: number, longitude: number, units?: Units }} args
 * @returns {Promise<object>} the raw Open-Meteo forecast response
 */
export async function fetchForecast({ latitude, longitude, units = {} }) {
  const u = { ...DEFAULT_UNITS, ...units }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_FIELDS.join(','),
    hourly: HOURLY_FIELDS.join(','),
    daily: DAILY_FIELDS.join(','),
    temperature_unit: u.temperature,
    wind_speed_unit: u.windSpeed,
    precipitation_unit: u.precipitation,
    timezone: 'auto',
    forecast_days: '7',
  })

  return getJson(`${FORECAST_URL}?${params}`)
}
