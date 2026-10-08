/*! tiny-toast | MIT License | https://github.com/ghanemja/tiny-toast */

export const TYPES = ['info', 'success', 'warning', 'error'];
export const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

export const DEFAULTS = Object.freeze({
  type: 'info',
  duration: 4000, // ms; 0 or Infinity keeps the toast until dismissed
  position: 'bottom-right',
  dismissible: true,
  action: null, // { label, onClick }
  max: 3, // visible toasts per position (set via configure); extra ones wait in a queue
});

const EXIT_MS = 200;

/** Merge user options over defaults and sanitize every field. Pure. */
export function mergeOptions(defaults, options) {
  const base = { ...DEFAULTS, ...defaults };
  const o = { ...base, ...(options || {}) };
  if (!TYPES.includes(o.type)) o.type = TYPES.includes(base.type) ? base.type : DEFAULTS.type;
  if (!POSITIONS.includes(o.position)) {
    o.position = POSITIONS.includes(base.position) ? base.position : DEFAULTS.position;
  }
  const d = Number(o.duration);
  o.duration = Number.isNaN(d) || d <= 0 ? Infinity : d;
  o.dismissible = Boolean(o.dismissible);
  const m = Math.floor(Number(o.max));
  o.max = m >= 1 ? m : Infinity;
  const a = o.action;
  o.action = a && typeof a.label === 'string' && a.label
    ? { label: a.label, onClick: typeof a.onClick === 'function' ? a.onClick : null }
    : null;
  return o;
}

const defaultClock = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  now: () => Date.now(),
};

/**
 * A pausable one-shot timer. `ms` of Infinity never fires.
 * The clock is injectable so the logic can be tested without real time.
 */
export function createTimer(callback, ms, clock = defaultClock) {
  let remaining = ms;
  let startedAt = 0;
  let id = null;
  let done = false;
  const timer = {
    get remaining() {
      return id === null ? remaining : Math.max(0, remaining - (clock.now() - startedAt));
    },
    get running() { return id !== null; },
    get done() { return done; },
    start() {
      if (done || id !== null || remaining === Infinity) return timer;
      startedAt = clock.now();
      id = clock.setTimeout(() => { id = null; done = true; callback(); }, remaining);
      return timer;
    },
    pause() {
      if (id === null) return timer;
      clock.clearTimeout(id);
      id = null;
      remaining = Math.max(0, remaining - (clock.now() - startedAt));
      return timer;
    },
    cancel() {
      if (id !== null) clock.clearTimeout(id);
      id = null;
      done = true;
      return timer;
    },
  };
  timer.resume = timer.start;
  return timer;
}

/** FIFO with a visible limit (a number or a function returning one). `add` returns true if shown right away. Pure data structure. */
export function createQueue(limit = Infinity) {
  const max = () => (typeof limit === 'function' ? limit() : limit);
  const visible = [];
  const waiting = [];
  return {
    visible,
    waiting,
    add(item) {
      if (visible.length < max()) { visible.push(item); return true; }
      waiting.push(item);
      return false;
    },
    /** Remove an item; returns the waiting item that should now be shown, if any. */
    remove(item) {
      const w = waiting.indexOf(item);
      if (w !== -1) { waiting.splice(w, 1); return null; }
      const v = visible.indexOf(item);
      if (v === -1) return null;
      visible.splice(v, 1);
      if (waiting.length && visible.length < max()) {
        const next = waiting.shift();
        visible.push(next);
        return next;
      }
      return null;
    },
  };
}

export const CSS = `
:where(:root){--tt-bg:#ffffff;--tt-fg:#1f2328;--tt-border:rgba(0,0,0,.08);--tt-shadow:0 6px 24px rgba(0,0,0,.14);--tt-radius:10px;--tt-font:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--tt-gap:8px;--tt-offset:16px;--tt-width:360px;--tt-z:2147483000;--tt-info:#2563eb;--tt-success:#16a34a;--tt-warning:#d97706;--tt-error:#dc2626}
@media (prefers-color-scheme:dark){:where(:root){--tt-bg:#1f2329;--tt-fg:#e6e8eb;--tt-border:rgba(255,255,255,.1);--tt-shadow:0 6px 24px rgba(0,0,0,.5);--tt-info:#60a5fa;--tt-success:#4ade80;--tt-warning:#fbbf24;--tt-error:#f87171}}
.tt-container{position:fixed;z-index:var(--tt-z);display:flex;flex-direction:column;gap:var(--tt-gap);width:min(var(--tt-width),calc(100vw - 2 * var(--tt-offset)));pointer-events:none;margin:0;padding:0}
.tt-container[data-position^="top"]{top:var(--tt-offset)}
.tt-container[data-position^="bottom"]{bottom:var(--tt-offset);flex-direction:column-reverse}
.tt-container[data-position$="left"]{left:var(--tt-offset)}
.tt-container[data-position$="right"]{right:var(--tt-offset)}
.tt-container[data-position$="center"]{left:50%;transform:translateX(-50%)}
.tt-toast{--tt-accent:var(--tt-info);pointer-events:auto;display:flex;align-items:center;gap:10px;box-sizing:border-box;padding:12px 12px 12px 14px;background:var(--tt-bg);color:var(--tt-fg);font:14px/1.4 var(--tt-font);border:1px solid var(--tt-border);border-left:4px solid var(--tt-accent);border-radius:var(--tt-radius);box-shadow:var(--tt-shadow);animation:tt-in .2s ease-out both}
.tt-toast.tt-out{animation:tt-out ${EXIT_MS}ms ease-in both}
.tt-success{--tt-accent:var(--tt-success)}.tt-warning{--tt-accent:var(--tt-warning)}.tt-error{--tt-accent:var(--tt-error)}
.tt-msg{flex:1;min-width:0;overflow-wrap:anywhere}
.tt-action,.tt-close{flex:none;font:inherit;color:inherit;background:none;border:0;border-radius:6px;cursor:pointer}
.tt-action{font-weight:600;color:var(--tt-accent);padding:4px 8px}
.tt-close{width:28px;height:28px;font-size:18px;line-height:1;opacity:.6}
.tt-action:hover,.tt-close:hover{background:var(--tt-border);opacity:1}
.tt-action:focus-visible,.tt-close:focus-visible{outline:2px solid var(--tt-accent);outline-offset:1px}
@keyframes tt-in{from{opacity:0;transform:translateY(8px) scale(.98)}}
@keyframes tt-out{to{opacity:0;transform:scale(.96)}}
@keyframes tt-fade-in{from{opacity:0}}
@keyframes tt-fade-out{to{opacity:0}}
@media (prefers-reduced-motion:reduce){.tt-toast{animation-name:tt-fade-in}.tt-toast.tt-out{animation-name:tt-fade-out}}
`;

