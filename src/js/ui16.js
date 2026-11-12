/**
 * The 16-bit language's interface on canvas: the console RPG's window (a
 * gradient that changes on the scanlines where the machine's five-bit
 * colour steps, a bevelled three-pixel border with round corners, an inner
 * dark line and a soft shadow), the bobbing "more" arrow, the pointing
 * glove and the hearts, twice as fine as the 8-bit ones.
 *
 * Ported from phareim.no, themes/zelda/render/hud16.ts: `box`,
 * `paintWindow`, `more`, `pointer`, and the HAND and HEART_* art (copied;
 * the colours are in tokens.js as WIN16, TEXT16 and INK16). Everything is
 * in 16-bit pixels; `unit` scales a pixel (0.5 on a canvas laid out in
 * 8-bit pixels and drawn at twice the density, as the game does).
 *
 * The build also draws the window's frame, the glove, the arrow and the
 * hearts from these same tables into the CSS (as SVG custom properties),
 * so the CSS and the canvas are the same pixels.
 */
import { WIN16, TEXT16, INK16, rampAt } from './tokens.js'
import { sprite } from './sprites.js'

/** @typedef {[x: number, y: number, w: number, h: number, fill: string]} Rect16 */
/** @typedef {'hot' | 'cool'} ToneName */

/**
 * A filled box with its corners cut: `cuts[i]` pixels off each end of row
 * i from the top and from the bottom. Pushes rects.
 * @param {Rect16[]} out
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {readonly number[]} cuts
 * @param {string} fill
 */
function box(out, x, y, w, h, cuts, fill) {
  const n = Math.min(cuts.length, Math.floor(h / 2))
  for (let i = 0; i < n; i++) {
    const c = Math.min(cuts[i], Math.floor(w / 2))
    out.push([x + c, y + i, w - c * 2, 1, fill], [x + c, y + h - 1 - i, w - c * 2, 1, fill])
  }
  out.push([x, y + n, w, h - n * 2, fill])
}

/** Room left of and over a window (its outline), and right of and under it (outline and shadow). */
export const WIN16_LEAD = 1
export const WIN16_TRAIL = 5

/**
 * A window of w × h pixels as rects, in paint order, on a canvas of
 * (w + 6) × (h + 6) with the window's body at (1, 1): shadow, outline, the
 * bevel (two pixels of the brightest light and a softer one inside, each
 * darker along the bottom and the right), the gradient (one rect per band, unless `fill` is
 * false) and the inner line. `shadow: false` leaves the shadow out.
 * @param {number} w
 * @param {number} h
 * @param {ToneName} [tone]
 * @param {{ fill?: boolean, shadow?: boolean }} [opts]
 * @returns {Rect16[]}
 */
export function window16Rects(w, h, tone = 'hot', opts = {}) {
  const t = WIN16[tone]
  /** @type {Rect16[]} */
  const out = []
  const round = [3, 2, 1]
  const [s1, s2, s3] = WIN16.shadow
  if (opts.shadow !== false) {
    box(out, 3, 4, w + 2, h + 2, [4, 2, 1, 1], s3)
    box(out, 2, 3, w + 2, h + 2, round, s2)
    box(out, 1, 2, w + 2, h + 2, round, s1)
  }
  box(out, 0, 0, w + 2, h + 2, round, WIN16.outline)
  // The border, three pixels of light: two of the brightest and a softer one inside, each darker along the bottom and the right.
  box(out, 1, 1, w, h, [2, 1], t.lo)
  box(out, 1, 1, w - 2, h - 2, [2, 1], t.hi)
  box(out, 3, 3, w - 4, h - 4, [1], t.lo2)
  box(out, 3, 3, w - 5, h - 5, [1], t.hi2)
  if (opts.fill !== false) {
    // The gradient: a new colour wherever the five-bit value of a channel changes.
    const rows = h - 6
    let start = 0
    let color = ''
    for (let r = 0; r <= rows; r++) {
      const c = r < rows ? rampAt(t, rows > 1 ? r / (rows - 1) : 0) : ''
      if (c === color) continue
      if (color) out.push([4, 4 + start, w - 6, r - start, color])
      color = c
      start = r
    }
  }
  // The dark line inside the border, heavier under the top and the left edge where the border's own shadow falls.
  out.push([4, 4, w - 6, 1, WIN16.inner], [4, 5, 1, h - 7, WIN16.inner])
  out.push([5, h - 3, w - 7, 1, WIN16.innerSoft], [w - 3, 5, 1, h - 8, WIN16.innerSoft])
  return out
}

