#!/usr/bin/env node
// env-check CLI: validate the environment (and .env) against env.schema.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { validateEnv, formatErrors, generateExample, loadDotenv } from '../index.js';

const HELP = `Usage: env-check [options]

Validate environment variables (and a .env file) against a JSON schema.

Options:
  -s, --schema <file>   Schema file (default: env.schema.json)
  -e, --env <file>      .env file to read (default: .env, skipped if missing)
      --no-dotenv       Only check the real environment, ignore .env
      --example [file]  Write a .env.example generated from the schema
                        (default: .env.example, use "-" for stdout)
  -q, --quiet           Print nothing on success
  -h, --help            Show this help

Exit codes: 0 valid, 1 invalid variables, 2 usage or schema error.
`;

function parseArgs(argv) {
  const opts = { schema: 'env.schema.json', env: '.env', dotenv: true, example: null, quiet: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === '-s' || a === '--schema') opts.schema = next();
    else if (a.startsWith('--schema=')) opts.schema = a.slice(9);
    else if (a === '-e' || a === '--env') opts.env = next();
    else if (a.startsWith('--env=')) opts.env = a.slice(6);
    else if (a === '--no-dotenv') opts.dotenv = false;
    else if (a === '--example') {
      const v = argv[i + 1];
      opts.example = v !== undefined && (v === '-' || !v.startsWith('-')) ? argv[++i] : '.env.example';
    } else if (a.startsWith('--example=')) opts.example = a.slice(10);
    else if (a === '-q' || a === '--quiet') opts.quiet = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else throw new Error(`unknown option: ${a}`);
  }
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`env-check: ${err.message}\n\n${HELP}`);
    return 2;
  }
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  let schema;
  try {
    if (!existsSync(opts.schema)) throw new Error(`schema file not found: ${opts.schema}`);
    schema = JSON.parse(readFileSync(opts.schema, 'utf8'));
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('schema must be a JSON object');
  } catch (err) {
    process.stderr.write(`env-check: ${err.message}\n`);
    return 2;
  }

  try {
    if (opts.example !== null) {
      const text = generateExample(schema);
      if (opts.example === '-') process.stdout.write(text);
      else {
        writeFileSync(opts.example, text);
        if (!opts.quiet) process.stdout.write(`env-check: wrote ${opts.example}\n`);
      }
      return 0;
    }

    const env = opts.dotenv ? { ...loadDotenv(opts.env), ...process.env } : process.env;
    const { errors } = validateEnv(schema, env);
    if (errors.length) {
      process.stderr.write(formatErrors(errors) + '\n');
      return 1;
    }
    if (!opts.quiet) {
      const n = Object.keys(schema).filter((k) => !k.startsWith('$')).length;
      process.stdout.write(`env-check: all ${n} variable${n === 1 ? '' : 's'} OK\n`);
    }
    return 0;
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    return 2;
  }
}

process.exitCode = main();
