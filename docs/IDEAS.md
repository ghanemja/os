# Open source toolbox — idea catalog

Small, useful, open source tools. Each one does one thing, has no runtime dependencies, and ships with a license. Each folder in this repo is one project.

| # | Project | Type | License | One-liner |
|---|---------|------|---------|-----------|
| 1 | [`doodles`](../doodles) | Asset pack | CC0 + MIT | Hand-drawn UI scribbles: arrows, circles, underlines, stars, "look here" marks |
| 2 | [`empty-states`](../empty-states) | Asset pack | CC0 + MIT | Line-art illustrations for "no results", "inbox zero", "offline", "404"… with one accent color |
| 3 | [`niche-icons`](../niche-icons) | Asset pack | CC0 + MIT | Line icons for fields the big sets skip: farming, lab science, trades, music gear |
| 4 | [`svg-patterns`](../svg-patterns) | Asset pack | CC0 + MIT | Copy-paste CSS background patterns: dots, grids, topography, waves, noise |
| 5 | [`mini-avatars`](../mini-avatars) | Asset pack + lib | CC0 + MIT | Mix-and-match line-drawn faces, deterministic from any seed string |
| 6 | [`device-frames`](../device-frames) | Asset pack | CC0 + MIT | SVG mockups of phones, laptops, tablets and browser windows for screenshots |
| 7 | [`relative-time`](../relative-time) | Library | MIT | "3 minutes ago" in any language via `Intl`, under 1 KB |
| 8 | [`slugify-anything`](../slugify-anything) | Library | MIT | URL slugs that survive emoji, accents and non-Latin scripts |
| 9 | [`color-name`](../color-name) | Library | MIT | Hex in, human color name out ("dusty teal") |
| 10 | [`fake-but-real`](../fake-but-real) | Library | MIT | Believable, seedable placeholder data that isn't lorem ipsum |
| 11 | [`readable-id`](../readable-id) | Library | MIT | Friendly IDs like `brave-otter-42` |
| 12 | [`tiny-toast`](../tiny-toast) | Library | MIT | One-file toast notifications, zero setup |
| 13 | [`tiny-confetti`](../tiny-confetti) | Library | MIT | One-file canvas confetti burst |
| 14 | [`env-check`](../env-check) | Library + CLI | MIT | Validate required `.env` variables at startup with clear errors |
| 15 | [`og-image`](../og-image) | CLI | MIT | Generate social preview images (SVG/PNG) from a title and template |
| 16 | [`favicon-all`](../favicon-all) | CLI | MIT | One SVG in → every favicon size, manifest and HTML tags out |
| 17 | [`readme-badges`](../readme-badges) | CLI | MIT | Detects your project and suggests or writes the right README badges |
| 18 | [`unused-assets`](../unused-assets) | CLI | MIT | Find images, fonts and media no file references |
| 19 | [`css-only-components`](../css-only-components) | Snippets | MIT | Tooltips, toggles, accordions, tabs — no JavaScript |
| 20 | [`regex-cookbook`](../regex-cookbook) | Snippets | MIT | Tested regex patterns with explanations and test cases |
| 21 | [`accessible-patterns`](../accessible-patterns) | Snippets | MIT | Correct ARIA markup and keyboard handling for modals, tabs, menus |

## Why these

- **Asset packs** spread fastest: designers share them, and once published they need almost no maintenance.
- **Tiny libraries** fill gaps where the popular option is heavy or gets edge cases wrong.
- **CLI tools** automate a chore everyone does by hand a few times a year.
- **Snippet collections** are documentation-first and great for search traffic.

## Details

### Asset packs

1. **doodles** — 40+ hand-drawn style SVGs, 2px rounded strokes, `currentColor`. Gallery page with click-to-copy. Good for landing pages that want a human touch.
2. **empty-states** — a matching set of empty-state scenes. Uses `currentColor` for lines and a CSS variable `--accent` for one highlight color, so they match any brand.
3. **niche-icons** — 24×24 grid line icons in four categories (farming, lab, trades, music). Same stroke rules as Lucide/Feather so they mix in.
4. **svg-patterns** — each pattern is a tiny inline SVG data URI in a CSS class, with customizable color via a small JS helper.
5. **mini-avatars** — separate layers (face shape, eyes, mouth, hair, accessory) composed from a seed string, so `avatar("jane@example.com")` always gives the same face.
6. **device-frames** — frames with a transparent screen area and documented screen coordinates so screenshots drop in.

### Libraries

7. **relative-time** — `relativeTime(date, { locale })` using `Intl.RelativeTimeFormat`, picks the right unit automatically, supports future dates.
8. **slugify-anything** — Unicode normalization, transliteration table for common scripts, emoji names, custom separators, max length that doesn't cut words.
9. **color-name** — nearest named color by perceptual distance (CIEDE2000 in Lab space) over a curated name list.
10. **fake-but-real** — seeded PRNG, generators for people, companies, products, addresses, bios, reviews.
11. **readable-id** — adjective-noun-number IDs, configurable word lists, collision-probability helper.
12. **tiny-toast** — `toast("Saved!")`, types, positions, auto-dismiss, accessible (`role="status"`), injects its own CSS.
13. **tiny-confetti** — `confetti({ x, y })`, canvas based, respects `prefers-reduced-motion`.
14. **env-check** — schema of required/optional vars with types (string, number, boolean, url, enum), reads `.env` without dependencies, prints all problems at once.

### CLI tools

15. **og-image** — templates as SVG strings, text wrapping, outputs SVG (PNG via an optional rasterizer if present).
16. **favicon-all** — writes a cleaned `favicon.svg`, sized PNGs, `favicon.ico`, `site.webmanifest` and the `<link>` tags; PNG output when a rasterizer is available.
17. **readme-badges** — reads `package.json` / `pyproject.toml` / `LICENSE` / CI config and generates shields.io badge markdown.
18. **unused-assets** — scans a project for asset files and reports any whose filename isn't referenced in source files.

### Snippet collections

19. **css-only-components** — each component is one HTML + CSS block using `:checked`, `:focus-within`, `<details>`, `:has()`.
20. **regex-cookbook** — patterns stored as data with positive and negative test cases, a test runner that proves every pattern works, and generated docs.
21. **accessible-patterns** — each pattern follows the WAI-ARIA Authoring Practices, with a small vanilla JS file and a demo page.

See [CONVENTIONS.md](CONVENTIONS.md) for the rules every project follows.
