import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { collect, renderIndex, renderManifest, renderGalleryData } from '../build.js';
import { icons, categories, icon } from '../index.js';

const root = new URL('../', import.meta.url);
const data = collect();

test('four categories with at least 12 icons each', () => {
  assert.deepEqual(Object.keys(data.categories).sort(), ['farming', 'lab', 'music', 'trades']);
  for (const [cat, names] of Object.entries(data.categories)) assert.ok(names.length >= 12, `${cat} has ${names.length}`);
});

test('every SVG follows the pack rules', () => {
  for (const [name, svg] of Object.entries(data.icons)) {
    assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${name}: kebab-case name`);
    const open = svg.match(/^<svg [^>]*>/)?.[0];
    assert.ok(open, `${name}: starts with <svg>`);
    assert.ok(svg.endsWith('</svg>'), `${name}: ends with </svg>`);
    for (const attr of ['xmlns="http://www.w3.org/2000/svg"', 'viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="2"', 'stroke-linecap="round"', 'stroke-linejoin="round"'])
      assert.ok(open.includes(attr), `${name}: has ${attr}`);
    assert.doesNotMatch(open, /\s(width|height)=/, `${name}: no fixed size`);
    assert.doesNotMatch(svg, /<image|<script|style=|stroke-width="(?!2")|fill="(?!none")/, `${name}: no raster, script, inline style or overrides`);
    const tags = svg.replace(/^<svg[^>]*>|<\/svg>$/g, '').match(/<[a-z]+/g);
    assert.ok(tags?.length, `${name}: has shapes`);
    for (const t of tags) assert.ok(['<path', '<circle', '<rect', '<ellipse', '<line', '<polyline', '<polygon'].includes(t), `${name}: unexpected ${t}`);
    for (const n of svg.match(/\s(?:cx|cy|x|y)="(-?[\d.]+)"/g) ?? []) {
      const v = Number(n.split('"')[1]);
      assert.ok(v >= 0 && v <= 24, `${name}: coordinate ${v} inside the 24 grid`);
    }
  }
});

test('generated files are up to date (run `npm run build`)', () => {
  assert.equal(readFileSync(new URL('index.js', root), 'utf8'), renderIndex(data));
  assert.equal(readFileSync(new URL('manifest.json', root), 'utf8'), renderManifest(data));
  assert.ok(readFileSync(new URL('index.html', root), 'utf8').includes(renderGalleryData(data)));
});

test('index.js exports every icon by name', () => {
  assert.equal(Object.keys(icons).length, Object.values(categories).flat().length);
  assert.ok(icons.tractor.includes('<svg'));
  assert.ok(icons.microscope && icons.wrench && icons.guitar);
});

test('icon() applies size, color and attributes', () => {
  const svg = icon('beaker', { size: 32, color: 'red', strokeWidth: 1.5, className: 'i', 'aria-hidden': 'true' });
  assert.match(svg, /^<svg width="32" height="32" class="i" aria-hidden="true" /);
  assert.ok(svg.includes('stroke="red"') && svg.includes('stroke-width="1.5"'));
  assert.equal(icon('beaker'), icons.beaker);
  assert.throws(() => icon('nope'), /Unknown icon/);
});

test('manifest lists every file', () => {
  const m = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(m.count, Object.keys(data.icons).length);
  for (const entry of m.icons) assert.ok(readFileSync(new URL(entry.file, root), 'utf8').startsWith('<svg'));
});
