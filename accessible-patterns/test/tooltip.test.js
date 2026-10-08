import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tooltipReducer, initialTooltipState } from '../patterns/tooltip/tooltip.js';

const run = (...events) => events.reduce(tooltipReducer, initialTooltipState);

test('shows on focus and on hover, hides on blur and leave', () => {
  assert.equal(run('focus').visible, true);
  assert.equal(run('focus', 'blur').visible, false);
  assert.equal(run('enter').visible, true);
  assert.equal(run('enter', 'leave').visible, false);
});

test('stays visible while the pointer moves onto the tooltip (hoverable)', () => {
  assert.equal(run('enter', 'tipenter', 'leave').visible, true);
  assert.equal(run('enter', 'tipenter', 'leave', 'tipleave').visible, false);
});

test('stays visible while focused even after the pointer leaves', () => {
  assert.equal(run('focus', 'enter', 'leave').visible, true);
});

test('Escape dismisses until the next focus or hover', () => {
  assert.equal(run('focus', 'escape').visible, false);
  assert.equal(run('focus', 'escape', 'enter').visible, true);
  assert.equal(run('enter', 'escape', 'leave', 'enter').visible, true);
  assert.equal(run('focus', 'escape', 'blur', 'focus').visible, true);
});

test('unknown events leave the state untouched', () => {
  const s = run('focus');
  assert.equal(tooltipReducer(s, 'nope'), s);
});
