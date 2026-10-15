#!/usr/bin/env node
// Writes the claude.ai Design System version of Neon Coast: the files the
// "Design System" artifact keeps under project/. The library stays the
// source; this only reshapes it.
//   node scripts/export-design-system.mjs <outDir>
// → <outDir>/project/{README.md, tokens.json, components/…, fonts/…, assets/…, licences/OFL.txt}
// The index (project/design-system.json) is not written here: it records the
// uploaded sprite SVGs by their upload ids, so it is edited on publish.
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import * as esbuild from 'esbuild'
import { PAL, COLORS, SKY, SUN, UI, ROLES } from '../src/js/tokens.js'
import { SPRITES } from '../src/js/sprites.js'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.argv[2]
if (!outDir) { console.error('usage: node scripts/export-design-system.mjs <outDir>'); process.exit(1) }
const out = join(resolve(outDir), 'project')
const write = (path, text) => { mkdirSync(dirname(join(out, path)), { recursive: true }); writeFileSync(join(out, path), text) }
const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'))
let sha = 'unknown'
try { sha = execFileSync('git', ['-C', repo, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() } catch {}

// --- tokens.json --------------------------------------------------------------
const USAGE = {
  ink: 'The night: page background, outlines, hard text shadows, and the letters on a lit button.',
  night: 'Dark shade: code backgrounds, sprite shading.',
  dusk: 'Deep violet-grey: key caps and empty meter cells.',
  slate: 'Disabled edges and text, key-cap edges. 2.8:1 on nc-ink: never for text people must read.',
  haze: 'A mid grey in sprites; nc-text-subtle uses the same value.',
  lavender: 'Stars and sprite highlights.',
  white: 'The brightest letters: dialogs, strong text, banners. On nc-ink and nc-surface.',
  cyan: 'The interface colour, through nc-accent. 14.6:1 on nc-ink.',
  'cyan-deep': 'Shading under cyan in sprites.',
  blue: 'Sprite blue.',
  'blue-deep': 'Deep blue: the sea in covers and scenery, sprite shading.',
  pink: 'Call to action, you and titles, through nc-hot. 5.9:1 on nc-ink.',
  'pink-deep': 'Shading under pink in sprites.',
  rose: 'Inline code text and light pink highlights. 9.5:1 on nc-ink and nc-night.',
  violet: 'Violet buttons and badges. 4.5:1 on nc-ink, the floor for text.',
  'violet-deep': 'Divider lines (nc-rule) and scrollbars.',
  gold: 'Treasure, through nc-prize: the podium, prizes. 13.8:1 on nc-ink.',
  'gold-deep': 'Podium frames and coin shading.',
  cream: 'The top of the sun; star highlights.',
  orange: 'Warnings, through nc-warn; the middle of the sun. 8.5:1 on nc-ink.',
  red: 'Errors and invalid fields, through nc-danger. 5.7:1 on nc-ink.',
  'red-deep': 'Shading under red in sprites.',
  lime: 'Success, through nc-ok. 16.5:1 on nc-ink.',
  'lime-deep': 'Shading under lime in sprites.',
  teal: 'Tree tops and glints in scenery sprites.',
  'teal-deep': 'Shading under teal in sprites.',
  plum: 'The shadow under dialog letters.',
  'plum-light': 'Sprite shading.',
  text: 'Body text on nc-bg, nc-surface and nc-field. 17:1 on nc-ink.',
  'text-muted': 'Secondary text and labels on the same grounds. 9.2:1 on nc-ink.',
  'text-subtle': 'Captions, table headers and placeholders. 6:1 on nc-ink, 5.7:1 on nc-field.',
  surface: 'Panel fill behind boxes, dialogs and buttons: ink at 88 %, so a scene glows through.',
  field: 'Inside inputs, meters, switches and tracks.',
  quiet: 'Edges at rest: fields, frames, fieldsets, meters. 3.5:1 on nc-ink.',
  rule: 'Divider lines: hr, table rules.',
  'box-rule': 'The faint cyan line inside the top edge of every box.',
  bg: 'The page. Alias of nc-ink.',
  accent: 'The interface: box and button edges, links, HUD text, focus. Set it on a section to retint everything inside.',
  hot: 'Call to action, you, h1 titles and the text caret.',
  prize: 'Treasure and the podium.',
  ok: 'Success messages and states; always with a ✓ or a word.',
  warn: 'Warnings; always with a ! or a word.',
  danger: 'Errors and invalid fields; always with a × or a word.',
}
const color = (name, value, usage) => ({ name: `nc-${name}`, value, usage })
const colorTokens = [
  ...Object.entries(COLORS).map(([k, v]) => color(k, v, `${USAGE[k]} Sprite letter '${Object.keys(PAL).find(l => PAL[l] === v)}'.`)),
  ...SKY.map((v, i) => color(`sky-${i}`, v, `Dusk sky, band ${i + 1} of 8 from the top (night) to the horizon (pink): .nc-sky and the scenery.`)),
  ...SUN.map((v, i) => color(`sun-${i}`, v, `The striped sun, band ${i + 1} of 4 from the top (cream) to the bottom (pink).`)),
  ...Object.entries(UI).map(([k, v]) => color(k, v, USAGE[k])),
  ...Object.entries(ROLES).map(([k, v]) => color(k, `{nc-${v}}`, USAGE[k])),
]
for (const t of colorTokens) if (!t.usage || t.usage.includes('undefined')) throw new Error(`no usage for ${t.name}`)

const FONTS = [
  ['Neon Pixel', 'neon-pixel.woff2', '400'],
  ['Space Grotesk', 'space-grotesk-latin-300-normal.woff2', '300'],
  ['Space Grotesk', 'space-grotesk-latin-400-normal.woff2', '400'],
  ['Space Grotesk', 'space-grotesk-latin-500-normal.woff2', '500'],
  ['Space Grotesk', 'space-grotesk-latin-700-normal.woff2', '700'],
  ['Space Mono', 'space-mono-latin-400-normal.woff2', '400'],
  ['Space Mono', 'space-mono-latin-700-normal.woff2', '700'],
]
const px = (size, lh, name, sample, usage) => ({ name, fontSize: `${size}px`, lineHeight: `${lh}px`, fontWeight: 400, sample, usage })
const tokens = {
  name: 'Neon Coast',
  version: 1,
  meta: {
    source: 'github',
    repo: 'phareim/neon-coast',
    ref: `master@${sha}`,
    paths: { tokens: ['src/js/tokens.js', 'src/css/tokens.css'], fonts: ['dist/fonts'], components: ['src/css', 'src/js/elements.js'], docs: ['README.md', 'design-system'] },
    synced: new Date().toISOString().slice(0, 10),
  },
  color: {
    note: 'One theme: Neon Coast is always night. Roles (nc-accent, nc-hot, nc-prize, nc-ok, nc-warn, nc-danger, nc-bg) alias the palette; components read the roles.',
    themes: [{ id: 'night', name: 'Night' }],
    tokens: colorTokens,
  },
  type: {
    fonts: FONTS.map(([family, file, weight]) => ({ family, file: `fonts/${file}`, weight, style: 'normal' })),
    families: {
      pixel: '"Neon Pixel", "Space Mono", ui-monospace, monospace',
      body: '"Space Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      mono: '"Space Mono", ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace',
    },
    groups: [
      {
        name: 'Pixel',
        family: 'pixel',
        note: 'The interface voice: 5×7 capitals (lower case draws as upper case). Crisp only at 8 px steps; line heights of 1.25 or 1.5 keep every baseline on a whole pixel.',
        styles: [
          px(64, 80, 'pixel-64', 'NEON COAST', 'Hero titles: .nc-title from 800 px wide.'),
          px(48, 60, 'pixel-48', 'HALL OF FAME', 'Page titles: h1 and .nc-title.'),
          px(32, 40, 'pixel-32', 'WORLD RANKING', 'Section headings (h2); titles on phones.'),
          px(24, 30, 'pixel-24', 'THE NEON COAST', 'Sub-headings (h3), .nc-banner, large buttons.'),
          px(16, 20, 'pixel-16', '▶ PRESS START', 'All interface text: buttons, labels, HUD, menus, tables, badges, keys, h4–h6.'),
          px(16, 24, 'pixel-16-text', 'FOLLOW THE ROAD EAST, PAST THE BEACH.', 'Running pixel text: dialogs and .nc-pixel paragraphs.'),
          px(8, 10, 'pixel-8', 'FINE PRINT FOR SHARP SCREENS', 'Fine print, on high-density screens only.'),
        ],
      },
      {
        name: 'Body',
        family: 'body',
        note: 'The human voice: prose, descriptions, long text.',
        styles: [
          { name: 'lead', fontSize: '20px', lineHeight: '30px', fontWeight: 300, sample: 'The pixel look of phareim.no for any page or game.', usage: 'Intro paragraphs.' },
          { name: 'body', fontSize: '16px', lineHeight: 1.6, fontWeight: 400, sample: 'A night town on the neon coast, the sun stuck on the horizon.', usage: 'Everything people read at length.' },
          { name: 'small', fontSize: '14px', lineHeight: '21px', fontWeight: 400, sample: 'Only for the newsletter.', usage: 'Help text under fields, captions.' },
        ],
      },
      {
        name: 'Mono',
        family: 'mono',
        note: 'The machine voice: code, numbers, and what people type.',
        styles: [
          { name: 'input', fontSize: '16px', lineHeight: '24px', fontWeight: 400, sample: 'you@phareim.no', usage: 'Text in inputs, selects and textareas.' },
          { name: 'code', fontSize: '14px', lineHeight: 1.6, fontWeight: 400, sample: 'var(--nc-accent)', usage: 'Inline code and pre blocks.' },
        ],
      },
    ],
  },
  spacing: {
    note: 'A 4 px grid, and the 2 px unit that every edge, rule and hard shadow is made of.',
    tokens: [
      { name: 'nc-u', value: '2px', usage: 'One pixel of chrome: edge thickness, rules, the hard shadow on 16 px text.' },
      { name: 'nc-space-1', value: '4px', usage: 'Badge and key-cap padding.' },
      { name: 'nc-space-2', value: '8px', usage: 'Inside controls; label-to-field gap.' },
      { name: 'nc-space-3', value: '12px', usage: 'Between buttons; alert padding.' },
      { name: 'nc-space-4', value: '16px', usage: 'Box padding; paragraph spacing; side gutter.' },
      { name: 'nc-space-5', value: '24px', usage: 'Between groups inside a section.' },
      { name: 'nc-space-6', value: '32px', usage: 'Above section headings.' },
      { name: 'nc-space-7', value: '48px', usage: 'Hero padding.' },
      { name: 'nc-space-8', value: '64px', usage: 'Between page sections.' },
    ],
  },
  radius: {
    note: 'Square. Corners are left open by the edge (notched), never rounded.',
    tokens: [{ name: 'nc-radius', value: '0', usage: 'Every box, button, field and badge.' }],
  },
  shadow: {
    note: 'No soft shadows. The only shadows are the hard drop under letters and the edge (four offset box-shadows in --nc-edge, set per component).',
    tokens: [{ name: 'nc-drop', value: '0.125em 0.125em 0 #0b0616', usage: 'The hard text shadow: one font pixel down-right in ink, at any size.' }],
  },
  pixelSize: {
    note: 'Sizes for pixel letters. One font pixel is an eighth of the size.',
    tokens: [
      { name: 'nc-size-0', value: '8px', usage: 'Fine print.' },
      { name: 'nc-size-1', value: '16px', usage: 'Interface text.' },
      { name: 'nc-size-2', value: '24px', usage: 'h3, banners, large buttons.' },
      { name: 'nc-size-3', value: '32px', usage: 'h2; h1 on phones.' },
      { name: 'nc-size-4', value: '48px', usage: 'h1, .nc-title.' },
      { name: 'nc-size-5', value: '64px', usage: '.nc-title from 800 px wide.' },
    ],
  },
  layout: {
    tokens: [{ name: 'nc-wrap', value: '960px', usage: 'Width of .nc-wrap and of a classless page column.' }],
  },
}
write('tokens.json', JSON.stringify(tokens, null, 2) + '\n')

// --- components/bundle.css: the library's CSS without its tokens -----------
const index = readFileSync(join(repo, 'src/css/index.css'), 'utf8')
const parts = [...index.matchAll(/@import\s+"\.\/([^"]+)";/g)].map(m => m[1])
let css = `/* Neon Coast ${pkg.version} components — the library's CSS (github.com/phareim/neon-coast) without its
   tokens: tokens.css declares the colours, sizes, spaces and fonts from tokens.json. */
:root {
  --nc-font-pixel: var(--font-pixel, "Neon Pixel", "Space Mono", ui-monospace, monospace);
  --nc-font-body: var(--font-body, "Space Grotesk", system-ui, sans-serif);
  --nc-font-mono: var(--font-mono, "Space Mono", ui-monospace, monospace);
  --nc-font-input: var(--nc-font-mono);
  --nc-glow: 0 0 0.5em color-mix(in srgb, currentColor 55%, transparent);
}
`
for (const file of parts) {
  if (['colors.css', 'tokens.css', 'fonts.css'].includes(file)) continue
  css += `\n/* ---- ${file} ---- */\n` + readFileSync(join(repo, 'src/css', file), 'utf8')
}
if (/<\/style/i.test(css)) throw new Error('bundle.css must not contain </style')
write('components/bundle.css', css)

// --- components/bundle.js: the library as one classic script ----------------
const js = (await esbuild.build({
  entryPoints: [join(repo, 'src/js/index.js')],
  bundle: true,
  format: 'iife',
  globalName: 'NeonCoast',
  target: 'es2020',
  minify: true,
  write: false,
  legalComments: 'none',
  banner: { js: `/* @ds-bundle: {"format":4,"namespace":"NeonCoast","components":[]} */` },
})).outputFiles[0].text
if (/<\/script|<!--/i.test(js)) throw new Error('bundle.js must not contain </script or <!--')
write('components/bundle.js', js)

// --- authored content: README, component guidelines and previews, types -----
const src = join(repo, 'design-system')
cpSync(src, out, { recursive: true })

// --- fonts and their licence ------------------------------------------------
for (const [, file] of FONTS) { mkdirSync(join(out, 'fonts'), { recursive: true }); copyFileSync(join(repo, 'dist/fonts', file), join(out, 'fonts', file)) }
write('licences/OFL.txt', readFileSync(join(repo, 'dist/fonts/OFL.txt'), 'utf8'))

// --- assets: the ready-made sprites as crisp SVG ----------------------------
function rowsToSvg(rows) {
  const w = rows[0].length
  const h = rows.length
  let rects = ''
  for (let y = 0; y < h; y++) {
    let x = 0
    while (x < w) {
      const ch = rows[y][x]
      if (ch === '.' || !PAL[ch]) { x++; continue }
      const start = x
      while (x < w && rows[y][x] === ch) x++
      rects += `<rect x="${start}" y="${y}" width="${x - start}" height="1" fill="${PAL[ch]}"/>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 8}" height="${h * 8}" shape-rendering="crispEdges">${rects}</svg>\n`
}
const sprites = Object.keys(SPRITES)
for (const name of sprites) write(`assets/Sprites/${name}.svg`, rowsToSvg(SPRITES[name]))
write('assets/Sprites/README.md', `# Sprites

The ready-made sprites of the canvas kit (\`SPRITES\` in the library, \`<nc-sprite name="…">\` in a page), one SVG pixel per sprite pixel at 8× size, in the palette's own colours. Scale them by whole numbers only.

${sprites.map(n => `- \`${n}.svg\` — \`<nc-sprite name="${n}">\`, ${SPRITES[n][0].length}×${SPRITES[n].length} pixels.`).join('\n')}
`)
console.log(`wrote ${out} (from ${sha}): tokens.json, bundle.css ${(css.length / 1024).toFixed(1)} KB, bundle.js ${(js.length / 1024).toFixed(1)} KB, ${sprites.length} sprites`)
