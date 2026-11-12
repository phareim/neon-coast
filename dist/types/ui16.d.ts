/**
 * A window of w × h pixels as rects, in paint order, on a canvas of
 * (w + 6) × (h + 6) with the window's body at (1, 1): shadow, outline, the
 * bevel (two pixels of the brightest light and a softer one inside, each
 * darker along the bottom and the right), the gradient (one rect per band, unless `fill` is
 * false) and the inner line. `shadow: false` leaves the shadow out.
 * @param {number} w
 * @param {number} h
 * @param {ToneName} [tone]
 * @param {{ fill?: boolean, shadow?: boolean }} [opts]
 * @returns {Rect16[]}
 */
export function window16Rects(w: number, h: number, tone?: ToneName, opts?: {
    fill?: boolean;
    shadow?: boolean;
}): Rect16[];
/**
 * The 16-bit window, with its body's top-left at (x, y), w × h pixels
 * (bevel included). The outline reaches one pixel out, the shadow five
 * right and below.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {{ tone?: ToneName, unit?: number }} [opts] tone: 'hot' (dialog) or 'cool' (pause, plates)
 */
export function drawWindow16(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, opts?: {
    tone?: ToneName;
    unit?: number;
}): void;
/**
 * The "more" arrow as rects at (0, 0): shadow one pixel down-right, the
 * top row lighter. 11 × 6 pixels.
 * @returns {Rect16[]}
 */
export function more16Rects(): Rect16[];
/**
 * The "more" arrow: dips a pixel and comes back, and is gone for a moment
 * in between (a beat of 0.625 s). `time` in seconds; pass a constant to
 * hold it still.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} time
 * @param {number} [unit]
 */
export function drawMore16(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, unit?: number): void;
/**
 * The glove pointing right at whatever is to its right, its top-left at
 * (x, y). It nudges a pixel toward the answer three times a second.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} time seconds; a constant holds it still
 * @param {number} [unit]
 */
export function drawGlove16(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, unit?: number): void;
/**
 * Hearts: `hp` in half hearts out of `maxHp`, up to `perRow` in a row,
 * 18 pixels apart. Returns the height drawn.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} hp
 * @param {number} maxHp
 * @param {{ perRow?: number, unit?: number }} [opts]
 * @returns {number}
 */
export function drawHearts16(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, opts?: {
    perRow?: number;
    unit?: number;
}): number;
/**
 * Rects (in paint order) as an SVG document, w × h pixels, crisp edges.
 * The build uses it to put the window frame and the icons into the CSS.
 * @param {number} w
 * @param {number} h
 * @param {readonly Rect16[]} rects
 * @returns {string}
 */
export function rectsToSvg(w: number, h: number, rects: readonly Rect16[]): string;
/**
 * Pixel-art rows as rects, one per horizontal run of a colour.
 * @param {readonly string[]} rows
 * @param {Record<string, string>} ink
 * @returns {Rect16[]}
 */
export function rowsToRects(rows: readonly string[], ink: Record<string, string>): Rect16[];
/** Room left of and over a window (its outline), and right of and under it (outline and shadow). */
export const WIN16_LEAD: 1;
export const WIN16_TRAIL: 5;
/** The pointing glove, 14 × 11 (hud16.ts HAND), letters from INK16. */
export const GLOVE16: string[];
export namespace HEARTS16 {
    let full: string[];
    let half: string[];
    let empty: string[];
}
export type Rect16 = [x: number, y: number, w: number, h: number, fill: string];
export type ToneName = "hot" | "cool";
