import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { names, pattern, patternStyle, svg, dataUri, tileSize } from '../patterns.js';
import { renderCss, renderGalleryScript, renderManifest } from '../build.js';

const root = new URL('../', import.meta.url);

test('ships at least 15 patterns, including the core set', () => {
  assert.ok(names.length >= 15, `${names.length} patterns`);
  for (const n of ['dots', 'grid', 'graph-paper', 'diagonal-stripes', 'cross-hatch', 'checkerboard', 'triangles', 'hexagons', 'waves', 'zigzag', 'circles', 'plus', 'topography', 'diamonds', 'bricks', 'noise'])
    assert.ok(names.includes(n), `has ${n}`);
});

test('every tile is a small well-formed SVG', () => {
  for (const name of names) {
    const s = svg(name, { color: '#123456' });
    assert.match(s, /^<svg xmlns='http:\/\/www.w3.org\/2000\/svg' width='[\d.]+' height='[\d.]+' viewBox='0 0 [\d.]+ [\d.]+'>/, name);
    assert.ok(s.endsWith('</svg>'), name);
    assert.ok(s.includes('#123456'), `${name} uses the color`);
    assert.doesNotMatch(s, /"/, `${name} has no double quotes`);
    // Tag balance: every opened non-self-closing tag is closed.
    const stack = [];
    for (const [, close, tag, selfClose] of s.matchAll(/<(\/?)([a-z]+)[^>]*?(\/?)>/g)) {
      if (close) assert.equal(stack.pop(), tag, `${name}: </${tag}> balanced`);
      else if (!selfClose) stack.push(tag);
    }
    assert.equal(stack.length, 0, `${name}: all tags closed`);
    assert.ok(pattern(name).length < 16000, `${name} data URI stays small`);
  }
});

test('pattern() returns a CSS background value', () => {
  const css = pattern('dots', { color: '#ff0000', size: 30, opacity: 0.5 });
  assert.match(css, /^url\("data:image\/svg\+xml,%3Csvg .*%3C\/svg%3E"\) 0 0 \/ 30px 30px$/);
  assert.ok(css.includes('%23ff0000'), 'hash is encoded');
  assert.ok(css.includes("opacity='0.5'"));
  assert.doesNotMatch(css.slice(5, -20), /[<>#"]/, 'no raw characters that break CSS');
});

test('defaults: black, full opacity, tile default size', () => {
  const css = pattern('grid');
  assert.ok(css.includes("stroke='%23000'"));
  assert.doesNotMatch(css, /opacity='/);
  assert.ok(css.endsWith(`${tileSize('grid').width}px ${tileSize('grid').height}px`));
});

test('size keeps the tile aspect ratio', () => {
  assert.deepEqual(tileSize('bricks', 80), { width: 80, height: 40 });
  assert.deepEqual(tileSize('waves', 60), { width: 60, height: 30 });
  assert.ok(pattern('hexagons', { size: 17.32 }).endsWith('17.32px 30px'));
});

test('patternStyle() splits the value for frameworks', () => {
  const st = patternStyle('waves', { color: 'teal', size: 40 });
  assert.match(st.backgroundImage, /^url\("data:image\/svg\+xml,/);
  assert.equal(st.backgroundSize, '40px 20px');
});

test('rejects unknown names and unsafe input', () => {
  assert.throws(() => pattern('nope'), /Unknown pattern/);
  assert.throws(() => pattern('dots', { color: `red' onload='x` }), /Invalid color/);
  assert.throws(() => pattern('dots', { color: 'red"><script>' }), /Invalid color/);
  assert.throws(() => pattern('dots', { opacity: 2 }), /Opacity/);
  assert.ok(pattern('dots', { color: 'rgb(10, 20, 30)' }).includes('rgb(10, 20, 30)'));
});

test('output is deterministic (generated tiles too)', () => {
  for (const n of ['topography', 'noise']) assert.equal(svg(n), svg(n));
  assert.equal(dataUri('<a b="#">'), "data:image/svg+xml,%3Ca b='%23'%3E");
});

test('patterns.css, manifest.json and gallery are up to date (run `npm run build`)', () => {
  const css = readFileSync(new URL('patterns.css', root), 'utf8');
  assert.equal(css, renderCss());
  for (const n of names) assert.ok(css.includes(`.pattern-${n} {`), `class for ${n}`);
  assert.ok(readFileSync(new URL('index.html', root), 'utf8').includes(renderGalleryScript()));
  const manifest = readFileSync(new URL('manifest.json', root), 'utf8');
  assert.equal(manifest, renderManifest());
  assert.equal(JSON.parse(manifest).count, names.length);
});
