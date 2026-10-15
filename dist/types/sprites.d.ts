/**
 * The sprite as a canvas (one canvas pixel per character). `pal` overrides
 * palette keys (e.g. `{ c: '#ffd23f' }` for a gold variant); `flip` mirrors
 * it horizontally.
 * @param {Rows} rows
 * @param {Record<string, string>} [pal]
 * @param {boolean} [flip]
 * @returns {HTMLCanvasElement}
 */
export function sprite(rows: Rows, pal?: Record<string, string>, flip?: boolean): HTMLCanvasElement;
/**
 * Every opaque pixel in one colour (hit flashes, shadows, silhouettes).
 * @param {Rows} rows
 * @param {string} color
 * @returns {HTMLCanvasElement}
 */
export function silhouette(rows: Rows, color: string): HTMLCanvasElement;
/**
 * Draw a sprite canvas with its top-left on whole logical pixels.
 * @param {CanvasRenderingContext2D} g
 * @param {CanvasImageSource & { width: number, height: number }} c
 * @param {number} x
 * @param {number} y
 */
export function put(g: CanvasRenderingContext2D, c: CanvasImageSource & {
    width: number;
    height: number;
}, x: number, y: number): void;
/**
 * Draw a sprite canvas centred on (x, y).
 * @param {CanvasRenderingContext2D} g
 * @param {CanvasImageSource & { width: number, height: number }} c
 * @param {number} x
 * @param {number} y
 */
export function putC(g: CanvasRenderingContext2D, c: CanvasImageSource & {
    width: number;
    height: number;
}, x: number, y: number): void;
/**
 * The house shading for a one-colour shape: draw the shape with 'X' and get
 * back rows with an outline round it, `hi` on pixels with open space above,
 * `lo` on pixels with open space below and `body` elsewhere. Other letters
 * in the map are kept as they are. The result is two pixels wider and
 * taller than the input.
 * @param {Rows} rows
 * @param {string} body
 * @param {string} hi
 * @param {string} lo
 * @param {string} [outline]
 * @returns {string[]}
 */
export function shade(rows: Rows, body: string, hi: string, lo: string, outline?: string): string[];
/**
 * Top light on a sprite map: every pixel with open space or outline above
 * it steps one shade lighter. `remap` swaps colours first (e.g. `{ K: 'u' }`
 * lifts near-black shapes off a dark background).
 * @param {Rows} rows
 * @param {Record<string, string>} [remap]
 * @returns {string[]}
 */
export function relight(rows: Rows, remap?: Record<string, string>): string[];
/**
 * Ordered-dither threshold for a pixel, 0–1 (4×4 Bayer).
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function bayer(x: number, y: number): number;
/**
 * Mix two #rrggbb colours: t = 0 → a, 1 → b.
 * @param {string} a
 * @param {string} b
 * @param {number} t
 * @returns {string}
 */
export function mix(a: string, b: string, t: number): string;
/**
 * Pixel art from a vector drawing: `paint` draws centred on (0, 0) into a
 * w×h canvas; every pixel at least half covered snaps to the nearest
 * palette colour, the rest goes transparent, and an ink outline is added.
 * Returns rows for `sprite()`. Good for art whose size is only known at run
 * time.
 * @param {(g: CanvasRenderingContext2D) => void} paint
 * @param {number} w
 * @param {number} h
 * @param {string[]} [keys]
 * @param {boolean} [outline]
 * @returns {string[]}
 */
export function pixelize(paint: (g: CanvasRenderingContext2D) => void, w: number, h: number, keys?: string[], outline?: boolean): string[];
/**
 * Ready-made sprites in the house style (8 px HUD icons and friends).
 * Use them with `sprite(SPRITES.heart)` or `<nc-sprite name="heart">`.
 * @type {Record<string, string[]>}
 */
export const SPRITES: Record<string, string[]>;
export type Rows = readonly string[];
