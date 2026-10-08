import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderOgImage, wrapText, fitText, measureText, charWidth, escapeXml, ellipsize, normalizeColor, TEMPLATES,
} from '../src/index.js';
import { findOnPath, detectRasterizers, svgToPng } from '../src/rasterize.js';
import { assertWellFormedXml } from './xml.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cli = join(root, 'bin', 'og-image.js');

// ------------------------------------------------------------ measuring

test('charWidth uses the sans table, bold factor, monospace and wide glyphs', () => {
  assert.equal(charWidth('i'), 0.222);
  assert.equal(charWidth('W'), 0.944);
  assert.ok(charWidth('W', { bold: true }) > charWidth('W'));
  assert.equal(charWidth('i', { mono: true }), 0.6);
  assert.equal(charWidth('\u6f22'), 1);
  assert.equal(charWidth('\u0301'), 0); // combining accent
});

test('measureText scales with font size', () => {
  assert.equal(measureText('', 40), 0);
  assert.equal(Math.round(measureText('Hello', 100)), Math.round((722 + 556 + 222 + 222 + 556) / 10));
  assert.equal(measureText('abc', 20) * 2, measureText('abc', 40));
});

// ------------------------------------------------------------ wrapping

test('wrapText keeps short text on one line', () => {
  assert.deepEqual(wrapText('Hello world', { fontSize: 40, maxWidth: 1000 }), { lines: ['Hello world'], truncated: false });
});

test('wrapText never produces a line wider than maxWidth', () => {
  const text = 'The quick brown fox jumps over the lazy dog while the cat watches from the windowsill';
  const { lines } = wrapText(text, { fontSize: 48, maxWidth: 500 });
  assert.ok(lines.length > 2);
  for (const line of lines) assert.ok(measureText(line, 48) <= 500, `"${line}" too wide`);
  assert.equal(lines.join(' '), text);
});

test('wrapText breaks words longer than a line', () => {
  const { lines } = wrapText('Supercalifragilisticexpialidocious', { fontSize: 40, maxWidth: 200 });
  assert.ok(lines.length > 1);
  assert.equal(lines.join(''), 'Supercalifragilisticexpialidocious');
  for (const line of lines) assert.ok(measureText(line, 40) <= 200);
});

test('wrapText clamps to maxLines with an ellipsis that fits', () => {
  const text = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen';
  const r = wrapText(text, { fontSize: 40, maxWidth: 300, maxLines: 2 });
  assert.equal(r.truncated, true);
  assert.equal(r.lines.length, 2);
  assert.ok(r.lines[1].endsWith('\u2026'));
  assert.ok(measureText(r.lines[1], 40) <= 300);
});

test('wrapText honours explicit newlines and trims trailing blanks', () => {
  assert.deepEqual(wrapText('a\nb\n\n', { fontSize: 20, maxWidth: 500 }).lines, ['a', 'b']);
  assert.deepEqual(wrapText('', { fontSize: 20, maxWidth: 500 }).lines, ['']);
});

test('ellipsize prefers word boundaries and strips dangling punctuation', () => {
  const out = ellipsize('Hello wonderful world, again', 40, measureText('Hello wonderful wo', 40));
  assert.equal(out, 'Hello wonderful\u2026');
  assert.equal(ellipsize('Hi, there', 40, measureText('Hi, th', 40)), 'Hi\u2026');
});

test('fitText picks the largest size that fits without clamping', () => {
  const short = fitText('Short', { sizes: [80, 60, 40], maxWidth: 1000, maxLines: 2 });
  assert.equal(short.fontSize, 80);
  const long = fitText('word '.repeat(40), { sizes: [80, 60, 40], maxWidth: 600, maxLines: 2 });
  assert.equal(long.fontSize, 40);
  assert.equal(long.truncated, true);
});

// ------------------------------------------------------------ escaping

