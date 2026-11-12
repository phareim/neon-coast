/**
 * Neon Pixel 16 — the 16-bit language's letters: a proportional dialog font
 * twice as fine as the 5×7 one. Capitals are twelve rows high, uprights two
 * pixels wide and crossbars one, corners cut round: the build of a console
 * RPG's text box from the early nineties. It is drawn light with a
 * one-pixel dark shadow to the right and below.
 *
 * Ported from phareim.no, themes/base/pixel/font16.ts. The glyph table
 * (`GLYPHS16`, the game's `G`), `MARKS16_ABOVE` / `MARKS16_BELOW` (its
 * `ABOVE` / `BELOW`) and `ALIAS16` are copies: to resync, paste the game's
 * tables over them, then `npm run font16` and `npm run build`.
 *
 * One table drives both faces, as font.js does for the 5×7 letters: the
 * canvas helpers below draw it, and `npm run font16` builds the webfont
 * (dist/fonts/neon-pixel-16.*) from it. Uppercase only. Glyphs are twelve
 * rows of '#'/'.'; the advance is the glyph's width + 2 px, so a clear
 * column stays between one letter's shadow and the next letter.
 *
 * Sizes: the line is fourteen font pixels (`LINE16`) with the capitals one
 * pixel down in it, so the webfont is crisp at 14, 28, 42 and 56 px.
 */

/** Rows in a capital. */
export const CAP16 = 12
/** The line box: the 5×7 font's seven rows at twice the density. The capitals sit one pixel down in it. */
export const LINE16 = 14
/** Most rows any glyph has above the capitals and under the baseline. */
export const ABOVE16 = 3
export const BELOW16 = 2
/** Clear pixels between two glyphs (one of them takes the shadow). */
const GAP = 2

/**
 * `rows` from row `top` on, in a twelve-row glyph that is blank elsewhere.
 * @param {number} top
 * @param {string[]} rows
 * @returns {string[]}
 */
function at(top, rows) {
  const blank = '.'.repeat(rows[0].length)
  const out = []
  for (let r = 0; r < CAP16; r++) out.push(rows[r - top] ?? blank)
  return out
}

/**
 * `n` copies of a row.
 * @param {number} n
 * @param {string} row
 * @returns {string[]}
 */
function x(n, row) {
  return Array.from({ length: n }, () => row)
}

/**
 * The glyphs, twelve rows each ('#' = lit). A copy of font16.ts's `G`.
 * @type {Record<string, string[]>}
 */
