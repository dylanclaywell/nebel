<script setup>
import { onMounted, computed, ref, defineAsyncComponent } from 'vue'
import WeatherScene from './WeatherScene.vue'
import Icon from './Icon.vue'
import AlertBanner from './AlertBanner.vue'
import CurrentConditions from './CurrentConditions.vue'
import PrecipNowcast from './PrecipNowcast.vue'
import HourlyForecast from './HourlyForecast.vue'
import DailyForecast from './DailyForecast.vue'

// Leaflet + the radar screen load only when the user opens radar.
const RadarView = defineAsyncComponent(() => import('./RadarView.vue'))
import { useForecast } from '../composables/useForecast.js'
import { getCurrentPosition } from '../composables/useGeolocation.js'
import { reverseGeocode } from '../api/reverseGeocode.js'
import { fetchAlerts } from '../api/nwsAlerts.js'
import { PALETTE } from '../data/weatherCodes.js'

const props = defineProps({
  // A page descriptor from useLocations().pages
  location: { type: Object, required: true },
})

const emit = defineEmits(['remove', 'add'])

const NEUTRAL_SWATCH = PALETTE.cloudy.night

const { forecast, loading, error, load } = useForecast()

// Loading phase for the initial fetch: 'locating' (resolving GPS) then 'loading'.
const phase = ref(props.location.type === 'current' ? 'locating' : 'loading')

// Resolved place name for the current-location page (reverse-geocoded).
const locality = ref('')

// Resolved coordinates (for the radar screen) and radar open state.
const coords = ref(null)
const radarOpen = ref(false)
const radarTitle = computed(() => {
  if (props.location.type === 'current') return locality.value || 'Current Location'
  return [props.location.name, props.location.admin1].filter(Boolean).join(', ')
})

// Active NWS severe-weather alerts (US only; empty elsewhere).
const alerts = ref([])
async function loadAlerts(latitude, longitude) {
  try {
    alerts.value = await fetchAlerts(latitude, longitude)
  } catch {
    alerts.value = []
  }
}

const swatch = computed(
  () => forecast.value?.current.weather.swatch ?? NEUTRAL_SWATCH,
)

const isSaved = computed(() => props.location.type === 'saved')

// True during a pull-to-refresh (keeps the current content visible + spinner);
// distinct from the initial `loading` which shows the full loading state.
const refreshing = ref(false)

async function refresh({ pull = false } = {}) {
  refreshing.value = pull
  try {
    if (props.location.type === 'current') {
      try {
        phase.value = 'locating'
        const { latitude, longitude } = await getCurrentPosition()
        coords.value = { latitude, longitude }
        phase.value = 'loading'
        await load({ latitude, longitude })
        loadAlerts(latitude, longitude) // fire-and-forget; never blocks the forecast
        // Best-effort locality label; failure here shouldn't break the page.
        try {
          const place = await reverseGeocode(latitude, longitude)
          locality.value = [place.name, place.admin1].filter(Boolean).join(', ')
        } catch {
          locality.value = ''
        }
      } catch (err) {
        error.value = err.message ?? 'Could not get your location.'
        forecast.value = null
        loading.value = false
      }
      return
    }

    coords.value = {
      latitude: props.location.latitude,
      longitude: props.location.longitude,
    }
    await load({
      latitude: props.location.latitude,
      longitude: props.location.longitude,
      place: {
        name: props.location.name,
        admin1: props.location.admin1,
        country: props.location.country,
      },
    })
    loadAlerts(props.location.latitude, props.location.longitude)
  } finally {
    refreshing.value = false
  }
}

onMounted(() => refresh())
</script>

<template>
  <WeatherScene :swatch="swatch" :refreshing="refreshing" @refresh="refresh({ pull: true })">
    <div v-if="!forecast && !error" class="loading-state">
      <span class="spinner" aria-hidden="true"></span>
      <p class="loading-text">
        {{ phase === 'locating' ? 'Getting your location…' : 'Loading weather…' }}
      </p>
    </div>

    <div v-else-if="error && !forecast" class="error-state">
      <p class="error-msg">{{ error }}</p>

      <template v-if="location.type === 'current'">
        <p class="error-hint">
          Turn on location for your browser in Settings — or add a place to see its
          weather instead.
        </p>
        <div class="error-actions">
          <button class="pill primary" @click="emit('add')">Add a location</button>
          <button class="pill ghost" @click="refresh()">Retry</button>
        </div>
      </template>

      <button v-else class="pill primary" @click="refresh()">Retry</button>
    </div>

    <template v-else-if="forecast">
      <AlertBanner v-if="alerts.length" :alerts="alerts" />
      <CurrentConditions
        :current="forecast.current"
        :place="location.type === 'current' ? null : forecast.place"
        :subtitle="location.type === 'current' ? locality : ''"
      />
      <PrecipNowcast
        v-if="forecast.minutely.length"
        :minutely="forecast.minutely"
        @radar="radarOpen = true"
      />
      <HourlyForecast :hourly="forecast.hourly" :now="forecast.current.time" />
      <DailyForecast :daily="forecast.daily" />

      <button v-if="isSaved" class="remove" @click="emit('remove', location.id)">
        <Icon name="trash" />
        Remove location
      </button>
    </template>

    <RadarView
      v-if="radarOpen && coords"
      :latitude="coords.latitude"
      :longitude="coords.longitude"
      :title="radarTitle"
      @close="radarOpen = false"
    />
  </WeatherScene>
</template>

<style scoped>
.status {
  text-align: center;
  color: var(--scene-text-muted);
  padding: 60px 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
}

.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: var(--scene-text);
  animation: spin 0.8s linear infinite;
}

.loading-text {
  color: var(--scene-text-muted);
  font-size: 0.95rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: spin 1.6s steps(8) infinite;
  }
}

.error-state {
  text-align: center;
  padding: 56px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-msg {
  color: var(--scene-text);
  font-weight: 500;
}

.error-hint {
  color: var(--scene-text-muted);
  font-size: 0.9rem;
  margin-top: 8px;
  max-width: 30ch;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

/* Standalone button (non-current error) needs its own spacing. */
.error-state > .pill {
  margin-top: 20px;
}

.pill,
.remove {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 8px 20px;
}

/* Primary action stands out; ghost is the quieter secondary. */
.pill.primary {
  background: rgba(255, 255, 255, 0.9);
  border-color: transparent;
  color: #14203a;
  font-weight: 600;
}

.pill.ghost {
  background: rgba(255, 255, 255, 0.12);
}

.remove {
  align-self: center;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--scene-text-muted);
  font-size: 0.85rem;
}

.remove :deep(.icon) {
  font-size: 1rem;
}
</style>
