import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { patterns, get, compile, test as matches } from '../index.js';
import { renderMarkdown, renderIndex, COOKBOOK, INDEX } from '../scripts/build-docs.js';

const REQUIRED = [
  'email-simple', 'url', 'ipv4', 'ipv6', 'hex-color', 'uuid', 'semver', 'iso-date', 'iso-datetime', 'time-24h',
  'us-zip', 'uk-postcode', 'phone-e164', 'credit-card-shape', 'slug', 'username', 'strong-password', 'html-tag',
  'markdown-link', 'hashtag', 'mention', 'mac-address', 'domain', 'file-extension', 'trailing-whitespace',
  'duplicate-words', 'camelcase-split', 'number-thousands', 'currency', 'lat-long', 'jwt', 'base64', 'git-sha',
  'cron-basic',
];

test('has at least 30 patterns including the required set', () => {
  assert.ok(patterns.length >= 30);
  for (const name of REQUIRED) assert.ok(get(name), `missing ${name}`);
});

test('every entry is complete and well-formed', () => {
  const names = new Set();
  for (const p of patterns) {
    assert.ok(!names.has(p.name), `duplicate name ${p.name}`);
    names.add(p.name);
    assert.match(p.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${p.name}: name is a slug`);
    for (const key of ['category', 'pattern', 'description']) assert.ok(typeof p[key] === 'string' && p[key], `${p.name}.${key}`);
    assert.equal(typeof p.flags, 'string', `${p.name}.flags`);
    assert.match(p.flags, /^[dgimsuy]*$/, `${p.name}.flags`);
    assert.ok(Array.isArray(p.explanation) && p.explanation.length >= 2, `${p.name}.explanation`);
    for (const pair of p.explanation) assert.ok(Array.isArray(pair) && pair.length === 2 && pair.every((s) => typeof s === 'string' && s), `${p.name}.explanation entry`);
    assert.ok(Array.isArray(p.caveats) && p.caveats.length >= 1, `${p.name}.caveats`);
    assert.ok(p.matches.length >= 4, `${p.name} needs at least 4 matches`);
    assert.ok(p.nonMatches.length >= 4, `${p.name} needs at least 4 nonMatches`);
    // The literal form shown in the docs must itself be valid JavaScript.
    const literal = new Function(`return /${p.pattern}/${p.flags};`)();
    assert.equal(literal.source, new RegExp(p.pattern, p.flags).source, `${p.name}: literal form`);
  }
});

for (const p of patterns) {
  test(`pattern ${p.name}`, () => {
    for (const s of p.matches) assert.equal(new RegExp(p.pattern, p.flags).test(s), true, `${p.name} should match ${JSON.stringify(s)}`);
    for (const s of p.nonMatches) assert.equal(new RegExp(p.pattern, p.flags).test(s), false, `${p.name} should not match ${JSON.stringify(s)}`);
  });
}

test('API: get, compile, test', () => {
  assert.equal(get('nope'), undefined);
  assert.equal(get('uuid').name, 'uuid');
  assert.equal(compile('uuid').flags, 'i');
  assert.equal(compile('uuid', 'gi').flags, 'gi');
  assert.throws(() => compile('nope'), /Unknown pattern/);
  assert.equal(matches('ipv4', '10.0.0.1'), true);
  assert.equal(matches('ipv4', '10.0.0.256'), false);
  assert.deepEqual('XMLHttpRequest'.split(compile('camelcase-split')), ['XML', 'Http', 'Request']);
  assert.deepEqual(compile('semver').exec('1.2.3-beta.1+b7').slice(1), ['1', '2', '3', 'beta.1', 'b7']);
  assert.equal('a  \nb\t\nc'.replace(compile('trailing-whitespace', 'g'), ''), 'a\nb\nc');
});

test('COOKBOOK.md is in sync with patterns.js (run `npm run docs`)', () => {
  assert.equal(readFileSync(COOKBOOK, 'utf8'), renderMarkdown(patterns));
});

test('index.html embedded data is in sync with patterns.js (run `npm run docs`)', () => {
  const html = readFileSync(INDEX, 'utf8');
  assert.equal(html, renderIndex(html, patterns));
  const json = html.match(/<script id="cookbook-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(json), JSON.parse(JSON.stringify(patterns)));
});

test('every pattern has a section in COOKBOOK.md', () => {
  const md = readFileSync(COOKBOOK, 'utf8');
  for (const p of patterns) {
    assert.ok(md.includes(`### ${p.name}\n`), p.name);
    assert.ok(md.includes('/' + p.pattern + '/' + p.flags), `${p.name} pattern shown`);
  }
});
