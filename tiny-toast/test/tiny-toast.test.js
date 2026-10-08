import { test } from 'node:test';
import assert from 'node:assert/strict';
import toastDefault, {
  toast, createToaster, createTimer, createQueue, mergeOptions, DEFAULTS, CSS,
} from '../tiny-toast.js';

// ---------------------------------------------------------------------------
// Minimal fake DOM: just enough surface for tiny-toast.
// ---------------------------------------------------------------------------
class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.textContent = '';
    this.className = '';
    const el = this;
    this.classList = {
      add(c) { if (!el.classList.contains(c)) el.className = `${el.className} ${c}`.trim(); },
      remove(c) { el.className = el.className.split(/\s+/).filter((x) => x !== c).join(' '); },
      contains(c) { return el.className.split(/\s+/).includes(c); },
    };
  }
  get id() { return this.attributes.id; }
  set id(v) { this.attributes.id = v; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentNode = null;
    return child;
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type, props = {}) {
    for (const fn of this.listeners[type] || []) fn({ type, target: this, ...props });
  }
  find(pred) {
    for (const c of this.children) {
      if (pred(c)) return c;
      const hit = c.find(pred);
      if (hit) return hit;
    }
    return null;
  }
  findAll(pred, out = []) {
    for (const c of this.children) { if (pred(c)) out.push(c); c.findAll(pred, out); }
    return out;
  }
}

function fakeDocument() {
  const doc = {
    createElement: (tag) => new FakeElement(tag, doc),
    getElementById: (id) => doc.head.find((e) => e.id === id) || doc.body.find((e) => e.id === id),
  };
  doc.head = new FakeElement('head', doc);
  doc.body = new FakeElement('body', doc);
  return doc;
}

function fakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    now: () => now,
    setTimeout(fn, ms) { const id = nextId++; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    get pending() { return timers.size; },
    tick(ms) {
      const end = now + ms;
      for (;;) {
        let first = null;
        for (const [id, t] of timers) if (t.at <= end && (!first || t.at < first[1].at)) first = [id, t];
        if (!first) break;
        timers.delete(first[0]);
        now = first[1].at;
        first[1].fn();
      }
      now = end;
    },
  };
}

function setup() {
  const document = fakeDocument();
  const clock = fakeClock();
  const t = createToaster({ document, clock });
  const toasts = () => document.body.findAll((e) => e.className.split(' ').includes('tt-toast'));
  const live = () => toasts().filter((e) => !e.classList.contains('tt-out'));
  return { document, clock, t, toasts, live };
}

// ---------------------------------------------------------------------------
// Pure logic
// ---------------------------------------------------------------------------
test('mergeOptions applies defaults and sanitizes values', () => {
  const o = mergeOptions({}, {});
  assert.equal(o.type, 'info');
  assert.equal(o.position, 'bottom-right');
  assert.equal(o.duration, 4000);
  assert.equal(o.dismissible, true);
  assert.equal(o.action, null);

  const bad = mergeOptions({}, { type: 'nope', position: 'middle', duration: -5, max: 0 });
  assert.equal(bad.type, 'info');
  assert.equal(bad.position, 'bottom-right');
  assert.equal(bad.duration, Infinity);
  assert.equal(bad.max, Infinity);

  assert.equal(mergeOptions({}, { duration: 0 }).duration, Infinity);
  assert.equal(mergeOptions({}, { duration: Infinity }).duration, Infinity);
  assert.equal(mergeOptions({ position: 'top-left' }, { position: 'bogus' }).position, 'top-left');
  assert.equal(mergeOptions({ type: 'error' }, {}).type, 'error');
});

test('mergeOptions validates action', () => {
  assert.equal(mergeOptions({}, { action: { onClick() {} } }).action, null);
  const fn = () => {};
  assert.deepEqual(mergeOptions({}, { action: { label: 'Undo', onClick: fn } }).action, { label: 'Undo', onClick: fn });
  assert.deepEqual(mergeOptions({}, { action: { label: 'Undo' } }).action, { label: 'Undo', onClick: null });
});

test('DEFAULTS is frozen', () => {
  assert.ok(Object.isFrozen(DEFAULTS));
});

test('createTimer fires after ms and supports pause/resume', () => {
  const clock = fakeClock();
  let fired = 0;
  const timer = createTimer(() => fired++, 1000, clock).start();
  clock.tick(400);
  timer.pause();
  assert.equal(timer.remaining, 600);
  clock.tick(5000);
  assert.equal(fired, 0);
  timer.resume();
  clock.tick(599);
  assert.equal(fired, 0);
  clock.tick(1);
  assert.equal(fired, 1);
  assert.equal(timer.done, true);
  timer.start();
  clock.tick(5000);
  assert.equal(fired, 1);
});

