import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterOptions, splitMatch, comboboxKeyAction } from '../patterns/combobox/combobox.js';

const fruits = ['Apple', 'Banana', 'Pineapple', 'Grape', 'Grapefruit'];

test('filterOptions puts prefix matches before substring matches', () => {
  assert.deepEqual(filterOptions(fruits, 'ap'), ['Apple', 'Pineapple', 'Grape', 'Grapefruit']);
  assert.deepEqual(filterOptions(fruits, 'GRAPE'), ['Grape', 'Grapefruit']);
  assert.deepEqual(filterOptions(fruits, 'ap', { match: 'startsWith' }), ['Apple']);
  assert.deepEqual(filterOptions(fruits, '  '), fruits);
  assert.deepEqual(filterOptions(fruits, 'kiwi'), []);
});

test('splitMatch splits around the first case-insensitive match', () => {
  assert.deepEqual(splitMatch('Pineapple', 'APP'), ['Pine', 'app', 'le']);
  assert.deepEqual(splitMatch('Pineapple', ''), ['Pineapple', '', '']);
  assert.deepEqual(splitMatch('Pineapple', 'x'), ['Pineapple', '', '']);
});

test('ArrowDown opens on the first option, then moves and wraps', () => {
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: false, active: -1, count: 3 }), { open: true, active: 0 });
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: false, active: -1, count: 3 }, { altKey: true }), { open: true, active: -1 });
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: true, active: 0, count: 3 }), { active: 1 });
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: true, active: 2, count: 3 }), { active: 0 });
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: true, active: -1, count: 3 }), { active: 0 });
});

test('ArrowUp opens on the last option, then moves and wraps', () => {
  assert.deepEqual(comboboxKeyAction('ArrowUp', { open: false, active: -1, count: 3 }), { open: true, active: 2 });
  assert.deepEqual(comboboxKeyAction('ArrowUp', { open: true, active: 0, count: 3 }), { active: 2 });
  assert.deepEqual(comboboxKeyAction('ArrowUp', { open: true, active: 2, count: 3 }), { active: 1 });
  assert.deepEqual(comboboxKeyAction('ArrowUp', { open: true, active: 1, count: 3 }, { altKey: true }), { open: false, active: -1 });
});

test('Enter selects the active option; Escape closes, then clears', () => {
  assert.deepEqual(comboboxKeyAction('Enter', { open: true, active: 1, count: 3 }), { select: 1, open: false, active: -1 });
  assert.equal(comboboxKeyAction('Enter', { open: true, active: -1, count: 3 }), null);
  assert.equal(comboboxKeyAction('Enter', { open: false, active: -1, count: 3 }), null);
  assert.deepEqual(comboboxKeyAction('Escape', { open: true, active: 1, count: 3 }), { open: false, active: -1 });
  assert.deepEqual(comboboxKeyAction('Escape', { open: false, active: -1, count: 3 }), { clear: true });
});

test('Tab closes without preventing focus from moving; text keys are left alone', () => {
  assert.deepEqual(comboboxKeyAction('Tab', { open: true, active: 0, count: 3 }), { open: false, active: -1, passthrough: true });
  assert.equal(comboboxKeyAction('Tab', { open: false, active: -1, count: 3 }), null);
  for (const key of ['a', 'Home', 'End', 'ArrowLeft', 'Backspace']) {
    assert.equal(comboboxKeyAction(key, { open: true, active: 0, count: 3 }), null, key);
  }
});

test('empty result lists never produce an active option', () => {
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: false, active: -1, count: 0 }), { open: true, active: -1 });
  assert.deepEqual(comboboxKeyAction('ArrowDown', { open: true, active: -1, count: 0 }), { active: -1 });
  assert.deepEqual(comboboxKeyAction('ArrowUp', { open: true, active: -1, count: 0 }), { active: -1 });
});
