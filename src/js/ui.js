/**
 * The interface drawn on canvas, in logical pixels: the dialog box, the
 * area banner, cell meters and hearts — the same shapes the CSS draws for
 * HTML (.nc-box, .nc-banner, .nc-meter), for HUDs inside a pixel stage.
 */
import { COLORS, UI } from './tokens.js'
import { drawText, textWidth, wrapText, GLYPH_H } from './font.js'
import { sprite, SPRITES } from './sprites.js'


/**
 * The box: a one-pixel edge with notched corners round a dark fill, and the
 * faint cyan rule inside the top edge.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {{ edge?: string, fill?: string, rule?: boolean }} [opts]
 */
export function drawBox(g, x, y, w, h, opts = {}) {
  const { edge = COLORS.cyan, fill = UI.surface, rule = true } = opts
  g.fillStyle = fill
  g.fillRect(x, y, w, h)
  g.fillStyle = edge
  g.fillRect(x + 1, y, w - 2, 1)
  g.fillRect(x + 1, y + h - 1, w - 2, 1)
  g.fillRect(x, y + 1, 1, h - 2)
  g.fillRect(x + w - 1, y + 1, 1, h - 2)
  if (rule) {
    g.fillStyle = UI['box-rule']
    g.fillRect(x + 2, y + 2, w - 4, 1)
  }
}

/**
 * A dialog: wrapped text in a pink box. `chars` types it out (characters
 * shown so far); `more` blinks the ▼ that asks for the next line.
 * Returns the box height.
 * @param {CanvasRenderingContext2D} g
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {{ chars?: number, more?: boolean, time?: number, edge?: string }} [opts]
 * @returns {number}
 */
export function drawDialog(g, text, x, y, w, opts = {}) {
  const { chars = Infinity, more = false, time = 0, edge = COLORS.pink } = opts
  const lines = wrapText(text, w - 16)
  const h = lines.length * (GLYPH_H + 4) + 12
  drawBox(g, x, y, w, h, { edge })
  let left = Math.floor(chars)
  lines.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, left))
    left -= line.length + 1
    drawText(g, shown, x + 8, y + 7 + i * (GLYPH_H + 4), COLORS.white, COLORS.plum)
  })
  if (more && chars >= text.length && Math.floor(time * 3) % 2 === 0) {
    g.fillStyle = COLORS.cyan
    g.fillRect(x + w - 11, y + h - 7, 5, 1)
    g.fillRect(x + w - 10, y + h - 6, 3, 1)
    g.fillRect(x + w - 9, y + h - 5, 1, 1)
  }
  return h
}

/**
 * The area banner: white letters with a pink shadow between a cyan line
 * above and a pink line below, centred on `cx`.
 * @param {CanvasRenderingContext2D} g
 * @param {string} text
 * @param {number} cx
 * @param {number} y
 * @param {number} [alpha]
 */
export function drawBanner(g, text, cx, y, alpha = 1) {
  if (alpha <= 0) return
  const w = textWidth(text)
  const x = Math.round(cx - w / 2)
  g.globalAlpha = Math.min(1, alpha)
  g.fillStyle = 'rgba(11,6,22,0.6)'
  g.fillRect(x - 8, y - 5, w + 16, GLYPH_H + 10)
  drawText(g, text, x, y, COLORS.white, COLORS.pink)
  g.fillStyle = COLORS.cyan
  g.fillRect(x - 8, y - 5, w + 16, 1)
  g.fillStyle = COLORS.pink
  g.fillRect(x - 8, y + GLYPH_H + 4, w + 16, 1)
  g.globalAlpha = 1
}

/**
 * A meter that fills in whole cells. `value` is 0–1. Returns its width.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y
 * @param {number} value
 * @param {{ cells?: number, cell?: number, gap?: number, h?: number, color?: string, empty?: string }} [opts]
 * @returns {number}
 */
export function drawMeter(g, x, y, value, opts = {}) {
  const { cells = 12, cell = 3, gap = 1, h = 3, color = COLORS.pink, empty = COLORS.dusk } = opts
  const lit = Math.floor(Math.max(0, Math.min(1, value)) * cells + 1e-9)
  const w = cells * (cell + gap) - gap + 2
  g.fillStyle = COLORS.ink
  g.fillRect(x, y, w, h + 2)
  for (let i = 0; i < cells; i++) {
    g.fillStyle = i < lit ? color : empty
    g.fillRect(x + 1 + i * (cell + gap), y + 1, cell, h)
  }
  return w
}

/**
 * Hearts: `hp` in half hearts out of `maxHp`, up to `perRow` in a row,
 * 9 pixels apart. Returns the height drawn.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y
 * @param {number} hp
 * @param {number} maxHp
 * @param {number} [perRow]
 * @returns {number}
 */
export function drawHearts(g, x, y, hp, maxHp, perRow = 10) {
  const n = Math.ceil(maxHp / 2)
  for (let i = 0; i < n; i++) {
    const left = hp - i * 2
    const rows = left >= 2 ? SPRITES.heart : left === 1 ? SPRITES['heart-half'] : SPRITES['heart-empty']
    g.drawImage(sprite(rows), x + (i % perRow) * 9, y + Math.floor(i / perRow) * 9)
  }
  return Math.ceil(n / perRow) * 9 - 2
}