/**
 * Create an independent toaster. `env` may supply `document` and `clock`
 * (setTimeout/clearTimeout/now); both default to the globals, looked up lazily
 * so importing this module in Node or during SSR is safe.
 */
export function createToaster(env = {}) {
  let defaults = { ...DEFAULTS };
  const queues = new Map(); // position -> queue
  const containers = new Map(); // position -> element
  const styled = new WeakSet();
  const all = new Set();
  const clock = () => env.clock || defaultClock;
  const doc = () => env.document || globalThis.document;

  function injectStyles(d) {
    if (styled.has(d)) return;
    styled.add(d);
    if (d.getElementById && d.getElementById('tiny-toast-styles')) return;
    const style = d.createElement('style');
    style.id = 'tiny-toast-styles';
    style.textContent = CSS;
    (d.head || d.body).appendChild(style);
  }

  function container(d, position) {
    let c = containers.get(position);
    if (c && c.parentNode) return c;
    c = d.createElement('section');
    c.className = 'tt-container';
    c.setAttribute('data-position', position);
    c.setAttribute('aria-label', 'Notifications');
    c.setAttribute('aria-live', 'polite');
    c.setAttribute('aria-relevant', 'additions');
    d.body.appendChild(c);
    containers.set(position, c);
    return c;
  }

  function show(item) {
    const d = doc();
    const { opts } = item;
    injectStyles(d);
    const el = d.createElement('div');
    el.className = `tt-toast tt-${opts.type}`;
    const isError = opts.type === 'error';
    el.setAttribute('role', isError ? 'alert' : 'status');
    el.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    el.setAttribute('aria-atomic', 'true');

    const msg = d.createElement('div');
    msg.className = 'tt-msg';
    msg.textContent = item.message;
    el.appendChild(msg);

    if (opts.action) {
      const btn = d.createElement('button');
      btn.type = 'button';
      btn.className = 'tt-action';
      btn.textContent = opts.action.label;
      btn.addEventListener('click', (event) => {
        if (opts.action.onClick) opts.action.onClick(event);
        item.dismiss();
      });
      el.appendChild(btn);
    }
    if (opts.dismissible) {
      const close = d.createElement('button');
      close.type = 'button';
      close.className = 'tt-close';
      close.setAttribute('aria-label', 'Dismiss notification');
      close.textContent = '×';
      close.addEventListener('click', () => item.dismiss());
      el.appendChild(close);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') item.dismiss();
      });
    }

    // Pause while the pointer or keyboard focus is on the toast.
    let hovered = false;
    let focused = false;
    const sync = () => (hovered || focused ? item.timer.pause() : item.timer.resume());
    el.addEventListener('mouseenter', () => { hovered = true; sync(); });
    el.addEventListener('mouseleave', () => { hovered = false; sync(); });
    el.addEventListener('focusin', () => { focused = true; sync(); });
    el.addEventListener('focusout', () => { focused = false; sync(); });

    item.el = el;
    container(d, opts.position).appendChild(el);
    item.timer.start();
  }

  function toast(message, options) {
    const opts = mergeOptions(defaults, options);
    const item = { message: String(message ?? ''), opts, el: null, state: 'queued' };
    item.timer = createTimer(() => item.dismiss(), opts.duration, clock());
    item.dismiss = () => {
      if (item.state === 'closing' || item.state === 'closed') return;
      const wasVisible = item.state === 'visible';
      item.state = wasVisible ? 'closing' : 'closed';
      item.timer.cancel();
      all.delete(item);
      const queue = queues.get(opts.position);
      const next = queue ? queue.remove(item) : null;
      if (wasVisible && item.el) {
        const el = item.el;
        el.classList.add('tt-out');
        clock().setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
          item.state = 'closed';
        }, EXIT_MS);
      }
      if (next) { next.state = 'visible'; show(next); }
    };

    if (!doc()) return { dismiss: item.dismiss }; // no DOM (SSR / Node): no-op
    if (!queues.has(opts.position)) queues.set(opts.position, createQueue(() => mergeOptions(defaults).max));
    all.add(item);
    if (queues.get(opts.position).add(item)) { item.state = 'visible'; show(item); }
    return { dismiss: item.dismiss };
  }

  for (const type of TYPES) {
    toast[type] = (message, options) => toast(message, { ...options, type });
  }
  toast.configure = (options = {}) => {
    defaults = { ...defaults, ...options };
    return { ...defaults };
  };
  toast.dismissAll = () => {
    // Dismiss waiting ones first so they are not promoted while the visible ones close.
    for (const item of [...all]) if (item.state === 'queued') item.dismiss();
    for (const item of [...all]) item.dismiss();
  };
  return toast;
}

export const toast = createToaster();
export default toast;
