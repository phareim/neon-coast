/**
 * Side-view scenery for the pixel stage: the dusk sky, stars, the striped
 * sun, ridges with a magenta rim, teal tree lines, houses with lit windows,
 * lamps, grass, and the coast itself — the sea with the sun's reflection,
 * the beach and the palms. Every painter works in logical pixels on any 2D
 * context and is deterministic (hash-seeded), so a static layer can be
 * painted once per resize and blitted every frame. Painters that take
 * `time` (seconds) animate.
 */
import { bayer } from './sprites.js'
import { SKY, SUN } from './tokens.js'


/** The scenery's colours, by what they paint. */
export const DUSK = {
  sky0: SKY[0], sky1: SKY[1], sky2: SKY[2], sky3: SKY[3], sky4: SKY[4], sky5: SKY[5], sky6: SKY[6], sky7: SKY[7],
  star: '#cfc6ff', starHi: '#fff4ff', starDim: '#6a5fa0',
  sun0: SUN[0], sun1: SUN[1], sun2: SUN[2], sun3: SUN[3],
  ridgeFar: '#2c2058', ridgeFarRim: '#6a4fb0', ridge: '#1c1440', ridgeRim: '#d0509e',
  canopyD: '#0f3445', canopyM: '#1b5763', canopyL: '#2a8579', canopyH: '#5fd6b8', rim: '#d0509e', trunk: '#3a2240',
  g0: '#245573', g1: '#2d6682', g2: '#1b4560', g3: '#163a52', blade: '#3f8fa8', tip: '#6fd2d6',
  path: '#7d4d7c', pathL: '#9b6593', pathD: '#5e3862',
  roof: '#8c2e72', roofL: '#b8468f', roofD: '#5a1c4c', roofHi: '#e070b0', wall: '#3b2b62', wallL: '#4f3c7e', wallD: '#271c46', window: '#ffd23f', windowD: '#ffb13f',
  stone: '#3a2f70', stoneL: '#4a3d88', stoneD: '#271f50', stoneTop: '#1f1a3c', neon: '#ff3fae', neonC: '#3ff0ff',
  water: '#123372', waterD: '#0b2358', waterHaze: '#2a2a78', wave: '#1d4590', foam: '#7ce4ff', horizon: '#2ff3ff', glint: '#ff5fd0',
  sand: '#a8846a', sandL: '#c29c7c', sandD: '#866651', sandW: '#5e4a56',
  palm: '#140a22', palmL: '#2a1840',
}

/**
 * A stable pseudo-random number in [0, 1) for a grid cell.
 * @param {number} x
 * @param {number} y
 * @param {number} [salt]
 * @returns {number}
 */
export function hash2(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/**
 * Smooth 1-D value noise in [0, 1) with cell size `c`.
 * @param {number} x
 * @param {number} c
 * @param {number} [salt]
 * @returns {number}
 */
export function noise1(x, c, salt = 0) {
  const gx = Math.floor(x / c)
  const f = x / c - gx
  const s = f * f * (3 - 2 * f)
  const a = hash2(gx, 0, salt)
  const b = hash2(gx + 1, 0, salt)
  return a + (b - a) * s
}

/**
 * Fill a rectangle (one pixel by default).
 * @param {CanvasRenderingContext2D} g
 * @param {string} c
 * @param {number} x
 * @param {number} y
 * @param {number} [w]
 * @param {number} [h]
 */
export function rect(g, c, x, y, w = 1, h = 1) {
  g.fillStyle = c
  g.fillRect(x, y, w, h)
}

/**
 * A filled pixel disc.
 * @param {CanvasRenderingContext2D} g
 * @param {string} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rad
 */
export function disc(g, c, cx, cy, rad) {
  g.fillStyle = c
  for (let y = -rad; y <= rad; y++) {
    const half = Math.floor(Math.sqrt(rad * rad - y * y + rad * 0.8))
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1)
  }
}

