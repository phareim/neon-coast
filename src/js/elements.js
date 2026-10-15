/**
 * Two custom elements, so the pixel look needs no code at all:
 *
 *   <nc-scene>   the neon coast at dusk as a live backdrop
 *   <nc-sprite>  pixel art written in the page, one letter per pixel
 *
 * Importing neon-coast defines both (`defineElements()` is safe to call
 * again). They render nothing on the server and need no framework.
 */
import { createPixelStage, makeCanvas } from './stage.js'
import { sprite, shade, SPRITES } from './sprites.js'
import {
  DUSK, paintSky, drawStars, paintSun, paintRidge, paintHeadland, paintSea, paintReflection, paintBeach,
  paintPalm, paintTreeLine, paintHouse, paintGrass, paintLamp, rect,
} from './scenery.js'

// Server-side rendering has no HTMLElement; the classes are only defined in a browser.
const Base = /** @type {typeof HTMLElement} */ (typeof HTMLElement === 'undefined' ? class {} : HTMLElement)

/** @param {HTMLCanvasElement} c */
const ctx2d = c => /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'))

/**
 * @typedef {object} Layout
 * @property {HTMLCanvasElement} back sky, painted once per size
 * @property {HTMLCanvasElement} front everything static in front of the stars
 * @property {HTMLCanvasElement | null} sun the visible sun, kept at full brightness
 * @property {(g: CanvasRenderingContext2D, t: number, stage: import('./stage.js').PixelStage) => void} live
 *   draws the moving parts and asks for lights
 * @property {(g: CanvasRenderingContext2D, t: number) => void} [glow] drawn after the light map, at full brightness
 * @property {number} horizon
 */

