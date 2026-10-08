// env-check — validate environment variables at startup with clear errors. Zero dependencies.
import { readFileSync, existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// .env parser
// ---------------------------------------------------------------------------

const KEY_RE = /(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*=/y;
const ESCAPES = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\', $: '$' };

/**
 * Parse the contents of a .env file into a plain object.
 * Supports comments, `export` prefixes, single/double/backtick quotes,
 * multiline quoted values and escapes (\n \r \t \" \\) in double quotes.
 * @param {string} src
 * @returns {Record<string, string>}
 */
export function parseDotenv(src) {
  const s = String(src).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const out = {};
  let i = 0;
  const eol = (from) => {
    const n = s.indexOf('\n', from);
    return n === -1 ? s.length : n;
  };

  while (i < s.length) {
    while (s[i] === ' ' || s[i] === '\t') i++;
    if (i >= s.length) break;
    if (s[i] === '\n') { i++; continue; }
    if (s[i] === '#') { i = eol(i) + 1; continue; }

    KEY_RE.lastIndex = i;
    const m = KEY_RE.exec(s);
    if (!m) { i = eol(i) + 1; continue; } // not a KEY=VALUE line: ignore it
    const key = m[1];
    i = KEY_RE.lastIndex;

    let spaced = false;
    while (s[i] === ' ' || s[i] === '\t') { i++; spaced = true; }

    const q = s[i];
    if (q === '"' || q === "'" || q === '`') {
      let j = i + 1;
      while (j < s.length && s[j] !== q) j += q === '"' && s[j] === '\\' ? 2 : 1;
      if (j < s.length) {
        const raw = s.slice(i + 1, j);
        out[key] = q === '"' ? raw.replace(/\\(.)/gs, (all, c) => ESCAPES[c] ?? all) : raw;
        i = eol(j + 1) + 1; // anything after the closing quote (e.g. a comment) is ignored
        continue;
      }
      // unterminated quote: fall through and treat the line as unquoted
    }

    const end = eol(i);
    let value = s.slice(i, end);
    // `#` starts a comment only at the start of the value (after whitespace) or after whitespace.
    if (value.startsWith('#') && (spaced || value === '#' || /^#\s/.test(value))) value = '';
    else value = value.replace(/[ \t]+#.*$/, '');
    out[key] = value.trim();
    i = end + 1;
  }
  return out;
}

/** Read and parse a .env file. Returns `{}` if the file does not exist. */
export function loadDotenv(path = '.env') {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path, 'utf8'));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const BOOL_TRUE = ['true', '1', 'yes', 'on', 'y'];
const BOOL_FALSE = ['false', '0', 'no', 'off', 'n'];
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// Each parser returns the typed value or throws an Error with a short reason.
const fail = (msg) => { throw new Error(msg); };

const TYPES = {
  string: (v) => v,
  number: (v, spec) => {
    const n = Number(v);
    if (v.trim() === '' || !Number.isFinite(n)) fail('is not a number');
    return range(n, spec);
  },
  integer: (v, spec) => {
    if (!/^[-+]?\d+$/.test(v.trim())) fail('is not an integer');
    return range(Number(v), spec);
  },
  boolean: (v) => {
    const l = v.trim().toLowerCase();
    if (BOOL_TRUE.includes(l)) return true;
    if (BOOL_FALSE.includes(l)) return false;
    return fail('is not a boolean (use true/false, 1/0, yes/no, on/off)');
  },
  url: (v) => {
    try {
      new URL(v);
      if (!/^[a-z][a-z0-9+.-]*:\/\/\S/i.test(v)) throw 0; // require scheme://, so "localhost:5432" is rejected
      return v;
    } catch {
      return fail('is not a valid URL');
    }
  },
  email: (v) => (EMAIL_RE.test(v.trim()) ? v.trim() : fail('is not a valid email address')),
  port: (v) => {
    const n = Number(v);
    if (!/^\d+$/.test(v.trim()) || n < 1 || n > 65535) fail('is not a valid port (1-65535)');
    return n;
  },
  enum: (v, spec) => (spec.values.includes(v) ? v : fail(`is not one of: ${spec.values.join(', ')}`)),
  json: (v) => {
    try {
      return JSON.parse(v);
    } catch {
      return fail('is not valid JSON');
    }
  },
};

function range(n, { min, max }) {
  if (min != null && n < min) fail(`must be >= ${min}`);
  if (max != null && n > max) fail(`must be <= ${max}`);
  return n;
}

export const types = Object.keys(TYPES);

const SECRET_RE = /SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|API_?KEY|CREDENTIAL/i;

function describe(spec) {
  return spec.type === 'enum' ? `enum: ${spec.values.join(' | ')}` : spec.type;
}

function checkSpec(key, spec) {
  if (!spec || typeof spec !== 'object') throw new TypeError(`env-check: schema for ${key} must be an object`);
  if (!TYPES[spec.type]) throw new TypeError(`env-check: ${key} has unknown type "${spec.type}" (expected one of ${types.join(', ')})`);
  if (spec.type === 'enum' && (!Array.isArray(spec.values) || spec.values.length === 0)) {
    throw new TypeError(`env-check: ${key} is an enum and needs a non-empty "values" array`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class EnvCheckError extends Error {
  constructor(errors) {
    super(formatErrors(errors));
    this.name = 'EnvCheckError';
    this.errors = errors;
  }
}

/**
 * Validate `env` against `schema`, collecting every problem.
 * Returns `{ config, errors }` and never throws for invalid values.
 */
export function validateEnv(schema, env = process.env) {
  const config = {};
  const errors = [];
  for (const [key, spec] of Object.entries(schema)) {
    if (key.startsWith('$')) continue; // allow "$schema" and similar metadata keys
    checkSpec(key, spec);
    const raw = env[key];
    const kind = describe(spec);
    if (raw === undefined || raw === '') {
      if (spec.default !== undefined) {
        config[key] = parseDefault(key, spec);
      } else if (spec.required) {
        errors.push({ key, type: kind, message: 'is required but not set', description: spec.description });
      } else {
        config[key] = undefined;
      }
      continue;
    }
    try {
      config[key] = TYPES[spec.type](raw, spec);
    } catch (err) {
      const secret = spec.secret ?? SECRET_RE.test(key);
      errors.push({ key, type: kind, message: err.message, value: secret ? undefined : raw, description: spec.description });
    }
  }
  return { config, errors };
}

function parseDefault(key, spec) {
  if (typeof spec.default !== 'string' || spec.type === 'string') return spec.default;
  try {
    return TYPES[spec.type](spec.default, spec);
  } catch (err) {
    throw new TypeError(`env-check: default for ${key} ${err.message}`);
  }
}

function show(value) {
  const one = JSON.stringify(value);
  return one.length > 42 ? `${one.slice(0, 39)}..."` : one;
}

/** Turn a list of errors into a readable, table-like message. */
export function formatErrors(errors) {
  if (!errors.length) return 'env-check: all variables are valid';
  const rows = errors.map((e) => [
    e.key,
    e.type,
    (e.value !== undefined ? `${show(e.value)} ` : '') + e.message + (e.description ? ` (${e.description})` : ''),
  ]);
  const head = ['VARIABLE', 'TYPE', 'PROBLEM'];
  const w = [0, 1].map((c) => Math.max(head[c].length, ...rows.map((r) => r[c].length)));
  const line = (r) => `  ${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2]}`.trimEnd();
  const n = errors.length;
  return [
    `env-check: ${n} problem${n === 1 ? '' : 's'} with environment variables`,
    '',
    line(head),
    line(['-'.repeat(w[0]), '-'.repeat(w[1]), '-'.repeat(7)]),
    ...rows.map(line),
  ].join('\n');
}

/**
 * Validate the environment and return a typed config object.
 * @param {object} schema
 * @param {{ env?: Record<string, string|undefined>, dotenvPath?: string, exit?: boolean }} [options]
 */
export function checkEnv(schema, options = {}) {
  const { env = process.env, dotenvPath, exit = false } = options;
  const merged = dotenvPath ? { ...loadDotenv(dotenvPath), ...env } : env;
  const { config, errors } = validateEnv(schema, merged);
  if (errors.length) {
    if (exit) {
      console.error(formatErrors(errors));
      process.exit(1);
    }
    throw new EnvCheckError(errors);
  }
  return config;
}

// ---------------------------------------------------------------------------
// .env.example
// ---------------------------------------------------------------------------

function quote(v) {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return /[\s#"'\\]/.test(s) || s === '' ? `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"` : s;
}

/** Build the text of a `.env.example` file from a schema. */
export function generateExample(schema) {
  const blocks = [];
  for (const [key, spec] of Object.entries(schema)) {
    if (key.startsWith('$')) continue;
    checkSpec(key, spec);
    const lines = [];
    if (spec.description) lines.push(`# ${spec.description}`);
    const meta = [describe(spec), spec.required && spec.default === undefined ? 'required' : 'optional'];
    if (spec.default !== undefined) meta.push(`default: ${typeof spec.default === 'string' ? spec.default : JSON.stringify(spec.default)}`);
    lines.push(`# ${meta.join(', ')}`);
    const value = spec.example ?? spec.default;
    lines.push(`${key}=${value === undefined ? '' : quote(value)}`);
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n') + '\n';
}

export default checkEnv;
