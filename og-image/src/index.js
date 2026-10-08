// og-image: social preview images (1200x630) as SVG strings. Zero dependencies.

export const WIDTH = 1200;
export const HEIGHT = 630;

export const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

// Approximate advance widths (1/1000 em) for a Helvetica/Arial-like sans
// font, ASCII 32..126. Close enough to wrap text for system-ui as well.
// prettier-ignore
const SANS_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // space ! " # $ % & ' ( ) * + , - . /
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, // 0-9 : ; < = > ?
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, // @ A-O
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, // P-Z [ \ ] ^ _
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, // ` a-o
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,      // p-z { | } ~
];
const BOLD_FACTOR = 1.07;

function isWide(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

/** Width of one character in em units. */
export function charWidth(ch, { mono = false, bold = false } = {}) {
  const cp = ch.codePointAt(0);
  if (cp === 0x200b || (cp >= 0x300 && cp <= 0x36f) || cp === 0xfe0f) return 0; // zero-width / combining
  if (isWide(cp)) return 1;
  if (mono) return 0.6;
  let w;
  if (cp >= 32 && cp <= 126) w = SANS_WIDTHS[cp - 32] / 1000;
  else if (cp === 0x2026) w = 1; // ellipsis
  else if (cp === 0x2014) w = 1; // em dash
  else if (cp === 0x2013) w = 0.556;
  else if (cp === 0x2018 || cp === 0x2019) w = 0.222;
  else if (cp === 0x201c || cp === 0x201d) w = 0.333;
  else if (cp >= 0x400 && cp <= 0x4ff) w = 0.6; // Cyrillic
  else w = 0.556;
  return bold ? w * BOLD_FACTOR : w;
}

/** Approximate rendered width of `text` in pixels. */
export function measureText(text, fontSize, opts = {}) {
  let em = 0;
  for (const ch of String(text)) em += charWidth(ch, opts);
  return em * fontSize;
}

function breakLongWord(word, fontSize, maxWidth, opts) {
  const parts = [];
  let current = '';
  for (const ch of word) {
    if (current && measureText(current + ch, fontSize, opts) > maxWidth) {
      parts.push(current);
      current = ch;
    } else current += ch;
  }
  if (current) parts.push(current);
  return parts;
}

/** Trim `line` until `line + ellipsis` fits in maxWidth. */
export function ellipsize(line, fontSize, maxWidth, opts = {}) {
  const ellipsis = '\u2026';
  const original = Array.from(line.replace(/\s+$/, ''));
  let chars = original.slice();
  while (chars.length && measureText(chars.join('') + ellipsis, fontSize, opts) > maxWidth) chars.pop();
  // Prefer ending on a word boundary when that keeps most of the line.
  if (chars.length < original.length && original[chars.length] !== ' ') {
    const lastSpace = chars.lastIndexOf(' ');
    if (lastSpace > chars.length * 0.6) chars = chars.slice(0, lastSpace);
  }
  return chars.join('').replace(/[\s.,;:!?\-\u2013\u2014]+$/, '') + ellipsis;
}

/**
 * Greedy word wrap. Returns { lines, truncated }. Words longer than a line are
 * broken; output beyond `maxLines` is clamped with an ellipsis on the last line.
 */
export function wrapText(text, { fontSize, maxWidth, maxLines = Infinity, bold = false, mono = false } = {}) {
  const opts = { bold, mono };
  const lines = [];
  const paragraphs = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  for (const para of paragraphs) {
    const words = para.split(/[ \t]+/).filter(Boolean);
    if (!words.length) { lines.push(''); continue; }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measureText(candidate, fontSize, opts) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      if (measureText(word, fontSize, opts) > maxWidth) {
        const parts = breakLongWord(word, fontSize, maxWidth, opts);
        lines.push(...parts.slice(0, -1));
        line = parts[parts.length - 1];
      } else line = word;
    }
    lines.push(line);
  }
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  if (lines.length <= maxLines) return { lines, truncated: false };
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = ellipsize(kept[maxLines - 1] + ' ' + lines[maxLines], fontSize, maxWidth, opts);
  return { lines: kept, truncated: true };
}