/** @type {Record<string, (w: number, h: number, o: { horizon: number, sunX: number | null }) => Layout>} */
const SCENES = {
  coast(w, h, o) {
    const horizon = Math.round(h * o.horizon)
    const beachTop = Math.round(h * 0.87)
    const r = Math.max(5, Math.round(Math.min(h * 0.2, w * 0.28)))
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX)
    const back = makeCanvas(w, h)
    paintSky(ctx2d(back), w, horizon + 1)
    const front = makeCanvas(w, h)
    const f = ctx2d(front)
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r)
    if (sun) f.drawImage(sun, 0, 0)
    paintHeadland(f, 0, Math.round(w * 0.34), horizon, Math.round(h * 0.15), 'left', DUSK.ridgeFar, DUSK.ridgeFarRim, 4)
    paintHeadland(f, Math.round(w * 0.72), Math.round(w * 0.28) + 1, horizon, Math.round(h * 0.1), 'right', DUSK.ridgeFar, DUSK.ridgeFarRim, 8)
    paintHeadland(f, 0, Math.round(w * 0.18), horizon, Math.round(h * 0.07), 'left', DUSK.ridge, DUSK.ridgeRim, 12)
    const palmH = Math.round(Math.min(h * 0.4, Math.max(28, w * 0.42)))
    return {
      back, front, sun, horizon,
      live(g, t, stage) {
        paintSea(g, 0, w, horizon, beachTop, { sunX: null, time: t })
        paintBeach(g, 0, w, beachTop, h, t)
        paintPalm(g, Math.round(w * 0.07), h - 1, palmH, 7, 1, t)
        paintPalm(g, Math.round(w * 0.95), h - 1, Math.round(palmH * 0.78), -6, -1, t + 1.7)
        stage.emit(0, horizon, w, 1)
        if (sunX != null) {
          stage.light(sunX, horizon - r * 0.4, r * 3.4, DUSK.sun3, 0.55)
          stage.light(sunX, horizon, r * 2, DUSK.sun1, 0.4)
        }
      },
      glow(g, t) {
        if (sunX != null) paintReflection(g, horizon, beachTop, sunX, r * 1.6, t)
      },
    }
  },

  town(w, h, o) {
    const horizon = Math.round(h * o.horizon)
    const ground = Math.round(h * 0.82)
    const r = Math.max(5, Math.round(Math.min(h * 0.16, w * 0.24)))
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX)
    const back = makeCanvas(w, h)
    paintSky(ctx2d(back), w, horizon + 1)
    const front = makeCanvas(w, h)
    const f = ctx2d(front)
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r)
    if (sun) f.drawImage(sun, 0, 0)
    paintRidge(f, w, horizon, Math.round(h * 0.18), ground, DUSK.ridgeFar, DUSK.ridgeFarRim, 2, 0.6)
    paintRidge(f, w, horizon + Math.round(h * 0.06), Math.round(h * 0.1), ground, DUSK.ridge, DUSK.ridgeRim, 5, 0.3)
    paintTreeLine(f, 0, w, ground, Math.max(5, Math.round(h * 0.045)), 5)
    /** @type {{ x: number, y: number, c: string, r: number }[]} */
    const glows = []
    const step = Math.max(34, Math.round(h * 0.3))
    for (let x = 6, i = 0; x < w - 20; x += step, i++) {
      const hw = 22 + (i % 3) * 6
      const hh = Math.round(h * 0.15) + (i % 2) * 4
      for (const win of paintHouse(f, x, ground, hw, hh, i)) glows.push({ ...win, c: DUSK.window, r: 9 })
      const lampX = x + hw + Math.round((step - hw) / 2)
      if (lampX < w - 4) {
        const c = i % 2 ? DUSK.neonC : DUSK.neon
        const lamp = paintLamp(f, lampX, ground + 1, Math.round(h * 0.09), c)
        glows.push({ ...lamp, c, r: 16 })
      }
    }
    paintGrass(f, 0, w, ground, h, 3)
    return {
      back, front, sun, horizon,
      live(g, t, stage) {
        for (const l of glows) stage.light(l.x, l.y, l.r, l.c, 0.75 + Math.sin(t * 2 + l.x) * 0.08)
        if (sunX != null) stage.light(sunX, horizon - r * 0.3, r * 3, DUSK.sun3, 0.45)
        void g
      },
    }
  },

  hills(w, h, o) {
    const horizon = Math.round(h * o.horizon)
    const ground = Math.round(h * 0.84)
    const r = Math.max(5, Math.round(Math.min(h * 0.2, w * 0.26)))
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX)
    const back = makeCanvas(w, h)
    paintSky(ctx2d(back), w, horizon + 1)
    const front = makeCanvas(w, h)
    const f = ctx2d(front)
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r)
    if (sun) f.drawImage(sun, 0, 0)
    paintRidge(f, w, horizon, Math.round(h * 0.22), h, DUSK.ridgeFar, DUSK.ridgeFarRim, 7, 0.8)
    paintRidge(f, w, horizon + Math.round(h * 0.08), Math.round(h * 0.12), h, DUSK.ridge, DUSK.ridgeRim, 3, 0.4)
    paintTreeLine(f, 0, w, ground, Math.max(5, Math.round(h * 0.05)), 9)
    paintGrass(f, 0, w, ground, h, 6)
    return {
      back, front, sun, horizon,
      live(g, t, stage) {
        if (sunX != null) stage.light(sunX, horizon - r * 0.3, r * 3.2, DUSK.sun3, 0.5)
        void g; void t
      },
    }
  },

  dusk(w, h, o) {
    const horizon = Math.round(h * o.horizon)
    const r = Math.max(5, Math.round(Math.min(h * 0.22, w * 0.3)))
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX)
    const back = makeCanvas(w, h)
    const b = ctx2d(back)
    paintSky(b, w, horizon + 1)
    rect(b, DUSK.ridge, 0, horizon + 1, w, h - horizon)
    const front = makeCanvas(w, h)
    const f = ctx2d(front)
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r)
    if (sun) f.drawImage(sun, 0, 0)
    paintRidge(f, w, horizon + 1, Math.round(h * 0.08), h, DUSK.ridge, DUSK.ridgeRim, 2, 0.2)
    return {
      back, front, sun, horizon,
      live(g, t, stage) {
        if (sunX != null) stage.light(sunX, horizon - r * 0.3, r * 3.2, DUSK.sun3, 0.5)
        void g; void t
      },
    }
  },
}

/**
 * The sun sitting on the horizon, clipped there, alone on a layer.
 * @param {number} w
 * @param {number} horizon
 * @param {number} cx
 * @param {number} r
 */
function sunLayer(w, horizon, cx, r) {
  const c = makeCanvas(w, horizon + 1)
  paintSun(ctx2d(c), cx, horizon - Math.round(r * 0.55), r)
  return c
}

// Unsized, the spacer makes the scene half as tall as it is wide
// (--nc-scene-ratio); a height from the page, or insets, simply win.
const SCENE_CSS = `
:host { display: block; position: relative; overflow: hidden; background: #0b0616; contain: layout paint; }
:host([fixed]) { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
:host([hidden]) { display: none; }
.ratio { padding-top: var(--nc-scene-ratio, 50%); }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; image-rendering: pixelated; }
`

