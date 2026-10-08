import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePressed, nextPressed } from '../patterns/toggle-button/toggle-button.js';

test('parsePressed handles true, false, mixed and junk', () => {
  assert.equal(parsePressed('true'), true);
  assert.equal(parsePressed('false'), false);
  assert.equal(parsePressed('mixed'), 'mixed');
  assert.equal(parsePressed(null), false);
  assert.equal(parsePressed('pressed'), false);
});

test('nextPressed toggles, and mixed becomes pressed', () => {
  assert.equal(nextPressed(false), true);
  assert.equal(nextPressed(true), false);
  assert.equal(nextPressed('mixed'), true);
});
