// Reactive forecast loader: fetch + normalize for a coordinate, tracking
// loading and error state.

import { ref, shallowRef } from 'vue'
import { fetchForecast } from '../api/openMeteo.js'
import { normalizeForecast } from '../api/normalize.js'

export function useForecast() {
  const forecast = shallowRef(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * @param {{ latitude: number, longitude: number, place?: object, units?: object }} args
   */
  async function load({ latitude, longitude, place = null, units = {} }) {
    loading.value = true
    error.value = null
    try {
      const raw = await fetchForecast({ latitude, longitude, units })
      forecast.value = normalizeForecast(raw, place)
    } catch (err) {
      error.value = err.message ?? 'Failed to load weather.'
      forecast.value = null
    } finally {
      loading.value = false
    }
  }

  return { forecast, loading, error, load }
}
