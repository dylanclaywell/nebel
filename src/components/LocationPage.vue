<script setup>
import { onMounted, computed, ref } from 'vue'
import WeatherScene from './WeatherScene.vue'
import Icon from './Icon.vue'
import AlertBanner from './AlertBanner.vue'
import CurrentConditions from './CurrentConditions.vue'
import HourlyForecast from './HourlyForecast.vue'
import DailyForecast from './DailyForecast.vue'
import { useForecast } from '../composables/useForecast.js'
import { getCurrentPosition } from '../composables/useGeolocation.js'
import { reverseGeocode } from '../api/reverseGeocode.js'
import { fetchAlerts } from '../api/nwsAlerts.js'
import { PALETTE } from '../data/weatherCodes.js'

const props = defineProps({
  // A page descriptor from useLocations().pages
  location: { type: Object, required: true },
})

const emit = defineEmits(['remove'])

const NEUTRAL_SWATCH = PALETTE.cloudy.night

const { forecast, loading, error, load } = useForecast()

// Resolved place name for the current-location page (reverse-geocoded).
const locality = ref('')

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

async function refresh() {
  if (props.location.type === 'current') {
    try {
      const { latitude, longitude } = await getCurrentPosition()
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
}

onMounted(refresh)
</script>

<template>
  <WeatherScene :swatch="swatch">
    <p v-if="loading && !forecast" class="status">Loading weather…</p>

    <p v-else-if="error && !forecast" class="status">
      {{ error }}
      <button class="pill" @click="refresh">Retry</button>
    </p>

    <template v-else-if="forecast">
      <AlertBanner v-if="alerts.length" :alerts="alerts" />
      <CurrentConditions
        :current="forecast.current"
        :place="location.type === 'current' ? null : forecast.place"
        :subtitle="location.type === 'current' ? locality : ''"
      />
      <HourlyForecast :hourly="forecast.hourly" :now="forecast.current.time" />
      <DailyForecast :daily="forecast.daily" />

      <button v-if="isSaved" class="remove" @click="emit('remove', location.id)">
        <Icon name="trash" />
        Remove location
      </button>
    </template>
  </WeatherScene>
</template>

<style scoped>
.status {
  text-align: center;
  color: var(--scene-text-muted);
  padding: 60px 0;
}

.pill,
.remove {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 8px 20px;
}

.pill {
  display: block;
  margin: 16px auto 0;
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