/**
 * The 16-bit window, with its body's top-left at (x, y), w × h pixels
 * (bevel included). The outline reaches one pixel out, the shadow five
 * right and below.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {{ tone?: ToneName, unit?: number }} [opts] tone: 'hot' (dialog) or 'cool' (pause, plates)
 */
export function drawWindow16(ctx, x, y, w, h, opts = {}) {
  const u = opts.unit ?? 1
  const W = Math.max(8, Math.round(w))
  const H = Math.max(8, Math.round(h))
  const ox = Math.round(x / u) * u - WIN16_LEAD * u
  const oy = Math.round(y / u) * u - WIN16_LEAD * u
  for (const [rx, ry, rw, rh, fill] of window16Rects(W, H, opts.tone ?? 'hot')) {
    ctx.fillStyle = fill
    ctx.fillRect(ox + rx * u, oy + ry * u, rw * u, rh * u)
  }
}

/** The "more" arrow's rows, widest first; it is ten pixels wide, five tall. */
const MORE = [10, 8, 6, 4, 2]

/**
 * The "more" arrow as rects at (0, 0): shadow one pixel down-right, the
 * top row lighter. 11 × 6 pixels.
 * @returns {Rect16[]}
 */
export function more16Rects() {
  /** @type {Rect16[]} */
  const out = []
  MORE.forEach((n, r) => out.push([(10 - n) / 2 + 1, r + 1, n, 1, TEXT16.shadow]))
  MORE.forEach((n, r) => out.push([(10 - n) / 2, r, n, 1, r === 0 ? TEXT16.more : TEXT16.moreLo]))
  return out
}

/**
 * The "more" arrow: dips a pixel and comes back, and is gone for a moment
 * in between (a beat of 0.625 s). `time` in seconds; pass a constant to
 * hold it still.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} time
 * @param {number} [unit]
 */
export function drawMore16(ctx, x, y, time, unit = 1) {
  const beat = (time * 1.6) % 1
  if (beat > 0.72) return
  const dy = beat > 0.36 ? 1 : 0
  for (const [rx, ry, rw, rh, fill] of more16Rects()) {
    ctx.fillStyle = fill
    ctx.fillRect(x + rx * unit, y + (ry + dy) * unit, rw * unit, rh * unit)
  }
}

/** The pointing glove, 14 × 11 (hud16.ts HAND), letters from INK16. */
export const GLOVE16 = [
  '.....kkkk.....',
  '....kwwwwkkkk.',
  '.kkkwwwwwwwwwk',
  'kwwwwwwwwwwwwk',
  'kwwwwwwkkkkkk.',
  'kwwwwwwwwk....',
  'kwwwwwwgk.....',
  'kwwwwwwwwk....',
  '.kwwwwwgk.....',
  '..kggggk......',
  '...kkkk.......',
]

