# os — a small open source toolbox

A collection of small, useful, zero-dependency open source projects: asset packs, tiny libraries, CLI tools and snippet collections. Each folder is a self-contained project with its own README, license and tests. Each one is also published as its own repository.

See [docs/IDEAS.md](docs/IDEAS.md) for the full catalog and [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for the rules every project follows.

## Projects

### Asset packs (art: CC0 1.0, code: MIT)
- [doodles](doodles) — hand-drawn UI scribbles
- [empty-states](empty-states) — empty-state illustrations
- [niche-icons](niche-icons) — farming, lab, trades and music line icons
- [svg-patterns](svg-patterns) — CSS background patterns
- [mini-avatars](mini-avatars) — seeded line-drawn avatars
- [device-frames](device-frames) — device and browser mockup frames

### Libraries (MIT)
- [relative-time](relative-time) — "3 minutes ago" in any language
- [slugify-anything](slugify-anything) — Unicode-aware slugs
- [color-name](color-name) — hex → human color name
- [fake-but-real](fake-but-real) — believable placeholder data
- [readable-id](readable-id) — `brave-otter-42` style IDs
- [tiny-toast](tiny-toast) — one-file toast notifications
- [tiny-confetti](tiny-confetti) — one-file confetti
- [env-check](env-check) — validate environment variables

### CLI tools (MIT)
- [og-image](og-image) — social preview images
- [favicon-all](favicon-all) — every favicon from one SVG
- [readme-badges](readme-badges) — auto-detected README badges
- [unused-assets](unused-assets) — find unreferenced assets

### Snippets (MIT)
- [css-only-components](css-only-components) — no-JS UI components
- [regex-cookbook](regex-cookbook) — tested regex patterns
- [accessible-patterns](accessible-patterns) — WAI-ARIA patterns

## Running all tests

```sh
./scripts/test-all.sh
```

Requires Node 18+. No install step: nothing has dependencies.

## License

Each project carries its own license file. Code is MIT, artwork is CC0 1.0. The root files (this README, docs, scripts) are MIT — see [LICENSE](LICENSE).
