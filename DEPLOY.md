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

## After the first deploy: set the real URL

The app ships with a `https://nebel.pages.dev` **placeholder** in a few spots. If
your actual URL differs, replace it everywhere (all occurrences are identical):

- `index.html` — canonical + Open Graph + Twitter tags (5 lines, incl. the `TODO`)
- `widget/nebel-widget.js` — `CONFIG.pwaUrl` (the widget's tap target)

Find/replace `https://nebel.pages.dev` → your URL, then:

```bash
npm run build:widget   # re-embeds icons + refreshes the widget file
git add -A && git commit -m "chore: set deploy URL" && git push
```

(If the project *is* named `nebel` and that subdomain is free, the placeholder is
already correct — nothing to change.)

## Notes

- **Auto-deploy:** pushing to `main` triggers a new build + deploy.
- **SPA fallback:** `public/_redirects` (`/* /index.html 200`) serves the app for
  any path.
- **Caching:** `public/_headers` marks fingerprinted `/assets/*` immutable and
  keeps `sw.js` / `index.html` / the manifest revalidating so PWA updates reach
  users promptly.
- **Custom domain:** add it under the Pages project → **Custom domains**; then
  update the placeholder URL to the custom domain too.
- The `build:icons` / `build:widget` steps are **not** part of `npm run build` —
  their outputs are committed, so the Cloudflare build only runs Vite.
