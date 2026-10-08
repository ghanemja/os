// Toggle button (WAI-ARIA APG "Button" pattern, toggle variant with aria-pressed).
//
// Markup:
//   <button type="button" aria-pressed="false">Mute</button>
// Usage:
//   createToggleButton(button, { onChange: (pressed) => ... });
// The label must stay the same when the state changes; the state is conveyed by
// aria-pressed. (If the label changes, e.g. "Play" / "Pause", don't use aria-pressed.)

/** Parse aria-pressed: true, false or 'mixed'. Missing or invalid means false. */
export function parsePressed(value) {
  if (value === 'true') return true;
  if (value === 'mixed') return 'mixed';
  return false;
}

/** Next state when activated. A mixed (tri-state) button becomes pressed. */
export function nextPressed(current) {
  return current === true ? false : true;
}

/** Wire up a toggle button. Returns { setPressed, isPressed }. */
export function createToggleButton(button, { onChange } = {}) {
  if (!button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', 'false');
  function setPressed(value) {
    button.setAttribute('aria-pressed', String(value));
    onChange?.(value);
  }
  // Native <button> fires click for Enter and Space.
  button.addEventListener('click', () => setPressed(nextPressed(parsePressed(button.getAttribute('aria-pressed')))));
  return { setPressed, isPressed: () => parsePressed(button.getAttribute('aria-pressed')) };
}
