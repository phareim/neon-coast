/**
 * The coast at dusk the way a 16-bit machine drew it: at twice the pixels
 * of scenery.js, the sky in bands that change every few scanlines and knit
 * where they meet (the HDMA gradient), the striped sun inside a dithered
 * halo, ridges and cloud streaks on layers that slide past each other at
 * their own speeds (parallax), lit on the edge that faces the sun and
 * hazed toward the horizon in bands, and a sea that glints.
 *
 * Drawn after the isometric view on phareim.no (its dusk sky, sun and sea
 * in themes/zelda/render/iso/legacy.ts `paintSky`; the banded haze and the
 * 15-bit colour in iso/shaders.ts). Every colour is five bits a channel.
 * The layers that slide are painted once, as wide as the scene and seamless
 * end to end; `drawDrift` places one at any offset.
 */
import { bayer, mix } from './sprites.js'
import { hash2 } from './scenery.js'
import { five } from './tokens.js'
import { ramp15, paintBands } from './pixel16.js'

/** The 16-bit coast's colours, by what they paint (each in five bits a channel). */
export const DUSK16 = {
  /** The sky's key colours, zenith to horizon; `ramp15` makes the bands between. */
  sky: ['#100830', '#1a1048', '#382068', '#682878', '#a83080', '#e05088', '#f87888', '#f8b070'],
  sun: ['#f8f0b0', '#f8d040', '#f8b040', '#f88840', '#f86078', '#f830a0'],
  halo: '#f89878',
  cloud: '#582868', cloudLit: '#f87898', cloudTop: '#783888',
  ridgeFar: '#382068', ridgeFarRim: '#c050a0',
  ridge: '#181040', ridgeRim: '#f860b0',
  sea: ['#583890', '#283888', '#182868', '#101848', '#080c30'],
  horizon: '#f8c8e0',
  glint: '#f8e0f0', glintCyan: '#88e8f8', glintPink: '#f890d0',
}

/**
 * Quantise a #rrggbb colour to five bits a channel.
 * @param {string} c
 * @returns {string}
 */
const q = c => '#' + [1, 3, 5].map(i => five(parseInt(c.slice(i, i + 2), 16)).toString(16).padStart(2, '0')).join('')

/**
 * The dusk sky from the top down to the horizon in `bands` bands, thinner
 * toward the horizon, their edges knit with an ordered dither.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} horizon y of the horizon
 * @param {number} [bands]
 */
export function paintSky16(g, w, horizon, bands = 16) {
  const colors = ramp15(DUSK16.sky, bands)
  // Band i starts where (y / horizon)^1.6 reaches i / bands, as in the game's sky.
  const stops = colors.map((color, i) => ({ color, at: Math.pow(i / bands, 1 / 1.6) }))
  paintBands(g, 0, 0, w, horizon, stops, { dither: true, knit: 3 })
}

/**
 * The sun half set on the horizon: five colours top to bottom, the lower
 * half cut by stripes that widen as it sinks, inside a halo of two
 * dithered rings.
 * @param {CanvasRenderingContext2D} g
 * @param {number} cx
 * @param {number} horizon y of the horizon (the sun's centre sits on it)
 * @param {number} r
 */
export function paintSun16(g, cx, horizon, r) {
  cx = Math.round(cx)
  r = Math.max(6, Math.round(r))
  // The halo: two rings of warm light over the sky, every other pixel and then every fourth.
  g.fillStyle = q(DUSK16.halo)
  for (let y = -Math.round(r * 1.5); y < 0; y++) {
    for (let x = -Math.round(r * 1.5); x <= Math.round(r * 1.5); x++) {
      const d = Math.sqrt(x * x + y * y) / r
      if (d <= 1.02 || d > 1.5) continue
      const amount = d < 1.22 ? 0.5 : 0.25
      if (bayer(cx + x, horizon + y) < amount) g.fillRect(cx + x, horizon + y, 1, 1)
    }
  }
  const cols = DUSK16.sun
  const stripe = Math.max(4, Math.round(r / 5))
  for (let y = -r; y < 0; y++) {
    const half = Math.round(Math.sqrt(r * r - y * y))
    const p = (y + r) / r
    // Below the middle the stripes open: wider gaps toward the horizon.
    if (p > 0.4) {
      const gap = Math.max(1, Math.round(((p - 0.4) / 0.6) * stripe * 0.7))
      if ((y + r) % stripe < gap) continue
    }
    g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(p * cols.length))]
    g.fillRect(cx - half, horizon + y, half * 2, 1)
  }
}

/**
 * A ridge as wide as the scene and seamless end to end, standing on `base`:
 * a crest from a sum of whole waves over the width, a two-pixel rim lit
 * toward the sun, and a body that darkens in bands from the rim down. `haze`
 * (0–1) mixes it toward the horizon colour, as the far hills on the game's
 * horizon are.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} base
 * @param {number} height
 * @param {{ body: string, rim: string, haze?: number, salt?: number, sunX?: number }} o
 */
