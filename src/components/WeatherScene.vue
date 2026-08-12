<script setup>
import { ref, computed, watch } from 'vue'

// Paints the full-bleed condition gradient and exposes the active swatch as CSS
// custom properties (--scene-text, --scene-text-muted, --scene-accent) so child
// components inherit the right foreground colors for day/night automatically.
// Also owns pull-to-refresh for its page.
const props = defineProps({
  swatch: { type: Object, required: true },
  refreshing: { type: Boolean, default: false },
})
const emit = defineEmits(['refresh'])

const sceneStyle = computed(() => ({
  background: `linear-gradient(160deg, ${props.swatch.from} 0%, ${props.swatch.to} 100%)`,
  color: props.swatch.text,
  '--scene-text': props.swatch.text,
  '--scene-text-muted': props.swatch.textMuted,
  '--scene-accent': props.swatch.accent,
}))

// --- pull to refresh ---
const THRESHOLD = 64 // pull past this to trigger a refresh
const MAX = 100 // max visual pull
const RESIST = 0.5 // drag-to-pixels damping
const HOLD = 56 // spinner height held while refreshing

const sceneEl = ref(null)
const pullY = ref(0)
const dragging = ref(false)
let startX = 0
let startY = 0

function onStart(e) {
  if (props.refreshing || e.touches.length !== 1) return
  if (sceneEl.value && sceneEl.value.scrollTop <= 0) {
    dragging.value = true
    startY = e.touches[0].clientY
    startX = e.touches[0].clientX
  }
}

function onMove(e) {
  if (!dragging.value || props.refreshing) return
  const t = e.touches[0]
  const dy = t.clientY - startY
  const dx = t.clientX - startX
  // Horizontal-dominant gesture → let the pager handle the page swipe.
  if (Math.abs(dx) > Math.abs(dy)) {
    dragging.value = false
    pullY.value = 0
    return
  }
  if (dy <= 0 || (sceneEl.value && sceneEl.value.scrollTop > 0)) {
    pullY.value = 0
    return
  }
  pullY.value = Math.min(MAX, dy * RESIST)
  if (pullY.value > 0 && e.cancelable) e.preventDefault()
}

function onEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (pullY.value >= THRESHOLD && !props.refreshing) {
    emit('refresh') // parent flips `refreshing`, which pins the spinner
  } else {
    pullY.value = 0
  }
}

// Pin the spinner open while refreshing, spring back when done.
watch(
  () => props.refreshing,
  (r) => {
    pullY.value = r ? HOLD : 0
  },
)

const offsetStyle = computed(() => ({ transform: `translateY(${pullY.value}px)` }))
const indicatorStyle = computed(() => ({
  transform: 'translateX(-50%)',
  opacity: props.refreshing ? 1 : Math.min(1, pullY.value / THRESHOLD),
}))
const spinStyle = computed(() =>
  props.refreshing ? {} : { transform: `rotate(${pullY.value * 4}deg)` },
)
</script>

<template>
  <div
    ref="sceneEl"
    class="scene"
    :style="sceneStyle"
    @touchstart.passive="onStart"
    @touchmove="onMove"
    @touchend="onEnd"
    @touchcancel="onEnd"
  >
    <div
      class="pull-indicator"
      :class="{ snap: !dragging }"
      :style="indicatorStyle"
      aria-hidden="true"
    >
      <span class="pull-spinner" :class="{ spin: refreshing }" :style="spinStyle"></span>
    </div>

    <div class="bloom" aria-hidden="true"></div>
    <div class="scene-inner" :class="{ snap: !dragging }" :style="offsetStyle">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  transition: background 600ms ease;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Sits below the frosted topbar with a gap; revealed as content is pulled down. */
.pull-indicator {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 82px);
  left: 50%;
  z-index: 2;
  pointer-events: none;
}
.pull-indicator.snap {
  transition: opacity 250ms ease;
}

.pull-spinner {
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--scene-text);
}
.pull-spinner.spin {
  animation: pull-spin 0.8s linear infinite;
}
@keyframes pull-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pull-spinner.spin {
    animation-timing-function: steps(8);
    animation-duration: 1.6s;
  }
}

.bloom {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  pointer-events: none;
  background: radial-gradient(
    130% 100% at 50% 0%,
    rgba(255, 255, 255, 0.18),
    transparent 65%
  );
}

.scene-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
  /* Top clears the fixed topbar (title / dots / add button) that floats above. */
  padding: 64px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}
.scene-inner.snap {
  transition: transform 300ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
</style>
