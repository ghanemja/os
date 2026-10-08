import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanSvg, getViewBox, padSvg, readPngSize, encodeIco, buildManifest, buildTags, generateFavicons, normalizeColor,
} from '../src/index.js';
import { detectRasterizers } from '../src/rasterize.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cli = join(root, 'bin', 'favicon-all.js');
const tmp = (p) => mkdtempSync(join(tmpdir(), p));

/** Smallest thing readPngSize accepts: signature + IHDR chunk (33 bytes). */
function fakePng(width, height) {
  const b = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  b[24] = 8; // bit depth
  b[25] = 6; // RGBA
  return b;
}

const INKSCAPE_SVG = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg
   width="64"
   height="64"
   version="1.1"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns='http://www.w3.org/2000/svg'
   inkscape:version="1.3"
   sodipodi:docname='logo.svg'>
  <sodipodi:namedview id="nv" pagecolor="#ffffff"><inkscape:grid type="xygrid"/></sodipodi:namedview>
  <metadata id="m"><rdf:RDF><cc:Work rdf:about=""/></rdf:RDF></metadata>
  <title>Logo</title>
  <!-- background -->
  <rect x="4" y="4" width="56" height="56" rx="14" fill="#4f46e5" inkscape:label="bg" data-name="Layer 1"/>
  <path d="M20 44 L32 18 L44 44 Z" fill="#fff"/>
