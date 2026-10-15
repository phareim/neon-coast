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
};
export namespace ROLES {
    let bg: string;
    let accent: string;
    let hot: string;
    let prize: string;
    let ok: string;
    let warn: string;
    let danger: string;
}