/**
 * Vertical gradient through `stops` (top → bottom, evenly spaced over
 * y0..y1): solid bands with a short Bayer-dithered seam between them, the
 * way hand-made pixel skies do it.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y0
 * @param {number} w
 * @param {number} y1
 * @param {string[]} stops
 */
export function ditherGradient(g, x, y0, w, y1, stops) {
  const h = y1 - y0
  if (h <= 0 || stops.length === 0) return
  const n = stops.length - 1
  for (let y = 0; y < h; y++) {
    const t = n === 0 ? 0 : (y / Math.max(1, h - 1)) * n
    const i = Math.min(n - 1, Math.floor(t))
    const f = t - i
    const a = stops[Math.max(0, i)]
    const b = stops[Math.min(n, i + 1)]
    const d = (f - 0.5) * 3 + 0.5
    if (d <= 1 / 17 || n === 0) { rect(g, a, x, y0 + y, w, 1); continue }
    if (d >= 16 / 17) { rect(g, b, x, y0 + y, w, 1); continue }
    rect(g, a, x, y0 + y, w, 1)
    g.fillStyle = b
    for (let px = 0; px < w; px++) if (bayer(x + px, y0 + y) < d) g.fillRect(x + px, y0 + y, 1, 1)
  }
}

/**
 * The dusk sky from the top (night) down to the horizon (warm).
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} horizon y of the horizon
 * @param {boolean} [warm] false stops at violet (no pink glow)
 */
export function paintSky(g, w, horizon, warm = true) {
  ditherGradient(g, 0, 0, w, horizon, warm ? SKY.slice(0, 7) : SKY.slice(0, 5))
}

/**
 * Stars above `maxY`, thinning towards the horizon; some twinkle with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} maxY
 * @param {number} time seconds
 * @param {number} [density]
 * @param {number} [salt]
 */
export function drawStars(g, w, maxY, time, density = 1, salt = 11) {
  const n = Math.floor((w * maxY) / 260 * density)
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash2(i, 1, salt) * w)
    const y = Math.floor(Math.pow(hash2(i, 2, salt), 1.6) * maxY)
    const tw = hash2(i, 3, salt)
    const phase = Math.sin(time * (1.5 + tw * 3) + i)
    if (tw > 0.85) {
      // A bright cross star.
      rect(g, phase > 0.3 ? DUSK.starHi : DUSK.star, x, y)
      if (phase > 0.6) { rect(g, DUSK.star, x - 1, y); rect(g, DUSK.star, x + 1, y); rect(g, DUSK.star, x, y - 1); rect(g, DUSK.star, x, y + 1) }
    } else if (tw > 0.4 || phase > -0.5) {
      rect(g, tw > 0.65 ? DUSK.star : DUSK.starDim, x, y)
    }
  }
}

/**
 * The striped sun: cream on top warming to pink, with dark bands that
 * widen towards the bottom.
 * @param {CanvasRenderingContext2D} g
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {string} [bandColor] the colour seen through the bands (the sky behind)
 */
export function paintSun(g, cx, cy, r, bandColor = DUSK.sky5) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.max(3, Math.round(r))
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y + r * 0.6))
    const t = (y + r) / (2 * r)
    const col = t < 0.28 ? DUSK.sun0 : t < 0.5 ? DUSK.sun1 : t < 0.72 ? DUSK.sun2 : DUSK.sun3
    const below = y - Math.floor(r * 0.05)
    if (below > 0) {
      const period = Math.max(3, Math.round(r / 4))
      const gap = 1 + Math.floor((below / r) * (period - 1))
      if (below % period < gap) { rect(g, bandColor, cx - half, cy + y, half * 2 + 1, 1); continue }
    }
    rect(g, col, cx - half, cy + y, half * 2 + 1, 1)
  }
}

/**
 * A mountain ridge across x = 0..w with its crest round `base - height`,
 * solid down to `bottom`; `rim` lights the crest.
 * @param {CanvasRenderingContext2D} g
 * @param {number} w
 * @param {number} base
 * @param {number} height
 * @param {number} bottom
 * @param {string} body
 * @param {string} rim
 * @param {number} [salt]
 * @param {number} [sharp] 0 soft – 1 jagged
 */
