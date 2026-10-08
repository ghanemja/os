import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { frame, parseScreen, roundedRect } from '../frame.js';
import { checkXml } from '../scripts/check-xml.js';

const phone = readFileSync(new URL('../svg/phone-iphone.svg', import.meta.url), 'utf8');
const browser = readFileSync(new URL('../svg/browser-tabs.svg', import.meta.url), 'utf8');

test('parseScreen reads the documented screen rect', () => {
  assert.deepEqual(parseScreen(phone), { x: 16, y: 12, width: 390, height: 844, radius: [54, 54, 54, 54] });
  assert.deepEqual(parseScreen(browser).radius, [0, 0, 11, 11]);
});

test('parseScreen fails clearly without data-screen', () => {
  assert.throws(() => parseScreen('<svg viewBox="0 0 10 10"></svg>'), /data-screen/);
});

test('roundedRect builds per-corner arcs and skips zero radii', () => {
  assert.equal(roundedRect({ x: 0, y: 0, width: 10, height: 10, radius: [0, 0, 0, 0] }), 'M0 0H10V10H0V0Z');
  assert.match(roundedRect({ x: 0, y: 0, width: 10, height: 10, radius: [2, 2, 2, 2] }), /^M2 0H8A2 2 0 0 1 10 2/);
});

test('frame puts the image under the frame, clipped to the screen', () => {
  const out = frame(phone, 'shot.png');
  assert.ok(checkXml(out));
  const img = out.indexOf('<image'), body = out.indexOf('<path fill-rule');
  assert.ok(img > 0 && img < body, 'image is drawn before the frame body');
  assert.ok(out.indexOf('<title>') < img, 'title stays first');
  assert.match(out, /<image href="shot.png" x="16" y="12" width="390" height="844" preserveAspectRatio="xMidYMid slice"\/>/);
  const id = out.match(/clipPath id="([^"]+)"/)[1];
  assert.match(out, new RegExp(`clip-path="url\\(#${id}\\)"`));
});

test('frame options: fit, id, background', () => {
  const out = frame(phone, 'a.png', { fit: 'contain', id: 'my-clip', background: '#000' });
  assert.match(out, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(out, /clipPath id="my-clip"/);
  assert.match(out, /<rect x="16" y="12" width="390" height="844" fill="#000"\/>/);
  assert.throws(() => frame(phone, 'a.png', { fit: 'stretch' }), /fit must be/);
});

test('frame escapes the URL', () => {
  const out = frame(phone, 'x.png?a=1&b="2"<');
  assert.match(out, /href="x.png\?a=1&#38;b=&#34;2&#34;&#60;"/);
  assert.ok(checkXml(out));
});

test('ids are stable and differ per image', () => {
  assert.equal(frame(phone, 'a.png'), frame(phone, 'a.png'));
  const id = (s) => s.match(/clipPath id="([^"]+)"/)[1];
  assert.notEqual(id(frame(phone, 'a.png')), id(frame(phone, 'b.png')));
});
