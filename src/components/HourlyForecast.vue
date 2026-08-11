<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import WeatherIcon from './WeatherIcon.vue'

const props = defineProps({
  hourly: { type: Array, required: true },
  now: { type: String, required: true },
  hours: { type: Number, default: 24 },
})

// Start at the current hour and take the next N.
const cells = computed(() => {
  const key = props.now.slice(0, 13)
  let start = props.hourly.findIndex((h) => h.time.slice(0, 13) === key)
  if (start < 0) start = 0
  return props.hourly.slice(start, start + props.hours)
})

// Edge-fade affordances: show left once scrolled, right while more remains.
const trackEl = ref(null)
const atStart = ref(true)
const atEnd = ref(true)

function updateEdges() {
  const el = trackEl.value
  if (!el) return
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
}

// Softly dissolve the content at whichever edge has more to scroll toward.
const FADE = 26
const maskStyle = computed(() => {
  if (atStart.value && atEnd.value) return {}
  const l = atStart.value ? 0 : FADE
  const r = atEnd.value ? 0 : FADE
  const g = `linear-gradient(to right, transparent 0, #000 ${l}px, #000 calc(100% - ${r}px), transparent 100%)`
  return { maskImage: g, WebkitMaskImage: g }
})

onMounted(() => {
  updateEdges()
  window.addEventListener('resize', updateEdges)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateEdges))
watch(cells, () => nextTick(updateEdges))

function hourLabel(time, i) {
  if (i === 0) return 'Now'
  // time is a timezone-naive local string ("YYYY-MM-DDTHH:mm"); read the hour
  // straight off it so no timezone conversion can shift it.
  let h = parseInt(time.slice(11, 13), 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}${ampm}`
}
</script>

<template>
  <section class="hourly frost">
    <h2 class="section-title">Hourly</h2>
    <div
      ref="trackEl"
      class="track"
      :style="maskStyle"
      @scroll.passive="updateEdges"
    >
      <div v-for="(h, i) in cells" :key="h.time" class="cell">
        <span class="hr">{{ hourLabel(h.time, i) }}</span>
        <WeatherIcon class="ico" :name="h.weather.meteoconsName" />
        <span class="pp" :class="{ dry: !h.precipProbability }">
          {{ h.precipProbability ? h.precipProbability + '%' : '' }}
        </span>
        <span class="t">{{ h.temperature }}°</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hourly {
  padding: 12px 6px 14px;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--scene-text-muted);
  padding: 4px 10px 10px;
}

/* Content is softly masked to transparent at scrollable edges (see maskStyle). */
.track {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
}

.track::-webkit-scrollbar {
  display: none;
}

.cell {
  flex: 0 0 auto;
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  scroll-snap-align: start;
}

.hr {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--scene-text);
}

.ico {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}

.pp {
  font-size: 0.68rem;
  color: #bfe0ff;
  min-height: 0.9em;
}

.pp.dry {
  color: transparent;
}

.t {
  font-size: 0.9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--scene-text);
}
</style>
