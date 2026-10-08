# Alert and live regions

Messages that screen readers announce without moving focus: "Saved", "3 results", "Connection lost".

Reference: [WAI-ARIA APG Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) and [ARIA live regions (MDN)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)

## Markup

Visible regions, in the page from the start and empty:

```html
<div role="status" aria-live="polite" aria-atomic="true"></div>   <!-- "Draft saved." -->
<div role="alert" aria-atomic="true"></div>                          <!-- "Could not save: you are offline." -->
```

Or a hidden announcer for messages that have no visible text:

```js
import { createAnnouncer } from './alert.js';
const announcer = createAnnouncer();
announcer.announce('Draft saved.');                        // polite
announcer.announce('Session expires in 1 minute.', { assertive: true });
```

## Keyboard interaction

None. Alerts and status messages must not take focus or require any action. If the user has to respond, use a [modal dialog](../modal-dialog/) (`role="alertdialog"`) instead.

## Roles, states and properties

| Attribute | Element | Purpose |
| --- | --- | --- |
| `role="status"` | region | Polite announcement: waits until the screen reader is idle. Implies `aria-live="polite"` and `aria-atomic="true"`. Use it for most messages. |
| `role="alert"` | region | Assertive announcement: interrupts the user. Implies `aria-live="assertive"` and `aria-atomic="true"`. Use it only for urgent, time-sensitive information. |
| `aria-live` | region | Set explicitly as well, for older assistive technology that doesn't infer it from the role. |
| `aria-atomic="true"` | region | Reads the whole region, not just the changed part. |

## Making announcements reliable

1. **Create the region before you use it.** A region that is inserted with text already in it is often not announced. `createAnnouncer()` adds both regions up front.
2. **Change the text content.** Don't toggle `display` or `hidden` on a region that already has text.
3. **Repeat messages.** Setting the same text again is not a change, so nothing is announced. `nextAnnouncement(previous, message)` alternates a trailing non-breaking space so every repeat is a real change.
4. **Clear old messages.** The announcer empties its regions after `clearAfter` ms (default 7000), so stale text isn't found later by browsing.

## Testable logic

- `nextAnnouncement(previous, message)` returns the text to write.
- `liveRegionAttributes(assertive)` returns the attributes for a polite or assertive region.
