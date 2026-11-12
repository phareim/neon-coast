/**
 * The colour of a tone's gradient at `f` (0 top, 1 bottom), each channel
 * quantised to five bits, as the window painter does per scanline.
 * @param {Tone16} tone
 * @param {number} f
 * @returns {string}
 */
export function rampAt(tone: Tone16, f: number): string;
/**
 * The bands of a tone's gradient: where the five-bit value of any channel
 * changes, a new band starts. `from` drops the top of the ramp (0–1) and
 * stretches the rest over the window; `at` is where each band starts, 0–1.
 * @param {Tone16} tone
 * @param {number} [from]
 * @returns {{ color: string, at: number }[]}
 */
export function ramp5(tone: Tone16, from?: number): {
    color: string;
    at: number;
}[];
/**
 * WCAG contrast ratio of two #rrggbb colours.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function contrast(a: string, b: string): number;
/**
 * How far down a tone's ramp every one of `texts` first reads at WCAG AA
 * (4.5:1), in 1/256 steps. The ramps darken downwards, so the rest passes too.
 * @param {Tone16} tone
 * @param {readonly string[]} texts
 * @returns {number}
 */
export function readableFrom(tone: Tone16, texts: readonly string[]): number;
/**
 * Neon Coast colours — the one source of truth.
 *
 * `PAL` is the sprite palette: one letter per colour, so a sprite can be
 * written as rows of letters (see sprites.js). `COLORS` names the same
 * colours for people, `SKY` and `SUN` are the dusk ramps, `UI` holds the
 * interface colours that are not sprite colours, and `ROLES` says which
 * colour does which job.
 *
 * `npm run build` turns this file into the CSS custom properties
 * (src/css/colors.css → --nc-ink, --nc-cyan, --nc-sky-3, --nc-text, …)
 * and dist/tokens.json, so canvas and CSS never drift apart.
 */
/** @type {Record<string, string>} */
export const PAL: Record<string, string>;
/** The palette by name. CSS: `--nc-<name>`. */
export const COLORS: {
    ink: string;
    night: string;
    dusk: string;
    slate: string;
    haze: string;
    lavender: string;
    white: string;
    cyan: string;
    'cyan-deep': string;
    blue: string;
    'blue-deep': string;
    pink: string;
    'pink-deep': string;
    rose: string;
    violet: string;
    'violet-deep': string;
    gold: string;
    'gold-deep': string;
    cream: string;
    orange: string;
    red: string;
    'red-deep': string;
    lime: string;
    'lime-deep': string;
    teal: string;
    'teal-deep': string;
    plum: string;
    'plum-light': string;
};
/** The dusk sky, top (night) to horizon (warm). CSS: `--nc-sky-0` … `--nc-sky-7`. */
export const SKY: string[];
/** The striped sun, top to bottom. CSS: `--nc-sun-0` … `--nc-sun-3`. */
export const SUN: string[];
/**
 * The 16-bit window, top band to bottom: the gradient the next machine had the
 * colours for. CSS: `--nc-window-0` … `--nc-window-4`.
 */
export const WINDOW: string[];
/** The same window in teal, for the second voice. CSS: `--nc-window-teal-0` … `-4`. */
export const WINDOW_TEAL: string[];
/** Interface colours that are not sprite colours. CSS: `--nc-<name>`. */
export const UI: {
    text: string;
    'text-muted': string;
    'text-subtle': string;
    /** Panel fill: the night, nearly opaque. */
    surface: string;
    /** Inside inputs, meters and tracks. */
    field: string;
    /** Edges that should not shout: inputs at rest, frames, keys. */
    quiet: string;
    /** Divider lines. */
    rule: string;
    /** The faint cyan line inside the top edge of a box. */
    'box-rule': string;
    /** The 16-bit window: its white bevel, the dark line round it, and the shadow under its letters. */
    'window-edge': string;
    'window-shade': string;
    'window-hi': string;
};
export namespace WIN16 {
    let hot: Tone16;
    let cool: Tone16;
    let outline: string;
    let inner: string;
    let innerSoft: string;
    let shadow: string[];
}
export namespace TEXT16 {
    export let text: string;
    let shadow_1: string;
    export { shadow_1 as shadow };
    export let rim: string;
    export let dim: string;
    export let faint: string;
    let hot_1: string;
    export { hot_1 as hot };
    let cool_1: string;
    export { cool_1 as cool };
    export let prize: string;
    export let ok: string;
    export let more: string;
    export let moreLo: string;
}
export namespace INK16 {
    let k: string;
    let w: string;
    let m: string;
    let p: string;
    let P: string;
    let D: string;
    let K: string;
    let u: string;
    let g: string;
}
export function five(v: number): number;
export namespace WIN16_RAMPS {
    let hot_2: {
        color: string;
        at: number;
    }[];
    export { hot_2 as hot };
    let cool_2: {
        color: string;
        at: number;
    }[];
    export { cool_2 as cool };
    export let plate: {
        color: string;
        at: number;
    }[];
}
export namespace ROLES {
    export let bg: string;
    export let accent: string;
    let hot_3: string;
    export { hot_3 as hot };
    let prize_1: string;
    export { prize_1 as prize };
    let ok_1: string;
    export { ok_1 as ok };
    export let warn: string;
    export let danger: string;
}
export type Tone16 = {
    /**
     * the gradient's first scanline, rgb
     */
    top: readonly [number, number, number];
    /**
     * its last scanline, rgb
     */
    bottom: readonly [number, number, number];
    /**
     * the bevel's outer ring, top and left
     */
    hi: string;
    /**
     * the bevel's outer ring, bottom and right
     */
    lo: string;
    /**
     * the bevel's inner ring, top and left
     */
    hi2: string;
    /**
     * the bevel's inner ring, bottom and right
     */
    lo2: string;
};
