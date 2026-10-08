import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readableId, combinations, collisionProbability, isReadableId, adjectives, nouns } from '../index.js';

test('word lists are large, unique and lowercase', () => {
  assert.ok(adjectives.length >= 200, `adjectives: ${adjectives.length}`);
  assert.ok(nouns.length >= 200, `nouns: ${nouns.length}`);
  assert.equal(new Set(adjectives).size, adjectives.length);
  assert.equal(new Set(nouns).size, nouns.length);
  for (const w of [...adjectives, ...nouns]) assert.match(w, /^[a-z]+$/);
});

test('default shape is adjective-noun-NN', () => {
  for (let i = 0; i < 500; i++) {
    const id = readableId();
    const [a, n, num, extra] = id.split('-');
    assert.equal(extra, undefined);
    assert.ok(adjectives.includes(a), a);
    assert.ok(nouns.includes(n), n);
    assert.match(num, /^\d{2}$/);
    assert.ok(isReadableId(id));
  }
});

test('options: separator, words, number, digits', () => {
  const id = readableId({ separator: '_', words: 3, digits: 4 });
  assert.match(id, /^[a-z]+_[a-z]+_[a-z]+_\d{4}$/);
  assert.ok(isReadableId(id, { separator: '_', words: 3, digits: 4 }));
  assert.match(readableId({ number: false }), /^[a-z]+-[a-z]+$/);
  assert.match(readableId({ words: 1, number: false }), /^[a-z]+$/);
  assert.throws(() => readableId({ words: 0 }), RangeError);
  assert.throws(() => readableId({ digits: 0 }), RangeError);
});

test('custom random makes output deterministic', () => {
  const seq = () => {
    let i = 0;
    return () => [0, 0.5, 0.999, 0.25][i++ % 4];
  };
  const a = readableId({ random: seq() });
  const b = readableId({ random: seq() });
  assert.equal(a, b);
  assert.equal(readableId({ random: () => 0 }), `${adjectives[0]}-${nouns[0]}-00`);
});

test('custom word lists', () => {
  const opts = { adjectives: ['tiny'], nouns: ['cat'], number: false };
  assert.equal(readableId(opts), 'tiny-cat');
  assert.equal(combinations(opts), 1);
  assert.ok(isReadableId('tiny-cat', opts));
  assert.ok(!isReadableId('brave-cat', opts));
});

test('combinations', () => {
  assert.equal(combinations(), adjectives.length * nouns.length * 100);
  assert.equal(combinations({ number: false }), adjectives.length * nouns.length);
  assert.equal(combinations({ words: 3, digits: 3 }), adjectives.length ** 2 * nouns.length * 1000);
});

test('collisionProbability', () => {
  assert.equal(collisionProbability(0), 0);
  assert.equal(collisionProbability(1), 0);
  const p = collisionProbability(1000);
  assert.ok(p > 0 && p < 1);
  assert.ok(collisionProbability(10000) > p, 'grows with count');
  assert.ok(collisionProbability(1000, { words: 3 }) < p, 'shrinks with more words');
  assert.equal(collisionProbability(3, { adjectives: ['a'], nouns: ['b'], number: false }), 1);
  // birthday problem sanity check: 23 people, 365 days ~ 50.0%
  const days = { adjectives: ['x'], nouns: Array.from({ length: 365 }, (_, i) => `d${i}`), number: false };
  assert.ok(Math.abs(collisionProbability(23, days) - 0.5) < 0.01);
  assert.throws(() => collisionProbability(-1), RangeError);
});

test('isReadableId rejects bad input', () => {
  assert.equal(isReadableId(42), false);
  assert.equal(isReadableId(''), false);
  assert.equal(isReadableId('brave-otter'), false);
  assert.equal(isReadableId('brave-otter-4'), false);
  assert.equal(isReadableId('brave-otter-42-1'), false);
  assert.equal(isReadableId('otter-brave-42'), false);
  assert.equal(isReadableId('brave-otter-42'), true);
  assert.equal(isReadableId('brave-otter', { number: false }), true);
});

test('IDs are well spread', () => {
  const seen = new Set(Array.from({ length: 2000 }, () => readableId({ digits: 4 })));
  assert.ok(seen.size > 1990);
});
