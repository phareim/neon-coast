/**
 * Pixel sprites written as text.
 *
 * A sprite is an array of equal-length strings, one character per pixel:
 * '.' (or a space) is transparent and every other character is a key of the
 * palette (`PAL` in tokens.js: k ink, c cyan, p pink, y gold, …). Canvases
 * are built once per rows array and cached, so keep the arrays as constants.
 *
 *   const HEART = ['.kk.kk.', 'kmpkppk', 'kpppppk', '.kpppk.', '..kpk..', '...k...']
 *   put(g, sprite(HEART), 10, 10)
 */
import { makeCanvas } from './stage.js'
import { PAL } from './tokens.js'

/** @typedef {readonly string[]} Rows */

/** @type {WeakMap<Rows, Map<string, HTMLCanvasElement>>} */
const cache = new WeakMap()

/**
 * @param {Rows} rows
 * @param {string} key
 * @param {() => HTMLCanvasElement} build
 */
function cached(rows, key, build) {
  let m = cache.get(rows)
  if (!m) { m = new Map(); cache.set(rows, m) }
  let c = m.get(key)
  if (!c) { c = build(); m.set(key, c) }
  return c
}

/** @param {HTMLCanvasElement} c */
const ctx2d = c => /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'))

/**
 * The sprite as a canvas (one canvas pixel per character). `pal` overrides
 * palette keys (e.g. `{ c: '#ffd23f' }` for a gold variant); `flip` mirrors
 * it horizontally.
 * @param {Rows} rows
 * @param {Record<string, string>} [pal]
 * @param {boolean} [flip]
 * @returns {HTMLCanvasElement}
 */
export function sprite(rows, pal, flip = false) {
  const key = (pal ? JSON.stringify(pal) : '') + (flip ? '|f' : '')
  return cached(rows, key, () => {
    const h = rows.length
    const w = rows[0].length
    const c = makeCanvas(w, h)
    const g = ctx2d(c)
    for (let y = 0; y < h; y++) {
      const row = rows[y]
      for (let x = 0; x < w; x++) {
        const ch = row[x]
        if (ch === '.' || ch === ' ') continue
        const col = pal?.[ch] ?? PAL[ch]
        if (!col) continue
        g.fillStyle = col
        g.fillRect(flip ? w - 1 - x : x, y, 1, 1)
      }
    }
    return c
  })
}

/**
 * Every opaque pixel in one colour (hit flashes, shadows, silhouettes).
 * @param {Rows} rows
 * @param {string} color
 * @returns {HTMLCanvasElement}
 */
export function silhouette(rows, color) {
  return cached(rows, 'sil:' + color, () => {
    const h = rows.length
    const w = rows[0].length
    const c = makeCanvas(w, h)
    const g = ctx2d(c)
    g.fillStyle = color
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x]
      if (ch !== '.' && ch !== ' ') g.fillRect(x, y, 1, 1)
    }
    return c
  })
}

/**
 * Draw a sprite canvas with its top-left on whole logical pixels.
 * @param {CanvasRenderingContext2D} g
 * @param {CanvasImageSource & { width: number, height: number }} c
 * @param {number} x
 * @param {number} y
 */
export function put(g, c, x, y) {
  g.drawImage(c, Math.round(x), Math.round(y))
}

/**
 * Draw a sprite canvas centred on (x, y).
 * @param {CanvasRenderingContext2D} g
 * @param {CanvasImageSource & { width: number, height: number }} c
 * @param {number} x
 * @param {number} y
 */
export function putC(g, c, x, y) {
  g.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2))
}

/**
 * The house shading for a one-colour shape: draw the shape with 'X' and get
 * back rows with an outline round it, `hi` on pixels with open space above,
 * `lo` on pixels with open space below and `body` elsewhere. Other letters
 * in the map are kept as they are. The result is two pixels wider and
 * taller than the input.
 * @param {Rows} rows
 * @param {string} body
 * @param {string} hi
 * @param {string} lo
 * @param {string} [outline]
 * @returns {string[]}
 */
