# Skip link

A "Skip to main content" link at the very start of the page. It takes keyboard and screen reader users past repeated navigation. It stays hidden until it gets focus.

Reference: [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) (there is no APG pattern for this; it is a WCAG technique, [G1](https://www.w3.org/WAI/WCAG22/Techniques/general/G1))

## Markup

```html
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>...</header>
  <nav>...</nav>
  <main id="main">...</main>
</body>
```

```css
.skip-link { position: absolute; left: 1rem; top: 0.5rem; transform: translateY(-200%); }
.skip-link:focus { transform: none; }
```

```js
import { enhanceSkipLinks } from './skip-link.js';
enhanceSkipLinks(); // default selector: 'a.skip-link'
```

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Tab</kbd> (first press on the page) | Focuses the skip link and makes it visible. |
| <kbd>Enter</kbd> | Moves focus to the main content. The next <kbd>Tab</kbd> continues from there. |

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `href="#main"` | link | In-page target. |
| `<main id="main">` | target | The `main` landmark. |
| `tabindex="-1"` | target | Added by the script when the target can't take focus on its own, and removed again on blur so clicking in the content doesn't show a focus ring. |

## Why the script?

In current browsers, following an in-page link already moves the "sequential focus starting point", so a plain link works without JavaScript. The script guarantees that `document.activeElement` really is the target. Some screen reader and browser combinations, and pages with client-side routing that intercepts hash changes, need that before they start reading the main content.

## Testable logic

- `skipTargetId(href, currentUrl)` returns the target id for in-page links (handles `#encoded%20ids` and absolute same-page URLs), and `null` for other pages.
- `needsTabindex(el)` reports whether the target needs `tabindex="-1"` to receive focus.

## Notes

- Hide the link with `transform` or a visually-hidden class. Don't use `display: none` or `visibility: hidden`, because those make it unfocusable.
- Make it the first focusable element in the DOM, and make sure it's visible on focus.
