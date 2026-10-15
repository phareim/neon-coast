/**
 * The pixel stage: the Neon Coast look for any canvas.
 *
 * Draw the world into `g`, a small logical-resolution buffer (one logical
 * pixel = one sprite pixel), and ask for lights with `light()`. `present()`
 * then multiplies the scene by a light map (an ambient colour plus additive
 * glow pools, so lamps, shots and windows light what is round them), scales
 * it by a whole number onto the screen, adds a soft bloom of the same
 * lights, faint scanlines and a vignette, and lays the HUD layer (`hud`,
 * also logical pixels, not lit) on top. Whatever `afterLight` draws stays at
 * full brightness, the way neon does.
 *
 * The scale is the largest whole number that still shows at least
 * `minW`×`minH` logical pixels, so a phone and a monitor both get chunky,
 * crisp pixels. Keep your game in CSS pixels if you like: `k` is CSS px per
 * logical pixel and `px()` converts and rounds.
 *
 * `resize(…, rotate = true)` draws the scene turned a quarter (world +x up
 * the screen) for side-scrollers on portrait phones; the HUD stays upright.
 */
/**
 * @typedef {object} Light
 * @property {number} x logical px
 * @property {number} y logical px
 * @property {number} r radius in logical px
 * @property {string} color #rrggbb
 * @property {number} a strength 0–1
 */
/**
 * @typedef {object} PresentOptions
 * @property {string | null} [ambient] light-map base colour; null (default) leaves the scene unlit
 * @property {{ color: string, a: number } | null} [flash] whole-screen flash after the light (alpha 0–1)
 * @property {number} [fade] fade to the stage background, 0–1
 * @property {number} [shakeX] shake in logical px
 * @property {number} [shakeY]
 * @property {number} [bloom] bloom strength; 0 turns it off (default 1)
 * @property {boolean} [overlay] scanlines and vignette (default true)
 * @property {(g: CanvasRenderingContext2D) => void} [afterLight] drawn after the light map, at full brightness
 */
/**
 * @typedef {object} StageOptions
 * @property {number} [minW] smallest logical width to show (default 240)
 * @property {number} [minH] smallest logical height to show (default 180)
 * @property {string} [bg] screen colour round the scene and the fade colour (default ink)
 * @property {number} [maxRatio] device-pixel-ratio ceiling (default 3)
 */
/**
 * @typedef {object} PixelStage
 * @property {(cssW: number, cssH: number, dpr?: number, minW?: number, minH?: number, rotate?: boolean) => void} resize
 *   size the stage to the canvas's CSS size; call on every layout change
 * @property {() => CanvasRenderingContext2D} begin start a frame: clears lights and the HUD layer, returns `g`
 * @property {(x: number, y: number, r: number, color: string, a?: number) => void} light add a glow pool (logical px)
 * @property {(x: number, y: number, w: number, h: number) => void} emit a rectangle that keeps full brightness through the light map
 * @property {(img: HTMLCanvasElement, x?: number, y?: number) => void} emitImage every opaque pixel of a static image keeps full brightness
 * @property {(opts?: PresentOptions) => void} present composite the frame onto the canvas
 * @property {(v: number) => number} px CSS px → logical px, rounded
 * @property {CanvasRenderingContext2D} g the scene, logical px
 * @property {CanvasRenderingContext2D} hud the HUD layer, logical px, unlit, always upright
 * @property {Light[]} lights this frame's lights
 * @property {number} vw logical scene width
 * @property {number} vh logical scene height
 * @property {number} hw logical HUD width
 * @property {number} hh logical HUD height
 * @property {boolean} rotated
 * @property {number} scale device px per logical px (whole number)
 * @property {number} k CSS px per logical px
 * @property {number} cssW
 * @property {number} cssH
 */
/**
 * A canvas of at least 1×1 (works without a DOM canvas in workers).
 * @param {number} w
 * @param {number} h
 * @returns {HTMLCanvasElement}
 */
