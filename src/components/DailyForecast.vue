<script setup>
const props = defineProps({
  daily: { type: Array, required: true },
})

const dayLabel = (dateStr, index) => {
  if (index === 0) return 'Today'
  // dateStr is YYYY-MM-DD (local to the forecast timezone).
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}
</script>

<template>
  <section class="daily">
    <h2 class="section-title">7-Day Forecast</h2>
    <ul>
      <li v-for="(day, i) in daily" :key="day.date" class="row">
        <span class="day">{{ dayLabel(day.date, i) }}</span>
        <span class="icon" :title="day.weather.label" aria-hidden="true">
          {{ day.weather.icon }}
        </span>
        <span class="precip" :class="{ dry: !day.precipProbability }">
          {{ day.precipProbability ? day.precipProbability + '%' : '' }}
        </span>
        <span class="range">
          <span class="lo">{{ day.tempMin }}°</span>
          <span class="hi">{{ day.tempMax }}°</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.daily {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius);
  padding: 8px 16px;
  backdrop-filter: blur(8px);
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--scene-text-muted);
  padding: 8px 0;
}

ul {
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 3.2rem 1.6rem 2.8rem 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.row:first-child {
  border-top: none;
}

.day {
  font-weight: 600;
}

.icon {
  font-size: 1.25rem;
  text-align: center;
}

.precip {
  font-size: 0.8rem;
  color: #bfe0ff;
  text-align: right;
}

.precip.dry {
  color: transparent;
}

.range {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.lo {
  color: var(--scene-text-muted);
}

.hi {
  font-weight: 600;
}
</style>
