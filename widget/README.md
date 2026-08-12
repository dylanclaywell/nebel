# Nebel — Scriptable widget

A standalone iOS home-screen weather widget powered by Open-Meteo, matching the
Nebel PWA's condition-driven gradients. Small + Medium.

## Install

1. Install [Scriptable](https://scriptable.app) from the App Store.
2. Open Scriptable → **+** → paste the contents of `nebel-widget.js` → name it
   "Nebel".
3. On the home screen, add a **Scriptable** widget (Small or Medium).
4. Long-press it → **Edit Widget** → set **Script** to "Nebel".

## Location (widget parameter)

Long-press the widget → **Edit Widget** → **Parameter**:

| Parameter        | Behavior                          |
| ---------------- | --------------------------------- |
| _(empty)_        | Current location (GPS)            |
| `Chicago`        | A place name (geocoded)           |
| `40.05,-86.01`   | Explicit `lat,lon`                |

Pin different locations by adding multiple widgets with different parameters.

## Preview on your computer

You can preview the widget in a browser without an iPhone:

```bash
npm run build:widget-preview   # regenerate after changing the widget
```

Then open `widget/preview.html` in a browser. It runs the **real** `nebel-widget.js`
through a small Scriptable API shim and draws the Small + Medium widgets at true
sizes, with live data. Leave the location box blank for GPS (falls back to a
default if denied), or type a city / `lat,lon`.

It's a close approximation of Scriptable's layout, not pixel-perfect — treat it as
a fast iteration loop; the phone is the source of truth.

## Notes

- Tapping the widget opens the PWA (`CONFIG.pwaUrl` — currently a placeholder;
  update it once the PWA is deployed).
- Units and refresh interval are in the `CONFIG` block at the top of the script.
- Weather icons are the PWA's glass icons, pre-rasterized to PNG and embedded as
  base64 (`npm run build:widget`, via `scripts/build-widget.mjs`). SF Symbols are
  the fallback if an icon is missing.
