// Tabs (WAI-ARIA APG "Tabs" pattern) with automatic or manual activation.
//
// Markup:
//   <div role="tablist" aria-label="...">
//     <button role="tab" id="t1" aria-controls="p1" aria-selected="true">One</button> ...
//   </div>
//   <div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0"> ... </div>
// Usage:
//   createTabs(document.querySelector('[role=tablist]'), { activation: 'manual' });

/**
 * Index of the tab to move focus to for a key press, or null if the key is
 * not a tab navigation key. Wraps around and skips disabled tabs.
 * `rtl` swaps ArrowLeft/ArrowRight for right-to-left layouts.
 */
export function nextTabIndex(current, key, count, { orientation = 'horizontal', rtl = false, disabled = [] } = {}) {
  if (count <= 0) return null;
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
  const enabled = (i) => !disabled[i];
  if (![prevKey, nextKey, 'Home', 'End'].includes(key)) return null;
  if (!Array.from({ length: count }, (_, i) => i).some(enabled)) return null;
  let i;
  let step;
  if (key === 'Home') { i = 0; step = 1; }
  else if (key === 'End') { i = count - 1; step = -1; }
  else { step = key === nextKey ? 1 : -1; i = (current + step + count) % count; }
  while (!enabled(i)) {
    i = (i + step + count) % count;
  }
  return i;
}

/** Wire up a tablist. Returns { select(index), selectedIndex() }. */
export function createTabs(tablist, { activation = 'automatic', onChange } = {}) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((tab) => tablist.ownerDocument.getElementById(tab.getAttribute('aria-controls')));
  const orientation = tablist.getAttribute('aria-orientation') === 'vertical' ? 'vertical' : 'horizontal';
  let selected = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

  function select(index, { focus = true } = {}) {
    selected = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
    onChange?.(index);
  }

  tablist.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(event.target);
    if (current === -1) return;
    if (activation === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      select(current);
      return;
    }
    const rtl = getComputedStyle(tablist).direction === 'rtl';
    const disabled = tabs.map((t) => t.getAttribute('aria-disabled') === 'true');
    const next = nextTabIndex(current, event.key, tabs.length, { orientation, rtl, disabled });
    if (next === null) return;
    event.preventDefault();
    if (activation === 'automatic') select(next);
    else tabs[next].focus(); // manual: move focus only, wait for Enter/Space
  });

  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    if (tab.getAttribute('aria-disabled') !== 'true') select(i);
  }));
  select(selected, { focus: false });
  return { select, selectedIndex: () => selected };
}
