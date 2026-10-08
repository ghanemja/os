import { test } from 'node:test';
import assert from 'node:assert/strict';
import confettiDefault, {
  confetti, createRng, resolveOptions, shouldSkip, createParticle, createParticles,
  stepParticle, opacityAt, isFinished, drawParticle, DEFAULTS, SHAPES, GRAVITY,
} from '../tiny-confetti.js';

const env = { width: 1000, height: 800 };

test('createRng is deterministic and in [0, 1)', () => {
  const a = createRng(42);
  const b = createRng(42);
  const seqA = Array.from({ length: 50 }, a);
  const seqB = Array.from({ length: 50 }, b);
  assert.deepEqual(seqA, seqB);
  assert.ok(seqA.every((n) => n >= 0 && n < 1));
  assert.notDeepEqual(seqA, Array.from({ length: 50 }, createRng(43)));
});

test('resolveOptions defaults to the viewport center', () => {
  const o = resolveOptions({}, env);
  assert.equal(o.x, 500);
  assert.equal(o.y, 400);
  assert.equal(o.count, DEFAULTS.count);
  assert.deepEqual(o.shapes, SHAPES);
  assert.equal(o.minimal, false);
});

test('resolveOptions uses x/y, and an origin rect wins over both', () => {
  assert.deepEqual(
    (({ x, y }) => ({ x, y }))(resolveOptions({ x: 10, y: 20 }, env)),
    { x: 10, y: 20 },
  );
  const o = resolveOptions({ x: 10, y: 20 }, { ...env, rect: { left: 100, top: 200, width: 50, height: 30 } });
  assert.equal(o.x, 125);
  assert.equal(o.y, 215);
});

test('resolveOptions sanitizes bad input', () => {
  const o = resolveOptions({
    count: -3, spread: 999, colors: [], shapes: ['triangle'], duration: 'long', reducedMotion: 'nah', size: 0,
  }, env);
  assert.equal(o.count, 0);
  assert.equal(o.spread, 360);
  assert.deepEqual(o.colors, DEFAULTS.colors);
  assert.deepEqual(o.shapes, SHAPES);
  assert.equal(o.duration, DEFAULTS.duration);
  assert.equal(o.reducedMotion, 'minimal');
  assert.equal(o.size, 1);
  assert.deepEqual(resolveOptions({ shapes: ['circle', 'nope'] }, env).shapes, ['circle']);
});

test('reduced motion: minimal burst by default', () => {
  const o = resolveOptions({ count: 200 }, { ...env, reducedMotion: true });
  assert.equal(o.minimal, true);
  assert.ok(o.count <= 16);
  assert.ok(o.velocity <= 160);
  assert.ok(o.duration <= 1200);
  const p = createParticle(o, createRng(1));
  assert.equal(p.spin, 0);
  assert.equal(p.flipSpeed, 0);
});

test('reduced motion: skip and ignore', () => {
  const rm = { ...env, reducedMotion: true };
  assert.equal(shouldSkip(resolveOptions({ reducedMotion: 'skip' }, rm), rm), true);
  assert.equal(shouldSkip(resolveOptions({ reducedMotion: 'skip' }, env), env), false);
  const ignored = resolveOptions({ reducedMotion: 'ignore' }, rm);
  assert.equal(ignored.minimal, false);
  assert.equal(ignored.count, DEFAULTS.count);
  assert.equal(shouldSkip(ignored, rm), false);
});

test('shouldSkip when count or duration is zero', () => {
  assert.equal(shouldSkip(resolveOptions({ count: 0 }, env), env), true);
  assert.equal(shouldSkip(resolveOptions({ duration: 0 }, env), env), true);
});

test('createParticles makes count particles from the start point using given colors/shapes', () => {
  const o = resolveOptions({ count: 30, x: 5, y: 6, colors: ['red', 'blue'], shapes: ['strip'] }, env);
  const ps = createParticles(o, createRng(7));
  assert.equal(ps.length, 30);
  for (const p of ps) {
    assert.equal(p.x, 5);
    assert.equal(p.y, 6);
    assert.ok(['red', 'blue'].includes(p.color));
    assert.equal(p.shape, 'strip');
    assert.ok(p.size > 0);
  }
});

test('particles launch within the spread cone (90 = up)', () => {
  const o = resolveOptions({ count: 200, spread: 60, angle: 90 }, env);
  for (const p of createParticles(o, createRng(3))) {
    assert.ok(p.vy < 0, 'moves up');
    const deg = (Math.atan2(-p.vy, p.vx) * 180) / Math.PI;
    assert.ok(deg >= 60 - 1e-9 && deg <= 120 + 1e-9, `angle ${deg}`);
    const speed = Math.hypot(p.vx, p.vy);
    assert.ok(speed <= o.velocity + 1e-9 && speed >= o.velocity * 0.45 - 1e-9);
  }
});

test('spread 0 at angle 0 shoots straight right', () => {
  const o = resolveOptions({ count: 1, spread: 0, angle: 0 }, env);
  const p = createParticle(o, createRng(9));
  assert.ok(p.vx > 0);
  assert.ok(Math.abs(p.vy) < 1e-9);
});

