// unused-assets: find images, fonts and media that no source file references.
import { readdirSync, readFileSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve, basename, extname, posix } from 'node:path';

export const DEFAULT_ASSET_EXTS = [
  // images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'tif', 'tiff', 'svg', 'heic',
  // fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // video
  'mp4', 'webm', 'mov', 'm4v', 'ogv', 'avi', 'mkv',
  // audio
  'mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus',
];

export const SOURCE_EXTS = [
  'html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'less', 'styl', 'pcss',
  'js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx', 'vue', 'svelte', 'astro',
  'md', 'mdx', 'markdown', 'json', 'json5', 'jsonc', 'webmanifest', 'yml', 'yaml', 'toml', 'xml', 'txt',
  'php', 'py', 'rb', 'erb', 'go', 'java', 'kt', 'swift', 'cs', 'cshtml', 'razor',
  'hbs', 'handlebars', 'mustache', 'njk', 'ejs', 'pug', 'jade', 'liquid', 'twig', 'jinja', 'j2',
  'svg', // SVGs can reference fonts and other images
];

export const DEFAULT_SKIP_DIRS = ['node_modules', '.git', 'dist'];

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- glob / .gitignore ----------

/** Convert one glob to a RegExp body (no anchors). Supports **, *, ?, [abc]. */
function globBody(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const slashAfter = glob[i + 2] === '/';
        re += slashAfter ? '(?:.*/)?' : '.*';
        i += slashAfter ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const end = glob.indexOf(']', i + 1);
      if (end === -1) re += '\\[';
      else {
        re += '[' + glob.slice(i + 1, end).replace(/^!/, '^').replace(/\\/g, '\\\\') + ']';
        i = end;
      }
    } else if (c === '\\' && i + 1 < glob.length) re += escapeRe(glob[++i]);
    else re += escapeRe(c);
  }
  return re;
}

/**
 * Compile a gitignore-style pattern into a rule.
 * Patterns containing a slash (other than a trailing one) are anchored to `base`.
 */
export function compileRule(pattern, base = '') {
  let p = pattern;
  const negate = p.startsWith('!');
  if (negate) p = p.slice(1);
  const dirOnly = p.endsWith('/');
  if (dirOnly) p = p.replace(/\/+$/, '');
  const anchored = p.includes('/');
  p = p.replace(/^\//, '');
  const body = globBody(p);
  const re = new RegExp((anchored ? '^' : '(?:^|/)') + body + '$');
  return { pattern, negate, dirOnly, base, re };
}

/** Parse .gitignore text into rules relative to `base` (a posix path from the scan root). */
export function parseGitignore(text, base = '') {
  const rules = [];
  for (let line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    line = line.replace(/(?<!\\)\s+$/, '');
    if (line.startsWith('\\#') || line.startsWith('\\!')) line = line.slice(1);
    rules.push(compileRule(line, base));
  }
  return rules;
}

/** Is `rel` (posix, from scan root) ignored by the rules? The last matching rule wins. */
export function isIgnored(rules, rel, isDir) {
  let ignored = false;
  for (const r of rules) {
    if (r.dirOnly && !isDir) continue;
    let p = rel;
    if (r.base) {
      if (!rel.startsWith(r.base + '/')) continue;
      p = rel.slice(r.base.length + 1);
    }
    if (r.re.test(p)) ignored = !r.negate;
  }
  return ignored;
}

// ---------- scanning ----------

function normExts(list) {
  return new Set(list.map((e) => e.trim().toLowerCase().replace(/^\./, '')).filter(Boolean));
}

function walk(root, { skipDirs, ignoreRules, useGitignore }) {
  const files = [];
  const visit = (abs, rel, rules) => {
    if (useGitignore) {
      const gi = join(abs, '.gitignore');
      if (existsSync(gi)) rules = rules.concat(parseGitignore(readFileSync(gi, 'utf8'), rel));
    }
    let entries;
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      const childAbs = join(abs, e.name);
      const isDir = e.isDirectory();
      if (!isDir && !e.isFile()) continue; // skip symlinks, sockets...
      if (isDir && skipDirs.has(e.name)) continue;
      if (isIgnored(rules, childRel, isDir) || isIgnored(ignoreRules, childRel, isDir)) continue;
      if (isDir) visit(childAbs, childRel, rules);
      else files.push({ path: childRel, abs: childAbs, size: statSync(childAbs).size });
    }
  };
  visit(root, '', []);
  return files;
}

