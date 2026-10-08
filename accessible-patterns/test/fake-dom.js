// Tiny element stand-ins so the pure helpers can be tested without a browser.
export function el(tagName, attrs = {}, children = []) {
  const node = {
    tagName: tagName.toUpperCase(),
    attrs: { ...attrs },
    children: [],
    parentElement: null,
    getAttribute(name) { return name in this.attrs ? String(this.attrs[name]) : null; },
    hasAttribute(name) { return name in this.attrs; },
    closest(selector) {
      // Supports the one selector the patterns use: '[inert],[hidden]'.
      const names = selector.split(',').map((s) => s.trim().replace(/^\[|\]$/g, ''));
      for (let n = this; n; n = n.parentElement) if (names.some((a) => n.hasAttribute(a))) return n;
      return null;
    },
  };
  for (const child of children) {
    child.parentElement = node;
    node.children.push(child);
  }
  return node;
}
