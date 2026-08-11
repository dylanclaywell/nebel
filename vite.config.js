import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Cloudflare Pages serves from the root, so the default base ("/") is correct.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
})
