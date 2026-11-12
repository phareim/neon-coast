/**
 * EPX (Scale2x): a picture at twice the size, without new colours. Each
 * pixel becomes four; a corner takes its neighbours' colour where the two
 * neighbours on its sides agree and the other two do not, so stairs turn
 * into diagonals and straight edges stay straight.
 * @param {ArrayLike<number>} src w × h pixels, one number per pixel (compared whole)
 * @param {number} w
 * @param {number} h
 * @returns {Uint32Array} 2w × 2h
 */
export function epx(src: ArrayLike<number>, w: number, h: number): Uint32Array;
/**
 * A canvas at twice the size, through `epx`.
 * @param {HTMLCanvasElement} src
 * @returns {HTMLCanvasElement}
 */
export function scale2x(src: HTMLCanvasElement): HTMLCanvasElement;
/**
 * Selective outline on RGBA pixels, in place: a dark outline pixel (luma
 * under `dark`) that touches lighter colour takes that colour, darkened to
 * `keep` of itself; where it touches only the outside it stays dark. So a
 * pink heart gets a deep-pink rim inside its black one, the way 16-bit
 * artists outlined.
 * @param {Uint8ClampedArray} data
 * @param {number} w
 * @param {number} h
 * @param {{ dark?: number, keep?: number }} [opts]
 * @returns {Uint8ClampedArray}
 */
export function seloutPixels(data: Uint8ClampedArray, w: number, h: number, opts?: {
    dark?: number;
    keep?: number;
}): Uint8ClampedArray;
/**
 * `seloutPixels` on a canvas, in place. Returns the canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ dark?: number, keep?: number }} [opts]
 * @returns {HTMLCanvasElement}
 */
export function selout(canvas: HTMLCanvasElement, opts?: {
    dark?: number;
    keep?: number;
}): HTMLCanvasElement;
/**
 * The machine's colours, in place: five bits a channel (32 768 colours).
 * With `dither` the rest becomes an ordered 4×4 dither, as the isometric
 * engine's last pass does, so a smooth ramp turns into knitted bands.
 * @template {{ data: Uint8ClampedArray, width: number, height: number }} T
 * @param {T} imageData
 * @param {{ dither?: boolean }} [opts]
 * @returns {T}
 */
export function quantize15<T extends {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}>(imageData: T, opts?: {
    dither?: boolean;
}): T;
/**
 * `n` colours from the first key colour to the last, through the ones
 * between, each channel in five bits: the stops of a band ramp.
 * @param {readonly string[]} keys #rrggbb, top first
 * @param {number} n
 * @returns {string[]}
 */
export function ramp15(keys: readonly string[], n: number): string[];
/**
 * A vertical ramp in bands, top to bottom, as a 16-bit machine changed the
 * colour every few scanlines. `stops` are the bands' colours (equal bands),
 * or `{ color, at }` with `at` (0–1) where each band starts. With `dither`
 * the last rows of a band knit into the next in ordered-dither steps (a
 * quarter, half, three quarters), the way the dusk sky does in the game.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {readonly (string | { color: string, at: number })[]} stops
 * @param {{ dither?: boolean, knit?: number }} [opts] knit: rows that knit at each edge (default up to 4)
 */
export function paintBands(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stops: readonly (string | {
    color: string;
    at: number;
})[], opts?: {
    dither?: boolean;
    knit?: number;
}): void;
