/*! tiny-confetti | MIT License | https://github.com/ghanemja/tiny-confetti */

export const SHAPES = ['square', 'circle', 'strip'];

export const DEFAULTS = Object.freeze({
  x: undefined, // px from the left of the viewport; defaults to the center
  y: undefined, // px from the top of the viewport; defaults to the center
  origin: null, // an Element; the burst starts from its center
  count: 120,
  spread: 70, // degrees, the cone around `angle`
  angle: 90, // degrees; 90 = straight up
  velocity: 900, // px/s, maximum launch speed
  gravity: 1, // multiplier of GRAVITY
  drag: 1.6, // per second; higher slows particles faster
  size: 9, // px
  duration: 3000, // ms
  colors: ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
  shapes: SHAPES,
  zIndex: 2147483647,
  reducedMotion: 'minimal', // 'minimal' | 'skip' | 'ignore'
  seed: undefined, // number for repeatable bursts
});

export const GRAVITY = 1400; // px/s² at gravity: 1

/** Small seedable PRNG (mulberry32). Returns a function giving [0, 1). */
export function createRng(seed = Math.floor(Math.random() * 2 ** 32)) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/**
 * Merge options with defaults and work out the start point. Pure.
 * `env` = { width, height, reducedMotion, rect } where `rect` is the origin
 * element's bounding box, if any.
 */
export function resolveOptions(options = {}, env = {}) {
  const width = num(env.width, 0);
  const height = num(env.height, 0);
  const o = { ...DEFAULTS, ...options };
  let x = num(o.x, width / 2);
  let y = num(o.y, height / 2);
  if (env.rect) {
    x = env.rect.left + env.rect.width / 2;
    y = env.rect.top + env.rect.height / 2;
  }
  const colors = Array.isArray(o.colors) && o.colors.length ? o.colors.map(String) : DEFAULTS.colors;
  const shapes = (Array.isArray(o.shapes) ? o.shapes : []).filter((s) => SHAPES.includes(s));
  const resolved = {
    x,
    y,
    count: Math.max(0, Math.round(num(o.count, DEFAULTS.count))),
    spread: Math.min(360, Math.max(0, num(o.spread, DEFAULTS.spread))),
    angle: num(o.angle, DEFAULTS.angle),
    velocity: Math.max(0, num(o.velocity, DEFAULTS.velocity)),
    gravity: num(o.gravity, DEFAULTS.gravity),
    drag: Math.max(0, num(o.drag, DEFAULTS.drag)),
    size: Math.max(1, num(o.size, DEFAULTS.size)),
    duration: Math.max(0, num(o.duration, DEFAULTS.duration)),
    colors,
    shapes: shapes.length ? shapes : SHAPES,
    zIndex: num(o.zIndex, DEFAULTS.zIndex),
    reducedMotion: ['minimal', 'skip', 'ignore'].includes(o.reducedMotion) ? o.reducedMotion : 'minimal',
    seed: o.seed,
    minimal: false,
  };
  if (env.reducedMotion && resolved.reducedMotion === 'minimal') {
    // A gentle, short, small burst: few particles drifting a little, no spinning.
    Object.assign(resolved, {
      count: Math.min(resolved.count, 16),
      velocity: Math.min(resolved.velocity, 160),
      gravity: 0.1,
      duration: Math.min(resolved.duration, 1200),
      minimal: true,
    });
  }
  return resolved;
}

/** True when nothing should be drawn at all. Pure. */
export function shouldSkip(resolved, env = {}) {
  return resolved.count === 0 || resolved.duration === 0
    || (Boolean(env.reducedMotion) && resolved.reducedMotion === 'skip');
}

/** Create one particle. Angles in degrees, 90 = up (screen y grows downward). Pure given `rand`. */
export function createParticle(o, rand) {
  const deg = o.angle + (rand() - 0.5) * o.spread;
  const rad = (deg * Math.PI) / 180;
  const speed = o.velocity * (0.45 + rand() * 0.55);
  const shape = o.shapes[Math.floor(rand() * o.shapes.length)];
  return {
    x: o.x,
    y: o.y,
    vx: Math.cos(rad) * speed,
    vy: -Math.sin(rad) * speed,
    rotation: rand() * Math.PI * 2,
    spin: o.minimal ? 0 : (rand() - 0.5) * 12, // rad/s
    flip: rand() * Math.PI * 2, // phase of the 3D "tumble"
    flipSpeed: o.minimal ? 0 : 4 + rand() * 8,
    size: o.size * (0.6 + rand() * 0.8),
    color: o.colors[Math.floor(rand() * o.colors.length)],
    shape,
  };
}

