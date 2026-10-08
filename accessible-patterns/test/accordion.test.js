import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextHeaderIndex, toggleSection } from '../patterns/accordion/accordion.js';

test('nextHeaderIndex: arrows wrap, Home/End jump, other keys ignored', () => {
  assert.equal(nextHeaderIndex(0, 'ArrowDown', 3), 1);
  assert.equal(nextHeaderIndex(2, 'ArrowDown', 3), 0);
  assert.equal(nextHeaderIndex(0, 'ArrowUp', 3), 2);
  assert.equal(nextHeaderIndex(1, 'Home', 3), 0);
  assert.equal(nextHeaderIndex(1, 'End', 3), 2);
  assert.equal(nextHeaderIndex(1, 'ArrowRight', 3), null);
  assert.equal(nextHeaderIndex(0, 'ArrowDown', 0), null);
});

test('single-open accordion closes the others', () => {
  assert.deepEqual(toggleSection([true, false, false], 2), [false, false, true]);
  assert.deepEqual(toggleSection([true, false, false], 0), [false, false, false]);
});

test('allowToggle: false keeps the open section open', () => {
  assert.deepEqual(toggleSection([true, false], 0, { allowToggle: false }), [true, false]);
  assert.deepEqual(toggleSection([true, false], 1, { allowToggle: false }), [false, true]);
});

test('allowMultiple leaves other sections alone', () => {
  assert.deepEqual(toggleSection([true, false, true], 1, { allowMultiple: true }), [true, true, true]);
  assert.deepEqual(toggleSection([true, false, true], 0, { allowMultiple: true }), [false, false, true]);
});

test('toggleSection does not mutate its input', () => {
  const state = [false, false];
  toggleSection(state, 0);
  assert.deepEqual(state, [false, false]);
});
