// Modal dialog (WAI-ARIA APG "Dialog (Modal)" pattern). No dependencies.
//
// Markup:
//   <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title" hidden> ... </div>
// Usage:
//   const dialog = createModal(document.getElementById('dlg'));
//   openButton.addEventListener('click', () => dialog.open());

export const FOCUSABLE_SELECTOR = [
  'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'iframe', 'object', 'embed',
  'summary', 'audio[controls]', 'video[controls]', '[contenteditable]', '[tabindex]',
].join(',');

const DISABLEABLE = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET', 'OPTGROUP', 'OPTION']);

/**
 * Can this element be reached with Tab? Works on anything with the DOM's
 * getAttribute/hasAttribute/tagName, so it is testable without a browser.
 * `isVisible` defaults to "has a layout box" in browsers.
 */
export function isTabbable(el, { isVisible = defaultIsVisible } = {}) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toUpperCase();
  const tabindexAttr = el.getAttribute('tabindex');
  if (tabindexAttr !== null && Number.parseInt(tabindexAttr, 10) < 0) return false;
  if (DISABLEABLE.has(tag) && el.hasAttribute('disabled')) return false;
  if (tag === 'INPUT' && (el.getAttribute('type') || '').toLowerCase() === 'hidden') return false;
  if ((tag === 'A' || tag === 'AREA') && !el.hasAttribute('href') && tabindexAttr === null) return false;
  if ((tag === 'AUDIO' || tag === 'VIDEO') && !el.hasAttribute('controls') && tabindexAttr === null) return false;
  const ce = el.getAttribute('contenteditable');
  const natively = /^(A|AREA|BUTTON|INPUT|SELECT|TEXTAREA|IFRAME|OBJECT|EMBED|SUMMARY|AUDIO|VIDEO)$/.test(tag) ||
    (ce !== null && ce !== 'false');
  if (!natively && tabindexAttr === null) return false;
  if (el.closest && el.closest('[inert],[hidden]')) return false;
  return isVisible(el);
}

function defaultIsVisible(el) {
  if (typeof el.getClientRects !== 'function') return true;
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

/** Tabbable descendants of `container`, in DOM order. */
export function getTabbable(container, opts) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => isTabbable(el, opts));
}

/**
 * Where Tab / Shift+Tab should go next inside the trap. `current` is the index
 * of the focused element (-1 if focus is elsewhere). Returns -1 when there is
 * nothing to focus.
 */
export function nextTrapIndex(current, count, shiftKey) {
  if (count <= 0) return -1;
  if (current < 0) return shiftKey ? count - 1 : 0;
  return shiftKey ? (current - 1 + count) % count : (current + 1) % count;
}

/**
 * Elements to make inert so only `dialog` is interactive: every sibling of
 * the dialog and of each of its ancestors, up to <body>.
 */
export function getBackgroundElements(dialog) {
  const out = [];
  let node = dialog;
  while (node && node.parentElement) {
    const parent = node.parentElement;
    for (const sibling of parent.children) {
      if (sibling !== node && !/^(SCRIPT|STYLE|TEMPLATE)$/i.test(sibling.tagName)) out.push(sibling);
    }
    if (/^BODY$/i.test(parent.tagName)) break;
    node = parent;
  }
  return out;
}

/** Wire up a role="dialog" element. Returns { open, close, isOpen }. */
export function createModal(dialog, { onClose, initialFocus, closeOnBackdrop = true } = {}) {
  const doc = dialog.ownerDocument;
  let returnFocusTo = null;
  let madeInert = [];
  let backdrop = null;

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = getTabbable(dialog);
    const next = nextTrapIndex(items.indexOf(doc.activeElement), items.length, event.shiftKey);
    event.preventDefault();
    (next === -1 ? dialog : items[next]).focus();
  }

  function open(trigger = doc.activeElement) {
    if (!dialog.hidden) return;
    returnFocusTo = trigger;
    dialog.hidden = false;
    if (closeOnBackdrop) {
      backdrop = doc.createElement('div');
      backdrop.className = 'dialog-backdrop';
      backdrop.addEventListener('click', () => close());
      dialog.before(backdrop);
    }
    madeInert = getBackgroundElements(dialog).filter((el) => el !== backdrop && !el.inert);
    for (const el of madeInert) el.inert = true;
    doc.body.classList.add('has-modal');
    dialog.addEventListener('keydown', onKeydown);
    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    const target = (typeof initialFocus === 'function' ? initialFocus() : initialFocus) ||
      dialog.querySelector('[autofocus]') || getTabbable(dialog)[0] || dialog;
    target.focus();
  }

  function close() {
    if (dialog.hidden) return;
    dialog.hidden = true;
    dialog.removeEventListener('keydown', onKeydown);
    for (const el of madeInert) el.inert = false;
    madeInert = [];
    backdrop?.remove();
    backdrop = null;
    doc.body.classList.remove('has-modal');
    if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus();
    onClose?.();
  }

  for (const btn of dialog.querySelectorAll('[data-dialog-close]')) btn.addEventListener('click', () => close());
  return { open, close, isOpen: () => !dialog.hidden };
}