export function shade(rows, body, hi, lo, outline = 'k') {
  const h = rows.length
  const w = rows[0].length
  /** @param {number} x @param {number} y */
  const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.' && rows[y][x] !== ' '
  const out = []
  for (let y = -1; y <= h; y++) {
    let line = ''
    for (let x = -1; x <= w; x++) {
      if (on(x, y)) {
        const ch = rows[y][x]
        if (ch !== 'X') line += ch
        else if (!on(x, y - 1)) line += hi
        else if (!on(x, y + 1)) line += lo
        else line += body
      } else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) line += outline
      else line += '.'
    }
    out.push(line)
  }
  return out
}

const LIGHTER = /** @type {Record<string, string>} */ ({ K: 'u', u: 'G', G: 'g', V: 'v', v: 'm', P: 'p', p: 'm', m: 'w', C: 'c', c: 'w', B: 'b', b: 'c', Y: 'y', y: 'e', h: 'H', R: 'r', r: 'm', T: 't', t: 'c', g: 'W', W: 'w' })

/**
 * Top light on a sprite map: every pixel with open space or outline above
 * it steps one shade lighter. `remap` swaps colours first (e.g. `{ K: 'u' }`
 * lifts near-black shapes off a dark background).
 * @param {Rows} rows
 * @param {Record<string, string>} [remap]
 * @returns {string[]}
 */
export function relight(rows, remap = {}) {
  const src = rows.map(r => [...r].map(ch => remap[ch] ?? ch))
  /** @param {number} x @param {number} y */
  const open = (x, y) => y < 0 || src[y][x] === '.' || src[y][x] === 'k'
  return src.map((row, y) => row.map((ch, x) => (ch !== '.' && ch !== 'k' && open(x, y - 1) ? LIGHTER[ch] ?? ch : ch)).join(''))
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

/**
 * Ordered-dither threshold for a pixel, 0–1 (4×4 Bayer).
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function bayer(x, y) {
  return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16
}

/**
 * Mix two #rrggbb colours: t = 0 → a, 1 → b.
 * @param {string} a
 * @param {string} b
 * @param {number} t
 * @returns {string}
 */
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1, 7), 16)
  const pb = parseInt(b.slice(1, 7), 16)
  /** @param {number} s */
  const ch = s => {
    const x = (pa >> s) & 255
    const y = (pb >> s) & 255
    return Math.round(x + (y - x) * t)
  }
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)
}

/** Palette keys a pixelized drawing may snap to (no skin, wood or clay). */
const SNAP_KEYS = ['K', 'u', 'w', 'W', 'g', 'G', 'c', 'C', 'b', 'B', 'p', 'P', 'm', 'v', 'V', 'y', 'Y', 'o', 'r', 'R', 'h', 'e', 't', 'T']

/**
 * Pixel art from a vector drawing: `paint` draws centred on (0, 0) into a
 * w×h canvas; every pixel at least half covered snaps to the nearest
 * palette colour, the rest goes transparent, and an ink outline is added.
 * Returns rows for `sprite()`. Good for art whose size is only known at run
 * time.
 * @param {(g: CanvasRenderingContext2D) => void} paint
 * @param {number} w
 * @param {number} h
 * @param {string[]} [keys]
 * @param {boolean} [outline]
 * @returns {string[]}
 */
