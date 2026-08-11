<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon.vue'

const props = defineProps({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  title: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const STYLE_KEY = 'nebel.radarStyle'
const baseStyle = ref(loadStyle())

const mapEl = ref(null)
let map = null
let baseLayer = null

function loadStyle() {
  try {
    return localStorage.getItem(STYLE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function baseUrl(style) {
  const name = style === 'light' ? 'light_all' : 'dark_all'
  return `https://{s}.basemaps.cartocdn.com/${name}/{z}/{x}/{y}{r}.png`
}

function setBase(style) {
  if (baseLayer) baseLayer.remove()
  baseLayer = L.tileLayer(baseUrl(style), {
    subdomains: 'abcd',
    maxZoom: 19,
    detectRetina: true,
  }).addTo(map)
}

function toggleStyle() {
  baseStyle.value = baseStyle.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(STYLE_KEY, baseStyle.value)
  } catch {
    // ignore storage failures
  }
  setBase(baseStyle.value)
}

onMounted(() => {
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView([props.latitude, props.longitude], 8)

  setBase(baseStyle.value)

  // Mark the location.
  L.circleMarker([props.latitude, props.longitude], {
    radius: 6,
    color: '#ffffff',
    weight: 2,
    fillColor: '#7fb4ff',
    fillOpacity: 1,
  }).addTo(map)

  // Guard against a zero-size container at init (teleport/transition timing).
  requestAnimationFrame(() => map && map.invalidateSize())
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div class="radar" :class="`base-${baseStyle}`">
      <div ref="mapEl" class="map"></div>

      <div class="bar">
        <button class="ctl" aria-label="Close radar" @click="emit('close')">
          <Icon name="close" />
        </button>
        <span v-if="title" class="title">{{ title }}</span>
        <button
          class="ctl toggle"
          :aria-label="baseStyle === 'dark' ? 'Switch to light map' : 'Switch to dark map'"
          @click="toggleStyle"
        >
          <Icon :name="baseStyle === 'dark' ? 'sun' : 'moon'" />
        </button>
      </div>

      <p class="attr">© OpenStreetMap · © CARTO</p>
    </div>
  </Teleport>
</template>

<style scoped>
.radar {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #0e1116;
}

.map {
  position: absolute;
  inset: 0;
  /* Own stacking context so Leaflet's internal panes don't paint over the
     header controls below. */
  z-index: 0;
}

/* Tile-loading background per base style (avoids a mismatched flash). */
.base-dark .map {
  background: #0e1116;
}
.base-light .map {
  background: #e8ecf0;
}

.bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(env(safe-area-inset-top) + 12px) 16px 20px;
  /* Soft scrim keeps the controls legible over any map content. */
  background: linear-gradient(to bottom, rgba(10, 13, 18, 0.7), transparent);
  pointer-events: none;
}
.bar > * {
  pointer-events: auto;
}

.ctl {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(20, 26, 36, 0.55);
  color: #fff;
  font-size: 20px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.toggle {
  margin-left: auto;
}

.title {
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.attr {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom) + 6px);
  right: 8px;
  z-index: 10;
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(14, 17, 22, 0.5);
  padding: 2px 6px;
  border-radius: 6px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
</style>

<style>
/* Global (Leaflet renders its own DOM): inherit the app font. Background is
   set per base style on .map above. */
.leaflet-container {
  font-family: inherit;
}
</style>
