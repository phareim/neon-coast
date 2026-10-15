// Neon Coast — window.NeonCoast (components/bundle.js). The CSS components are classes,
// documented in each component's README; this is the script side: the canvas kit and the
// two custom elements, which bundle.js registers as it loads.
type G = CanvasRenderingContext2D
type Rows = readonly string[]

export interface Light { x: number; y: number; r: number; color: string; a: number }
export interface PresentOptions {
  /** Light-map base colour, e.g. '#b0a4dc'; null leaves the scene unlit. */
  ambient?: string | null
  flash?: { color: string; a: number } | null
  /** Fade to the stage background, 0–1. */
  fade?: number
  shakeX?: number
  shakeY?: number
  /** Bloom strength; 0 turns it off. Default 1. */
  bloom?: number
  /** Scanlines and vignette. Default true. */
  overlay?: boolean
  /** Drawn after the light map, at full brightness (neon, shots, sparks). */
  afterLight?: (g: G) => void
}
export interface PixelStage {
  /** Size to the canvas's CSS size; call on every layout change. */
  resize(cssW: number, cssH: number, dpr?: number, minW?: number, minH?: number, rotate?: boolean): void
  /** Start a frame: clears the lights and the HUD layer, returns the scene context. */
  begin(): G
  light(x: number, y: number, r: number, color: string, a?: number): void
  emit(x: number, y: number, w: number, h: number): void
  emitImage(img: HTMLCanvasElement, x?: number, y?: number): void
  present(opts?: PresentOptions): void
  /** CSS px → logical px. */
  px(v: number): number
  readonly g: G
  /** HUD layer: logical pixels, never lit, always upright. */
  readonly hud: G
  readonly lights: Light[]
  readonly vw: number
  readonly vh: number
  readonly hw: number
  readonly hh: number
  readonly scale: number
  readonly k: number
}

export interface NeonCoastAPI {
  // tokens
  PAL: Record<string, string>
  COLORS: Record<string, string>
  SKY: string[]
  SUN: string[]
  UI: Record<string, string>
  ROLES: Record<string, string>
  // stage
  createPixelStage(canvas: HTMLCanvasElement, opts?: { minW?: number; minH?: number; bg?: string; maxRatio?: number }): PixelStage
  makeCanvas(w: number, h: number): HTMLCanvasElement
  glowSprite(color: string): HTMLCanvasElement
  pixelRatio(max?: number): number
  // sprites
  sprite(rows: Rows, pal?: Record<string, string>, flip?: boolean): HTMLCanvasElement
  silhouette(rows: Rows, color: string): HTMLCanvasElement
  put(g: G, c: CanvasImageSource, x: number, y: number): void
  putC(g: G, c: CanvasImageSource, x: number, y: number): void
  shade(rows: Rows, body: string, hi: string, lo: string, outline?: string): string[]
  relight(rows: Rows, remap?: Record<string, string>): string[]
  pixelize(paint: (g: G) => void, w: number, h: number, keys?: string[], outline?: boolean): string[]
  bayer(x: number, y: number): number
  mix(a: string, b: string, t: number): string
  SPRITES: Record<'heart' | 'heart-half' | 'heart-empty' | 'gem' | 'key' | 'bomb' | 'coin' | 'star' | 'home' | 'cursor' | 'sun', string[]>
  // font (5×7, capitals)
  GLYPH_H: 7
  GLYPHS: Record<string, string[]>
  drawText(g: G, text: string, x: number, y: number, color: string, shadow?: string): void
  drawBigText(g: G, text: string, x: number, y: number, n: number, color: string, shadow?: string): void
  textWidth(text: string): number
  bigTextWidth(text: string, n: number): number
  wrapText(text: string, maxWidth: number): string[]
  // scenery (logical pixels; `time` in seconds animates)
  DUSK: Record<string, string>
  paintSky(g: G, w: number, horizon: number, warm?: boolean): void
  drawStars(g: G, w: number, maxY: number, time: number, density?: number, salt?: number): void
  paintSun(g: G, cx: number, cy: number, r: number, bandColor?: string): void
  paintRidge(g: G, w: number, base: number, height: number, bottom: number, body: string, rim: string, salt?: number, sharp?: number): void
  paintHeadland(g: G, x0: number, w: number, base: number, height: number, side: 'left' | 'right', body?: string, rim?: string, salt?: number): void
  paintSea(g: G, x0: number, w: number, top: number, bottom: number, opts?: { sunX?: number | null; sunW?: number; time?: number; salt?: number }): void
  paintReflection(g: G, top: number, bottom: number, sunX: number, sunW?: number, time?: number, salt?: number): void
  paintBeach(g: G, x0: number, w: number, top: number, bottom: number, time?: number, salt?: number): void
  paintPalm(g: G, x: number, baseY: number, h: number, lean?: number, light?: number, time?: number): void
  paintTreeLine(g: G, x0: number, w: number, baseY: number, size?: number, salt?: number): void
  paintHouse(g: G, x: number, baseY: number, w: number, h: number, salt?: number): { x: number; y: number }[]
  paintGrass(g: G, x0: number, w: number, top: number, bottom: number, salt?: number): void
  paintLamp(g: G, x: number, baseY: number, h: number, color: string): { x: number; y: number }
  ditherGradient(g: G, x: number, y0: number, w: number, y1: number, stops: string[]): void
  // HUD shapes
  drawBox(g: G, x: number, y: number, w: number, h: number, opts?: { edge?: string; fill?: string; rule?: boolean }): void
  drawDialog(g: G, text: string, x: number, y: number, w: number, opts?: { chars?: number; more?: boolean; time?: number; edge?: string }): number
  drawBanner(g: G, text: string, cx: number, y: number, alpha?: number): void
  drawMeter(g: G, x: number, y: number, value: number, opts?: { cells?: number; cell?: number; gap?: number; h?: number; color?: string; empty?: string }): number
  drawHearts(g: G, x: number, y: number, hp: number, maxHp: number, perRow?: number): number
  // elements
  defineElements(): void
}

/** Attributes of <nc-scene>. */
export interface NcSceneAttributes {
  scene?: 'coast' | 'town' | 'hills' | 'dusk'
  /** Logical pixels from top to bottom (180). */
  pixels?: number
  /** 0–1 of the height (0.6). */
  horizon?: number
  /** 0–1 of the width (0.5), or 'none'. */
  sun?: number | 'none'
  still?: boolean
  bare?: boolean
  fixed?: boolean
}

/** Attributes of <nc-sprite>; the rows are its text. */
export interface NcSpriteAttributes {
  name?: keyof NeonCoastAPI['SPRITES']
  /** CSS px per sprite pixel (4). */
  scale?: number
  /** Palette overrides, "p:#2ff3ff m:#fff4ff". */
  colors?: string
  /** "body hi lo": outline and shade an X map. */
  shade?: string
  flip?: boolean
  label?: string
}

declare global {
  interface Window { NeonCoast: NeonCoastAPI }
}
