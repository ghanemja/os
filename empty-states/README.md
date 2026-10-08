# empty-states

14 matching line-art illustrations for empty screens: no results, inbox zero, offline, 404, empty cart, no notifications, no files, error, success, coming soon, no messages, empty folder, no data and no users.

- Lines use `stroke="currentColor"`, so they follow your text color and dark mode
- One highlight shape per scene is filled with `var(--accent, #6c63ff)`, so it matches your brand
- Same 200×160 canvas, 2px rounded strokes and floor line in every scene, so they look like one set
- `viewBox` only, no fixed size, no raster images, no dependencies

Open `index.html` to browse them. Click one to copy its SVG markup. The pickers preview the line and accent colors.

## Install

```sh
npm install github:ghanemja/empty-states
```

Or copy files from `svg/`.

## Usage

Inline the SVG so it can read your CSS:

```html
<div class="empty" style="color: #334155; --accent: #f97316">
  <!-- paste svg/no-results.svg here -->
  <p>No results for "banana phone"</p>
</div>
```

```css
.empty svg { width: min(240px, 60vw); height: auto; }
```

The accent shape carries both `fill="#6c63ff"` (for tools that ignore CSS) and `style="fill:var(--accent, #6c63ff)"`. Set `--accent` on any ancestor to recolor it. Used through `<img>`, the scene keeps black lines and the default purple accent, because CSS doesn't reach inside images.

`manifest.json` lists every scene with its file, title and viewBox.

## Scenes

| Name | Title |
| --- | --- |
| `404` | 404, page not found |
| `coming-soon` | Coming soon, rocket launch |
| `empty-cart` | Empty shopping cart |
| `empty-folder` | Empty folder |
| `error` | Something went wrong |
| `inbox-zero` | Inbox zero |
| `no-data` | No data yet |
| `no-files` | No files |
| `no-messages` | No messages |
| `no-notifications` | No notifications, sleeping bell |
| `no-results` | No results |
| `no-users` | No users or team members |
| `offline` | Offline, unplugged cable |
| `success` | Success |

## Development

No install needed (zero dependencies, Node 18+).

```sh
npm run build   # regenerate manifest.json and the list embedded in index.html
npm test        # validate every SVG and check manifest.json / index.html are in sync
```

## License

The artwork in `svg/` is released under [CC0 1.0](LICENSE) (public domain, no attribution needed). The code (`scripts/`, `test/`, `index.html`) is [MIT](LICENSE-CODE), Copyright (c) 2026 ghanemja.
