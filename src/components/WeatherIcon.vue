<script>
// Module-scoped so it increments once per instance (script setup runs per
// instance and would otherwise reset it every time).
let counter = 0
</script>

<script setup>
import { computed } from 'vue'
import { WEATHER_ICONS } from '../data/weatherIcons.generated.js'

const props = defineProps({
  // Resolved Meteocons name, e.g. weather.meteoconsName
  name: { type: String, required: true },
})

// Unique per mounted instance so repeated icons (e.g. the daily list) never
// share gradient/mask ids.
const uid = `wi${counter++}`

const svg = computed(() => {
  const tpl = WEATHER_ICONS[props.name] ?? WEATHER_ICONS.overcast
  return tpl.replaceAll('__UID__', uid)
})
</script>

<template>
  <span class="weather-icon" role="img" :aria-label="name" v-html="svg" />
</template>

<style scoped>
.weather-icon {
  display: inline-grid;
  place-items: center;
  width: 100%;
  height: 100%;
}

.weather-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
