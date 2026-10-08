import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTabbable, nextTrapIndex, getBackgroundElements } from '../patterns/modal-dialog/modal-dialog.js';
import { el } from './fake-dom.js';

const visible = { isVisible: () => true };

test('nextTrapIndex wraps Tab and Shift+Tab inside the dialog', () => {
  assert.equal(nextTrapIndex(0, 3, false), 1);
  assert.equal(nextTrapIndex(2, 3, false), 0); // last -> first
  assert.equal(nextTrapIndex(0, 3, true), 2); // first -> last
  assert.equal(nextTrapIndex(1, 3, true), 0);
  assert.equal(nextTrapIndex(-1, 3, false), 0); // focus outside -> first
  assert.equal(nextTrapIndex(-1, 3, true), 2); // focus outside, shift -> last
  assert.equal(nextTrapIndex(0, 1, false), 0);
  assert.equal(nextTrapIndex(-1, 0, false), -1);
});

test('isTabbable accepts natively focusable elements', () => {
  for (const node of [el('button'), el('a', { href: '#' }), el('input', { type: 'text' }), el('select'), el('textarea'),
    el('summary'), el('div', { tabindex: '0' }), el('span', { contenteditable: 'true' }), el('video', { controls: '' })]) {
    assert.equal(isTabbable(node, visible), true, node.tagName);
  }
});

test('isTabbable rejects disabled, hidden, inert, negative tabindex and inert containers', () => {
  assert.equal(isTabbable(el('button', { disabled: '' }), visible), false);
  assert.equal(isTabbable(el('input', { type: 'hidden' }), visible), false);
  assert.equal(isTabbable(el('a'), visible), false); // no href
  assert.equal(isTabbable(el('div'), visible), false);
  assert.equal(isTabbable(el('button', { tabindex: '-1' }), visible), false);
  assert.equal(isTabbable(el('div', { contenteditable: 'false' }), visible), false);
  assert.equal(isTabbable(el('video'), visible), false);
  const inInert = el('button');
  el('div', { inert: '' }, [inInert]);
  assert.equal(isTabbable(inInert, visible), false);
  const inHidden = el('button');
  el('section', { hidden: '' }, [inHidden]);
  assert.equal(isTabbable(inHidden, visible), false);
  assert.equal(isTabbable(el('button'), { isVisible: () => false }), false);
  assert.equal(isTabbable(null), false);
});

test('getBackgroundElements returns siblings of the dialog and of each ancestor up to body', () => {
  const dialog = el('div', { role: 'dialog' });
  const header = el('header');
  const nav = el('nav');
  const script = el('script');
  const wrapperSibling = el('aside');
  const wrapper = el('div', {}, [nav, dialog]);
  const app = el('div', {}, [header, wrapper, wrapperSibling]);
  const footer = el('footer');
  el('body', {}, [app, footer, script]);
  assert.deepEqual(getBackgroundElements(dialog), [nav, header, wrapperSibling, footer]);
});
