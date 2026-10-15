/**
 * Rows from text: one row per non-empty line, whitespace trimmed, short
 * rows padded with '.'.
 * @param {string} text
 * @returns {string[]}
 */
export function parseRows(text: string): string[];
/** Register `<nc-scene>` and `<nc-sprite>` (once; does nothing on a server). */
export function defineElements(): void;
/**
 * `<nc-scene>` — the neon coast at dusk, live.
 *
 * Attributes:
 *   scene    coast (default) | town | hills | dusk
 *   pixels   logical pixels from top to bottom (default 180): fewer = chunkier
 *   horizon  where the horizon sits, 0–1 of the height (default 0.6)
 *   sun      the sun's x, 0–1 of the width (default 0.5), or "none"
 *   still    draw one frame and stop (always the case with reduced motion)
 *   bare     no light map, bloom, scanlines or vignette: just the pixels
 *   fixed    fill the viewport behind the page (position: fixed; z-index: -1)
 *
 * Without a height of its own it is half as tall as it is wide
 * (--nc-scene-ratio: 50%). Give it a height, or insets, to size it.
 */
export class NcScene extends HTMLElement {
    static get observedAttributes(): string[];
    /** @type {HTMLCanvasElement | null} */ _canvas: HTMLCanvasElement | null;
    /** @type {import('./stage.js').PixelStage | null} */ _stage: import("./stage.js").PixelStage | null;
    /** @type {Layout | null} */ _layout: Layout | null;
    /** @type {ResizeObserver | null} */ _ro: ResizeObserver | null;
    /** @type {IntersectionObserver | null} */ _io: IntersectionObserver | null;
    /** @type {MediaQueryList | null} */ _motion: MediaQueryList | null;
    _raf: number;
    _last: number;
    _visible: boolean;
    _t0: number;
    _onChange: () => void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(): void;
    _pixels(): number;
    _animated(): boolean;
    _schedule(): void;
    /** @param {number} now */
    _frame(now: number): void;
}
/**
 * `<nc-sprite>` — pixel art in the page. Write the rows as the element's
 * text, one letter per pixel from the palette ('.' is see-through), or pick
 * a ready-made one with `name`.
 *
 *   <nc-sprite scale="6">
 *     .kk.kk.
 *     kpppppk
 *     .kpppk.
 *     ..kpk..
 *     ...k...
 *   </nc-sprite>
 *
 * Attributes:
 *   name    a built-in sprite (heart, heart-half, heart-empty, gem, key, bomb, coin, star, home, cursor, sun)
 *   scale   CSS pixels per sprite pixel (default 4)
 *   colors  palette overrides, e.g. "p:#ffd23f c:#ff2fa0"
 *   shade   "body hi lo": outline and shade an 'X' map (e.g. "c w C")
 *   flip    mirror horizontally
 *   label   accessible name; without it the sprite is decorative
 */
export class NcSprite extends HTMLElement {
    static get observedAttributes(): string[];
    /** @type {MutationObserver | null} */ _mo: MutationObserver | null;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(): void;
    /** The rows this element draws. */
    get rows(): string[];
    render(): void;
}
export type Layout = {
    /**
     * sky, painted once per size
     */
    back: HTMLCanvasElement;
    /**
     * everything static in front of the stars
     */
    front: HTMLCanvasElement;
    /**
     * the visible sun, kept at full brightness
     */
    sun: HTMLCanvasElement | null;
    /**
     *   draws the moving parts and asks for lights
     */
    live: (g: CanvasRenderingContext2D, t: number, stage: import("./stage.js").PixelStage) => void;
    /**
     * drawn after the light map, at full brightness
     */
    glow?: ((g: CanvasRenderingContext2D, t: number) => void) | undefined;
    horizon: number;
};
