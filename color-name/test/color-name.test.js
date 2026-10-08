import { test } from 'node:test';
import assert from 'node:assert/strict';
import colorNameDefault, { colorName, nearest, parseHex, rgbToLab, hexToLab, deltaE2000, colors } from '../index.js';

const close = (actual, expected, eps, msg) =>
  assert.ok(Math.abs(actual - expected) <= eps, `${msg ?? ''} expected ${expected}, got ${actual}`);

// Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference Formula: Implementation Notes,
// Supplementary Test Data, and Mathematical Observations", Table 1.
// [L1, a1, b1, L2, a2, b2, ΔE00]
const SHARMA = [
  [50.0000, 2.6772, -79.7751, 50.0000, 0.0000, -82.7485, 2.0425],
  [50.0000, 3.1571, -77.2803, 50.0000, 0.0000, -82.7485, 2.8615],
  [50.0000, 2.8361, -74.0200, 50.0000, 0.0000, -82.7485, 3.4412],
  [50.0000, -1.3802, -84.2814, 50.0000, 0.0000, -82.7485, 1.0000],
  [50.0000, -1.1848, -84.8006, 50.0000, 0.0000, -82.7485, 1.0000],
  [50.0000, -0.9009, -85.5211, 50.0000, 0.0000, -82.7485, 1.0000],
  [50.0000, 0.0000, 0.0000, 50.0000, -1.0000, 2.0000, 2.3669],
  [50.0000, -1.0000, 2.0000, 50.0000, 0.0000, 0.0000, 2.3669],
  [50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0009, 7.1792],
  [50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0010, 7.1792],
  [50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0011, 7.2195],
  [50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0012, 7.2195],
  [50.0000, -0.0010, 2.4900, 50.0000, 0.0009, -2.4900, 4.8045],
  [50.0000, -0.0010, 2.4900, 50.0000, 0.0010, -2.4900, 4.8045],
  [50.0000, -0.0010, 2.4900, 50.0000, 0.0011, -2.4900, 4.7461],
  [50.0000, 2.5000, 0.0000, 50.0000, 0.0000, -2.5000, 4.3065],
  [50.0000, 2.5000, 0.0000, 73.0000, 25.0000, -18.0000, 27.1492],
  [50.0000, 2.5000, 0.0000, 61.0000, -5.0000, 29.0000, 22.8977],
  [50.0000, 2.5000, 0.0000, 56.0000, -27.0000, -3.0000, 31.9030],
  [50.0000, 2.5000, 0.0000, 58.0000, 24.0000, 15.0000, 19.4535],
  [50.0000, 2.5000, 0.0000, 50.0000, 3.1736, 0.5854, 1.0000],
  [50.0000, 2.5000, 0.0000, 50.0000, 3.2972, 0.0000, 1.0000],
  [50.0000, 2.5000, 0.0000, 50.0000, 1.8634, 0.5757, 1.0000],
  [50.0000, 2.5000, 0.0000, 50.0000, 3.2592, 0.3350, 1.0000],
  [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
  [63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.2630],
  [61.2901, 3.7196, -5.3901, 61.4292, 2.2480, -4.9620, 1.8731],
  [35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645],
  [22.7233, 20.0904, -46.6940, 23.0331, 14.9730, -42.5619, 2.0373],
  [36.4612, 47.8580, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146],
  [90.8027, -2.0831, 1.4410, 91.1528, -1.6435, 0.0447, 1.4441],
  [90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381],
  [6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377],
  [2.0776, 0.0795, -1.1350, 0.9033, -0.0636, -0.5514, 0.9082]
];

test('CIEDE2000 matches Sharma et al. reference data (all 34 pairs)', () => {
  SHARMA.forEach(([L1, a1, b1, L2, a2, b2, expected], i) => {
    const d = deltaE2000({ L: L1, a: a1, b: b1 }, { L: L2, a: a2, b: b2 });
    close(d, expected, 0.0001, `pair ${i + 1}:`);
  });
});

test('CIEDE2000 is symmetric and zero for identical colors', () => {
  for (const [L1, a1, b1, L2, a2, b2] of SHARMA) {
    const p = { L: L1, a: a1, b: b1 }, q = { L: L2, a: a2, b: b2 };
    close(deltaE2000(p, q), deltaE2000(q, p), 1e-9);
    assert.equal(deltaE2000(p, p), 0);
  }
  assert.equal(deltaE2000({ L: 0, a: 0, b: 0 }, { L: 0, a: 0, b: 0 }), 0);
});

test('parseHex handles 3, 4, 6 and 8 digit forms', () => {
  assert.deepEqual(parseHex('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseHex('f00'), { r: 255, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseHex('#0f08'), { r: 0, g: 255, b: 0, a: 0x88 / 255 });
  assert.deepEqual(parseHex('#1E90FF'), { r: 30, g: 144, b: 255, a: 1 });
  assert.deepEqual(parseHex('1e90ff80'), { r: 30, g: 144, b: 255, a: 128 / 255 });
  assert.deepEqual(parseHex('  #abc  '), { r: 0xaa, g: 0xbb, b: 0xcc, a: 1 });
});

test('parseHex rejects invalid input', () => {
  for (const bad of ['', '#', '#12', '#12345', '#1234567', '#123456789', '#ggg', 'red', '##fff', 123, null, undefined, {}]) {
    assert.throws(() => parseHex(bad), TypeError, String(bad));
  }
  assert.throws(() => colorName('nope'), TypeError);
  assert.throws(() => nearest('#12'), TypeError);
});

test('sRGB to Lab matches known values (D65)', () => {
  const white = rgbToLab({ r: 255, g: 255, b: 255 });
  close(white.L, 100, 1e-3); close(white.a, 0, 1e-3); close(white.b, 0, 1e-3);
  const black = hexToLab('#000');
  close(black.L, 0, 1e-9); close(black.a, 0, 1e-9); close(black.b, 0, 1e-9);
  const red = hexToLab('#ff0000');
  close(red.L, 53.24, 0.01); close(red.a, 80.09, 0.01); close(red.b, 67.20, 0.01);
  const green = hexToLab('#00ff00');
  close(green.L, 87.73, 0.01); close(green.a, -86.18, 0.01); close(green.b, 83.18, 0.01);
  const blue = hexToLab('#0000ff');
  close(blue.L, 32.30, 0.01); close(blue.a, 79.19, 0.01); close(blue.b, -107.86, 0.01);
  const gray = hexToLab('#808080');
  close(gray.L, 53.585, 0.01); close(gray.a, 0, 1e-3); close(gray.b, 0, 1e-3);
});

test('name list: at least 300 entries, unique names and hex values', () => {
  assert.ok(colors.length >= 300, `only ${colors.length}`);
  const names = new Set(), hexes = new Set();
  for (const { name, hex } of colors) {
    assert.match(name, /^[a-z]+( [a-z]+)*$/, name);
    assert.match(hex, /^#[0-9a-f]{6}$/, hex);
    assert.ok(!names.has(name), `duplicate name ${name}`);
    assert.ok(!hexes.has(hex), `duplicate hex ${hex}`);
    names.add(name); hexes.add(hex);
  }
  assert.ok(Object.isFrozen(colors[0]));
});

test('every listed color names itself with distance 0', () => {
  for (const c of colors) {
    const r = colorName(c.hex);
    assert.equal(r.name, c.name);
    assert.equal(r.hex, c.hex);
    assert.equal(r.distance, 0);
  }
});

test('colorName finds sensible names', () => {
  assert.equal(colorName('#ff0000').name, 'red');
  assert.equal(colorName('#fe0102').name, 'red');
  assert.equal(colorName('#fff').name, 'white');
  assert.equal(colorName('#000000').name, 'black');
  assert.equal(colorName('#4f8b8c').name, 'dusty teal');
  assert.equal(colorName('#cc5501').name, 'burnt orange');
  assert.equal(colorName('#18186f').name, 'midnight blue');
  assert.equal(colorName('#787878').name, 'gray');
  assert.equal(colorName('#f00a').name, 'red'); // alpha ignored
  const r = colorName('#123456');
  assert.equal(typeof r.name, 'string');
  assert.ok(r.distance > 0 && r.distance < 10);
});

test('colorName agrees with nearest(hex, 1)', () => {
  for (const hex of ['#123456', '#abcdef', '#7a5c3e', '#e0e0d0', '#3a7d80', '#c05a20', '#9b59b6']) {
    const [first] = nearest(hex, 1);
    assert.deepEqual(colorName(hex), first);
  }
});

test('nearest returns n results sorted by distance', () => {
  const list = nearest('#5f9ea0', 10);
  assert.equal(list.length, 10);
  assert.equal(list[0].name, 'cadet blue');
  for (let i = 1; i < list.length; i++) assert.ok(list[i].distance >= list[i - 1].distance);
  for (const item of list) assert.deepEqual(Object.keys(item), ['name', 'hex', 'distance']);
  assert.equal(nearest('#5f9ea0').length, 5);
  assert.equal(nearest('#5f9ea0', 0).length, 0);
  assert.equal(nearest('#5f9ea0', -3).length, 0);
  assert.equal(nearest('#5f9ea0', 10000).length, colors.length);
});

test('default export is colorName', () => {
  assert.equal(colorNameDefault, colorName);
});
