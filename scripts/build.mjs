#!/usr/bin/env node
// Builds everything in dist/ from src/:
//   src/css/colors.css     the colour tokens, generated from src/js/tokens.js
//   dist/neon-coast.css    every CSS file in index.css order, Neon Pixel inlined
//   dist/neon-coast.min.css
//   dist/neon-coast.js     the canvas kit and the custom elements, one ES module
//   dist/neon-coast.min.js
//   dist/tokens.json       the colours and scales for other tools
//   dist/types/            TypeScript declarations from the JSDoc
// The fonts in dist/fonts come from `npm run fonts` and are not touched here.
//   node scripts/build.mjs           write
//   node scripts/build.mjs --check   exit 1 if anything in the repo is stale
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'
import { COLORS, SKY, SUN, UI, ROLES, PAL, WINDOW, WINDOW_TEAL, WIN16, WIN16_RAMPS, TEXT16, INK16 } from '../src/js/tokens.js'
import { window16Rects, more16Rects, rectsToSvg, rowsToRects, GLOVE16, HEARTS16 } from '../src/js/ui16.js'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'))
const check = process.argv.includes('--check')
const BANNER = `/*! Neon Coast ${pkg.version} — the pixel look of phareim.no — github.com/phareim/neon-coast */`

/** @type {Map<string, string>} path → expected content */
const outputs = new Map()
const out = (/** @type {string} */ path, /** @type {string} */ text) => outputs.set(join(repo, path), text)

// --- colour tokens ---------------------------------------------------------
/** @param {readonly number[]} c */
const rgbHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
/** A ramp as a gradient in hard bands: each colour runs from where it starts to where the next one does. @param {{ color: string, at: number }[]} bands */
const bandsCss = bands => 'linear-gradient(180deg, ' + bands.map((b, i) => `${b.color} ${+(b.at * 100).toFixed(2)}% ${+((bands[i + 1]?.at ?? 1) * 100).toFixed(2)}%`).join(', ') + ')'
/** An SVG as a CSS url(). @param {string} svg */
const svgUrl = svg => `url("data:image/svg+xml,${svg.replaceAll('#', '%23').replaceAll('<', '%3C').replaceAll('>', '%3E')}")`
// The window frame for the CSS: a 24-pixel window without its gradient (the CSS paints that), 30 × 30 with outline and shadow.
const frame = (/** @type {'hot' | 'cool'} */ tone, shadow = true) =>
  svgUrl(rectsToSvg(shadow ? 30 : 26, shadow ? 30 : 26, window16Rects(24, 24, tone, { fill: false, shadow })))
const art = (/** @type {string[]} */ rows) => svgUrl(rectsToSvg(rows[0].length, rows.length, rowsToRects(rows, INK16)))
const colorsCss = [
  '/* Generated from src/js/tokens.js by `npm run build` — edit that file, not this one. */',
  ':root {',
  '  /* The palette by name */',
  ...Object.entries(COLORS).map(([k, v]) => `  --nc-${k}: ${v};`),
  '',
  '  /* The dusk sky, top to horizon, and the striped sun, top to bottom */',
  ...SKY.map((v, i) => `  --nc-sky-${i}: ${v};`),
  ...SUN.map((v, i) => `  --nc-sun-${i}: ${v};`),
  ...WINDOW.map((v, i) => `  --nc-window-${i}: ${v};`),
  ...WINDOW_TEAL.map((v, i) => `  --nc-window-teal-${i}: ${v};`),
  '',
  '  /* Interface colours */',
  ...Object.entries(UI).map(([k, v]) => `  --nc-${k}: ${v};`),
  '',
  '  /* Roles: what each colour is for */',
  ...Object.entries(ROLES).map(([k, v]) => `  --nc-${k}: var(--nc-${v});`),
  '',
  '  /* The 16-bit window (WIN16): its two tones, the line round it, the line inside it and its shadow */',
  ...(/** @type {const} */ (['hot', 'cool'])).flatMap(t => [
    `  --nc-win-${t}-top: ${rgbHex(WIN16[t].top)};`,
    `  --nc-win-${t}-bottom: ${rgbHex(WIN16[t].bottom)};`,
    ...(/** @type {const} */ (['hi', 'lo', 'hi2', 'lo2'])).map(k => `  --nc-win-${t}-${k}: ${WIN16[t][k]};`),
  ]),
  `  --nc-win-outline: ${WIN16.outline};`,
  `  --nc-win-inner: ${WIN16.inner};`,
  `  --nc-win-inner-soft: ${WIN16.innerSoft};`,
  ...WIN16.shadow.map((v, i) => `  --nc-win-shadow-${i + 1}: ${v};`),
  '',
  '  /* The ramps the CSS paints, in hard five-bit bands (WIN16_RAMPS) */',
  ...Object.entries(WIN16_RAMPS).map(([k, v]) => `  --nc-win-${k}: ${bandsCss(v)};`),
  '',
  '  /* The 16-bit letters (TEXT16) */',
  `  --nc-text16: ${TEXT16.text};`,
  ...Object.entries(TEXT16).filter(([k]) => k !== 'text').map(([k, v]) => `  --nc-text16-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}: ${v};`),
  '',
  '  /* Pictures drawn from src/js/ui16.js: the window frame (outline, bevel, inner line, shadow), the glove, the arrow, the hearts */',
  `  --nc-win-frame-hot: ${frame('hot')};`,
  `  --nc-win-frame-cool: ${frame('cool')};`,
  `  --nc-win-frame-hot-flat: ${frame('hot', false)};`,
  `  --nc-win-frame-cool-flat: ${frame('cool', false)};`,
  `  --nc-glove16: ${art(GLOVE16)};`,
  `  --nc-more16: ${svgUrl(rectsToSvg(11, 6, more16Rects()))};`,
  ...Object.entries(HEARTS16).map(([k, rows]) => `  --nc-heart16-${k}: ${art(rows)};`),
  '}',
  '',
].join('\n')
out('src/css/colors.css', colorsCss)

