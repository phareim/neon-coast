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

/**
 * The 16-bit window, top band to bottom: the gradient the next machine had the
 * colours for. CSS: `--nc-window-0` … `--nc-window-4`.
 */
export const WINDOW = ['#3a46c8', '#2f38b0', '#262c98', '#1d2180', '#151868']

/** The same window in teal, for the second voice. CSS: `--nc-window-teal-0` … `-4`. */
export const WINDOW_TEAL = ['#1f7a9a', '#1a6888', '#155676', '#104464', '#0b3252']

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
  /** The 16-bit window: its white bevel, the dark line round it, and the shadow under its letters. */
  'window-edge': '#f4f6ff',
  'window-shade': '#0a0e30',
  'window-hi': 'rgba(160, 190, 255, 0.5)',
}

// ---------------------------------------------------------------------------
// The 16-bit language
// ---------------------------------------------------------------------------
// Copied from phareim.no, themes/zelda/render/hud16.ts (TONES, SHADOW, RIM,
// HIRES_WINDOW_SKIN, INK and the paintWindow colours). The game is the source:
// to resync, copy the values again and run `npm run build`.

/**
 * @typedef {object} Tone16
 * @property {readonly [number, number, number]} top the gradient's first scanline, rgb
 * @property {readonly [number, number, number]} bottom its last scanline, rgb
 * @property {string} hi the bevel's two outer pixels, top and left
 * @property {string} lo the bevel's two outer pixels, bottom and right
 * @property {string} hi2 the bevel's softer inner pixel, top and left
 * @property {string} lo2 the bevel's softer inner pixel, bottom and right
 */

/**
 * The 16-bit window: its two tones, and what lies round and under it.
 * `hot` (deep blue down to indigo) is the dialog box, a label, the thing in
 * use; `cool` (sea green down to night blue) is the pause screen, the item
 * box, a name plate. CSS: `--nc-win-hot-top`, `--nc-win-outline`, …
 */
export const WIN16 = {
  /** @type {Tone16} */
  hot: { top: [58, 74, 204], bottom: [36, 14, 104], hi: '#ffffff', lo: '#aab2ea', hi2: '#c8d0ff', lo2: '#6c74c4' },
  /** @type {Tone16} */
  cool: { top: [34, 132, 164], bottom: [12, 44, 92], hi: '#ffffff', lo: '#a4c8e4', hi2: '#c4ecff', lo2: '#5c98c0' },
  /** The dark line round the bevel. */
  outline: '#070a2c',
  /** The line inside the bevel: heavier under the top and left edge, lighter along the bottom and right. */
  inner: 'rgba(6,8,44,0.62)',
  innerSoft: 'rgba(6,8,44,0.36)',
  /** The shadow on the world, in three steps that soften its edge (nearest first). */
  shadow: ['rgba(4,4,30,0.22)', 'rgba(4,4,30,0.2)', 'rgba(4,4,30,0.14)'],
}

/** The 16-bit letters' colours (HIRES_WINDOW_SKIN). CSS: `--nc-text16`, `--nc-text16-<name>`. */
export const TEXT16 = {
  text: '#ffffff',
  /** Under the letters in a window: right, below and the corner between. */
  shadow: '#0a0c38',
  /** A one-pixel line all the way round letters that lie straight on the world (and the chosen answer). */
  rim: '#06081f',
  dim: '#b8c6fa',
  faint: '#7482cc',
  hot: '#ff8fd4',
  cool: '#8cecff',
  prize: '#ffe070',
  ok: '#aaf472',
  /** The "more" arrow: its top row and the rest. */
  more: '#e4fbff',
  moreLo: '#8cecff',
}

