// regex-cookbook: tested regular expressions with explanations.
import { patterns, get } from './patterns.js';

export { patterns, get };

/** Build a fresh RegExp for a named pattern. `extraFlags` are added (e.g. 'g'). */
export function compile(name, extraFlags = '') {
  const entry = get(name);
  if (!entry) throw new Error(`Unknown pattern "${name}"`);
  const flags = [...new Set(entry.flags + extraFlags)].join('');
  return new RegExp(entry.pattern, flags);
}

/** Does `input` match the named pattern? */
export function test(name, input) {
  return compile(name).test(input);
}
