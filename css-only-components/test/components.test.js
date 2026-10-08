import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT, CSS_FILE, GALLERY_FILE, listComponents, readComponent, buildCss, buildGallery, dedent,
} from '../scripts/build.js';

const REQUIRED = [
  'tooltip', 'toggle-switch', 'accordion', 'tabs', 'modal', 'dropdown', 'star-rating',
  'progress-ring', 'skeleton', 'chip-input', 'banner', 'carousel', 'breadcrumb', 'stepper',
];
const components = listComponents();
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

/**
 * Check CSS structure: comments closed, strings closed, and {} / () balanced.
 * Returns a list of problems (empty when fine).
 */
function cssProblems(css) {
  const problems = [];
  const stack = [];
  const pairs = { '}': '{', ')': '(' };
  let line = 1;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '\n') line++;
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) { problems.push(`unclosed comment at line ${line}`); break; }
      line += (css.slice(i, end).match(/\n/g) || []).length;
      i = end + 1;
    } else if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) {
        if (css[j] === '\\') j++;
        if (css[j] === '\n') { problems.push(`unclosed string at line ${line}`); break; }
        j++;
      }
      i = j;
    } else if (ch === '{' || ch === '(') {
      stack.push([ch, line]);
    } else if (ch === '}' || ch === ')') {
      const top = stack.pop();
      if (!top || top[0] !== pairs[ch]) problems.push(`unexpected "${ch}" at line ${line}`);
    } else if (ch === '*' && css[i + 1] === '/') {
      problems.push(`stray "*/" at line ${line}`);
    }
  }
  for (const [ch, l] of stack) problems.push(`unclosed "${ch}" from line ${l}`);
  return problems;
}

test('the brace checker itself catches mistakes', () => {
  assert.deepEqual(cssProblems('.a { color: red; } @media (x) { .b { c: d } }'), []);
  assert.deepEqual(cssProblems('.a { content: "}"; } /* { */'), []);
  assert.ok(cssProblems('.a { color: red;').length);
  assert.ok(cssProblems('.a } {').length);
  assert.ok(cssProblems('/* a */ b */ .c {}').length);
  assert.ok(cssProblems('.a { width: calc(1px + 2px; }').length);
});

test(`has at least 12 components, including every required one`, () => {
  assert.ok(components.length >= 12, `only ${components.length} components`);
  for (const name of REQUIRED) assert.ok(components.includes(name), `missing components/${name}`);
});

for (const name of components) {
  test(`components/${name} has index.html and style.css`, () => {
    assert.ok(existsSync(join(ROOT, 'components', name, 'index.html')), 'index.html');
    assert.ok(existsSync(join(ROOT, 'components', name, 'style.css')), 'style.css');
    const extra = readdirSync(join(ROOT, 'components', name)).filter((f) => !['index.html', 'style.css'].includes(f));
    assert.deepEqual(extra, [], 'no other files');
  });

  test(`components/${name}/style.css is well formed and scoped`, () => {
    const css = read('components', name, 'style.css');
    assert.deepEqual(cssProblems(css), []);
    // Every selector should be namespaced with .cc- so the combined file is safe to include.
    const withoutAt = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@(property|keyframes)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    const selectors = [...withoutAt.matchAll(/(^|[{}])\s*([^\s{}@][^{}]*?)\s*\{/g)].map((m) => m[2]);
    for (const sel of selectors) {
      for (const part of sel.split(',')) assert.match(part.trim(), /\.cc-/, `unscoped selector "${part.trim()}"`);
    }
  });

  test(`components/${name}/index.html is a zero-JS demo with a snippet`, () => {
    const page = read('components', name, 'index.html');
    assert.match(page, /<!doctype html>/i);
    assert.match(page, /<link rel="stylesheet" href="style.css">/);
    assert.doesNotMatch(page, /<script/i, 'no <script>');
    assert.doesNotMatch(page, /\son[a-z]+\s*=/i, 'no inline event handlers');
    assert.doesNotMatch(page, /javascript:/i);
    assert.match(page, /Accessibility notes/);
    const c = readComponent(name);
    assert.ok(c.title && c.description && c.html.length > 20);
    assert.match(c.html, /class="cc-/);
  });
}

test('ids and radio names are unique across all snippets (they share the gallery page)', () => {
  const seen = new Map();
  for (const name of components) {
    const { html } = readComponent(name);
    for (const [, id] of html.matchAll(/\sid="([^"]+)"/g)) {
      assert.ok(!seen.has(`id:${id}`), `id "${id}" used in ${seen.get(`id:${id}`)} and ${name}`);
      seen.set(`id:${id}`, name);
    }
    for (const [, n] of html.matchAll(/type="radio" name="([^"]+)"/g)) {
      const prev = seen.get(`name:${n}`);
      assert.ok(!prev || prev === name, `radio name "${n}" used in ${prev} and ${name}`);
      seen.set(`name:${n}`, name);
    }
  }
});

test('every aria-describedby / aria-labelledby / for / popovertarget points at an id in the same snippet', () => {
  for (const name of components) {
    const { html } = readComponent(name);
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, attr, ref] of html.matchAll(/\s(aria-describedby|aria-labelledby|for|popovertarget)="([^"]+)"/g)) {
      assert.ok(ids.has(ref), `${name}: ${attr}="${ref}" has no matching id`);
    }
  }
});

test(`${CSS_FILE} is in sync with the components (run npm run build)`, () => {
  const combined = read(CSS_FILE);
  assert.equal(combined, buildCss());
  assert.deepEqual(cssProblems(combined), []);
  for (const name of components) assert.ok(combined.includes(read('components', name, 'style.css').trimEnd()));
});

test(`${GALLERY_FILE} gallery is in sync and links every demo`, () => {
  const gallery = read(GALLERY_FILE);
  assert.equal(gallery, buildGallery());
  for (const name of components) {
    assert.ok(gallery.includes(`href="components/${name}/index.html"`), `links ${name}`);
    assert.ok(gallery.includes(`id="code-${name}-html"`) && gallery.includes(`id="code-${name}-css"`));
  }
  assert.ok(gallery.includes(`href="${CSS_FILE}"`));
});

test('README documents every component', () => {
  const readme = read('README.md');
  for (const name of components) assert.ok(readme.includes(`components/${name}/`), `README mentions components/${name}/`);
});

test('dedent strips common indentation', () => {
  assert.equal(dedent('\n    <a>\n      <b>\n    </a>\n  '), '<a>\n  <b>\n</a>');
});
