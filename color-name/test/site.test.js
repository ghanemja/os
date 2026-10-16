import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('demo site: index.html exists with the Pages og:url and og:image', () => {
  assert.ok(existsSync(new URL('index.html', root)));
  const html = read('index.html');
  assert.match(html, /<meta property="og:url" content="https:\/\/ghanemja\.github\.io\/color-name\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/ghanemja\.github\.io\/color-name\/docs\/og\.png">/);
});

test('demo site imports the library by relative path', () => {
  assert.match(read('index.html'), /from '\.\/index\.js'/);
});

test('demo site deploy files exist', () => {
  assert.ok(existsSync(new URL('.github/workflows/pages.yml', root)));
  assert.ok(existsSync(new URL('.nojekyll', root)));
  assert.match(read('.github/workflows/pages.yml'), /actions\/deploy-pages/);
});
