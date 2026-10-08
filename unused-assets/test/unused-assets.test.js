import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { scan, deleteUnused, formatBytes, parseGitignore, isIgnored, compileRule } from '../index.js';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'bin', 'unused-assets.js');

// Copy the fixture site to a temp dir and add the files that git itself would not keep
// (skipped folders and .gitignored files).
function site() {
  const dir = join(mkdtempSync(join(tmpdir(), 'unused-assets-')), 'site');
  cpSync(join(here, '..', 'fixtures', 'site'), dir, { recursive: true });
  const put = (rel, bytes = 10) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), Buffer.alloc(bytes));
  };
  put('node_modules/pkg/a.png');
  put('dist/b.png');
  put('.git/c.png');
  put('build/d.png');
  put('src/build/e.png'); // "build/" without a slash elsewhere matches at any depth
  put('img/x.tmp.png');
  put('img/keep.tmp.png', 30); // re-included by "!keep.tmp.png"
  return dir;
}

const paths = (list) => list.map((a) => a.path).sort();

test('classifies used, maybe and unused assets', () => {
  const r = scan(site());
  assert.deepEqual(paths(r.used), [
    'docs/screenshot.png', 'favicon.ico', 'fonts/display.ttf', 'fonts/inter.woff2', 'icons/sprite.svg',
    'img/hero banner.jpg', 'img/logo.png', 'media/intro.mp4', 'src/bg.webp',
  ]);
  assert.deepEqual(paths(r.maybe), ['icons/arrow.svg', 'img/logo.webp']);
  assert.deepEqual(paths(r.unused), [
    'fonts/unused.otf', 'icons/self.svg', 'img/keep.tmp.png', 'img/logo-dark.png', 'img/old-banner.jpg',
    'media/outro.mp3', 'vendor/lib.png',
  ]);
});

test('records how each asset was matched and where', () => {
  const r = scan(site());
  const get = (p) => r.assets.find((a) => a.path === p);
  assert.equal(get('fonts/inter.woff2').reason, 'path');
  assert.deepEqual(get('fonts/inter.woff2').references, ['css/main.css']);
  assert.equal(get('img/hero banner.jpg').reason, 'path', 'URL-encoded relative path');
  assert.equal(get('fonts/display.ttf').reason, 'path', 'referenced from inside an SVG');
  assert.equal(get('src/bg.webp').reason, 'basename');
  assert.equal(get('favicon.ico').reason, 'basename');
  assert.equal(get('icons/arrow.svg').reason, 'stem');
  assert.deepEqual(get('icons/arrow.svg').references, ['src/app.js']);
  assert.equal(get('icons/self.svg').status, 'unused', 'self references do not count');
});

test('reports sizes and reclaimable bytes', () => {
  const dir = site();
  const r = scan(dir);
  const expected = r.unused.reduce((n, a) => n + statSync(join(dir, a.path)).size, 0);
  assert.equal(r.reclaimableBytes, expected);
  assert.equal(r.maybeBytes, 300 + statSync(join(dir, 'icons/arrow.svg')).size);
  assert.ok(r.totalBytes > r.reclaimableBytes);
  assert.equal(r.scanned.assets, r.used.length + r.maybe.length + r.unused.length);
});

test('skips node_modules, .git, dist and .gitignored paths', () => {
  const all = paths(scan(site()).assets);
  for (const p of ['node_modules/pkg/a.png', 'dist/b.png', '.git/c.png', 'build/d.png', 'src/build/e.png', 'img/x.tmp.png']) {
    assert.ok(!all.includes(p), p);
  }
  assert.ok(all.includes('img/keep.tmp.png'));
  const noGi = paths(scan(site(), { gitignore: false }).assets);
  assert.ok(noGi.includes('build/d.png') && noGi.includes('img/x.tmp.png'));
  assert.ok(!noGi.includes('dist/b.png'));
});

test('--ext limits asset types and --ignore skips globs', () => {
  const dir = site();
  assert.deepEqual(paths(scan(dir, { ext: ['.woff2', 'ttf', 'OTF'] }).assets), ['fonts/display.ttf', 'fonts/inter.woff2', 'fonts/unused.otf']);
  const r = scan(dir, { ignore: ['vendor/**', '*.mp3'] });
  assert.ok(!paths(r.assets).includes('vendor/lib.png'));
  assert.ok(!paths(r.assets).includes('media/outro.mp3'));
});

test('gitignore rules: anchoring, dir-only, negation, globstar', () => {
  const rules = parseGitignore('# comment\n\n/root-only.png\n*.log\nassets/**/raw/\n!important.log\ndocs/*.png\n');
  assert.equal(isIgnored(rules, 'root-only.png', false), true);
  assert.equal(isIgnored(rules, 'sub/root-only.png', false), false);
  assert.equal(isIgnored(rules, 'a/b/x.log', false), true);
  assert.equal(isIgnored(rules, 'important.log', false), false);
  assert.equal(isIgnored(rules, 'assets/raw', true), true);
  assert.equal(isIgnored(rules, 'assets/a/b/raw', true), true);
  assert.equal(isIgnored(rules, 'assets/raw', false), false, 'dir-only rule ignores files');
  assert.equal(isIgnored(rules, 'docs/a.png', false), true);
  assert.equal(isIgnored(rules, 'docs/deep/a.png', false), false);
  const nested = parseGitignore('*.png\n', 'sub');
  assert.equal(isIgnored(nested, 'sub/a.png', false), true);
  assert.equal(isIgnored(nested, 'a.png', false), false);
  assert.ok(compileRule('img/[ab].png').re.test('img/a.png'));
});

test('deleteUnused removes only unused files', () => {
  const dir = site();
  const r = scan(dir);
  const deleted = deleteUnused(r);
  assert.deepEqual(deleted.sort(), paths(r.unused));
  for (const p of deleted) assert.ok(!existsSync(join(dir, p)));
  for (const a of [...r.used, ...r.maybe]) assert.ok(existsSync(join(dir, a.path)));
  assert.equal(scan(dir).unused.length, 0);
});

test('formatBytes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1023), '1023 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');
  assert.equal(formatBytes(200 * 1024), '200 KB');
});

const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('CLI: text report and JSON', () => {
  const dir = site();
  const text = run(dir);
  assert.equal(text.status, 0);
  assert.match(text.stdout, /Unused \(7, /);
  assert.match(text.stdout, /old-banner\.jpg/);
  assert.match(text.stdout, /Maybe used \(2, /);
  assert.match(text.stdout, /Reclaimable: /);
  const json = JSON.parse(run(dir, '--json', '--ext', 'jpg').stdout);
  assert.deepEqual(json.unused.map((a) => a.path), ['img/old-banner.jpg']);
  assert.equal(json.reclaimableBytes, 1000);
});

test('CLI: --delete requires --yes', () => {
  const dir = site();
  const refused = run(dir, '--delete');
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /--yes/);
  assert.ok(existsSync(join(dir, 'img/old-banner.jpg')));
  const ok = run(dir, '--delete', '--yes');
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /Deleted 7 files/);
  assert.ok(!existsSync(join(dir, 'img/old-banner.jpg')));
  assert.ok(existsSync(join(dir, 'img/logo.webp')), 'maybe-used files are kept');
  assert.match(run('--help').stdout, /Usage: unused-assets/);
  assert.equal(run(dir, '--bogus').status, 2);
});
