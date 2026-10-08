// device-frames/frame.js — MIT License, Copyright (c) 2026 ghanemja
// Put an image inside a device frame SVG. Works in Node and the browser.

const ROOT = /<svg\b[^>]*>/;

/** Read the screen rectangle a frame SVG documents in its data-screen attributes. */
export function parseScreen(svg) {
  const root = String(svg).match(ROOT);
  const attr = (name) => root && (root[0].match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
  const nums = (s) => (s || '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
  const rect = nums(attr('data-screen'));
  if (rect.length !== 4 || rect.some((v) => !Number.isFinite(v))) {
    throw new Error('frame SVG has no valid data-screen="x y width height" attribute');
  }
  let radius = nums(attr('data-screen-radius'));
  if (radius.length === 0) radius = [0];
  if (radius.length === 1) radius = [radius[0], radius[0], radius[0], radius[0]];
  const [x, y, width, height] = rect;
  return { x, y, width, height, radius };
}

/** Path data for a rectangle with per-corner radii [topLeft, topRight, bottomRight, bottomLeft]. */
export function roundedRect({ x, y, width: w, height: h, radius: [tl, tr, br, bl] }) {
  const a = (r, ex, ey) => (r ? `A${r} ${r} 0 0 1 ${ex} ${ey}` : '');
  return `M${x + tl} ${y}H${x + w - tr}${a(tr, x + w, y + tr)}V${y + h - br}${a(br, x + w - br, y + h)}` +
    `H${x + bl}${a(bl, x, y + h - bl)}V${y + tl}${a(tl, x + tl, y)}Z`;
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return (h >>> 0).toString(36); };
const FIT = { cover: 'xMidYMid slice', contain: 'xMidYMid meet', fill: 'none' };

/**
 * Wrap an image URL into a frame. Returns the frame SVG markup with the image
 * clipped to the screen area and drawn underneath the frame.
 * @param {string} svg      frame SVG markup (one of the files in svg/)
 * @param {string} imageUrl any URL an <image href> accepts (https:, data:, blob:, relative)
 * @param {{fit?: 'cover'|'contain'|'fill', id?: string, background?: string}} [options]
 */
export function frame(svg, imageUrl, options = {}) {
  const { fit = 'cover', background } = options;
  if (!(fit in FIT)) throw new Error(`fit must be one of ${Object.keys(FIT).join(', ')}`);
  const markup = String(svg);
  const screen = parseScreen(markup);
  const id = options.id || `screen-${hash(markup + imageUrl)}`;
  const { x, y, width, height } = screen;
  const inner =
    `<defs><clipPath id="${escape(id)}"><path d="${roundedRect(screen)}"/></clipPath></defs>` +
    `<g clip-path="url(#${escape(id)})">` +
    (background ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escape(background)}"/>` : '') +
    `<image href="${escape(imageUrl)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${FIT[fit]}"/></g>`;
  // keep <title> first for accessibility, then the screenshot, then the frame on top
  const open = markup.match(ROOT)[0];
  const rest = markup.slice(markup.indexOf(open) + open.length);
  const title = rest.match(/^\s*<title>[\s\S]*?<\/title>/);
  const head = markup.slice(0, markup.indexOf(open) + open.length) + (title ? title[0] : '');
  return head + inner + rest.slice(title ? title[0].length : 0);
}
