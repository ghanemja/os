export interface SlugifyOptions {
  /** String placed between words. Default `'-'`. May be empty or multi-character. */
  separator?: string;
  /** Lowercase the result (locale-aware when `locale` is set). Default `true`. */
  lowercase?: boolean;
  /** Maximum length in code points. Cuts on word boundaries; a single over-long first word is hard-cut. `0` = no limit (default). */
  maxLength?: number;
  /** `true` (default) replaces known emoji with their names and flags with `flag-xx`; `false` drops them. */
  emoji?: boolean;
  /** Replacements applied before anything else, as an object or `[from, to]` pairs. Longest match wins. */
  custom?: Record<string, string> | Array<[string, string]>;
  /** BCP 47 tag for language-specific rules: `de` (ä→ae), `da`/`nb`/`nn`/`no` (å→aa, ø→oe), `uk` (г→h), `bg` (щ→sht), and locale-aware lowercasing (e.g. `tr`). */
  locale?: string;
  /** What to do with letters that have no transliteration (CJK, Arabic, Hebrew, Thai...): `'keep'` (default) or `'drop'`. */
  unicode?: 'keep' | 'drop';
}

/** Turn any string into a URL slug. */
export function slugify(input: unknown, options?: SlugifyOptions): string;

/** The built-in emoji → name table. */
export const EMOJI: Readonly<Record<string, string>>;

export default slugify;
