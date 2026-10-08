# unused-assets

Finds the images, fonts, video and audio files in a project that no source file references, and tells you how much space you would get back by deleting them.

```
$ unused-assets
Unused (6, 4.2 KB):
  2.0 KB  fonts/unused.otf
   122 B  icons/self.svg
   400 B  img/logo-dark.png
  1000 B  img/old-banner.jpg
   700 B  media/outro.mp3
    90 B  vendor/lib.png

Maybe used (2, 387 B):
   87 B  icons/arrow.svg  (name without extension appears in src/app.js)
  300 B  img/logo.webp  (name without extension appears in index.html)

Scanned 17 assets against 8 source files. 9 used, 2 maybe, 6 unused.
Reclaimable: 4.2 KB
```

It has no dependencies and needs Node 18 or newer.

## Install

```sh
npm install -g unused-assets
# or
npx unused-assets
```

## Usage

```sh
unused-assets [dir] [--ext png,jpg,...] [--ignore glob] [--json] [--delete --yes]
```

| Option | Meaning |
|---|---|
| `--ext png,jpg` | Asset extensions to look for. This replaces the default list: png jpg jpeg gif webp avif bmp ico tif tiff svg heic woff woff2 ttf otf eot mp4 webm mov m4v ogv avi mkv mp3 wav ogg oga m4a aac flac opus |
| `--ignore <glob>` | Skip paths that match. Use it more than once or separate globs with commas, e.g. `--ignore 'vendor/**,*.psd'` |
| `--no-gitignore` | Do not apply `.gitignore` rules |
| `--json` | Print the full report as JSON, including which files reference each asset |
| `--delete --yes` | Delete the **unused** files. Files in "maybe used" are never deleted. `--delete` without `--yes` refuses and exits with code 2 |

`node_modules`, `.git` and `dist` are always skipped.

## How matching works

Every text source file is scanned: html, css, scss, less, js, ts, jsx, tsx, vue, svelte, astro, md, mdx, json, yml, toml, xml, templates (hbs, njk, ejs, pug, liquid, twig…) and a few server languages. SVG files are scanned too, because they can reference fonts and other images. Each asset ends up in one of three groups:

1. **Used (path).** The asset's path appears in a source file. This can be the path from the project root (`img/logo.png` or `/img/logo.png`) or the path relative to the referencing file (`../img/logo.png`). URL-encoded forms such as `hero%20banner.jpg` also count.
2. **Used (basename).** The file name with its extension (`logo.png`) appears as a whole token anywhere.
3. **Maybe used (stem).** Only the name without its extension appears (`arrow` for `icons/arrow.svg`). This happens with code like `` `/icons/${name}.svg` `` or with build tools that add extensions. Check these by hand.

If none of these match, the asset is **unused**. A file that mentions its own name does not count as a reference.

Name matching ignores case, so the tool leans toward calling a file used rather than unused.

`.gitignore` support covers the basics: `.gitignore` files in the root and in subfolders, comments, `!` negation, a trailing `/` for directories only, a leading or inner `/` to anchor a pattern, and `*`, `**`, `?` and `[abc]`.

## API

```js
import { scan, deleteUnused, formatBytes } from 'unused-assets';

const result = scan('.', { ext: ['png', 'svg'], ignore: ['vendor/**'], gitignore: true });
result.unused;            // [{ path, size, status: 'unused', reason: null, references: [] }]
result.maybe;             // [{ ..., status: 'maybe', reason: 'stem', references: ['src/app.js'] }]
result.used;              // [{ ..., status: 'used', reason: 'path' | 'basename', references: [...] }]
result.reclaimableBytes;  // total size of unused files
formatBytes(result.reclaimableBytes); // '4.2 KB'
deleteUnused(result);     // deletes result.unused, returns their paths
```

## Limitations

- An asset whose name is built at runtime from pieces (for example `'img-' + id + '.png'`) will be reported as unused. Look through the list before you pass `--delete --yes`.
- Text source files larger than 5 MB are not scanned.

## License

MIT © 2026 ghanemja
