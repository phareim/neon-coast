# Stage

The canvas kit, `window.NeonCoast`: a pixel stage with a light map, string-map sprites, the 5×7 font, scenery painters and HUD shapes, for games and anything drawn on a canvas.

`createPixelStage(canvas, { minW, minH })` draws into a small logical buffer (one pixel = one sprite pixel) and scales it by the largest whole number that still shows `minW`×`minH`. Each frame: `g = stage.begin()`, draw in logical pixels (`paintSky`, `paintSun`, `paintSea`, `drawStars`, `sprite(rows)`…), add glow pools with `stage.light(x, y, r, colour, a)`, draw the HUD on `stage.hud` (`drawText`, `drawHearts`, `drawMeter`, `drawBanner`, `drawBox`, `drawDialog`), then `stage.present({ ambient: '#b0a4dc' })` for the light map, bloom, scanlines and vignette. What `afterLight` draws, or `emit`/`emitImage` marks, stays at full brightness. Types: `components/index.d.ts`.

The consumer provides the canvas, its CSS size, `resize()` on layout changes and the frame loop.
