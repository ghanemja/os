import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(root + p, 'utf8');

test('demo site: index.html exists with the Pages og:url', () => {
  assert.ok(existsSync(root + 'index.html'));
  const html = read('index.html');
  assert.match(html, /<meta property="og:url" content="https:\/\/ghanemja\.github\.io\/readable-id\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/ghanemja\.github\.io\/readable-id\/docs\/og\.png">/);
});

test('demo site: imports the library by relative path', () => {
  assert.match(read('index.html'), /import\s*\{[^}]+\}\s*from\s*'\.\/index\.js'/);
});

test('demo site: Pages workflow, .nojekyll and docs images exist', () => {
  assert.ok(existsSync(root + '.github/workflows/pages.yml'));
  assert.ok(existsSync(root + '.nojekyll'));
  assert.ok(existsSync(root + 'docs/og.png'));
  assert.ok(existsSync(root + 'docs/screenshot.png'));
  assert.match(read('README.md'), /\*\*Live demo:\*\* https:\/\/ghanemja\.github\.io\/readable-id\//);
});
