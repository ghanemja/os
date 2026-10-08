# accessible-patterns

Correct ARIA markup and keyboard handling for common UI widgets, following the [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/). Each pattern is a small vanilla ES module with no dependencies. It comes with a demo page and a README that documents the keyboard interaction and the ARIA roles, states and properties.

| Pattern | What it covers |
| --- | --- |
| [Modal dialog](patterns/modal-dialog/) | Focus trap, <kbd>Escape</kbd>, inert background, focus returns to the trigger |
| [Tabs](patterns/tabs/) | Arrow keys, <kbd>Home</kbd>/<kbd>End</kbd>, automatic vs manual activation, vertical, RTL, disabled tabs |
| [Disclosure](patterns/disclosure/) | Show/hide with `aria-expanded` |
| [Accordion](patterns/accordion/) | Single or multiple open sections, arrow keys between headers |
| [Menu button](patterns/menu-button/) | Action menu with arrow keys, type-ahead, <kbd>Escape</kbd>/<kbd>Tab</kbd> closing |
| [Combobox](patterns/combobox/) | Autocomplete with a listbox popup and `aria-activedescendant` |
| [Toggle button](patterns/toggle-button/) | `aria-pressed`, including the mixed state |
| [Tooltip](patterns/tooltip/) | Focus and hover, hoverable, dismissible with <kbd>Escape</kbd> (WCAG 1.4.13) |
| [Alert and live regions](patterns/alert/) | Polite and assertive announcements that work reliably, including repeated messages |
| [Skip link](patterns/skip-link/) | "Skip to main content" that moves focus (WCAG 2.4.1) |

## Use

Copy the pattern's `.js` file into your project, or install the package:

```sh
npm install accessible-patterns
```

```js
import { createTabs } from 'accessible-patterns/tabs';
createTabs(document.querySelector('[role="tablist"]'), { activation: 'manual' });
```

Every module exports a `create...` function that wires up the DOM, plus the pure functions it uses, such as `nextTabIndex()`, `comboboxKeyAction()` and `tooltipReducer()`. You can reuse those in React, Vue, Svelte or any other framework, and you can unit test them without a browser.

## Demos

Open `index.html` for the gallery. The demos use ES modules, which browsers block on `file://` URLs, so serve the folder over HTTP:

```sh
npx serve .          # or: python3 -m http.server
```

The demos support light and dark mode, show visible focus indicators, and respect `prefers-reduced-motion`.

## Tests

```sh
npm test
```

The keyboard and state logic of every pattern lives in pure functions that are tested with `node:test`. Examples: tab index arithmetic with wrapping, RTL and disabled tabs; focus-trap wrapping; which elements are tabbable; which background elements to make inert; menu type-ahead; combobox key handling; the tooltip state machine; live-region repeat handling; skip-link target resolution.

## Principles

- Native HTML comes first. Every trigger is a `<button>`, so <kbd>Enter</kbd> and <kbd>Space</kbd> come for free.
- ARIA states are the source of truth. The scripts read and write `aria-expanded`, `aria-selected` and `aria-pressed`, and CSS styles off the same attributes, so the visible state and the announced state can't drift apart.
- Every pattern works with a keyboard alone, and nothing relies on hover only.

## License

MIT © 2026 ghanemja
