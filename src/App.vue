<script setup>
import { ref, nextTick } from 'vue'
import LocationPage from './components/LocationPage.vue'
import LocationSearch from './components/LocationSearch.vue'
import Icon from './components/Icon.vue'
import { useLocations } from './composables/useLocations.js'

const { pages, add, remove } = useLocations()

const pager = ref(null)
const activeIndex = ref(0)
const searchOpen = ref(false)

function onScroll() {
  const el = pager.value
  if (!el) return
  activeIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}

function scrollToPage(index) {
  const el = pager.value
  if (!el) return
  el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
}

async function handleAdd(place) {
  add(place)
  searchOpen.value = false
  await nextTick()
  // Jump to the newly added page (last in the list).
  scrollToPage(pages.value.length - 1)
}

function handleRemove(id) {
  const removedIndex = pages.value.findIndex((p) => p.id === id)
  remove(id)
  if (activeIndex.value >= pages.value.length) {
    activeIndex.value = pages.value.length - 1
  } else if (removedIndex <= activeIndex.value && activeIndex.value > 0) {
    activeIndex.value -= 1
  }
  nextTick(() => scrollToPage(activeIndex.value))
}
</script>

<template>
  <div class="app">
    <div ref="pager" class="pager" @scroll.passive="onScroll">
      <section v-for="page in pages" :key="page.id" class="page">
        <LocationPage :location="page" @remove="handleRemove" @add="searchOpen = true" />
      </section>
    </div>

    <header class="topbar">
      <h1>Nebel</h1>

      <nav class="dots" aria-label="Locations">
        <button
          v-for="(page, i) in pages"
          :key="page.id"
          class="dot"
          :class="{ active: i === activeIndex, current: page.type === 'current' }"
          :aria-label="page.name"
          @click="scrollToPage(i)"
        />
      </nav>

      <button class="add" aria-label="Add location" @click="searchOpen = true">
        <Icon name="plus" />
      </button>
    </header>

    <LocationSearch
      v-if="searchOpen"
      @add="handleAdd"
      @close="searchOpen = false"
    />
  </div>
</template>

<style scoped>
.app {
  position: fixed;
  inset: 0;
}

.pager {
  display: flex;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.pager::-webkit-scrollbar {
  display: none;
}

.page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
}

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(env(safe-area-inset-top) + 11px) 18px 11px;
  /* Frosted nav bar — blurs the content scrolling beneath it. */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px) saturate(1.1);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 1px 12px -8px rgba(0, 0, 0, 0.4);
  /* Empty areas stay click-through so a swipe can start under the bar. */
  pointer-events: none;
}

.topbar > * {
  pointer-events: auto;
}

h1 {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dots {
  display: flex;
  gap: 7px;
  align-items: center;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: rgba(255, 255, 255, 0.4);
  transition: background 200ms;
}

.dot.active {
  background: #fff;
}

.dot.current {
  position: relative;
}

/* Small ring marks the current-location dot. */
.dot.current::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.add {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #fff;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  font-size: 1.3rem;
  line-height: 1;
  display: grid;
  place-items: center;
}
</style>