test('escapeXml escapes markup characters and drops invalid ones', () => {
  assert.equal(escapeXml(`<a href="x">Tom & Jerry's</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;');
  assert.equal(escapeXml('bell\u0007 nul\u0000 ok\ttab'), 'bell nul ok\ttab');
  assert.equal(escapeXml('lone \ud800 surrogate'), 'lone  surrogate');
  assert.equal(escapeXml('emoji 🚀 kept'), 'emoji 🚀 kept');
  assert.equal(escapeXml(null), '');
});

test('normalizeColor accepts hex and rejects anything that could break out of an attribute', () => {
  assert.equal(normalizeColor('#ABC'), '#abc');
  assert.equal(normalizeColor('#11223344'), '#11223344');
  for (const bad of ['red', '#12', '#ggg', '#fff" onload="x', 'url(#a)']) assert.throws(() => normalizeColor(bad));
});

// ------------------------------------------------------------ templates

const nasty = {
  title: 'Ship <script>alert("x")</script> & "quotes" in it, plus a long tail of words to force wrapping across lines',
  subtitle: "It's <b>bold</b> & you'll see ]]> nothing breaks \u0001",
  author: 'Ada <Lovelace>',
  date: '2026-10-08',
  site: 'example.com & co',
};

test('there are at least five templates', () => {
  assert.ok(Object.keys(TEMPLATES).length >= 5);
  for (const name of ['minimal', 'gradient', 'split', 'blog-post', 'code-style']) assert.ok(TEMPLATES[name], name);
});

for (const template of Object.keys(TEMPLATES)) {
  for (const theme of ['light', 'dark']) {
    test(`template ${template} (${theme}) renders well-formed 1200x630 SVG`, () => {
      const svg = renderOgImage({ ...nasty, template, theme });
      assertWellFormedXml(svg);
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1200" height="630" viewBox="0 0 1200 630"/);
      assert.ok(!svg.includes('<script'), 'raw markup leaked');
      assert.ok(svg.includes('&lt;script&gt;'));
      assert.ok(svg.includes('Ship'));
    });
  }
  test(`template ${template} works with only a title and custom colors`, () => {
    const svg = renderOgImage({ title: 'Hi', template, bg: '#102030', accent: '#ff8800' });
    assertWellFormedXml(svg);
    assert.ok(svg.includes('#102030'));
  });
}

test('blog-post shows author initials, name and date', () => {
  const svg = renderOgImage({ title: 'Post', template: 'blog-post', author: 'Jane Doe', date: 'Oct 8, 2026' });
  assert.ok(svg.includes('>JD<'));
  assert.ok(svg.includes('Jane Doe \u00b7 Oct 8, 2026'));
});

test('renderOgImage validates its options', () => {
  assert.throws(() => renderOgImage({}), /title is required/);
  assert.throws(() => renderOgImage({ title: 'x', template: 'nope' }), /Unknown template/);
  assert.throws(() => renderOgImage({ title: 'x', theme: 'sepia' }), /Unknown theme/);
  assert.throws(() => renderOgImage({ title: 'x', bg: 'blue' }), /Invalid bg/);
});

// ------------------------------------------------------------ rasterizer + CLI

test('findOnPath finds executables in PATH directories only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'og-path-'));
  const bin = join(dir, 'rsvg-convert');
  writeFileSync(bin, '#!/bin/sh\nexit 1\n');
  chmodSync(bin, 0o755);
  assert.equal(findOnPath('rsvg-convert', { PATH: dir }), bin);
  assert.equal(findOnPath('rsvg-convert', { PATH: '' }), null);
  const tools = detectRasterizers({ PATH: dir });
  assert.equal(tools[0].name, 'rsvg-convert');
  rmSync(dir, { recursive: true, force: true });
});

test('svgToPng explains itself when no rasterizer exists', () => {
  assert.throws(() => svgToPng('<svg/>', join(tmpdir(), 'x.png'), { width: 10, height: 10, tools: [] }), /No SVG rasterizer found/);
});

test('svgToPng falls through failing tools and reports each failure', () => {
  const tools = [{ name: 'rsvg-convert', bin: '/nonexistent/rsvg-convert' }, { name: 'inkscape', bin: '/nonexistent/inkscape' }];
  assert.throws(() => svgToPng('<svg/>', join(tmpdir(), 'x.png'), { width: 10, height: 10, tools }), /rsvg-convert:.*\n.*inkscape:/s);
});

test('CLI writes an SVG file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'og-cli-'));
  const out = join(dir, 'nested', 'card.svg');
  const r = spawnSync(process.execPath, [cli, '--title', 'Hello & <world>', '--template', 'split', '--theme', 'dark', '--out', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assertWellFormedXml(readFileSync(out, 'utf8'));
  rmSync(dir, { recursive: true, force: true });
});

test('CLI prints SVG to stdout and fails on bad input', () => {
  const ok = spawnSync(process.execPath, [cli, '--title', 'Stdout'], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.ok(ok.stdout.startsWith('<svg'));
  const missing = spawnSync(process.execPath, [cli], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /--title is required/);
  const badColor = spawnSync(process.execPath, [cli, '--title', 'x', '--accent', 'nope'], { encoding: 'utf8' });
  assert.equal(badColor.status, 1);
});

test('CLI --png exits non-zero with a clear message when no rasterizer is available', () => {
  const dir = mkdtempSync(join(tmpdir(), 'og-nopng-'));
  const env = { PATH: '', HOME: dir, USERPROFILE: dir };
  const r = spawnSync(process.execPath, [cli, '--title', 'x', '--out', join(dir, 'a.svg'), '--png'], { encoding: 'utf8', env });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /No SVG rasterizer found/);
  assert.ok(existsSync(join(dir, 'a.svg')), 'SVG is still written');
  rmSync(dir, { recursive: true, force: true });
});

const available = detectRasterizers();
test('PNG output with an installed rasterizer', { skip: available.length ? false : 'no rasterizer installed' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'og-png-'));
  mkdirSync(dir, { recursive: true });
  const png = join(dir, 'card.png');
  const tool = svgToPng(renderOgImage({ title: 'PNG test', template: 'gradient' }), png, { width: 1200, height: 630 });
  const buf = readFileSync(png);
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `not a PNG (via ${tool})`);
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
  rmSync(dir, { recursive: true, force: true });
});