function variants(s) {
  const out = new Set([s]);
  try {
    out.add(encodeURI(s));
  } catch {}
  return [...out];
}

/**
 * Scan `dir` and classify every asset as used, maybe (only its name without extension
 * appears somewhere) or unused.
 * @param {string} dir
 * @param {{ ext?: string[], ignore?: string[], gitignore?: boolean, skipDirs?: string[] }} [options]
 */
export function scan(dir = '.', options = {}) {
  const root = resolve(dir);
  const assetExts = normExts(options.ext?.length ? options.ext : DEFAULT_ASSET_EXTS);
  const sourceExts = normExts(SOURCE_EXTS);
  const ignoreRules = (options.ignore || []).map((g) => compileRule(g));
  const files = walk(root, {
    skipDirs: new Set(options.skipDirs || DEFAULT_SKIP_DIRS),
    ignoreRules,
    useGitignore: options.gitignore !== false,
  });

  const ext = (p) => extname(p).slice(1).toLowerCase();
  const assets = files.filter((f) => assetExts.has(ext(f.path)));
  const sources = files
    .filter((f) => sourceExts.has(ext(f.path)) && f.size <= MAX_SOURCE_BYTES)
    .map((f) => {
      const text = readFileSync(f.abs, 'utf8');
      return { path: f.path, text, lower: text.toLowerCase() };
    });

  const results = assets.map((a) => {
    const name = basename(a.path);
    const stem = name.slice(0, name.length - extname(name).length);
    const nameRe = new RegExp(`(?<![\\w.-])${escapeRe(name)}(?![\\w-])`, 'i');
    const stemRe = stem ? new RegExp(`(?<![\\w.-])${escapeRe(stem)}(?![\\w-])`, 'i') : null;
    const byPath = [];
    const byName = [];
    const byStem = [];
    for (const s of sources) {
      if (s.path === a.path) continue; // a file referencing itself does not count
      const fromSource = posix.relative(posix.dirname(s.path), a.path);
      const paths = [...variants(a.path), ...variants(fromSource)];
      if (paths.some((p) => p.includes('/') && s.text.includes(p))) byPath.push(s.path);
      else if (s.lower.includes(name.toLowerCase()) && nameRe.test(s.text)) byName.push(s.path);
      else if (stemRe && s.lower.includes(stem.toLowerCase()) && stemRe.test(s.text)) byStem.push(s.path);
    }
    let status = 'unused';
    let reason = null;
    if (byPath.length) [status, reason] = ['used', 'path'];
    else if (byName.length) [status, reason] = ['used', 'basename'];
    else if (byStem.length) [status, reason] = ['maybe', 'stem'];
    return {
      path: a.path,
      size: a.size,
      status,
      reason,
      references: status === 'used' ? [...byPath, ...byName] : byStem,
    };
  });

  const pick = (st) => results.filter((r) => r.status === st);
  const sum = (list) => list.reduce((n, r) => n + r.size, 0);
  const unused = pick('unused');
  const maybe = pick('maybe');
  const used = pick('used');
  return {
    root,
    assets: results,
    used,
    maybe,
    unused,
    scanned: { assets: assets.length, sources: sources.length },
    totalBytes: sum(results),
    maybeBytes: sum(maybe),
    reclaimableBytes: sum(unused),
  };
}

/** Delete the files in `result.unused`. Returns the list of deleted relative paths. */
export function deleteUnused(result) {
  const deleted = [];
  for (const a of result.unused) {
    unlinkSync(join(result.root, a.path));
    deleted.push(a.path);
  }
  return deleted;
}

/** 1536 -> "1.5 KB" */
export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < units.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}