test('createTimer with Infinity never schedules; cancel prevents firing', () => {
  const clock = fakeClock();
  let fired = 0;
  createTimer(() => fired++, Infinity, clock).start();
  assert.equal(clock.pending, 0);
  const t2 = createTimer(() => fired++, 10, clock).start();
  t2.cancel();
  clock.tick(100);
  assert.equal(fired, 0);
});

test('createQueue limits visible items and promotes in FIFO order', () => {
  const q = createQueue(2);
  assert.equal(q.add('a'), true);
  assert.equal(q.add('b'), true);
  assert.equal(q.add('c'), false);
  assert.equal(q.add('d'), false);
  assert.equal(q.remove('c'), null); // removing a waiting item promotes nothing
  assert.equal(q.remove('a'), 'd');
  assert.deepEqual(q.visible, ['b', 'd']);
  assert.equal(q.remove('zzz'), null);
});

test('createQueue accepts a limit function', () => {
  let limit = 1;
  const q = createQueue(() => limit);
  q.add(1);
  assert.equal(q.add(2), false);
  limit = 5;
  assert.equal(q.add(3), true);
});

// ---------------------------------------------------------------------------
// DOM behaviour (fake DOM)
// ---------------------------------------------------------------------------
test('module import is safe without a DOM and calls are no-ops', () => {
  assert.equal(toast, toastDefault);
  const handle = toast('hello');
  assert.equal(typeof handle.dismiss, 'function');
  handle.dismiss();
  assert.equal(typeof toast.success, 'function');
});

test('renders a toast with message, role and live region', () => {
  const { document, t, toasts } = setup();
  t('Saved!');
  const [el] = toasts();
  assert.ok(el);
  assert.equal(el.getAttribute('role'), 'status');
  assert.equal(el.getAttribute('aria-live'), 'polite');
  assert.ok(el.classList.contains('tt-info'));
  assert.equal(el.children[0].textContent, 'Saved!');
  const container = el.parentNode;
  assert.equal(container.getAttribute('data-position'), 'bottom-right');
  assert.equal(container.getAttribute('aria-live'), 'polite');
  assert.equal(container.parentNode, document.body);
});

test('message is set as text, never HTML', () => {
  const { t, toasts } = setup();
  t('<img src=x onerror=alert(1)>');
  assert.equal(toasts()[0].children[0].textContent, '<img src=x onerror=alert(1)>');
});

test('error toasts use role=alert and assertive', () => {
  const { t, toasts } = setup();
  t.error('Failed');
  const [el] = toasts();
  assert.equal(el.getAttribute('role'), 'alert');
  assert.equal(el.getAttribute('aria-live'), 'assertive');
  assert.ok(el.classList.contains('tt-error'));
});

test('shortcuts set the type', () => {
  const { t, toasts } = setup();
  t.configure({ max: 10 });
  t.success('a'); t.warning('b'); t.info('c'); t.error('d');
  const kinds = toasts().map((e) => e.className.split(' ')[1]);
  assert.deepEqual(kinds.sort(), ['tt-error', 'tt-info', 'tt-success', 'tt-warning']);
});

test('injects styles exactly once', () => {
  const { document, t } = setup();
  t('a'); t('b');
  const styles = document.head.findAll((e) => e.tagName === 'STYLE');
  assert.equal(styles.length, 1);
  assert.equal(styles[0].id, 'tiny-toast-styles');
  assert.equal(styles[0].textContent, CSS);
  // A second toaster on the same document reuses the existing <style>.
  createToaster({ document, clock: fakeClock() })('c');
  assert.equal(document.head.findAll((e) => e.tagName === 'STYLE').length, 1);
});

test('CSS has theming variables, dark mode and reduced motion', () => {
  assert.match(CSS, /--tt-bg/);
  assert.match(CSS, /prefers-color-scheme:\s*dark/);
  assert.match(CSS, /prefers-reduced-motion:\s*reduce/);
});

test('auto-dismisses after duration and removes the element after the exit animation', () => {
  const { clock, t, toasts, live } = setup();
  t('bye', { duration: 1000 });
  clock.tick(999);
  assert.equal(live().length, 1);
  clock.tick(1);
  assert.equal(live().length, 0);
  assert.equal(toasts().length, 1); // still animating out
  clock.tick(200);
  assert.equal(toasts().length, 0);
});

test('duration 0 is sticky', () => {
  const { clock, t, live } = setup();
  t('stay', { duration: 0 });
  clock.tick(1e9);
  assert.equal(live().length, 1);
});