export function paintRidge(g, w, base, height, bottom, body, rim, salt = 1, sharp = 0.5) {
  let prev = -1
  for (let x = 0; x < w; x++) {
    const n = noise1(x, 38, salt) * 0.6 + noise1(x, 13, salt + 7) * 0.3 * (1 + sharp) + noise1(x, 5, salt + 3) * 0.1 * sharp
    const top = Math.round(base - n * height)
    rect(g, body, x, top, 1, bottom - top)
    rect(g, rim, x, top, 1, 1)
    if (prev >= 0 && Math.abs(top - prev) > 1) rect(g, rim, x, Math.min(top, prev), 1, Math.abs(top - prev))
    prev = top
  }
}

/**
 * A headland: a ridge that rises from nothing at one end, for the edges of
 * a coast. `side` is the end where it is highest.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} base y where it meets the water
 * @param {number} height
 * @param {'left' | 'right'} side
 * @param {string} [body]
 * @param {string} [rim]
 * @param {number} [salt]
 */
export function paintHeadland(g, x0, w, base, height, side, body = DUSK.ridgeFar, rim = DUSK.ridgeFarRim, salt = 4) {
  let prev = -1
  for (let i = 0; i < w; i++) {
    const t = side === 'left' ? 1 - i / w : i / w
    const shape = Math.pow(t, 0.7) * (0.75 + noise1(i, 9, salt) * 0.25)
    const top = Math.round(base - shape * height)
    if (top >= base) { prev = -1; continue }
    const x = x0 + i
    rect(g, body, x, top, 1, base - top)
    rect(g, rim, x, top, 1, 1)
    if (prev >= 0 && Math.abs(top - prev) > 1) rect(g, rim, x, Math.min(top, prev), 1, Math.abs(top - prev))
    prev = top
  }
}

/**
 * The sea from the horizon `top` down to `bottom`: a cyan horizon line,
 * water deepening towards the viewer, the sun's broken reflection under
 * `sunX`, slow wave lines and glints. Animates with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 * @param {{ sunX?: number | null, sunW?: number, time?: number, salt?: number }} [opts]
 */
export function paintSea(g, x0, w, top, bottom, opts = {}) {
  const { sunX = null, sunW = 20, time = 0, salt = 9 } = opts
  const h = bottom - top
  if (h <= 0) return
  ditherGradient(g, x0, top, w, bottom, [DUSK.waterHaze, DUSK.water, DUSK.water, DUSK.waterD])
  rect(g, DUSK.horizon, x0, top, w, 1)
  // Wave lines drifting sideways, longer and slower near the viewer.
  for (let y = top + 2; y < bottom; y += 2) {
    const depth = (y - top) / h
    const len = 2 + Math.round(depth * 6)
    const step = 9 + Math.round((1 - depth) * 10)
    const drift = Math.floor(time * (2 + depth * 4) + hash2(y, 0, salt) * step)
    for (let x = -step; x < w + step; x += step) {
      const wx = x0 + x + ((drift + Math.floor(hash2(x, y, salt) * step)) % step)
      if (hash2(x, y, salt + 1) < 0.45) continue
      rect(g, DUSK.wave, wx, y, len, 1)
    }
  }
  if (sunX != null) paintReflection(g, top, bottom, sunX, sunW, time, salt)
  // Glints that come and go.
  const n = Math.floor((w * h) / 90)
  for (let i = 0; i < n; i++) {
    const tw = hash2(i, 7, salt)
    if (Math.sin(time * (1 + tw * 2) + i * 1.7) < 0.55) continue
    const x = x0 + Math.floor(hash2(i, 5, salt) * w)
    const y = top + 2 + Math.floor(hash2(i, 6, salt) * (h - 2))
    rect(g, DUSK.foam, x, y, tw > 0.7 ? 2 : 1, 1)
  }
}