/** The hearts, twice as fine as the classic 8 × 8 (hud16.ts HEART_*), 16 × 16, letters from INK16. */
export const HEARTS16 = {
  full: [
    '..kkkk...kkkk...',
    '.kmmppk.kppppk..',
    'kmwwpppkpppppPk.',
    'kmwpppppppppPPk.',
    'kmppppppppppPPk.',
    'kpppppppppppPPk.',
    'kppppppppppPPDk.',
    '.kpppppppppPDk..',
    '..kpppppppPDk...',
    '...kpppppPDk....',
    '....kpppPDk.....',
    '.....kpPDk......',
    '......kDk.......',
    '.......k........',
    '................',
    '................',
  ],
  half: [
    '..kkkk...kkkk...',
    '.kmmppk.kuuuuk..',
    'kmwwpppkuKKKKuk.',
    'kmwppppkKKKKKuk.',
    'kmpppppkKKKKKuk.',
    'kppppppkKKKKKuk.',
    'kppppppkKKKKKuk.',
    '.kpppppkKKKKuk..',
    '..kppppkKKKuk...',
    '...kpppkKKuk....',
    '....kppkKuk.....',
    '.....kpkuk......',
    '......kkk.......',
    '.......k........',
    '................',
    '................',
  ],
  empty: [
    '..kkkk...kkkk...',
    '.kuuuuk.kuuuuk..',
    'kuKKKKukuKKKKuk.',
    'kuKKKKKuKKKKKuk.',
    'kuKKKKKKKKKKKuk.',
    'kuKKKKKKKKKKKuk.',
    'kuKKKKKKKKKKKuk.',
    '.kuKKKKKKKKKuk..',
    '..kuKKKKKKKuk...',
    '...kuKKKKKuk....',
    '....kuKKKuk.....',
    '.....kuKuk......',
    '......kuk.......',
    '.......k........',
    '................',
    '................',
  ],
}

/**
 * The glove pointing right at whatever is to its right, its top-left at
 * (x, y). It nudges a pixel toward the answer three times a second.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} time seconds; a constant holds it still
 * @param {number} [unit]
 */
export function drawGlove16(ctx, x, y, time, unit = 1) {
  const dx = Math.floor(time * 3) % 2 === 0 ? 0 : 1
  const c = sprite(GLOVE16, INK16)
  ctx.drawImage(c, x + dx * unit, y, c.width * unit, c.height * unit)
}

/**
 * Hearts: `hp` in half hearts out of `maxHp`, up to `perRow` in a row,
 * 18 pixels apart. Returns the height drawn.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} hp
 * @param {number} maxHp
 * @param {{ perRow?: number, unit?: number }} [opts]
 * @returns {number}
 */
export function drawHearts16(ctx, x, y, hp, maxHp, opts = {}) {
  const { perRow = 10, unit = 1 } = opts
  const n = Math.ceil(maxHp / 2)
  for (let i = 0; i < n; i++) {
    const left = hp - i * 2
    const rows = left >= 2 ? HEARTS16.full : left === 1 ? HEARTS16.half : HEARTS16.empty
    ctx.drawImage(sprite(rows, INK16), x + (i % perRow) * 18 * unit, y + Math.floor(i / perRow) * 18 * unit, 16 * unit, 16 * unit)
  }
  return (Math.ceil(n / perRow) * 18 - 4) * unit
}

/**
 * Rects (in paint order) as an SVG document, w × h pixels, crisp edges.
 * The build uses it to put the window frame and the icons into the CSS.
 * @param {number} w
 * @param {number} h
 * @param {readonly Rect16[]} rects
 * @returns {string}
 */
export function rectsToSvg(w, h, rects) {
  const body = rects.filter(r => r[2] > 0 && r[3] > 0).map(([x, y, rw, rh, f]) => `<rect x='${x}' y='${y}' width='${rw}' height='${rh}' fill='${f}'/>`).join('')
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${body}</svg>`
}

/**
 * Pixel-art rows as rects, one per horizontal run of a colour.
 * @param {readonly string[]} rows
 * @param {Record<string, string>} ink
 * @returns {Rect16[]}
 */
export function rowsToRects(rows, ink) {
  /** @type {Rect16[]} */
  const out = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      const s = x
      while (x < row.length && row[x] === ch) x++
      if (ink[ch]) out.push([s, y, x - s, 1, ink[ch]])
    }
  })
  return out
}
