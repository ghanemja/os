# niche-icons

Line icons for the fields the big icon sets skip: **farming**, **lab science**, **trades** and **music gear**.

52 icons drawn on the same rules as [Lucide](https://lucide.dev) and [Feather](https://feathericons.com) — 24×24 grid, 2px stroke, round caps and joins, `fill="none"`, `stroke="currentColor"` — so they sit next to those sets without looking out of place.

Open `index.html` for the gallery: search, preview at any size and stroke, click to copy the SVG.

| Category | Icons |
|----------|-------|
| farming (13) | barn, chicken, cow, egg, fence, hay-bale, scarecrow, seedling, shovel, silo, tractor, watering-can, wheat |
| lab (13) | atom, beaker, bunsen-burner, dna, flask, flask-round, goggles, magnet, microscope, petri-dish, pipette, test-tube, thermometer |
| trades (13) | drill, hammer, hard-hat, ladder, level, paint-roller, pliers, saw, screwdriver, tape-measure, toolbox, trowel, wrench |
| music (13) | amp, cable, cassette, drum, guitar, headphones, metronome, microphone, mixer, piano-keys, tuning-fork, vinyl, violin |

## Install

```sh
npm install niche-icons
```

Or just copy the `.svg` files you need from `icons/<category>/`.

## Usage

### Plain SVG files

```html
<img src="icons/farming/tractor.svg" width="24" height="24" alt="Tractor">
```

Paste the markup inline instead of using `<img>` if you want the icon to pick up the surrounding text color through `currentColor`.

### JavaScript

```js
import { icons, icon, categories } from 'niche-icons';

icons.microscope;            // '<svg xmlns=... viewBox="0 0 24 24" ...>...</svg>'
categories.music;            // ['amp', 'cable', 'cassette', ...]

// With options: size sets width/height, color and strokeWidth override the defaults,
// anything else becomes an attribute (className becomes class).
icon('wrench', { size: 32, color: '#b45309', strokeWidth: 1.5, className: 'icon', 'aria-hidden': 'true' });
```

```js
document.querySelector('#btn').innerHTML = icon('watering-can', { size: 20 }) + ' Water';
```

### Next to Lucide or Feather

Because the attributes match, you can style both sets with the same CSS:

```css
.icon { width: 20px; height: 20px; stroke-width: 1.75; }
```

### manifest.json

`manifest.json` lists every icon with its category and file path — handy for build tools and search UIs.

```json
{ "name": "tractor", "category": "farming", "file": "icons/farming/tractor.svg" }
```

## Adding an icon

1. Draw on a 24×24 grid with a 2px stroke, keep about 2px of padding, and use only `path`, `circle`, `rect`, `ellipse`, `line`, `polyline` or `polygon`.
2. Save it as `icons/<category>/<kebab-name>.svg` with the same root attributes as the other files.
3. Run `npm run build` to regenerate `index.js`, `manifest.json` and the gallery data, then `npm test`.

## Development

```sh
npm run build   # regenerate index.js, manifest.json and gallery data
npm test        # node:test, no dependencies needed
```

## License

- Icons (`icons/**/*.svg` and the SVG strings in `index.js`): [CC0 1.0](LICENSE) — public domain, no attribution needed.
- Code (`build.js`, the `icon()` helper, the gallery page, tests): [MIT](LICENSE-CODE) © 2026 ghanemja.
