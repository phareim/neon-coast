# Neon Coast

The pixel look of [phareim.no](https://phareim.no) as a design system: the
night palette, the 5×7 pixel letters, the dialog box with its notched
corners, buttons that light up, and the coast at dusk with the sun stuck on
the horizon.

![The neon coast at dusk, drawn by <nc-scene>](docs/preview.png)

It comes in three layers, and you only take what you need:

| Layer | File | What it does |
|---|---|---|
| **CSS** | `dist/neon-coast.css` | One file, no build step. Styles plain HTML inside `class="nc"`, plus `.nc-*` components. The pixel font is inside it. |
| **Elements** | `dist/neon-coast.js` | `<nc-scene>` (the coast as a live backdrop) and `<nc-sprite>` (pixel art written in the page). No code needed. |
| **Canvas kit** | `dist/neon-coast.js` | The pixel stage with its light map, string-map sprites, the 5×7 font, scenery painters and HUD shapes — for games. |

Open `index.html` (the style guide) or the examples in `examples/` to see
all of it: `npm run serve` and then <http://localhost:5173/>.

## Start

Two lines and a class:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/phareim/neon-coast@master/dist/neon-coast.css">
<script type="module" src="https://cdn.jsdelivr.net/gh/phareim/neon-coast@master/dist/neon-coast.js"></script>

<body class="nc">
  <nc-scene scene="coast" style="height: 320px"></nc-scene>
  <main>
    <h1>Hello, coast</h1>
    <div class="nc-box">A dialog box.</div>
    <button>▶ Start</button>
  </main>
</body>
```

The script line is only for `<nc-scene>`, `<nc-sprite>` and the canvas kit;
the CSS works alone. Pin a version by swapping `@master` for a tag or a
commit once one exists.

### With npm (Vue, Nuxt, React, Vite …)

```bash
npm install github:phareim/neon-coast
```

```js
import 'neon-coast/css'          // the look
import 'neon-coast'              // registers <nc-scene> and <nc-sprite>
import { createPixelStage, sprite, drawText } from 'neon-coast'   // the canvas kit
```

Nuxt: add the CSS in `nuxt.config.ts` and load the elements on the client
only, and tell Vue that `nc-*` tags are custom elements:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['neon-coast/css'],
  vue: { compilerOptions: { isCustomElement: tag => tag.startsWith('nc-') } },
})

// plugins/neon-coast.client.ts
import 'neon-coast'
export default defineNuxtPlugin(() => {})
```

The module imports fine on a server (it registers nothing there), and it
ships TypeScript declarations.

## The rules

These are what make it look like Neon Coast. Keep to them and new screens
will fit.

1. **Pixel letters at 8 px steps only** — 8, 16, 24, 32, 48, 64. One font
   pixel is an eighth of the size; anything else blurs. Line heights of
   1.25 or 1.5 keep the baseline on a whole pixel.
2. **Pixel letters for the interface, Space Grotesk for prose, Space Mono
   for code and typing.** The pixel font has capitals only, so long text
   belongs in the body face.
3. **One edge, one unit.** Framed things have a 2 px (`--nc-u`) edge with
   open corners. No `border-radius`, no soft drop shadows — only the hard
   shadow one font pixel down-right, and the neon glow.
4. **Colour has a job.** Cyan is the interface. Pink is the call to action,
   and *you*. Gold is treasure. Lime, orange and red are for status.
5. **Things blink in steps; they never slide or fade.** Backgrounds may
   move, chrome does not. Reduced motion stops the blinking and the scenery.

## Tokens

Everything is a CSS custom property on `:root`, generated from
`src/js/tokens.js` (also in `dist/tokens.json`), so the canvas and the CSS
share one palette.

**Roles** — change these to retint an area: set `--nc-accent` on a section
and every box, button and field inside follows.

| Token | Colour | For |
|---|---|---|
| `--nc-bg` | ink `#0b0616` | the page |
| `--nc-accent` | cyan `#2ff3ff` | the interface: edges, links, HUD text |
| `--nc-hot` | pink `#ff2fa0` | call to action, you, titles |
| `--nc-prize` | gold `#ffd23f` | treasure, the podium |
| `--nc-ok` / `--nc-warn` / `--nc-danger` | lime / orange / red | status |
| `--nc-text` / `--nc-text-muted` / `--nc-text-subtle` | `#f2e9ff` / `#b9a8d9` / `#8f86b8` | text |
| `--nc-surface` | ink at 88 % | panel fill |
| `--nc-field` | `#140b26` | inside inputs and meters |
| `--nc-quiet` | `#6a5aa8` | quiet edges (fields at rest, frames) |
| `--nc-rule` | `#54259e` | dividers |

**Palette** — each colour is `--nc-<name>` and a sprite letter:
ink `k`, night `K`, dusk `u`, slate `G`, haze `g`, lavender `W`, white `w`,
cyan `c`/`C`, blue `b`/`B`, pink `p`/`P`, rose `m`, violet `v`/`V`,
gold `y`/`Y`, cream `e`, orange `o`, red `r`/`R`, lime `l`/`L`,
teal `t`/`T`, plum `h`/`H` (the capital is the `-deep` shade). Sprites also
have skin `s S`, wood `n N` and clay `a i j`. The dusk ramps are
`--nc-sky-0` … `--nc-sky-7` and `--nc-sun-0` … `--nc-sun-3`.

**Scales** — `--nc-u` (2 px), `--nc-size-0` … `--nc-size-5` (8 → 64 px),
`--nc-space-1` … `--nc-space-8` (4 → 64 px), `--nc-font-pixel`,
`--nc-font-body`, `--nc-font-mono`, `--nc-font-input`, `--nc-wrap` (960 px).

Every text colour passes WCAG AA on the night background (subtle text is
6:1, pink 5.9:1); edges that mark a control are at least 3:1.

## Classless

Inside `class="nc"`, plain elements need no classes: headings (pink `h1`,
cyan `h2`, white `h3`), links, lists with square cyan bullets, `blockquote`,
`code`, `pre`, `kbd`, `mark`, `hr`, `table`, `button`, every `input`,
`select`, `textarea`, `fieldset`, `progress`, `details` and `dialog`. On
`<body class="nc">` the body's own `header`, `main` and `footer` become a
centred column.

All of it sits inside `:where()`, so it has no specificity: any class — a
`.nc-*` component or your own — wins without `!important`. Put `nc` on a
smaller container if only part of a page should take the look.

## Components

| Class | What | Variants |
|---|---|---|
| `.nc-box` | the dialog box: dark panel, edge, faint cyan rule inside the top | `--pink` `--gold` `--lime` `--violet` `--quiet` `--flat` `--solid` |
| `.nc-dialog` | what people say: white pixel letters in a pink box; works on `<dialog>` | add `<span class="nc-more"></span>` for the blinking ▼ |
| `.nc-alert` | a status line in a box | `--ok` `--warn` `--danger` |
| `.nc-frame` | the edge alone, for images, avatars and canvases | `--gold` `--pink` `--cyan` |
| `.nc-window` | the first sketch of the 16-bit window: a blue gradient in five hard bands, a white bevel. Kept as it is; new work should use `.nc-win` (see [the 16-bit language](#the-16-bit-language)) | `--teal` |
| `.nc-btn` | lights up on hover and focus; stays lit with `aria-pressed`, `aria-selected`, `aria-current` or `.is-active` | `--pink` `--gold` `--lime` `--violet` `--red` · `--solid` `--ghost` · `--sm` `--lg` `--icon` `--block` |
| `.nc-btns`, `.nc-tabs` | a row of buttons; tabs are buttons with `aria-selected` | |
| `.nc-field`, `.nc-label`, `.nc-help` | a form row: label, control, small print | |
| `.nc-input`, `.nc-textarea`, `.nc-select` | fields: dark wells, quiet edge, cyan on focus, red when invalid | `.nc-input--pixel` for name entry |
| `.nc-check`, `.nc-radio`, `.nc-switch`, `.nc-range` | checkbox, radio, on/off (`role="switch"`), slider | `.nc-choice` for a label with a control in front |
| `.nc-meter` | a bar that fills in whole cells: `style="--nc-value: .6"` | `--pink` `--gold` `--lime` `--red` `--fluid`; `--nc-cells`, `--nc-cell` |
| `.nc-badge` | a small solid tag | `--pink` `--gold` `--lime` `--violet` `--red` `--quiet` `--outline` |
| `.nc-kbd` | a key cap | |
| `.nc-menu` | a list of choices with the ▶ cursor (`aria-current` marks one) | |
| `.nc-table` | the high-score table, all pixel letters | rows `.is-hot` (you) and `.is-prize` (podium); cells `.nc-num` |
| `.nc-details` | disclosure with ▶ / ▼ | |
| `.nc-rule` | a divider | `--dots` `--neon` |

**Text:** `.nc-pixel` (the pixel font on anything), `.nc-prose` (back to
the body face), `.nc-title` (big pink title with shadow and glow),
`.nc-hud` (cyan interface text), `.nc-hint` (pink call to action),
`.nc-banner` (white letters between a cyan and a pink line), `.nc-dim`,
`.nc-blink`, `.nc-loading` (dots that count up), `.nc-drop`, `.nc-glow`,
`.nc-size-0` … `.nc-size-5`, and colour classes `.nc-cyan` `.nc-pink`
`.nc-gold` `.nc-lime` `.nc-violet` `.nc-orange` `.nc-red` `.nc-white`
`.nc-muted` `.nc-subtle`.

**Scenery in CSS:** `.nc-sky` (the dusk in hard bands), `.nc-sun` (the
striped sun on a horizon; `--nc-sun-size`), `.nc-horizon` (a cyan line with
the sea under it), `.nc-crt` (scanlines and a vignette over anything),
`.nc-pixelated` (nearest-neighbour scaling for pixel-art images).

**Layout:** `.nc-page`, `.nc-wrap`, `.nc-stack`, `.nc-cluster`, `.nc-grid`
(`--nc-min`), `.nc-center`, `.nc-spread`; spacing through `--nc-gap`.

One thing to know: edges are drawn as four offset shadows *outside* the
element, like an outline. Components carry a 2 px margin for them; if a
parent clips (`overflow: hidden`) right at the edge, give it a little
padding.

![Buttons](docs/components.png)

## Elements

### `<nc-scene>`

The coast at dusk, live: twinkling stars, a swell with the sun's broken
reflection, palms in the wind, lit by the stage's light map and finished
with bloom, scanlines and a vignette. It renders at twelve frames a second,
stops when off screen or in a background tab, and draws one still frame for
people who prefer reduced motion. Before the script runs it shows a CSS sky.

```html
<nc-scene></nc-scene>                                  <!-- the coast, half as tall as wide -->
<nc-scene scene="town" style="height: 40vh"></nc-scene>
<nc-scene scene="hills" sun="0.7" pixels="120"></nc-scene>
<nc-scene fixed></nc-scene>                            <!-- behind the whole page -->
```

| Attribute | Default | |
|---|---|---|
| `scene` | `coast` | `coast`, `town` (houses with lit windows, lamps), `hills`, `dusk` (just sky and sun) |
| `look` | | `16`: the coast in the 16-bit language at twice the pixels (see below); `scene` is ignored |
| `pixels` | `180` | logical pixels from top to bottom: fewer is chunkier |
| `horizon` | `0.6` | where the horizon sits, 0–1 of the height |
| `sun` | `0.5` | the sun's position, 0–1 of the width, or `none` |
| `still` | | one frame, no animation |
| `bare` | | no light map, bloom, scanlines or vignette |
| `fixed` | | fill the viewport behind the page (`position: fixed; z-index: -1`) |

Without a height it is half as tall as it is wide (`--nc-scene-ratio:
50%`); a height or `inset` from your CSS wins.

### `<nc-sprite>`

Pixel art written as text, one palette letter per pixel, `.` for see-through:

```html
<nc-sprite scale="6" label="A heart">
  .kk.kk.
  kmpkppk
  kpppppk
  .kpppk.
  ..kpk..
  ...k...
</nc-sprite>

<nc-sprite name="star" scale="4"></nc-sprite>
<nc-sprite name="heart" colors="p:#2ff3ff m:#fff4ff"></nc-sprite>
<nc-sprite shade="v m V">…an X map…</nc-sprite>
```

`name` picks a ready-made sprite: `heart`, `heart-half`, `heart-empty`,
`gem`, `key`, `bomb`, `coin`, `star`, `home`, `cursor`, `sun`, and the three
ways phareim.no's world is shown: `view-grid`, `view-cube`, `view-pencil`. `scale` is CSS
pixels per sprite pixel (4), `colors` overrides palette letters, `shade`
("body hi lo") outlines and shades a shape drawn with `X`, `flip` mirrors
it, `label` gives it an accessible name (without one it is decorative), and
`look="16"` gives it the 16-bit treatment: EPX up to twice the pixels, then
selout (keep `scale` even, so a 16-bit pixel is a whole CSS pixel).

## Canvas kit

For games and anything drawn on a canvas. The idea: draw the world into a
small logical buffer where one pixel is one sprite pixel, and let the stage
do the look.

```js
import { createPixelStage, sprite, SPRITES, drawText, drawHearts,
         paintSky, paintSun, paintSea, drawStars, DUSK, COLORS } from 'neon-coast'

const stage = createPixelStage(canvas, { minW: 160, minH: 120 })
stage.resize(canvas.clientWidth, canvas.clientHeight)   // again on every resize

function frame(ms) {
  const t = ms / 1000
  const g = stage.begin()                  // the scene, in logical pixels
  const { vw, vh } = stage
  paintSky(g, vw, 70)
  drawStars(g, vw, 64, t)
  paintSun(g, vw / 2, 60, 20)
  paintSea(g, 0, vw, 70, vh, { sunX: vw / 2, time: t })
  g.drawImage(sprite(SPRITES.star), 40, 80)
  stage.light(44, 84, 16, COLORS.gold, 0.8)  // a glow pool round the star
  drawHearts(stage.hud, 4, 4, 5, 6)          // the HUD layer is never lit
  drawText(stage.hud, 'SCORE 004200', 4, 14, COLORS.cyan, COLORS.ink)
  stage.present({ ambient: '#b0a4dc' })      // light map, scale, bloom, scanlines
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
```

`examples/game.html` is a complete little game built this way.

| Module | Exports |
|---|---|
| stage | `createPixelStage(canvas, { minW, minH, bg, maxRatio })` → `resize`, `begin`, `light`, `emit`, `emitImage`, `present({ ambient, bloom, overlay, flash, fade, shakeX, shakeY, afterLight })`, `px`, `g`, `hud`, `vw`, `vh`, `scale`, `k`; `makeCanvas`, `glowSprite`, `pixelRatio` |
| sprites | `sprite(rows, palette?, flip?)`, `silhouette`, `put`, `putC`, `shade`, `relight`, `pixelize`, `bayer`, `mix`, `SPRITES` |
| font | `drawText`, `drawBigText`, `textWidth`, `bigTextWidth`, `wrapText`, `glyphRows`, `glyphAbove`, `GLYPHS`, `GLYPH_H` |
| scenery | `paintSky`, `drawStars`, `paintSun`, `paintRidge`, `paintHeadland`, `paintSea`, `paintReflection`, `paintBeach`, `paintPalm`, `paintTreeLine`, `paintHouse`, `paintGrass`, `paintLamp`, `ditherGradient`, `disc`, `rect`, `hash2`, `noise1`, `DUSK` |
| ui | `drawBox`, `drawWindow` (the first 16-bit window sketch), `drawDialog`, `drawBanner`, `drawMeter`, `drawHearts` |
| font16 | `drawText16`, `textWidth16`, `wrapText16`, `glyphRows16`, `glyphExtra16`, `GLYPHS16`, `MARKS16_ABOVE`, `MARKS16_BELOW`, `ALIAS16`, `CAP16`, `LINE16`, `ABOVE16`, `BELOW16` |
| ui16 | `drawWindow16(ctx, x, y, w, h, { tone, unit })`, `drawMore16`, `drawGlove16`, `drawHearts16`, `window16Rects`, `more16Rects`, `rowsToRects`, `rectsToSvg`, `GLOVE16`, `HEARTS16`, `WIN16_LEAD`, `WIN16_TRAIL` |
| pixel16 | `scale2x(canvas)` and `epx(pixels, w, h)` (EPX), `selout(canvas)` and `seloutPixels`, `quantize15(imageData, { dither })`, `paintBands(ctx, x, y, w, h, stops, { dither, knit })`, `ramp15(keys, n)` |
| scenery16 | `paintSky16`, `paintSun16`, `paintRidge16`, `paintClouds16`, `paintSea16`, `paintGlints16`, `drawDrift`, `DUSK16` |
| tokens | `PAL`, `COLORS`, `SKY`, `SUN`, `UI`, `ROLES`; 16-bit: `WIN16`, `WIN16_RAMPS`, `TEXT16`, `INK16`, `five`, `rampAt`, `ramp5`, `readableFrom`, `contrast` |
| elements | `NcScene`, `NcSprite`, `defineElements`, `parseRows` |

A few things the stage does for you: it picks the largest whole scale that
still shows `minW`×`minH` logical pixels, so pixels stay square and crisp on
any screen; it renders at the device's pixel ratio but steps down on weak
devices; `resize(…, rotate = true)` turns a side-scroller a quarter for
portrait phones while the HUD stays upright; and whatever you draw in
`afterLight` (or mark with `emit`/`emitImage`) stays at full brightness,
the way neon does.


## The 16-bit language

Next to the 8-bit cabinet there is a second form language: the 16-bit
machine, the way the isometric view on phareim.no draws its windows —
"how 16-bit *felt*" (Chrono Trigger, Final Fantasy VI, Secret of Mana) in
the same dusk palette. It is **opt-in**: nothing 8-bit changes unless you
ask for it. `examples/dialog16.html` is a whole screen of it.

**When to use which.** The 8-bit look is the arcade: neon edges, the 5×7
letters, hard scanlines — HUDs, scores, menus that shout. The 16-bit look
is the story: dialog, a name plate, a question with the glove, an item box,
a pause screen. Pick one per screen, or one per window; the coast behind
can be either.

Two ways in:

```html
<!-- Components that work anywhere -->
<div class="nc-win">
  <span class="nc-plate16">Keeper</span>
  <p>The arcade. Go in?</p>
  <ul class="nc-choices16"><li><button aria-current="true">Yes</button></li><li><button>No</button></li></ul>
</div>

<!-- Or re-dress the 8-bit components inside a container -->
<section class="nc-16"> ….nc-box, .nc-dialog, .nc-btn, .nc-menu, .nc-meter, headings… </section>
```

| Class | What | Variants |
|---|---|---|
| `.nc-win` | the window: the game's gradient in hard five-bit bands, a two-ring bevel with round corners, a dark line inside, a soft three-step shadow; 16-bit letters | `--cool` (pause screen, item box) · `--flat` (no shadow) |
| `.nc-plate16` | the speaker's name on a plate riding the window's top edge (first child of `.nc-win`) | |
| `.nc-btn16` | a small window; under the pointer, on focus, pressed or current it turns cool with gold letters | `--cool` |
| `.nc-choices16` | answers with the pointing glove at the chosen one (`aria-current`, `aria-selected`, `aria-checked`, hover, focus) | `--column` |
| `.nc-more16` | the "more" arrow: dips a pixel, comes back, blinks out (bottom-right in a window) | |
| `.nc-text16`, `.nc-h16`, `.nc-label16` | the 16-bit letters at 14 px, a 28-px heading, a small dim label | `.nc-text16--dim --hot --cool --prize --ok --rim` |
| `.nc-meter16` | a bar in a bevelled trough, ending on a whole pixel: `style="--nc-value: .6"` | `--hot` `--prize` `--ok` |
| `.nc-hearts16` + `.nc-heart16` | hearts twice as fine as the 8-bit ones | `.nc-heart16--half` `--empty` |
| `.nc-16` | the scope: inside it `.nc-box`, `.nc-dialog`, `.nc-alert` and `<dialog>` become windows (`--quiet`/`--violet` boxes cool ones), `.nc-btn` and plain buttons 16-bit buttons, `.nc-menu` gets the glove, `.nc-more` the arrow, `.nc-meter` the 16-bit bar, and every pixel-font text the 16-bit font (`--nc-font-pixel` and the `--nc-size-*` steps are re-pointed) | |

**The rules that make it look right**

1. **Sizes in 16-bit pixels.** One 16-bit pixel is `--nc-px16` (half of
   `--nc-u`: 1 px). Neon Pixel 16's line is fourteen of them, so the letters
   are crisp at **14, 28, 42 and 56 px** only (`--nc-size16-1` … `-4`),
   with line heights that leave whole pixels above and below (14 + an even
   number: the dialog's pitch is 22). Set `--nc-px16: 2px` on any element
   and everything 16-bit inside it doubles, still crisp.
2. **Bands, not gradients.** A window's colour steps where the machine's
   five-bit channel steps — hard stops, never a smooth CSS gradient. The
   ramps are tokens (`--nc-win-hot`, `--nc-win-cool`, `--nc-win-plate`);
   on canvas, `paintBands` knits band edges with an ordered dither.
3. **Bevel, not notch.** 16-bit frames are the bevel with round corners and a
   soft shadow; 8-bit frames are the notched neon edge. Do not put one
   inside the other.
4. **Coloured outlines.** Art at 16-bit density gets selout: a dark outline
   takes the colour of what it holds (`<nc-sprite look="16">`, `selout()`).
   Letters have a one-pixel drop (`--nc-drop16`), or a rim all round when
   they lie on the world or mark the chosen answer (`--nc-rim16`).
5. **Never mix the two fonts in one window.** Neon Pixel 16 has the
   letters, digits, Æ Ø Å É and ♥ × → ← ↑ ↓; it does not have ▶ ◆ ★ ♪ ✓ and
   the other 8-bit symbols. A missing one falls back to the 5×7 font at a
   size where it blurs — leave it out, or use a picture (the glove, the
   arrow, a heart).
6. **Colour and contrast.** White letters by default; gold for names and
   treasure, cyan for the chosen answer, dim for the others, pink only at
   28 px and up. The CSS ramps start where all of these pass WCAG AA on the
   lightest band (the hot ramp drops its top 10 %, the plate's 27 %); in a
   cool window the answers are white, the chosen one cyan with its rim.
7. **Motion.** The arrow bobs and the glove nudges in `steps()`; the
   coast's clouds and ridges drift. All of it stops under
   `prefers-reduced-motion`.

**Tokens.** From `src/js/tokens.js`: `WIN16` (the hot and cool tones —
top and bottom of the gradient, the bevel's `hi`/`lo`/`hi2`/`lo2` — the
outline, the inner line, the shadow steps), `TEXT16` (the letters'
colours, shadow and rim), `INK16` (the icons' palette) and `WIN16_RAMPS`.
In CSS: `--nc-win-hot-top`, `--nc-win-hot-hi` …, `--nc-win-outline`,
`--nc-win-inner`, `--nc-win-shadow-1` … `-3`, `--nc-win-hot` / `-cool` /
`-plate` (the band gradients), `--nc-text16`, `--nc-text16-shadow`,
`--nc-text16-prize` …, and the pictures the build draws from
`src/js/ui16.js`: `--nc-win-frame-hot` / `-cool` (+ `-flat`),
`--nc-glove16`, `--nc-more16`, `--nc-heart16-full` / `-half` / `-empty`.

**Elements.** `<nc-scene look="16">` paints the coast at twice the pixels:
the sky in knitted bands, the striped sun in a dithered halo, cloud streaks
and two ridges that slide at their own speeds, a sea with the sun's broken
reflection and glints; no light map or scanlines, a little bloom.
`<nc-sprite look="16">` takes 8-bit art up with EPX and selout.

**Canvas.** `drawWindow16`, `drawText16` and friends draw the same window
and letters into a canvas (in 16-bit pixels; `unit: 0.5` on a canvas laid
out in 8-bit pixels at twice the density, as the game does). The canvas
window is the game's ramp exactly; only the CSS ramps are trimmed for
contrast.

```js
import { drawWindow16, drawText16, wrapText16, drawGlove16, paintBands, ramp15, DUSK16, TEXT16 } from 'neon-coast'

paintBands(g, 0, 0, w, h, ramp15(DUSK16.sky, 12))           // the sky in knitted bands
drawWindow16(g, 8, h - 72, w - 16, 64, { tone: 'hot' })
wrapText16(text, w - 48).forEach((line, i) => drawText16(g, line, 24, h - 59 + i * 22, TEXT16.text, TEXT16.shadow))
```

**Resyncing with the game.** The 16-bit pieces are copies, kept in the
game's shape so a resync is a paste: the glyph table from
`themes/base/pixel/font16.ts` (`G`, `ABOVE`, `BELOW`, `ALIAS` →
`GLYPHS16`, `MARKS16_ABOVE`, `MARKS16_BELOW`, `ALIAS16` in
`src/js/font16.js`), the window's colours from
`themes/zelda/render/hud16.ts` (`TONES`, the `paintWindow` outline, inner
line and shadow, `SHADOW`, `RIM`, the skin's text colours, `INK` → `WIN16`,
`TEXT16`, `INK16` in `src/js/tokens.js`), and the art (`HAND`, `HEART_*`
→ `GLOVE16`, `HEARTS16` in `src/js/ui16.js`). Then `npm run font16` and
`npm run build`.

## The font

**Neon Pixel** is the canvas font as a webfont: 5×7 capitals, digits,
Æ Ø Å (and Ä Ö Ü É È with their marks), punctuation, arrows and a set of
symbols that work as icons — ♥ ★ ♪ ● ○ ■ ◆ ◈ ✓ × ☰ ⌂ ↻ ▶ ◀ ▲ ▼ ← → ↑ ↓ $ € £ °.
Lower case draws as upper case. The CSS carries it inline; `dist/fonts/`
also has it as `.woff2`, `.woff` and `.ttf` (install the TTF to design
with it in Figma or anywhere else — use sizes in 8 pt steps).

**Neon Pixel 16** is the 16-bit language's face, built the same way from
`src/js/font16.js`: proportional capitals twelve pixels high on a
fourteen-pixel line (the em), so 14, 28, 42 and 56 pt are the crisp sizes.
It is inline in the CSS too, and in `dist/fonts/neon-pixel-16.*`.

Space Grotesk and Space Mono are by their authors under the SIL Open Font
License (`dist/fonts/OFL.txt`); the CSS loads them from `dist/fonts/`.

## Working on it

```bash
npm install
npm run serve       # the style guide at http://localhost:5173/
npm run build       # src → dist (CSS bundle, JS bundle, types, tokens.json)
npm test            # glyphs, tokens, sprites, and that dist matches src
npm run typecheck   # strict TypeScript over the JSDoc
npm run font        # rebuild Neon Pixel after editing src/js/font.js (pip install fonttools brotli)
npm run font16      # rebuild Neon Pixel 16 after editing src/js/font16.js
npm run fonts       # also re-copy Space Grotesk and Space Mono from @fontsource
```

Edit `src/`, run `npm run build`, and commit `dist/` with it — the CDN
links serve `dist/` straight from the repository, and `npm test` fails when
it is stale. Colours live in `src/js/tokens.js` only; `src/css/colors.css`
is generated from it.

```
src/js/      tokens · font · sprites · stage · scenery · ui · font16 · pixel16 · ui16 · scenery16 · elements · index
src/css/     colors (generated) · tokens · fonts · base (classless) · type · box · button · form · data · effects · layout · sixteen
dist/        neon-coast.css · neon-coast.min.css · neon-coast.js · neon-coast.min.js · tokens.json · types/ · fonts/
index.html   the style guide          examples/   hello.html · game.html · dialog16.html
```

## Coming from phareim.no

The system is drawn from `themes/base/pixel/` on phareim.no. The names map
like this: `.px-box` → `.nc-box`, `.px-btn` → `.nc-btn`, `.px-text` →
`.nc-pixel`, `.px-title` / `.px-hud` / `.px-hint` / `.px-dim` / `.px-blink`
→ `.nc-title` / `.nc-hud` / `.nc-hint` / `.nc-dim` / `.nc-blink`,
`--px-u` → `--nc-u`, `--px-edge` → `--nc-edge`, `--font-pixel` →
`--nc-font-pixel`. The canvas modules (`stage`, `sprites`, `font`,
`scenery`, `palette` → `tokens`) keep their function names. Differences:
Ä Ö Ü draw as A O U with dots (not Æ Ø), the comma has a tail, and the font
gained `` $ € £ ^ ~ { } \ ` ° ★ ● ○ ◆ ✓ ☰ « » ``.

## Licence

No licence has been chosen for the code yet. The bundled Space Grotesk and
Space Mono fonts are under the SIL Open Font License 1.1.