/**
 * `<nc-scene>` — the neon coast at dusk, live.
 *
 * Attributes:
 *   scene    coast (default) | town | hills | dusk
 *   pixels   logical pixels from top to bottom (default 180): fewer = chunkier
 *   horizon  where the horizon sits, 0–1 of the height (default 0.6)
 *   sun      the sun's x, 0–1 of the width (default 0.5), or "none"
 *   still    draw one frame and stop (always the case with reduced motion)
 *   bare     no light map, bloom, scanlines or vignette: just the pixels
 *   fixed    fill the viewport behind the page (position: fixed; z-index: -1)
 *
 * Without a height of its own it is half as tall as it is wide
 * (--nc-scene-ratio: 50%). Give it a height, or insets, to size it.
 */
export class NcScene extends Base {
  static get observedAttributes() { return ['scene', 'pixels', 'horizon', 'sun', 'still', 'bare'] }

  constructor() {
    super()
    /** @type {HTMLCanvasElement | null} */ this._canvas = null
    /** @type {import('./stage.js').PixelStage | null} */ this._stage = null
    /** @type {Layout | null} */ this._layout = null
    /** @type {ResizeObserver | null} */ this._ro = null
    /** @type {IntersectionObserver | null} */ this._io = null
    /** @type {MediaQueryList | null} */ this._motion = null
    this._raf = 0
    this._last = 0
    this._visible = true
    this._t0 = typeof performance === 'undefined' ? 0 : performance.now()
    this._onChange = () => this._schedule()
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.innerHTML = `<style>${SCENE_CSS}</style><div class="ratio"></div><canvas part="canvas"></canvas>`
    }
    if (!this.hasAttribute('role')) this.setAttribute('aria-hidden', 'true')
    this._canvas = /** @type {HTMLCanvasElement} */ (this.shadowRoot?.querySelector('canvas'))
    this._stage = createPixelStage(this._canvas, { minW: 1, minH: this._pixels() })
    this._motion = matchMedia('(prefers-reduced-motion: reduce)')
    this._motion.addEventListener?.('change', this._onChange)
    this._ro = new ResizeObserver(() => { this._layout = null; this._schedule() })
    this._ro.observe(this)
    this._io = new IntersectionObserver(entries => {
      this._visible = entries.some(e => e.isIntersecting)
      this._schedule()
    })
    this._io.observe(this)
    document.addEventListener('visibilitychange', this._onChange)
  }

  disconnectedCallback() {
    this._ro?.disconnect()
    this._io?.disconnect()
    this._motion?.removeEventListener?.('change', this._onChange)
    document.removeEventListener('visibilitychange', this._onChange)
    cancelAnimationFrame(this._raf)
    this._raf = 0
    this._layout = null
  }

  attributeChangedCallback() {
    this._layout = null
    if (this._stage) this._schedule()
  }

  _pixels() {
    const n = Number(this.getAttribute('pixels'))
    return n >= 32 ? Math.round(n) : 180
  }

  _animated() {
    return !this.hasAttribute('still') && !this._motion?.matches
  }

  _schedule() {
    if (this._raf || !this._stage) return
    this._raf = requestAnimationFrame(now => this._frame(now))
  }

  /** @param {number} now */
  _frame(now) {
    this._raf = 0
    const stage = this._stage
    if (!stage || !this.isConnected) return
    if (!this._layout) {
      const box = this.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return
      stage.resize(box.width, box.height, devicePixelRatio, 1, this._pixels())
      const sunAttr = this.getAttribute('sun')
      const sunX = sunAttr === 'none' ? null : clamp01(Number(sunAttr ?? 0.5), 0.5)
      const horizon = Math.min(0.85, Math.max(0.3, clamp01(Number(this.getAttribute('horizon') ?? 0.6), 0.6)))
      const make = SCENES[this.getAttribute('scene') ?? 'coast'] ?? SCENES.coast
      this._layout = make(stage.vw, stage.vh, { horizon, sunX })
      this._last = 0
    }
    const animated = this._animated()
    // Twelve frames a second is plenty for twinkling stars and a swell,
    // and keeps a backdrop cheap.
    if (animated && this._last && now - this._last < 80) {
      if (this._visible && !document.hidden) this._schedule()
      return
    }
    this._last = now
    const t = animated ? (now - this._t0) / 1000 : 2.5
    const L = this._layout
    const g = stage.begin()
    g.drawImage(L.back, 0, 0)
    drawStars(g, stage.vw, Math.max(4, L.horizon - 6), t, 1, 11)
    g.drawImage(L.front, 0, 0)
    L.live(g, t, stage)
    if (L.sun) stage.emitImage(L.sun)
    const bare = this.hasAttribute('bare')
    const glow = L.glow
    stage.present({
      ambient: bare ? null : '#b0a4dc',
      bloom: bare ? 0 : 1,
      overlay: !bare,
      afterLight: glow ? gg => glow(gg, t) : undefined,
    })
    if (animated && this._visible && !document.hidden) this._schedule()
  }
}

