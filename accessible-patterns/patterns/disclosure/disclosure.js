// Disclosure (show/hide) (WAI-ARIA APG "Disclosure" pattern).
//
// Markup:
//   <button type="button" aria-expanded="false" aria-controls="details">More</button>
//   <div id="details" hidden> ... </div>
// Usage:
//   createDisclosure(button);
// The native <button> already handles Enter and Space, so no key handling is needed.

/** Parse an aria-expanded attribute value. Anything but "true" is collapsed. */
export function isExpanded(value) {
  return value === 'true';
}

/** The attribute changes to apply for a new expanded state. */
export function disclosureState(expanded) {
  return { 'aria-expanded': String(Boolean(expanded)), hidden: !expanded };
}

/** Wire up a disclosure button. Returns { open, close, toggle, isOpen }. */
export function createDisclosure(button, { onToggle } = {}) {
  const panel = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
  if (!panel) throw new Error('disclosure button needs aria-controls pointing at its panel');

  function set(expanded) {
    const state = disclosureState(expanded);
    button.setAttribute('aria-expanded', state['aria-expanded']);
    panel.hidden = state.hidden;
    onToggle?.(expanded);
  }
  button.addEventListener('click', () => set(!isExpanded(button.getAttribute('aria-expanded'))));
  set(isExpanded(button.getAttribute('aria-expanded')));
  return {
    open: () => set(true),
    close: () => set(false),
    toggle: () => set(!isExpanded(button.getAttribute('aria-expanded'))),
    isOpen: () => isExpanded(button.getAttribute('aria-expanded')),
  };
}
