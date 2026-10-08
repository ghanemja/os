export type DateInput = Date | number | string;

export type Unit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface RelativeTimeOptions {
  /** Reference time. Defaults to `Date.now()`. */
  now?: DateInput;
  /** BCP 47 locale tag(s). Defaults to the runtime's locale. */
  locale?: string | string[];
  /** `'long'` (default), `'short'` or `'narrow'`. */
  style?: Intl.RelativeTimeFormatStyle;
  /** `'auto'` (default, "yesterday") or `'always'` ("1 day ago"). */
  numeric?: Intl.RelativeTimeFormatNumeric;
}

/** Format `date` relative to `options.now`, e.g. "3 minutes ago" or "in 2 days". */
export function relativeTime(date: DateInput, options?: RelativeTimeOptions): string;

/** Create a reusable formatter with default options; per-call options override them. */
export function createFormatter(
  defaults?: RelativeTimeOptions
): (date: DateInput, options?: RelativeTimeOptions) => string;

/** Pick the unit and rounded value for a difference in seconds (negative means past). */
export function selectUnit(seconds: number): { value: number; unit: Unit };

export default relativeTime;
