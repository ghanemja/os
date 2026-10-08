// Combobox with listbox popup and list autocomplete
// (WAI-ARIA APG "Combobox" pattern, editable combobox with list autocomplete).
//
// Markup:
//   <label for="fruit">Fruit</label>
//   <input id="fruit" type="text" role="combobox" aria-autocomplete="list"
//          aria-expanded="false" aria-controls="fruit-list" autocomplete="off">
//   <ul id="fruit-list" role="listbox" aria-label="Fruits" hidden></ul>
// Usage:
//   createCombobox(input, { options: ['Apple', 'Banana', ...] });
// DOM focus stays in the input; the active option is set with aria-activedescendant.

/** Options matching `query` (case-insensitive). Prefix matches come first. */
export function filterOptions(options, query, { match = 'includes' } = {}) {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice();
  const starts = [];
  const contains = [];
  for (const opt of options) {
    const label = opt.toLowerCase();
    if (label.startsWith(q)) starts.push(opt);
    else if (match === 'includes' && label.includes(q)) contains.push(opt);
  }
  return [...starts, ...contains];
}

/** Split `label` around the first case-insensitive match of `query`: [before, match, after]. */
export function splitMatch(label, query) {
  const q = query.trim();
  const i = q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i === -1) return [label, '', ''];
  return [label.slice(0, i), label.slice(i, i + q.length), label.slice(i + q.length)];
}

/**
 * Decide what a key press in the combobox input does.
 * state: { open, active (index or -1), count }.
 * Returns an object with any of: open (bool), active (index), select (index),
 * clear (bool); or null to let the key do its default text editing.
 */
export function comboboxKeyAction(key, { open, active, count }, { altKey = false } = {}) {
  switch (key) {
    case 'ArrowDown':
      if (!open) return { open: true, active: altKey || count === 0 ? -1 : 0 };
      if (count === 0) return { active: -1 };
      return { active: active < 0 || active >= count - 1 ? 0 : active + 1 };
    case 'ArrowUp':
      if (altKey) return open ? { open: false, active: -1 } : null;
      if (count === 0) return open ? { active: -1 } : { open: true, active: -1 };
      if (!open) return { open: true, active: count - 1 };
      return { active: active <= 0 ? count - 1 : active - 1 };
    case 'Enter':
      return open && active >= 0 ? { select: active, open: false, active: -1 } : null;
    case 'Escape':
      return open ? { open: false, active: -1 } : { clear: true };
    case 'Tab':
      return open ? { open: false, active: -1, passthrough: true } : null;
    default:
      return null;
  }
}

/** Wire up an editable combobox. Returns { setOptions(list) }. */
export function createCombobox(input, { options = [], onSelect, status } = {}) {
  const doc = input.ownerDocument;
  const listbox = doc.getElementById(input.getAttribute('aria-controls'));
  const baseId = listbox.id || 'combobox-list';
  let all = options.slice();
  let shown = [];
  let open = false;
  let active = -1;

  function render() {
    listbox.replaceChildren();
    shown.forEach((label, i) => {
      const li = doc.createElement('li');
      li.id = `${baseId}-opt-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      const [before, match, after] = splitMatch(label, input.value);
      li.append(before);
      if (match) {
        const mark = doc.createElement('mark');
        mark.textContent = match;
        li.append(mark);
      }
      li.append(after);
      // pointerdown + preventDefault keeps focus in the input.
      li.addEventListener('pointerdown', (e) => e.preventDefault());
      li.addEventListener('click', () => choose(i));
      listbox.append(li);
    });
    listbox.hidden = !open || shown.length === 0;
    input.setAttribute('aria-expanded', String(open && shown.length > 0));
    if (open && active >= 0) {
      const el = doc.getElementById(`${baseId}-opt-${active}`);
      input.setAttribute('aria-activedescendant', el.id);
      el.scrollIntoView?.({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
    if (status) status.textContent = open ? `${shown.length} result${shown.length === 1 ? '' : 's'} available.` : '';
  }

  function choose(i) {
    input.value = shown[i];
    open = false;
    active = -1;
    shown = filterOptions(all, input.value);
    render();
    onSelect?.(input.value);
  }

  input.addEventListener('input', () => {
    shown = filterOptions(all, input.value);
    open = true;
    active = -1;
    render();
  });
  input.addEventListener('keydown', (event) => {
    const action = comboboxKeyAction(event.key, { open: open && shown.length > 0, active, count: shown.length }, { altKey: event.altKey });
    if (!action) return;
    if (!action.passthrough) event.preventDefault();
    if (action.clear) {
      input.value = '';
      shown = all.slice();
    }
    if ('select' in action) return choose(action.select);
    if ('open' in action) {
      open = action.open;
      if (open) shown = filterOptions(all, input.value);
    }
    if ('active' in action) active = action.active;
    render();
  });
  input.addEventListener('blur', () => {
    open = false;
    active = -1;
    render();
  });
  input.addEventListener('click', () => {
    if (open) return;
    open = true;
    shown = filterOptions(all, input.value);
    render();
  });

  shown = all.slice();
  render();
  return { setOptions(list) { all = list.slice(); shown = filterOptions(all, input.value); render(); } };
}
