# favicon-all

Give it one SVG and it writes every favicon file a site needs: an optimized `favicon.svg`, PNGs in all the usual sizes, a real `favicon.ico`, `site.webmanifest`, and the `<link>`/`<meta>` tags to paste into your page. No dependencies.

```sh
npx favicon-all logo.svg --out public --name "My App" --color "#4f46e5"
```

```
public/
  favicon.svg            optimized copy of your SVG
  favicon.ico            16, 32 and 48 px (PNG-compressed ICO)
  favicon-16x16.png
  favicon-32x32.png
  favicon-48x48.png
  apple-touch-icon.png   180x180, on an opaque background
  icon-192.png
  icon-512.png
  icon-maskable-512.png  icon inside the maskable safe zone
  site.webmanifest
  favicon-tags.html      the tags below
```

```html
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#4f46e5">
<meta name="apple-mobile-web-app-title" content="My App">
```

## Install

```sh
npm install -g favicon-all
```

Requires Node 18.3+.

## Options

| Option | Description |
| --- | --- |
| `--out <dir>` | Output directory (default `./favicons`) |
| `--name <text>` | App name for the manifest and `apple-mobile-web-app-title` (default `App`) |
| `--short-name <text>` | Manifest `short_name` (defaults to `--name`) |
| `--color <#hex>` | `theme-color` and manifest `theme_color` |
| `--background <#hex>` | Background for the apple-touch and maskable icons, and the manifest `background_color` (default `#ffffff`) |
| `--base-path <path>` | URL prefix for the tags and the manifest, e.g. `/static/` (default `/`) |
| `--png` | Require PNG and ICO output. Fails if no rasterizer works |
| `--no-png` | Skip PNG and ICO output |
| `-q, --quiet` | Don't print the tags |

## PNG and ICO output

SVG cannot be rasterized with Node built-ins alone, so favicon-all uses whichever of these tools is installed. It tries them in this order:

1. `rsvg-convert` (librsvg)
2. ImageMagick: `magick` or `convert` (needs an SVG delegate)
3. `inkscape`
4. A Chromium-family browser, found through `CHROME_PATH`, `CHROMIUM_PATH` or `PUPPETEER_EXECUTABLE_PATH`, then on `PATH`, then in a Playwright browser cache

If none is available, favicon-all still writes `favicon.svg`, `site.webmanifest` and `favicon-tags.html` (which then reference only the SVG), prints a warning, and exits with code 0. Pass `--png` to make that case an error.

favicon-all writes `favicon.ico` itself in JavaScript. It writes the ICO container (`ICONDIR` + one `ICONDIRENTRY` per image) and embeds the 16, 32 and 48 px PNGs, which every current browser and Windows Vista and later support.

## SVG optimization

`favicon.svg` is your input with these removed: the XML prolog and doctype, comments, `<metadata>`, editor namespaces and attributes (Inkscape, Sodipodi, Illustrator, Sketch, Figma, RDF), `data-name`, `version`, and whitespace between tags. If the input has no `viewBox`, one is added from `width`/`height`. Drawing content is never changed.

## API

```js
import { generateFavicons, cleanSvg, encodeIco, buildManifest, buildTags } from 'favicon-all';

const { files, warnings, tags } = generateFavicons({
  input: 'logo.svg',
  outDir: 'public',
  name: 'My App',
  color: '#4f46e5',
  png: 'auto', // true = required, false = skip
});

const ico = encodeIco([png16, png32, png48]); // Buffers in, Buffer out
```

## License

MIT © 2026 ghanemja
