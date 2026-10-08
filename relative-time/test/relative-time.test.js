import { test } from 'node:test';
import assert from 'node:assert/strict';
import relativeTimeDefault, { relativeTime, createFormatter, selectUnit } from '../index.js';

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;
const en = (offset, opts = {}) => relativeTime(NOW + offset, { now: NOW, locale: 'en', ...opts });

test('default export is relativeTime', () => {
  assert.equal(relativeTimeDefault, relativeTime);
});

test('zero difference is "now"', () => {
  assert.equal(en(0), 'now');
  assert.equal(en(-0.2 * S), 'now'); // rounds to -0, normalized to 0
  assert.equal(en(0, { numeric: 'always' }), 'in 0 seconds');
});

test('past and future in every unit', () => {
  assert.equal(en(-5 * S), '5 seconds ago');
  assert.equal(en(5 * S), 'in 5 seconds');
  assert.equal(en(-3 * M), '3 minutes ago');
  assert.equal(en(3 * M), 'in 3 minutes');
  assert.equal(en(-5 * H), '5 hours ago');
  assert.equal(en(5 * H), 'in 5 hours');
  assert.equal(en(-3 * D), '3 days ago');
  assert.equal(en(3 * D), 'in 3 days');
  assert.equal(en(-2 * 7 * D), '2 weeks ago');
  assert.equal(en(2 * 7 * D), 'in 2 weeks');
  assert.equal(en(-90 * D), '3 months ago');
  assert.equal(en(90 * D), 'in 3 months');
  assert.equal(en(-3 * 365.25 * D), '3 years ago');
  assert.equal(en(3 * 365.25 * D), 'in 3 years');
});

test('numeric: auto uses words, always uses numbers', () => {
  assert.equal(en(-D), 'yesterday');
  assert.equal(en(D), 'tomorrow');
  assert.equal(en(-7 * D), 'last week');
  assert.equal(en(365.25 * D), 'next year');
  assert.equal(en(-D, { numeric: 'always' }), '1 day ago');
  assert.equal(en(7 * D, { numeric: 'always' }), 'in 1 week');
});

test('boundary: seconds -> minutes', () => {
  assert.equal(en(-59 * S), '59 seconds ago');
  assert.equal(en(-59.4 * S), '59 seconds ago');
  assert.equal(en(-59.5 * S), '1 minute ago'); // rounds to 60s
  assert.equal(en(-60 * S), '1 minute ago');
  assert.equal(en(60 * S, { numeric: 'always' }), 'in 1 minute');
});

test('boundary: minutes -> hours', () => {
  assert.equal(en(-59 * M), '59 minutes ago');
  assert.equal(en(-59.5 * M), '1 hour ago');
  assert.equal(en(-60 * M), '1 hour ago');
});

test('boundary: hours -> days', () => {
  assert.equal(en(-23 * H), '23 hours ago');
  assert.equal(en(-23.5 * H), 'yesterday');
  assert.equal(en(24 * H), 'tomorrow');
});

test('boundary: days -> weeks', () => {
  assert.equal(en(-6 * D), '6 days ago');
  assert.equal(en(-6.5 * D), 'last week');
  assert.equal(en(7 * D), 'next week');
});

test('boundary: weeks -> months', () => {
  assert.equal(en(-3 * 7 * D), '3 weeks ago');
  assert.equal(en(-24 * D), '3 weeks ago'); // 3.43 weeks
  assert.equal(en(-25 * D), 'last month'); // 3.57 weeks rounds to 4
  assert.equal(en(30 * D), 'next month');
});

test('boundary: months -> years', () => {
  assert.equal(en(-11 * 30.4375 * D), '11 months ago');
  assert.equal(en(-11.4 * 30.4375 * D), '11 months ago');
  assert.equal(en(-11.6 * 30.4375 * D), 'last year');
  assert.equal(en(-100 * 365.25 * D), '100 years ago');
});

test('selectUnit', () => {
  assert.deepEqual(selectUnit(0), { value: 0, unit: 'second' });
  assert.deepEqual(selectUnit(-0.4), { value: 0, unit: 'second' });
  assert.ok(Object.is(selectUnit(-0.4).value, 0));
  assert.deepEqual(selectUnit(-90), { value: -2, unit: 'minute' });
  assert.deepEqual(selectUnit(7200), { value: 2, unit: 'hour' });
  assert.deepEqual(selectUnit(-86400 * 2), { value: -2, unit: 'day' });
  assert.deepEqual(selectUnit(86400 * 14), { value: 2, unit: 'week' });
  assert.deepEqual(selectUnit(86400 * 61), { value: 2, unit: 'month' });
  assert.deepEqual(selectUnit(-86400 * 365.25 * 5), { value: -5, unit: 'year' });
});

