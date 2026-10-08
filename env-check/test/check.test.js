import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkEnv, validateEnv, EnvCheckError, formatErrors, generateExample, parseDotenv } from '../index.js';

const schema = {
  PORT: { type: 'port', default: 3000 },
  DATABASE_URL: { type: 'url', required: true },
  MODE: { type: 'enum', values: ['dev', 'prod'] },
};

test('returns a typed config', () => {
  const config = checkEnv(schema, { env: { DATABASE_URL: 'postgres://localhost/db', MODE: 'prod', PORT: '8080' } });
  assert.deepEqual(config, { PORT: 8080, DATABASE_URL: 'postgres://localhost/db', MODE: 'prod' });
});

test('applies defaults and leaves optional values undefined', () => {
  const config = checkEnv(schema, { env: { DATABASE_URL: 'https://x.test' } });
  assert.equal(config.PORT, 3000);
  assert.equal(config.MODE, undefined);
  assert.ok('MODE' in config);
});

test('string defaults are parsed with the type', () => {
  const c = checkEnv({ P: { type: 'port', default: '80' }, B: { type: 'boolean', default: 'yes' } }, { env: {} });
  assert.deepEqual(c, { P: 80, B: true });
  assert.throws(() => checkEnv({ P: { type: 'port', default: 'nope' } }, { env: {} }), TypeError);
});

test('empty string counts as missing', () => {
  assert.throws(() => checkEnv(schema, { env: { DATABASE_URL: '' } }), EnvCheckError);
});

test('collects all errors at once', () => {
  try {
    checkEnv(schema, { env: { PORT: '99999', MODE: 'staging' } });
    assert.fail('should throw');
  } catch (err) {
    assert.ok(err instanceof EnvCheckError);
    assert.deepEqual(err.errors.map((e) => e.key), ['PORT', 'DATABASE_URL', 'MODE']);
    assert.match(err.message, /3 problems/);
    assert.match(err.message, /PORT\s+port\s+"99999" is not a valid port/);
    assert.match(err.message, /DATABASE_URL\s+url\s+is required but not set/);
    assert.match(err.message, /MODE\s+enum: dev \| prod\s+"staging" is not one of: dev, prod/);
  }
});

test('every type parses and rejects', () => {
  const s = {
    S: { type: 'string' },
    N: { type: 'number' },
    I: { type: 'integer' },
    B1: { type: 'boolean' },
    B2: { type: 'boolean' },
    U: { type: 'url' },
    E: { type: 'email' },
    P: { type: 'port' },
    J: { type: 'json' },
  };
  const ok = validateEnv(s, { S: 'hi', N: '3.5', I: '-7', B1: 'TRUE', B2: 'off', U: 'redis://h:6379', E: 'a@b.co', P: '443', J: '{"a":[1]}' });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.config, { S: 'hi', N: 3.5, I: -7, B1: true, B2: false, U: 'redis://h:6379', E: 'a@b.co', P: 443, J: { a: [1] } });

  const bad = validateEnv(s, { S: 'x', N: 'abc', I: '1.5', B1: 'maybe', B2: '2', U: 'localhost:5432', E: 'nope@', P: '0', J: '{bad' });
  assert.deepEqual(bad.errors.map((e) => e.key), ['N', 'I', 'B1', 'B2', 'U', 'E', 'P', 'J']);
});

test('number min/max', () => {
  const s = { W: { type: 'integer', min: 1, max: 16 } };
  assert.equal(checkEnv(s, { env: { W: '4' } }).W, 4);
  assert.throws(() => checkEnv(s, { env: { W: '0' } }), /must be >= 1/);
  assert.throws(() => checkEnv(s, { env: { W: '17' } }), /must be <= 16/);
});

test('secret values are not printed', () => {
  const { errors } = validateEnv({ API_TOKEN: { type: 'integer' }, X: { type: 'integer', secret: true }, Y: { type: 'integer' } }, { API_TOKEN: 'sekret', X: 'hidden', Y: 'shown' });
  const msg = formatErrors(errors);
  assert.doesNotMatch(msg, /sekret|hidden/);
  assert.match(msg, /"shown"/);
});

test('description appears in the error', () => {
  const { errors } = validateEnv({ K: { type: 'string', required: true, description: 'Stripe key' } }, {});
  assert.match(formatErrors(errors), /is required but not set \(Stripe key\)/);
});

test('schema mistakes throw TypeError', () => {
  assert.throws(() => checkEnv({ A: { type: 'nope' } }, { env: {} }), TypeError);
  assert.throws(() => checkEnv({ A: { type: 'enum' } }, { env: {} }), TypeError);
});

test('dotenvPath merges file values, real env wins', () => {
  const dir = mkdtempSync(join(tmpdir(), 'env-check-'));
  const file = join(dir, '.env');
  writeFileSync(file, 'DATABASE_URL=postgres://file/db\nPORT=4000\nMODE=dev\n');
  const config = checkEnv(schema, { env: { PORT: '5000' }, dotenvPath: file });
  assert.deepEqual(config, { PORT: 5000, DATABASE_URL: 'postgres://file/db', MODE: 'dev' });
  // missing file is fine
  assert.equal(checkEnv(schema, { env: { DATABASE_URL: 'http://a.b' }, dotenvPath: join(dir, 'missing') }).PORT, 3000);
});

test('generateExample produces a parseable file', () => {
  const s = {
    ...schema,
    GREETING: { type: 'string', default: 'hello world', description: 'Shown on the home page' },
    FLAGS: { type: 'json', example: { beta: true } },
  };
  const text = generateExample(s);
  assert.match(text, /# port, optional, default: 3000\nPORT=3000/);
  assert.match(text, /# url, required\nDATABASE_URL=\n/);
  assert.match(text, /# enum: dev \| prod, optional\nMODE=/);
  assert.match(text, /# Shown on the home page\n/);
  const parsed = parseDotenv(text);
  assert.equal(parsed.GREETING, 'hello world');
  assert.deepEqual(JSON.parse(parsed.FLAGS), { beta: true });
});