export const GLYPHS16 = {
  A: ['...##...', '...##...', '..####..', '..####..', '.##..##.', '.##..##.', '.##..##.', '##....##', '########', '##....##', '##....##', '##....##'],
  B: ['######..', '##...##.', '##....##', '##....##', '##...##.', '######..', '##...##.', '##....##', '##....##', '##....##', '##...##.', '######..'],
  C: ['..####..', '.##..##.', '##....##', ...x(6, '##......'), '##....##', '.##..##.', '..####..'],
  D: ['######..', '##...##.', ...x(8, '##....##'), '##...##.', '######..'],
  E: ['#######', ...x(4, '##.....'), '######.', ...x(5, '##.....'), '#######'],
  F: ['#######', ...x(4, '##.....'), '######.', ...x(6, '##.....')],
  G: ['..####..', '.##..##.', '##....##', '##......', '##......', '##......', '##..####', '##....##', '##....##', '##....##', '.##..##.', '..####..'],
  H: [...x(5, '##....##'), '########', ...x(6, '##....##')],
  I: ['####', ...x(10, '.##.'), '####'],
  J: [...x(8, '.....##'), '##...##', '##...##', '.##.##.', '..###..'],
  K: ['##....##', '##...##.', '##...##.', '##..##..', '##.##...', '####....', '####....', '##.##...', '##..##..', '##...##.', '##...##.', '##....##'],
  L: [...x(11, '##.....'), '#######'],
  M: ['##......##', '###....###', '###....###', '####..####', '##.#..#.##', '##.####.##', '##..##..##', '##..##..##', ...x(4, '##......##')],
  N: ['##....##', '###...##', '###...##', '####..##', '##.#..##', '##.##.##', '##.##.##', '##..#.##', '##..####', '##...###', '##...###', '##....##'],
  O: ['..####..', '.##..##.', ...x(8, '##....##'), '.##..##.', '..####..'],
  P: ['######..', '##...##.', '##....##', '##....##', '##....##', '##...##.', '######..', ...x(5, '##......')],
  Q: ['..####..', '.##..##.', ...x(6, '##....##'), '##..#.##', '##..####', '.##..##.', '..###.##'],
  R: ['######..', '##...##.', '##....##', '##....##', '##...##.', '######..', '##.##...', '##..##..', '##..##..', '##...##.', '##...##.', '##....##'],
  S: ['..####..', '.##..##.', '##....##', '##......', '.##.....', '..####..', '.....##.', '......##', '......##', '##....##', '.##..##.', '..####..'],
  T: ['########', ...x(11, '...##...')],
  U: [...x(10, '##....##'), '.##..##.', '..####..'],
  V: [...x(4, '##....##'), ...x(4, '.##..##.'), '..####..', '..####..', '...##...', '...##...'],
  W: [...x(4, '##......##'), '##..##..##', '##..##..##', '##.####.##', '##.#..#.##', '####..####', '###....###', '###....###', '##......##'],
  X: ['##....##', '##....##', '.##..##.', '.##..##.', '..####..', '...##...', '...##...', '..####..', '.##..##.', '.##..##.', '##....##', '##....##'],
  Y: ['##....##', '##....##', '.##..##.', '.##..##.', '..####..', '..####..', ...x(6, '...##...')],
  Z: ['########', '......##', '.....##.', '.....##.', '....##..', '...##...', '...##...', '..##....', '.##.....', '.##.....', '##......', '########'],
  'Æ': ['...#######', '..####....', '..####....', '..####....', '.##.##....', '.##.#####.', '.##.##....', '.##.##....', '######....', '##..##....', '##..##....', '##..######'],
  'Ø': ['..####.#', '.##..##.', '##...###', '##...###', '##..#.##', '##..#.##', '##.#..##', '##.#..##', '###...##', '###...##', '.##..##.', '#.####..'],
  'Å': ['...##...', '...##...', '..####..', '..####..', '.##..##.', '.##..##.', '.##..##.', '##....##', '########', '##....##', '##....##', '##....##'],
  0: ['..###..', '.##.##.', ...x(8, '##...##'), '.##.##.', '..###..'],
  1: ['..##..', '.###..', '####..', ...x(8, '..##..'), '######'],
  2: ['..###..', '.##.##.', '##...##', '.....##', '.....##', '....##.', '...##..', '..##...', '.##....', '##.....', '##.....', '#######'],
  3: ['..###..', '.##.##.', '##...##', '.....##', '....##.', '..###..', '....##.', '.....##', '.....##', '##...##', '.##.##.', '..###..'],
  4: ['....##.', '...###.', '...###.', '..#.##.', '.##.##.', '.#..##.', '##..##.', '#######', ...x(4, '....##.')],
  5: ['#######', '##.....', '##.....', '##.....', '#####..', '....##.', '.....##', '.....##', '.....##', '##...##', '.##.##.', '..###..'],
  6: ['..###..', '.##.##.', '##.....', '##.....', '##.##..', '###.##.', ...x(4, '##...##'), '.##.##.', '..###..'],
  7: ['#######', '.....##', '.....##', '....##.', '....##.', '...##..', '...##..', ...x(5, '..##...')],
  8: ['..###..', '.##.##.', '##...##', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '##...##', '##...##', '.##.##.', '..###..'],
  9: ['..###..', '.##.##.', ...x(4, '##...##'), '.##.###', '..##.##', '.....##', '.....##', '.##.##.', '..###..'],
  ' ': x(12, '...'),
  '.': at(10, ['##', '##']),
  ',': at(10, ['.##', '.##']),
  '!': [...x(8, '##'), '..', '..', '##', '##'],
  '?': ['..###..', '.##.##.', '##...##', '.....##', '.....##', '....##.', '...##..', '...##..', '.......', '.......', '...##..', '...##..'],
  "'": at(0, ['##', '##', '.#', '#.']),
  '"': at(0, ['##.##', '##.##', '.#..#', '#..#.']),
  ':': at(3, ['##', '##', '..', '..', '..', '..', '..', '##', '##']),
  ';': at(3, ['.##', '.##', '...', '...', '...', '...', '...', '.##', '.##']),
  '-': at(5, ['#####', '#####']),
  '·': at(4, ['.##.', '####', '####', '.##.']),
  '+': at(3, ['..##..', '..##..', '######', '######', '..##..', '..##..']),
  '/': ['....##', '....##', '...##.', '...##.', '...##.', '..##..', '..##..', '.##...', '.##...', '.##...', '##....', '##....'],
  '(': ['..##', '.##.', '.##.', ...x(6, '##..'), '.##.', '.##.', '..##'],
  ')': ['##..', '.##.', '.##.', ...x(6, '..##'), '.##.', '.##.', '##..'],
  '%': ['.##...##', '#..#..##', '#..#.##.', '.##..##.', '....##..', '....##..', '...##...', '...##...', '.##..##.', '.##.#..#', '##..#..#', '##...##.'],
  '&': ['..###....', '.##.##...', '.##.##...', '.##.##...', '..###....', '.###.....', '##.##..##', '##..##.##', '##...###.', '##...###.', '.##.##.##', '..###..##'],
  '*': at(2, ['...##...', '##.##.##', '.######.', '..####..', '.######.', '##.##.##', '...##...']),
  '#': at(1, ['.##..##.', '.##..##.', '########', '.##..##.', '.##..##.', '.##..##.', '########', '.##..##.', '.##..##.']),
  '=': at(3, ['######', '######', '......', '......', '######', '######']),
  '<': at(1, ['....##', '...##.', '..##..', '.##...', '##....', '##....', '.##...', '..##..', '...##.', '....##']),
  '>': at(1, ['##....', '.##...', '..##..', '...##.', '....##', '....##', '...##.', '..##..', '.##...', '##....']),
  _: at(10, ['#######', '#######']),
  '×': at(3, ['##...##', '.##.##.', '..###..', '..###..', '.##.##.', '##...##']),
  '♥': at(2, ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....']),
  '→': at(3, ['.....##..', '......##.', '#########', '#########', '......##.', '.....##..']),
  '←': at(3, ['..##.....', '.##......', '#########', '#########', '.##......', '..##.....']),
  '↑': at(1, ['...##...', '..####..', '.######.', '##.##.##', ...x(6, '...##...')]),
  '↓': at(1, [...x(6, '...##...'), '##.##.##', '.######.', '..####..', '...##...']),
}

/**
 * Rows above the cap height, top row first; the last one sits right over the capital.
 * @type {Record<string, string[]>}
 */
export const MARKS16_ABOVE = {
  'Å': ['...##...', '..#..#..', '...##...'],
  'É': ['....##.', '...##..', '.......'],
}

/**
 * Rows under the baseline, nearest row first.
 * @type {Record<string, string[]>}
 */
export const MARKS16_BELOW = {
  ',': ['..#', '.#.'],
  ';': ['..#', '.#.'],
}

/**
 * What a character without a drawing draws as. É keeps its accent.
 * @type {Record<string, string>}
 */
export const ALIAS16 = { '—': '-', '–': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '…': '.', 'É': 'E', 'È': 'E', 'Ä': 'Æ', 'Ö': 'Ø', 'Ü': 'U' }

/** @param {string} ch an upper-case character */
function glyph(ch) {
  return GLYPHS16[ch] ?? GLYPHS16[ALIAS16[ch] ?? '?'] ?? GLYPHS16['?']
}

/**
 * A character's twelve rows ('#' = lit), after upper-casing. Unknown
 * characters draw as '?'.
 * @param {string} ch
 * @returns {string[]}
 */
export function glyphRows16(ch) {
  return glyph(ch.toUpperCase())
}

/**
 * The rows a character draws above the capitals and under the baseline
 * (usually none), after upper-casing.
 * @param {string} ch
 * @returns {{ above: string[], below: string[] }}
 */
export function glyphExtra16(ch) {
  const c = ch.toUpperCase()
  return { above: MARKS16_ABOVE[c] ?? [], below: MARKS16_BELOW[c] ?? [] }
}

/**
 * Width of a line in font pixels (the last glyph's shadow not counted).
 * @param {string} text
 * @returns {number}
 */
export function textWidth16(text) {
  let w = 0
  for (const ch of text.toUpperCase()) w += glyph(ch)[0].length + GAP
  return Math.max(0, w - GAP)
}

/**
 * Break text into lines no wider than `maxWidth` font pixels; newlines start
 * new lines. A word longer than a line gets a line of its own.
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
export function wrapText16(text, maxWidth) {
  const lines = []
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    let line = ''
    for (const word of words) {
      const next = line ? line + ' ' + word : word
      if (textWidth16(next) <= maxWidth || !line) line = next
      else {
        lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines
}

/**
 * How the dark under the letters lies: 'drop' is the text box's shadow
 * (right, below and the corner between), 'rim' a line all the way round and
 * the drop outside it, for text that lies straight on the world.
 * @typedef {'drop' | 'rim'} Edge16
 */

/** @type {Record<Edge16, number[][]>} */
const OFFSETS = {
  drop: [[1, 0], [0, 1], [1, 1]],
  rim: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [1, 2], [2, 2], [0, 2], [2, 0]],
}

