# svg-patterns

Copy-paste CSS background patterns. Each pattern is a tiny SVG tile inlined as a data URI, so there are no image files to host and nothing to download at runtime.

18 patterns: `dots`, `polka`, `grid`, `graph-paper`, `diagonal-stripes`, `cross-hatch`, `checkerboard`, `triangles`, `hexagons`, `isometric`, `waves`, `zigzag`, `circles`, `plus`, `diamonds`, `bricks`, `topography`, `noise`.

Open `index.html` for the gallery: pick a color, background, opacity and size, then click any pattern to copy its CSS.

## Install

```sh
npm install svg-patterns
```

Or copy `patterns.css` / `patterns.js` into your project. Both are single files with no dependencies.

## Usage

### CSS classes

```html
<link rel="stylesheet" href="patterns.css">

<section class="pattern-dots">…</section>
<section class="pattern-hexagons" style="--pattern-size: 40px">…</section>
```

The classes set only `background-image` and `background-size`, so they combine with any `background-color`. They use a neutral slate (`#64748b` at 35% opacity), which reads on both light and dark backgrounds. `--pattern-size` sets the tile width; the height follows the tile's aspect ratio.

### JavaScript: any color, size, opacity

```js
import { pattern } from 'svg-patterns';

pattern('waves', { color: '#0ea5e9', size: 48, opacity: 0.4 });
// → 'url("data:image/svg+xml,%3Csvg …%3C/svg%3E") 0 0 / 48px 24px'

document.body.style.background = `${pattern('topography', { color: '#94a3b8' })}, #f8fafc`;
```

`pattern(name, { color, size, opacity })` returns a value for the CSS `background` shorthand (image, position and size). Add a fallback color after a comma, like above.

| Option | Default | Meaning |
|--------|---------|---------|
| `color` | `#000` | Any CSS color (hex, `rgb()`, `hsl()`, named). |
| `size` | per pattern | Tile width in px. The height keeps the tile's aspect ratio. |
| `opacity` | `1` | 0–1, applied to the whole tile. |

Other exports:

```js
import { names, patternStyle, svg, dataUri, tileSize } from 'svg-patterns';

names;                                   // ['dots', 'polka', 'grid', …]
patternStyle('grid', { color: 'red' });  // { backgroundImage: 'url("…")', backgroundSize: '24px 24px' }
svg('hexagons', { color: '#333' });      // raw SVG tile markup
tileSize('bricks', 80);                  // { width: 80, height: 40 }
```

### React

```jsx
<div style={patternStyle('cross-hatch', { color: '#f43f5e', opacity: 0.3 })} />
```

## How the tiles work

Every tile is drawn so its edges line up with its neighbors. Strokes that cross a tile edge are drawn on both sides, so there are no seams. `topography` is generated from contour lines of a height field that repeats exactly at the tile edges. `noise` uses a seeded random generator. Both come out the same on every run, so the output never changes between builds.

## Development

```sh
npm run build   # regenerate patterns.css, manifest.json and the gallery's embedded copy of patterns.js
npm test        # node:test, no dependencies needed
```

To add a pattern, add an entry to `TILES` in `patterns.js` (tile width, height, default size and a `draw` function), then run `npm run build` and `npm test`.

## License

- Pattern art (the SVG tiles and `patterns.css`): [CC0 1.0](LICENSE). Public domain, no attribution needed.
- Code (`patterns.js`, `build.js`, the gallery, tests): [MIT](LICENSE-CODE) © 2026 ghanemja.
