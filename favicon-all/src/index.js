// favicon-all: one SVG in -> favicon.svg, PNGs, favicon.ico, manifest and tags out.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectRasterizers, svgToPng } from './rasterize.js';

// ------------------------------------------------------------------ SVG

/**
 * Optimize an SVG for use as favicon.svg: drops the XML prolog, doctype,
 * comments, <metadata>, editor namespaces (Inkscape, Sodipodi, Illustrator,
 * Sketch, Figma) and whitespace between tags; adds a viewBox when missing.
 */
export function cleanSvg(input) {
  let svg = String(input).replace(/^\uFEFF/, '');
  const start = svg.search(/<svg[\s>]/i);
  if (start === -1) throw new Error('Input does not contain an <svg> element');
  svg = svg.slice(start); // drops <?xml ...?>, <!DOCTYPE ...> and leading comments
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');
  svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '').replace(/<metadata[^>]*\/>/gi, '');
  const editorNs = '(?:sodipodi|inkscape|sketch|figma|i|x|serif|rdf|cc|dc)';
  svg = svg.replace(new RegExp(`<${editorNs}:[\\w.-]+[^>]*/>`, 'g'), '');
  svg = svg.replace(new RegExp(`<(${editorNs}:[\\w.-]+)[^>]*>[\\s\\S]*?</\\1>`, 'g'), '');
  const value = `\\s*=\\s*(?:"[^"]*"|'[^']*')`;
  svg = svg.replace(new RegExp(`\\s+xmlns:${editorNs}${value}`, 'g'), '');
  svg = svg.replace(new RegExp(`\\s+${editorNs}:[\\w.-]+${value}`, 'g'), '');
  svg = svg.replace(new RegExp(`\\s+(?:data-name|xml:space)${value}`, 'g'), '');
  svg = svg.replace(/>\s+</g, '><').trim();
  svg = svg.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    let a = attrs.replace(/\s+version="[^"]*"/, '').replace(/\s+enable-background="[^"]*"/, '');
    if (!/\sxmlns\s*=/.test(a)) a = ` xmlns="http://www.w3.org/2000/svg"${a}`;
    if (!/\sviewBox\s*=/.test(a)) {
      const w = parseFloat((a.match(/\swidth\s*=\s*["']([\d.]+)/) || [])[1]);
      const h = parseFloat((a.match(/\sheight\s*=\s*["']([\d.]+)/) || [])[1]);
      if (w && h) a += ` viewBox="0 0 ${w} ${h}"`;
    }
    return `<svg${a.replace(/\s+/g, ' ').replace(/\s+$/, '')}>`;
  });
  return svg;
}

/** Read the viewBox of an SVG as [minX, minY, width, height]. */
export function getViewBox(svg) {
  const m = svg.match(/<svg\b[^>]*\sviewBox\s*=\s*["']([^"']+)["']/);
  if (!m) return null;
  const v = m[1].trim().split(/[\s,]+/).map(Number);
  return v.length === 4 && v.every(Number.isFinite) ? v : null;
}

/**
 * Place the icon on a solid square background, scaled to `scale` of the
 * canvas and centered. Used for apple-touch-icon (opaque) and maskable icons
 * (content inside the safe zone).
 */
export function padSvg(svg, { background, scale = 0.8, radius = 0 }) {
  const vb = getViewBox(svg) || [0, 0, 100, 100];
  const size = 1000;
  const inner = size * scale;
  const off = (size - inner) / 2;
  const nested = svg.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    const a = attrs.replace(/\s(?:width|height|x|y)\s*=\s*(?:"[^"]*"|'[^']*')/g, '');
    const withVb = /\sviewBox\s*=/.test(a) ? a : `${a} viewBox="${vb.join(' ')}"`;
    return `<svg${withVb} x="${off}" y="${off}" width="${inner}" height="${inner}">`;
  });
  const rx = radius ? ` rx="${radius}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}"${rx} fill="${background}"/>${nested}</svg>`;
}

// ------------------------------------------------------------------ ICO

/** Width and height from a PNG's IHDR chunk. */
export function readPngSize(png) {
  const sig = '89504e470d0a1a0a';
  if (png.length < 24 || png.subarray(0, 8).toString('hex') !== sig || png.toString('latin1', 12, 16) !== 'IHDR') {
    throw new Error('Not a PNG file');
  }
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/**
 * Build a .ico file that embeds PNG images (supported by all current browsers
 * and Windows Vista+). Layout: ICONDIR (6 bytes), one ICONDIRENTRY (16 bytes)
 * per image, then the PNG data. All integers are little-endian.
 */
export function encodeIco(pngs) {
  if (!pngs.length) throw new Error('encodeIco needs at least one PNG');
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const png of pngs) {
    const { width, height } = readPngSize(png);
    if (width > 256 || height > 256) throw new Error(`ICO images must be at most 256px, got ${width}x${height}`);
    const e = Buffer.alloc(16);
    e.writeUInt8(width === 256 ? 0 : width, 0); // 0 means 256
    e.writeUInt8(height === 256 ? 0 : height, 1);
    e.writeUInt8(0, 2); // palette size
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8); // image size
    e.writeUInt32LE(offset, 12); // image offset
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...pngs]);
}

// ------------------------------------------------------------------ manifest + tags

export function normalizeColor(value, name = 'color') {
  const v = String(value).trim();
  if (!/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) {
    throw new Error(`Invalid ${name} "${value}": expected a hex color like #1d4ed8`);
  }
  return v.toLowerCase();
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function joinPath(base, file) {
  return (base.endsWith('/') ? base : base + '/') + file;
}

export const PNG_SIZES = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'apple-touch-icon.png', size: 180, padded: true },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
];

/** Contents of site.webmanifest as an object. */
export function buildManifest({ name, shortName, color, background = '#ffffff', basePath = '/', png = false }) {
  const icons = [{ src: joinPath(basePath, 'favicon.svg'), sizes: 'any', type: 'image/svg+xml' }];
  if (png) {
    icons.push(
      { src: joinPath(basePath, 'icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: joinPath(basePath, 'icon-512.png'), sizes: '512x512', type: 'image/png' },
      { src: joinPath(basePath, 'icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    );
  }
  return {
    name,
    short_name: shortName || name,
    icons,
    theme_color: color,
    background_color: background,
    display: 'standalone',
    start_url: basePath,
  };
}

/** The <link>/<meta> tags for the document <head>, one per line. */
export function buildTags({ name, color, basePath = '/', png = false }) {
  const p = (f) => escapeAttr(joinPath(basePath, f));
  const tags = [];
  if (png) tags.push(`<link rel="icon" href="${p('favicon.ico')}" sizes="16x16 32x32 48x48">`);
  tags.push(`<link rel="icon" href="${p('favicon.svg')}" type="image/svg+xml">`);
  if (png) tags.push(`<link rel="apple-touch-icon" href="${p('apple-touch-icon.png')}">`);
  tags.push(`<link rel="manifest" href="${p('site.webmanifest')}">`);
  tags.push(`<meta name="theme-color" content="${escapeAttr(color)}">`);
  if (name) tags.push(`<meta name="apple-mobile-web-app-title" content="${escapeAttr(name)}">`);
  return tags.join('\n') + '\n';
}

// ------------------------------------------------------------------ orchestration

/**
 * Generate every favicon file into `outDir`.
 * png: 'auto' (default; PNGs if a rasterizer exists), true (required), false (skip).
 * Returns { files, warnings, rasterizer, tags }.
 */
export function generateFavicons({ input, svg, outDir, name = 'App', shortName, color = '#ffffff', background = '#ffffff', basePath = '/', png = 'auto', tools, log = () => {} }) {
  const source = svg ?? readFileSync(input, 'utf8');
  color = normalizeColor(color, 'color');
  background = normalizeColor(background, 'background');
  mkdirSync(outDir, { recursive: true });
  const files = [];
  const warnings = [];
  const write = (file, data) => {
    writeFileSync(join(outDir, file), data);
    files.push(file);
    log(`wrote ${join(outDir, file)}`);
  };

  const clean = cleanSvg(source);
  write('favicon.svg', clean);

  let rasterizer = null;
  if (png !== false) {
    const available = tools ?? detectRasterizers();
    if (!available.length) {
      const msg = 'No SVG rasterizer found (rsvg-convert, ImageMagick, Inkscape or Chromium). Skipped PNG and ICO files.';
      if (png === true) throw new Error(msg);
      warnings.push(msg);
    } else {
      const usable = available.slice();
      const pngData = {};
      try {
        for (const { file, size, padded, maskable } of PNG_SIZES) {
          let src = clean;
          if (padded) src = padSvg(clean, { background, scale: 0.84 });
          if (maskable) src = padSvg(clean, { background, scale: 0.6 });
          const out = join(outDir, file);
          rasterizer = svgToPng(src, out, { width: size, height: size, tools: usable });
          // Stick with the tool that worked for the remaining sizes.
          usable.splice(0, usable.findIndex((t) => t.name === rasterizer));
          pngData[size] ??= readFileSync(out);
          files.push(file);
          log(`wrote ${out}`);
        }
        write('favicon.ico', encodeIco([pngData[16], pngData[32], pngData[48]]));
      } catch (err) {
        if (png === true) throw err;
        warnings.push(`PNG generation failed, skipped PNG and ICO files.\n${err.message}`);
        rasterizer = null;
      }
    }
  }
  const hasPng = rasterizer !== null;
  write('site.webmanifest', JSON.stringify(buildManifest({ name, shortName, color, background, basePath, png: hasPng }), null, 2) + '\n');
  const tags = buildTags({ name, color, basePath, png: hasPng });
  write('favicon-tags.html', tags);
  return { files, warnings, rasterizer, tags };
}
