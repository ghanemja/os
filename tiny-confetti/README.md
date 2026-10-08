# tiny-confetti

A canvas confetti burst in one file. It is a single ES module with no dependencies. It creates a full-screen canvas when a burst starts and removes it when the burst ends.

- `confetti()` returns a Promise that resolves when the burst is done
- Start from a point or from any element
- Three shapes: squares, circles and tumbling strips
- Respects `prefers-reduced-motion`. By default it plays a small, gentle burst; it can also skip entirely
- Bursts that overlap share one canvas, which is scaled for high-DPI screens and never captures clicks
- The physics are pure functions with unit tests and a seedable RNG for repeatable bursts
- Safe to import in Node or during SSR, where calls resolve immediately

## Install

```sh
npm install tiny-confetti
```

Or copy `tiny-confetti.js` into your project.

## Usage

```js
import confetti from 'tiny-confetti';

confetti();                                  // from the center of the screen
confetti({ origin: document.querySelector('#buy') });
confetti({ x: event.clientX, y: event.clientY, spread: 360, count: 60 });

await confetti({ colors: ['#4f46e5', '#a5b4fc'], shapes: ['circle'] });
console.log('done, canvas removed');

// Side cannons
confetti({ x: 0, y: innerHeight, angle: 60, spread: 40, velocity: 1400 });
confetti({ x: innerWidth, y: innerHeight, angle: 120, spread: 40, velocity: 1400 });

confetti.reset(); // stop everything now
```

Open `demo.html` through a local server (for example `npx serve` or `python3 -m http.server`).

## Options

| Option          | Default        | Notes |
|-----------------|----------------|-------|
| `x`, `y`        | viewport center | CSS pixels, relative to the viewport (like `clientX`/`clientY`) |
| `origin`        | `null`         | An element; the burst starts at its center (wins over `x`/`y`) |
| `count`         | `120`          | Number of particles |
| `spread`        | `70`           | Cone width in degrees (`360` = every direction) |
| `angle`         | `90`           | Launch direction: `90` up, `0` right, `180` left |
| `velocity`      | `900`          | Max launch speed in px/s; each particle gets 45–100% of it |
| `gravity`       | `1`            | Multiplier of 1400 px/s². `0` floats; negative rises |
| `drag`          | `1.6`          | Air resistance per second |
| `size`          | `9`            | Base particle size in px (each varies ±40%) |
| `duration`      | `3000`         | ms; particles fade out over the last 30% |
| `colors`        | 6 bright colors | Any CSS color strings |
| `shapes`        | all            | `['square', 'circle', 'strip']` |
| `zIndex`        | `2147483647`   | Of the overlay canvas |
| `reducedMotion` | `'minimal'`    | When the user prefers reduced motion: `'minimal'` (up to 16 slow particles, no spin, at most 1.2 s), `'skip'` (draw nothing, resolve immediately), or `'ignore'` (full animation) |
| `seed`          | random         | Number; the same seed gives the same burst |

## Pure helpers

The physics run without a DOM, so you can test them, run them on a server, or reuse them in your own renderer:

```js
import { resolveOptions, createRng, createParticles, stepParticle, opacityAt, isFinished } from 'tiny-confetti';

const opts = resolveOptions({ count: 50, seed: 1 }, { width: 800, height: 600 });
let particles = createParticles(opts, createRng(opts.seed));
particles = particles.map((p) => stepParticle(p, 1 / 60, opts)); // one 60 fps frame
```

Also exported: `shouldSkip`, `createParticle`, `drawParticle(ctx, particle, alpha)`, `DEFAULTS`, `SHAPES`, `GRAVITY`.

## Accessibility notes

- The canvas has `aria-hidden="true"` and `pointer-events: none`. Confetti is decoration, so if the event it celebrates matters, also announce it in text (for example in a live region).
- With reduced motion, the default is a small, slow burst. If even that is too much for your audience, use `reducedMotion: 'skip'`.

## Tests

```sh
npm test
```

The tests use `node:test` and need no install. They cover the physics, option handling and reduced-motion logic, plus a run with a fake `window`/`document` that checks the canvas is created and then removed.

## License

MIT © 2026 ghanemja. See [LICENSE](LICENSE).
