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

## Notes

- Tapping the widget opens the PWA (`CONFIG.pwaUrl` — currently a placeholder;
  update it once the PWA is deployed).
- Units and refresh interval are in the `CONFIG` block at the top of the script.
- Icons are SF Symbols for now; a later version swaps in the PWA's glass icons
  (pre-rasterized and embedded).
