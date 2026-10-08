// MIT License, Copyright (c) 2026 ghanemja
// Basic well-formedness check: every tag closes in order, attributes are quoted,
// no stray "<" or bare "&" in text. Not a full XML parser, but catches the usual mistakes.
export function checkXml(src) {
  const s = src.replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*<\?xml[^>]*\?>/, '');
  const tag = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[A-Za-z_][\w:.-]*\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/y;
  const stack = [];
  let i = 0, roots = 0;
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    const text = s.slice(i, lt < 0 ? s.length : lt);
    if (/&(?!(?:[A-Za-z]+|#\d+|#x[0-9A-Fa-f]+);)/.test(text)) throw new Error(`bare & near: ${text.slice(0, 40)}`);
    if (stack.length === 0 && text.trim()) throw new Error(`text outside root: ${text.trim().slice(0, 40)}`);
    if (lt < 0) break;
    tag.lastIndex = lt;
    const m = tag.exec(s);
    if (!m) throw new Error(`malformed tag near: ${s.slice(lt, lt + 60)}`);
    const [, closing, name, attrs, selfClosing] = m;
    const seen = new Set();
    for (const [, a] of attrs.matchAll(/([A-Za-z_][\w:.-]*)\s*=/g)) {
      if (seen.has(a)) throw new Error(`duplicate attribute ${a} on <${name}>`);
      seen.add(a);
    }
    if (closing) {
      const open = stack.pop();
      if (open !== name) throw new Error(`</${name}> closes <${open}>`);
    } else if (!selfClosing) {
      if (stack.length === 0) roots++;
      stack.push(name);
    } else if (stack.length === 0) roots++;
    i = tag.lastIndex;
  }
  if (stack.length) throw new Error(`unclosed <${stack.at(-1)}>`);
  if (roots !== 1) throw new Error(`expected one root element, found ${roots}`);
  return true;
}
