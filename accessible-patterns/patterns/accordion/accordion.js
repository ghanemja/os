// Accordion (WAI-ARIA APG "Accordion" pattern).
//
// Markup (repeat per section):
//   <h3><button type="button" id="acc1" aria-expanded="false" aria-controls="sect1">Title</button></h3>
//   <div id="sect1" role="region" aria-labelledby="acc1" hidden> ... </div>
// Usage:
//   createAccordion(container, { allowMultiple: false, allowToggle: true });

/**
 * Index of the header to focus for a key press, or null if not handled.
 * ArrowDown/ArrowUp wrap; Home/End jump to the first/last header.
 */
export function nextHeaderIndex(current, key, count) {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowDown': return (current + 1) % count;
    case 'ArrowUp': return (current - 1 + count) % count;
    case 'Home': return 0;
    case 'End': return count - 1;
    default: return null;
  }
}

/**
 * New expanded state (array of booleans) after activating header `index`.
 * - allowMultiple: other sections stay open.
 * - allowToggle: an open section can be closed. When false (and single-open),
 *   one section always stays open, as in the APG example.
 */
export function toggleSection(state, index, { allowMultiple = false, allowToggle = true } = {}) {
  const open = state[index];
  if (open && !allowToggle && !allowMultiple) return state.slice();
  return state.map((v, i) => {
    if (i === index) return !open;
    return allowMultiple ? v : false;
  });
}

/** Wire up every accordion header button inside `container`. */
export function createAccordion(container, options = {}) {
  const buttons = Array.from(container.querySelectorAll('button[aria-controls][aria-expanded]'));
  const panels = buttons.map((b) => container.ownerDocument.getElementById(b.getAttribute('aria-controls')));
  let state = buttons.map((b) => b.getAttribute('aria-expanded') === 'true');

  function render() {
    buttons.forEach((b, i) => {
      b.setAttribute('aria-expanded', String(state[i]));
      if (panels[i]) panels[i].hidden = !state[i];
      // A section that cannot be collapsed is announced as such.
      const locked = state[i] && options.allowToggle === false && !options.allowMultiple;
      if (locked) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    });
  }

  buttons.forEach((b, i) => b.addEventListener('click', () => {
    state = toggleSection(state, i, options);
    render();
  }));
  container.addEventListener('keydown', (event) => {
    const current = buttons.indexOf(event.target);
    if (current === -1) return;
    const next = nextHeaderIndex(current, event.key, buttons.length);
    if (next === null) return;
    event.preventDefault();
    buttons[next].focus();
  });
  render();
  return { getState: () => state.slice() };
}
