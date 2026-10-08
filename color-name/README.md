# color-name

Hex in, human color name out.

```js
colorName('#4f8b8c'); // { name: 'dusty teal', hex: '#4e8a8b', distance: 0.37... }
```

Matches against a hand-curated list of 354 friendly names ("burnt orange", "midnight blue",
"seafoam green", "dusty rose"...) using **CIEDE2000**, the CIE's perceptual color-difference formula,
in CIELAB space. Zero dependencies, one file.

## Install

```sh
npm install color-name
```

> Note: the name `color-name` is already taken on the npm registry by an unrelated package, so the
> published name may differ. Until then, copy `index.js` or install from the Git repository.

Works in Node 18+ and modern browsers.

## Usage

```js
import { colorName, nearest } from 'color-name';

colorName('#c05a20');
// { name: 'paprika', hex: '#c35a2d', distance: 3.04... }

colorName('#fff');       // { name: 'white', hex: '#ffffff', distance: 0 }
colorName('1a1a5e');     // the # is optional -> 'midnight blue'
colorName('#ff000080');  // alpha is ignored  -> 'red'

nearest('#c05a20', 3);
// [
//   { name: 'paprika',      hex: '#c35a2d', distance: 3.04... },
//   { name: 'burnt orange', hex: '#cc5500', distance: 3.26... },
//   { name: 'toffee',       hex: '#b5651d', distance: 6.20... }
// ]
```

## API

### `colorName(hex) => { name, hex, distance }`

The closest named color. `hex` is the named color's own value (`#rrggbb`), and `distance` is the
CIEDE2000 ΔE between your color and it. Roughly: below 1 is imperceptible, 1-2 is close
inspection only, 2-10 is noticeable at a glance, above 10 the name is only a loose description.

### `nearest(hex, n = 5) => Array<{ name, hex, distance }>`

The `n` closest named colors, nearest first.

### Lower-level helpers

| Function | Description |
|----------|-------------|
| `parseHex(hex)` | `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (with or without `#`, any case) to `{ r, g, b, a }`; channels 0-255, `a` 0-1. Throws `TypeError` on anything else. |
| `rgbToLab({ r, g, b })` | sRGB to CIELAB with the D65 white point. |
| `hexToLab(hex)` | `rgbToLab(parseHex(hex))`. |
| `deltaE2000(lab1, lab2)` | CIEDE2000 difference with kL = kC = kH = 1. |
| `colors` | The built-in list as frozen `{ name, hex }` objects. |

All functions that take a hex string throw a `TypeError` on invalid input.

## How it works

1. The hex string is parsed (3 and 4 digit forms are expanded; alpha is dropped).
2. sRGB is linearized, converted to CIE XYZ (D65), then to CIELAB.
3. CIEDE2000 is computed against each named color (their Lab values are computed once and cached).

The CIEDE2000 implementation follows Sharma, Wu and Dalal, *"The CIEDE2000 Color-Difference Formula:
Implementation Notes, Supplementary Test Data, and Mathematical Observations"* (2005), and the test suite
checks all 34 reference pairs from that paper to 4 decimal places.

## The name list

The names and hex values were written for this project. A few basic names (red, navy, teal, khaki...)
share hex values with the CSS named colors, which are a public web standard. Every name is lowercase
and unique, and so is every hex value.

## Tests

```sh
npm test
```

## License

MIT (c) 2026 ghanemja. See [LICENSE](LICENSE).
