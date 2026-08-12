# Deploying Nebel to Cloudflare Pages

The PWA is a static Vite build (no server/Functions), deployed from GitHub via
Cloudflare Pages. Every push to `main` redeploys automatically.

## One-time setup

1. In the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages**
   → **Create** → **Pages** → **Connect to Git**.
2. Pick the `dylanclaywell/nebel` repo.
3. Build settings:

   | Setting              | Value            |
   | -------------------- | ---------------- |
   | Framework preset     | None (or Vite)   |
   | Build command        | `npm run build`  |
   | Build output directory | `dist`         |
   | Root directory       | `/` (default)    |

   Node version is pinned by `.nvmrc` (22). If needed, also set a `NODE_VERSION`
   environment variable to `22`.
4. **Save and Deploy.** Cloudflare installs deps, runs the build, and publishes
   `dist/`.

The project name you choose determines the URL: `<project-name>.pages.dev`
(globally unique, so you may get a suffix if `nebel` is taken).

## Deploy URL

Live at **https://nebel-brd.pages.dev** (Cloudflare appended `-brd` because the
bare `nebel` subdomain was taken). This URL is baked into:

- `index.html` — canonical + Open Graph + Twitter tags
- `widget/nebel-widget.js` — `CONFIG.pwaUrl` (the widget's tap target)

If you move to a **custom domain**, find/replace `https://nebel-brd.pages.dev` in
those files, then commit + push.

## Notes

- **Auto-deploy:** pushing to `main` triggers a new build + deploy.
- **Routing:** Nebel is a single page with no client-side routes, so it needs no
  SPA fallback (a `/* /index.html 200` redirect trips Cloudflare's loop check —
  don't add one). If routes are ever added, use the project's built-in
  single-page-application handling rather than a catch-all redirect.
- **Caching:** `public/_headers` marks fingerprinted `/assets/*` immutable and
  keeps `sw.js` / `index.html` / the manifest revalidating so PWA updates reach
  users promptly.
- **Custom domain:** add it under the Pages project → **Custom domains**; then
  update the placeholder URL to the custom domain too.
- The `build:icons` / `build:widget` steps are **not** part of `npm run build` —
  their outputs are committed, so the Cloudflare build only runs Vite.
