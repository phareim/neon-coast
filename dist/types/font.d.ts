/**
 * A character's seven glyph rows ('#' = lit), after upper-casing. Unknown
 * characters draw as '?'.
 * @param {string} ch
 * @returns {string[]}
 */
export function glyphRows(ch: string): string[];
/**
 * The rows a character draws above the cap height (usually none).
 * @param {string} ch
 * @returns {string[]}
 */
export function glyphAbove(ch: string): string[];
/**
 * Width of a line of text in font pixels (at size 1).
 * @param {string} text
 * @returns {number}
 */
export function textWidth(text: string): number;
/**
 * Draw one line of text with its top-left at (x, y), one font pixel per
 * logical pixel. `shadow` adds the hard drop shadow one pixel down-right.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {string} [shadow]
 */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, shadow?: string): void;
/**
 * Text with every font pixel drawn as an n×n block (titles). The shadow is
 * n pixels down-right.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} n pixels per font pixel (whole number)
 * @param {string} color
 * @param {string} [shadow]
 */
export function drawBigText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, n: number, color: string, shadow?: string): void;
/**
 * Width of `drawBigText` output.
 * @param {string} text
 * @param {number} n
 * @returns {number}
 */
export function bigTextWidth(text: string, n: number): number;
/**
 * Break text into lines no wider than `maxWidth` font pixels. Newlines in
 * the text start new lines.
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
export function wrapText(text: string, maxWidth: number): string[];
/**
 * Neon Pixel — the 5×7 letters of the Neon Coast.
 *
 * One table drives both faces: the canvas helpers below draw it with
 * fillRect in logical pixels, and `npm run font` builds the same glyphs
 * into the webfont (dist/fonts/neon-pixel.*), so HTML and canvas text are
 * identical. Capitals only: lower case draws as upper case. Each glyph is
 * seven rows of '#' (lit) and '.'; the advance is the glyph's width plus
 * one pixel.
 *
 * Marks above a capital (Å's ring, the dots on Ä Ö Ü, É's accent) sit in a
 * row of their own above the cap height (`ABOVE`), so they read at 16 px.
 */
export const GLYPH_H: 7;
/** @type {Record<string, string[]>} */
export const GLYPHS: Record<string, string[]>;
/** Rows above the cap height, drawn from y - 1 upward (nearest row last). */
/** @type {Record<string, string[]>} */
export const ABOVE: Record<string, string[]>;
/** Characters drawn with another character's glyph. */
/** @type {Record<string, string>} */
export const ALIAS: Record<string, string>;