/**
 * The sun's reflection on the sea: dashes on alternate rows below the
 * horizon, narrowing and turning from gold to pink as they come closer,
 * swaying with the swell. Draw it after the light map (`afterLight`) to
 * keep it at full brightness.
 * @param {CanvasRenderingContext2D} g
 * @param {number} top the horizon
 * @param {number} bottom
 * @param {number} sunX
 * @param {number} [sunW] width of the reflection at the horizon
 * @param {number} [time]
 * @param {number} [salt]
 */
export function paintReflection(g, top, bottom, sunX, sunW = 20, time = 0, salt = 9) {
  const h = bottom - top
  for (let y = top + 1; y < bottom; y += 2) {
    const depth = (y - top) / h
    const sway = Math.round(Math.sin(time * 1.3 + y * 0.7) * (1 + depth * 2))
    const half = Math.round((sunW / 2) * (1 - depth * 0.55) * (0.55 + hash2(y, Math.floor(time * 2), salt) * 0.45))
    if (half < 1) continue
    const col = depth < 0.2 ? DUSK.sun1 : depth < 0.45 ? DUSK.sun2 : depth < 0.75 ? DUSK.glint : DUSK.sun3
    rect(g, col, Math.round(sunX - half + sway), y, half * 2, 1)
  }
}

/**
 * The beach from `top` to `bottom`: sand in soft drifts, wet and dark
 * along the water, and a line of foam that washes in and out with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} top the waterline
 * @param {number} bottom
 * @param {number} [time]
 * @param {number} [salt]
 */
export function paintBeach(g, x0, w, top, bottom, time = 0, salt = 21) {
  rect(g, DUSK.sand, x0, top, w, bottom - top)
  for (let y = top + 3; y < bottom; y += 3) for (let x = x0; x < x0 + w; x += 4) {
    const n = hash2(Math.floor(x / 4), Math.floor(y / 3), salt)
    if (n > 0.72) rect(g, DUSK.sandL, x, y, 4, 2)
    else if (n < 0.2) rect(g, DUSK.sandD, x, y, 4, 2)
  }
  // Wet sand and the foam's reach.
  const swell = Math.sin(time * 0.9) * 0.5 + 0.5
  for (let x = x0; x < x0 + w; x++) {
    const n = noise1(x, 11, salt)
    const reach = Math.round(1 + n * 3 + swell * 2)
    rect(g, DUSK.sandW, x, top, 1, reach + 1)
    rect(g, DUSK.foam, x, top + reach, 1, 1)
    if (noise1(x + Math.floor(time * 3), 5, salt + 2) > 0.6) rect(g, '#ffffff', x, top + reach, 1, 1)
  }
}

/**
 * A palm in silhouette: a ringed trunk curving up to a crown of fronds that
 * arch out and droop, each with leaflets hanging under it. The side towards
 * `light` (-1 left, 1 right) catches a magenta rim. Fronds sway with `time`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x foot of the trunk
 * @param {number} baseY
 * @param {number} h height to the crown
 * @param {number} [lean] how far the crown leans, logical px (sign = direction)
 * @param {number} [light] -1 or 1
 * @param {number} [time]
 */
