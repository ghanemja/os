# Project conventions

Every project lives in its own top-level folder of this monorepo and is self-contained, so it can be split out into its own repository unchanged.

Each project folder must contain:

- `README.md` — what it is, install, usage examples, license line.
- `LICENSE` — **MIT** for code (`Copyright (c) 2026 ghanemja`), **CC0 1.0** for pure asset packs (asset packs that also ship code include both: `LICENSE` = CC0 for assets, `LICENSE-CODE` = MIT).
- `package.json` for anything JavaScript (`"type": "module"`, `"license"` field set, `"repository"` pointing at `https://github.com/ghanemja/<folder-name>`, `"test": "node --test"`).
- `.gitignore` (`node_modules/`, build output).
- Tests using the built-in `node:test` runner where there is code. `npm test` must pass.

Rules:

- **Zero runtime dependencies.** Node 18+ built-ins and browser APIs only. Dev dependencies are also avoided so `npm test` works with no install.
- SVG assets: `viewBox` set, no fixed width/height, `stroke="currentColor"` / `fill="currentColor"` so they inherit theme color, consistent stroke width within a pack, no embedded raster images.
- Asset packs ship an `index.html` gallery (single file, no build) where clicking an asset copies its SVG markup, plus a generated `manifest.json` listing assets.
- Keep the code small and readable. Prefer one file over many.

## Demo site (GitHub Pages)

Every library ships an immersive landing page, deployed to `https://ghanemja.github.io/<name>/`, modelled on [art-asset](https://ghanemja.github.io/art-asset/).

- `index.html` at the project root is the site. It imports the library by relative path (`./index.js` etc.), so the demo always runs the real code. No build step, no bundler, no CDN scripts; Google Fonts are fine.
- The page is a product page, not a test harness: sticky top bar (brand, section links, light/dark toggle, GitHub link), a hero that *is* a live demo, 3–5 interactive sections that show off distinct features, a "Get started" section with install + copy-able code, and a footer with license.
- Each library gets its own visual identity that fits what it does. Do not reuse one template look across libraries.
- Works at 360px wide (no horizontal scroll, 16px gutters), light and dark (`prefers-color-scheme` + a toggle remembered in `localStorage` inside try/catch), keyboard accessible, and respects `prefers-reduced-motion`.
- `<head>` has title, description, Open Graph + Twitter tags with `og:url` = the Pages URL and `og:image` = `https://ghanemja.github.io/<name>/docs/og.png`, and an inline SVG favicon.
- `docs/og.png` (1200×630) is made with this repo's own `og-image` CLI; `docs/screenshot.png` is a real screenshot of the page.
- `.nojekyll` and `.github/workflows/pages.yml` (GitHub Actions deploy of the project root) are included.
- The README starts with a **Live demo** link and the screenshot.
- No console errors when served over HTTP (`python3 -m http.server`).
