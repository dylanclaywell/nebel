import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')

// The service worker is generated and registered by vite-plugin-pwa
// (registerType: 'autoUpdate'); no manual registration needed here.
