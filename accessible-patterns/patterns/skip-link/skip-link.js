// Skip link ("Skip to main content", WCAG 2.4.1 Bypass Blocks).
//
// Markup (first focusable element on the page):
//   <a class="skip-link" href="#main">Skip to main content</a>
//   ...
//   <main id="main">...</main>
// Usage:
//   enhanceSkipLinks();
// A plain in-page link already works in current browsers. This script makes
// sure focus (not only the scroll position) moves to the target, including
// targets that are not focusable by themselves, like <main>.

/** Target id from a link's href ("#main" -> "main"), or null if not in-page. */
export function skipTargetId(href, currentUrl) {
  if (!href) return null;
  let hash;
  if (href.startsWith('#')) hash = href;
  else if (currentUrl) {
    try {
      const url = new URL(href, currentUrl);
      const here = new URL(currentUrl);
      if (url.origin !== here.origin || url.pathname !== here.pathname || url.search !== here.search) return null;
      hash = url.hash;
    } catch {
      return null;
    }
  } else return null;
  if (!hash || hash === '#') return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

/** Does this element need tabindex="-1" before it can receive focus? */
export function needsTabindex(el) {
  if (el.hasAttribute('tabindex')) return false;
  const tag = el.tagName.toUpperCase();
  if (/^(BUTTON|INPUT|SELECT|TEXTAREA|IFRAME|SUMMARY)$/.test(tag)) return false;
  if ((tag === 'A' || tag === 'AREA') && el.hasAttribute('href')) return false;
  return true;
}

/** Make every `selector` link move focus to its target. */
export function enhanceSkipLinks(selector = 'a.skip-link', doc = document) {
  for (const link of doc.querySelectorAll(selector)) {
    link.addEventListener('click', (event) => {
      const id = skipTargetId(link.getAttribute('href'), doc.location.href);
      const target = id && doc.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (needsTabindex(target)) {
        target.setAttribute('tabindex', '-1');
        // Remove it again so clicking inside the region doesn't draw a focus ring on it.
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus();
      target.scrollIntoView?.();
      history.replaceState?.(null, '', '#' + encodeURIComponent(id));
    });
  }
}
