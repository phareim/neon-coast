/**
 * The dusk sky from the top down to the horizon in `bands` bands, thinner
 * toward the horizon, their edges knit with an ordered dither.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} horizon y of the horizon
 * @param {number} [bands]
 */
export function paintSky16(g: CanvasRenderingContext2D, w: number, horizon: number, bands?: number): void;
/**
 * The sun half set on the horizon: five colours top to bottom, the lower
 * half cut by stripes that widen as it sinks, inside a halo of two
 * dithered rings.
 * @param {CanvasRenderingContext2D} g
 * @param {number} cx
 * @param {number} horizon y of the horizon (the sun's centre sits on it)
 * @param {number} r
 */
export function paintSun16(g: CanvasRenderingContext2D, cx: number, horizon: number, r: number): void;
/**
 * A ridge as wide as the scene and seamless end to end, standing on `base`:
 * a crest from a sum of whole waves over the width, a two-pixel rim lit
 * toward the sun, and a body that darkens in bands from the rim down. `haze`
 * (0–1) mixes it toward the horizon colour, as the far hills on the game's
 * horizon are.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} base
 * @param {number} height
 * @param {{ body: string, rim: string, haze?: number, salt?: number, sunX?: number }} o
 */
export function paintRidge16(g: CanvasRenderingContext2D, w: number, base: number, height: number, o: {
    body: string;
    rim: string;
    haze?: number;
    salt?: number;
    sunX?: number;
}): void;
/**
 * Cloud streaks as wide as the scene and seamless end to end, between y0
 * and y1: long thin bands, lit pink underneath by the sun below them, a
 * paler line on top.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} y0
 * @param {number} y1
 * @param {{ salt?: number, count?: number }} [o]
 */
export function paintClouds16(g: CanvasRenderingContext2D, w: number, y0: number, y1: number, o?: {
    salt?: number;
    count?: number;
}): void;
/**
 * Draw a seamless layer shifted left by `offset` pixels (any number; it
 * wraps), whole pixels only.
 * @param {CanvasRenderingContext2D} g
 * @param {HTMLCanvasElement} layer
 * @param {number} offset
 */
export function drawDrift(g: CanvasRenderingContext2D, layer: HTMLCanvasElement, offset: number): void;
/**
 * The sea from the horizon down: bands from the horizon's lilac to the
 * deep, knit where they meet, and a bright line on the horizon.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 */
export function paintSea16(g: CanvasRenderingContext2D, w: number, top: number, bottom: number): void;
/**
 * What moves on the sea: the sun's reflection as broken stripes under it
 * that shimmer, and glints that come and go across the water, in steps of
 * a sixth of a second.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 * @param {number | null} sunX
 * @param {number} sunR
 * @param {number} time seconds
 */
export function paintGlints16(g: CanvasRenderingContext2D, w: number, top: number, bottom: number, sunX: number | null, sunR: number, time: number): void;
export namespace DUSK16 {
    let sky: string[];
    let sun: string[];
    let halo: string;
    let cloud: string;
    let cloudLit: string;
    let cloudTop: string;
    let ridgeFar: string;
    let ridgeFarRim: string;
    let ridge: string;
    let ridgeRim: string;
    let sea: string[];
    let horizon: string;
    let glint: string;
    let glintCyan: string;
    let glintPink: string;
}
