// Reverse geocoding (coordinates -> place name).
//
// Open-Meteo's geocoding API is forward-only, so the current-location page uses
// BigDataCloud's free reverse-geocode-client endpoint. It needs no API key and
// is CORS-enabled for browser use.
//
// Docs: https://www.bigdatacloud.com/docs/api/reverse-geocode-to-city-api

const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

/**
 * Resolve coordinates to a place descriptor.
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ language?: string }} [opts]
 * @returns {Promise<{ name: string|null, admin1: string|null, country: string|null, countryCode: string|null }>}
 */
export async function reverseGeocode(latitude, longitude, opts = {}) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: opts.language ?? 'en',
  })

  const res = await fetch(`${REVERSE_URL}?${params}`)
  if (!res.ok) {
    throw new Error(`Reverse geocode failed (${res.status})`)
  }
  const d = await res.json()

  // `locality` is usually the most recognizable populated-place name; `city`
  // can resolve to a township or administrative area, so prefer locality.
  return {
    name: d.locality || d.city || null,
    admin1: d.principalSubdivision || null,
    country: d.countryName || null,
    countryCode: d.countryCode || null,
  }
}
