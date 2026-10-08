#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { renderOgImage, TEMPLATES } from '../src/index.js';
import { detectRasterizers, svgToPng } from '../src/rasterize.js';

const HELP = `og-image - generate 1200x630 social preview images

Usage:
  og-image --title "Hello" [options]

Options:
  --title <text>        Title text (required)
  --subtitle <text>     Subtitle / description
  --template <name>     ${Object.keys(TEMPLATES).join(' | ')} (default: minimal)
  --theme <light|dark>  Color theme (default: light)
  --bg <#hex>           Background color
  --fg <#hex>           Text color
  --accent <#hex>       Accent color
  --author <name>       Author name (blog-post)
  --date <text>         Date text (blog-post)
  --site <text>         Site name / label
  --out <file>          Output file (.svg or .png). Default: SVG to stdout
  --png                 Also write a PNG next to the SVG (needs a rasterizer)
  --list-templates      List templates and exit
  --list-rasterizers    Show which PNG rasterizers were found and exit
  -h, --help            Show this help
`;

function fail(message) {
  process.stderr.write(`og-image: ${message}\n`);
  process.exit(1);
}

let args;
try {
  ({ values: args } = parseArgs({
    options: {
      title: { type: 'string' }, subtitle: { type: 'string' }, template: { type: 'string' },
      theme: { type: 'string' }, bg: { type: 'string' }, fg: { type: 'string' }, accent: { type: 'string' },
      author: { type: 'string' }, date: { type: 'string' }, site: { type: 'string' }, out: { type: 'string' },
      png: { type: 'boolean' }, 'list-templates': { type: 'boolean' }, 'list-rasterizers': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  }));
} catch (err) {
  fail(`${err.message}\n\n${HELP}`);
}

if (args.help) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (args['list-templates']) {
  for (const [name, t] of Object.entries(TEMPLATES)) process.stdout.write(`${name.padEnd(12)} ${t.description}\n`);
  process.exit(0);
}
if (args['list-rasterizers']) {
  const tools = detectRasterizers();
  if (!tools.length) process.stdout.write('No rasterizer found (SVG output still works).\n');
  for (const t of tools) process.stdout.write(`${t.name.padEnd(13)} ${t.bin}\n`);
  process.exit(0);
}
if (!args.title) fail(`--title is required\n\n${HELP}`);

let svg;
try {
  svg = renderOgImage(args);
} catch (err) {
  fail(err.message);
}

const out = args.out ? resolve(args.out) : null;
const wantsPng = args.png || (out && extname(out).toLowerCase() === '.png');
if (!out) {
  if (wantsPng) fail('--png needs --out <file>');
  process.stdout.write(svg);
  process.exit(0);
}

mkdirSync(dirname(out), { recursive: true });
const isPngOut = extname(out).toLowerCase() === '.png';
if (!isPngOut) {
  writeFileSync(out, svg);
  process.stderr.write(`wrote ${out}\n`);
}
if (wantsPng) {
  const pngPath = isPngOut ? out : out.replace(/\.[^./\\]*$/, '') + '.png';
  try {
    const tool = svgToPng(svg, pngPath, { width: 1200, height: 630 });
    process.stderr.write(`wrote ${pngPath} (via ${tool})\n`);
  } catch (err) {
    fail(`could not create PNG.\n${err.message}\n\nThe SVG output works without any extra tools; PNG needs one of the rasterizers above.`);
  }
}
