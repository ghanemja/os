// svg-patterns — copy-paste CSS background patterns as tiny inline SVG data URIs.
// Pattern art: CC0 1.0. Code: MIT © 2026 ghanemja.

const r = (n) => Math.round(n * 100) / 100;
const r1 = (n) => Math.round(n * 10) / 10;

// Each tile: w × h user units, default size (CSS px of tile width), and a draw
// function that gets the color and returns SVG elements. Stroked shapes use `s`,
// filled shapes use `f`.
const TILES = {
  dots: { w: 20, h: 20, size: 20, draw: (s, f) => `<circle cx='10' cy='10' r='1.75' ${f}/>` },
  polka: { w: 20, h: 20, size: 24, draw: (s, f) => `<circle cx='5' cy='5' r='2' ${f}/><circle cx='15' cy='15' r='2' ${f}/>` },
  grid: { w: 20, h: 20, size: 24, draw: (s) => `<path d='M0 .5h20M.5 0v20' ${s} stroke-width='1'/>` },
  'graph-paper': {
    w: 100, h: 100, size: 100,
    draw: (s) => {
      let minor = '';
      for (let i = 20; i < 100; i += 20) minor += `M0 ${i}h100M${i} 0v100`;
      return `<path d='${minor}' ${s} stroke-width='.5' opacity='.6'/><path d='M0 .5h100M.5 0v100' ${s} stroke-width='1'/>`;
    },
  },
  'diagonal-stripes': { w: 10, h: 10, size: 12, draw: (s) => `<path d='M-1 1l2-2M0 10L10 0M9 11l2-2' ${s} stroke-width='2' stroke-linecap='square'/>` },
  'cross-hatch': {
    w: 10, h: 10, size: 12,
    draw: (s) => `<path d='M-1 1l2-2M0 10L10 0M9 11l2-2M-1 9l2 2M0 0l10 10M9-1l2 2' ${s} stroke-width='1' stroke-linecap='square'/>`,
  },
  checkerboard: { w: 20, h: 20, size: 24, draw: (s, f) => `<path d='M0 0h10v10H0zM10 10h10v10H10z' ${f}/>` },
  triangles: { w: 20, h: 18, size: 24, draw: (s, f) => `<path d='M0 18L10 0l10 18z' ${f}/>` },
  hexagons: {
    w: 17.32, h: 30, size: 28,
    draw: (s) => `<path d='M8.66 5l8.66 5v10l-8.66 5L0 20V10zM8.66 0v5M8.66 25v5' ${s} stroke-width='1'/>`,
  },
  isometric: {
    w: 10, h: 17.32, size: 20,
    draw: (s) => {
      let d = 'M0 0h10M0 8.66h10M0 17.32h10';
      for (const k of [-1, 0, 1]) d += `M${10 * k - 1} -1.73L${10 * k + 11} 19.05M${10 * k + 11} -1.73L${10 * k - 1} 19.05`;
      return `<path d='${d}' ${s} stroke-width='.75'/>`;
    },
  },
  waves: { w: 20, h: 10, size: 40, draw: (s) => `<path d='M0 5Q5 0 10 5T20 5' ${s} stroke-width='1.25'/>` },
  zigzag: { w: 20, h: 10, size: 24, draw: (s) => `<path d='M0 7.5l5-5 5 5 5-5 5 5' ${s} stroke-width='1.5' stroke-linejoin='round' stroke-linecap='round'/>` },
  circles: {
    w: 20, h: 20, size: 32,
    draw: (s) => `<g ${s} stroke-width='.75'><circle cx='10' cy='10' r='10'/><circle cx='0' cy='0' r='10'/><circle cx='20' cy='0' r='10'/><circle cx='0' cy='20' r='10'/><circle cx='20' cy='20' r='10'/></g>`,
  },
  plus: { w: 20, h: 20, size: 24, draw: (s) => `<path d='M10 6.5v7M6.5 10h7' ${s} stroke-width='1.5' stroke-linecap='round'/>` },
  diamonds: { w: 20, h: 20, size: 20, draw: (s, f) => `<path d='M10 4l6 6-6 6-6-6z' ${f}/>` },
  bricks: {
    w: 40, h: 20, size: 48,
    draw: (s) => `<path d='M0 .5h40M0 10.5h40M.5 0v10.5M20.5 10.5V20' ${s} stroke-width='1'/>`,
  },
  topography: { w: 120, h: 120, size: 240, draw: (s) => `<path d='${contours()}' ${s} stroke-width='.9'/>` },
  noise: { w: 60, h: 60, size: 60, draw: (s, f) => `<g ${f}>${noiseDots()}</g>` },
};

/** All pattern names. */
export const names = Object.keys(TILES);

// --- generated tiles -------------------------------------------------------

// Small seeded PRNG (mulberry32) so generated tiles are identical everywhere.
function prng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let noiseCache;
function noiseDots() {
  if (noiseCache) return noiseCache;
  const rand = prng(7);
  let out = '';
  for (let i = 0; i < 70; i++) {
    const x = r1(1.5 + rand() * 57), y = r1(1.5 + rand() * 57);
    const rad = r1(0.4 + rand() * 0.9), o = r1(0.35 + rand() * 0.65);
    out += `<circle cx='${x}' cy='${y}' r='${rad}' opacity='${o}'/>`;
  }
  return (noiseCache = out);
}

