/**
 * A stable pseudo-random number in [0, 1) for a grid cell.
 * @param {number} x
 * @param {number} y
 * @param {number} [salt]
 * @returns {number}
 */
export function hash2(x: number, y: number, salt?: number): number;
/**
 * Smooth 1-D value noise in [0, 1) with cell size `c`.
 * @param {number} x
 * @param {number} c
 * @param {number} [salt]
 * @returns {number}
 */
export function noise1(x: number, c: number, salt?: number): number;
/**
 * Fill a rectangle (one pixel by default).
 * @param {CanvasRenderingContext2D} g
 * @param {string} c
 * @param {number} x
 * @param {number} y
 * @param {number} [w]
 * @param {number} [h]
 */
export function rect(g: CanvasRenderingContext2D, c: string, x: number, y: number, w?: number, h?: number): void;
/**
 * A filled pixel disc.
 * @param {CanvasRenderingContext2D} g
 * @param {string} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rad
 */
export function disc(g: CanvasRenderingContext2D, c: string, cx: number, cy: number, rad: number): void;
/**
 * Vertical gradient through `stops` (top → bottom, evenly spaced over
 * y0..y1): solid bands with a short Bayer-dithered seam between them, the
 * way hand-made pixel skies do it.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y0
 * @param {number} w
 * @param {number} y1
 * @param {string[]} stops
 */
export function ditherGradient(g: CanvasRenderingContext2D, x: number, y0: number, w: number, y1: number, stops: string[]): void;
/**
 * The dusk sky from the top (night) down to the horizon (warm).
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} horizon y of the horizon
 * @param {boolean} [warm] false stops at violet (no pink glow)
 */
export function paintSky(g: CanvasRenderingContext2D, w: number, horizon: number, warm?: boolean): void;
/**
 * Stars above `maxY`, thinning towards the horizon; some twinkle with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} maxY
 * @param {number} time seconds
 * @param {number} [density]
 * @param {number} [salt]
 */
export function drawStars(g: CanvasRenderingContext2D, w: number, maxY: number, time: number, density?: number, salt?: number): void;
/**
 * The striped sun: cream on top warming to pink, with dark bands that
 * widen towards the bottom.
 * @param {CanvasRenderingContext2D} g
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {string} [bandColor] the colour seen through the bands (the sky behind)
 */
export function paintSun(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, bandColor?: string): void;
/**
 * A mountain ridge across x = 0..w with its crest round `base - height`,
 * solid down to `bottom`; `rim` lights the crest.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} base
 * @param {number} height
 * @param {number} bottom
 * @param {string} body
 * @param {string} rim
 * @param {number} [salt]
 * @param {number} [sharp] 0 soft – 1 jagged
 */
export function paintRidge(g: CanvasRenderingContext2D, w: number, base: number, height: number, bottom: number, body: string, rim: string, salt?: number, sharp?: number): void;
/**
 * A headland: a ridge that rises from nothing at one end, for the edges of
 * a coast. `side` is the end where it is highest.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} base y where it meets the water
 * @param {number} height
 * @param {'left' | 'right'} side
 * @param {string} [body]
 * @param {string} [rim]
 * @param {number} [salt]
 */
export function paintHeadland(g: CanvasRenderingContext2D, x0: number, w: number, base: number, height: number, side: "left" | "right", body?: string, rim?: string, salt?: number): void;
/**
 * The sea from the horizon `top` down to `bottom`: a cyan horizon line,
 * water deepening towards the viewer, the sun's broken reflection under
 * `sunX`, slow wave lines and glints. Animates with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 * @param {{ sunX?: number | null, sunW?: number, time?: number, salt?: number }} [opts]
 */
export function paintSea(g: CanvasRenderingContext2D, x0: number, w: number, top: number, bottom: number, opts?: {
    sunX?: number | null;
    sunW?: number;
    time?: number;
    salt?: number;
}): void;
/**
 * The sun's reflection on the sea: dashes on alternate rows below the
 * horizon, narrowing and turning from gold to pink as they come closer,
 * swaying with the swell. Draw it after the light map (`afterLight`) to
 * keep it at full brightness.
 * @param {CanvasRenderingContext2D} g
 * @param {number} top the horizon
 * @param {number} bottom
 * @param {number} sunX
 * @param {number} [sunW] width of the reflection at the horizon
 * @param {number} [time]
 * @param {number} [salt]
 */
