# device-frames

9 SVG device mockups for putting screenshots in context: iPhone-style and Android-style phones, a tablet, a laptop, a desktop monitor, light and dark browser windows, a browser with tabs, and a smartwatch.

- The screen area is transparent, and every frame documents its screen rectangle, so a screenshot lines up exactly
- Frame bodies use `fill="currentColor"`: dark by default, any color you like
- Generic shapes, no brand logos
- `viewBox` only, no fixed size, no raster images, no dependencies
- A small `frame.js` helper (MIT) that drops an image into a frame and returns the SVG string

Open `index.html` to browse them. Pick a screenshot to preview it in every frame, and click a frame to copy its SVG markup.

## Install

```sh
npm install github:ghanemja/device-frames
```

## Usage

### With frame.js

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { frame } from 'device-frames';

const svg = readFileSync('node_modules/device-frames/svg/phone-iphone.svg', 'utf8');
writeFileSync('mockup.svg', frame(svg, 'https://example.com/screenshot.png'));
```

`frame(svg, imageUrl, options)` reads the frame's `data-screen` attributes, then adds an `<image>` clipped to the screen (rounded corners included) underneath the frame. Options:

| Option | Default | Meaning |
| --- | --- | --- |
| `fit` | `'cover'` | `'cover'` fills the screen and crops, `'contain'` shows the whole image, `'fill'` stretches it |
| `background` | none | Color painted behind the image, useful with `'contain'` |
| `id` | generated | `id` of the clip path, if you need a specific one |

Also exported: `parseScreen(svg)` returns `{ x, y, width, height, radius: [tl, tr, br, bl] }`, and `roundedRect(screen)` returns the path data for that shape.

To embed the result as an `<img>`, use an absolute or `data:` URL for the screenshot, because browsers don't load external resources from inside an SVG image.

### By hand

In any design tool or SVG editor, put the screenshot at the frame's screen rectangle (table below), round its corners with the listed radius, and keep the frame above it. In HTML, absolutely position the screenshot using the rectangle as percentages of the viewBox, for example `left: calc(16 / 422 * 100%)` for `phone-iphone`.

## Screen rectangles

All values are in viewBox units. The radius is one value for all corners, or `top-left top-right bottom-right bottom-left`. The same data is in `manifest.json` (`screen`, `screenRadius`) and on each SVG root (`data-screen`, `data-screen-radius`).

| Frame | Title | viewBox | x | y | width | height | radius |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `browser-dark` | Browser window, dark | 0 0 1282 854 | 1 | 53 | 1280 | 800 | 0 0 11 11 |
| `browser-light` | Browser window, light | 0 0 1282 854 | 1 | 53 | 1280 | 800 | 0 0 11 11 |
| `browser-tabs` | Browser window with tabs | 0 0 1282 889 | 1 | 88 | 1280 | 800 | 0 0 11 11 |
| `laptop` | Laptop | 0 0 1560 884 | 140 | 28 | 1280 | 800 | 6 |
| `monitor` | Desktop monitor | 0 0 1968 1340 | 24 | 24 | 1920 | 1080 | 4 |
| `phone-android` | Android-style phone | 0 0 384 820 | 10 | 10 | 360 | 800 | 34 |
| `phone-iphone` | iPhone-style phone | 0 0 422 868 | 16 | 12 | 390 | 844 | 54 |
| `smartwatch` | Smartwatch | 0 0 252 410 | 24 | 84 | 198 | 242 | 44 |
| `tablet` | Tablet | 0 0 871 1231 | 24 | 27 | 820 | 1180 | 22 |

Screen sizes match common screenshot sizes (390×844, 360×800, 820×1180, 1280×800, 1920×1080, 198×242), so a 1× screenshot fits 1:1 and a 2× or 3× one scales down cleanly.

## Development

No install needed (zero dependencies, Node 18+).

```sh
npm run build   # regenerate manifest.json and the list embedded in index.html
npm test        # validate every SVG, test frame.js, check manifest.json / index.html are in sync
```

## License

The artwork in `svg/` is released under [CC0 1.0](LICENSE) (public domain, no attribution needed). The code (`frame.js`, `scripts/`, `test/`, `index.html`) is [MIT](LICENSE-CODE), Copyright (c) 2026 ghanemja.
