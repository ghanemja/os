import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  detect, badges, toMarkdown, updateReadme, writeBadges, detectLicense, parseGitHub, shieldText, START, END,
} from '../index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', 'fixtures');
const cli = join(here, '..', 'bin', 'readme-badges.js');

// Copy a fixture into a temp dir so the monorepo's own .git is never picked up.
function fixture(name, gitRemote) {
  const root = mkdtempSync(join(tmpdir(), 'readme-badges-'));
  const dir = join(root, name);
  cpSync(join(fixtures, name), dir, { recursive: true });
  if (gitRemote) {
    mkdirSync(join(dir, '.git'));
    writeFileSync(join(dir, '.git', 'config'),
      `[core]\n\tbare = false\n[remote "upstream"]\n\turl = https://github.com/other/thing.git\n[remote "origin"]\n\turl = ${gitRemote}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`);
  }
  return dir;
}

const ids = (list) => list.map((b) => b.id);

test('detectLicense recognises common licenses by text', () => {
  for (const file of readdirSync(join(fixtures, 'licenses'))) {
    const expected = file === 'unknown.txt' ? null : file.replace(/\.txt$/, '');
    assert.equal(detectLicense(readFileSync(join(fixtures, 'licenses', file), 'utf8')), expected, file);
  }
  assert.equal(detectLicense(''), null);
});

test('parseGitHub handles common remote formats', () => {
  const want = { owner: 'acme', repo: 'widget' };
  for (const url of [
    'https://github.com/acme/widget.git', 'https://github.com/acme/widget', 'git@github.com:acme/widget.git',
    'ssh://git@github.com/acme/widget.git', 'git+https://github.com/acme/widget.git', 'github:acme/widget',
    'acme/widget', { type: 'git', url: 'https://github.com/acme/widget' },
  ]) assert.deepEqual(parseGitHub(url), want, JSON.stringify(url));
  assert.equal(parseGitHub('https://gitlab.com/acme/widget'), null);
  assert.equal(parseGitHub(null), null);
});

test('shieldText escapes dashes, underscores and spaces', () => {
  assert.equal(shieldText('Apache-2.0'), 'Apache--2.0');
  assert.equal(shieldText('a_b c'), 'a__b_c');
  assert.equal(shieldText('>=18'), '%3E%3D18');
});

test('node project: npm, CI per workflow, node engines, nvmrc, license', () => {
  const dir = fixture('node-app');
  const info = detect(dir);
  assert.equal(info.npm.name, '@acme/widget');
  assert.deepEqual(info.github, { owner: 'acme', repo: 'widget' }); // from package.json repository
  assert.equal(info.nvmrc, '20.11.0');
  assert.equal(info.license.spdx, 'MIT');
  const list = badges(dir);
  assert.deepEqual(ids(list), ['ci', 'ci', 'npm', 'downloads', 'bundlesize', 'installsize', 'node', 'nvmrc', 'license']);
  assert.equal(list[0].alt, 'CI');
  assert.equal(list[0].image, 'https://github.com/acme/widget/actions/workflows/ci.yml/badge.svg');
  assert.equal(list[1].alt, 'Release');
  assert.equal(list[2].image, 'https://img.shields.io/npm/v/@acme/widget');
  assert.equal(list[4].link, 'https://bundlephobia.com/package/@acme/widget');
  assert.equal(list[5].image, 'https://packagephobia.com/badge?p=@acme/widget');
  assert.match(list[6].image, /badge\/node-%3E%3D18-brightgreen/);
  assert.equal(list.at(-1).image, 'https://img.shields.io/badge/license-MIT-blue');
  assert.equal(list.at(-1).link, 'LICENSE');
});

test('git remote in .git/config wins over package.json and prefers origin', () => {
  const dir = fixture('node-app', 'git@github.com:someone/fork.git');
  assert.deepEqual(detect(dir).github, { owner: 'someone', repo: 'fork' });
  assert.match(badges(dir)[0].image, /someone\/fork\/actions/);
});

test('CI badges are skipped when the GitHub repo is unknown', () => {
  const dir = fixture('node-app');
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  delete pkg.repository;
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  assert.ok(!ids(badges(dir)).includes('ci'));
});

test('--style and --only', () => {
  const dir = fixture('node-app');
  const list = badges(dir, { style: 'for-the-badge', only: ['license', 'npm', 'ci'] });
  assert.deepEqual(ids(list), ['ci', 'ci', 'npm', 'license']);
  assert.ok(list.find((b) => b.id === 'npm').image.endsWith('?style=for-the-badge'));
  assert.ok(list.find((b) => b.id === 'license').image.endsWith('?style=for-the-badge'));
  assert.ok(!list[0].image.includes('style='), 'GitHub badge urls are left alone');
  const node = badges(dir, { style: 'flat-square', only: ['node'] })[0];
  assert.ok(node.image.endsWith('&style=flat-square'));
  assert.throws(() => badges(dir, { style: 'shiny' }), /Unknown style/);
});

