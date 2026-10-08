# Disclosure

A button that shows and hides a section of content.

Reference: [WAI-ARIA APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)

## Markup

```html
<button type="button" aria-expanded="false" aria-controls="details">Shipping details</button>
<div id="details" hidden>...</div>
```

```js
import { createDisclosure } from './disclosure.js';
const d = createDisclosure(document.querySelector('[aria-controls="details"]'));
d.open(); d.close(); d.toggle(); d.isOpen();
```

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Enter</kbd> | Toggles the panel. |
| <kbd>Space</kbd> | Toggles the panel. |

A native `<button>` gives you both keys, so the script handles no keys itself. If you use another element, you'd have to add `role="button"`, `tabindex="0"` and the key handling yourself, which is why you should use `<button>`.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `<button>` | trigger | Native button semantics and keyboard support. |
| `aria-expanded="true\|false"` | trigger | Whether the panel is shown. Screen readers announce "expanded" or "collapsed". |
| `aria-controls` | trigger | Points at the panel. |
| `hidden` | panel | Hides the panel visually and from assistive technology. |

## Testable logic

- `isExpanded(value)`: only the string `"true"` counts as expanded.
- `disclosureState(expanded)` returns the attribute values to apply, keeping `aria-expanded` and `hidden` in sync.

## Notes

For many cases `<details><summary>` is enough and needs no JavaScript. Use this pattern when the trigger must be a real button, for example navigation menus that open on demand, or when the panel isn't directly after the trigger.