export function paintPalm(g, x, baseY, h, lean = 4, light = 1, time = 0) {
  const top = baseY - h
  let tx = x
  for (let y = baseY; y > top; y--) {
    const t = (baseY - y) / h
    tx = Math.round(x + lean * t * t)
    const w = t < 0.4 ? 3 : 2
    const left = tx - 1
    rect(g, (baseY - y) % 4 === 0 ? DUSK.palmL : DUSK.palm, left, y, w, 1)
    rect(g, DUSK.rim, light > 0 ? left + w - 1 : left, y, 1, 1)
  }
  const cx = tx
  const cy = top
  const sway = Math.sin(time * 0.8) * 1.5
  const len = Math.max(8, Math.round(h * 0.5))
  // [angle in degrees (0 = right, 90 = up), length factor, droop]
  const fronds = [[200, 0.85, 0.7], [165, 1, 0.55], [130, 0.8, 0.35], [95, 0.55, 0.2], [55, 0.8, 0.35], [18, 1, 0.55], [-15, 0.85, 0.7]]
  for (const [deg, k, droop] of fronds) {
    const a = (deg * Math.PI) / 180
    const L = Math.round(len * k)
    const lit = light > 0 ? Math.cos(a) > 0.2 : Math.cos(a) < -0.2
    for (let i = 1; i <= L; i++) {
      const t = i / L
      const fx = Math.round(cx + Math.cos(a) * i + sway * t * t * Math.sign(Math.cos(a) || 1))
      const fy = Math.round(cy - Math.sin(a) * i * 0.75 + droop * t * t * L)
      const thick = t < 0.55 ? 2 : 1
      rect(g, DUSK.palm, fx, fy, 1, thick)
      if (lit && t < 0.9) rect(g, DUSK.rim, fx, fy, 1, 1)
      // Leaflets hanging under the frond, shorter towards the tip.
      if (i % 2 === 0 && t > 0.2 && t < 0.97) rect(g, DUSK.palm, fx, fy + thick, 1, t < 0.75 ? 3 : 2)
    }
  }
  rect(g, DUSK.palm, cx - 2, cy - 1, 5, 3)
  rect(g, DUSK.palmL, cx - 1, cy + 1, 1, 1)
  rect(g, DUSK.palmL, cx + 1, cy + 1, 1, 1)
}

/**
 * A line of round canopies standing on `baseY`.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} baseY
 * @param {number} [size] canopy radius
 * @param {number} [salt]
 */
export function paintTreeLine(g, x0, w, baseY, size = 7, salt = 5) {
  const step = Math.max(4, Math.round(size * 1.3))
  const trees = []
  for (let x = x0 - size; x < x0 + w + size; x += step) {
    const r = Math.round(size * (0.75 + hash2(x, 0, salt) * 0.5))
    trees.push({ x: x + Math.floor(hash2(x, 1, salt) * step * 0.5), r, lift: Math.floor(hash2(x, 2, salt) * size * 0.8) })
  }
  for (const t of trees) {
    const cy = baseY - t.r - t.lift
    rect(g, DUSK.trunk, t.x - 1, cy, 3, baseY - cy)
    disc(g, DUSK.canopyD, t.x, cy, t.r)
  }
  for (const t of trees) {
    const cy = baseY - t.r - t.lift
    disc(g, DUSK.canopyM, t.x, cy - 1, t.r - 2)
    rect(g, DUSK.canopyL, t.x - Math.round(t.r * 0.6), cy - t.r + 1, Math.round(t.r * 0.9), 1)
    rect(g, DUSK.canopyH, t.x - Math.round(t.r * 0.45), cy - t.r, Math.round(t.r * 0.6), 1)
    rect(g, DUSK.rim, t.x + t.r - 1, cy - 1, 1, Math.max(2, Math.round(t.r * 0.5)))
    for (let i = 0; i < 2; i++) {
      const lx = t.x - t.r + 2 + Math.floor(hash2(t.x, 10 + i, salt) * (t.r * 2 - 5))
      const ly = cy - t.r + 3 + Math.floor(hash2(t.x, 20 + i, salt) * t.r)
      rect(g, DUSK.canopyL, lx, ly, 3, 1)
      rect(g, DUSK.canopyD, lx, ly + 1, 3, 1)
    }
  }
}

/**
 * A house in side view: a pitched shingle roof over a plank wall with lit
 * windows. Returns the window centres, for lights.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} baseY
 * @param {number} w
 * @param {number} h
 * @param {number} [salt]
 * @returns {{ x: number, y: number }[]}
 */
