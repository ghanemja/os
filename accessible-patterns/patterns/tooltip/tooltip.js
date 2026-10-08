// Tooltip (WAI-ARIA APG "Tooltip" pattern, plus WCAG 1.4.13 "Content on Hover or Focus").
//
// Markup:
//   <button type="button" aria-describedby="tip1">Save</button>
//   <div role="tooltip" id="tip1" hidden>Saves without closing the file</div>
// Usage:
//   createTooltip(trigger);
// The tooltip shows on focus and hover, stays while the pointer is over it
// (hoverable), and Escape hides it without moving focus (dismissible).

/**
 * Pure state machine. state: { visible, focused, hoverTrigger, hoverTip, dismissed }.
 * events: 'focus' | 'blur' | 'enter' | 'leave' | 'tipenter' | 'tipleave' | 'escape'.
 */
export function tooltipReducer(state, event) {
  const s = { ...state };
  switch (event) {
    case 'focus': s.focused = true; s.dismissed = false; break;
    case 'blur': s.focused = false; s.dismissed = false; break;
    case 'enter': s.hoverTrigger = true; s.dismissed = false; break;
    case 'leave': s.hoverTrigger = false; break;
    case 'tipenter': s.hoverTip = true; break;
    case 'tipleave': s.hoverTip = false; break;
    case 'escape': s.dismissed = true; break;
    default: return state;
  }
  s.visible = !s.dismissed && (s.focused || s.hoverTrigger || s.hoverTip);
  return s;
}

export const initialTooltipState = Object.freeze({ visible: false, focused: false, hoverTrigger: false, hoverTip: false, dismissed: false });

/** Wire up a tooltip for `trigger` (which references it with aria-describedby). */
export function createTooltip(trigger, { showDelay = 300, hideDelay = 150 } = {}) {
  const doc = trigger.ownerDocument;
  const tip = doc.getElementById(trigger.getAttribute('aria-describedby'));
  let state = initialTooltipState;
  let timer = null;

  function apply(event) {
    const before = state.visible;
    state = tooltipReducer(state, event);
    clearTimeout(timer);
    if (state.visible === before) return;
    const immediate = event === 'focus' || event === 'escape' || event === 'blur';
    const delay = immediate ? 0 : state.visible ? showDelay : hideDelay;
    timer = setTimeout(() => { tip.hidden = !state.visible; }, delay);
  }

  trigger.addEventListener('focus', () => apply('focus'));
  trigger.addEventListener('blur', () => apply('blur'));
  trigger.addEventListener('pointerenter', () => apply('enter'));
  trigger.addEventListener('pointerleave', () => apply('leave'));
  tip.addEventListener('pointerenter', () => apply('tipenter'));
  tip.addEventListener('pointerleave', () => apply('tipleave'));
  // Escape works wherever focus is, since a hover tooltip may not have focus.
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.visible) apply('escape');
  });
  tip.hidden = true;
  return { getState: () => state };
}
