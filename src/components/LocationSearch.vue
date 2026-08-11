<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { geocode } from '../api/openMeteo.js'
import Icon from './Icon.vue'

const emit = defineEmits(['add', 'close'])

const query = ref('')
const results = ref([])
const searching = ref(false)
const inputEl = ref(null)
let debounce = null

watch(query, (q) => {
  clearTimeout(debounce)
  const term = q.trim()
  if (term.length < 2) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  debounce = setTimeout(async () => {
    try {
      results.value = await geocode(term)
    } catch {
      results.value = []
    } finally {
      searching.value = false
    }
  }, 300)
})

function resultLabel(r) {
  return [r.name, r.admin1, r.country].filter(Boolean).join(', ')
}

function choose(r) {
  emit('add', r)
}

onMounted(() => inputEl.value?.focus())
onBeforeUnmount(() => clearTimeout(debounce))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-head">
        <div class="field">
          <Icon name="search" class="search-ico" />
          <input
            ref="inputEl"
            v-model="query"
            type="search"
            placeholder="Search city…"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>
        <button class="cancel" @click="emit('close')">Cancel</button>
      </div>

      <ul class="results">
        <li v-if="searching" class="hint">Searching…</li>
        <li
          v-else-if="query.trim().length >= 2 && !results.length"
          class="hint"
        >
          No matches.
        </li>
        <li
          v-for="r in results"
          :key="r.id"
          class="result"
          @click="choose(r)"
        >
          {{ resultLabel(r) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(4, 8, 18, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: calc(env(safe-area-inset-top) + 24px) 16px 16px;
}

.sheet {
  width: 100%;
  max-width: 520px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.sheet-head {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.field {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-ico {
  position: absolute;
  left: 12px;
  font-size: 18px;
  color: var(--text-muted);
  pointer-events: none;
}

input {
  flex: 1;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px 10px 38px;
  color: var(--text);
  font-size: 1rem;
}

input::placeholder {
  color: var(--text-muted);
}

.cancel {
  background: none;
  border: none;
  color: var(--accent);
  padding: 0 6px;
}

.results {
  list-style: none;
  max-height: 60vh;
  overflow-y: auto;
}

.result {
  padding: 14px 16px;
  border-top: 1px solid var(--border);
  cursor: pointer;
}

.result:hover {
  background: var(--surface);
}

.hint {
  padding: 16px;
  color: var(--text-muted);
  text-align: center;
}
</style>
