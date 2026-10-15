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
export const PAL = {
  k: '#0b0616', // ink: outlines, the night, hard shadows
  K: '#1c1030', // night: dark shade
  u: '#2a1f4a', // dusk: deep violet-grey
  w: '#fff4ff', // white
  W: '#cfc6ff', // lavender
  g: '#8f86b8', // haze
  G: '#5a5285', // slate
  c: '#2ff3ff', // cyan: the interface, the player
  C: '#1a9fc4',
  b: '#2f5fd0', // blue
  B: '#1a2f78',
  p: '#ff2fa0', // pink: call to action, you, danger
  P: '#b01874',
  m: '#ff8ae0', // rose
  v: '#9a4ff0', // violet
  V: '#54259e',
  y: '#ffd23f', // gold: treasure
  Y: '#c4861c',
  e: '#fff1b0', // cream
  o: '#ff8a3d', // orange
  r: '#ff3b5c', // red
  R: '#9e1638',
  l: '#b6ff4a', // lime
  L: '#4f9a2a',
  t: '#3fd8b0', // teal
  T: '#1f7a6e',
  h: '#3a1a4a', // plum
  H: '#7a3a8a',
  s: '#f5c3a8', // skin
  S: '#c98576',
  n: '#6a4432', // wood
  N: '#3a2418',
  a: '#5b2a1c', // clay
  i: '#b0543a',
  j: '#e07a4e',
}

/** The palette by name. CSS: `--nc-<name>`. */
export const COLORS = {
  ink: PAL.k,
  night: PAL.K,
  dusk: PAL.u,
  slate: PAL.G,
  haze: PAL.g,
  lavender: PAL.W,
  white: PAL.w,
  cyan: PAL.c,
  'cyan-deep': PAL.C,
  blue: PAL.b,
  'blue-deep': PAL.B,
  pink: PAL.p,
  'pink-deep': PAL.P,
  rose: PAL.m,
  violet: PAL.v,
  'violet-deep': PAL.V,
  gold: PAL.y,
  'gold-deep': PAL.Y,
  cream: PAL.e,
  orange: PAL.o,
  red: PAL.r,
  'red-deep': PAL.R,
  lime: PAL.l,
  'lime-deep': PAL.L,
  teal: PAL.t,
  'teal-deep': PAL.T,
  plum: PAL.h,
  'plum-light': PAL.H,
}

/** The dusk sky, top (night) to horizon (warm). CSS: `--nc-sky-0` … `--nc-sky-7`. */
export const SKY = ['#0b0616', '#140b26', '#1c1030', '#2a1a4c', '#43246e', '#6a2a7c', '#a8347e', '#e0508a']

/** The striped sun, top to bottom. CSS: `--nc-sun-0` … `--nc-sun-3`. */
export const SUN = ['#fff1b0', '#ffd23f', '#ff8a3d', '#ff2fa0']

/** Interface colours that are not sprite colours. CSS: `--nc-<name>`. */
export const UI = {
  text: '#f2e9ff',
  'text-muted': '#b9a8d9',
  'text-subtle': '#8f86b8',
  /** Panel fill: the night, nearly opaque. */
  surface: 'rgba(11, 6, 22, 0.88)',
  /** Inside inputs, meters and tracks. */
  field: '#140b26',
  /** Edges that should not shout: inputs at rest, frames, keys. */
  quiet: '#6a5aa8',
  /** Divider lines. */
  rule: '#54259e',
  /** The faint cyan line inside the top edge of a box. */
  'box-rule': 'rgba(47, 243, 255, 0.35)',
}

/**
 * What each colour is for. CSS: `--nc-<role>: var(--nc-<colour>)`.
 * Cyan is the interface, pink is the call to action (and "you"), gold is
 * treasure; the last three are for status messages.
 */
export const ROLES = {
  bg: 'ink',
  accent: 'cyan',
  hot: 'pink',
  prize: 'gold',
  ok: 'lime',
  warn: 'orange',
  danger: 'red',
}
