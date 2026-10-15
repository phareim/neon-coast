import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GLYPHS, ABOVE, ALIAS, GLYPH_H, glyphRows, glyphAbove, textWidth, wrapText } from '../src/js/font.js'

test('every glyph is seven rows of one width, drawn with # and .', () => {
  for (const [ch, rows] of Object.entries(GLYPHS)) {
    assert.equal(rows.length, GLYPH_H, `${ch} has ${rows.length} rows`)
    const w = rows[0].length
    for (const row of rows) {
      assert.equal(row.length, w, `${ch} has ragged rows`)
      assert.match(row, /^[#.]+$/, `${ch} has a stray character`)
    }
  }
})

test('marks above the cap height match their letter and every alias lands on a glyph', () => {
  for (const [ch, rows] of Object.entries(ABOVE)) {
    const base = glyphRows(ch)
    for (const row of rows) assert.equal(row.length, base[0].length, `${ch}'s mark is not as wide as the letter`)
  }
  for (const [ch, to] of Object.entries(ALIAS)) assert.ok(GLYPHS[to], `${ch} aliases to missing ${to}`)
})

test('lower case draws as upper case, unknown characters as ?', () => {
  assert.deepEqual(glyphRows('a'), GLYPHS.A)
  assert.deepEqual(glyphRows('ø'), GLYPHS['Ø'])
  assert.deepEqual(glyphRows('ä'), GLYPHS.A)
  assert.deepEqual(glyphAbove('ä'), ABOVE['Ä'])
  assert.deepEqual(glyphRows('§'), GLYPHS['?'])
})

test('text width is the advances minus the last gap', () => {
  assert.equal(textWidth(''), 0)
  assert.equal(textWidth('A'), 5)
  assert.equal(textWidth('AI'), 5 + 1 + 3)
  assert.equal(textWidth('hi'), textWidth('HI'))
})

test('wrapText keeps lines inside the width and honours newlines', () => {
  const lines = wrapText('THE NEON COAST AT NIGHT\nTHE SUN', 60)
  for (const l of lines) assert.ok(textWidth(l) <= 60 || !l.includes(' '), l)
  assert.equal(lines.at(-1), 'THE SUN')
})