</svg>
`;

// ------------------------------------------------------------ SVG cleaning

test('cleanSvg strips prolog, doctype, comments, metadata and editor cruft', () => {
  const out = cleanSvg(INKSCAPE_SVG);
  assert.equal(
    out,
    `<svg width="64" height="64" xmlns='http://www.w3.org/2000/svg' viewBox="0 0 64 64"><title>Logo</title>` +
      `<rect x="4" y="4" width="56" height="56" rx="14" fill="#4f46e5"/><path d="M20 44 L32 18 L44 44 Z" fill="#fff"/></svg>`,
  );
});

test('cleanSvg adds xmlns, keeps an existing viewBox, rejects non-SVG input', () => {
  assert.equal(cleanSvg('<svg viewBox="0 0 10 10">\n  <circle r="5"/>\n</svg>'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle r="5"/></svg>');
  assert.throws(() => cleanSvg('<html></html>'), /<svg>/);
});

test('getViewBox and padSvg', () => {
  assert.deepEqual(getViewBox('<svg viewBox="0 0 24 24">'), [0, 0, 24, 24]);
  assert.deepEqual(getViewBox("<svg viewBox='-1,-1 2 2'>"), [-1, -1, 2, 2]);
  assert.equal(getViewBox('<svg>'), null);
  const padded = padSvg('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle r="1"/></svg>', { background: '#ff0000', scale: 0.6 });
  assert.equal(
    padded,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="#ff0000"/>' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" x="200" y="200" width="600" height="600"><circle r="1"/></svg></svg>',
  );
});

// ------------------------------------------------------------ ICO

test('readPngSize reads IHDR and rejects other data', () => {
  assert.deepEqual(readPngSize(fakePng(48, 32)), { width: 48, height: 32 });
  assert.throws(() => readPngSize(Buffer.from('GIF89a........................')), /Not a PNG/);
});

test('encodeIco writes the hand-checked ICONDIR / ICONDIRENTRY layout', () => {
  const a = fakePng(16, 16);
  const b = fakePng(256, 256);
  const ico = encodeIco([a, b]);
  // prettier-ignore
  const expectedHeader = [
    0x00, 0x00, // reserved
    0x01, 0x00, // type: icon
    0x02, 0x00, // 2 images
    // entry 1: 16x16
    0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x21, 0x00, 0x00, 0x00, 0x26, 0x00, 0x00, 0x00, // size 33, offset 38
    // entry 2: 256x256 is stored as 0x0
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x21, 0x00, 0x00, 0x00, 0x47, 0x00, 0x00, 0x00, // size 33, offset 71
  ];
  assert.deepEqual([...ico.subarray(0, 38)], expectedHeader);
  assert.equal(ico.length, 38 + 33 + 33);
  assert.ok(ico.subarray(38, 71).equals(a));
  assert.ok(ico.subarray(71).equals(b));
});

test('encodeIco rejects empty input and images over 256px', () => {
  assert.throws(() => encodeIco([]), /at least one/);
  assert.throws(() => encodeIco([fakePng(512, 512)]), /at most 256/);
});

// ------------------------------------------------------------ manifest + tags

test('buildManifest without PNGs lists only the SVG icon', () => {
  assert.deepEqual(buildManifest({ name: 'My App', color: '#4f46e5' }), {
    name: 'My App',
    short_name: 'My App',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
    theme_color: '#4f46e5',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
  });
});

test('buildManifest with PNGs adds 192, 512 and a maskable icon, honouring basePath', () => {
  const m = buildManifest({ name: 'Docs', shortName: 'D', color: '#000', background: '#111', basePath: '/docs', png: true });
  assert.equal(m.short_name, 'D');
  assert.equal(m.start_url, '/docs');
  assert.deepEqual(m.icons.map((i) => [i.src, i.sizes, i.purpose]), [
    ['/docs/favicon.svg', 'any', undefined],
    ['/docs/icon-192.png', '192x192', undefined],
    ['/docs/icon-512.png', '512x512', undefined],
    ['/docs/icon-maskable-512.png', '512x512', 'maskable'],
  ]);
});

test('buildTags with PNGs', () => {
  assert.equal(
    buildTags({ name: 'My App', color: '#4f46e5', png: true }),
    [
      '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">',
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      '<link rel="manifest" href="/site.webmanifest">',
      '<meta name="theme-color" content="#4f46e5">',
      '<meta name="apple-mobile-web-app-title" content="My App">',
      '',
    ].join('\n'),
  );
});

test('buildTags without PNGs omits ico and apple-touch-icon, and escapes attributes', () => {
  const tags = buildTags({ name: 'Tom & "Jerry"', color: '#000000', basePath: '/x/' });
  assert.ok(!tags.includes('favicon.ico'));
  assert.ok(!tags.includes('apple-touch-icon'));
  assert.ok(tags.includes('href="/x/favicon.svg"'));
  assert.ok(tags.includes('content="Tom &amp; &quot;Jerry&quot;"'));
});

test('normalizeColor validates hex colors', () => {
  assert.equal(normalizeColor('#ABCDEF'), '#abcdef');
  assert.throws(() => normalizeColor('blue'), /Invalid color/);
});

// ------------------------------------------------------------ generate + CLI

test('generateFavicons without a rasterizer writes SVG, manifest and tags and warns', () => {
  const dir = tmp('fav-norast-');
  const r = generateFavicons({ svg: INKSCAPE_SVG, outDir: dir, name: 'App', color: '#4f46e5', tools: [] });
  assert.deepEqual(readdirSync(dir).sort(), ['favicon-tags.html', 'favicon.svg', 'site.webmanifest']);
  assert.equal(r.rasterizer, null);
  assert.match(r.warnings[0], /No SVG rasterizer/);
  assert.equal(JSON.parse(readFileSync(join(dir, 'site.webmanifest'), 'utf8')).icons.length, 1);
  assert.equal(readFileSync(join(dir, 'favicon-tags.html'), 'utf8'), r.tags);
  assert.throws(() => generateFavicons({ svg: INKSCAPE_SVG, outDir: dir, tools: [], png: true }), /No SVG rasterizer/);
  rmSync(dir, { recursive: true, force: true });
});

test('CLI warns but succeeds without a rasterizer', () => {
  const dir = tmp('fav-cli-');
  const input = join(dir, 'in.svg');
  writeFileSync(input, INKSCAPE_SVG);
  const env = { PATH: '', HOME: dir, USERPROFILE: dir };
  const r = spawnSync(process.execPath, [cli, input, '--out', join(dir, 'out'), '--name', 'App', '--color', '#4f46e5'], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /warning: No SVG rasterizer/);
  assert.match(r.stdout, /<link rel="manifest" href="\/site.webmanifest">/);
  assert.ok(existsSync(join(dir, 'out', 'favicon.svg')));
  const strict = spawnSync(process.execPath, [cli, input, '--out', join(dir, 'out2'), '--png'], { encoding: 'utf8', env });
  assert.equal(strict.status, 1);
  const bad = spawnSync(process.execPath, [cli, input, '--color', 'red'], { encoding: 'utf8', env, cwd: dir });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Invalid color/);
  rmSync(dir, { recursive: true, force: true });
});

const available = detectRasterizers();
test('full output with an installed rasterizer', { skip: available.length ? false : 'no rasterizer installed' }, () => {
  const dir = tmp('fav-full-');
  const r = generateFavicons({ svg: INKSCAPE_SVG, outDir: dir, name: 'App', color: '#4f46e5', png: true });
  for (const [file, size] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['favicon-48x48.png', 48],
    ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512]]) {
    assert.deepEqual(readPngSize(readFileSync(join(dir, file))), { width: size, height: size }, file);
  }
  const ico = readFileSync(join(dir, 'favicon.ico'));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  assert.deepEqual([ico[6], ico[22], ico[38]], [16, 32, 48]);
  const firstOffset = ico.readUInt32LE(6 + 12);
  assert.equal(firstOffset, 6 + 16 * 3);
  assert.equal(ico.subarray(firstOffset, firstOffset + 8).toString('hex'), '89504e470d0a1a0a');
  assert.ok(r.tags.includes('favicon.ico'));
  rmSync(dir, { recursive: true, force: true });
});