test('python project via pyproject.toml', () => {
  const list = badges(fixture('python-app'));
  assert.deepEqual(ids(list), ['pypi', 'python', 'license']);
  assert.equal(list[0].image, 'https://img.shields.io/pypi/v/fancy-parser');
  assert.match(list[1].image, /badge\/python-%3E%3D3.9-3776AB/);
  assert.match(list[2].image, /license-Apache--2.0-blue/);
});

test('python project via setup.cfg, license from metadata', () => {
  const info = detect(fixture('setupcfg-app'));
  assert.deepEqual(info.python, { name: 'old_school', requiresPython: '>=3.8', license: 'ISC' });
  assert.equal(info.license.spdx, 'ISC');
  assert.equal(info.license.file, null);
});

test('rust project via Cargo.toml, GPL in COPYING', () => {
  const list = badges(fixture('rust-app'));
  assert.deepEqual(ids(list), ['crates', 'docsrs', 'license']);
  assert.equal(list[0].image, 'https://img.shields.io/crates/v/ferris-tools');
  assert.match(list[2].image, /license-GPL--3.0-blue/);
  assert.equal(list[2].link, 'COPYING');
});

test('go project via go.mod, Dockerfile, BSD license', () => {
  const dir = fixture('go-app');
  assert.deepEqual(detect(dir).github, { owner: 'acme', repo: 'gopher' }); // from module path
  const list = badges(dir);
  assert.deepEqual(ids(list), ['go', 'goversion', 'docker', 'license']);
  assert.equal(list[0].image, 'https://pkg.go.dev/badge/github.com/acme/gopher.svg');
  assert.equal(list[0].link, 'https://pkg.go.dev/github.com/acme/gopher');
  assert.match(list[2].image, /badge\/docker-golang%3A1.22--alpine-2496ED/);
  assert.match(list[3].image, /BSD--3--Clause/);
});

test('private package gets no npm badges', () => {
  const list = badges(fixture('private-app'));
  assert.deepEqual(ids(list), ['license']);
  assert.match(list[0].image, /UNLICENSED/);
});

test('toMarkdown renders linked images', () => {
  assert.equal(
    toMarkdown([{ id: 'x', alt: 'X [y]', image: 'https://i/x.svg', link: 'https://l' }]),
    '[![X y](https://i/x.svg)](https://l)',
  );
});

test('updateReadme inserts under the first heading, then replaces in place', () => {
  const readme = '# Title\n\nIntro.\n';
  const once = updateReadme(readme, 'A');
  assert.equal(once, `# Title\n\n${START}\nA\n${END}\n\nIntro.\n`);
  const twice = updateReadme(once, 'B');
  assert.equal(twice, `# Title\n\n${START}\nB\n${END}\n\nIntro.\n`);
  assert.equal(updateReadme(twice, 'B'), twice);
  assert.equal(updateReadme('No heading here.\n', 'A'), `${START}\nA\n${END}\n\nNo heading here.\n`);
  assert.equal(updateReadme('# Only\n', 'A'), `# Only\n\n${START}\nA\n${END}\n`);
});

test('writeBadges updates README.md and is idempotent', () => {
  const dir = fixture('node-app');
  const first = writeBadges(dir, { only: ['license', 'npm'] });
  assert.equal(first.changed, true);
  const text = readFileSync(join(dir, 'README.md'), 'utf8');
  assert.ok(text.startsWith(`# Widget\n\n${START}\n[![npm version]`));
  assert.ok(text.includes(`${END}\n\nA small widget.`));
  assert.equal(writeBadges(dir, { only: ['license', 'npm'] }).changed, false);
});

test('writeBadges replaces an existing block under a setext heading', () => {
  const dir = fixture('private-app');
  writeBadges(dir);
  const text = readFileSync(join(dir, 'README.md'), 'utf8');
  assert.ok(!text.includes('old.svg'));
  assert.ok(text.includes('license-UNLICENSED-blue'));
  assert.ok(text.startsWith('Internal Tool\n=============\n\n' + START));
});

test('writeBadges creates README.md when missing', () => {
  const dir = fixture('rust-app');
  assert.ok(!existsSync(join(dir, 'README.md')));
  writeBadges(dir);
  const text = readFileSync(join(dir, 'README.md'), 'utf8');
  assert.ok(text.startsWith(`# rust-app\n\n${START}\n`));
});

test('CLI prints markdown, JSON, and writes', () => {
  const dir = fixture('python-app');
  const out = execFileSync(process.execPath, [cli, dir, '--style', 'flat-square', '--only', 'pypi']).toString();
  assert.equal(out.trim(), '[![PyPI version](https://img.shields.io/pypi/v/fancy-parser?style=flat-square)](https://pypi.org/project/fancy-parser/)');
  const json = JSON.parse(execFileSync(process.execPath, [cli, dir, '--json']).toString());
  assert.equal(json.length, 3);
  const msg = execFileSync(process.execPath, [cli, dir, '--write']).toString();
  assert.match(msg, /Updated .*README\.md \(3 badges\)/);
  assert.ok(readFileSync(join(dir, 'README.md'), 'utf8').includes(START));
  assert.match(execFileSync(process.execPath, [cli, '--help']).toString(), /Usage: readme-badges/);
  assert.throws(() => execFileSync(process.execPath, [cli, dir, '--style', 'nope'], { stdio: 'pipe' }));
});