/** @param {number} v @param {number} d */
function clamp01(v, d) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d
}

const SPRITE_CSS = `
:host { display: inline-block; line-height: 0; vertical-align: middle; }
:host([hidden]) { display: none; }
canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
`

/**
 * `<nc-sprite>` — pixel art in the page. Write the rows as the element's
 * text, one letter per pixel from the palette ('.' is see-through), or pick
 * a ready-made one with `name`.
 *
 *   <nc-sprite scale="6">
 *     .kk.kk.
 *     kpppppk
 *     .kpppk.
 *     ..kpk..
 *     ...k...
 *   </nc-sprite>
 *
 * Attributes:
 *   name    a built-in sprite (heart, heart-half, heart-empty, gem, key, bomb, coin, star, home, cursor, sun)
 *   scale   CSS pixels per sprite pixel (default 4)
 *   colors  palette overrides, e.g. "p:#ffd23f c:#ff2fa0"
 *   shade   "body hi lo": outline and shade an 'X' map (e.g. "c w C")
 *   flip    mirror horizontally
 *   label   accessible name; without it the sprite is decorative
 */
export class NcSprite extends Base {
  static get observedAttributes() { return ['name', 'scale', 'colors', 'shade', 'flip', 'label'] }

  constructor() {
    super()
    /** @type {MutationObserver | null} */ this._mo = null
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.innerHTML = `<style>${SPRITE_CSS}</style><canvas part="canvas"></canvas>`
    }
    this._mo = new MutationObserver(() => this.render())
    this._mo.observe(this, { childList: true, characterData: true, subtree: true })
    this.render()
  }

  disconnectedCallback() {
    this._mo?.disconnect()
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render()
  }

  /** The rows this element draws. */
  get rows() {
    const name = this.getAttribute('name')
    /** @type {string[]} */
    let rows = name && SPRITES[name] ? SPRITES[name] : parseRows(this.textContent ?? '')
    const sh = (this.getAttribute('shade') ?? '').trim().split(/\s+/)
    if (sh.length >= 3 && rows.length) rows = shade(rows, sh[0], sh[1], sh[2], sh[3] ?? 'k')
    return rows
  }

  render() {
    const canvas = /** @type {HTMLCanvasElement | null} */ (this.shadowRoot?.querySelector('canvas') ?? null)
    if (!canvas) return
    const rows = this.rows
    const label = this.getAttribute('label')
    if (label) {
      this.setAttribute('role', 'img')
      this.setAttribute('aria-label', label)
    } else if (!this.hasAttribute('role')) this.setAttribute('aria-hidden', 'true')
    if (!rows.length) { canvas.width = 0; canvas.height = 0; return }
    const w = rows[0].length
    const h = rows.length
    const scale = Math.max(1, Number(this.getAttribute('scale')) || 4)
    canvas.width = w
    canvas.height = h
    canvas.style.width = `${w * scale}px`
    canvas.style.height = `${h * scale}px`
    const g = ctx2d(canvas)
    g.clearRect(0, 0, w, h)
    g.drawImage(sprite(rows, parseColors(this.getAttribute('colors')), this.hasAttribute('flip')), 0, 0)
  }
}

/**
 * Rows from text: one row per non-empty line, whitespace trimmed, short
 * rows padded with '.'.
 * @param {string} text
 * @returns {string[]}
 */
export function parseRows(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const w = Math.max(0, ...lines.map(l => l.length))
  return lines.map(l => l.padEnd(w, '.'))
}

/**
 * "p:#ffd23f c:#ff2fa0" → { p: '#ffd23f', c: '#ff2fa0' }
 * @param {string | null} s
 * @returns {Record<string, string> | undefined}
 */
function parseColors(s) {
  if (!s) return undefined
  /** @type {Record<string, string>} */
  const out = {}
  for (const part of s.trim().split(/[\s,;]+/)) {
    const [k, v] = part.split(/[:=]/)
    if (k && v && k.length === 1) out[k] = v
  }
  return out
}

/** Register `<nc-scene>` and `<nc-sprite>` (once; does nothing on a server). */
export function defineElements() {
  if (typeof customElements === 'undefined') return
  if (!customElements.get('nc-scene')) customElements.define('nc-scene', NcScene)
  if (!customElements.get('nc-sprite')) customElements.define('nc-sprite', NcSprite)
}
