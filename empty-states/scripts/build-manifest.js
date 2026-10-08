#!/usr/bin/env node
// Generates manifest.json from svg/ and embeds the asset list into index.html.
// MIT License, Copyright (c) 2026 ghanemja
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACK = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name;

const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

/** Read every SVG in svg/ and return the manifest object. */
export function buildManifest(root = ROOT) {
  const files = readdirSync(join(root, 'svg')).filter((f) => f.endsWith('.svg')).sort();
  const assets = files.map((file) => {
    const svg = readFileSync(join(root, 'svg', file), 'utf8');
    const tag = svg.match(/<svg\b[^>]*>/)[0];
    const asset = {
      name: file.replace(/\.svg$/, ''),
      file: `svg/${file}`,
      title: (svg.match(/<title>([^<]*)<\/title>/) || [])[1] || '',
      viewBox: attr(tag, 'viewBox').split(/\s+/).map(Number),
    };
    return asset;
  });
  return { name: PACK, count: assets.length, assets };
}

const START = '<script type="application/json" id="assets">';
const END = '</script>';

/** Return index.html with the asset list (including SVG markup) embedded, so it works from file://. */
export function embedIndex(html, manifest, root = ROOT) {
  const list = manifest.assets.map((a) => ({ ...a, svg: readFileSync(join(root, a.file), 'utf8').trim() }));
  const json = JSON.stringify(list).replace(/</g, '\\u003c');
  const i = html.indexOf(START), j = html.indexOf(END, i);
  if (i < 0) throw new Error(`index.html is missing ${START}`);
  return html.slice(0, i + START.length) + json + html.slice(j);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = buildManifest();
  writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const indexPath = join(ROOT, 'index.html');
  writeFileSync(indexPath, embedIndex(readFileSync(indexPath, 'utf8'), manifest));
  console.log(`manifest.json: ${manifest.count} assets; index.html updated`);
}
