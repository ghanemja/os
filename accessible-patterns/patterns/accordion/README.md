# Accordion

A vertical stack of headings, each of which shows or hides a section. Every heading contains a button. Because the headings are real heading elements, screen reader users can still navigate by heading.

Reference: [WAI-ARIA APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

## Markup

```html
<div class="accordion">
  <h3><button type="button" id="h1" aria-expanded="true" aria-controls="s1">Personal information</button></h3>
  <div id="s1" role="region" aria-labelledby="h1">...</div>
  <h3><button type="button" id="h2" aria-expanded="false" aria-controls="s2">Billing address</button></h3>
  <div id="s2" role="region" aria-labelledby="h2" hidden>...</div>
</div>
```

```js
import { createAccordion } from './accordion.js';
createAccordion(container, { allowMultiple: false, allowToggle: true });
```

- `allowMultiple` (default `false`): several sections can be open at once.
- `allowToggle` (default `true`): an open section can be collapsed. With `false`, one section always stays open, and its button gets `aria-disabled="true"` so screen readers know it can't be collapsed.

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggles the section of the focused header. |
| <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> | Moves through all focusable elements, including those inside open sections. |
| <kbd>Down Arrow</kbd> / <kbd>Up Arrow</kbd> | Next or previous header, wrapping (optional in the APG, implemented here). |
| <kbd>Home</kbd> / <kbd>End</kbd> | First or last header. |

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `<h2>`–`<h6>` (or `role="heading"` + `aria-level`) | header wrapper | Keeps heading navigation working. Pick the level that fits the page outline. |
| `<button>` | inside each heading | The toggle. |
| `aria-expanded="true\|false"` | button | Whether its section is shown. |
| `aria-controls` | button | Points at the section. |
| `aria-disabled="true"` | button | Set on the open section when it can't be collapsed. |
| `role="region"` | section | Optional. Makes the section a landmark. Avoid it with more than about six sections, because too many landmarks add noise. |
| `aria-labelledby` | section | Points at its button. |

## Testable logic

- `nextHeaderIndex(current, key, count)` returns the header to focus for an arrow, Home or End key.
- `toggleSection(state, index, { allowMultiple, allowToggle })` returns the new array of open/closed states without mutating the old one.
