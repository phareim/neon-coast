/**
 * What the 16-bit machine does to pixels: art taken up to twice the density
 * without new colours (EPX), black outlines that take the colour of what
 * they hold (selout), fifteen-bit colour with an ordered dither, and ramps
 * painted in bands whose edges knit. Small, dependency-free, and the pure
 * parts (`epx`, `seloutPixels`, `quantize15`, `ramp15`) need no DOM.
 *
 * From phareim.no: themes/base/pixel/epx.ts (EPX, copied), and the
 * isometric engine's shaders (themes/zelda/render/iso/shaders.ts): the
 * ART chunk's Scale2x, the composite pass's "five bits a channel, the rest
 * is a dither" (strength 0.55 on the 4×4 Bayer matrix) and its banded haze.
 */
import { bayer } from './sprites.js'
import { five } from './tokens.js'
import { makeCanvas } from './stage.js'

/** @param {HTMLCanvasElement} c */
const ctx2d = c => /** @type {CanvasRenderingContext2D} */ (c.getContext('2d', { willReadFrequently: true }))

/**
 * EPX (Scale2x): a picture at twice the size, without new colours. Each
 * pixel becomes four; a corner takes its neighbours' colour where the two
 * neighbours on its sides agree and the other two do not, so stairs turn
 * into diagonals and straight edges stay straight.
 * @param {ArrayLike<number>} src w × h pixels, one number per pixel (compared whole)
 * @param {number} w
 * @param {number} h
 * @returns {Uint32Array} 2w × 2h
 */
export function epx(src, w, h) {
  const out = new Uint32Array(w * h * 4)
  /** @param {number} x @param {number} y */
  const at = (x, y) => src[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = at(x, y)
      const up = at(x, y - 1)
      const right = at(x + 1, y)
      const left = at(x - 1, y)
      const down = at(x, y + 1)
      const o = y * 2 * w * 2 + x * 2
      out[o] = left === up && left !== down && up !== right ? up : p
      out[o + 1] = up === right && up !== left && right !== down ? right : p
      out[o + w * 2] = down === left && down !== right && left !== up ? left : p
      out[o + w * 2 + 1] = right === down && right !== up && down !== left ? down : p
    }
  }
  return out
}

/**
 * A canvas at twice the size, through `epx`.
 * @param {HTMLCanvasElement} src
 * @returns {HTMLCanvasElement}
 */
export function scale2x(src) {
  const w = src.width
  const h = src.height
  // Read through a canvas of our own, made for reading (the source's context may not be).
  const read = makeCanvas(w, h)
  const rg = ctx2d(read)
  rg.drawImage(src, 0, 0)
  const data = rg.getImageData(0, 0, w, h)
  const big = epx(new Uint32Array(data.data.buffer), w, h)
  const c = makeCanvas(w * 2, h * 2)
  const g = ctx2d(c)
  const img = g.createImageData(w * 2, h * 2)
  new Uint32Array(img.data.buffer).set(big)
  g.putImageData(img, 0, 0)
  return c
}

/**
 * Selective outline on RGBA pixels, in place: a dark outline pixel (luma
 * under `dark`) that touches lighter colour takes that colour, darkened to
 * `keep` of itself; where it touches only the outside it stays dark. So a
 * pink heart gets a deep-pink rim inside its black one, the way 16-bit
 * artists outlined.
 * @param {Uint8ClampedArray} data
 * @param {number} w
 * @param {number} h
 * @param {{ dark?: number, keep?: number }} [opts]
 * @returns {Uint8ClampedArray}
 */
export function seloutPixels(data, w, h, opts = {}) {
  const { dark = 0.16, keep = 0.5 } = opts
  const src = data.slice()
  /** @param {number} i */
  const luma = i => (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (src[i + 3] < 128 || luma(i) >= dark) continue
      let r = 0, g = 0, b = 0, n = 0
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const j = (ny * w + nx) * 4
        if (src[j + 3] < 128 || luma(j) < dark) continue
        r += src[j]; g += src[j + 1]; b += src[j + 2]; n++
      }
      if (!n) continue
      data[i] = (r / n) * keep
      data[i + 1] = (g / n) * keep
      data[i + 2] = (b / n) * keep
    }
  }
  return data
}

