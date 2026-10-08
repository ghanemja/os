# css-only-components

14 UI components that use **zero JavaScript**, only HTML and CSS: `:checked`, `:focus-within`, `<details>`, `:has()`, `popover` and scroll snapping. Copy one into your project, or include the combined stylesheet.

Open `index.html` for a gallery with live demos and copyable code. Every component also has its own demo page at `components/<name>/index.html`.

| Component | Folder | What it is |
|-----------|--------|------------|
| [Tooltip](#tooltip) | `components/tooltip/` | A short description that appears on hover and keyboard focus. |
| [Toggle switch](#toggle-switch) | `components/toggle-switch/` | A real checkbox with role="switch", styled as an on/off switch. |
| [Accordion](#accordion) | `components/accordion/` | Expandable sections built on details and summary, with optional one-open-at-a-time grouping. |
| [Tabs](#tabs) | `components/tabs/` | Radio-button tabs: one visible panel at a time, up to six tabs. |
| [Modal](#modal) | `components/modal/` | A dialog opened with the HTML popover attribute: centered, with a backdrop, light-dismiss and Esc to close. |
| [Dropdown](#dropdown) | `components/dropdown/` | A disclosure menu built on details and summary. |
| [Star rating](#star-rating) | `components/star-rating/` | A 1–5 star rating input made of radio buttons, with hover preview. |
| [Progress ring](#progress-ring) | `components/progress-ring/` | A circular progress indicator drawn with conic-gradient and a mask, driven by one custom property. |
| [Skeleton loader](#skeleton-loader) | `components/skeleton/` | Shimmering placeholder shapes shown while content loads. |
| [Chips and tag input](#chips-and-tag-input) | `components/chip-input/` | Toggleable filter chips (checkboxes) and the styling for a tag input field. |
| [Dismissible banner](#dismissible-banner) | `components/banner/` | A toast-like notice that closes with a hidden checkbox; no script involved. |
| [Carousel](#carousel) | `components/carousel/` | A horizontally scrolling, snap-aligned carousel with anchor-link navigation. |
| [Breadcrumb](#breadcrumb) | `components/breadcrumb/` | A breadcrumb trail with CSS-generated separators. |
| [Stepper](#stepper) | `components/stepper/` | A numbered progress stepper; mark the current step and earlier steps style themselves as done. |

## Install

```sh
npm install css-only-components
```

```html
<!-- everything -->
<link rel="stylesheet" href="node_modules/css-only-components/css-only-components.css">
<!-- or just one component -->
<link rel="stylesheet" href="node_modules/css-only-components/components/tabs/style.css">
```

Or copy the HTML and CSS from the gallery. Every selector is prefixed with `.cc-`, so the styles will not clash with your own.

## Theming

The components use a few custom properties with fallbacks, so you only set what you want to change:

```css
:root {
  --cc-accent: #4f46e5;   /* focus rings, selected states, fills */
  --cc-border: rgb(0 0 0 / .15);
}
```

Some components have their own properties (`--cc-tooltip-bg`, `--cc-switch-off`, `--cc-rating-on`, `--cc-ring-size`, `--cc-ring-thickness`, …); search each `style.css` for `var(--cc-`. Surfaces use the system colors `Canvas`/`CanvasText`. Add `color-scheme: light dark` to your root element and they follow the user's dark mode automatically. Animations are turned off under `prefers-reduced-motion: reduce`, and most components have `forced-colors` adjustments.

Browser support: current evergreen browsers. A few enhancements need newer features (`:has()`, `popover`, `@property`, `::details-content`, `<details name>`). Where those are missing, the components still work with less polish; the notes below say where.

## Components and accessibility notes

No JavaScript is a real constraint, and some patterns cannot be fully accessible without it. Each section below says what works and what does not, so you can decide whether a component is good enough for your use.

### Tooltip

`components/tooltip/`: A short description that appears on hover and keyboard focus.

- The bubble is linked with `aria-describedby`, so screen readers announce it as the control's description even when it is hidden.
- It cannot be dismissed with <kbd>Esc</kbd> without moving focus or the pointer (WCAG 1.4.13 asks for that). Keep tooltip text short and never essential.
- Touch devices have no hover: the tooltip shows only after a tap focuses the control.

### Toggle switch

`components/toggle-switch/`: A real checkbox with role="switch", styled as an on/off switch.

- Built on a native `<input type="checkbox" role="switch">`, so it is focusable, toggles with <kbd>Space</kbd>, and screen readers announce it as a switch that is on or off.
- The visible text inside the `<label>` is the accessible name. Do not leave it out.
- In forced-colors (Windows High Contrast) mode the track gets a border and system colors.

### Accordion

`components/accordion/`: Expandable sections built on details and summary, with optional one-open-at-a-time grouping.

- Native `<details>`/`<summary>` gives keyboard support (<kbd>Enter</kbd>/<kbd>Space</kbd>) and announces expanded or collapsed state for free.
- Give every `<details>` the same `name` to allow only one open at a time. Browsers without support simply allow several open.
- Find-in-page (<kbd>Ctrl</kbd>+<kbd>F</kbd>) opens matching closed sections in Chromium browsers. Do not put headings inside `<summary>`; some screen readers then drop the heading role.
- The open/close animation uses `::details-content` where supported and is turned off for reduced motion.

### Tabs

`components/tabs/`: Radio-button tabs: one visible panel at a time, up to six tabs.

- Screen readers announce these as a radio group, not as tabs, because they are radios. That is honest and usable, but it is not the WAI-ARIA tabs pattern. Adding `role="tab"` without JavaScript would promise keyboard behavior that is not there.
- Arrow keys move between tabs and select them right away (native radio behavior). <kbd>Tab</kbd> then moves into the panel content.
- Hidden panels use `display: none`, so their content is not read and find-in-page skips it.
- Markup order matters: all `input`+`label` pairs first, then the panels (as `div`s) in the same order. Each tab group needs a unique radio `name`.

### Modal

`components/modal/`: A dialog opened with the HTML popover attribute: centered, with a backdrop, light-dismiss and Esc to close.

- Uses the `popover` attribute and `popovertarget` buttons. These are HTML, not JavaScript (Baseline 2024). <kbd>Esc</kbd>, clicking outside and the close buttons all dismiss it, and focus returns to the opening button.
- A popover is **not modal**: focus is not trapped and the page behind it is not made inert, so keyboard and screen reader users can still reach the page underneath. For a true modal (for example a destructive confirmation), use `<dialog>` with `showModal()`, which needs one line of JavaScript, or invoker commands (`command="show-modal"`) where browsers support them.
- The container has `role="dialog"` and `aria-labelledby` so it is announced with its title. `aria-modal` is deliberately left out because it is not modal.

### Dropdown

`components/dropdown/`: A disclosure menu built on details and summary.

- This is a disclosure (a button that shows a list of links), not an ARIA `menu`. Users <kbd>Tab</kbd> through the items, and arrow keys do nothing. That fits navigation links. A real application menu needs JavaScript.
- It does not close when you click outside or press <kbd>Esc</kbd>; activate the summary again to close it. For light-dismiss without JavaScript, use the [popover](components/modal/) approach instead.
- The menu is positioned absolutely, so it can be clipped by an ancestor with `overflow: hidden`.

### Star rating

`components/star-rating/`: A 1–5 star rating input made of radio buttons, with hover preview.

- It is a `<fieldset>` of native radios with a `<legend>`, so it is announced as "Rate this recipe, radio group, 3 stars, 3 of 5". Arrow keys change the value.
- Each label has visually hidden text ("3 stars"). The star itself is CSS-generated and hidden from assistive tech.
- The hover and "fill up to" effects use `:has()` (Baseline 2023). In older browsers only the chosen star is highlighted, but the input still works.
- Once a rating is picked it cannot be cleared without a reset button (`<button type="reset">` inside a form works).

### Progress ring

`components/progress-ring/`: A circular progress indicator drawn with conic-gradient and a mask, driven by one custom property.

- Use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a label, and keep them in sync with `--cc-value` (server-side or wherever the value comes from). CSS cannot read ARIA values.
- The visible percentage is text inside the element. Keep it, since color alone should not be the only way to read progress.
- Changes to `--cc-value` animate where `@property` is supported. The animation is off for reduced motion.

### Skeleton loader

`components/skeleton/`: Shimmering placeholder shapes shown while content loads.

- Mark the loading region with `aria-busy="true"` and include real text such as "Loading…" (visually hidden here), because the shapes themselves mean nothing to a screen reader.
- When the content arrives (server-rendered or streamed in), replace the skeleton and remove `aria-busy`.
- The shimmer stops for reduced motion, and the shapes stay as a static placeholder.

### Chips and tag input

`components/chip-input/`: Toggleable filter chips (checkboxes) and the styling for a tag input field.

- Filter chips are real checkboxes inside a `<fieldset>`, so they work with keyboard, screen readers and plain form submission. The checkmark is decoration; the state is announced as checked or not checked.
- The tag field is **styling only**. Adding a tag on <kbd>Enter</kbd> or removing one needs JavaScript, or a server round trip: inside a `<form>`, make the remove buttons `type="submit" name="remove" value="css"`.
- Each remove button needs its own label (for example `aria-label="Remove css"`). "×" alone means nothing to a screen reader.
- The highlight for the selected state uses `:has()` (Baseline 2023). In older browsers the chips still work but show no highlight.

### Dismissible banner

`components/banner/`: A toast-like notice that closes with a hidden checkbox; no script involved.

- The close control is a `<label>` for a visually hidden checkbox. Screen readers announce it as "Dismiss, checkbox, not checked", which is not ideal but understandable. The hidden text "Dismiss" gives it a name.
- Dismissal is not remembered. The banner comes back on reload, because CSS cannot store state. If it must stay closed, use a form or cookie on the server.
- After dismissing, focus stays on the (now hidden) checkbox. Pressing <kbd>Space</kbd> again brings the banner back.
- Use `role="status"` only for banners that appear after the page loads. Messages already present on load are not announced, which is usually fine.

### Carousel

`components/carousel/`: A horizontally scrolling, snap-aligned carousel with anchor-link navigation.

- It is just a scrollable region: swipe, trackpad, <kbd>Shift</kbd>+wheel, or focus the track (it has `tabindex="0"`) and use the arrow keys. The track has a `role="region"` and a label so screen reader users know what it is.
- The numbered links jump to slides with fragment anchors. That changes the URL hash, and may also scroll the whole page vertically so the slide is in view.
- Nothing auto-advances (auto-rotating carousels are an accessibility problem). Smooth scrolling is off for reduced motion.
- There is no "slide 2 of 4" announcement, and the dots do not show which slide is current. That needs JavaScript or the very new CSS `::scroll-marker` features.

### Breadcrumb

`components/breadcrumb/`: A breadcrumb trail with CSS-generated separators.

- Uses `<nav aria-label="Breadcrumb">` and an ordered list, and marks the current page with `aria-current="page"`, following the WAI-ARIA breadcrumb pattern.
- The separators are generated with empty alternative text (`content: "/" / ""`), so screen readers skip them. Browsers without that syntax use the plain fallback, and a few screen readers may then read "slash".
- The current page is plain text rather than a link to itself.

### Stepper

`components/stepper/`: A numbered progress stepper; mark the current step and earlier steps style themselves as done.

- It is an ordered list, so "list, 4 items" and the item positions are announced. The current step has `aria-current="step"`.
- Completed steps are styled with `:has()`, but that styling is visual only. Add visually hidden text such as "Completed:" (shown in the demo) so screen reader users get the same information.
- This shows progress; it is not navigation. If steps should be clickable, put links inside the list items.

## Development

```sh
npm run build   # regenerate css-only-components.css and index.html from components/*
npm test        # node:test: files exist, CSS is well formed and scoped, outputs are in sync
```

`scripts/build.js` concatenates `components/<name>/style.css` into `css-only-components.css` and generates the `index.html` gallery from the snippet between `<!-- snippet:start -->` and `<!-- snippet:end -->` in each demo page. Do not edit the two generated files by hand; the tests fail if they drift.

To add a component, create `components/<name>/index.html` (copy an existing one) and `components/<name>/style.css`, then run `npm run build`.

## License

MIT © 2026 ghanemja. See [LICENSE](LICENSE).
