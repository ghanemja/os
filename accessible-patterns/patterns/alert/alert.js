// Alert and live region announcements (WAI-ARIA APG "Alert" pattern, plus
// role="status" for polite messages).
//
// Live regions must exist in the DOM (and be empty) before content is put in
// them, otherwise many screen readers stay silent. createAnnouncer() creates
// both regions up front.
// Usage:
//   const announcer = createAnnouncer();
//   announcer.announce('Saved');                 // polite, role="status"
//   announcer.announce('Connection lost', { assertive: true }); // role="alert"

/**
 * Text to write so that repeating the same message is still announced. Screen
 * readers ignore a live region whose text did not change, so a repeat gets a
 * trailing non-breaking space added or removed.
 */
export function nextAnnouncement(previous, message) {
  const text = String(message).trim();
  if (previous === text) return text + '\u00a0';
  if (previous === text + '\u00a0') return text;
  return text;
}

/** Attributes for a live region of the given politeness. */
export function liveRegionAttributes(assertive) {
  return assertive
    ? { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' }
    : { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' };
}

/** Create a visually hidden polite and assertive region in `root` (default body). */
export function createAnnouncer({ root = document.body, clearAfter = 7000 } = {}) {
  const doc = root.ownerDocument;
  const regions = {};
  for (const assertive of [false, true]) {
    const el = doc.createElement('div');
    for (const [k, v] of Object.entries(liveRegionAttributes(assertive))) el.setAttribute(k, v);
    el.className = 'visually-hidden';
    el.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
    root.append(el);
    regions[assertive] = el;
  }
  const timers = {};
  return {
    announce(message, { assertive = false } = {}) {
      const el = regions[assertive];
      // Writing on the next frame makes back-to-back updates more reliable.
      requestAnimationFrame(() => {
        el.textContent = nextAnnouncement(el.textContent, message);
      });
      clearTimeout(timers[assertive]);
      if (clearAfter) timers[assertive] = setTimeout(() => { el.textContent = ''; }, clearAfter);
    },
    regions,
  };
}