/**
 * `seloutPixels` on a canvas, in place. Returns the canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ dark?: number, keep?: number }} [opts]
 * @returns {HTMLCanvasElement}
 */
export function selout(canvas, opts) {
  const g = ctx2d(canvas)
  const img = g.getImageData(0, 0, canvas.width, canvas.height)
  seloutPixels(img.data, canvas.width, canvas.height, opts)
  g.putImageData(img, 0, 0)
  return canvas
}

/**
 * The machine's colours, in place: five bits a channel (32 768 colours).
 * With `dither` the rest becomes an ordered 4×4 dither, as the isometric
 * engine's last pass does, so a smooth ramp turns into knitted bands.
 * @template {{ data: Uint8ClampedArray, width: number, height: number }} T
 * @param {T} imageData
 * @param {{ dither?: boolean }} [opts]
 * @returns {T}
 */
export function quantize15(imageData, opts = {}) {
  const { data, width, height } = imageData
  const dither = opts.dither ?? true
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const d = dither ? (bayer(x, y) - 0.5) * 0.55 : 0
      for (let c = 0; c < 3; c++) {
        const v = Math.floor((data[i + c] / 255) * 31 + 0.5 + d)
        data[i + c] = Math.round((Math.max(0, Math.min(31, v)) * 255) / 31)
      }
    }
  }
  return imageData
}

/**
 * `n` colours from the first key colour to the last, through the ones
 * between, each channel in five bits: the stops of a band ramp.
 * @param {readonly string[]} keys #rrggbb, top first
 * @param {number} n
 * @returns {string[]}
 */
export function ramp15(keys, n) {
  const rgb = keys.map(k => [1, 3, 5].map(i => parseInt(k.slice(i, i + 2), 16)))
  const out = []
  for (let s = 0; s < n; s++) {
    const t = n === 1 ? 0 : (s / (n - 1)) * (rgb.length - 1)
    const i = Math.min(rgb.length - 2, Math.floor(t))
    const f = rgb.length === 1 ? 0 : t - i
    const a = rgb[i]
    const b = rgb[Math.min(rgb.length - 1, i + 1)]
    out.push('#' + [0, 1, 2].map(c => five(a[c] + (b[c] - a[c]) * f).toString(16).padStart(2, '0')).join(''))
  }
  return out
}

/**
 * A vertical ramp in bands, top to bottom, as a 16-bit machine changed the
 * colour every few scanlines. `stops` are the bands' colours (equal bands),
 * or `{ color, at }` with `at` (0–1) where each band starts. With `dither`
 * the last rows of a band knit into the next in ordered-dither steps (a
 * quarter, half, three quarters), the way the dusk sky does in the game.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {readonly (string | { color: string, at: number })[]} stops
 * @param {{ dither?: boolean, knit?: number }} [opts] knit: rows that knit at each edge (default up to 4)
 */
export function paintBands(ctx, x, y, w, h, stops, opts = {}) {
  if (h <= 0 || w <= 0 || !stops.length) return
  const list = stops.map((s, i) => typeof s === 'string' ? { color: s, at: i / stops.length } : s)
  const dither = opts.dither ?? true
  for (let r = 0; r < h; r++) {
    const f = (r + 0.5) / h
    let i = 0
    while (i + 1 < list.length && list[i + 1].at <= f) i++
    ctx.fillStyle = list[i].color
    ctx.fillRect(x, y + r, w, 1)
    if (!dither || i + 1 >= list.length) continue
    const end = Math.round(list[i + 1].at * h)
    const start = Math.round(list[i].at * h)
    const knit = Math.min(opts.knit ?? 4, Math.floor((end - start) / 2))
    const left = end - r
    if (knit <= 0 || left > knit) continue
    // Nearer the edge, more of the next band shows through.
    const amount = (knit - left + 1) / (knit + 1)
    ctx.fillStyle = list[i + 1].color
    for (let c = 0; c < w; c++) if (bayer(x + c, y + r) < amount) ctx.fillRect(x + c, y + r, 1, 1)
  }
}
