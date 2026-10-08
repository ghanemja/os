// Optional SVG -> PNG rasterization using whatever tool is installed.
// Tried in order: rsvg-convert, ImageMagick (magick / convert), Inkscape,
// then a headless Chromium-family browser. Zero dependencies.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const IS_WIN = process.platform === 'win32';

/** Find an executable on PATH. Returns its absolute path or null. */
export function findOnPath(name, env = process.env) {
  const dirs = (env.PATH || env.Path || '').split(delimiter).filter(Boolean);
  const exts = IS_WIN ? (env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = join(dir, name + ext);
      try {
        if (statSync(candidate).isFile()) return candidate;
      } catch {}
    }
  }
  return null;
}

/** Locate a Chromium-family browser from env vars, PATH or a Playwright cache. */
export function findChromium(env = process.env) {
  for (const key of ['CHROME_PATH', 'CHROMIUM_PATH', 'PUPPETEER_EXECUTABLE_PATH']) {
    if (env[key] && existsSync(env[key])) return env[key];
  }
  const names = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable', 'chrome', 'headless_shell', 'microsoft-edge'];
  for (const name of names) {
    const found = findOnPath(name, env);
    if (found) return found;
  }
  const caches = [env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), '.cache', 'ms-playwright')].filter(Boolean);
  for (const cache of caches) {
    let entries = [];
    try { entries = readdirSync(cache).sort().reverse(); } catch { continue; }
    // Prefer the lightweight headless shell, then full Chromium.
    const ordered = [...entries.filter((e) => e.startsWith('chromium_headless_shell-')), ...entries.filter((e) => e.startsWith('chromium-'))];
    for (const dir of ordered) {
      const rels = ['chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-win/headless_shell.exe', 'chrome-win/chrome.exe',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium'];
      for (const rel of rels) {
        const p = join(cache, dir, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return null;
}

function isImageMagick(bin) {
  try {
    return /ImageMagick/i.test(execFileSync(bin, ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }));
  } catch {
    return false;
  }
}

/** List available rasterizers in the order they will be tried. */
export function detectRasterizers(env = process.env) {
  const found = [];
  const rsvg = findOnPath('rsvg-convert', env);
  if (rsvg) found.push({ name: 'rsvg-convert', bin: rsvg });
  const magick = findOnPath('magick', env);
  if (magick) found.push({ name: 'magick', bin: magick });
  const convert = findOnPath('convert', env);
  if (convert && isImageMagick(convert)) found.push({ name: 'convert', bin: convert });
  const inkscape = findOnPath('inkscape', env);
  if (inkscape) found.push({ name: 'inkscape', bin: inkscape });
  const chromium = findChromium(env);
  if (chromium) found.push({ name: 'chromium', bin: chromium });
  return found;
}

function run(bin, args) {
  execFileSync(bin, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: 120000 });
}

function rasterizeWith(tool, svgPath, pngPath, width, height, tmp) {
  switch (tool.name) {
    case 'rsvg-convert':
      return run(tool.bin, ['-w', String(width), '-h', String(height), '-o', pngPath, svgPath]);
    case 'magick':
      return run(tool.bin, ['-background', 'none', '-density', '300', svgPath, '-resize', `${width}x${height}!`, pngPath]);
    case 'convert':
      return run(tool.bin, ['-background', 'none', '-density', '300', svgPath, '-resize', `${width}x${height}!`, pngPath]);
    case 'inkscape':
      return run(tool.bin, [svgPath, '--export-type=png', `--export-filename=${pngPath}`, '-w', String(width), '-h', String(height)]);
    case 'chromium': {
      const html = join(tmp, 'page.html');
      writeFileSync(html, `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}img{display:block;width:${width}px;height:${height}px}</style></head><body><img src="${pathToFileURL(svgPath).href}"></body></html>`);
      return run(tool.bin, ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
        '--default-background-color=00000000', `--user-data-dir=${join(tmp, 'profile')}`,
        `--window-size=${width},${height}`, `--screenshot=${pngPath}`, pathToFileURL(html).href]);
    }
    default:
      throw new Error(`unknown rasterizer ${tool.name}`);
  }
}

function isPng(path) {
  try {
    return readFileSync(path).subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  } catch {
    return false;
  }
}

/**
 * Rasterize an SVG string to a PNG file. Tries each available tool in turn
 * and returns the name of the one that worked. Throws with a helpful message
 * when none is installed or all of them fail.
 */
export function svgToPng(svg, pngPath, { width, height, tools = detectRasterizers() } = {}) {
  if (!tools.length) {
    throw new Error(
      'No SVG rasterizer found. Install one of: rsvg-convert (librsvg), ImageMagick (magick/convert), ' +
      'Inkscape, or a Chromium-based browser (set CHROME_PATH if it is not on PATH).'
    );
  }
  const out = resolve(pngPath);
  const tmp = mkdtempSync(join(tmpdir(), 'rasterize-'));
  const svgPath = join(tmp, 'input.svg');
  writeFileSync(svgPath, svg);
  const errors = [];
  try {
    for (const tool of tools) {
      try {
        rmSync(out, { force: true });
        rasterizeWith(tool, svgPath, out, width, height, tmp);
        if (existsSync(out) && isPng(out)) return tool.name;
        errors.push(`${tool.name}: produced no PNG`);
      } catch (err) {
        const detail = (err.stderr ? String(err.stderr) : err.message).trim().split('\n').slice(-1)[0];
        errors.push(`${tool.name}: ${detail}`);
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  throw new Error(`All rasterizers failed:\n  ${errors.join('\n  ')}`);
}
