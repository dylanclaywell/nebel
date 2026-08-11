# Meteocons (vendored)

Weather icons from **[Meteocons](https://github.com/basmilius/weather-icons)** by
Bas Milius, licensed **MIT** (see `LICENSE`).

These are the unmodified `fill` static SVGs for the conditions Nebel uses. They
are the **source** — `scripts/build-weather-icons.mjs` reads them, bakes in the
"Liquid + Depth" treatment (intensified gradients + a glass gloss), and writes
the runtime module `src/data/weatherIcons.generated.js`.

To add or change an icon: drop the raw Meteocons SVG here, update the mapping in
`src/data/weatherCodes.js`, and run `npm run build:icons`.
