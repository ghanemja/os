import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skipTargetId, needsTabindex } from '../patterns/skip-link/skip-link.js';
import { el } from './fake-dom.js';

test('skipTargetId reads in-page fragments', () => {
  assert.equal(skipTargetId('#main'), 'main');
  assert.equal(skipTargetId('#caf%C3%A9'), 'café');
  assert.equal(skipTargetId('#100%'), '100%'); // malformed escape kept literally
  assert.equal(skipTargetId('#'), null);
  assert.equal(skipTargetId(''), null);
  assert.equal(skipTargetId(null), null);
});

test('skipTargetId resolves same-page URLs and rejects other pages', () => {
  const here = 'https://example.com/docs/page?x=1';
  assert.equal(skipTargetId('https://example.com/docs/page?x=1#content', here), 'content');
  assert.equal(skipTargetId('page?x=1#content', here), 'content');
  assert.equal(skipTargetId('/other#content', here), null);
  assert.equal(skipTargetId('https://evil.example/docs/page?x=1#content', here), null);
  assert.equal(skipTargetId('page#content'), null); // no base URL to compare with
});

test('needsTabindex is true only for elements that cannot take focus on their own', () => {
  assert.equal(needsTabindex(el('main')), true);
  assert.equal(needsTabindex(el('h1')), true);
  assert.equal(needsTabindex(el('a')), true);
  assert.equal(needsTabindex(el('main', { tabindex: '-1' })), false);
  assert.equal(needsTabindex(el('a', { href: '#x' })), false);
  assert.equal(needsTabindex(el('button')), false);
  assert.equal(needsTabindex(el('input')), false);
});
