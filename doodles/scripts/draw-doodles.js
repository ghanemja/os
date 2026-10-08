#!/usr/bin/env node
// Draws every doodle in svg/. MIT License, Copyright (c) 2026 ghanemja
// Each doodle is a few points or a parametric curve, jittered with a seeded
// random generator and smoothed into Bezier curves, so the output is
// hand-drawn looking but identical on every run.
// Usage: node scripts/draw-doodles.js   (then: npm run build)
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../svg', import.meta.url));
mkdirSync(OUT, { recursive: true });

let seed = 1;
function rand() { // mulberry32
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const r = (a = 1) => (rand() * 2 - 1) * a;
const { sin, cos, PI, hypot, atan2 } = Math;
const TAU = PI * 2;

// ---- path model: array of subpaths; subpath = array of [cmd, ...points]
let paths;
const begin = () => { paths = []; };

function jitter(pts, a) { return pts.map(([x, y], i) => (i === 0 || i === pts.length - 1) ? [x + r(a * 0.4), y + r(a * 0.4)] : [x + r(a), y + r(a)]); }

// Catmull-Rom spline through points -> cubic beziers
function smooth(pts) {
  const sp = [['M', pts[0]]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    sp.push(['C', c1, c2, p2]);
  }
  paths.push(sp);
}
// straight-ish polyline: each segment slightly bowed
function sketch(pts, bow = 1.2) {
  const sp = [['M', pts[0]]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const len = hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
    const k = r(bow) * Math.min(1, len / 30);
    sp.push(['Q', [(a[0] + b[0]) / 2 + nx * k, (a[1] + b[1]) / 2 + ny * k], b]);
  }
  paths.push(sp);
}
const line = (a, b, bow = 1.5) => sketch([a, b], bow);
// sample a parametric curve
function curve(fn, n, j = 0.8) { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(i / n)); smooth(jitter(pts, j)); return pts; }

// arrowhead at tip pointing in direction `ang` (radians, direction of travel)
function head(tip, ang, len = 12, spread = 0.5) {
  const a1 = ang + PI - spread + r(0.08), a2 = ang + PI + spread + r(0.08);
  const l1 = len * (1 + r(0.12)), l2 = len * (1 + r(0.12));
  const p1 = [tip[0] + cos(a1) * l1, tip[1] + sin(a1) * l1];
  const p2 = [tip[0] + cos(a2) * l2, tip[1] + sin(a2) * l2];
  sketch([p1, [tip[0] + r(0.3), tip[1] + r(0.3)], p2], 0.8);
}
const dirOf = (pts) => { const a = pts[pts.length - 3] || pts[0], b = pts[pts.length - 1]; return atan2(b[1] - a[1], b[0] - a[0]); };
const dirStart = (pts) => { const a = pts[2] || pts[1], b = pts[0]; return atan2(b[1] - a[1], b[0] - a[0]); };

