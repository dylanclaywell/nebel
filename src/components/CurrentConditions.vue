<script setup>
import WeatherIcon from './WeatherIcon.vue'

const props = defineProps({
  current: { type: Object, required: true },
  place: { type: Object, default: null },
  // Smaller line under the place name (e.g. resolved locality for the
  // current-location page).
  subtitle: { type: String, default: '' },
})

const placeLabel = () => {
  const p = props.place
  if (!p) return 'Current Location'
  return [p.name, p.admin1].filter(Boolean).join(', ')
}
</script>

<template>
  <section class="current">
    <p class="place">{{ placeLabel() }}</p>
    <p v-if="subtitle" class="locality">{{ subtitle }}</p>

    <div class="card frost">
      <div class="hero">
        <WeatherIcon class="icon" :name="current.weather.meteoconsName" />
        <span class="temp">{{ current.temperature }}°</span>
      </div>

      <p class="summary">{{ current.weather.label }}</p>
      <p class="feels">Feels like {{ current.apparentTemperature }}°</p>

      <dl class="stats">
        <div class="stat frost-chip">
          <dt>Wind</dt>
          <dd>{{ current.windSpeed }} {{ current.units.windSpeed }}</dd>
        </div>
        <div class="stat frost-chip">
          <dt>Humidity</dt>
          <dd>{{ current.humidity }}%</dd>
        </div>
        <div class="stat frost-chip">
          <dt>Precip</dt>
          <dd>{{ current.precipitation }} {{ current.units.precipitation }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.current {
  text-align: center;
  padding: 8px 0 24px;
}

.place {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.locality {
  color: var(--scene-text-muted);
  font-size: 0.85rem;
  margin-top: 1px;
}

.card {
  margin-top: 16px;
  padding: 20px 18px 18px;
  text-align: center;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.icon {
  width: 88px;
  height: 88px;
  flex: 0 0 auto;
  /* grounding shadow for the Liquid + Depth glass hero */
  filter: drop-shadow(0 6px 13px rgba(0, 0, 0, 0.35));
}

.temp {
  font-size: 5rem;
  font-weight: 300;
  letter-spacing: -0.03em;
}

.summary {
  font-size: 1.2rem;
  font-weight: 500;
}

.feels {
  color: var(--scene-text-muted);
  font-size: 0.95rem;
  margin-top: 2px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 18px;
}

.stat {
  padding: 10px 6px;
}

.stats dt {
  color: var(--scene-text-muted);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stats dd {
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: 3px;
}
</style>