test('stepParticle is pure and integrates gravity and drag', () => {
  const p = { x: 0, y: 0, vx: 100, vy: 0, rotation: 0, spin: 2, flip: 0, flipSpeed: 3, size: 5 };
  const frozen = Object.freeze({ ...p });
  const next = stepParticle(frozen, 0.1, { gravity: 1, drag: 0 });
  assert.notEqual(next, frozen);
  assert.equal(frozen.x, 0);
  assert.equal(next.vx, 100);
  assert.ok(Math.abs(next.vy - GRAVITY * 0.1) < 1e-9);
  assert.ok(Math.abs(next.x - 10) < 1e-9);
  assert.ok(Math.abs(next.rotation - 0.2) < 1e-9);
  assert.ok(Math.abs(next.flip - 0.3) < 1e-9);

  const dragged = stepParticle(p, 0.5, { gravity: 0, drag: 2 });
  assert.ok(Math.abs(dragged.vx - 100 * Math.exp(-1)) < 1e-9);
  assert.equal(dragged.vy, 0);

  const zeroDt = stepParticle(p, 0);
  assert.deepEqual(zeroDt, p);
});

test('particles eventually fall under gravity', () => {
  const o = resolveOptions({ count: 20, seed: 1 }, env);
  let ps = createParticles(o, createRng(1));
  for (let i = 0; i < 300; i++) ps = ps.map((p) => stepParticle(p, 1 / 60, o));
  assert.ok(ps.every((p) => p.vy > 0));
  assert.ok(isFinished(ps, 5000 / 2, 1e9, env.height));
});

test('opacityAt holds then fades to zero', () => {
  assert.equal(opacityAt(0, 1000), 1);
  assert.equal(opacityAt(700, 1000), 1);
  assert.ok(Math.abs(opacityAt(850, 1000) - 0.5) < 1e-9);
  assert.equal(opacityAt(1000, 1000), 0);
  assert.equal(opacityAt(5, 0), 0);
});

test('isFinished by time or by every particle being below the screen', () => {
  const below = [{ y: 900, vy: 10, size: 5 }];
  const above = [{ y: 100, vy: 10, size: 5 }];
  assert.equal(isFinished(above, 3000, 3000, 800), true);
  assert.equal(isFinished(above, 100, 3000, 800), false);
  assert.equal(isFinished(below, 100, 3000, 800), true);
  assert.equal(isFinished([{ y: 900, vy: -10, size: 5 }], 100, 3000, 800), false);
  assert.equal(isFinished([], 0, 3000, 800), true);
});

test('drawParticle calls the right canvas primitives per shape', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, k) => (...args) => calls.push([k, ...args]),
    set: (_, k, v) => { calls.push([`set:${String(k)}`, v]); return true; },
  });
  for (const shape of SHAPES) {
    calls.length = 0;
    drawParticle(ctx, { x: 1, y: 2, rotation: 0, flip: 0, size: 10, color: 'red', shape }, 0.5);
    const names = calls.map((c) => c[0]);
    assert.equal(names[0], 'save');
    assert.equal(names.at(-1), 'restore');
    assert.ok(names.includes('set:globalAlpha'));
    assert.ok(names.includes(shape === 'circle' ? 'arc' : 'fillRect'));
  }
});

test('without a DOM, confetti() resolves immediately', async () => {
  assert.equal(confetti, confettiDefault);
  await confetti();
  assert.equal(typeof confetti.reset, 'function');
});

test('in a fake browser: canvas is created on demand and removed when done', async (t) => {
  const frames = [];
  let now = 0;
  let removed = 0;
  const appended = [];
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
  const canvas = {
    style: {},
    setAttribute() {},
    getContext: () => ctx,
    remove() { removed++; },
  };
  const g = globalThis;
  const saved = {};
  const fakes = {
    window: {
      innerWidth: 800, innerHeight: 600, devicePixelRatio: 2,
      matchMedia: () => ({ matches: false }),
      addEventListener() {}, removeEventListener() {},
    },
    document: { body: { appendChild: (el) => appended.push(el) }, createElement: () => canvas },
    requestAnimationFrame: (fn) => frames.push(fn),
    cancelAnimationFrame() {},
  };
  for (const k of Object.keys(fakes)) {
    saved[k] = Object.getOwnPropertyDescriptor(g, k);
    Object.defineProperty(g, k, { value: fakes[k], configurable: true, writable: true });
  }
  const perf = performance.now;
  performance.now = () => now;
  t.after(() => {
    performance.now = perf;
    for (const k of Object.keys(fakes)) {
      if (saved[k]) Object.defineProperty(g, k, saved[k]); else delete g[k];
    }
  });

  let done = false;
  const p = confetti({ count: 10, duration: 500, seed: 1 }).then(() => { done = true; });
  const p2 = confetti({ count: 5, duration: 200, seed: 2 });
  assert.equal(appended.length, 1, 'one shared canvas');
  assert.equal(canvas.width, 1600);
  assert.match(canvas.style.cssText, /position:fixed/);
  assert.match(canvas.style.cssText, /pointer-events:none/);

  for (let i = 0; i < 100 && frames.length; i++) {
    now += 16;
    frames.shift()(now);
    await null;
  }
  await p;
  await p2;
  assert.equal(done, true);
  assert.equal(removed, 1);

  // Reduced motion + skip: nothing is mounted.
  fakes.window.matchMedia = () => ({ matches: true });
  await confetti({ reducedMotion: 'skip' });
  assert.equal(appended.length, 1);
});
