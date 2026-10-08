// Menu button (WAI-ARIA APG "Menu Button" pattern, actions menu).
//
// Markup:
//   <button type="button" id="mb" aria-haspopup="menu" aria-expanded="false" aria-controls="menu">Actions</button>
//   <ul id="menu" role="menu" aria-labelledby="mb" hidden>
//     <li role="menuitem" tabindex="-1">Cut</li> ...
//   </ul>
// Usage:
//   createMenuButton(button, { onSelect: (item) => ... });

/**
 * What a key press on the menu button does: 'first', 'last' (open the menu
 * and focus that item) or null.
 */
export function buttonKeyAction(key) {
  if (key === 'Enter' || key === ' ' || key === 'ArrowDown') return 'first';
  if (key === 'ArrowUp') return 'last';
  return null;
}

/**
 * What a key press inside the open menu does. Returns
 * { focus: index } to move focus, { close: true, restoreFocus } to close,
 * { activate: true } to choose the current item, or null.
 */
export function menuKeyAction(key, current, count) {
  if (key === 'Escape') return { close: true, restoreFocus: true };
  if (key === 'Tab') return { close: true, restoreFocus: false };
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowDown': return { focus: (current + 1) % count };
    case 'ArrowUp': return { focus: current < 0 ? count - 1 : (current - 1 + count) % count };
    case 'Home': case 'PageUp': return { focus: 0 };
    case 'End': case 'PageDown': return { focus: count - 1 };
    case 'Enter': case ' ': return { activate: true };
    default: return null;
  }
}

/**
 * Type-ahead: index of the next item (after `current`, wrapping) whose label
 * starts with `char`, or -1.
 */
export function typeaheadIndex(labels, current, char) {
  if (typeof char !== 'string' || char.length !== 1 || !/\S/.test(char)) return -1;
  const c = char.toLowerCase();
  for (let step = 1; step <= labels.length; step++) {
    const i = (current + step) % labels.length;
    if (labels[i].trim().toLowerCase().startsWith(c)) return i;
  }
  return -1;
}

/** Wire up a menu button. Returns { open, close }. */
export function createMenuButton(button, { onSelect } = {}) {
  const doc = button.ownerDocument;
  const menu = doc.getElementById(button.getAttribute('aria-controls'));
  const items = () => Array.from(menu.querySelectorAll('[role^="menuitem"]')).filter((i) => i.getAttribute('aria-disabled') !== 'true');

  function open(which = 'first') {
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const list = items();
    list[which === 'last' ? list.length - 1 : 0]?.focus();
  }
  function close(restoreFocus = true) {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
  }
  function activate(item) {
    close();
    onSelect?.(item);
  }

  button.addEventListener('click', () => (menu.hidden ? open('first') : close()));
  button.addEventListener('keydown', (event) => {
    const action = buttonKeyAction(event.key);
    if (!action) return;
    event.preventDefault(); // stops the click a native Enter/Space would fire
    open(action);
  });
  menu.addEventListener('keydown', (event) => {
    const list = items();
    const current = list.indexOf(doc.activeElement);
    const action = menuKeyAction(event.key, current, list.length);
    if (action) {
      if (event.key !== 'Tab') event.preventDefault();
      if ('focus' in action) list[action.focus].focus();
      else if (action.close) close(action.restoreFocus);
      else if (action.activate && current !== -1) activate(list[current]);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const i = typeaheadIndex(list.map((el) => el.textContent), current, event.key);
      if (i !== -1) list[i].focus();
    }
  });
  menu.addEventListener('click', (event) => {
    const item = event.target.closest('[role^="menuitem"]');
    if (item && item.getAttribute('aria-disabled') !== 'true') activate(item);
  });
  // Close when focus or a click leaves the widget.
  doc.addEventListener('pointerdown', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && !button.contains(event.target)) close(false);
  });
  menu.addEventListener('focusout', (event) => {
    if (!menu.hidden && event.relatedTarget && !menu.contains(event.relatedTarget) && event.relatedTarget !== button) close(false);
  });
  return { open, close };
}
