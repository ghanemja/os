import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, buildManifest, embedIndex } from '../scripts/build-manifest.js';
import { checkXml } from '../scripts/check-xml.js';

const MIN_ASSETS = 10;
const files = readdirSync(join(ROOT, 'svg')).filter((f) => f.endsWith('.svg')).sort();
const read = (f) => readFileSync(join(ROOT, 'svg', f), 'utf8');

test(`pack has at least ${MIN_ASSETS} SVGs`, () => {
  assert.ok(files.length >= MIN_ASSETS, `found ${files.length}`);
});

for (const file of files) {
  test(`svg/${file}`, () => {
    const svg = read(file);
    assert.doesNotThrow(() => checkXml(svg), 'well-formed XML');
    assert.match(file, /^[a-z0-9]+(-[a-z0-9]+)*\.svg$/, 'kebab-case file name');
    const root = svg.match(/^\s*<svg\b[^>]*>/);
    assert.ok(root, 'starts with an <svg> root element');
    const tag = root[0];
    assert.match(tag, /\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'has SVG namespace');
    const vb = (tag.match(/\sviewBox="([^"]*)"/) || [])[1];
    assert.ok(vb, 'has viewBox');
    const nums = vb.trim().split(/[\s,]+/).map(Number);
    assert.equal(nums.length, 4, 'viewBox has 4 numbers');
    assert.ok(nums.every(Number.isFinite) && nums[2] > 0 && nums[3] > 0, 'viewBox is valid');
    assert.doesNotMatch(tag, /\s(width|height)=/, 'root has no width/height');
    assert.match(svg, /currentColor/, 'uses currentColor');
    assert.match(svg, /<title>[^<]+<\/title>/, 'has a <title>');
    assert.doesNotMatch(svg, /<image\b|<script\b|data:image\/(png|jpe?g|gif|webp)/i, 'no raster images or scripts');
    assert.match(tag, /\sstroke="currentColor"/, 'lines use currentColor');
    assert.match(tag, /\sstroke-width="2"/, 'stroke-width is 2');
    assert.match(svg, /fill="#6c63ff" style="fill:var\(--accent, #6c63ff\)"/, 'has an --accent highlight');
    assert.equal(tag.match(/\sviewBox="([^"]*)"/)[1], '0 0 200 160', 'shared 200x160 canvas');
  });
}

test('manifest.json is in sync with svg/ (run npm run build)', () => {
  const onDisk = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  assert.deepEqual(onDisk, buildManifest());
});

test('index.html embeds the current asset list (run npm run build)', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.equal(html, embedIndex(html, buildManifest()));
});

test('checkXml rejects broken markup', () => {
  assert.throws(() => checkXml('<svg><path></svg>'));
  assert.throws(() => checkXml('<svg><path d=M0 0/></svg>'));
  assert.throws(() => checkXml('<svg>a & b</svg>'));
  assert.throws(() => checkXml('<svg/><svg/>'));
  assert.ok(checkXml('<svg><title>a &amp; b</title><path d="M0 0"/></svg>'));
});
