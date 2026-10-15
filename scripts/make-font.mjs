#!/usr/bin/env node
// Builds Neon Pixel (dist/fonts/neon-pixel.woff2, .woff and .ttf) from the
// glyph table the canvas draws with (src/js/font.js), so HTML text and
// canvas text are the same letters. Node dumps the glyphs, make-font.py
// draws them with fontTools:
//   pip install fonttools brotli
//   node scripts/make-font.mjs
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { GLYPHS, ABOVE, ALIAS } from '../src/js/font.js'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** @type {Record<string, string[]>} */
const glyphs = {}
for (const [ch, rows] of Object.entries(GLYPHS)) glyphs[ch] = [...(ABOVE[ch] ?? []), ...rows]
// Characters drawn with another glyph: with their marks when they have them (Ä = A + dots).
for (const [ch, to] of Object.entries(ALIAS)) {
  if (glyphs[ch] || !GLYPHS[to]) continue
  glyphs[ch] = [...(ABOVE[ch] ?? []), ...GLYPHS[to]]
}

const dir = mkdtempSync(join(tmpdir(), 'neon-pixel-'))
const json = join(dir, 'glyphs.json')
writeFileSync(json, JSON.stringify(glyphs))
const out = join(repo, 'dist/fonts')
mkdirSync(out, { recursive: true })
execFileSync('python3', [join(repo, 'scripts/make-font.py'), json, join(out, 'neon-pixel')], { stdio: 'inherit' })
