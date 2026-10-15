/**
 * The pixel stage: the Neon Coast look for any canvas.
 *
 * Draw the world into `g`, a small logical-resolution buffer (one logical
 * pixel = one sprite pixel), and ask for lights with `light()`. `present()`
 * then multiplies the scene by a light map (an ambient colour plus additive
 * glow pools, so lamps, shots and windows light what is round them), scales
 * it by a whole number onto the screen, adds a soft bloom of the same
 * lights, faint scanlines and a vignette, and lays the HUD layer (`hud`,
 * also logical pixels, not lit) on top. Whatever `afterLight` draws stays at
 * full brightness, the way neon does.
 *
 * The scale is the largest whole number that still shows at least
 * `minW`×`minH` logical pixels, so a phone and a monitor both get chunky,
 * crisp pixels. Keep your game in CSS pixels if you like: `k` is CSS px per
 * logical pixel and `px()` converts and rounds.
 *
 * `resize(…, rotate = true)` draws the scene turned a quarter (world +x up
 * the screen) for side-scrollers on portrait phones; the HUD stays upright.
 */

/**
 * @typedef {object} Light
 * @property {number} x logical px
 * @property {number} y logical px
 * @property {number} r radius in logical px
 * @property {string} color #rrggbb
 * @property {number} a strength 0–1
 */

/**
 * @typedef {object} PresentOptions
 * @property {string | null} [ambient] light-map base colour; null (default) leaves the scene unlit
 * @property {{ color: string, a: number } | null} [flash] whole-screen flash after the light (alpha 0–1)
 * @property {number} [fade] fade to the stage background, 0–1
 * @property {number} [shakeX] shake in logical px
 * @property {number} [shakeY]
 * @property {number} [bloom] bloom strength; 0 turns it off (default 1)
 * @property {boolean} [overlay] scanlines and vignette (default true)
 * @property {(g: CanvasRenderingContext2D) => void} [afterLight] drawn after the light map, at full brightness
 */

/**
 * @typedef {object} StageOptions
 * @property {number} [minW] smallest logical width to show (default 240)
 * @property {number} [minH] smallest logical height to show (default 180)
 * @property {string} [bg] screen colour round the scene and the fade colour (default ink)
 * @property {number} [maxRatio] device-pixel-ratio ceiling (default 3)
 */

/**
 * @typedef {object} PixelStage
 * @property {(cssW: number, cssH: number, dpr?: number, minW?: number, minH?: number, rotate?: boolean) => void} resize
 *   size the stage to the canvas's CSS size; call on every layout change
 * @property {() => CanvasRenderingContext2D} begin start a frame: clears lights and the HUD layer, returns `g`
 * @property {(x: number, y: number, r: number, color: string, a?: number) => void} light add a glow pool (logical px)
 * @property {(x: number, y: number, w: number, h: number) => void} emit a rectangle that keeps full brightness through the light map
 * @property {(img: HTMLCanvasElement, x?: number, y?: number) => void} emitImage every opaque pixel of a static image keeps full brightness
 * @property {(opts?: PresentOptions) => void} present composite the frame onto the canvas
 * @property {(v: number) => number} px CSS px → logical px, rounded
 * @property {CanvasRenderingContext2D} g the scene, logical px
 * @property {CanvasRenderingContext2D} hud the HUD layer, logical px, unlit, always upright
 * @property {Light[]} lights this frame's lights
 * @property {number} vw logical scene width
 * @property {number} vh logical scene height
 * @property {number} hw logical HUD width
 * @property {number} hh logical HUD height
 * @property {boolean} rotated
 * @property {number} scale device px per logical px (whole number)
 * @property {number} k CSS px per logical px
 * @property {number} cssW
 * @property {number} cssH
 */

/**
 * A canvas of at least 1×1 (works without a DOM canvas in workers).
 * @param {number} w
 * @param {number} h
 * @returns {HTMLCanvasElement}
 */
export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w))
  c.height = Math.max(1, Math.ceil(h))
  return c
}

