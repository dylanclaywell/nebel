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

    <div class="hero">
      <WeatherIcon class="icon" :name="current.weather.meteoconsName" />
      <span class="temp">{{ current.temperature }}°</span>
    </div>

    <p class="summary">{{ current.weather.label }}</p>
    <p class="feels">Feels like {{ current.apparentTemperature }}°</p>

    <dl class="stats">
      <div>
        <dt>Wind</dt>
        <dd>{{ current.windSpeed }} {{ current.units.windSpeed }}</dd>
      </div>
      <div>
        <dt>Humidity</dt>
        <dd>{{ current.humidity }}%</dd>
      </div>
      <div>
        <dt>Precip</dt>
        <dd>{{ current.precipitation }} {{ current.units.precipitation }}</dd>
      </div>
    </dl>
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

.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 4px 0;
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
  font-weight: 200;
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
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-top: 20px;
}

.stats dt {
  color: var(--scene-text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stats dd {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 2px;
}
</style>