export function makeCanvas(w: number, h: number): HTMLCanvasElement;
/**
 * The device pixel ratio worth rendering at: the device's own, rounded to a
 * whole number and capped, one step lower on devices short of cores or
 * memory (the stage composites the whole surface several times a frame).
 * @param {number} [max]
 * @returns {number}
 */
export function pixelRatio(max?: number): number;
/**
 * A soft radial glow (64×64) in one #rrggbb colour, cached.
 * @param {string} color
 * @returns {HTMLCanvasElement}
 */
export function glowSprite(color: string): HTMLCanvasElement;
/**
 * Create a pixel stage on a canvas. Call `resize()` before the first frame.
 * @param {HTMLCanvasElement} canvas
 * @param {StageOptions} [opts]
 * @returns {PixelStage}
 */
export function createPixelStage(canvas: HTMLCanvasElement, opts?: StageOptions): PixelStage;
export type Light = {
    /**
     * logical px
     */
    x: number;
    /**
     * logical px
     */
    y: number;
    /**
     * radius in logical px
     */
    r: number;
    /**
     * #rrggbb
     */
    color: string;
    /**
     * strength 0–1
     */
    a: number;
};
export type PresentOptions = {
    /**
     * light-map base colour; null (default) leaves the scene unlit
     */
    ambient?: string | null | undefined;
    /**
     * whole-screen flash after the light (alpha 0–1)
     */
    flash?: {
        color: string;
        a: number;
    } | null | undefined;
    /**
     * fade to the stage background, 0–1
     */
    fade?: number | undefined;
    /**
     * shake in logical px
     */
    shakeX?: number | undefined;
    shakeY?: number | undefined;
    /**
     * bloom strength; 0 turns it off (default 1)
     */
    bloom?: number | undefined;
    /**
     * scanlines and vignette (default true)
     */
    overlay?: boolean | undefined;
    /**
     * drawn after the light map, at full brightness
     */
    afterLight?: ((g: CanvasRenderingContext2D) => void) | undefined;
};
export type StageOptions = {
    /**
     * smallest logical width to show (default 240)
     */
    minW?: number | undefined;
    /**
     * smallest logical height to show (default 180)
     */
    minH?: number | undefined;
    /**
     * screen colour round the scene and the fade colour (default ink)
     */
    bg?: string | undefined;
    /**
     * device-pixel-ratio ceiling (default 3)
     */
    maxRatio?: number | undefined;
};
export type PixelStage = {
    /**
     *   size the stage to the canvas's CSS size; call on every layout change
     */
    resize: (cssW: number, cssH: number, dpr?: number, minW?: number, minH?: number, rotate?: boolean) => void;
    /**
     * start a frame: clears lights and the HUD layer, returns `g`
     */
    begin: () => CanvasRenderingContext2D;
    /**
     * add a glow pool (logical px)
     */
    light: (x: number, y: number, r: number, color: string, a?: number) => void;
    /**
     * a rectangle that keeps full brightness through the light map
     */
    emit: (x: number, y: number, w: number, h: number) => void;
    /**
     * every opaque pixel of a static image keeps full brightness
     */
    emitImage: (img: HTMLCanvasElement, x?: number, y?: number) => void;
    /**
     * composite the frame onto the canvas
     */
    present: (opts?: PresentOptions) => void;
    /**
     * CSS px → logical px, rounded
     */
    px: (v: number) => number;
    /**
     * the scene, logical px
     */
    g: CanvasRenderingContext2D;
    /**
     * the HUD layer, logical px, unlit, always upright
     */
    hud: CanvasRenderingContext2D;
    /**
     * this frame's lights
     */
    lights: Light[];
    /**
     * logical scene width
     */
    vw: number;
    /**
     * logical scene height
     */
    vh: number;
    /**
     * logical HUD width
     */
    hw: number;
    /**
     * logical HUD height
     */
    hh: number;
    rotated: boolean;
    /**
     * device px per logical px (whole number)
     */
    scale: number;
    /**
     * CSS px per logical px
     */
    k: number;
    cssW: number;
    cssH: number;
};
