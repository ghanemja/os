import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'env-check.js');
const SCHEMA = {
  PORT: { type: 'port', default: 3000 },
  DATABASE_URL: { type: 'url', required: true, description: 'Postgres connection string' },
  MODE: { type: 'enum', values: ['dev', 'prod'] },
};

function setup(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'env-check-cli-'));
  writeFileSync(join(dir, 'env.schema.json'), JSON.stringify(SCHEMA));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

function run(dir, args = [], env = {}) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });
}

test('passes with a valid .env', () => {
  const dir = setup({ '.env': 'DATABASE_URL=postgres://localhost/app\nMODE=dev\n' });
  const r = run(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /all 3 variables OK/);
});

test('real environment overrides .env', () => {
  const dir = setup({ '.env': 'DATABASE_URL=postgres://localhost/app\nMODE=staging\n' });
  assert.equal(run(dir).status, 1);
  assert.equal(run(dir, [], { MODE: 'prod' }).status, 0);
});

test('fails with a table of every problem', () => {
  const dir = setup({ '.env': 'PORT=http\nMODE=test\n' });
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /3 problems/);
  assert.match(r.stderr, /VARIABLE\s+TYPE\s+PROBLEM/);
  assert.match(r.stderr, /PORT/);
  assert.match(r.stderr, /DATABASE_URL.*Postgres connection string/);
  assert.match(r.stderr, /MODE/);
});

test('--quiet, --no-dotenv and --env', () => {
  const dir = setup({ '.env': 'DATABASE_URL=postgres://x/y\n', 'prod.env': 'MODE=nope\n' });
  const q = run(dir, ['-q']);
  assert.equal(q.status, 0);
  assert.equal(q.stdout, '');
  assert.equal(run(dir, ['--no-dotenv']).status, 1);
  assert.equal(run(dir, ['--env', 'prod.env']).status, 1);
});

test('--schema path', () => {
  const dir = setup();
  writeFileSync(join(dir, 'other.json'), JSON.stringify({ A: { type: 'integer', required: true } }));
  assert.equal(run(dir, ['--schema', 'other.json'], { A: '5' }).status, 0);
  assert.equal(run(dir, ['--schema=other.json'], { A: 'x' }).status, 1);
});

test('--example writes .env.example', () => {
  const dir = setup();
  const r = run(dir, ['--example']);
  assert.equal(r.status, 0, r.stderr);
  const text = readFileSync(join(dir, '.env.example'), 'utf8');
  assert.match(text, /# Postgres connection string\n# url, required\nDATABASE_URL=/);
  assert.match(text, /PORT=3000/);
});

test('--example to a custom path and stdout', () => {
  const dir = setup();
  assert.equal(run(dir, ['--example', 'sample.env']).status, 0);
  assert.ok(existsSync(join(dir, 'sample.env')));
  const out = run(dir, ['--example', '-']);
  assert.match(out.stdout, /^# port, optional, default: 3000\nPORT=3000/);
});

test('usage and schema errors exit 2', () => {
  const dir = setup();
  assert.equal(run(dir, ['--bogus']).status, 2);
  assert.equal(run(dir, ['--schema', 'missing.json']).status, 2);
  writeFileSync(join(dir, 'broken.json'), '{nope');
  assert.equal(run(dir, ['--schema', 'broken.json']).status, 2);
  writeFileSync(join(dir, 'badtype.json'), '{"A":{"type":"weird"}}');
  const r = run(dir, ['--schema', 'badtype.json']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown type "weird"/);
});

test('--help', () => {
  const r = run(setup(), ['--help']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage: env-check/);
});
