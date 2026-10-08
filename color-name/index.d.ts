export interface RGBA { r: number; g: number; b: number; a: number }
export interface Lab { L: number; a: number; b: number }
export interface NamedColor { readonly name: string; readonly hex: string }
export interface ColorMatch { name: string; hex: string; distance: number }

/** Closest named color to `hex` (#rgb, #rgba, #rrggbb or #rrggbbaa; `#` optional, alpha ignored). */
export function colorName(hex: string): ColorMatch;

/** The `n` (default 5) closest named colors, nearest first. */
export function nearest(hex: string, n?: number): ColorMatch[];

/** Parse a 3, 4, 6 or 8 digit hex color. Channels are 0-255, alpha is 0-1. Throws TypeError if invalid. */
export function parseHex(hex: string): RGBA;

/** Convert sRGB (0-255 channels) to CIELAB (D65). */
export function rgbToLab(rgb: { r: number; g: number; b: number }): Lab;

/** `rgbToLab(parseHex(hex))`. */
export function hexToLab(hex: string): Lab;

/** CIEDE2000 color difference between two Lab colors (kL = kC = kH = 1). */
export function deltaE2000(lab1: Lab, lab2: Lab): number;

/** The built-in curated list of named colors. */
export const colors: ReadonlyArray<NamedColor>;

export default colorName;
