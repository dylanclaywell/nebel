// US severe-weather alerts from the National Weather Service (api.weather.gov).
//
// Free, no API key, CORS-enabled. US-only: outside NWS coverage the endpoint
// returns no features, so callers just get an empty list.
//
// Docs: https://www.weather.gov/documentation/services-web-api

const ALERTS_URL = 'https://api.weather.gov/alerts/active'

// Higher = more urgent; used to sort the most serious alert to the top.
const SEVERITY_RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 }

/**
 * Fetch active alerts for a coordinate, most severe first.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Array<{ id, event, headline, severity, urgency, description, expires }>>}
 */
export async function fetchAlerts(latitude, longitude) {
  const params = new URLSearchParams({
    point: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    status: 'actual',
    message_type: 'alert',
  })

  let data
  try {
    const res = await fetch(`${ALERTS_URL}?${params}`, {
      headers: { Accept: 'application/geo+json' },
    })
    if (!res.ok) return [] // non-US / no coverage / transient error
    data = await res.json()
  } catch {
    return []
  }

  const alerts = (data.features ?? []).map((f) => {
    const p = f.properties
    return {
      id: f.id,
      event: p.event,
      headline: p.headline,
      severity: p.severity,
      urgency: p.urgency,
      description: p.description,
      expires: p.expires,
    }
  })

  return alerts.sort(
    (a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0),
  )
}
