# Menu button

A button that opens a menu of actions, like the "..." menu in many apps.

Reference: [WAI-ARIA APG Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

> Use `role="menu"` only for application-style action menus. For site navigation, use a list of links, with a [disclosure](../disclosure/) if it needs to collapse. Screen reader users expect different behavior from a menu.

## Markup

```html
<button type="button" id="mb" aria-haspopup="menu" aria-expanded="false" aria-controls="menu">Actions</button>
<ul id="menu" role="menu" aria-labelledby="mb" hidden>
  <li role="menuitem" tabindex="-1">Duplicate</li>
  <li role="menuitem" tabindex="-1" aria-disabled="true">Move</li>
  <li role="separator"></li>
  <li role="menuitem" tabindex="-1">Delete</li>
</ul>
```

```js
import { createMenuButton } from './menu-button.js';
createMenuButton(document.getElementById('mb'), { onSelect: (item) => console.log(item.textContent) });
```

## Keyboard interaction

On the button:

| Key | Function |
| --- | --- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> / <kbd>Down Arrow</kbd> | Opens the menu and focuses the first item. |
| <kbd>Up Arrow</kbd> | Opens the menu and focuses the last item. |

In the menu:

| Key | Function |
| --- | --- |
| <kbd>Down Arrow</kbd> / <kbd>Up Arrow</kbd> | Next or previous item, wrapping. Disabled items are skipped. |
| <kbd>Home</kbd> / <kbd>PageUp</kbd> | First item. |
| <kbd>End</kbd> / <kbd>PageDown</kbd> | Last item. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activates the item, closes the menu and returns focus to the button. |
| <kbd>Escape</kbd> | Closes the menu and returns focus to the button. |
| <kbd>Tab</kbd> | Closes the menu, and focus continues to the next element on the page. |
| A printable character | Focuses the next item whose label starts with that character (type-ahead). |

Clicking outside the menu, or focus leaving it, also closes the menu.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `aria-haspopup="menu"` (or `"true"`) | button | Announces that the button opens a menu. |
| `aria-expanded="true\|false"` | button | Whether the menu is open. |
| `aria-controls` | button | Points at the menu. |
| `role="menu"` | list | |
| `aria-labelledby` | menu | Points at the button. |
| `role="menuitem"` | items | Use `menuitemcheckbox` or `menuitemradio` with `aria-checked` for stateful items. |
| `tabindex="-1"` | items | Focusable by script, but not in the tab order. |
| `aria-disabled="true"` | item | Item stays visible but is skipped and can't be activated. |
| `role="separator"` | divider | |

## Testable logic

- `buttonKeyAction(key)` returns `'first'`, `'last'` or `null`.
- `menuKeyAction(key, current, count)` returns `{ focus }`, `{ close, restoreFocus }`, `{ activate }` or `null`.
- `typeaheadIndex(labels, current, char)` returns the next matching index, or `-1`.