// ---- serialize
const f = (n) => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? '0' : String(v); };
function finish(name, title) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sp of paths) for (const [, ...ps] of sp) for (const [x, y] of ps) {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const pad = 4;
  const ox = Math.floor(minX) - pad, oy = Math.floor(minY) - pad;
  const w = Math.ceil(maxX) + pad - ox, h = Math.ceil(maxY) + pad - oy;
  const d = paths.map((sp) => sp.map(([c, ...ps]) => c + ps.map(([x, y]) => f(x - ox) + ' ' + f(y - oy)).join(' ')).join('')).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>${title}</title><path d="${d}"/></svg>\n`;
  writeFileSync(`${OUT}/${name}.svg`, svg);
}

const doodles = [];
const def = (name, title, fn) => doodles.push({ name, title, fn });

// ================= ARROWS =================
def('arrow-straight', 'Straight arrow', () => {
  const pts = curve((t) => [t * 110, sin(t * PI) * -3], 6, 0.6);
  head(pts.at(-1), dirOf(pts) - 0.05, 13);
});
def('arrow-curved', 'Curved arrow', () => {
  const pts = curve((t) => [t * 110, -sin(t * PI) * 34 + t * 10], 10, 0.6);
  head(pts.at(-1), dirOf(pts), 13);
});
def('arrow-loop', 'Looping arrow', () => {
  const pts = curve((t) => {
    const x = t * 130, y = -sin(t * PI) * 8;
    if (t < 0.38 || t > 0.62) return [x, y];
    const a = ((t - 0.38) / 0.24) * TAU;
    return [x - sin(a) * 20, y - (1 - cos(a)) * 17];
  }, 44, 0.3);
  head(pts.at(-1), dirOf(pts), 13);
});
def('arrow-swoosh', 'Swoosh arrow', () => {
  const pts = curve((t) => [t * 120, -(t * t) * 40 + sin(t * PI) * 18], 12, 0.5);
  head(pts.at(-1), dirOf(pts), 13);
});
def('arrow-zigzag', 'Zigzag arrow', () => {
  const pts = [[0, 0], [22, -18], [44, 0], [66, -18], [88, 0], [112, -16]].map(([x, y]) => [x + r(1.5), y + r(1.5)]);
  sketch(pts, 1.5);
  head(pts.at(-1), atan2(pts[5][1] - pts[4][1], pts[5][0] - pts[4][0]), 13);
});
def('arrow-down-curve', 'Arrow curving down', () => {
  const pts = curve((t) => [sin(t * PI * 0.5) * 70, 70 - cos(t * PI * 0.5) * 70], 10, 0.5);
  head(pts.at(-1), dirOf(pts), 13);
});
def('arrow-up-right', 'Arrow pointing up and right', () => {
  const pts = curve((t) => [t * 80, -t * 70 + sin(t * PI) * 12], 8, 0.5);
  head(pts.at(-1), dirOf(pts), 13);
});
def('arrow-double', 'Double-headed arrow', () => {
  const pts = curve((t) => [t * 120, -sin(t * PI) * 14], 10, 0.5);
  head(pts.at(-1), dirOf(pts), 12);
  head(pts[0], dirStart(pts), 12);
});
def('arrow-spiral', 'Spiral arrow', () => {
  const pts = curve((t) => {
    const a = t * TAU * 1.6 + PI; const rad = 4 + t * 38;
    return [cos(a) * rad + t * 60, sin(a) * rad];
  }, 40, 0.3);
  head(pts.at(-1), dirOf(pts), 12);
});
def('arrow-s-curve', 'S-curve arrow', () => {
  const pts = curve((t) => [t * 120, sin(t * TAU) * 20], 14, 0.5);
  head(pts.at(-1), dirOf(pts), 13);
});
def('arrow-hook', 'Hook arrow turning back', () => {
  const pts = curve((t) => {
    if (t < 0.45) return [(t / 0.45) * 70, 0];
    const u = ((t - 0.45) / 0.55) * PI;
    return [70 + sin(u) * 30, -cos(u) * 30];
  }, 20, 0.4);
  head(pts.at(-1), dirOf(pts), 12);
});
def('arrow-wavy', 'Wavy arrow', () => {
  const pts = curve((t) => [t * 120, sin(t * TAU * 2.5) * 6 - t * 6], 24, 0.4);
  head(pts.at(-1), dirOf(pts), 12);
});
def('arrow-bounce', 'Bouncing arrow', () => {
  const pts = curve((t) => [t * 130, -Math.abs(sin(t * PI * 3)) * 30 * (1 - t * 0.55)], 36, 0.3);
  head(pts.at(-1), dirOf(pts), 12);
});
def('arrow-circle-back', 'Circular arrow', () => {
  const pts = curve((t) => { const a = -PI / 2 + t * TAU * 0.82; return [cos(a) * 36, sin(a) * 34]; }, 24, 0.4);
  head(pts.at(-1), dirOf(pts), 12);
});

// ================= CIRCLES =================
function ring(rx, ry, turns, wob, j = 0.6, tilt = 0) {
  const ph = rand() * TAU, ph2 = rand() * TAU;
  return curve((t) => {
    const a = -2.4 + t * TAU * turns;
    const rr = 1 + sin(a * 2 + ph) * wob + sin(a * 3 + ph2) * wob * 0.5 + t * (0.03 + 0.03 * turns);
    const x = cos(a) * rx * rr + t * turns * 3, y = sin(a) * ry * rr + t * turns * 1.5;
    return [x * cos(tilt) - y * sin(tilt), x * sin(tilt) + y * cos(tilt)];
  }, Math.round(28 * turns), j);
}
def('circle-scribble', 'Scribbled circle', () => ring(70, 34, 1.15, 0.03, 0.6, -0.05));
def('circle-double', 'Double loop circle', () => ring(70, 34, 2.05, 0.05, 0.5, 0.04));
def('circle-round', 'Hand-drawn round circle', () => ring(44, 42, 1.12, 0.025, 0.5));
def('circle-messy', 'Messy multi-loop circle', () => ring(66, 32, 3.1, 0.08, 0.6, -0.06));
def('circle-oval-tilted', 'Tilted oval', () => ring(72, 26, 1.18, 0.04, 0.5, -0.18));

// ================= UNDERLINES =================
def('underline-simple', 'Simple underline', () => { curve((t) => [t * 150, sin(t * PI) * 3 - t * 4], 8, 0.6); });
def('underline-wavy', 'Wavy underline', () => { curve((t) => [t * 150, sin(t * TAU * 4) * 4], 40, 0.3); });
def('underline-double', 'Double underline', () => {
  curve((t) => [t * 150, sin(t * PI) * 2 - t * 3], 8, 0.6);
  curve((t) => [8 + t * 134, 9 + sin(t * PI) * 2 - t * 2], 8, 0.6);
});
def('underline-swoosh', 'Swoosh underline', () => { curve((t) => [t * 150, -sin(t * PI) * 6 - t * 8], 10, 0.5); });
def('underline-zigzag', 'Zigzag underline', () => {
  const pts = []; for (let i = 0; i <= 12; i++) pts.push([i * 12.5 + r(1), (i % 2 ? 7 : 0) + r(1)]);
  sketch(pts, 0.8);
});
def('underline-scribble', 'Back-and-forth scribble underline', () => {
  curve((t) => {
    const k = t * 3; const seg = Math.min(2, Math.floor(k)); const u = k - seg;
    const dir = seg % 2 === 0 ? u : 1 - u;
    return [dir * 150 + (seg % 2 ? 6 : 0), seg * 5 + sin(dir * PI) * 2 + u * 2];
  }, 40, 0.4);
});
def('underline-loop', 'Looped underline', () => {
  curve((t) => { const a = t * TAU * 4; return [t * 150 + sin(a) * 13, -cos(a) * 9 + 9]; }, 70, 0.3);
});

// ================= SQUIGGLES =================
def('squiggle-wave', 'Wave squiggle', () => { curve((t) => [t * 120, sin(t * TAU * 2) * 12], 30, 0.4); });
def('squiggle-loops', 'Curly loop squiggle', () => {
  curve((t) => { const a = t * TAU * 5; return [t * 120 + sin(a) * 9, -cos(a) * 12]; }, 90, 0.25);
});
def('squiggle-spring', 'Spring coil', () => {
  curve((t) => { const a = t * TAU * 6; return [cos(a) * 14 + t * 6, t * 110 + sin(a) * 6]; }, 110, 0.25);
});
def('squiggle-scribble', 'Scribble blob', () => {
  curve((t) => { const a = t * TAU * 7; return [sin(a) * 26 + t * 70, cos(a * 1.08) * 22 + sin(t * PI * 3) * 4]; }, 130, 0.5);
});

// ================= STARS / SPARKLES =================
function starPts(cx, cy, R, ri, n = 5, rot = -PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * PI) / n, rr = i % 2 ? ri : R;
    pts.push([cx + cos(a) * rr + r(1.6), cy + sin(a) * rr + r(1.6)]);
  }
  // overshoot slightly past the start for a hand-drawn close
  const p0 = pts[0], p1 = pts[1];
  pts.push([p0[0] + r(1), p0[1] + r(1)], [p0[0] + (p1[0] - p0[0]) * 0.12, p0[1] + (p1[1] - p0[1]) * 0.12]);
  return pts;
}
def('star', 'Five-point star', () => sketch(starPts(0, 0, 40, 17), 1.5));
def('star-double', 'Double-stroked star', () => {
  sketch(starPts(0, 0, 40, 17), 1.5);
  sketch(starPts(1.5, 1, 40, 17).slice(0, 8), 1.2);
});
def('star-trio', 'Three little stars', () => {
  sketch(starPts(0, 0, 22, 9), 1); sketch(starPts(42, -20, 14, 6, 5, -PI / 2 + 0.3), 0.8); sketch(starPts(40, 22, 10, 4.5, 5, -PI / 2 - 0.2), 0.6);
});
function sparkle(cx, cy, s) {
  // four-point sparkle made of curved diamond
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const a = -PI / 2 + (i * PI) / 2;
    const tip = [cx + cos(a) * s, cy + sin(a) * s];
    const b = a + PI / 4;
    const inner = [cx + cos(b) * s * 0.18, cy + sin(b) * s * 0.18];
    pts.push(tip); if (i < 4) pts.push(inner);
  }
  const sp = [['M', pts[0]]];
  for (let i = 1; i < pts.length; i += 2) {
    const c = pts[i], to = pts[i + 1];
    sp.push(['Q', [c[0] + r(0.6), c[1] + r(0.6)], [to[0] + r(0.5), to[1] + r(0.5)]]);
  }
  paths.push(sp);
}
def('sparkle', 'Four-point sparkle', () => sparkle(0, 0, 36));
def('sparkle-trio', 'Sparkle trio', () => { sparkle(0, 0, 28); sparkle(34, -26, 14); sparkle(30, 24, 9); });
def('sparkle-burst', 'Burst of lines', () => {
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + r(0.08), r1 = 14 + r(2), r2 = (i % 2 ? 30 : 38) + r(2);
    line([cos(a) * r1, sin(a) * r1], [cos(a) * r2, sin(a) * r2], 1);
  }
});
def('sparkle-plus', 'Plus sparkles', () => {
  const plus = (x, y, s) => { line([x - s, y + r(0.6)], [x + s, y + r(0.6)], 0.6); line([x + r(0.6), y - s], [x + r(0.6), y + s], 0.6); };
  plus(0, 0, 14); plus(30, -18, 7); plus(26, 20, 5);
  paths.push([['M', [-24, 20]], ['C', [-24, 16], [-17, 16], [-17, 20]], ['C', [-17, 24], [-24, 24], [-23.8, 20.4]]]);
});

// ================= HEARTS =================
function heart(cx, cy, s, j = 0.7) {
  return curve((t) => {
    const a = t * TAU * 1.04 + 0.06;
    const x = 16 * sin(a) ** 3;
    const y = -(13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
    return [cx + x * s, cy + y * s];
  }, 34, j);
}
def('heart', 'Heart', () => heart(0, 0, 2.6));
def('heart-double', 'Double-stroked heart', () => { heart(0, 0, 2.6); heart(2, 1.5, 2.45, 1); });
def('heart-pair', 'Two hearts', () => { heart(0, 0, 1.9); heart(40, -18, 1.1, 0.5); });

// ================= BRACKETS =================
function curly(dir) {
  const s = dir; // 1 = left "{", -1 = right "}"
  curve((t) => {
    const y = t * 120 - 60;
    const ay = Math.abs(y);
    const x = ay < 10 ? -12 * (1 - ay / 10) ** 2 : 0;
    const bend = (1 - Math.min(1, (60 - ay) / 12)) ** 2 * 10;
    return [s * (x + bend), y];
  }, 40, 0.3);
}
def('bracket-curly-left', 'Left curly bracket', () => curly(1));
def('bracket-curly-right', 'Right curly bracket', () => curly(-1));
def('bracket-square-left', 'Left square bracket', () => sketch([[16, -58], [1, -60], [0, 60], [17, 58]], 1.6));
def('bracket-square-right', 'Right square bracket', () => sketch([[-16, -58], [-1, -60], [0, 60], [-17, 58]], 1.6));
def('bracket-corners', 'Corner frame marks', () => {
  const W = 140, H = 80, L = 20;
  sketch([[0, L], [r(1), r(1)], [L, 0]], 1); sketch([[W - L, 0], [W + r(1), r(1)], [W, L]], 1);
  sketch([[W, H - L], [W + r(1), H + r(1)], [W - L, H]], 1); sketch([[L, H], [r(1), H + r(1)], [0, H - L]], 1);
});

// ================= HIGHLIGHTS =================
def('highlight-scribble', 'Highlighter scribble fill', () => {
  const pts = []; const n = 15;
  for (let i = 0; i <= n; i++) pts.push([i * 10 + r(2), (i % 2 ? 26 : 0) + r(1.5)]);
  smooth(pts);
});
def('highlight-box', 'Sketchy box', () => {
  const W = 150, H = 50;
  sketch([[0, 0], [W, 2], [W - 1, H], [1, H + 1], [-1, 3], [18, 0.5]], 2.4);
});
def('highlight-strike', 'Strike-through', () => { curve((t) => [t * 150, -t * 6 + sin(t * PI) * 2], 8, 0.5); });
def('highlight-cross-out', 'Scribble cross-out', () => {
  curve((t) => { const a = t * TAU * 6; return [t * 140 + sin(a) * 6, sin(a + PI / 2) * 10]; }, 120, 0.4);
});

// ================= LOOK HERE =================
def('look-here-lines', 'Attention lines', () => {
  line([0, 0], [-10, -22], 1); line([10, 4], [12, -24], 1); line([20, 10], [34, -10], 1);
});
def('look-here-both-sides', 'Attention lines on both sides', () => {
  line([0, 0], [-16, -10], 1); line([0, 10], [-18, 10], 1); line([0, 20], [-16, 30], 1);
  line([110, 0], [126, -10], 1); line([110, 10], [128, 10], 1); line([110, 20], [126, 30], 1);
});
def('exclamation', 'Exclamation mark', () => {
  sketch([[0, 0], [2, 52]], 1.6);
  paths.push([['M', [2.6, 66]], ['C', [5, 66], [5, 70], [2.6, 70]], ['C', [0, 70], [0, 66], [2.8, 66.4]]]);
});
def('question-mark', 'Question mark', () => {
  curve((t) => {
    if (t < 0.7) { const a = PI + 0.3 + (t / 0.7) * PI * 1.35; return [cos(a) * 18, sin(a) * 18 - 4]; }
    const u = (t - 0.7) / 0.3; return [4 - u * 4 + 6 * (1 - u), 14 + u * 20];
  }, 20, 0.4);
  paths.push([['M', [0.5, 48]], ['C', [3, 48], [3, 52], [0.5, 52]], ['C', [-2, 52], [-2, 48], [0.7, 48.4]]]);
});
def('pointer-hand-arrow', 'Look here arrow with flourish', () => {
  const pts = curve((t) => {
    if (t < 0.4) { const a = t / 0.4 * TAU * 0.9 + PI * 0.4; return [cos(a) * 12 + 12, sin(a) * 12]; }
    const u = (t - 0.4) / 0.6; return [12 + cos(PI * 0.4 + TAU * 0.9) * 12 + u * 90, sin(PI * 0.4 + TAU * 0.9) * 12 + u * 34 - sin(u * PI) * 16];
  }, 30, 0.4);
  head(pts.at(-1), dirOf(pts), 13);
});

// ================= CHECKS / CROSSES =================
def('check', 'Checkmark', () => smooth(jitter([[0, 26], [8, 32], [16, 42], [30, 20], [48, 0], [62, -10]], 0.6)));
def('check-circle', 'Checkmark in circle', () => {
  ring(40, 38, 1.1, 0.03, 0.5);
  smooth(jitter([[-18, 2], [-11, 9], [-5, 16], [6, 0], [24, -18]], 0.5));
});
def('check-box', 'Checked box', () => {
  sketch([[0, 4], [50, 0], [52, 50], [2, 52], [0, 2]], 1.8);
  smooth(jitter([[10, 26], [17, 32], [24, 42], [40, 14], [62, -10]], 0.5));
});
def('cross', 'Cross mark', () => { line([0, 0], [46, 48], 2); line([46, 2], [2, 50], 2); });
def('cross-circle', 'Cross in circle', () => {
  ring(40, 38, 1.1, 0.03, 0.5);
  line([-14, -14], [14, 15], 1.5); line([14, -14], [-14, 14], 1.5);
});
def('cross-scribble', 'Scribbled-out mark', () => {
  const pts = []; for (let i = 0; i < 9; i++) pts.push(i % 2 ? [56 + r(3), i * 6 + r(2)] : [r(3), i * 6 + 10 + r(2)]);
  smooth(pts);
});

// ================= EXTRAS =================
def('speech-bubble', 'Speech bubble', () => {
  const pts = curve((t) => {
    const a = PI * 0.62 + t * TAU * 0.96;
    return [cos(a) * 60, sin(a) * 34];
  }, 30, 0.6);
  const end = pts.at(-1);
  sketch([end, [-38, 50], [pts[0][0], pts[0][1]]], 1);
});
def('cloud', 'Cloud', () => {
  const L = [[-34, 4, 16], [-10, -12, 22], [18, -8, 18], [38, 6, 14]];
  const top = (x) => Math.min(...L.map(([cx, cy, rr]) => (Math.abs(x - cx) <= rr ? cy - Math.sqrt(rr * rr - (x - cx) ** 2) : Infinity)));
  const pts = [];
  for (let a = 2.07; a <= PI; a += 0.25) pts.push([-34 + cos(a) * 16, 4 + sin(a) * 16]);
  for (let x = -49; x <= 51; x += 4) pts.push([x, top(x)]);
  for (let a = -0.1; a <= 1.03; a += 0.25) pts.push([38 + cos(a) * 14, 6 + sin(a) * 14]);
  for (let x = 44; x >= -44; x -= 22) pts.push([x, 18 + r(0.6)]);
  smooth(jitter(pts, 0.5));
});
def('lightbulb', 'Lightbulb idea', () => {
  curve((t) => { const a = PI * 0.72 + t * PI * 1.56; return [cos(a) * 22, sin(a) * 22]; }, 20, 0.4);
  const L = [cos(PI * 0.72) * 22, sin(PI * 0.72) * 22], R = [cos(PI * 2.28) * 22, sin(PI * 2.28) * 22];
  sketch([L, [L[0] + 2, 30]], 0.8); sketch([R, [R[0] - 2, 30]], 0.8);
  line([L[0] + 1, 30], [R[0] - 1, 30], 0.6); line([L[0] + 3, 36], [R[0] - 3, 36], 0.6);
  for (const a of [-PI / 2, -PI / 2 - 0.9, -PI / 2 + 0.9, PI, 0]) line([cos(a) * 30, sin(a) * 30], [cos(a) * 40, sin(a) * 40], 0.6);
});
def('dots-trail', 'Dotted trail', () => {
  for (let i = 0; i < 7; i++) {
    const x = i * 18, y = -sin(i / 6 * PI) * 22;
    paths.push([['M', [x - 1.6 + r(0.3), y]], ['C', [x - 1.6, y - 2.2], [x + 1.6, y - 2.2], [x + 1.6, y]], ['C', [x + 1.6, y + 2.2], [x - 1.6, y + 2.2], [x - 1.4, y + 0.3]]]);
  }
});

let i = 0;
for (const d of doodles) { seed = 1000 + i++ * 7919; begin(); d.fn(); finish(d.name, d.title); }
console.log(doodles.length, 'doodles');
