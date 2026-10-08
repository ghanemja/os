// readme-badges: detect a project and generate shields.io badge markdown.
// No network calls, no dependencies.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, resolve, dirname, isAbsolute } from 'node:path';

export const STYLES = ['flat', 'flat-square', 'for-the-badge', 'plastic', 'social'];
export const START = '<!-- badges:start -->';
export const END = '<!-- badges:end -->';

const SHIELDS = 'https://img.shields.io';

// ---------- small file helpers ----------

function read(dir, ...parts) {
  try {
    return readFileSync(join(dir, ...parts), 'utf8');
  } catch {
    return null;
  }
}

function readJson(dir, file) {
  const text = read(dir, file);
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function findFile(dir, names) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  const lower = new Map(entries.map((e) => [e.toLowerCase(), e]));
  for (const n of names) if (lower.has(n.toLowerCase())) return lower.get(n.toLowerCase());
  return null;
}

// ---------- tiny INI / TOML section reader ----------

/** Parse `[section]` + `key = value` files (TOML subset and setup.cfg). */
export function parseSections(text) {
  const out = {};
  let section = '';
  out[section] = {};
  let pendingKey = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '');
    const head = line.match(/^\s*\[+\s*([^\]]+?)\s*\]+\s*$/);
    if (head) {
      section = head[1];
      out[section] ??= {};
      pendingKey = null;
      continue;
    }
    const kv = line.match(/^\s*([A-Za-z0-9_.\-"]+)\s*[=:]\s*(.*)$/);
    if (pendingKey && /^\s/.test(raw) && line.trim()) {
      // setup.cfg continuation lines
      out[section][pendingKey] = (out[section][pendingKey] ? out[section][pendingKey] + '\n' : '') + line.trim();
    } else if (kv) {
      const key = kv[1].replace(/"/g, '');
      out[section][key] = unquote(kv[2].trim());
      pendingKey = kv[2].trim() === '' ? key : null;
    }
  }
  return out;
}

function unquote(v) {
  const m = v.match(/^(["'])(.*)\1$/);
  return m ? m[2] : v;
}

// ---------- license detection ----------

/** Identify a license by its text. Returns an SPDX id or null. */
export function detectLicense(text) {
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ');
  const has = (s) => t.toLowerCase().includes(s.toLowerCase());
  if (has('GNU AFFERO GENERAL PUBLIC LICENSE')) return 'AGPL-3.0';
  if (has('GNU LESSER GENERAL PUBLIC LICENSE')) return has('Version 2.1') ? 'LGPL-2.1' : 'LGPL-3.0';
  if (has('GNU GENERAL PUBLIC LICENSE')) {
    if (has('Version 3')) return 'GPL-3.0';
    if (has('Version 2')) return 'GPL-2.0';
    return 'GPL';
  }
  if (has('Mozilla Public License Version 2.0') || has('Mozilla Public License, v. 2.0')) return 'MPL-2.0';
  if (has('Apache License') && has('Version 2.0')) return 'Apache-2.0';
  if (has('CC0 1.0 Universal') || (has('Creative Commons') && has('CC0'))) return 'CC0-1.0';
  if (has('This is free and unencumbered software released into the public domain')) return 'Unlicense';
  if (has('Permission to use, copy, modify, and/or distribute this software for any purpose')) return 'ISC';
  if (has('Permission is hereby granted, free of charge')) return 'MIT';
  if (has('Redistribution and use in source and binary forms')) {
    return has('Neither the name') ? 'BSD-3-Clause' : 'BSD-2-Clause';
  }
  return null;
}

// ---------- git remote ----------

/** Turn a git URL or package.json repository value into { owner, repo } for GitHub. */
export function parseGitHub(url) {
  if (!url) return null;
  if (typeof url === 'object') url = url.url;
  if (typeof url !== 'string') return null;
  let m = url.match(/^github:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/) || url.match(/^([\w.-]+)\/([\w.-]+?)$/);
  if (m) return { owner: m[1], repo: m[2] };
  m = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

function gitConfigPath(dir) {
  // Walk up to find .git (dir or worktree file).
  let cur = resolve(dir);
  for (;;) {
    const p = join(cur, '.git');
    if (existsSync(p)) {
      if (statSync(p).isDirectory()) return join(p, 'config');
      const m = (read(cur, '.git') || '').match(/gitdir:\s*(.+)/);
      if (!m) return null;
      const gitdir = isAbsolute(m[1].trim()) ? m[1].trim() : join(cur, m[1].trim());
      const common = read(gitdir, 'commondir');
      return join(common ? resolve(gitdir, common.trim()) : gitdir, 'config');
    }
    const up = dirname(cur);
    if (up === cur) return null;
    cur = up;
  }
}

/** Read the origin (or first) remote URL from .git/config without running git. */
export function readGitRemote(dir) {
  const cfg = gitConfigPath(dir);
  if (!cfg || !existsSync(cfg)) return null;
  const sections = parseSections(readFileSync(cfg, 'utf8'));
  const remotes = Object.keys(sections).filter((s) => /^remote\s/.test(s));
  const origin = remotes.find((s) => /"origin"/.test(s)) || remotes[0];
  return origin ? sections[origin].url || null : null;
}

// ---------- detection ----------

/** Inspect a directory and return everything badge-relevant that was found. */
export function detect(dir = '.') {
  dir = resolve(dir);
  const info = { dir };

  const pkg = readJson(dir, 'package.json');
  if (pkg) {
    info.npm = {
      name: pkg.name || null,
      private: !!pkg.private,
      license: typeof pkg.license === 'string' ? pkg.license : pkg.license?.type || null,
      node: pkg.engines?.node || null,
      repository: pkg.repository || null,
    };
  }

  const pyproject = read(dir, 'pyproject.toml');
  const setupCfg = read(dir, 'setup.cfg');
  if (pyproject || setupCfg) {
    const py = { name: null, requiresPython: null, license: null };
    if (pyproject) {
      const s = parseSections(pyproject);
      const proj = s.project || s['tool.poetry'] || {};
      py.name = proj.name || null;
      py.requiresPython = proj['requires-python'] || s['tool.poetry.dependencies']?.python || null;
      if (proj.license && !proj.license.startsWith('{')) py.license = proj.license;
    }
    if (setupCfg) {
      const s = parseSections(setupCfg);
      py.name ||= s.metadata?.name || null;
      py.requiresPython ||= s.options?.python_requires || null;
      py.license ||= s.metadata?.license || null;
    }
    if (py.name) info.python = py;
  }

  const cargo = read(dir, 'Cargo.toml');
  if (cargo) {
    const s = parseSections(cargo);
    if (s.package?.name) info.rust = { name: s.package.name, license: s.package.license || null };
  }

  const gomod = read(dir, 'go.mod');
  if (gomod) {
    const mod = gomod.match(/^module\s+(\S+)/m);
    const ver = gomod.match(/^go\s+(\S+)/m);
    if (mod) info.go = { module: mod[1], version: ver ? ver[1] : null };
  }

  const licFile = findFile(dir, ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md', 'COPYING', 'UNLICENSE']);
  const licText = licFile ? read(dir, licFile) : null;
  const spdx = detectLicense(licText) || info.npm?.license || info.python?.license || info.rust?.license || null;
  if (spdx) info.license = { spdx, file: licFile };

  const wfDir = join(dir, '.github', 'workflows');
  if (existsSync(wfDir)) {
    info.workflows = readdirSync(wfDir)
      .filter((f) => /\.ya?ml$/.test(f))
      .sort()
      .map((file) => {
        const text = read(wfDir, file) || '';
        const m = text.match(/^name:\s*(.+?)\s*$/m);
        return { file, name: m ? unquote(m[1]) : file.replace(/\.ya?ml$/, '') };
      });
  }

  const remote = readGitRemote(dir);
  const goGh = info.go?.module.match(/^github\.com\/([\w.-]+)\/([\w.-]+)/);
  info.github = parseGitHub(remote) || parseGitHub(info.npm?.repository)
    || (goGh ? { owner: goGh[1], repo: goGh[2] } : null);

  const nvmrc = read(dir, '.nvmrc');
  if (nvmrc && nvmrc.trim()) info.nvmrc = nvmrc.trim().split(/\s+/)[0];

  const dockerfile = findFile(dir, ['Dockerfile']);
  if (dockerfile) {
    const from = (read(dir, dockerfile) || '').match(/^\s*FROM\s+(?:--platform=\S+\s+)?(\S+)/im);
    info.docker = { file: dockerfile, base: from ? from[1] : null };
  }

  return info;
}

// ---------- badge building ----------

/** Escape text for a shields.io static badge path segment. */
export function shieldText(s) {
  return encodeURIComponent(String(s).replace(/-/g, '--').replace(/_/g, '__')).replace(/%20/g, '_');
}

function staticBadge(label, message, color, extra = '') {
  return `${SHIELDS}/badge/${shieldText(label)}-${shieldText(message)}-${color}${extra}`;
}

function withStyle(url, style) {
  if (!style || !url.startsWith(SHIELDS)) return url;
  return url + (url.includes('?') ? '&' : '?') + 'style=' + style;
}

/**
 * Build the badge list for a directory.
 * @param {string} dir
 * @param {{ style?: string, only?: string[] }} [options]
 * @returns {{ id: string, alt: string, image: string, link: string }[]}
 */
export function badges(dir = '.', options = {}) {
  const info = typeof dir === 'object' ? dir : detect(dir);
  const { style, only } = options;
  if (style && !STYLES.includes(style)) throw new Error(`Unknown style "${style}". Use one of: ${STYLES.join(', ')}`);
  const list = [];
  const add = (id, alt, image, link) => list.push({ id, alt, image: withStyle(image, style), link });
  const gh = info.github;
  const repoUrl = gh ? `https://github.com/${gh.owner}/${gh.repo}` : null;

  if (info.workflows && gh) {
    for (const wf of info.workflows) {
      const base = `${repoUrl}/actions/workflows/${encodeURIComponent(wf.file)}`;
      add('ci', wf.name, `${base}/badge.svg`, base);
    }
  }

  const npm = info.npm;
  if (npm?.name && !npm.private) {
    const n = npm.name;
    const pkgLink = `https://www.npmjs.com/package/${n}`;
    add('npm', 'npm version', `${SHIELDS}/npm/v/${n}`, pkgLink);
    add('downloads', 'npm downloads', `${SHIELDS}/npm/dm/${n}`, pkgLink);
    add('bundlesize', 'bundle size', `${SHIELDS}/bundlephobia/minzip/${n}`, `https://bundlephobia.com/package/${n}`);
    add('installsize', 'install size', `https://packagephobia.com/badge?p=${n}`, `https://packagephobia.com/result?p=${n}`);
  }
  if (npm?.node) add('node', `node ${npm.node}`, staticBadge('node', npm.node, 'brightgreen', '?logo=node.js&logoColor=white'), 'https://nodejs.org');
  if (info.nvmrc) add('nvmrc', `node ${info.nvmrc} (.nvmrc)`, staticBadge('.nvmrc', info.nvmrc, 'brightgreen', '?logo=node.js&logoColor=white'), 'https://nodejs.org');

  const py = info.python;
  if (py) {
    const link = `https://pypi.org/project/${py.name}/`;
    add('pypi', 'PyPI version', `${SHIELDS}/pypi/v/${py.name}`, link);
    if (py.requiresPython) add('python', `python ${py.requiresPython}`, staticBadge('python', py.requiresPython, '3776AB', '?logo=python&logoColor=white'), link);
    else add('python', 'Python versions', `${SHIELDS}/pypi/pyversions/${py.name}`, link);
  }

  if (info.rust) {
    const n = info.rust.name;
    add('crates', 'crates.io', `${SHIELDS}/crates/v/${n}`, `https://crates.io/crates/${n}`);
    add('docsrs', 'docs.rs', `${SHIELDS}/docsrs/${n}`, `https://docs.rs/${n}`);
  }

  if (info.go) {
    const m = info.go.module;
    add('go', 'Go Reference', `https://pkg.go.dev/badge/${m}.svg`, `https://pkg.go.dev/${m}`);
    if (info.go.version) add('goversion', `go ${info.go.version}`, staticBadge('go', info.go.version, '00ADD8', '?logo=go&logoColor=white'), 'https://go.dev');
  }

  if (info.docker) {
    add('docker', 'Dockerfile', staticBadge('docker', info.docker.base || 'Dockerfile', '2496ED', '?logo=docker&logoColor=white'), info.docker.file);
  }

  if (info.license) {
    const link = info.license.file || (repoUrl ? `${repoUrl}#license` : '#license');
    add('license', `License: ${info.license.spdx}`, staticBadge('license', info.license.spdx, 'blue'), link);
  }

  return only && only.length ? list.filter((b) => only.includes(b.id)) : list;
}

/** Render badges as one markdown line per badge. */
export function toMarkdown(list) {
  return list.map((b) => `[![${b.alt.replace(/[[\]]/g, '')}](${b.image})](${b.link})`).join('\n');
}

/**
 * Insert or replace the badge block in README text.
 * Uses existing markers, otherwise puts the block under the first heading (or at the top).
 */
export function updateReadme(readme, markdown) {
  const block = `${START}\n${markdown}${markdown ? '\n' : ''}${END}`;
  const s = readme.indexOf(START);
  const e = readme.indexOf(END);
  if (s !== -1 && e > s) return readme.slice(0, s) + block + readme.slice(e + END.length);
  const lines = readme.split('\n');
  let at = lines.findIndex((l) => /^#{1,6}\s/.test(l));
  if (at === -1 && lines.length > 1 && /^=+\s*$/.test(lines[1])) at = 1; // setext title
  if (at === -1) return block + '\n\n' + readme;
  const before = lines.slice(0, at + 1).join('\n');
  const after = lines.slice(at + 1).join('\n').replace(/^\n+/, '');
  return `${before}\n\n${block}\n${after ? '\n' + after : ''}`;
}

/** Write badges into README.md in `dir` (created if missing). Returns { file, badges, changed }. */
export function writeBadges(dir = '.', options = {}) {
  dir = resolve(dir);
  const list = badges(dir, options);
  const name = findFile(dir, ['README.md', 'readme.md', 'Readme.md']) || 'README.md';
  const file = join(dir, name);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : `# ${basename(dir)}\n`;
  const after = updateReadme(before, toMarkdown(list));
  const changed = !existsSync(file) || after !== before;
  if (changed) writeFileSync(file, after);
  return { file, badges: list, changed };
}
