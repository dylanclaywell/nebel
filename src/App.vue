<script setup>
import { ref } from 'vue'

const appName = ref('Nebel')
</script>

<template>
  <header class="app-header">
    <h1>{{ appName }}</h1>
    <p class="tagline">Weather, quietly.</p>
  </header>

  <main>
    <p class="placeholder">
      Scaffold is live. Weather cards, saved locations, and settings land next.
    </p>
  </main>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: var(--gap);
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tagline {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.placeholder {
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
}
</style>
