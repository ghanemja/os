#!/usr/bin/env node
import { badges, toMarkdown, writeBadges, STYLES } from '../index.js';

const HELP = `Usage: readme-badges [dir] [options]

Detects your project and prints shields.io badge markdown.

Options:
  --write              Insert/update badges in README.md between
                       <!-- badges:start --> and <!-- badges:end -->
  --style <style>      ${STYLES.join(' | ')}
  --only <ids>         Comma-separated badge ids, e.g. license,npm,ci
                       (ids: ci npm downloads bundlesize installsize node nvmrc
                        pypi python crates docsrs go goversion docker license)
  --json               Print badges as JSON
  -h, --help           Show this help
`;

function parseArgs(argv) {
  const opts = { dir: '.', write: false, json: false, style: undefined, only: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [flag, inline] = a.startsWith('--') && a.includes('=') ? a.split(/=(.*)/s) : [a, undefined];
    const value = () => (inline !== undefined ? inline : argv[++i]);
    if (flag === '-h' || flag === '--help') opts.help = true;
    else if (flag === '--write') opts.write = true;
    else if (flag === '--json') opts.json = true;
    else if (flag === '--style') opts.style = value();
    else if (flag === '--only') opts.only = String(value() || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (flag.startsWith('-')) throw new Error(`Unknown option ${flag}`);
    else opts.dir = a;
  }
  return opts;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  const options = { style: opts.style, only: opts.only };
  if (opts.write) {
    const { file, badges: list, changed } = writeBadges(opts.dir, options);
    console.log(`${changed ? 'Updated' : 'Unchanged'} ${file} (${list.length} badge${list.length === 1 ? '' : 's'})`);
  } else {
    const list = badges(opts.dir, options);
    if (opts.json) console.log(JSON.stringify(list, null, 2));
    else if (list.length) console.log(toMarkdown(list));
    else console.error('No badges detected.');
  }
} catch (err) {
  console.error(`readme-badges: ${err.message}`);
  process.exit(1);
}
