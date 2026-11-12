#!/usr/bin/env node
// Builds Neon Pixel 16 (dist/fonts/neon-pixel-16.woff2, .woff and .ttf) from
// the 16-bit glyph table the canvas draws with (src/js/font16.js), so HTML
// text and canvas text are the same letters. Node dumps the glyphs,
// make-font16.py draws them with fontTools:
//   pip install fonttools brotli
//   node scripts/make-font16.mjs
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { GLYPHS16, MARKS16_ABOVE, MARKS16_BELOW, ALIAS16, WEBFONT16_EXTRA, WEBFONT16_ALIAS } from '../src/js/font16.js'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** @type {Record<string, { rows: string[], above: number }>} */
const glyphs = {}
/** @param {string} ch @param {string[]} base */
const add = (ch, base) => {
  const above = MARKS16_ABOVE[ch] ?? []
  glyphs[ch] = { rows: [...above, ...base, ...(MARKS16_BELOW[ch] ?? [])], above: above.length }
}
for (const [ch, rows] of Object.entries(GLYPHS16)) add(ch, rows)
// Characters drawn with another glyph: with their marks when they have them (É = E + accent).
for (const [ch, to] of Object.entries(ALIAS16)) if (!GLYPHS16[ch] && GLYPHS16[to]) add(ch, GLYPHS16[to])
// The webfont's stand-ins (▶ ◀ ▲ ▼ ■ | [ ] @ ❚ ♪) and its few extra aliases.
for (const [ch, rows] of Object.entries(WEBFONT16_EXTRA)) if (!GLYPHS16[ch]) add(ch, rows)
for (const [ch, to] of Object.entries(WEBFONT16_ALIAS)) if (!glyphs[ch] && GLYPHS16[to]) add(ch, GLYPHS16[to])

const dir = mkdtempSync(join(tmpdir(), 'neon-pixel-16-'))
const json = join(dir, 'glyphs.json')
writeFileSync(json, JSON.stringify(glyphs))
const out = join(repo, 'dist/fonts')
mkdirSync(out, { recursive: true })
execFileSync('python3', [join(repo, 'scripts/make-font16.py'), json, join(out, 'neon-pixel-16')], { stdio: 'inherit' })
