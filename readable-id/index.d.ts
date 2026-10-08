export interface ReadableIdOptions {
  /** String placed between parts. Default `'-'`. */
  separator?: string;
  /** Total number of words; the last is a noun, the rest adjectives. Default `2`. */
  words?: number;
  /** Append a number. Default `true`. */
  number?: boolean;
  /** Number of digits in the number (zero-padded). Default `2`. */
  digits?: number;
  /** Custom RNG returning a float in [0, 1). Default: crypto.getRandomValues, falling back to Math.random. */
  random?: () => number;
  /** Replace the built-in adjective list. */
  adjectives?: readonly string[];
  /** Replace the built-in noun list. */
  nouns?: readonly string[];
}

export const adjectives: readonly string[];
export const nouns: readonly string[];

export function readableId(options?: ReadableIdOptions): string;
export function combinations(options?: ReadableIdOptions): number;
export function collisionProbability(count: number, options?: ReadableIdOptions): number;
export function isReadableId(id: unknown, options?: ReadableIdOptions): boolean;
export default readableId;
