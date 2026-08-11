<script setup>
import { onMounted, computed } from 'vue'
import WeatherScene from './components/WeatherScene.vue'
import CurrentConditions from './components/CurrentConditions.vue'
import DailyForecast from './components/DailyForecast.vue'
import { useForecast } from './composables/useForecast.js'
import { getCurrentPosition } from './composables/useGeolocation.js'
import { PALETTE } from './data/weatherCodes.js'

// Shown while loading or if everything fails.
const NEUTRAL_SWATCH = PALETTE.cloudy.night

// Fallback location if geolocation is unavailable or denied.
const FALLBACK = {
  latitude: 39.16533,
  longitude: -86.52639,
  place: { name: 'Bloomington', admin1: 'Indiana', country: 'United States' },
}

const { forecast, loading, error, load } = useForecast()

const swatch = computed(
  () => forecast.value?.current.weather.swatch ?? NEUTRAL_SWATCH,
)

async function loadCurrentLocation() {
  try {
    const { latitude, longitude } = await getCurrentPosition()
    await load({ latitude, longitude })
  } catch {
    // Geolocation denied/unavailable — fall back to a default city.
    await load(FALLBACK)
  }
}

onMounted(loadCurrentLocation)
</script>

<template>
  <WeatherScene :swatch="swatch">
    <header class="bar">
      <h1>Nebel</h1>
      <button class="refresh" :disabled="loading" @click="loadCurrentLocation">
        {{ loading ? '…' : '↻' }}
      </button>
    </header>

    <p v-if="loading && !forecast" class="status">Loading weather…</p>

    <p v-else-if="error && !forecast" class="status">
      {{ error }}
      <button class="retry" @click="loadCurrentLocation">Retry</button>
    </p>

    <template v-else-if="forecast">
      <CurrentConditions :current="forecast.current" :place="forecast.place" />
      <DailyForecast :daily="forecast.daily" />
    </template>
  </WeatherScene>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.refresh {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.1rem;
  display: grid;
  place-items: center;
}

.refresh:disabled {
  opacity: 0.6;
}

.status {
  text-align: center;
  color: var(--scene-text-muted);
  padding: 40px 0;
}

.retry {
  display: block;
  margin: 16px auto 0;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 8px 20px;
}
</style>
