// relative-time: "3 minutes ago" in any language via Intl.RelativeTimeFormat.

// [unit, seconds per unit, switch to the next unit once the rounded value reaches this]
const UNITS = [
  ['second', 1, 60],
  ['minute', 60, 60],
  ['hour', 3600, 24],
  ['day', 86400, 7],
  ['week', 604800, 4],
  ['month', 2629800, 12], // 30.4375 days
  ['year', 31557600, Infinity] // 365.25 days
];

const cache = new Map();

function toMs(value, name) {
  const ms = value instanceof Date ? value.getTime()
    : typeof value === 'number' ? value
    : typeof value === 'string' ? Date.parse(value)
    : NaN;
  if (!Number.isFinite(ms)) throw new TypeError(`relative-time: invalid ${name}: ${String(value)}`);
  return ms;
}

function rtf(locale, style, numeric) {
  const key = `${locale}|${style}|${numeric}`;
  let f = cache.get(key);
  if (!f) cache.set(key, (f = new Intl.RelativeTimeFormat(locale, { style, numeric })));
  return f;
}

/** Pick the unit and rounded value for a difference in seconds (negative = past). */
export function selectUnit(seconds) {
  for (const [unit, size, limit] of UNITS) {
    const n = Math.round(Math.abs(seconds) / size); // round half away from zero, same for past and future
    if (n < limit) return { value: seconds < 0 && n ? -n : n, unit };
  }
}

export function relativeTime(date, options = {}) {
  const { now = Date.now(), locale, style = 'long', numeric = 'auto' } = options;
  const { value, unit } = selectUnit((toMs(date, 'date') - toMs(now, 'now')) / 1000);
  return rtf(locale, style, numeric).format(value, unit);
}

export function createFormatter(defaults = {}) {
  return (date, options) => relativeTime(date, options ? { ...defaults, ...options } : defaults);
}

export default relativeTime;