export function createParticles(o, rand) {
  return Array.from({ length: o.count }, () => createParticle(o, rand));
}

/**
 * Advance one particle by `dt` seconds. Returns a new object. Pure.
 * Velocity decays exponentially with `drag`, then gravity accelerates it down.
 */
export function stepParticle(p, dt, { gravity = 1, drag = DEFAULTS.drag } = {}) {
  const k = Math.exp(-drag * dt);
  const vx = p.vx * k;
  const vy = p.vy * k + GRAVITY * gravity * dt;
  return {
    ...p,
    vx,
    vy,
    x: p.x + vx * dt,
    y: p.y + vy * dt,
    rotation: p.rotation + p.spin * dt,
    flip: p.flip + p.flipSpeed * dt,
  };
}

/** Opacity for a burst that has run `elapsed` of `duration` ms: full, then fades over the last 30%. Pure. */
export function opacityAt(elapsed, duration) {
  if (duration <= 0 || elapsed >= duration) return 0;
  const fadeStart = duration * 0.7;
  if (elapsed <= fadeStart) return 1;
  return 1 - (elapsed - fadeStart) / (duration - fadeStart);
}

/** Has a burst finished: time is up, or every particle has fallen below the bottom edge. Pure. */
export function isFinished(particles, elapsed, duration, height = Infinity) {
  if (elapsed >= duration) return true;
  return particles.length === 0 || particles.every((p) => p.y - p.size > height && p.vy > 0);
}

/** Draw one particle on a 2D context (CSS pixel coordinates). */
export function drawParticle(ctx, p, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  const tumble = Math.cos(p.flip); // squash on one axis to fake 3D rotation
  ctx.scale(1, Math.abs(tumble) < 0.08 ? 0.08 : tumble);
  const s = p.size;
  if (p.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.shape === 'strip') {
    ctx.fillRect(-s / 5, -s, (s * 2) / 5, s * 2);
  } else {
    ctx.fillRect(-s / 2, -s / 2, s, s);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Browser runtime: one shared canvas for all running bursts.
// ---------------------------------------------------------------------------
let canvas = null;
let ctx = null;
let frame = 0;
let last = 0;
const bursts = new Set();

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function mount(zIndex) {
  if (canvas) {
    canvas.style.zIndex = String(Math.max(Number(canvas.style.zIndex) || 0, zIndex));
    return;
  }
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${zIndex}`;
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function unmount() {
  cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener('resize', resize);
  if (canvas) canvas.remove();
  canvas = null;
  ctx = null;
}

function tick(now) {
  // Clamp dt so a background tab does not teleport particles.
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (const b of bursts) {
    b.elapsed += dt * 1000;
    b.particles = b.particles.map((p) => stepParticle(p, dt, b.o));
    if (isFinished(b.particles, b.elapsed, b.o.duration, window.innerHeight)) {
      bursts.delete(b);
      b.resolve();
      continue;
    }
    const alpha = opacityAt(b.elapsed, b.o.duration);
    for (const p of b.particles) drawParticle(ctx, p, alpha);
  }
  if (bursts.size) frame = requestAnimationFrame(tick);
  else unmount();
}

/**
 * Fire a confetti burst. Resolves when it has finished and, if it was the last
 * running burst, the canvas has been removed. Resolves immediately when there
 * is no DOM or nothing to draw.
 */
export function confetti(options = {}) {
  const hasDom = typeof window !== 'undefined' && typeof document !== 'undefined' && document.body;
  if (!hasDom) return Promise.resolve();
  const reducedMotion = Boolean(window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const el = options.origin;
  const rect = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
  const env = { width: window.innerWidth, height: window.innerHeight, reducedMotion, rect };
  const o = resolveOptions(options, env);
  if (shouldSkip(o, env)) return Promise.resolve();

  return new Promise((resolve) => {
    mount(o.zIndex);
    if (!ctx) { unmount(); resolve(); return; } // canvas unsupported
    const rand = createRng(o.seed);
    bursts.add({ o, particles: createParticles(o, rand), elapsed: 0, resolve });
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });
}

/** Stop every running burst immediately and remove the canvas. Pending promises resolve. */
confetti.reset = () => {
  for (const b of bursts) b.resolve();
  bursts.clear();
  if (canvas) unmount();
};

export default confetti;
