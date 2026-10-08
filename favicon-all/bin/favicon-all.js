#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateFavicons } from '../src/index.js';

const HELP = `favicon-all - one SVG in, every favicon out

Usage:
  favicon-all input.svg [options]

Options:
  --out <dir>          Output directory (default: ./favicons)
  --name <text>        App name for the manifest (default: "App")
  --short-name <text>  Short name for the manifest (default: --name)
  --color <#hex>       Theme color (default: #ffffff)
  --background <#hex>  Background for apple-touch/maskable icons and manifest (default: #ffffff)
  --base-path <path>   URL prefix used in tags and manifest (default: /)
  --png                Require PNG + ICO output (fail if no rasterizer works)
  --no-png             Only write favicon.svg, manifest and tags
  -q, --quiet          Do not print the HTML tags
  -h, --help           Show this help

By default PNG and ICO files are written when a rasterizer is available
(rsvg-convert, ImageMagick, Inkscape or Chromium). If none is found you get a warning.
`;

function fail(message) {
  process.stderr.write(`favicon-all: ${message}\n`);
  process.exit(1);
}

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string' }, name: { type: 'string' }, 'short-name': { type: 'string' },
      color: { type: 'string' }, background: { type: 'string' }, 'base-path': { type: 'string' },
      png: { type: 'boolean' }, 'no-png': { type: 'boolean' }, quiet: { type: 'boolean', short: 'q' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (err) {
  fail(`${err.message}\n\n${HELP}`);
}
const { values: args, positionals } = parsed;

if (args.help) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (positionals.length !== 1) fail(`expected exactly one input SVG\n\n${HELP}`);
const input = resolve(positionals[0]);
if (!existsSync(input)) fail(`input not found: ${input}`);
if (args.png && args['no-png']) fail('--png and --no-png cannot be combined');

try {
  const result = generateFavicons({
    input,
    outDir: resolve(args.out || 'favicons'),
    name: args.name || 'App',
    shortName: args['short-name'],
    color: args.color || '#ffffff',
    background: args.background || '#ffffff',
    basePath: args['base-path'] || '/',
    png: args['no-png'] ? false : args.png ? true : 'auto',
    log: (msg) => process.stderr.write(msg + '\n'),
  });
  for (const w of result.warnings) process.stderr.write(`warning: ${w}\n`);
  if (result.rasterizer) process.stderr.write(`PNG files rendered with ${result.rasterizer}\n`);
  if (!args.quiet) process.stdout.write(`\nAdd to your <head>:\n\n${result.tags}`);
} catch (err) {
  fail(err.message);
}