/**
 * Draw a line with its top-left at (x, y): y is the top of the capitals.
 * `unit` is the size of one font pixel in the context's units (0.5 on a
 * canvas laid out in 8-bit pixels and scaled 2×); the line snaps to that
 * grid. The shadow is laid down first and the letters over it, so give it
 * an opaque colour.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {string} [shadow]
 * @param {number} [unit]
 * @param {Edge16} [edge]
 */
export function drawText16(ctx, text, x, y, color, shadow, unit = 1, edge = 'drop') {
  const t = text.toUpperCase()
  const x0 = Math.round(x / unit) * unit
  const y0 = Math.round(y / unit) * unit
  /** @param {number} ox @param {number} oy @param {string} fill */
  const pass = (ox, oy, fill) => {
    ctx.fillStyle = fill
    let cx = x0 + ox * unit
    for (const ch of t) {
      const g = glyph(ch)
      const { above, below } = glyphExtra16(ch)
      const rows = [...above, ...g, ...below]
      const top = y0 + (oy - above.length) * unit
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        let c = 0
        // One rect per horizontal run.
        while (c < row.length) {
          if (row[c] !== '#') { c++; continue }
          const s = c
          while (c < row.length && row[c] === '#') c++
          ctx.fillRect(cx + s * unit, top + r * unit, (c - s) * unit, unit)
        }
      }
      cx += (g[0].length + GAP) * unit
    }
  }
  if (shadow) for (const [ox, oy] of OFFSETS[edge]) pass(ox, oy, shadow)
  pass(0, 0, color)
}
