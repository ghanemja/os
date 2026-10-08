#!/usr/bin/env node
import { scan, deleteUnused, formatBytes } from '../index.js';

const HELP = `Usage: unused-assets [dir] [options]

Finds images, fonts, video and audio files that no source file references.

Options:
  --ext <list>       Asset extensions to look for, e.g. png,jpg,svg
                     (replaces the default list)
  --ignore <glob>    Skip matching paths (repeatable or comma-separated)
  --no-gitignore     Do not apply .gitignore rules
  --json             Print the full report as JSON
  --delete --yes     Delete the unused files (never touches "maybe used")
  -h, --help         Show this help

node_modules, .git and dist are always skipped.
`;

function parseArgs(argv) {
  const opts = { dir: '.', ext: [], ignore: [], json: false, del: false, yes: false, gitignore: true };
  const list = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [flag, inline] = a.startsWith('--') && a.includes('=') ? a.split(/=(.*)/s) : [a, undefined];
    const value = () => {
      const v = inline !== undefined ? inline : argv[++i];
      if (v === undefined) throw new Error(`${flag} needs a value`);
      return v;
    };
    if (flag === '-h' || flag === '--help') opts.help = true;
    else if (flag === '--ext') opts.ext.push(...list(value()));
    else if (flag === '--ignore') opts.ignore.push(...list(value()));
    else if (flag === '--json') opts.json = true;
    else if (flag === '--delete') opts.del = true;
    else if (flag === '--yes' || flag === '-y') opts.yes = true;
    else if (flag === '--no-gitignore') opts.gitignore = false;
    else if (flag.startsWith('-')) throw new Error(`Unknown option ${flag}`);
    else opts.dir = a;
  }
  return opts;
}

function printList(title, items) {
  if (!items.length) return;
  console.log(title);
  const width = Math.max(...items.map((a) => formatBytes(a.size).length));
  for (const a of items) {
    const hint = a.status === 'maybe' ? `  (name without extension appears in ${a.references.slice(0, 3).join(', ')}${a.references.length > 3 ? ', ...' : ''})` : '';
    console.log(`  ${formatBytes(a.size).padStart(width)}  ${a.path}${hint}`);
  }
  console.log('');
}

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (err) {
  console.error(`unused-assets: ${err.message}`);
  process.exit(2);
}
if (opts.help) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (opts.del && !opts.yes) {
  console.error('unused-assets: --delete removes files permanently; add --yes to confirm.');
  process.exit(2);
}

const result = scan(opts.dir, { ext: opts.ext, ignore: opts.ignore, gitignore: opts.gitignore });
let deleted = [];
if (opts.del) deleted = deleteUnused(result);

if (opts.json) {
  const { root, used, maybe, unused, scanned, totalBytes, maybeBytes, reclaimableBytes } = result;
  console.log(JSON.stringify({ root, scanned, totalBytes, reclaimableBytes, maybeBytes, unused, maybe, used, deleted }, null, 2));
} else {
  printList(`Unused (${result.unused.length}, ${formatBytes(result.reclaimableBytes)}):`, result.unused);
  printList(`Maybe used (${result.maybe.length}, ${formatBytes(result.maybeBytes)}):`, result.maybe);
  console.log(`Scanned ${result.scanned.assets} assets against ${result.scanned.sources} source files. ` +
    `${result.used.length} used, ${result.maybe.length} maybe, ${result.unused.length} unused.`);
  console.log(`Reclaimable: ${formatBytes(result.reclaimableBytes)}`);
  if (opts.del) console.log(`Deleted ${deleted.length} file${deleted.length === 1 ? '' : 's'}.`);
}
