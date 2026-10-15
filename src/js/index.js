/**
 * Neon Coast — the pixel look of phareim.no as a design system.
 *
 * The CSS (neon-coast.css) styles HTML on its own. This module is the
 * canvas side: the palette, the 5×7 font, string-map sprites, the pixel
 * stage with its light map, scenery painters and canvas HUD shapes. It also
 * registers <nc-scene> and <nc-sprite> as soon as it is imported.
 */
import { defineElements } from './elements.js'

export * from './tokens.js'
export * from './font.js'
export * from './sprites.js'
export * from './stage.js'
export * from './scenery.js'
export * from './ui.js'
export * from './elements.js'

defineElements()