test('accepts Date, number and ISO string for date and now', () => {
  const now = new Date('2026-01-15T12:00:00Z');
  assert.equal(relativeTime(new Date('2026-01-15T11:57:00Z'), { now, locale: 'en' }), '3 minutes ago');
  assert.equal(relativeTime(now.getTime() - 3 * M, { now, locale: 'en' }), '3 minutes ago');
  assert.equal(relativeTime('2026-01-15T11:57:00Z', { now, locale: 'en' }), '3 minutes ago');
  assert.equal(relativeTime('2026-01-17T12:00:00Z', { now: '2026-01-15T12:00:00Z', locale: 'en' }), 'in 2 days');
  assert.equal(relativeTime(NOW, { now: NOW, locale: 'en' }), 'now');
});

test('defaults now to Date.now()', () => {
  assert.equal(relativeTime(Date.now() - 5 * M, { locale: 'en' }), '5 minutes ago');
  assert.equal(relativeTime(Date.now() + 2 * D + H, { locale: 'en' }), 'in 2 days');
});

test('invalid input throws TypeError', () => {
  assert.throws(() => relativeTime('not a date'), TypeError);
  assert.throws(() => relativeTime(new Date(NaN)), TypeError);
  assert.throws(() => relativeTime(NaN), TypeError);
  assert.throws(() => relativeTime(Infinity), TypeError);
  assert.throws(() => relativeTime(null), TypeError);
  assert.throws(() => relativeTime(undefined), TypeError);
  assert.throws(() => relativeTime({}), TypeError);
  assert.throws(() => relativeTime(NOW, { now: 'nope' }), /invalid now/);
});

test('style: short and narrow', () => {
  assert.equal(en(-3 * M, { style: 'short' }), '3 min. ago');
  assert.equal(en(2 * H, { style: 'short' }), 'in 2 hr.');
  assert.match(en(-3 * M, { style: 'narrow' }), /^3\s?m(in)?\.? ago$/);
});

test('locales', () => {
  const fmt = (offset, locale, numeric) => relativeTime(NOW + offset, { now: NOW, locale, numeric });
  // Spanish
  assert.equal(fmt(-3 * M, 'es'), 'hace 3 minutos');
  assert.equal(fmt(2 * D, 'es'), 'pasado mañana');
  assert.equal(fmt(2 * D, 'es', 'always'), 'dentro de 2 días');
  assert.equal(fmt(-D, 'es'), 'ayer');
  // German
  assert.equal(fmt(-3 * M, 'de'), 'vor 3 Minuten');
  assert.equal(fmt(D, 'de'), 'morgen');
  assert.equal(fmt(3 * 7 * D, 'de'), 'in 3 Wochen');
  // French
  assert.equal(fmt(-2 * H, 'fr'), 'il y a 2 heures');
  assert.equal(fmt(-D, 'fr'), 'hier');
  assert.equal(fmt(5 * 365.25 * D, 'fr'), 'dans 5 ans');
  // Japanese
  assert.equal(fmt(-3 * D, 'ja'), '3 日前');
  assert.equal(fmt(-D, 'ja'), '昨日');
  // Arabic uses its own plural forms
  assert.equal(fmt(-D, 'ar'), 'أمس');
  // Russian plural categories
  assert.equal(fmt(-2 * M, 'ru'), '2 минуты назад');
  assert.equal(fmt(-5 * M, 'ru'), '5 минут назад');
  // Locale fallback list
  assert.equal(fmt(-D, ['xx-invalid-zz', 'de'].slice(1)), 'gestern');
});

test('createFormatter reuses defaults and allows overrides', () => {
  const ago = createFormatter({ locale: 'en', now: NOW });
  assert.equal(ago(NOW - 10 * S), '10 seconds ago');
  assert.equal(ago(NOW + D), 'tomorrow');
  assert.equal(ago(NOW + D, { numeric: 'always' }), 'in 1 day');
  assert.equal(ago(NOW - D, { locale: 'de' }), 'gestern');
  const live = createFormatter({ locale: 'en' });
  assert.equal(live(Date.now() - 2 * H), '2 hours ago');
  assert.equal(createFormatter()(NOW, { now: NOW, locale: 'en' }), 'now');
});
