# Toggle button

A button with an on/off state, exposed with `aria-pressed`. Screen readers announce it as "Bold, toggle button, pressed" or "not pressed".

Reference: [WAI-ARIA APG Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) (toggle button)

## Markup

```html
<button type="button" aria-pressed="false">Bold</button>
```

```js
import { createToggleButton } from './toggle-button.js';
const t = createToggleButton(button, { onChange: (pressed) => {} });
t.setPressed(true); t.isPressed(); // true | false | 'mixed'
```

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Enter</kbd> | Toggles the state. |
| <kbd>Space</kbd> | Toggles the state. |

A native `<button>` handles both keys, so the script only listens for `click`.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `<button type="button">` | button | Native button semantics and keyboard support. |
| `aria-pressed="true\|false"` | button | The toggle state. Its presence turns the button into a toggle button. |
| `aria-pressed="mixed"` | button | Optional tri-state, for example a "Bold" button over a selection that is partly bold. Activating it sets it to pressed. |
| `role="group"` + `aria-label` | wrapper | Optional, for a set of related toggles such as a formatting toolbar. |

## Testable logic

- `parsePressed(value)` returns `true`, `false` or `'mixed'`. Missing or invalid values count as `false`.
- `nextPressed(current)` returns the new state when the button is activated.

## Notes

- **Keep the label constant.** If the label changes ("Play" to "Pause"), the label already conveys the state, so leave out `aria-pressed`.
- A toggle button is not a switch. Use `role="switch"` with `aria-checked` for settings that read as on/off ("Wi-Fi"), and a toggle button for actions that stay engaged ("Bold", "Mute").
