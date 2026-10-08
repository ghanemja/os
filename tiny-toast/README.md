# tiny-toast

One-file toast notifications, zero setup. A single ES module with no dependencies that injects its own CSS the first time you call it.

- `toast("Saved!")` works with no setup or stylesheet
- Four types: `info`, `success`, `warning`, `error`
- Six positions, auto-dismiss, sticky toasts, action buttons
- A queue: at most 3 visible per position by default, the rest wait their turn
- Accessible: `role="status"` (polite) or `role="alert"` for errors, a labelled live region, real `<button>`s, Escape to dismiss
- Pauses while hovered or focused, and fades instead of sliding when `prefers-reduced-motion` is set
- Theming through CSS custom properties, with dark mode via `prefers-color-scheme`
- Safe to import in Node or during SSR, where calls do nothing

## Install

```sh
npm install tiny-toast
```

Or copy `tiny-toast.js` into your project. It is one file.

## Usage

```js
import toast from 'tiny-toast';

toast('Saved!');
toast.success('Profile updated');
toast.error('Upload failed', { duration: 0 }); // stays until dismissed

const t = toast('Uploading…', { duration: 0, dismissible: false });
// later
t.dismiss();

toast('Message deleted', {
  action: { label: 'Undo', onClick: () => restore() },
});

// Change the defaults for every later toast
toast.configure({ position: 'top-center', duration: 5000, max: 5 });

toast.dismissAll();
```

In the browser without a bundler:

```html
<script type="module">
  import toast from './tiny-toast.js';
  toast('Hello');
</script>
```

Open `demo.html` through a local server (for example `npx serve` or `python3 -m http.server`) to try every option.

## API

### `toast(message, options?) → { dismiss }`

| Option        | Type                                         | Default          | Notes |
|---------------|----------------------------------------------|------------------|-------|
| `type`        | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`         | `error` uses `role="alert"` |
| `duration`    | `number` (ms)                                | `4000`           | `0` or `Infinity` means sticky |
| `position`    | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | |
| `dismissible` | `boolean`                                    | `true`           | Shows a close button and enables Escape |
| `action`      | `{ label: string, onClick?(event) }`         | `null`           | The toast closes after `onClick` runs |

The message is always set as text, never as HTML.

### Shortcuts

`toast.info`, `toast.success`, `toast.warning` and `toast.error` take `(message, options?)`.

### `toast.configure(defaults) → defaults`

Merges new defaults (any option above, plus `max`, the number of visible toasts per position, default `3`) and returns the full set.

### `toast.dismissAll()`

Closes every visible and queued toast.

### `createToaster({ document?, clock? })`

Returns an independent `toast` function with its own defaults and queues. `clock` is `{ setTimeout, clearTimeout, now }`, which tests use to control time. Lower-level helpers are also exported: `mergeOptions`, `createTimer` (pausable timer), `createQueue`, `DEFAULTS`, `TYPES`, `POSITIONS`, `CSS`.

## Theming

Override any of these on `:root` or a parent element. The defaults have zero specificity, so a plain `:root { … }` always wins.

```css
:root {
  --tt-bg: #fff;
  --tt-fg: #1f2328;
  --tt-border: rgba(0, 0, 0, .08);
  --tt-shadow: 0 6px 24px rgba(0, 0, 0, .14);
  --tt-radius: 10px;
  --tt-font: system-ui, sans-serif;
  --tt-gap: 8px;      /* between toasts */
  --tt-offset: 16px;  /* from the viewport edge */
  --tt-width: 360px;
  --tt-z: 2147483000;
  --tt-info: #2563eb;
  --tt-success: #16a34a;
  --tt-warning: #d97706;
  --tt-error: #dc2626;
}
```

Class hooks: `.tt-container[data-position]`, `.tt-toast`, `.tt-info|success|warning|error`, `.tt-msg`, `.tt-action`, `.tt-close`, `.tt-out` (while closing).

## Accessibility notes

- Each position has one container, a `<section aria-label="Notifications" aria-live="polite">`. Non-error toasts have `role="status"`; errors have `role="alert"`, which is assertive. Some screen readers skip the very first toast because its live region was created at the same moment. If that matters, show a harmless toast early in the page's life so the region already exists when the important one arrives.
- Auto-dismissing toasts can disappear before someone has read them (WCAG 2.2.1). Toasts pause while hovered or focused, but use `duration: 0` for anything important, and never put the only copy of critical information in a toast.
- Focus never moves to a toast automatically. Keyboard users reach the action and close buttons by tabbing, which can be a long way. Keep actions optional, or offer the same action elsewhere on the page.

## Tests

```sh
npm test
```

The tests use `node:test` with a small fake DOM and a fake clock defined in the test file, so they need no install.

## License

MIT © 2026 ghanemja. See [LICENSE](LICENSE).
