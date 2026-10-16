import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

test('index.html is the demo site and runs the real library', () => {
  assert.ok(existsSync(here('index.html')), 'index.html exists');
  const html = readFileSync(here('index.html'), 'utf8');
  assert.match(html, /<meta property="og:url" content="https:\/\/ghanemja\.github\.io\/tiny-confetti\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/ghanemja\.github\.io\/tiny-confetti\/docs\/og\.png">/);
  assert.match(html, /import [^;]+ from '\.\/tiny-confetti\.js'/, 'imports the library by relative path');
});

test('GitHub Pages files are present', () => {
  assert.ok(existsSync(here('.github/workflows/pages.yml')), '.github/workflows/pages.yml exists');
  assert.ok(existsSync(here('.nojekyll')), '.nojekyll exists');
});