export function paintReflection(g: CanvasRenderingContext2D, top: number, bottom: number, sunX: number, sunW?: number, time?: number, salt?: number): void;
/**
 * The beach from `top` to `bottom`: sand in soft drifts, wet and dark
 * along the water, and a line of foam that washes in and out with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} top the waterline
 * @param {number} bottom
 * @param {number} [time]
 * @param {number} [salt]
 */
export function paintBeach(g: CanvasRenderingContext2D, x0: number, w: number, top: number, bottom: number, time?: number, salt?: number): void;
/**
 * A palm in silhouette: a ringed trunk curving up to a crown of fronds that
 * arch out and droop, each with leaflets hanging under it. The side towards
 * `light` (-1 left, 1 right) catches a magenta rim. Fronds sway with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x foot of the trunk
 * @param {number} baseY
 * @param {number} h height to the crown
 * @param {number} [lean] how far the crown leans, logical px (sign = direction)
 * @param {number} [light] -1 or 1
 * @param {number} [time]
 */
export function paintPalm(g: CanvasRenderingContext2D, x: number, baseY: number, h: number, lean?: number, light?: number, time?: number): void;
/**
 * A line of round canopies standing on `baseY`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} baseY
 * @param {number} [size] canopy radius
 * @param {number} [salt]
 */
export function paintTreeLine(g: CanvasRenderingContext2D, x0: number, w: number, baseY: number, size?: number, salt?: number): void;
/**
 * A house in side view: a pitched shingle roof over a plank wall with lit
 * windows. Returns the window centres, for lights.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} baseY
 * @param {number} w
 * @param {number} h
 * @param {number} [salt]
 * @returns {{ x: number, y: number }[]}
 */
export function paintHouse(g: CanvasRenderingContext2D, x: number, baseY: number, w: number, h: number, salt?: number): {
    x: number;
    y: number;
}[];
/**
 * Grass from `top` to `bottom`: soft patches, blades and a lit top edge.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 * @param {number} [salt]
 */
export function paintGrass(g: CanvasRenderingContext2D, x0: number, w: number, top: number, bottom: number, salt?: number): void;
/**
 * A lamp post; returns the lamp's centre, for a light.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} baseY
 * @param {number} h
 * @param {string} color
 * @returns {{ x: number, y: number }}
 */
export function paintLamp(g: CanvasRenderingContext2D, x: number, baseY: number, h: number, color: string): {
    x: number;
    y: number;
};
export namespace DUSK {
    let sky0: string;
    let sky1: string;
    let sky2: string;
    let sky3: string;
    let sky4: string;
    let sky5: string;
    let sky6: string;
    let sky7: string;
    let star: string;
    let starHi: string;
    let starDim: string;
    let sun0: string;
    let sun1: string;
    let sun2: string;
    let sun3: string;
    let ridgeFar: string;
    let ridgeFarRim: string;
    let ridge: string;
    let ridgeRim: string;
    let canopyD: string;
    let canopyM: string;
    let canopyL: string;
    let canopyH: string;
    let rim: string;
    let trunk: string;
    let g0: string;
    let g1: string;
    let g2: string;
    let g3: string;
    let blade: string;
    let tip: string;
    let path: string;
    let pathL: string;
    let pathD: string;
    let roof: string;
    let roofL: string;
    let roofD: string;
    let roofHi: string;
    let wall: string;
    let wallL: string;
    let wallD: string;
    let window: string;
    let windowD: string;
    let stone: string;
    let stoneL: string;
    let stoneD: string;
    let stoneTop: string;
    let neon: string;
    let neonC: string;
    let water: string;
    let waterD: string;
    let waterHaze: string;
    let wave: string;
    let foam: string;
    let horizon: string;
    let glint: string;
    let sand: string;
    let sandL: string;
    let sandD: string;
    let sandW: string;
    let palm: string;
    let palmL: string;
}
