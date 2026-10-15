Neon Coast is the pixel look of phareim.no: a night town on the neon coast with the sun stuck on the horizon. Everything is drawn on a pixel grid — 5×7 capitals, one-unit edges with open corners, colours that each have a job — and it is always night.

## Content fundamentals

- **Interface text is short, capitalised and imperative**, the way an arcade cabinet talks: `▶ PRESS START`, `HOLD ESC TO QUIT`, `BACK TO TOWN`, `NO SCORES YET · BE THE FIRST`. The pixel font only has capitals, so write interface copy in sentence case in the source and let the font set it.
- **People in the world speak in plain, short sentences**: `THE PATH ENDS HERE.` `FOLLOW THE ROAD EAST, PAST THE BEACH.` No exclamation marks unless something really happened.
- **Prose is calm and concrete**, in the body face: name the place, the thing, the number. British spelling (colour, centre).
- **Glyphs, never emoji.** Arrows, hearts, notes and markers are letters in the pixel font: `▶ ◀ ▲ ▼ ← → ↑ ↓ ♥ ★ ♪ ● ○ ■ ◆ ◈ ✓ × ☰ ⌂ ↻ …`. Use `·` to separate items on one line.
- **Address the player as you.** `RANK 5 OF 120 · BEST 39 870`, `◀ YOU`.

## Visual foundations

**Colour.** The page is `nc-bg` (ink). Read the roles, not the palette: `nc-accent` (cyan) is the interface — edges, links, HUD text, focus; `nc-hot` (pink) is the call to action, *you*, and h1 titles; `nc-prize` (gold) is treasure and the podium; `nc-ok`, `nc-warn`, `nc-danger` are status and always come with a glyph or a word. Text is `nc-text` on `nc-bg`, `nc-surface` and `nc-field`; secondary text `nc-text-muted`; captions and placeholders `nc-text-subtle`. Every text colour holds at least 4.5:1 on those grounds; `nc-slate` (2.8:1) is for disabled things only. Setting `--nc-accent` on a section retints every box, button and field inside it.

**Type.** Three voices. Interface in `pixel` (Neon Pixel) at 8 px steps only — `pixel-64`, `pixel-48`, `pixel-32`, `pixel-24`, `pixel-16`, `pixel-8` — with line heights of 1.25 or 1.5 so baselines land on whole pixels; any other size blurs. Prose in `body` (Space Grotesk): `lead`, `body`, `small`. Code and whatever people type in `mono` (Space Mono): `code`, `input`. Headings: h1 `pixel-48` in `nc-hot` with the drop and a glow, h2 `pixel-32` in `nc-accent`, h3 `pixel-24` in `nc-text`, h4–h6 `pixel-16`.

**The edge.** Every framed thing — box, button, field, badge, frame, meter — has the same edge: `nc-u` (2 px) thick in the component's `--nc-edge` colour, drawn as four offset box-shadows so the corners stay open. No border-radius (`nc-radius` is 0) and no soft drop shadows. The edge sits outside the element like an outline: leave it one unit of room.

**Shadows and light.** Letters get the hard drop `nc-drop` (one font pixel down-right in ink); titles and HUD text add a glow in their own colour. Light belongs to the scenery: lamps, windows and the sun glow; the interface does not.

**Spacing and layout.** A 4 px grid: `nc-space-1` … `nc-space-8`. Boxes pad `nc-space-4`; buttons sit `nc-space-3` apart; sections `nc-space-6` to `nc-space-8`. Content columns are `nc-wrap` (960 px) with a 16 px gutter. Pages do not scroll sideways on a 375 px phone.

**States.** A button *lights up*: on hover and keyboard focus its edge colour fills it and the letters go `nc-ink`; pressed, selected and current stay lit. Fields at rest have an `nc-quiet` edge, turn `nc-accent` on focus and `nc-danger` when invalid. Checkboxes, radios and switches show focus as a 2 px `nc-hot` outline two units out. Disabled is `nc-slate`.

**Motion.** Things blink in `steps()` — the cursor ▶, `PRESS START`, the ▼ that asks for the next line — and never slide, fade or bounce. Backgrounds may move (the scene's stars and swell); chrome does not. Everything that moves stops for `prefers-reduced-motion`.

**Imagery.** Pixel art only, scaled by whole numbers with nearest-neighbour (`image-rendering: pixelated`). Sprites are written as text, one palette letter per pixel, with an ink outline and a lighter top edge. The scenery is the dusk: a dithered sky in `nc-sky-0` … `nc-sky-7`, the striped sun in `nc-sun-0` … `nc-sun-3`, a cyan horizon, the sea, palms and a town with lit windows.

## Iconography

There is no icon font and no SVG icon set: icons are glyphs of Neon Pixel, sized and coloured like the text around them (`▶ START`, `♪ ON`, `⌂`, `◀ YOU`). For pictures, use the ready-made sprites in the Sprites group (heart, gem, key, bomb, coin, star, home, cursor, sun) or draw new ones as sprite text with `<nc-sprite>`. The Marks group holds the sun-on-the-horizon mark, a 16×16 pixel drawing used as the favicon. There is no logo: set the name in `pixel` type.

## Using this system

- **CSS:** load `tokens.css` and `components/bundle.css`. Put `class="nc"` on `<body>` (or any container) and plain HTML inside takes the look; add `.nc-*` classes for components — each component here names its classes. Classless rules carry no specificity, so any class wins.
- **Script:** `components/bundle.js` defines `window.NeonCoast` — the canvas kit (`createPixelStage`, `sprite`, `drawText`, the scenery painters, HUD shapes) — and registers `<nc-scene>` and `<nc-sprite>`. Only needed for those.
- **Outside Claude:** the same library is on GitHub, `phareim/neon-coast`: one stylesheet `https://cdn.jsdelivr.net/gh/phareim/neon-coast@master/dist/neon-coast.css` (fonts included) and one module `…/dist/neon-coast.js`, or `npm install github:phareim/neon-coast`.

Do: build screens from boxes, buttons and pixel text on the night; give each colour its job; keep pixel text at 8 px steps; let the scene be the only thing that glows.
Don't: round corners, add soft shadows or gradients to chrome, use emoji, set long text in the pixel font, or use pink and gold as decoration.
