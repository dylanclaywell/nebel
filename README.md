# Nebel

A free, minimal weather experience — a **Scriptable iOS widget** plus a
companion **PWA** — powered by the [Open-Meteo](https://open-meteo.com/) API.

Built as a lighter, nicer alternative to the default iOS weather app.

## Parts

- **PWA** (`/src`) — Vue 3 + Vite, deployed to Cloudflare Pages. Installable,
  works offline, shows current conditions and forecast for saved locations plus
  your current location.
- **Widget** (`/widget`) — a standalone Scriptable script that renders weather
  on the iOS home screen and opens the PWA on tap.

Both talk to Open-Meteo directly; no API key or account required.

## Development

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build to /dist
npm run preview  # preview the production build locally
```

## Stack

| Concern   | Choice                         |
| --------- | ------------------------------ |
| Framework | Vue 3 (`<script setup>` SFCs)  |
| Build     | Vite                           |
| Hosting   | Cloudflare Pages               |
| Data      | Open-Meteo (forecast + geocode)|
| Widget    | Scriptable (iOS)               |

## Status

Early scaffold. See commit history for progress.