export function paintHouse(g, x, baseY, w, h, salt = 0) {
  const roofH = Math.max(4, Math.round(h * 0.45))
  const wallTop = baseY - (h - roofH)
  rect(g, DUSK.wall, x, wallTop, w, baseY - wallTop)
  for (let i = 2; i < w; i += 4) rect(g, DUSK.wallD, x + i, wallTop, 1, baseY - wallTop)
  rect(g, DUSK.wallD, x, wallTop, w, 2)
  rect(g, DUSK.wallD, x, wallTop, 1, baseY - wallTop)
  rect(g, DUSK.wallD, x + w - 1, wallTop, 1, baseY - wallTop)
  for (let y = 0; y < roofH; y++) {
    const inset = Math.round((roofH - y) * 0.9) - 1
    const rx = x - 2 + inset
    const rw = w + 4 - inset * 2
    const yy = wallTop - roofH + y
    rect(g, y % 3 === 2 ? DUSK.roofD : DUSK.roof, rx, yy, rw, 1)
    if (y % 3 === 0) for (let i = (y % 2) * 2; i < rw; i += 4) rect(g, DUSK.roofL, rx + i, yy, 2, 1)
    rect(g, DUSK.roofHi, rx, yy, 1, 1)
  }
  rect(g, DUSK.roofHi, x - 1 + Math.round(roofH * 0.9), wallTop - roofH, Math.max(1, w + 2 - Math.round(roofH * 1.8)), 1)
  const wins = []
  const wy = wallTop + 3
  const n = Math.max(1, Math.floor((w - 4) / 7))
  for (let i = 0; i < n; i++) {
    if (hash2(x, i, salt) < 0.3) continue
    const wx = x + 3 + i * 7
    if (wy + 5 > baseY - 1) break
    rect(g, '#1a0f2a', wx, wy, 5, 5)
    rect(g, DUSK.window, wx + 1, wy + 1, 3, 3)
    rect(g, DUSK.windowD, wx + 1, wy + 3, 3, 1)
    rect(g, DUSK.sun0, wx + 1, wy + 1, 1, 1)
    wins.push({ x: wx + 2.5, y: wy + 2.5 })
  }
  return wins
}

/**
 * Grass from `top` to `bottom`: soft patches, blades and a lit top edge.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x0
 * @param {number} w
 * @param {number} top
 * @param {number} bottom
 * @param {number} [salt]
 */
export function paintGrass(g, x0, w, top, bottom, salt = 3) {
  rect(g, DUSK.g0, x0, top, w, bottom - top)
  for (let y = top; y < bottom; y += 3) for (let x = x0; x < x0 + w; x += 4) {
    const n = hash2(Math.floor(x / 4), Math.floor(y / 3), salt)
    if (n > 0.78) rect(g, DUSK.g1, x, y, 4, 3)
    else if (n < 0.18) rect(g, DUSK.g2, x, y, 4, 3)
  }
  for (let x = x0; x < x0 + w; x += 3) {
    if (hash2(x, 5, salt) < 0.45) continue
    const y = top + 1 + Math.floor(hash2(x, 6, salt) * Math.max(1, bottom - top - 4))
    rect(g, DUSK.blade, x, y + 1, 1, 2)
    rect(g, DUSK.tip, x + 1, y, 1, 2)
    if (hash2(x, 7, salt) > 0.96) rect(g, '#ff8ae0', x + 2, y, 1, 1)
  }
  rect(g, DUSK.tip, x0, top, w, 1)
  rect(g, DUSK.g3, x0, top + 1, w, 1)
}

/**
 * A lamp post; returns the lamp's centre, for a light.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} baseY
 * @param {number} h
 * @param {string} color
 * @returns {{ x: number, y: number }}
 */
export function paintLamp(g, x, baseY, h, color) {
  rect(g, '#140a22', x - 1, baseY - 2, 3, 2)
  rect(g, '#140a22', x, baseY - h, 1, h)
  rect(g, '#3a2a5a', x, baseY - h, 1, h - 2)
  rect(g, '#140a22', x - 2, baseY - h - 3, 5, 3)
  rect(g, color, x - 1, baseY - h - 2, 3, 2)
  rect(g, '#ffffff', x, baseY - h - 2, 1, 1)
  return { x: x + 0.5, y: baseY - h - 1 }
}