// Contour lines of a periodic height field (marching squares), so the tile
// wraps seamlessly in both directions.
let contourCache;
function contours() {
  if (contourCache) return contourCache;
  const N = 30, W = 120, cell = W / N, TAU = Math.PI * 2;
  const field = (x, y) => {
    const u = (x / N) * TAU, v = (y / N) * TAU;
    return Math.sin(u + 0.7) * Math.cos(v) + 0.6 * Math.sin(2 * v - u + 1.3) + 0.45 * Math.cos(2 * u + v + 0.4) + 0.3 * Math.sin(3 * u - 2 * v);
  };
  const val = [];
  for (let y = 0; y <= N; y++) { val.push([]); for (let x = 0; x <= N; x++) val[y].push(field(x % N, y % N)); }
  const levels = [-1.5, -1.05, -0.6, -0.15, 0.3, 0.75, 1.2];
  const paths = [];
  for (const lv of levels) {
    // Point where the level crosses the edge between two grid corners.
    const at = (x1, y1, x2, y2) => {
      const a = val[y1][x1], b = val[y2][x2], t = (lv - a) / (b - a);
      return [r1((x1 + (x2 - x1) * t) * cell), r1((y1 + (y2 - y1) * t) * cell)];
    };
    const segs = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const tl = val[y][x] > lv, tr = val[y][x + 1] > lv, br = val[y + 1][x + 1] > lv, bl = val[y + 1][x] > lv;
      const top = () => at(x, y, x + 1, y), right = () => at(x + 1, y, x + 1, y + 1);
      const bottom = () => at(x, y + 1, x + 1, y + 1), left = () => at(x, y, x, y + 1);
      const code = (tl << 3) | (tr << 2) | (br << 1) | bl;
      const table = {
        1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
        5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
        9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]],
        13: [[bottom, right]], 14: [[left, bottom]],
      };
      for (const [a, b] of table[code] || []) segs.push([a(), b()]);
    }
    paths.push(...chain(segs));
  }
  return (contourCache = paths.map(smooth).join(''));
}

// Join segments that share endpoints into polylines.
function chain(segs) {
  const key = (p) => p.join(',');
  const ends = new Map();
  const add = (k, i) => (ends.get(k) || ends.set(k, []).get(k)).push(i);
  segs.forEach((s, i) => { add(key(s[0]), i); add(key(s[1]), i); });
  const used = new Set(), lines = [];
  const next = (p) => (ends.get(key(p)) || []).find((i) => !used.has(i));
  for (let i = 0; i < segs.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const line = [...segs[i]];
    // extend forward
    for (let j; (j = next(line[line.length - 1])) !== undefined; ) {
      used.add(j);
      const s = segs[j];
      line.push(key(s[0]) === key(line[line.length - 1]) ? s[1] : s[0]);
    }
    // extend backward
    for (let j; (j = next(line[0])) !== undefined; ) {
      used.add(j);
      const s = segs[j];
      line.unshift(key(s[0]) === key(line[0]) ? s[1] : s[0]);
    }
    lines.push(line);
  }
  return lines;
}

// Quadratic smoothing through segment midpoints.
function smooth(pts) {
  if (pts.length < 3) return `M${pts.join('L')}`;
  const mid = (a, b) => [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)];
  let d = `M${pts[0]}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${pts[i]} ${mid(pts[i], pts[i + 1])}`;
  return d + `L${pts[pts.length - 1]}`;
}

// --- public API ------------------------------------------------------------

function check(name, color, opacity) {
  if (!TILES[name]) throw new Error(`Unknown pattern "${name}". Available: ${names.join(', ')}`);
  if (!/^[#a-zA-Z0-9(),.%\s-]+$/.test(color)) throw new Error(`Invalid color: ${color}`);
  if (!(opacity >= 0 && opacity <= 1)) throw new Error(`Opacity must be between 0 and 1, got ${opacity}`);
}

/**
 * The raw SVG tile for a pattern.
 * @param {string} name
 * @param {{ color?: string, opacity?: number }} [options]
 */
export function svg(name, { color = '#000', opacity = 1 } = {}) {
  check(name, color, opacity);
  const t = TILES[name];
  const body = t.draw(`fill='none' stroke='${color}'`, `fill='${color}'`);
  const g = opacity < 1 ? `<g opacity='${opacity}'>${body}</g>` : body;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${t.w}' height='${t.h}' viewBox='0 0 ${t.w} ${t.h}'>${g}</svg>`;
}

/** Encode SVG markup as a compact data URI (no base64). */
export function dataUri(markup) {
  return 'data:image/svg+xml,' + markup.replace(/"/g, "'").replace(/\s+/g, ' ').replace(/[%#<>{}\n]/g, encodeURIComponent);
}

/**
 * The tile size in px for a pattern at a given width.
 * @returns {{ width: number, height: number }}
 */
export function tileSize(name, size) {
  const t = TILES[name];
  if (!t) throw new Error(`Unknown pattern "${name}"`);
  const width = size ?? t.size;
  return { width: r(width), height: r((width * t.h) / t.w) };
}

/**
 * A CSS `background` value: `url("data:…") 0 0 / 20px 20px`.
 * @param {string} name pattern name, e.g. "dots"
 * @param {{ color?: string, size?: number, opacity?: number }} [options]
 *   color: any CSS color without quotes (default "#000");
 *   size: tile width in px (height keeps the tile's aspect ratio);
 *   opacity: 0–1 (default 1).
 */
export function pattern(name, { color = '#000', size, opacity = 1 } = {}) {
  const { width, height } = tileSize(name, size);
  return `url("${dataUri(svg(name, { color, opacity }))}") 0 0 / ${width}px ${height}px`;
}

/** Same as pattern(), split into style properties for frameworks. */
export function patternStyle(name, options = {}) {
  const { width, height } = tileSize(name, options.size);
  return {
    backgroundImage: `url("${dataUri(svg(name, options))}")`,
    backgroundSize: `${width}px ${height}px`,
  };
}

export default pattern;
