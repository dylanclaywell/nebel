<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

// RainViewer radar loop
const RADAR_URL = 'https://api.rainviewer.com/public/weather-maps.json'
const RADAR_COLOR = 4 // color scheme: The Weather Channel (green→red)
const RADAR_OPACITY = 0.75
const FRAME_MS = 500

const frames = ref([]) // [{ time, path, forecast }]
const frameIndex = ref(0)
const playing = ref(false)
const radarLoading = ref(true)
const radarError = ref(false)

const mapEl = ref(null)
let map = null
let baseLayer = null
const radarLayers = [] // frame index -> tileLayer | undefined
let currentRadar = -1
let rvHost = ''
let timer = null

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
    zIndex: 1, // stay under the radar overlay
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

// --- radar frames ---

function tileUrl(path) {
  return `${rvHost}${path}/256/{z}/{x}/{y}/${RADAR_COLOR}/1_1.png`
}

// All frame layers are created up front (opacity 0) so their tiles preload;
// showing a frame is then just an opacity swap — no per-step loading flash.
function preloadFrames() {
  frames.value.forEach((f, i) => {
    radarLayers[i] = L.tileLayer(tileUrl(f.path), {
      tileSize: 256,
      opacity: 0,
      zIndex: 5,
      // RainViewer radar tiles only exist up to zoom 7; upscale beyond that
      // rather than requesting the "Zoom Level Unsupported" placeholder.
      maxNativeZoom: 7,
      maxZoom: 19,
    }).addTo(map)
  })
}

function showFrame(i) {
  const layer = radarLayers[i]
  if (!layer) return
  layer.setOpacity(RADAR_OPACITY)
  if (currentRadar >= 0 && currentRadar !== i && radarLayers[currentRadar]) {
    radarLayers[currentRadar].setOpacity(0)
  }
  currentRadar = i
}

async function loadRadar() {
  try {
    const res = await fetch(RADAR_URL)
    if (!res.ok) throw new Error(`radar http ${res.status}`)
    const data = await res.json()
    rvHost = data.host
    const past = (data.radar?.past ?? []).map((f) => ({ ...f, forecast: false }))
    const nowcast = (data.radar?.nowcast ?? []).map((f) => ({ ...f, forecast: true }))
    frames.value = [...past, ...nowcast]
    if (!frames.value.length) {
      radarError.value = true
      radarLoading.value = false
      return
    }

    // Start on the most recent observed frame ("now"); preload every frame.
    frameIndex.value = Math.max(0, past.length - 1)
    preloadFrames()

    // Reveal + play only once the opening frame's tiles are in, so the loop
    // starts clean while the rest keep preloading behind it.
    const begin = () => {
      if (!radarLoading.value) return
      radarLoading.value = false
      showFrame(frameIndex.value)
      play()
    }
    radarLayers[frameIndex.value].once('load', begin)
    setTimeout(begin, 3000) // fallback if 'load' is slow or never fires
  } catch {
    radarError.value = true
    radarLoading.value = false
  }
}

function step() {
  if (!frames.value.length) return
  frameIndex.value = (frameIndex.value + 1) % frames.value.length
  showFrame(frameIndex.value)
}
function play() {
  if (playing.value || !frames.value.length) return
  playing.value = true
  timer = setInterval(step, FRAME_MS)
}
function pause() {
  playing.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function togglePlay() {
  playing.value ? pause() : play()
}

function scrubTo(value) {
  pause()
  frameIndex.value = value
  showFrame(value)
}

const frameLabel = computed(() => {
  const f = frames.value[frameIndex.value]
  if (!f) return ''
  const t = new Date(f.time * 1000).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return f.forecast ? `${t} · forecast` : t
})

onMounted(() => {
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView([props.latitude, props.longitude], 7)

  setBase(baseStyle.value)

  // Mark the location (marker pane sits above the radar tiles).
  L.circleMarker([props.latitude, props.longitude], {
    radius: 6,
    color: '#ffffff',
    weight: 2,
    fillColor: '#7fb4ff',
    fillOpacity: 1,
  }).addTo(map)

  // Guard against a zero-size container at init (teleport/transition timing).
  requestAnimationFrame(() => map && map.invalidateSize())

  loadRadar()
})

onBeforeUnmount(() => {
  pause()
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

      <div class="dock">
        <div v-if="frames.length" class="controls">
          <button
            class="play"
            :aria-label="playing ? 'Pause' : 'Play'"
            @click="togglePlay"
          >
            <Icon :name="playing ? 'pause' : 'play'" />
          </button>
          <input
            class="scrub"
            type="range"
            min="0"
            :max="frames.length - 1"
            :value="frameIndex"
            aria-label="Radar time"
            @input="scrubTo(Number($event.target.value))"
          />
          <span class="ts">{{ frameLabel }}</span>
        </div>
        <p v-else-if="radarLoading" class="radar-msg">Loading radar…</p>
        <p v-else-if="radarError" class="radar-msg">Radar unavailable</p>

        <p class="attr">© OpenStreetMap · © CARTO · Radar © RainViewer</p>
      </div>
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

/* Bottom dock: playback controls + attribution over a soft up-scrim. */
.dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 14px calc(env(safe-area-inset-bottom) + 10px);
  background: linear-gradient(to top, rgba(10, 13, 18, 0.72), transparent);
  pointer-events: none;
}
.dock > * {
  pointer-events: auto;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(20, 26, 36, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.play {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 18px;
}

.scrub {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.28);
  outline: none;
}
.scrub::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}
.scrub::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border: none;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}

.ts {
  flex: 0 0 auto;
  min-width: 6.5em;
  text-align: right;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.radar-msg {
  align-self: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
  background: rgba(20, 26, 36, 0.55);
  padding: 6px 14px;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.attr {
  align-self: center;
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>

<style>
/* Global (Leaflet renders its own DOM): inherit the app font. Background is
   set per base style on .map above. */
.leaflet-container {
  font-family: inherit;
}
</style>