/**
 * The device pixel ratio worth rendering at: the device's own, rounded to a
 * whole number and capped, one step lower on devices short of cores or
 * memory (the stage composites the whole surface several times a frame).
 * @param {number} [max]
 * @returns {number}
 */
export function pixelRatio(max = 3) {
  if (typeof window === 'undefined') return 1
  const ceiling = Math.max(1, Math.min(max, Math.round(window.devicePixelRatio || 1)))
  const nav = /** @type {Navigator & { deviceMemory?: number }} */ (navigator)
  const cores = nav.hardwareConcurrency ?? 8
  const touch = 'ontouchstart' in window || nav.maxTouchPoints > 0
  const low = cores <= 4 || (touch && (nav.deviceMemory ?? 8) <= 4)
  return low ? Math.max(1, ceiling - 1) : ceiling
}

/** @type {Map<string, HTMLCanvasElement>} */
const glowCache = new Map()

/**
 * A soft radial glow (64×64) in one #rrggbb colour, cached.
 * @param {string} color
 * @returns {HTMLCanvasElement}
 */
export function glowSprite(color) {
  let c = glowCache.get(color)
  if (c) return c
  c = makeCanvas(64, 64)
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'))
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, color)
  grad.addColorStop(0.35, color + 'aa')
  grad.addColorStop(1, color + '00')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  glowCache.set(color, c)
  return c
}

/** @param {HTMLCanvasElement} c */
const ctx2d = c => /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'))

/**
 * Create a pixel stage on a canvas. Call `resize()` before the first frame.
 * @param {HTMLCanvasElement} canvas
 * @param {StageOptions} [opts]
 * @returns {PixelStage}
 */
