#!/usr/bin/env node
// Copies the two companion faces (latin subset, woff2) from @fontsource into
// dist/fonts, with their licence:
//   Space Grotesk 300 400 500 700 — the human voice: prose, long text
//   Space Mono 400 700            — the machine voice: code, numbers, inputs
//   node scripts/copy-fonts.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(repo, 'dist/fonts')
mkdirSync(out, { recursive: true })

const FACES = {
  'space-grotesk': [300, 400, 500, 700],
  'space-mono': [400, 700],
}

const licences = []
for (const [family, weights] of Object.entries(FACES)) {
  const pkg = join(repo, 'node_modules/@fontsource', family)
  for (const w of weights) {
    const file = `${family}-latin-${w}-normal.woff2`
    copyFileSync(join(pkg, 'files', file), join(out, file))
    console.log('copied', file)
  }
  licences.push(readFileSync(join(pkg, 'LICENSE'), 'utf8').trim())
}
writeFileSync(join(out, 'OFL.txt'), licences.join('\n\n' + '-'.repeat(72) + '\n\n') + '\n')
console.log('wrote OFL.txt')
