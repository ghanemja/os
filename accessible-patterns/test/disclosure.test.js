import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExpanded, disclosureState } from '../patterns/disclosure/disclosure.js';

test('isExpanded only treats the string "true" as expanded', () => {
  assert.equal(isExpanded('true'), true);
  for (const v of ['false', null, '', 'TRUE', 'yes']) assert.equal(isExpanded(v), false);
});

test('disclosureState keeps aria-expanded and hidden in sync', () => {
  assert.deepEqual(disclosureState(true), { 'aria-expanded': 'true', hidden: false });
  assert.deepEqual(disclosureState(false), { 'aria-expanded': 'false', hidden: true });
});
