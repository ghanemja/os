import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { avatar, pick, parts, partSvg, hash, prng, backgrounds } from '../avatar.js';
import { partFiles, renderManifest, renderGalleryScript } from '../build.js';

const root = new URL('../', import.meta.url);

// Minimal XML well-formedness check: balanced tags, quoted attributes, no stray "<".
function assertWellFormed(svg, label = '') {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64"/, label);
  const stack = [];
  const rest = svg.replace(/<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"<]*")*)\s*(\/?)>/g, (m, close, tag, attrs, self) => {
    if (close) assert.equal(stack.pop(), tag, `${label}: </${tag}> matches`);
    else if (!self) stack.push(tag);
    const names = [...attrs.matchAll(/([a-zA-Z:-]+)=/g)].map((a) => a[1]);
    assert.equal(new Set(names).size, names.length, `${label}: no duplicate attributes on <${tag}>`);
    return '';
  });
  assert.equal(stack.length, 0, `${label}: all tags closed`);
  assert.doesNotMatch(rest, /[<>]/, `${label}: no malformed tags`);
}

test('has the required number of parts', () => {
  assert.ok(parts.face.length >= 6);
  assert.ok(parts.eyes.length >= 10);
  assert.ok(parts.mouth.length >= 10);
  assert.ok(parts.hair.filter((h) => h !== 'none').length >= 12);
  assert.ok(parts.accessory.length >= 6);
  for (const a of ['none', 'glasses', 'earrings', 'hat']) assert.ok(parts.accessory.includes(a), a);
});

test('same seed → same avatar, every time', () => {
  for (const seed of ['jane@example.com', 'bob', '', '🦊 émoji ünïcode', '12345']) {
    assert.equal(avatar(seed), avatar(seed));
    assert.deepEqual(pick(seed), pick(seed));
  }
});

test('known seeds stay stable across versions of Node', () => {
  assert.equal(hash('hello'), 1335831723);
  const r = prng(42);
  assert.equal(r().toFixed(6), '0.601104');
  assert.deepEqual(pick('jane@example.com'), pick('jane@example.com'));
});

test('different seeds give varied avatars', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(JSON.stringify(pick(`user-${i}`)));
  assert.ok(seen.size > 190, `${seen.size} unique of 200`);
  const used = { face: new Set(), eyes: new Set(), mouth: new Set(), hair: new Set(), accessory: new Set() };
  for (let i = 0; i < 2000; i++) {
    const p = pick(`seed${i}`);
    for (const k of Object.keys(used)) used[k].add(p[k]);
  }
  for (const k of Object.keys(used)) assert.equal(used[k].size, parts[k].length, `every ${k} is reachable`);
});

test('output is a well-formed SVG', () => {
  for (let i = 0; i < 300; i++) assertWellFormed(avatar(`check-${i}`), `seed check-${i}`);
  for (const hair of parts.hair) for (const accessory of parts.accessory)
    assertWellFormed(avatar('x', { parts: { hair, accessory } }), `${hair}+${accessory}`);
});

test('options: size, color, background, parts', () => {
  const svg = avatar('jane', { size: 48, color: '#ff0000', background: '#000000' });
  assert.match(svg, /width="48" height="48"/);
  assert.match(svg, /color="#ff0000"/);
  assert.match(svg, /<rect width="64" height="64" fill="#000000"/);
  assert.doesNotMatch(avatar('jane'), /<svg[^>]*\swidth=/, 'no size → fluid');
  assert.ok(backgrounds.some((b) => avatar('jane').includes(`fill="${b}"`)), 'seeded pastel by default');
  assert.doesNotMatch(avatar('jane', { background: 'none' }), /<\/title><rect/);
  assert.doesNotMatch(avatar('jane', { background: null }), /<\/title><rect/);
  const forced = avatar('jane', { parts: { hair: 'bun', accessory: 'hat' } });
  assert.notEqual(forced, avatar('jane'));
  assert.throws(() => avatar('jane', { parts: { hair: 'mullet' } }), /Unknown hair/);
});

test('escapes user-supplied values', () => {
  const svg = avatar('x', { color: '"><script>', title: '<b>&' });
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('<title>&lt;b&gt;&amp;</title>'));
  assertWellFormed(svg);
});

test('mask ids are unique per avatar and referenced correctly', () => {
  const a = avatar('alice'), b = avatar('bob');
  const ids = (s) => [...s.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1]);
  for (const s of [a, b]) for (const id of ids(s)) assert.ok(s.includes(`url(#${id})`));
  assert.ok(ids(a).every((id) => !ids(b).includes(id)));
});

test('part SVGs, manifest and gallery are up to date (run `npm run build`)', () => {
  const files = partFiles();
  assert.ok(files.length >= 6 + 10 + 10 + 12 + 5);
  for (const f of files) {
    assert.equal(readFileSync(new URL(f.file, root), 'utf8'), f.svg, f.file);
    assertWellFormed(f.svg.trim(), f.file);
    assert.match(f.svg, /stroke="currentColor"/);
    assert.doesNotMatch(f.svg, /<svg[^>]*\s(width|height)=/);
  }
  assert.equal(readFileSync(new URL('manifest.json', root), 'utf8'), renderManifest());
  assert.ok(readFileSync(new URL('index.html', root), 'utf8').includes(renderGalleryScript()));
  assert.ok(existsSync(new URL('svg/parts/hair/afro.svg', root)));
  assert.throws(() => partSvg('shoes', 'boots'), /Unknown category/);
});