/** The 16-bit icons' palette: the hearts and the pointing glove (hud16.ts INK). One letter per colour, as PAL. */
export const INK16 = {
  k: '#12061c', // rim
  w: '#ffffff',
  m: '#ffa0e4', // light on the heart
  p: '#ff3aa8',
  P: '#c2187c', // the heart's shaded side
  D: '#7c0e58',
  K: '#2c1e58', // an empty heart
  u: '#7462b8', // the lighter line inside its rim that shows it against a dark sky
  g: '#c8cef4', // the glove's shade
}

/** One channel in the machine's five bits (hud16.ts `five`). @param {number} v */
export const five = v => Math.min(248, Math.round(v / 8) * 8)

/** @param {number} n */
const hex2 = n => n.toString(16).padStart(2, '0')
/** @param {readonly number[]} c */
const rgbHex = c => '#' + c.map(hex2).join('')

/**
 * The colour of a tone's gradient at `f` (0 top, 1 bottom), each channel
 * quantised to five bits, as the window painter does per scanline.
 * @param {Tone16} tone
 * @param {number} f
 * @returns {string}
 */
export function rampAt(tone, f) {
  return rgbHex([0, 1, 2].map(i => five(tone.top[i] + (tone.bottom[i] - tone.top[i]) * f)))
}

/**
 * The bands of a tone's gradient: where the five-bit value of any channel
 * changes, a new band starts. `from` drops the top of the ramp (0–1) and
 * stretches the rest over the window; `at` is where each band starts, 0–1.
 * @param {Tone16} tone
 * @param {number} [from]
 * @returns {{ color: string, at: number }[]}
 */
export function ramp5(tone, from = 0) {
  /** @type {number[]} */
  const cuts = []
  for (let i = 0; i < 3; i++) {
    const a = tone.top[i]
    const d = tone.bottom[i] - a
    if (!d) continue
    // A channel steps where its value crosses a half-step: 8k + 4.
    for (let k = 0; k < 32; k++) {
      const f = (8 * k + 4 - a) / d
      if (f > from && f < 1) cuts.push(f)
    }
  }
  const edges = [from, ...[...new Set(cuts)].sort((x, y) => x - y), 1]
  /** @type {{ color: string, at: number }[]} */
  const out = []
  for (let j = 0; j < edges.length - 1; j++) {
    const color = rampAt(tone, (edges[j] + edges[j + 1]) / 2)
    if (out.length && out[out.length - 1].color === color) continue
    out.push({ color, at: Math.round(((edges[j] - from) / (1 - from)) * 1e4) / 1e4 })
  }
  return out
}

/**
 * WCAG contrast ratio of two #rrggbb colours.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function contrast(a, b) {
  /** @param {string} h */
  const lum = h => {
    const [r, g, bl] = [1, 3, 5].map(i => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const x = lum(a)
  const y = lum(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/**
 * How far down a tone's ramp every one of `texts` first reads at WCAG AA
 * (4.5:1), in 1/256 steps. The ramps darken downwards, so the rest passes too.
 * @param {Tone16} tone
 * @param {readonly string[]} texts
 * @returns {number}
 */
export function readableFrom(tone, texts) {
  for (let s = 0; s <= 256; s++) {
    const bg = rampAt(tone, s / 256)
    if (texts.every(t => contrast(t, bg) >= 4.5)) return s / 256
  }
  return 1
}

/**
 * The ramps the CSS paints: the game's, started where the text on them
 * passes AA. In a hot window that is white, dim, cyan, gold and lime text
 * (pink only at 28 px and up); in a cool one white; on a name plate gold.
 * CSS: `--nc-win-hot`, `--nc-win-cool`, `--nc-win-plate` (gradients).
 */
export const WIN16_RAMPS = {
  hot: ramp5(WIN16.hot, readableFrom(WIN16.hot, [TEXT16.text, TEXT16.dim, TEXT16.cool, TEXT16.prize, TEXT16.ok])),
  cool: ramp5(WIN16.cool, readableFrom(WIN16.cool, [TEXT16.text])),
  plate: ramp5(WIN16.cool, readableFrom(WIN16.cool, [TEXT16.prize])),
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
