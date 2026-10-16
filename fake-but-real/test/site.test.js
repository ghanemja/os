import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('demo site: index.html has Pages meta and runs the real library', () => {
  assert.ok(existsSync(join(ROOT, 'index.html')));
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<meta property="og:url" content="https:\/\/ghanemja\.github\.io\/fake-but-real\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/ghanemja\.github\.io\/fake-but-real\/docs\/og\.png">/);
  assert.match(html, /from '\.\/index\.js'/);
});

test('demo site: Pages workflow and .nojekyll exist', () => {
  assert.ok(existsSync(join(ROOT, '.github', 'workflows', 'pages.yml')));
  assert.ok(existsSync(join(ROOT, '.nojekyll')));
});
