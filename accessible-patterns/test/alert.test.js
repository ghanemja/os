import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAnnouncement, liveRegionAttributes } from '../patterns/alert/alert.js';

const NBSP = ' ';

test('new messages are written as-is (trimmed)', () => {
  assert.equal(nextAnnouncement('', 'Saved'), 'Saved');
  assert.equal(nextAnnouncement('Saved', '  Deleted '), 'Deleted');
});

test('repeated messages alternate a trailing non-breaking space so they are re-announced', () => {
  const first = nextAnnouncement('', 'Saved');
  const second = nextAnnouncement(first, 'Saved');
  const third = nextAnnouncement(second, 'Saved');
  assert.equal(second, 'Saved' + NBSP);
  assert.equal(third, 'Saved');
  assert.notEqual(first, second);
  assert.notEqual(second, third);
});

test('liveRegionAttributes', () => {
  assert.deepEqual(liveRegionAttributes(false), { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  assert.deepEqual(liveRegionAttributes(true), { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' });
});
