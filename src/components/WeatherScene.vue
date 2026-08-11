<script setup>
import { computed } from 'vue'

// Paints the full-bleed condition gradient and exposes the active swatch as CSS
// custom properties (--scene-text, --scene-text-muted, --scene-accent) so child
// components inherit the right foreground colors for day/night automatically.
const props = defineProps({
  swatch: { type: Object, required: true },
})

const sceneStyle = computed(() => ({
  background: `linear-gradient(160deg, ${props.swatch.from} 0%, ${props.swatch.to} 100%)`,
  color: props.swatch.text,
  '--scene-text': props.swatch.text,
  '--scene-text-muted': props.swatch.textMuted,
  '--scene-accent': props.swatch.accent,
}))
</script>

<template>
  <div class="scene" :style="sceneStyle">
    <div class="scene-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  transition: background 600ms ease;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.scene-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}
</style>
