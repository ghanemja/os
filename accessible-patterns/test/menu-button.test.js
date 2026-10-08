import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buttonKeyAction, menuKeyAction, typeaheadIndex } from '../patterns/menu-button/menu-button.js';

test('buttonKeyAction opens on the first or last item', () => {
  for (const key of ['Enter', ' ', 'ArrowDown']) assert.equal(buttonKeyAction(key), 'first');
  assert.equal(buttonKeyAction('ArrowUp'), 'last');
  assert.equal(buttonKeyAction('Tab'), null);
});

test('menuKeyAction navigation wraps; Home/End/PageUp/PageDown jump', () => {
  assert.deepEqual(menuKeyAction('ArrowDown', 0, 3), { focus: 1 });
  assert.deepEqual(menuKeyAction('ArrowDown', 2, 3), { focus: 0 });
  assert.deepEqual(menuKeyAction('ArrowUp', 0, 3), { focus: 2 });
  assert.deepEqual(menuKeyAction('ArrowUp', -1, 3), { focus: 2 });
  assert.deepEqual(menuKeyAction('ArrowDown', -1, 3), { focus: 0 });
  assert.deepEqual(menuKeyAction('Home', 2, 3), { focus: 0 });
  assert.deepEqual(menuKeyAction('PageDown', 0, 3), { focus: 2 });
});

test('menuKeyAction closing and activation', () => {
  assert.deepEqual(menuKeyAction('Escape', 1, 3), { close: true, restoreFocus: true });
  assert.deepEqual(menuKeyAction('Tab', 1, 3), { close: true, restoreFocus: false });
  assert.deepEqual(menuKeyAction('Enter', 1, 3), { activate: true });
  assert.deepEqual(menuKeyAction(' ', 1, 3), { activate: true });
  assert.equal(menuKeyAction('x', 1, 3), null);
  assert.equal(menuKeyAction('ArrowDown', -1, 0), null);
  assert.deepEqual(menuKeyAction('Escape', -1, 0), { close: true, restoreFocus: true });
});

test('typeaheadIndex finds the next item starting with a character, wrapping', () => {
  const labels = ['Cut', 'Copy', 'Paste', ' Delete', 'copy link'];
  assert.equal(typeaheadIndex(labels, 0, 'c'), 1);
  assert.equal(typeaheadIndex(labels, 1, 'C'), 4);
  assert.equal(typeaheadIndex(labels, 4, 'c'), 0); // wraps
  assert.equal(typeaheadIndex(labels, 0, 'd'), 3); // leading whitespace ignored
  assert.equal(typeaheadIndex(labels, 0, 'z'), -1);
  assert.equal(typeaheadIndex(labels, 0, ' '), -1);
  assert.equal(typeaheadIndex(labels, -1, 'c'), 0);
});
