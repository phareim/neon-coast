/**
 * A character's twelve rows ('#' = lit), after upper-casing. Unknown
 * characters draw as '?'.
 * @param {string} ch
 * @returns {string[]}
 */
export function glyphRows16(ch: string): string[];
/**
 * The rows a character draws above the capitals and under the baseline
 * (usually none), after upper-casing.
 * @param {string} ch
 * @returns {{ above: string[], below: string[] }}
 */
export function glyphExtra16(ch: string): {
    above: string[];
    below: string[];
};
/**
 * Width of a line in font pixels (the last glyph's shadow not counted).
 * @param {string} text
 * @returns {number}
 */
export function textWidth16(text: string): number;
/**
 * Break text into lines no wider than `maxWidth` font pixels; newlines start
 * new lines. A word longer than a line gets a line of its own.
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
export function wrapText16(text: string, maxWidth: number): string[];
/**
 * Draw a line with its top-left at (x, y): y is the top of the capitals.
 * `unit` is the size of one font pixel in the context's units (0.5 on a
 * canvas laid out in 8-bit pixels and scaled 2×); the line snaps to that
 * grid. The shadow is laid down first and the letters over it, so give it
 * an opaque colour.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {string} [shadow]
 * @param {number} [unit]
 * @param {Edge16} [edge]
 */
export function drawText16(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, shadow?: string, unit?: number, edge?: Edge16): void;
/**
 * Neon Pixel 16 — the 16-bit language's letters: a proportional dialog font
 * twice as fine as the 5×7 one. Capitals are twelve rows high, uprights two
 * pixels wide and crossbars one, corners cut round: the build of a console
 * RPG's text box from the early nineties. It is drawn light with a
 * one-pixel dark shadow to the right and below.
 *
 * Ported from phareim.no, themes/base/pixel/font16.ts. The glyph table
 * (`GLYPHS16`, the game's `G`), `MARKS16_ABOVE` / `MARKS16_BELOW` (its
 * `ABOVE` / `BELOW`) and `ALIAS16` are copies: to resync, paste the game's
 * tables over them, then `npm run font16` and `npm run build`.
 *
 * One table drives both faces, as font.js does for the 5×7 letters: the
 * canvas helpers below draw it, and `npm run font16` builds the webfont
 * (dist/fonts/neon-pixel-16.*) from it. Uppercase only. Glyphs are twelve
 * rows of '#'/'.'; the advance is the glyph's width + 2 px, so a clear
 * column stays between one letter's shadow and the next letter.
 *
 * Sizes: the line is fourteen font pixels (`LINE16`) with the capitals one
 * pixel down in it, so the webfont is crisp at 14, 28, 42 and 56 px.
 */
/** Rows in a capital. */
export const CAP16: 12;
/** The line box: the 5×7 font's seven rows at twice the density. The capitals sit one pixel down in it. */
export const LINE16: 14;
/** Most rows any glyph has above the capitals and under the baseline. */
export const ABOVE16: 3;
export const BELOW16: 2;
/**
 * The glyphs, twelve rows each ('#' = lit). A copy of font16.ts's `G`.
 * @type {Record<string, string[]>}
 */
export const GLYPHS16: Record<string, string[]>;
/**
 * Rows above the cap height, top row first; the last one sits right over the capital.
 * @type {Record<string, string[]>}
 */
export const MARKS16_ABOVE: Record<string, string[]>;
/**
 * Rows under the baseline, nearest row first.
 * @type {Record<string, string[]>}
 */
export const MARKS16_BELOW: Record<string, string[]>;
/**
 * What a character without a drawing draws as. É keeps its accent; the
 * dashes and the ellipsis have drawings of their own.
 * @type {Record<string, string>}
 */
export const ALIAS16: Record<string, string>;
/**
 * Stand-ins only the webfont has (the canvas font lacks them, as in the
 * game): panel marks and what an address or a headline may hold, drawn in
 * the same grid. A copy of the `extra` table in phareim.no's
 * scripts/make-pixel-font16.mjs.
 * @type {Record<string, string[]>}
 */
export const WEBFONT16_EXTRA: Record<string, string[]>;
/**
 * Characters the webfont draws with another one's glyph, besides ALIAS16
 * (from the game's make-pixel-font16.py; its '–' → '-' is left out, since
 * '–' has a drawing of its own now).
 * @type {Record<string, string>}
 */
export const WEBFONT16_ALIAS: Record<string, string>;
/**
 * How the dark under the letters lies: 'drop' is the text box's shadow
 * (right, below and the corner between), 'rim' a one-pixel line all the way
 * round, for text that lies straight on the world.
 */
export type Edge16 = "drop" | "rim";
