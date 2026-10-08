// Minimal XML well-formedness checker for tests. Throws on the first problem.
const NAME = '[A-Za-z_:][\\w:.-]*';
const ATTR = new RegExp(`\\s+(${NAME})\\s*=\\s*("[^"<]*"|'[^'<]*')`, 'y');
const ENTITY = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/y;

function checkText(text, where) {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '&') {
      ENTITY.lastIndex = i;
      if (!ENTITY.test(text)) throw new Error(`bad entity at ${where + i}`);
    }
    if (text[i] === '<') throw new Error(`stray "<" at ${where + i}`);
  }
  if (text.includes(']]>')) throw new Error(`"]]>" in text near ${where}`);
}

export function assertWellFormedXml(xml) {
  const stack = [];
  let i = 0;
  let roots = 0;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(xml)) throw new Error('control character in XML');
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    const text = xml.slice(i, lt === -1 ? xml.length : lt);
    if (text.trim() && !stack.length) throw new Error(`text outside root at ${i}`);
    checkText(text, i);
    if (lt === -1) break;
    if (xml.startsWith('<?', lt)) { i = xml.indexOf('?>', lt) + 2; continue; }
    if (xml.startsWith('<!--', lt)) { const e = xml.indexOf('-->', lt); if (e < 0) throw new Error('unclosed comment'); i = e + 3; continue; }
    if (xml.startsWith('<![CDATA[', lt)) { i = xml.indexOf(']]>', lt) + 3; continue; }
    if (xml.startsWith('</', lt)) {
      const m = new RegExp(`</(${NAME})\\s*>`, 'y');
      m.lastIndex = lt;
      const r = m.exec(xml);
      if (!r) throw new Error(`bad end tag at ${lt}`);
      const open = stack.pop();
      if (open !== r[1]) throw new Error(`</${r[1]}> closes <${open}> at ${lt}`);
      i = m.lastIndex;
      continue;
    }
    const nameRe = new RegExp(NAME, 'y');
    nameRe.lastIndex = lt + 1;
    const nm = nameRe.exec(xml);
    if (!nm) throw new Error(`bad tag at ${lt}`);
    let j = nameRe.lastIndex;
    const seen = new Set();
    for (;;) {
      ATTR.lastIndex = j;
      const a = ATTR.exec(xml);
      if (!a) break;
      if (seen.has(a[1])) throw new Error(`duplicate attribute ${a[1]} on <${nm[0]}>`);
      seen.add(a[1]);
      checkText(a[2].slice(1, -1), j);
      j = ATTR.lastIndex;
    }
    while (/\s/.test(xml[j])) j++;
    if (!stack.length) roots++;
    if (xml.startsWith('/>', j)) { i = j + 2; continue; }
    if (xml[j] !== '>') throw new Error(`malformed tag <${nm[0]}> at ${lt}`);
    stack.push(nm[0]);
    i = j + 1;
  }
  if (stack.length) throw new Error(`unclosed <${stack.pop()}>`);
  if (roots !== 1) throw new Error(`expected one root element, found ${roots}`);
  return true;
}
