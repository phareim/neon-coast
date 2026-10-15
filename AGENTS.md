# Neon Coast — notes for agents

The pixel look of phareim.no as a design system. README.md is the user
documentation; this file is how to work on the repo.

## Layout

- `src/js/` — plain ES modules with JSDoc types (no TypeScript sources).
  `tokens.js` is the only place colours are defined; `font.js` is the only
  glyph table (canvas and webfont both come from it).
- `src/css/` — one file per area, concatenated in `index.css` order.
  `colors.css` is generated; never edit it by hand.
- `dist/` — built output, **committed** (the jsDelivr links serve it from
  the repo). `dist/fonts/` is only touched by `npm run font` / `npm run fonts`.
- `index.html` — the style guide, also the visual test page. `examples/` —
  a classless page and a small game.

## Workflow

1. Edit `src/`.
2. `npm run build` (and `npm run font` after a glyph change; it needs
   `pip install fonttools brotli`).
3. `npm test` and `npm run typecheck` — the build test fails if `dist/` is
   stale; the token test fails if CSS reads a `--nc-*` property nothing
   defines (add page-settable ones to its `optional` list).
4. Look at it: `npm run serve`, then the style guide at 1280 px and 375 px
   wide. Headless Chromium screenshots are the easy check.
5. Commit `src/` and `dist/` together.

## Conventions

- Prefix everything `nc-` (classes, custom properties, elements).
- Classless rules go inside `:where()` so they carry no specificity;
  components are single classes so a variant or a user class always wins.
- Framed components get the shared edge (four offset box-shadows) by being
  listed in the selector at the top of `box.css`, and set `--nc-edge`.
- Pixel text: sizes in 8 px steps, line-height 1.25 or 1.5, uppercase,
  `-webkit-font-smoothing: none`. Body text is Space Grotesk; typed text
  is Space Mono (`--nc-font-input`).
- Motion: blink in `steps()`, no slides or fades on chrome; everything that
  moves stops under `prefers-reduced-motion`.
- Keep text colours at WCAG AA (4.5:1) on ink and control edges at 3:1.
- Add a token or a component only when something needs it.