export function pixelize(paint, w, h, keys = SNAP_KEYS, outline = true) {
  w = Math.max(1, Math.round(w))
  h = Math.max(1, Math.round(h))
  const c = makeCanvas(w, h)
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d', { willReadFrequently: true }))
  g.translate(w / 2, h / 2)
  paint(g)
  const d = g.getImageData(0, 0, w, h).data
  const pal = keys.map(k => {
    const v = parseInt(PAL[k].slice(1), 16)
    return /** @type {const} */ ([k, (v >> 16) & 255, (v >> 8) & 255, v & 255])
  })
  /** @type {string[][]} */
  const grid = []
  for (let y = 0; y < h; y++) {
    const row = []
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (d[i + 3] < 115) { row.push('.'); continue }
      let best = 'k'
      let bd = Infinity
      for (const [k, r, gg, b] of pal) {
        const dr = d[i] - r
        const dg = d[i + 1] - gg
        const db = d[i + 2] - b
        const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11
        if (dist < bd) { bd = dist; best = k }
      }
      row.push(best)
    }
    grid.push(row)
  }
  if (!outline) return grid.map(r => r.join(''))
  /** @param {number} x @param {number} y */
  const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && grid[y][x] !== '.'
  const out = []
  for (let y = -1; y <= h; y++) {
    let line = ''
    for (let x = -1; x <= w; x++) {
      if (on(x, y)) line += grid[y][x]
      else line += on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1) ? 'k' : '.'
    }
    out.push(line)
  }
  return out
}

/**
 * Ready-made sprites in the house style (8 px HUD icons and friends).
 * Use them with `sprite(SPRITES.heart)` or `<nc-sprite name="heart">`.
 * @type {Record<string, string[]>}
 */
export const SPRITES = {
  heart: [
    '.kk.kk..',
    'kmpkppk.',
    'kwpppPk.',
    'kpppppPk',
    '.kpppPk.',
    '..kpPk..',
    '...kk...',
  ],
  'heart-half': [
    '.kk.kk..',
    'kmpkKKk.',
    'kwpkKKk.',
    'kppkKKKk',
    '.kpkKKk.',
    '..kpKk..',
    '...kk...',
  ],
  'heart-empty': [
    '.kk.kk..',
    'kKKkKKk.',
    'kKKKKKk.',
    'kKKKKKKk',
    '.kKKKKk.',
    '..kKKk..',
    '...kk...',
  ],
  gem: [
    '...kk...',
    '..klLk..',
    '.klwlLk.',
    'kllllLLk',
    'klllLLLk',
    '.kLLLLk.',
    '..kLLk..',
    '...kk...',
  ],
  key: [
    '.kkk....',
    'kyeyk...',
    'kykYkkkk',
    'kyYyyyYk',
    '.kkkyky.',
    '....k.k.',
  ],
  bomb: [
    '.....ky.',
    '....ky..',
    '..kkYk..',
    '.kBbbBk.',
    'kBwbBBBk',
    'kBbBBBBk',
    '.kBBBBk.',
    '..kkkk..',
  ],
  coin: [
    '..kkkk..',
    '.keyyyk.',
    'keyYyyYk',
    'kyyYyyYk',
    'kyyYyyYk',
    'kyyyyyYk',
    '.kYYYYk.',
    '..kkkk..',
  ],
  star: shade([
    '...X...',
    '..XXX..',
    'XXXXXXX',
    '.XXXXX.',
    '..XXX..',
    '.XX.XX.',
    'XX...XX',
  ], 'y', 'e', 'Y'),
  home: shade([
    '....X....',
    '...XXX...',
    '..XXXXX..',
    '.XXXXXXX.',
    'XXXXXXXXX',
    '.XXX.XXX.',
    '.XXX.XXX.',
    '.XXX.XXX.',
  ], 'c', 'w', 'C'),
  cursor: [
    'k.....',
    'kck...',
    'kcck..',
    'kccck.',
    'kcccck',
    'kccck.',
    'kcck..',
    'kck...',
    'k.....',
  ],
  sun: [
    '...eeeee...',
    '.eeeeeeeee.',
    '.yyyyyyyyy.',
    'yyyyyyyyyyy',
    'yyyyyyyyyyy',
    '...........',
    'ooooooooooo',
    '...........',
    '.ppppppppp.',
    '...........',
    '...ppppp...',
  ],
}