export function createPixelStage(canvas, opts = {}) {
  const defW = opts.minW ?? 240
  const defH = opts.minH ?? 180
  const bgColor = opts.bg ?? '#0b0616'
  const maxRatio = opts.maxRatio ?? 3
  const screen = ctx2d(canvas)
  let scene = makeCanvas(1, 1)
  let sg = ctx2d(scene)
  let lightC = makeCanvas(1, 1)
  let lg = ctx2d(lightC)
  let hudC = makeCanvas(1, 1)
  let hg = ctx2d(hudC)
  let bloomC = makeCanvas(1, 1)
  let bg = ctx2d(bloomC)
  /** @type {HTMLCanvasElement | null} */
  let overlayC = null
  /** @type {HTMLCanvasElement | null} */
  let scanTile = null
  let W = 1
  let H = 1
  let scale = 1
  let vw = 1
  let vh = 1
  let hw = 1
  let hh = 1
  let rot = false
  let dpr = 1
  let cssW = 1
  let cssH = 1
  // Lights are pooled: light() reuses objects across frames.
  /** @type {Light[]} */
  const lights = []
  /** @type {Light[]} */
  const pool = []
  /** @type {number[]} */
  const emits = []
  /** @type {{ img: HTMLCanvasElement, x: number, y: number }[]} */
  const emitImgs = []
  /** @type {WeakMap<HTMLCanvasElement, HTMLCanvasElement>} */
  const masks = new WeakMap()

  /** @param {HTMLCanvasElement} img */
  function maskOf(img) {
    let m = masks.get(img)
    if (!m) {
      m = makeCanvas(img.width, img.height)
      const mg = ctx2d(m)
      mg.drawImage(img, 0, 0)
      mg.globalCompositeOperation = 'source-in'
      mg.fillStyle = '#ffffff'
      mg.fillRect(0, 0, m.width, m.height)
      masks.set(img, m)
    }
    return m
  }

  /** @type {PixelStage['resize']} */
  function resize(w, h, ratio = globalThis.devicePixelRatio || 1, minW = defW, minH = defH, rotate = false) {
    // The ratio is a ceiling: the device's own ratio keeps device pixels 1:1
    // (crisp), and pixelRatio() steps it down on weak devices.
    dpr = Math.max(1, Math.min(pixelRatio(maxRatio), ratio || 1))
    cssW = Math.max(1, w)
    cssH = Math.max(1, h)
    W = Math.max(1, Math.round(cssW * dpr))
    H = Math.max(1, Math.round(cssH * dpr))
    canvas.width = W
    canvas.height = H
    rot = rotate
    const fw = rot ? H : W
    const fh = rot ? W : H
    scale = Math.max(1, Math.floor(Math.min(fw / minW, fh / minH)))
    vw = Math.ceil(fw / scale)
    vh = Math.ceil(fh / scale)
    hw = Math.ceil(W / scale)
    hh = Math.ceil(H / scale)
    scene = makeCanvas(vw, vh)
    sg = ctx2d(scene)
    lightC = makeCanvas(vw, vh)
    lg = ctx2d(lightC)
    hudC = makeCanvas(hw, hh)
    hg = ctx2d(hudC)
    bloomC = makeCanvas(vw, vh)
    bg = ctx2d(bloomC)
    for (const c of [sg, lg, hg, screen]) c.imageSmoothingEnabled = false
    const p = makeCanvas(1, Math.max(2, scale))
    const pg = ctx2d(p)
    pg.fillStyle = 'rgba(0,0,0,0.13)'
    pg.fillRect(0, 0, 1, Math.max(1, Math.floor(scale / 3)))
    scanTile = p
    overlayC = null
  }

  // Scanlines and vignette are static: built once per size, one blit a frame.
  function overlay() {
    if (!overlayC) {
      overlayC = makeCanvas(W, H)
      const g = ctx2d(overlayC)
      const scan = scanTile && scale >= 3 ? g.createPattern(scanTile, 'repeat') : null
      if (scan) {
        g.fillStyle = scan
        g.fillRect(0, 0, W, H)
      }
      const grad = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
      grad.addColorStop(0, 'rgba(5,3,12,0)')
      grad.addColorStop(1, 'rgba(5,3,12,0.45)')
      g.fillStyle = grad
      g.fillRect(0, 0, W, H)
    }
    screen.drawImage(overlayC, 0, 0)
  }

  function begin() {
    lights.length = 0
    emits.length = 0
    emitImgs.length = 0
    sg.setTransform(1, 0, 0, 1, 0, 0)
    sg.globalAlpha = 1
    sg.globalCompositeOperation = 'source-over'
    hg.setTransform(1, 0, 0, 1, 0, 0)
    hg.clearRect(0, 0, hw, hh)
    return sg
  }

  /** @type {PixelStage['light']} */
  function light(x, y, r, color, a = 1) {
    let L = pool[lights.length]
    if (!L) { L = { x, y, r, color, a }; pool.push(L) } else { L.x = x; L.y = y; L.r = r; L.color = color; L.a = a }
    lights.push(L)
  }

  /** @type {PixelStage['emit']} */
  function emit(x, y, w, h) {
    emits.push(x, y, w, h)
  }

  /** @type {PixelStage['emitImage']} */
  function emitImage(img, x = 0, y = 0) {
    emitImgs.push({ img, x, y })
  }

  /** @type {PixelStage['present']} */
  function present(o = {}) {
    const g = sg
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.globalAlpha = 1
    // --- light map ---
    if (o.ambient) {
      lg.globalCompositeOperation = 'source-over'
      lg.globalAlpha = 1
      lg.fillStyle = o.ambient
      lg.fillRect(0, 0, vw, vh)
      lg.globalCompositeOperation = 'lighter'
      for (const L of lights) {
        if (L.x < -L.r || L.y < -L.r || L.x > vw + L.r || L.y > vh + L.r) continue
        lg.globalAlpha = Math.max(0, Math.min(1, L.a))
        lg.drawImage(glowSprite(L.color), L.x - L.r, L.y - L.r, L.r * 2, L.r * 2)
      }
      lg.globalAlpha = 1
      lg.globalCompositeOperation = 'source-over'
      lg.fillStyle = '#ffffff'
      for (let i = 0; i < emits.length; i += 4) lg.fillRect(emits[i], emits[i + 1], emits[i + 2], emits[i + 3])
      for (const e of emitImgs) lg.drawImage(maskOf(e.img), e.x, e.y)
      g.globalCompositeOperation = 'multiply'
      g.drawImage(lightC, 0, 0)
      g.globalCompositeOperation = 'source-over'
    }
    o.afterLight?.(g)
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    if (o.flash && o.flash.a > 0.004) {
      g.globalAlpha = Math.min(1, o.flash.a)
      g.fillStyle = o.flash.color
      g.fillRect(0, 0, vw, vh)
      g.globalAlpha = 1
    }
    const fade = Math.max(0, Math.min(1, o.fade ?? 0))
    if (fade > 0) {
      g.globalAlpha = fade
      g.fillStyle = bgColor
      g.fillRect(0, 0, vw, vh)
      g.globalAlpha = 1
    }
    // --- to the screen ---
    screen.setTransform(1, 0, 0, 1, 0, 0)
    screen.globalCompositeOperation = 'source-over'
    screen.globalAlpha = 1
    screen.fillStyle = bgColor
    screen.fillRect(0, 0, W, H)
    const sw = rot ? vh : vw
    const sh = rot ? vw : vh
    const ox = Math.floor((W - sw * scale) / 2) + Math.round(o.shakeX ?? 0) * scale
    const oy = Math.floor((H - sh * scale) / 2) + Math.round(o.shakeY ?? 0) * scale
    // Rotated: world (x, y) lands at screen (y, bottom - x).
    const place = () => { if (rot) screen.setTransform(0, -scale, scale, 0, ox, oy + vw * scale) }
    const unplace = () => { if (rot) screen.setTransform(1, 0, 0, 1, 0, 0) }
    screen.imageSmoothingEnabled = false
    place()
    if (rot) screen.drawImage(scene, 0, 0)
    else screen.drawImage(scene, 0, 0, vw, vh, ox, oy, vw * scale, vh * scale)
    unplace()
    const bloomK = o.bloom ?? 1
    if (bloomK > 0 && fade < 1 && lights.length) {
      bg.globalCompositeOperation = 'source-over'
      bg.clearRect(0, 0, vw, vh)
      bg.globalCompositeOperation = 'lighter'
      for (const L of lights) {
        if (L.a < 0.3) continue
        const rad = L.r * 0.9
        if (L.x < -rad || L.y < -rad || L.x > vw + rad || L.y > vh + rad) continue
        bg.globalAlpha = Math.min(1, L.a) * 0.32 * bloomK
        bg.drawImage(glowSprite(L.color), L.x - rad, L.y - rad, rad * 2, rad * 2)
      }
      bg.globalAlpha = 1
      screen.globalCompositeOperation = 'lighter'
      screen.globalAlpha = 1 - fade
      screen.imageSmoothingEnabled = true
      place()
      if (rot) screen.drawImage(bloomC, 0, 0)
      else screen.drawImage(bloomC, 0, 0, vw, vh, ox, oy, vw * scale, vh * scale)
      unplace()
      screen.imageSmoothingEnabled = false
      screen.globalAlpha = 1
      screen.globalCompositeOperation = 'source-over'
    }
    if (o.overlay !== false) overlay()
    const hx = Math.floor((W - hw * scale) / 2)
    const hy = Math.floor((H - hh * scale) / 2)
    screen.drawImage(hudC, 0, 0, hw, hh, hx, hy, hw * scale, hh * scale)
  }

  return {
    resize,
    begin,
    light,
    emit,
    emitImage,
    present,
    px: v => Math.round((v * dpr) / scale),
    get g() { return sg },
    get hud() { return hg },
    lights,
    get vw() { return vw },
    get vh() { return vh },
    get hw() { return hw },
    get hh() { return hh },
    get rotated() { return rot },
    get scale() { return scale },
    get k() { return scale / dpr },
    get cssW() { return cssW },
    get cssH() { return cssH },
  }
}
