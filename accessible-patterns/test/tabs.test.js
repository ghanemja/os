import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTabIndex } from '../patterns/tabs/tabs.js';

test('horizontal: ArrowRight/ArrowLeft move and wrap', () => {
  assert.equal(nextTabIndex(0, 'ArrowRight', 4), 1);
  assert.equal(nextTabIndex(3, 'ArrowRight', 4), 0);
  assert.equal(nextTabIndex(0, 'ArrowLeft', 4), 3);
  assert.equal(nextTabIndex(2, 'ArrowLeft', 4), 1);
});

test('Home and End jump to the first and last tab', () => {
  assert.equal(nextTabIndex(2, 'Home', 4), 0);
  assert.equal(nextTabIndex(1, 'End', 4), 3);
});

test('vertical tablists use ArrowUp/ArrowDown and ignore left/right', () => {
  const v = { orientation: 'vertical' };
  assert.equal(nextTabIndex(0, 'ArrowDown', 3, v), 1);
  assert.equal(nextTabIndex(0, 'ArrowUp', 3, v), 2);
  assert.equal(nextTabIndex(0, 'ArrowRight', 3, v), null);
  assert.equal(nextTabIndex(0, 'ArrowDown', 3), null); // horizontal ignores up/down
});

test('right-to-left swaps the horizontal arrows', () => {
  assert.equal(nextTabIndex(0, 'ArrowLeft', 3, { rtl: true }), 1);
  assert.equal(nextTabIndex(0, 'ArrowRight', 3, { rtl: true }), 2);
});

test('disabled tabs are skipped, including by Home and End', () => {
  const disabled = [false, true, false, true];
  assert.equal(nextTabIndex(0, 'ArrowRight', 4, { disabled }), 2);
  assert.equal(nextTabIndex(2, 'ArrowRight', 4, { disabled }), 0);
  assert.equal(nextTabIndex(0, 'ArrowLeft', 4, { disabled }), 2);
  assert.equal(nextTabIndex(2, 'End', 4, { disabled }), 2);
  assert.equal(nextTabIndex(2, 'Home', 4, { disabled: [true, false, false, false] }), 1);
});

test('unhandled keys and empty or fully disabled lists return null', () => {
  assert.equal(nextTabIndex(0, 'Enter', 3), null);
  assert.equal(nextTabIndex(0, 'a', 3), null);
  assert.equal(nextTabIndex(0, 'ArrowRight', 0), null);
  assert.equal(nextTabIndex(0, 'ArrowRight', 2, { disabled: [true, true] }), null);
});