/**
 * Pick the largest font size (from `sizes`, descending) at which the text fits
 * without truncation; falls back to the smallest size, clamped.
 */
export function fitText(text, { sizes, maxWidth, maxLines, bold, mono }) {
  for (const fontSize of sizes) {
    const r = wrapText(text, { fontSize, maxWidth, maxLines, bold, mono });
    if (!r.truncated) return { ...r, fontSize };
  }
  const fontSize = sizes[sizes.length - 1];
  return { ...wrapText(text, { fontSize, maxWidth, maxLines, bold, mono }), fontSize };
}

/** Escape text for XML content and attribute values; drops characters XML forbids. */
export function escapeXml(value) {
  return String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Validate a CSS hex color (#rgb, #rgba, #rrggbb, #rrggbbaa). */
export function normalizeColor(value, name = 'color') {
  const v = String(value).trim();
  if (!/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) {
    throw new Error(`Invalid ${name} "${value}": expected a hex color like #1d4ed8`);
  }
  return v.toLowerCase();
}

function hexToRgb(hex) {
  let h = hex.slice(1);
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Relative luminance (WCAG) of a hex color, 0..1. */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Average of two hex colors, as a hex string. */
export function mixColors(a, b) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return '#' + ca.map((v, i) => Math.round((v + cb[i]) / 2).toString(16).padStart(2, '0')).join('');
}

/** Black or white text, whichever reads better on `bg`. */
export function contrastText(bg) {
  return luminance(bg) > 0.4 ? '#111827' : '#ffffff';
}

export const THEMES = {
  light: { bg: '#ffffff', fg: '#111827', muted: '#4b5563', accent: '#2563eb', subtle: '#f3f4f6' },
  dark: { bg: '#0b1020', fg: '#f9fafb', muted: '#9ca3af', accent: '#60a5fa', subtle: '#1f2937' },
};

/** Render wrapped lines as a <text> element with one <tspan> per line. */
function textBlock(lines, { x, y, fontSize, lineHeight = 1.2, fill, weight = 400, family = SANS, anchor = 'start', extra = '' }) {
  const lh = Math.round(fontSize * lineHeight);
  const spans = lines
    .map((line, i) => `<tspan x="${x}"${i === 0 ? '' : ` dy="${lh}"`}>${escapeXml(line) || ' '}</tspan>`)
    .join('');
  return `<text x="${x}" y="${y}" font-family="${escapeXml(family)}" font-size="${fontSize}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${extra}>${spans}</text>`;
}

function blockHeight(lineCount, fontSize, lineHeight = 1.2) {
  return lineCount ? fontSize + (lineCount - 1) * Math.round(fontSize * lineHeight) : 0;
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = Array.from(parts[0])[0] || '';
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
  return (first + last).toUpperCase();
}

// ---------------------------------------------------------------- templates

function minimal(o, c) {
  const pad = 96;
  const maxWidth = WIDTH - pad * 2;
  const title = fitText(o.title, { sizes: [80, 72, 64, 56], maxWidth, maxLines: 3, bold: true });
  const sub = o.subtitle ? wrapText(o.subtitle, { fontSize: 34, maxWidth, maxLines: 2 }) : { lines: [] };
  const gap = sub.lines.length ? 32 : 0;
  const total = blockHeight(title.lines.length, title.fontSize, 1.15) + gap + blockHeight(sub.lines.length, 34, 1.35);
  const top = Math.round((HEIGHT - total) / 2);
  const titleY = top + Math.round(title.fontSize * 0.8);
  const subY = top + blockHeight(title.lines.length, title.fontSize, 1.15) + gap + 28;
  return [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${c.bg}"/>`,
    `<rect x="${pad}" y="${top - 56}" width="96" height="10" rx="5" fill="${c.accent}"/>`,
    textBlock(title.lines, { x: pad, y: titleY, fontSize: title.fontSize, lineHeight: 1.15, fill: c.fg, weight: 700 }),
    sub.lines.length ? textBlock(sub.lines, { x: pad, y: subY, fontSize: 34, lineHeight: 1.35, fill: c.muted }) : '',
    o.site ? textBlock([o.site], { x: pad, y: HEIGHT - 56, fontSize: 26, fill: c.muted, weight: 600 }) : '',
  ].join('');
}

function gradient(o, c) {
  const pad = 110;
  const maxWidth = WIDTH - pad * 2;
  const fg = o.fg ? c.fg : contrastText(mixColors(c.bg, c.accent));
  const title = fitText(o.title, { sizes: [84, 76, 68, 60], maxWidth, maxLines: 3, bold: true });
  const sub = o.subtitle ? wrapText(o.subtitle, { fontSize: 34, maxWidth, maxLines: 2 }) : { lines: [] };
  const gap = sub.lines.length ? 36 : 0;
  const th = blockHeight(title.lines.length, title.fontSize, 1.12);
  const total = th + gap + blockHeight(sub.lines.length, 34, 1.35);
  const top = Math.round((HEIGHT - total) / 2);
  const cx = WIDTH / 2;
  return [
    `<defs><linearGradient id="og-grad" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.accent}"/></linearGradient>`,
    `<radialGradient id="og-glow" cx="0.85" cy="0.1" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/>`,
    `<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#og-grad)"/>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#og-glow)"/>`,
    textBlock(title.lines, { x: cx, y: top + Math.round(title.fontSize * 0.8), fontSize: title.fontSize, lineHeight: 1.12, fill: fg, weight: 800, anchor: 'middle' }),
    sub.lines.length ? textBlock(sub.lines, { x: cx, y: top + th + gap + 28, fontSize: 34, lineHeight: 1.35, fill: fg, anchor: 'middle', extra: ' fill-opacity="0.85"' }) : '',
    o.site ? textBlock([o.site], { x: cx, y: HEIGHT - 52, fontSize: 26, fill: fg, weight: 600, anchor: 'middle', extra: ' fill-opacity="0.8"' }) : '',
  ].join('');
}

function split(o, c) {
  const panel = 420;
  const pad = 72;
  const x = panel + pad;
  const maxWidth = WIDTH - x - pad;
  const onAccent = contrastText(c.accent);
  const mark = o.site ? initials(o.site) || 'Aa' : initials(o.title) || 'Aa';
  const title = fitText(o.title, { sizes: [64, 58, 52, 46], maxWidth, maxLines: 4, bold: true });
  const sub = o.subtitle ? wrapText(o.subtitle, { fontSize: 30, maxWidth, maxLines: 3 }) : { lines: [] };
  const gap = sub.lines.length ? 28 : 0;
  const th = blockHeight(title.lines.length, title.fontSize, 1.15);
  const total = th + gap + blockHeight(sub.lines.length, 30, 1.35);
  const top = Math.round((HEIGHT - total) / 2);
  const siteLines = o.site ? wrapText(o.site, { fontSize: 30, maxWidth: panel - 80, maxLines: 2, bold: true }).lines : [];
  return [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${c.bg}"/>`,
    `<rect width="${panel}" height="${HEIGHT}" fill="${c.accent}"/>`,
    `<circle cx="${panel / 2}" cy="${HEIGHT / 2 - (siteLines.length ? 40 : 0)}" r="110" fill="${onAccent}" fill-opacity="0.14"/>`,
    textBlock([mark], { x: panel / 2, y: HEIGHT / 2 - (siteLines.length ? 40 : 0) + 34, fontSize: 96, fill: onAccent, weight: 800, anchor: 'middle' }),
    siteLines.length ? textBlock(siteLines, { x: panel / 2, y: HEIGHT / 2 + 140, fontSize: 30, fill: onAccent, weight: 700, anchor: 'middle' }) : '',
    textBlock(title.lines, { x, y: top + Math.round(title.fontSize * 0.8), fontSize: title.fontSize, lineHeight: 1.15, fill: c.fg, weight: 700 }),
    sub.lines.length ? textBlock(sub.lines, { x, y: top + th + gap + 25, fontSize: 30, lineHeight: 1.35, fill: c.muted }) : '',
  ].join('');
}

function blogPost(o, c) {
  const pad = 88;
  const maxWidth = WIDTH - pad * 2;
  const title = fitText(o.title, { sizes: [72, 64, 58, 52], maxWidth, maxLines: 3, bold: true });
  const titleY = 200;
  const th = blockHeight(title.lines.length, title.fontSize, 1.15);
  const avatarY = HEIGHT - 110;
  const sepY = avatarY - 58;
  // Only as many subtitle lines as fit above the author separator.
  const subRoom = Math.max(0, Math.min(2, Math.floor((sepY - 20 - (titleY + th + 30)) / 43) + 1));
  const sub = o.subtitle && subRoom ? wrapText(o.subtitle, { fontSize: 32, maxWidth, maxLines: subRoom }) : { lines: [] };
  const meta = [o.author, o.date].filter(Boolean).join(' \u00b7 ');
  const parts = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${c.bg}"/>`,
    `<rect width="${WIDTH}" height="12" fill="${c.accent}"/>`,
    textBlock([(o.site || 'Blog').toUpperCase()], { x: pad, y: 118, fontSize: 24, fill: c.accent, weight: 700, extra: ' letter-spacing="3"' }),
    textBlock(title.lines, { x: pad, y: titleY + Math.round(title.fontSize * 0.8) - 20, fontSize: title.fontSize, lineHeight: 1.15, fill: c.fg, weight: 800 }),
    sub.lines.length ? textBlock(sub.lines, { x: pad, y: titleY + th + 30, fontSize: 32, lineHeight: 1.35, fill: c.muted }) : '',
    `<line x1="${pad}" y1="${sepY}" x2="${WIDTH - pad}" y2="${sepY}" stroke="${c.muted}" stroke-opacity="0.3" stroke-width="2"/>`,
  ];
  if (o.author) {
    parts.push(
      `<circle cx="${pad + 32}" cy="${avatarY}" r="32" fill="${c.accent}"/>`,
      textBlock([initials(o.author)], { x: pad + 32, y: avatarY + 10, fontSize: 26, fill: contrastText(c.accent), weight: 700, anchor: 'middle' }),
    );
  }
  if (meta) {
    const mx = o.author ? pad + 84 : pad;
    parts.push(textBlock(wrapText(meta, { fontSize: 28, maxWidth: WIDTH - mx - pad, maxLines: 1 }).lines,
      { x: mx, y: avatarY + 10, fontSize: 28, fill: c.fg, weight: 500 }));
  }
  return parts.join('');
}

function codeStyle(o, c) {
  const isDark = luminance(c.bg) < 0.4;
  const win = { x: 70, y: 60, w: WIDTH - 140, h: HEIGHT - 120 };
  const winBg = isDark ? '#111827' : '#1e1e2e';
  const text = '#e5e7eb';
  const comment = '#9ca3af';
  const pad = 56;
  const x = win.x + pad;
  const maxWidth = win.w - pad * 2 - 52 - 30; // room for the prompt and cursor
  const title = fitText(o.title, { sizes: [60, 54, 48, 42], maxWidth, maxLines: 3, mono: true, bold: true });
  const subWidth = win.w - pad * 2 - measureText('// ', 28, { mono: true });
  const sub = o.subtitle ? wrapText(o.subtitle, { fontSize: 28, maxWidth: subWidth, maxLines: 2, mono: true }) : { lines: [] };
  const top = win.y + 130;
  const subLines = sub.lines.map((l) => `// ${l}`);
  const th = blockHeight(title.lines.length, title.fontSize, 1.25);
  const label = o.site || 'index.ts';
  const lastLine = title.lines[title.lines.length - 1];
  const lastBaseline = top + Math.round(title.fontSize * 0.8) + (title.lines.length - 1) * Math.round(title.fontSize * 1.25);
  const cursorX = Math.round(x + 52 + measureText(lastLine, title.fontSize, { mono: true }) + 8);
  return [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${c.bg}"/>`,
    `<rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" rx="20" fill="${winBg}"/>`,
    `<rect x="${win.x}" y="${win.y}" width="${win.w}" height="56" rx="20" fill="#ffffff" fill-opacity="0.06"/>`,
    `<circle cx="${win.x + 36}" cy="${win.y + 28}" r="9" fill="#ff5f57"/>`,
    `<circle cx="${win.x + 66}" cy="${win.y + 28}" r="9" fill="#febc2e"/>`,
    `<circle cx="${win.x + 96}" cy="${win.y + 28}" r="9" fill="#28c840"/>`,
    textBlock([label], { x: win.x + win.w / 2, y: win.y + 37, fontSize: 22, fill: comment, family: MONO, anchor: 'middle' }),
    textBlock(['>'], { x, y: top + Math.round(title.fontSize * 0.8), fontSize: title.fontSize, fill: c.accent, weight: 700, family: MONO }),
    textBlock(title.lines, { x: x + 52, y: top + Math.round(title.fontSize * 0.8), fontSize: title.fontSize, lineHeight: 1.25, fill: text, weight: 700, family: MONO }),
    subLines.length ? textBlock(subLines, { x, y: top + th + 70, fontSize: 28, lineHeight: 1.4, fill: comment, family: MONO }) : '',
    `<rect x="${cursorX}" y="${lastBaseline - Math.round(title.fontSize * 0.75)}" width="${Math.round(title.fontSize * 0.5)}" height="${Math.round(title.fontSize * 0.85)}" fill="${c.accent}" fill-opacity="0.85"/>`,
  ].join('');
}

export const TEMPLATES = {
  minimal: { render: minimal, description: 'Big title, subtitle and a small accent bar on a flat background' },
  gradient: { render: gradient, description: 'Centered text on a diagonal background-to-accent gradient' },
  split: { render: split, description: 'Accent side panel with a monogram and site name, text on the right' },
  'blog-post': { render: blogPost, description: 'Site label, headline, author avatar with name and date' },
  'code-style': { render: codeStyle, description: 'Editor window with monospace title and a code comment subtitle' },
};

/**
 * Render a 1200x630 Open Graph image as an SVG string.
 * @param {object} options
 * @param {string} options.title  required
 * @param {string} [options.subtitle]
 * @param {string} [options.template='minimal']  one of Object.keys(TEMPLATES)
 * @param {'light'|'dark'} [options.theme='light']
 * @param {string} [options.bg]  background hex color
 * @param {string} [options.fg]  text hex color
 * @param {string} [options.accent]  accent hex color
 * @param {string} [options.author]  blog-post: author name
 * @param {string} [options.date]  blog-post: date string
 * @param {string} [options.site]  site name / label
 */
export function renderOgImage(options = {}) {
  const o = { template: 'minimal', theme: 'light', ...options };
  if (o.title == null || String(o.title).trim() === '') throw new Error('title is required');
  const tpl = TEMPLATES[o.template];
  if (!tpl) throw new Error(`Unknown template "${o.template}". Available: ${Object.keys(TEMPLATES).join(', ')}`);
  const base = THEMES[o.theme];
  if (!base) throw new Error(`Unknown theme "${o.theme}". Use light or dark.`);
  const colors = { ...base };
  if (o.bg) colors.bg = normalizeColor(o.bg, 'bg');
  if (o.accent) colors.accent = normalizeColor(o.accent, 'accent');
  if (o.fg) colors.fg = normalizeColor(o.fg, 'fg');
  else if (o.bg) {
    // Keep text readable on a custom background.
    const dark = luminance(colors.bg) < 0.4;
    colors.fg = dark ? THEMES.dark.fg : THEMES.light.fg;
    colors.muted = dark ? THEMES.dark.muted : THEMES.light.muted;
  }
  const label = escapeXml(o.title);
  const body = tpl.render({ ...o, title: String(o.title), subtitle: o.subtitle ? String(o.subtitle) : '' }, colors);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
}
