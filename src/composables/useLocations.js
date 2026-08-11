// Saved-locations store, shared app-wide and persisted to localStorage.
//
// Page order in the swipe UI is: the special "current location" page first
// (resolved via geolocation at load), then each saved location in stored order.
// Only saved locations are persisted; the current-location page is implicit.

import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'nebel.locations'

// The always-present current-location page. It has no coordinates here; they are
// resolved via geolocation when the page loads.
export const CURRENT_LOCATION = Object.freeze({
  id: 'current',
  type: 'current',
  name: 'Current Location',
})

function makeId(place) {
  // Prefer Open-Meteo's geocoding id; fall back to rounded coordinates.
  if (place.id != null) return `geo:${place.id}`
  return `coord:${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Module-level reactive state → a single shared store for the whole app.
const saved = reactive(load())

watch(
  () => saved,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // Storage full or unavailable — non-fatal; state stays in memory.
    }
  },
  { deep: true },
)

export function useLocations() {
  // Current location page first, then saved.
  const pages = computed(() => [CURRENT_LOCATION, ...saved])

  function has(place) {
    const id = makeId(place)
    return saved.some((l) => l.id === id)
  }

  function add(place) {
    if (has(place)) return
    saved.push({
      id: makeId(place),
      type: 'saved',
      name: place.name,
      admin1: place.admin1,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
    })
  }

  function remove(id) {
    const i = saved.findIndex((l) => l.id === id)
    if (i !== -1) saved.splice(i, 1)
  }

  function move(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= saved.length ||
      toIndex >= saved.length
    ) {
      return
    }
    const [item] = saved.splice(fromIndex, 1)
    saved.splice(toIndex, 0, item)
  }

  return { pages, saved, has, add, remove, move }
}
