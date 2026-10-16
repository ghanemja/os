import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

test('demo site: index.html has Pages meta and runs the real library', () => {
  assert.ok(existsSync(join(ROOT, 'index.html')));
  const html = read('index.html');
  assert.match(html, /<meta property="og:url" content="https:\/\/ghanemja\.github\.io\/env-check\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/ghanemja\.github\.io\/env-check\/docs\/og\.png">/);
  assert.match(html, /from '\.\/core\.js'/);
});

test('demo site: Pages workflow and .nojekyll exist', () => {
  assert.ok(existsSync(join(ROOT, '.github', 'workflows', 'pages.yml')));
  assert.ok(existsSync(join(ROOT, '.nojekyll')));
});

test('core.js is browser-safe (no node: imports) and index.js re-exports it', async () => {
  assert.doesNotMatch(read('core.js'), /from ['"]node:|require\(/);
  const core = await import('../core.js');
  const main = await import('../index.js');
  for (const name of Object.keys(core)) assert.equal(main[name], core[name], name);
});
