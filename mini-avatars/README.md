# mini-avatars

Mix-and-match line-drawn avatars from any seed string. `avatar("jane@example.com")` returns the same face every time, on every machine, with no network calls and no dependencies.

Each avatar is assembled from layered parts:

| Part | Options |
|------|---------|
| face (6) | round, oval, square, heart, long, wide |
| eyes (11) | dots, round, happy, closed, wink, lashes, ovals, lidded, glance, brows, stern |
| nose (4) | none, line, button, hook |
| mouth (11) | smile, grin, flat, smirk, oh, tongue, small, frown, wavy, teeth, cat |
| hair (14) | none, short, buzz, side-part, bangs, quiff, spiky, curly, afro, long, wavy, bob, bun, ponytail |
| accessory (6) | none, glasses, square-glasses, sunglasses, earrings, hat |

That is over 240,000 combinations, each on one of 10 soft background colors.

Open `index.html` for the playground: type a seed to see its avatar update live, shuffle a grid of random avatars, then copy or download the SVG.

## Install

```sh
npm install mini-avatars
```

Or copy `avatar.js`. It is one file with no imports.

## Usage

```js
import { avatar } from 'mini-avatars';

const svg = avatar('jane@example.com');                // fluid SVG, fills its container
el.innerHTML = avatar('jane@example.com', { size: 48 }); // width="48" height="48"
```

### Options

```js
avatar(seed, {
  size: 64,              // width/height attributes; omit for a fluid SVG
  color: '#1f2937',      // line color; 'currentColor' inherits the CSS text color
  background: '#fde68a', // fill; omit for a seeded pastel, 'none' for transparent
  parts: { hair: 'bun', accessory: 'none' }, // pin any part, the rest still come from the seed
  title: 'Jane',         // accessible name (<title>), default "Avatar"
});
```

### Examples

```html
<!-- Round avatar in a list -->
<span class="avatar"></span>
<style>.avatar svg { width: 40px; height: 40px; border-radius: 50%; }</style>
<script type="module">
  import { avatar } from './avatar.js';
  document.querySelector('.avatar').innerHTML = avatar(user.email, { title: user.name });
</script>
```

```js
// As an <img> src
const src = 'data:image/svg+xml,' + encodeURIComponent(avatar('bob', { size: 96 }));
```

```js
// Server side: write a file (Node 18+)
import { writeFileSync } from 'node:fs';
writeFileSync('bob.svg', avatar('bob', { size: 256 }));
```

```js
// Follow the theme: lines use the CSS color, transparent background
avatar('bob', { color: 'currentColor', background: 'none' });
```

### Other exports

```js
import { pick, parts, partSvg, hash, prng } from 'mini-avatars';

pick('jane@example.com'); // { face: 'square', eyes: 'brows', nose: 'none', mouth: 'teeth', hair: 'bangs', accessory: 'none', background: '#bbf7d0' }
parts.hair;               // ['none', 'short', 'buzz', …]
partSvg('hair', 'afro');  // one part as a standalone SVG (currentColor)
hash('jane');             // 32-bit FNV-1a hash
prng(42)();               // mulberry32 float in [0, 1)
```

## How it works

1. The seed is hashed with 32-bit FNV-1a, and the hash seeds a mulberry32 PRNG.
2. The PRNG picks one option per part in a fixed order. About half of the avatars get an accessory.
3. The parts are stacked as layers: neck, shoulders, ears, back hair, face, features, front hair, accessory. Every layer that has a silhouette hides the lines beneath it through an SVG `<mask>`, so the line art overlaps cleanly even on a transparent background. Mask ids come from the seed, so many avatars can share a page.

The picks depend only on the seed string. The same seed always gives the same avatar, in the browser and in Node.

## Standalone parts

Every part is also exported as its own 64×64 SVG in `svg/parts/<category>/<name>.svg` (empty "none" parts are skipped), listed in `manifest.json`. They use `stroke="currentColor"` and a 2px stroke, and all share one coordinate grid, so you can stack them in your own tool.

## Development

```sh
npm run build   # regenerate svg/parts/, manifest.json and the playground's copy of avatar.js
npm test        # node:test, no dependencies needed
```

## License

- Artwork (the part drawings in `avatar.js`, `svg/parts/`, and generated avatars): [CC0 1.0](LICENSE). Public domain, no attribution needed.
- Code (`avatar.js` logic, `build.js`, the playground, tests): [MIT](LICENSE-CODE) © 2026 ghanemja.
