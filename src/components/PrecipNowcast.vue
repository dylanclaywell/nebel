<script setup>
import { computed } from 'vue'
import { summarizeNowcast } from '../utils/nowcast.js'

const props = defineProps({
  minutely: { type: Array, required: true },
})

const summary = computed(() => summarizeNowcast(props.minutely))
</script>

<template>
  <section class="nowcast frost">
    <h2 class="section-title">Next 2 Hours</h2>
    <p class="summary">{{ summary.text }}</p>

    <template v-if="summary.hasPrecip">
      <div class="chart">
        <div
          v-for="(b, i) in summary.bars"
          :key="i"
          class="slot"
        >
          <div class="bar" :style="{ height: b.h + '%' }"></div>
        </div>
      </div>
      <div class="axis">
        <span>Now</span>
        <span>1 hr</span>
        <span>2 hr</span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.nowcast {
  padding: 12px 16px 14px;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--scene-text-muted);
  padding-bottom: 8px;
}

.summary {
  font-size: 1rem;
  font-weight: 500;
  color: var(--scene-text);
}

.chart {
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 44px;
}

.slot {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  min-height: 2px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(to top, #7fb6ee, #bfe0ff);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.axis {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.66rem;
  color: var(--scene-text-muted);
}
</style>