export function paintRidge16(g, w, base, height, o) {
  const salt = o.salt ?? 1
  const haze = o.haze ?? 0
  const sky = DUSK16.sky[DUSK16.sky.length - 2]
  const body = q(mix(o.body, sky, haze))
  const body2 = q(mix(mix(o.body, '#000000', 0.25), sky, haze))
  const rim = q(mix(o.rim, sky, haze * 0.5))
  const waves = [1, 2, 3, 5, 8].map((k, i) => ({ k, a: 1 / (i + 1.2), ph: hash2(k, salt, 7) * Math.PI * 2 }))
  const sum = waves.reduce((s, v) => s + v.a, 0)
  for (let x = 0; x < w; x++) {
    let v = 0
    for (const { k, a, ph } of waves) v += a * Math.sin((x / w) * Math.PI * 2 * k + ph)
    const top = Math.round(base - height * (0.55 + 0.45 * (v / sum)))
    const depth = base - top
    if (depth <= 0) continue
    g.fillStyle = body
    g.fillRect(x, top, 1, depth)
    // The lower half one shade darker, knit into the upper with a dither.
    const mid = top + Math.round(depth * 0.55)
    g.fillStyle = body2
    g.fillRect(x, mid + 2, 1, Math.max(0, base - mid - 2))
    for (let y = mid; y < mid + 2 && y < base; y++) if (bayer(x, y) < (y - mid + 1) / 3) g.fillRect(x, y, 1, 1)
    // The rim: two pixels where the crest faces the sun (rising toward it), one elsewhere.
    const facing = o.sunX == null ? true : (x < o.sunX) === (v > 0)
    g.fillStyle = rim
    g.fillRect(x, top, 1, facing ? 2 : 1)
  }
}

/**
 * Cloud streaks as wide as the scene and seamless end to end, between y0
 * and y1: long thin bands, lit pink underneath by the sun below them, a
 * paler line on top.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} y0
 * @param {number} y1
 * @param {{ salt?: number, count?: number }} [o]
 */
export function paintClouds16(g, w, y0, y1, o = {}) {
  const salt = o.salt ?? 3
  const n = o.count ?? Math.max(3, Math.round(w / 110))
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(hash2(i, 1, salt) * w)
    const cy = Math.round(y0 + hash2(i, 2, salt) * (y1 - y0))
    const len = Math.round(w * (0.12 + hash2(i, 3, salt) * 0.22))
    const th = 2 + Math.floor(hash2(i, 4, salt) * 4)
    for (let r = 0; r < th; r++) {
      // Rounded ends: the outer rows are shorter.
      const edge = Math.min(r, th - 1 - r)
      const inset = edge === 0 ? Math.round(len * 0.12) + 2 : 0
      const color = r === th - 1 ? DUSK16.cloudLit : r === 0 ? DUSK16.cloudTop : DUSK16.cloud
      g.fillStyle = q(color)
      const x = cx - Math.round(len / 2) + inset + (r % 2) * 2
      const span = len - inset * 2
      // Drawn twice where it runs off an end, so the layer wraps.
      g.fillRect(x, cy + r, span, 1)
      if (x < 0) g.fillRect(x + w, cy + r, span, 1)
      if (x + span > w) g.fillRect(x - w, cy + r, span, 1)
    }
  }
}

/**
 * Draw a seamless layer shifted left by `offset` pixels (any number; it
 * wraps), whole pixels only.
 * @param {CanvasRenderingContext2D} g
 * @param {HTMLCanvasElement} layer
 * @param {number} offset
 */
export function drawDrift(g, layer, offset) {
  const w = layer.width
  const o = ((Math.round(offset) % w) + w) % w
  g.drawImage(layer, -o, 0)
  if (o) g.drawImage(layer, w - o, 0)
}

/**
 * The sea from the horizon down: bands from the horizon's lilac to the
 * deep, knit where they meet, and a bright line on the horizon.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 */
export function paintSea16(g, w, top, bottom) {
  const colors = ramp15(DUSK16.sea, 8)
  paintBands(g, 0, top, w, bottom - top, colors, { dither: true, knit: 2 })
  g.fillStyle = q(DUSK16.horizon)
  g.fillRect(0, top, w, 1)
}

/**
 * What moves on the sea: the sun's reflection as broken stripes under it
 * that shimmer, and glints that come and go across the water, in steps of
 * a sixth of a second.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 * @param {number | null} sunX
 * @param {number} sunR
 * @param {number} time seconds
 */
export function paintGlints16(g, w, top, bottom, sunX, sunR, time) {
  const tick = Math.floor(time * 6)
  const depth = bottom - top
  if (sunX != null) {
    const cols = DUSK16.sun.slice(1)
    for (let y = top + 2; y < top + depth * 0.7; y += 3) {
      const d = (y - top) / depth
      const half = Math.round(sunR * (0.9 - d * 0.5) * (0.75 + 0.25 * hash2(y, tick, 5)))
      const shift = Math.round((hash2(y, tick, 6) - 0.5) * 4)
      g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(d * 2 * cols.length))]
      // Each stripe is broken in two or three pieces.
      let x = Math.round(sunX) - half + shift
      while (x < sunX + half + shift) {
        const run = 3 + Math.floor(hash2(x, y + tick, 8) * 10)
        g.fillRect(x, y, Math.min(run, sunX + half + shift - x), 1)
        x += run + 2 + Math.floor(hash2(x, y, 9) * 4)
      }
    }
  }
  const n = Math.round((w * depth) / 500)
  for (let i = 0; i < n; i++) {
    // A glint lives for a few ticks, then shows up somewhere else.
    const life = tick + i * 7
    const gen = Math.floor(life / 5)
    if (life % 5 > 2) continue
    const x = Math.floor(hash2(i, gen, 21) * w)
    const y = top + 2 + Math.floor(Math.pow(hash2(i, gen, 22), 1.4) * (depth - 3))
    const len = 2 + Math.floor(hash2(i, gen, 23) * 4 * (y - top) / depth + 1)
    const k = hash2(i, gen, 24)
    g.fillStyle = k < 0.5 ? DUSK16.glint : k < 0.8 ? DUSK16.glintPink : DUSK16.glintCyan
    g.fillRect(x, y, len, 1)
  }
}
