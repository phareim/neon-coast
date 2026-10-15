import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PAL } from '../src/js/tokens.js'
import { SPRITES, shade, relight, bayer, mix } from '../src/js/sprites.js'
import { parseRows } from '../src/js/elements.js'

test('built-in sprites are rectangles of palette letters', () => {
  for (const [name, rows] of Object.entries(SPRITES)) {
    const w = rows[0].length
    for (const row of rows) {
      assert.equal(row.length, w, `${name} is ragged`)
      for (const ch of row) assert.ok(ch === '.' || PAL[ch], `${name} uses '${ch}'`)
    }
  }
})

test('shade outlines an X map and lights its top', () => {
  const out = shade(['XX', 'XX'], 'p', 'm', 'P')
  assert.deepEqual(out, ['.kk.', 'kmmk', 'kPPk', '.kk.'])
})

test('relight steps pixels under open space one shade up', () => {
  assert.deepEqual(relight(['.p.', 'ppp']), ['.m.', 'mpm'])
})

test('bayer thresholds cover 0–1 and mix blends', () => {
  const seen = new Set()
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seen.add(bayer(x, y))
  assert.equal(seen.size, 16)
  for (const v of seen) assert.ok(v > 0 && v < 1)
  assert.equal(mix('#000000', '#ffffff', 0.5), '#808080')
})

test('sprite text: trimmed, blank lines dropped, short rows padded', () => {
  assert.deepEqual(parseRows('\n   .kk\n   kpppk  \n\n'), ['.kk..', 'kpppk'])
})

test('the package imports on a server without a DOM', async () => {
  const nc = await import('../src/js/index.js')
  assert.equal(typeof nc.createPixelStage, 'function')
  assert.equal(typeof nc.defineElements, 'function')
})
