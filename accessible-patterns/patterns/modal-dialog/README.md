# Modal dialog

A window on top of the page. While it is open, focus stays inside it, the page behind it is `inert`, <kbd>Escape</kbd> closes it, and focus goes back to the element that opened it.

Reference: [WAI-ARIA APG Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Markup

```html
<button type="button" id="open">Edit profile</button>

<div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc" hidden>
  <h2 id="dlg-title">Edit profile</h2>
  <p id="dlg-desc">Changes are visible to your team.</p>
  <!-- form fields; add autofocus to the field that should get focus first -->
  <button type="button" data-dialog-close>Cancel</button>
  <button type="submit">Save</button>
</div>
```

Put the dialog as a direct child of `<body>` so the rest of the page can be made inert in one step.

```js
import { createModal } from './modal-dialog.js';
const dialog = createModal(document.getElementById('dlg'), { onClose() {} });
document.getElementById('open').addEventListener('click', (e) => dialog.open(e.currentTarget));
```

Options: `initialFocus` (element or function), `closeOnBackdrop` (default `true`), `onClose`.

## Keyboard interaction

| Key | Function |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the next tabbable element inside the dialog. From the last one, it wraps to the first. |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | Moves focus to the previous tabbable element. From the first one, it wraps to the last. |
| <kbd>Escape</kbd> | Closes the dialog and returns focus to the element that opened it. |

On open, focus goes to `initialFocus`, then to an `[autofocus]` element, then to the first tabbable element, and if there is none, to the dialog itself.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `role="dialog"` | container | Identifies the dialog. Use `alertdialog` for urgent confirmations. |
| `aria-modal="true"` | container | Tells assistive technology that the content behind the dialog is unavailable. |
| `aria-labelledby` | container | Points at the visible title. |
| `aria-describedby` | container | Optional. Points at a short description. |
| `inert` | every sibling of the dialog and of its ancestors | Removes the background from the tab order and the accessibility tree while the dialog is open. |
| `tabindex="-1"` | container | Added automatically so the dialog itself can take focus when it contains nothing tabbable. |

## Testable logic

- `isTabbable(el, { isVisible })` decides whether an element is in the tab order (disabled, `type="hidden"`, negative `tabindex`, inside `[inert]` or `[hidden]`, `<a>` without `href`, ...).
- `getTabbable(container)` returns the tabbable descendants in DOM order.
- `nextTrapIndex(current, count, shiftKey)` returns where Tab should go, wrapping at both ends.
- `getBackgroundElements(dialog)` returns the elements to make inert.

## Notes

- The native `<dialog>` element with `showModal()` gives you the focus trap, inert background and <kbd>Escape</kbd> for free, and is a good choice today. This module shows the mechanics, and works when you need a custom container.
- Restoring focus matters. Without it, keyboard users land at the top of the page.
