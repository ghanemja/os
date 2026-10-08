import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFaker } from '../index.js';

const everything = (f) => ({
  person: f.person(),
  company: f.company(),
  job: f.jobTitle(),
  product: f.product(),
  address: f.address(),
  bio: f.bio(),
  review: f.review(),
  range: f.dateRange(),
  shuffled: f.shuffle([1, 2, 3, 4, 5, 6]),
});

test('same seed gives identical output', () => {
  assert.deepEqual(everything(createFaker(123)), everything(createFaker(123)));
  assert.deepEqual(everything(createFaker('hello')), everything(createFaker('hello')));
});

test('different seeds give different output', () => {
  const a = JSON.stringify(everything(createFaker(1)));
  const b = JSON.stringify(everything(createFaker(2)));
  assert.notEqual(a, b);
});

test('person shape', () => {
  const f = createFaker(7);
  for (let i = 0; i < 200; i++) {
    const p = f.person();
    assert.equal(p.fullName, `${p.firstName} ${p.lastName}`);
    assert.match(p.email, /^[a-z0-9._]+@example\.(com|org|net)$/);
    assert.match(p.username, /^[a-z0-9._]+$/);
    assert.match(p.phone, /^\(\d{3}\) 555-01\d{2}$/);
  }
});

test('names are diverse', () => {
  const f = createFaker(99);
  const last = new Set(Array.from({ length: 300 }, () => f.lastName()));
  assert.ok(last.size > 60, `only ${last.size} unique last names`);
});

test('company, jobTitle, product', () => {
  const f = createFaker(3);
  for (let i = 0; i < 100; i++) {
    assert.ok(f.company().length > 3);
    assert.match(f.jobTitle(), /^[A-Z][\w ]+ [A-Z]\w+$/);
    const p = f.product();
    assert.equal(typeof p.name, 'string');
    assert.ok(p.price > 0 && Number.isFinite(p.price));
    assert.equal(Math.round(p.price * 100) / 100, p.price);
    assert.equal(p.currency, 'USD');
  }
});

test('address shape', () => {
  const f = createFaker(4);
  const a = f.address();
  assert.match(a.street, /^\d+ \w+ \w+$/);
  assert.match(a.postalCode, /^\d{5}$/);
  assert.match(a.regionCode, /^[A-Z]{2}$/);
  assert.equal(a.full, `${a.street}, ${a.city}, ${a.regionCode} ${a.postalCode}`);
});

test('bio is composed sentences with no leftover placeholders', () => {
  const f = createFaker(5);
  for (let i = 0; i < 100; i++) {
    const b = f.bio();
    assert.doesNotMatch(b, /[{}]/);
    assert.match(b, /\.$/);
  }
  assert.match(f.bio({ firstName: 'Zed' }), /Zed/);
});

test('review rating and text', () => {
  const f = createFaker(6);
  for (let i = 0; i < 100; i++) {
    const r = f.review();
    assert.ok([1, 2, 3, 4, 5].includes(r.rating));
    assert.ok(r.title.length > 0);
    assert.doesNotMatch(r.text, /[{}]/);
  }
  assert.equal(f.review({ rating: 2 }).rating, 2);
  assert.throws(() => f.review({ rating: 9 }), RangeError);
});

test('date and dateRange respect bounds', () => {
  const f = createFaker(8);
  const from = new Date('2024-01-01');
  const to = new Date('2024-02-01');
  for (let i = 0; i < 100; i++) {
    const d = f.date({ from, to });
    assert.ok(d >= from && d <= to);
    const r = f.dateRange({ from, to, minDays: 2, maxDays: 5 });
    assert.ok(r.days >= 2 && r.days <= 5);
    assert.equal(r.end - r.start, r.days * 86400000);
  }
  assert.throws(() => f.date({ from: to, to: from }), RangeError);
});

test('helpers', () => {
  const f = createFaker(9);
  const arr = [1, 2, 3, 4, 5];
  assert.deepEqual([...f.shuffle(arr)].sort(), arr);
  assert.deepEqual(arr, [1, 2, 3, 4, 5], 'shuffle does not mutate');
  assert.equal(f.sample(arr, 3).length, 3);
  assert.ok(arr.includes(f.pick(arr)));
  assert.throws(() => f.pick([]), RangeError);
  for (let i = 0; i < 100; i++) {
    const n = f.int(3, 6);
    assert.ok(Number.isInteger(n) && n >= 3 && n <= 6);
    const x = f.random();
    assert.ok(x >= 0 && x < 1);
  }
  assert.equal(typeof f.bool(), 'boolean');
});