test('handle.dismiss() closes; calling twice is harmless', () => {
  const { clock, t, toasts } = setup();
  const h = t('x');
  h.dismiss(); h.dismiss();
  clock.tick(500);
  assert.equal(toasts().length, 0);
});

test('pauses on hover and focus, resumes on leave', () => {
  const { clock, t, toasts, live } = setup();
  t('hover me', { duration: 1000 });
  const [el] = toasts();
  clock.tick(500);
  el.dispatch('mouseenter');
  clock.tick(10000);
  assert.equal(live().length, 1);
  el.dispatch('focusin');
  el.dispatch('mouseleave'); // still focused: stays paused
  clock.tick(10000);
  assert.equal(live().length, 1);
  el.dispatch('focusout');
  clock.tick(499);
  assert.equal(live().length, 1);
  clock.tick(1);
  assert.equal(live().length, 0);
});

test('close button dismisses; dismissible:false omits it', () => {
  const { clock, t, toasts } = setup();
  t('a');
  const close = toasts()[0].find((e) => e.className === 'tt-close');
  assert.equal(close.getAttribute('aria-label'), 'Dismiss notification');
  close.dispatch('click');
  clock.tick(300);
  assert.equal(toasts().length, 0);

  t('b', { dismissible: false });
  assert.equal(toasts()[0].find((e) => e.className === 'tt-close'), null);
});

test('Escape dismisses a dismissible toast', () => {
  const { clock, t, live } = setup();
  t('a', { duration: 0 });
  live()[0].dispatch('keydown', { key: 'Enter' });
  assert.equal(live().length, 1);
  live()[0].dispatch('keydown', { key: 'Escape' });
  clock.tick(300);
  assert.equal(live().length, 0);
});

test('action button calls onClick then dismisses', () => {
  const { clock, t, toasts } = setup();
  let clicked = 0;
  t('Deleted', { action: { label: 'Undo', onClick: () => clicked++ } });
  const btn = toasts()[0].find((e) => e.className === 'tt-action');
  assert.equal(btn.textContent, 'Undo');
  assert.equal(btn.type, 'button');
  btn.dispatch('click');
  assert.equal(clicked, 1);
  clock.tick(300);
  assert.equal(toasts().length, 0);
});

test('queues beyond max per position and promotes when one closes', () => {
  const { clock, t, live } = setup();
  t.configure({ max: 2, duration: 0 });
  const a = t('a'); t('b'); t('c');
  t('top', { position: 'top-center' }); // separate queue
  assert.deepEqual(live().map((e) => e.children[0].textContent).sort(), ['a', 'b', 'top']);
  a.dismiss();
  clock.tick(300);
  assert.deepEqual(live().map((e) => e.children[0].textContent).sort(), ['b', 'c', 'top']);
});

test('queued toast timer only starts once shown', () => {
  const { clock, t, live } = setup();
  t.configure({ max: 1 });
  const first = t('first', { duration: 0 });
  t('second', { duration: 1000 });
  clock.tick(5000);
  first.dismiss();
  assert.equal(live()[0].children[0].textContent, 'second');
  clock.tick(999);
  assert.equal(live().length, 1);
  clock.tick(1);
  assert.equal(live().length, 0);
});

test('dismissing a queued toast means it never shows', () => {
  const { clock, t, live } = setup();
  t.configure({ max: 1, duration: 0 });
  const first = t('first');
  const second = t('second');
  second.dismiss();
  first.dismiss();
  clock.tick(300);
  assert.equal(live().length, 0);
});

test('configure merges defaults and returns them', () => {
  const { t, toasts } = setup();
  const d = t.configure({ position: 'top-left', type: 'success' });
  assert.equal(d.position, 'top-left');
  assert.equal(d.duration, 4000);
  t('x');
  const [el] = toasts();
  assert.ok(el.classList.contains('tt-success'));
  assert.equal(el.parentNode.getAttribute('data-position'), 'top-left');
});

test('dismissAll closes visible and queued toasts', () => {
  const { clock, t, toasts } = setup();
  t.configure({ max: 1, duration: 0 });
  t('a'); t('b'); t('c');
  t.dismissAll();
  clock.tick(300);
  assert.equal(toasts().length, 0);
});

test('container is recreated if removed from the page', () => {
  const { document, t, toasts } = setup();
  t('a', { duration: 0 });
  const c = toasts()[0].parentNode;
  document.body.removeChild(c);
  t('b', { duration: 0 });
  assert.equal(toasts().length, 1);
  assert.notEqual(toasts()[0].parentNode, c);
});
