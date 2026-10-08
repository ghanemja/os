# Tabs

Layered sections of content shown one panel at a time. The tab list is a single <kbd>Tab</kbd> stop (roving `tabindex`), and the arrow keys move between tabs.

Reference: [WAI-ARIA APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

## Markup

```html
<div role="tablist" aria-label="Fruit facts">
  <button type="button" role="tab" id="t1" aria-controls="p1" aria-selected="true">Apple</button>
  <button type="button" role="tab" id="t2" aria-controls="p2" aria-selected="false">Banana</button>
</div>
<div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">...</div>
<div role="tabpanel" id="p2" aria-labelledby="t2" tabindex="0" hidden>...</div>
```

```js
import { createTabs } from './tabs.js';
createTabs(document.querySelector('[role="tablist"]'), { activation: 'automatic' }); // or 'manual'
```

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus into the tab list, to the selected tab. Pressed again, it moves focus to the tab panel. |
| <kbd>Right Arrow</kbd> / <kbd>Left Arrow</kbd> | Horizontal tab lists: next or previous tab, wrapping at the ends. Reversed in right-to-left layouts. |
| <kbd>Down Arrow</kbd> / <kbd>Up Arrow</kbd> | Vertical tab lists (`aria-orientation="vertical"`): next or previous tab, wrapping. |
| <kbd>Home</kbd> / <kbd>End</kbd> | First or last tab. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Manual activation: shows the panel of the focused tab. |

Tabs with `aria-disabled="true"` are skipped.

**Automatic or manual activation?** With automatic activation, moving focus also selects the tab. That works best when panels display instantly. If showing a panel is slow (a network request, heavy rendering), use manual activation so that arrowing past a tab doesn't trigger it.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `role="tablist"` | container | Groups the tabs. Label it with `aria-label` or `aria-labelledby`. |
| `aria-orientation="vertical"` | tablist | Only for vertical lists. Switches the arrow keys to up and down. |
| `role="tab"` | each tab | |
| `aria-selected="true\|false"` | each tab | Marks the selected tab. |
| `aria-controls` | each tab | Points at the tab's panel. |
| `tabindex="0"` / `"-1"` | each tab | Roving tabindex: only the selected tab is in the tab order. Set by the script. |
| `aria-disabled="true"` | tab | Optional. The tab stays visible but can't be selected. |
| `role="tabpanel"` | each panel | |
| `aria-labelledby` | each panel | Points at its tab. |
| `tabindex="0"` | each panel | Makes the panel focusable when it has no focusable content. |
| `hidden` | inactive panels | |

## Testable logic

`nextTabIndex(current, key, count, { orientation, rtl, disabled })` returns the index to focus, or `null` for keys it doesn't handle.