// --- CSS bundle -------------------------------------------------------------
const index = readFileSync(join(repo, 'src/css/index.css'), 'utf8')
const parts = [...index.matchAll(/@import\s+"\.\/([^"]+)";/g)].map(m => m[1])
const pixelWoff2 = readFileSync(join(repo, 'dist/fonts/neon-pixel.woff2')).toString('base64')
const pixel16Woff2 = readFileSync(join(repo, 'dist/fonts/neon-pixel-16.woff2')).toString('base64')
let css = BANNER + '\n'
for (const file of parts) {
  let text = file === 'colors.css' ? colorsCss : readFileSync(join(repo, 'src/css', file), 'utf8')
  if (file === 'fonts.css') {
    // Neon Pixel travels inside the CSS (2 KB), so one file is the whole look.
    text = text.replace(
      /(font-family: "Neon Pixel";[\s\S]*?)src: [^;]+;/,
      `$1src: url("data:font/woff2;base64,${pixelWoff2}") format("woff2");`,
    )
    text = text.replace(
      /(font-family: "Neon Pixel 16";[\s\S]*?)src: [^;]+;/,
      `$1src: url("data:font/woff2;base64,${pixel16Woff2}") format("woff2");`,
    )
    text = text.replaceAll('../../dist/fonts/', 'fonts/')
  }
  css += `\n/* ---- ${file} ---- */\n` + text
}
out('dist/neon-coast.css', css)
const minCss = (await esbuild.transform(css, { loader: 'css', minify: true, legalComments: 'inline' })).code
out('dist/neon-coast.min.css', minCss)

// --- JS bundle --------------------------------------------------------------
async function bundle(/** @type {boolean} */ minify) {
  const r = await esbuild.build({
    entryPoints: [join(repo, 'src/js/index.js')],
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify,
    write: false,
    banner: { js: BANNER },
    legalComments: 'none',
  })
  return r.outputFiles[0].text
}
out('dist/neon-coast.js', await bundle(false))
out('dist/neon-coast.min.js', await bundle(true))

// --- tokens.json ------------------------------------------------------------
const tokens = {
  $description: 'Neon Coast design tokens. CSS custom property names are --nc-<name>.',
  color: COLORS,
  sky: SKY,
  sun: SUN,
  window: WINDOW,
  windowTeal: WINDOW_TEAL,
  win16: { ...WIN16, ramps: WIN16_RAMPS },
  text16: TEXT16,
  ink16: INK16,
  ui: UI,
  role: Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, COLORS[/** @type {keyof typeof COLORS} */ (v)]])),
  palette: PAL,
  unit: '2px',
  font: {
    pixel: '"Neon Pixel", "Space Mono", ui-monospace, monospace',
    pixel16: '"Neon Pixel 16", "Neon Pixel", "Space Mono", ui-monospace, monospace',
    body: '"Space Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"Space Mono", ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace',
  },
  size: { 0: '8px', 1: '16px', 2: '24px', 3: '32px', 4: '48px', 5: '64px' },
  space: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px' },
}
out('dist/tokens.json', JSON.stringify(tokens, null, 2) + '\n')

// --- types ------------------------------------------------------------------
const typesTmp = mkdtempSync(join(tmpdir(), 'nc-types-'))
execFileSync(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '-p', join(repo, 'tsconfig.types.json'), '--outDir', typesTmp], { stdio: 'inherit' })
for (const f of readdirSync(typesTmp)) out(join('dist/types', f), readFileSync(join(typesTmp, f), 'utf8'))
rmSync(typesTmp, { recursive: true, force: true })

// --- write or check ---------------------------------------------------------
let stale = 0
for (const [path, text] of outputs) {
  const now = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (now === text) continue
  if (check) {
    console.error('stale:', relative(repo, path))
    stale++
  } else {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
    console.log('wrote', relative(repo, path), `(${(Buffer.byteLength(text) / 1024).toFixed(1)} KB)`)
  }
}
if (check && stale) {
  console.error(`${stale} file(s) out of date — run npm run build`)
  process.exit(1)
}
if (check) console.log('dist is up to date')
