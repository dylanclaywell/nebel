<script setup>
import { ref } from 'vue'
import Icon from './Icon.vue'

defineProps({
  alerts: { type: Array, required: true },
})

// Which alert is expanded to show its full description.
const openId = ref(null)
const toggle = (id) => (openId.value = openId.value === id ? null : id)

const sevClass = (sev) => `sev-${(sev || 'Unknown').toLowerCase()}`

// Height-based expand/collapse so the reveal animates smoothly (transitioning
// to `auto` isn't possible in CSS alone). Honors reduced-motion.
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function onEnter(el, done) {
  if (reduceMotion) return done()
  el.style.height = '0'
  el.style.opacity = '0'
  void el.offsetHeight // force reflow so the start values take
  el.style.transition = 'height 260ms ease, opacity 220ms ease'
  el.style.height = `${el.scrollHeight}px`
  el.style.opacity = '1'
  el.addEventListener('transitionend', function end(e) {
    if (e.propertyName !== 'height') return
    el.style.height = el.style.opacity = el.style.transition = ''
    el.removeEventListener('transitionend', end)
    done()
  })
}

function onLeave(el, done) {
  if (reduceMotion) return done()
  el.style.height = `${el.scrollHeight}px`
  void el.offsetHeight
  el.style.transition = 'height 220ms ease, opacity 200ms ease'
  el.style.height = '0'
  el.style.opacity = '0'
  el.addEventListener('transitionend', function end(e) {
    if (e.propertyName !== 'height') return
    el.removeEventListener('transitionend', end)
    done()
  })
}
</script>

<template>
  <div class="alerts">
    <div v-for="a in alerts" :key="a.id" class="alert" :class="sevClass(a.severity)">
      <button
        class="head"
        :aria-expanded="openId === a.id"
        @click="toggle(a.id)"
      >
        <Icon name="warning" class="warn" />
        <span class="event">{{ a.event }}</span>
        <Icon name="caret-right" class="chev" :class="{ open: openId === a.id }" />
      </button>

      <Transition :css="false" @enter="onEnter" @leave="onLeave">
        <div v-if="openId === a.id" class="body">
          <p v-if="a.headline" class="headline">{{ a.headline }}</p>
          <p class="desc">{{ a.description }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert {
  color: #fff;
  border-radius: var(--radius);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px) saturate(1.1);
  -webkit-backdrop-filter: blur(12px) saturate(1.1);
  box-shadow: var(--frost-highlight), 0 10px 24px -14px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* Severity tints — saturated enough to read as a warning over any gradient. */
.sev-extreme {
  background: rgba(150, 22, 22, 0.62);
}
.sev-severe {
  background: rgba(178, 52, 12, 0.55);
}
.sev-moderate {
  background: rgba(166, 98, 6, 0.52);
}
.sev-minor {
  background: rgba(140, 112, 8, 0.5);
}
.sev-unknown {
  background: rgba(58, 68, 90, 0.55);
}

.head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: none;
  border: none;
  text-align: left;
}

/* Focus ring follows the banner (a light inset ring), not the app's blue accent. */
.head:focus {
  outline: none;
}
.head:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.85);
  outline-offset: -3px;
  border-radius: var(--radius);
}

.warn {
  font-size: 22px;
  flex: 0 0 auto;
  color: #ffd84a;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}

.event {
  flex: 1;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}

.chev {
  font-size: 1.2rem;
  flex: 0 0 auto;
  opacity: 0.8;
  transition: transform 200ms ease;
}
.chev.open {
  transform: rotate(90deg);
}

.body {
  padding: 0 14px 14px;
  overflow: hidden;
}

.headline {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.desc {
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  white-space: pre-line;
}
</style>
