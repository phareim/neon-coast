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
export function drawBox(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, opts?: {
    edge?: string;
    fill?: string;
    rule?: boolean;
}): void;
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
export function drawDialog(g: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, opts?: {
    chars?: number;
    more?: boolean;
    time?: number;
    edge?: string;
}): number;
/**
 * The area banner: white letters with a pink shadow between a cyan line
 * above and a pink line below, centred on `cx`.
 * @param {CanvasRenderingContext2D} g
 * @param {string} text
 * @param {number} cx
 * @param {number} y
 * @param {number} [alpha]
 */
export function drawBanner(g: CanvasRenderingContext2D, text: string, cx: number, y: number, alpha?: number): void;
/**
 * A meter that fills in whole cells. `value` is 0–1. Returns its width.
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y
 * @param {number} value
 * @param {{ cells?: number, cell?: number, gap?: number, h?: number, color?: string, empty?: string }} [opts]
 * @returns {number}
 */
export function drawMeter(g: CanvasRenderingContext2D, x: number, y: number, value: number, opts?: {
    cells?: number;
    cell?: number;
    gap?: number;
    h?: number;
    color?: string;
    empty?: string;
}): number;
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
export function drawHearts(g: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, perRow?: number): number;
