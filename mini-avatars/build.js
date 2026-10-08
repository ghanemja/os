// Writes every part as a standalone SVG to svg/parts/<category>/<name>.svg,
// regenerates manifest.json and the copy of avatar.js embedded in index.html.
// Run with `npm run build`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parts, partSvg } from './avatar.js';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Every exportable part: empty ones ("none") have no SVG file. */
export function partFiles() {
  const files = [];
  for (const [category, names] of Object.entries(parts)) {
    for (const name of names) {
      const svg = partSvg(category, name);
      if (!/<(path|circle|ellipse|rect)/.test(svg)) continue;
      files.push({ category, name, file: `svg/parts/${category}/${name}.svg`, svg: svg + '\n' });
    }
  }
  return files;
}

export function renderManifest() {
  const files = partFiles();
  return JSON.stringify({
    name: 'mini-avatars',
    viewBox: '0 0 64 64',
    strokeWidth: 2,
    counts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v.length])),
    parts: files.map(({ category, name, file }) => ({ category, name, file })),
  }, null, 2) + '\n';
}

export function renderGalleryScript() {
  const src = readFileSync(join(root, 'avatar.js'), 'utf8')
    .replace(/^export default .*$/m, '')
    .replace(/^export /gm, '');
  return `/* AVATAR:START */\n${src.trim()}\n/* AVATAR:END */`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = partFiles();
  for (const { category, file, svg } of files) {
    mkdirSync(join(root, 'svg/parts', category), { recursive: true });
    writeFileSync(join(root, file), svg);
  }
  writeFileSync(join(root, 'manifest.json'), renderManifest());
  const htmlPath = join(root, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  writeFileSync(htmlPath, html.replace(/\/\* AVATAR:START \*\/[\s\S]*?\/\* AVATAR:END \*\//, () => renderGalleryScript()));
  console.log(`Wrote ${files.length} part SVGs.`);
}
