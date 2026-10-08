# Combobox (autocomplete)

An editable text input with a popup listbox of suggestions that narrows as you type (list autocomplete, no automatic selection). DOM focus stays in the input the whole time. The highlighted option is announced through `aria-activedescendant`.

Reference: [WAI-ARIA APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), example "Editable Combobox With List Autocomplete"

## Markup

```html
<label for="country">Country</label>
<input id="country" type="text" role="combobox" aria-autocomplete="list"
       aria-expanded="false" aria-controls="country-list" autocomplete="off">
<ul id="country-list" role="listbox" aria-label="Countries" hidden></ul>
<p id="country-status" class="visually-hidden" role="status"></p>
```

```js
import { createCombobox } from './combobox.js';
const combo = createCombobox(document.getElementById('country'), {
  options: ['Albania', 'Algeria', /* ... */],
  status: document.getElementById('country-status'), // optional: announces "5 results available."
  onSelect: (value) => {},
});
combo.setOptions(newList);
```

## Keyboard interaction

| Key | Function |
| --- | --- |
| Typing | Filters the list and opens it. Options that start with the text are listed first, then options that contain it. No option is highlighted. |
| <kbd>Down Arrow</kbd> | Closed: opens the list and highlights the first option. Open: highlights the next option, wrapping to the first. |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Opens the list without highlighting an option. |
| <kbd>Up Arrow</kbd> | Closed: opens the list and highlights the last option. Open: highlights the previous option, wrapping to the last. |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd> | Closes the list. |
| <kbd>Enter</kbd> | With an option highlighted: puts its text in the input and closes the list. |
| <kbd>Escape</kbd> | Open: closes the list. Closed: clears the input. |
| <kbd>Tab</kbd> | Closes the list and moves focus on as usual. |
| <kbd>Home</kbd> / <kbd>End</kbd> / <kbd>Left Arrow</kbd> / <kbd>Right Arrow</kbd> | Normal caret movement in the text. |

You can also choose an option by clicking it. Options use `pointerdown` + `preventDefault()` so the input keeps focus.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `role="combobox"` | input | |
| `aria-autocomplete="list"` | input | Suggestions are shown in a list, and the typed text is not completed inline. |
| `aria-expanded="true\|false"` | input | Whether the listbox is shown. |
| `aria-controls` | input | Points at the listbox. |
| `aria-activedescendant` | input | ID of the highlighted option. Removed when nothing is highlighted. |
| `<label for>` | label | The combobox's accessible name. |
| `autocomplete="off"` | input | Stops the browser's own autofill popup from covering the list. |
| `role="listbox"` | popup | Labelled with `aria-label` or `aria-labelledby`. |
| `role="option"` | each suggestion | Each has a unique `id`. |
| `aria-selected="true"` | highlighted option | |
| `role="status"` | optional status element | Announces the number of results. |

## Testable logic

- `filterOptions(options, query, { match })` returns the matches, prefix matches first.
- `splitMatch(label, query)` returns `[before, match, after]` for highlighting the matched text.
- `comboboxKeyAction(key, { open, active, count }, { altKey })` returns the state change for a key (`open`, `active`, `select`, `clear`), or `null` to let the input handle the key.
