<script setup>
import { computed } from 'vue'
import { UI_ICONS } from '../data/uiIcons.js'

// Decorative by default — give the surrounding button/control the accessible
// name. Sized via CSS `width`/`height` (or font-size) on the .icon element;
// tinted via `color`.
const props = defineProps({
  name: { type: String, required: true },
})

const svg = computed(() => UI_ICONS[props.name] ?? '')
</script>

<template>
  <span class="icon" aria-hidden="true" v-html="svg" />
</template>

<style scoped>
.icon {
  display: inline-grid;
  place-items: center;
  width: 1em;
  height: 1em;
  /* No `color` here on purpose: color inherits by default, and setting it
     explicitly would override a consumer's tint class (e.g. the amber alert). */
}

.icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
