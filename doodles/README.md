# doodles

64 hand-drawn style SVG scribbles for landing pages and docs that want a human touch: arrows, scribbled circles, underlines, squiggles, stars, sparkles, hearts, brackets, highlight marks, "look here" marks, checkmarks and crosses.

- 2px strokes with rounded caps and joins, slightly wobbly on purpose
- `stroke="currentColor"`, so every doodle takes the text color around it
- `viewBox` only (no fixed size), so they scale to whatever you need
- No fills, no raster images, no dependencies

Open `index.html` in a browser to browse them. Click one to copy its SVG markup, and use the color picker to preview a color.

## Install

```sh
npm install github:ghanemja/doodles
```

Or just copy the SVG files you need from `svg/`, or copy the markup from the gallery.

## Usage

Inline, so the doodle picks up `color`:

```html
<h2 style="position: relative">
  Ship it today
  <span class="doodle" style="color: #e4572e"><!-- paste svg/underline-swoosh.svg here --></span>
</h2>
```

```css
.doodle svg { position: absolute; left: 0; bottom: -10px; width: 100%; height: auto; }
/* keep strokes 2px however large the doodle is drawn */
.doodle svg path { vector-effect: non-scaling-stroke; }
```

As an image (the color is then black, since `currentColor` can't reach into an `<img>`):

```html
<img src="node_modules/doodles/svg/arrow-curved.svg" alt="" width="120">
```

As a CSS mask, to color it from CSS:

```css
.arrow { width: 120px; aspect-ratio: 2; background: currentColor;
  mask: url(svg/arrow-curved.svg) center / contain no-repeat; }
```

`manifest.json` lists every doodle with its file, title and viewBox, so you can build your own picker.

## The doodles

- **arrow**: `arrow-bounce`, `arrow-circle-back`, `arrow-curved`, `arrow-double`, `arrow-down-curve`, `arrow-hook`, `arrow-loop`, `arrow-s-curve`, `arrow-spiral`, `arrow-straight`, `arrow-swoosh`, `arrow-up-right`, `arrow-wavy`, `arrow-zigzag`
- **bracket**: `bracket-corners`, `bracket-curly-left`, `bracket-curly-right`, `bracket-square-left`, `bracket-square-right`
- **check**: `check-box`, `check-circle`, `check`
- **circle**: `circle-double`, `circle-messy`, `circle-oval-tilted`, `circle-round`, `circle-scribble`
- **cloud**: `cloud`
- **cross**: `cross-circle`, `cross-scribble`, `cross`
- **dots**: `dots-trail`
- **exclamation**: `exclamation`
- **heart**: `heart-double`, `heart-pair`, `heart`
- **highlight**: `highlight-box`, `highlight-cross-out`, `highlight-scribble`, `highlight-strike`
- **lightbulb**: `lightbulb`
- **look**: `look-here-both-sides`, `look-here-lines`
- **pointer**: `pointer-hand-arrow`
- **question**: `question-mark`
- **sparkle**: `sparkle-burst`, `sparkle-plus`, `sparkle-trio`, `sparkle`
- **speech**: `speech-bubble`
- **squiggle**: `squiggle-loops`, `squiggle-scribble`, `squiggle-spring`, `squiggle-wave`
- **star**: `star-double`, `star-trio`, `star`
- **underline**: `underline-double`, `underline-loop`, `underline-scribble`, `underline-simple`, `underline-swoosh`, `underline-wavy`, `underline-zigzag`

The doodles are drawn by `scripts/draw-doodles.js`: each one is a few points or a parametric curve, jittered with a seeded random generator and smoothed into Bezier curves. Output is the same on every run. To tweak one, edit it there and run `npm run draw && npm run build`.

## Development

No install needed (zero dependencies, Node 18+).

```sh
npm run build   # regenerate manifest.json and the list embedded in index.html
npm test        # validate every SVG and check manifest.json / index.html are in sync
```

## License

The artwork in `svg/` is released under [CC0 1.0](LICENSE) (public domain, no attribution needed). The code (`scripts/`, `test/`, `index.html`, `scripts/draw-doodles.js`) is [MIT](LICENSE-CODE), Copyright (c) 2026 ghanemja.
