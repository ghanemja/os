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
