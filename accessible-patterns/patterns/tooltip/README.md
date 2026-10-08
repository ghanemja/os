# Tooltip

A short description that appears when a control gets keyboard focus or the pointer hovers over it. The tooltip is linked to the control with `aria-describedby`, so screen readers read it after the control's name.

Reference: [WAI-ARIA APG Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) and [WCAG 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)

## Markup

```html
<button type="button" aria-describedby="tip-save">Save draft</button>
<span role="tooltip" id="tip-save" hidden>Drafts are kept for 30 days</span>
```

```js
import { createTooltip } from './tooltip.js';
createTooltip(document.querySelector('[aria-describedby="tip-save"]'), { showDelay: 300, hideDelay: 150 });
```

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Tab</kbd> (focus the trigger) | Shows the tooltip immediately. |
| Focus leaves the trigger | Hides the tooltip. |
| <kbd>Escape</kbd> | Hides the tooltip without moving focus. Works wherever focus is. |

Pointer: the tooltip shows after `showDelay` when hovering the trigger, and stays open while the pointer is over the trigger or the tooltip itself. It hides `hideDelay` after the pointer leaves both.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `role="tooltip"` | tooltip | |
| `id` | tooltip | Referenced by the trigger. |
| `aria-describedby` | trigger | Points at the tooltip, so its text becomes the trigger's accessible description. It is announced even while the tooltip is hidden. |
| `hidden` | tooltip | Toggled by the script. |

## Testable logic

`tooltipReducer(state, event)` is a pure state machine with the events `focus`, `blur`, `enter`, `leave`, `tipenter`, `tipleave` and `escape`. It implements the three WCAG 1.4.13 requirements:

- **Dismissible**: `escape` hides the tooltip until the next focus or hover.
- **Hoverable**: moving the pointer onto the tooltip keeps it open.
- **Persistent**: it stays visible while the trigger has focus or hover.

## Notes

- Tooltips are supplementary. Don't put essential information in them, since touch users rarely see them, and never put links or buttons inside them.
- For an icon-only button, the name belongs in `aria-label` (or visually hidden text), not in the tooltip. The tooltip can repeat it visually.
