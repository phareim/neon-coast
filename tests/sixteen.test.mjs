import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GLYPHS16, MARKS16_ABOVE, MARKS16_BELOW, ALIAS16, WEBFONT16_EXTRA, WEBFONT16_ALIAS, CAP16, ABOVE16, BELOW16, glyphRows16, textWidth16, wrapText16 } from '../src/js/font16.js'
import { GLYPHS, textWidth } from '../src/js/font.js'
import { WIN16, WIN16_RAMPS, TEXT16, INK16, ramp5, rampAt, contrast } from '../src/js/tokens.js'
import { epx, quantize15, seloutPixels, ramp15 } from '../src/js/pixel16.js'
import { window16Rects, GLOVE16, HEARTS16 } from '../src/js/ui16.js'

test('every 16-bit glyph is twelve rows of one width, drawn with # and .', () => {
  for (const [ch, rows] of Object.entries({ ...GLYPHS16, ...WEBFONT16_EXTRA })) {
    assert.equal(rows.length, CAP16, `${ch} has ${rows.length} rows`)
    for (const row of rows) {
      assert.equal(row.length, rows[0].length, `${ch} has ragged rows`)
      assert.match(row, /^[#.]+$/, `${ch} has a stray character`)
    }
  }
})

test('marks fit their letters and every alias lands on a glyph', () => {
  for (const [ch, rows] of Object.entries(MARKS16_ABOVE)) {
    assert.ok(rows.length <= ABOVE16)
    for (const row of rows) assert.equal(row.length, glyphRows16(ch)[0].length, `${ch}'s mark`)
  }
  for (const [ch, rows] of Object.entries(MARKS16_BELOW)) {
    assert.ok(rows.length <= BELOW16)
    for (const row of rows) assert.equal(row.length, glyphRows16(ch)[0].length, `${ch}'s tail`)
  }
  for (const [ch, to] of Object.entries({ ...ALIAS16, ...WEBFONT16_ALIAS })) assert.ok(GLYPHS16[to], `${ch} aliases to missing ${to}`)
  for (const ch of Object.keys(WEBFONT16_EXTRA)) assert.ok(!GLYPHS16[ch], `${ch} is in both tables`)
  assert.deepEqual(glyphRows16('a'), GLYPHS16.A)
  assert.deepEqual(glyphRows16('§'), GLYPHS16['?'])
})

test('a line in the 16-bit font is never wider than in the 5×7 font at twice the size', () => {
  for (const ch of Object.keys(GLYPHS16)) {
    if (!GLYPHS[ch]) continue
    assert.ok(textWidth16(ch + ch) <= textWidth(ch + ch) * 2 + 2, `${ch} advances too far`)
  }
  assert.equal(textWidth16(''), 0)
  assert.equal(textWidth16('A'), 8)
  assert.equal(textWidth16('AI'), 8 + 2 + 4)
})

test('wrapText16 keeps lines inside the width and honours newlines', () => {
  const lines = wrapText16('THE SUN HAS HUNG ON THE HORIZON FOR THREE NIGHTS\nTAKE THE BLADE', 160)
  for (const l of lines) assert.ok(textWidth16(l) <= 160 || !l.includes(' '), l)
  assert.equal(lines.at(-1), 'TAKE THE BLADE')
  assert.deepEqual(wrapText16('SUPERCALIFRAGILISTIC', 10), ['SUPERCALIFRAGILISTIC'])
})

const fiveBit = (/** @type {string} */ hex) => [1, 3, 5].every(i => parseInt(hex.slice(i, i + 2), 16) % 8 === 0)

test('window ramps are five-bit bands in order, from the top colour to the bottom one', () => {
  for (const tone of [WIN16.hot, WIN16.cool]) {
    const bands = ramp5(tone)
    assert.ok(bands.length > 8, 'a ramp has many bands')
    assert.equal(bands[0].at, 0)
    assert.equal(bands[0].color, rampAt(tone, 0.001))
    assert.equal(bands.at(-1).color, rampAt(tone, 0.999))
    for (let i = 0; i < bands.length; i++) {
      assert.ok(fiveBit(bands[i].color), bands[i].color)
      if (i) {
        assert.ok(bands[i].at > bands[i - 1].at)
        assert.notEqual(bands[i].color, bands[i - 1].color)
      }
    }
  }
  for (const c of ramp15(['#100830', '#f8b070'], 9)) assert.ok(fiveBit(c), c)
})

test('the CSS ramps keep their letters at WCAG AA on the lightest band', () => {
  const lightest = (/** @type {{ color: string }[]} */ r) => r[0].color
  for (const t of [TEXT16.text, TEXT16.dim, TEXT16.cool, TEXT16.prize, TEXT16.ok]) assert.ok(contrast(t, lightest(WIN16_RAMPS.hot)) >= 4.5, t)
  assert.ok(contrast(TEXT16.text, lightest(WIN16_RAMPS.cool)) >= 4.5)
  assert.ok(contrast(TEXT16.prize, lightest(WIN16_RAMPS.plate)) >= 4.5)
  assert.ok(contrast(TEXT16.hot, lightest(WIN16_RAMPS.hot)) >= 3, 'pink is for 28 px and up')
})

test('colors.css carries the 16-bit tokens and pictures', () => {
  const css = readFileSync(new URL('../src/css/colors.css', import.meta.url), 'utf8')
  for (const k of ['hot', 'cool', 'plate']) assert.match(css, new RegExp(`--nc-win-${k}: linear-gradient\\(180deg, #`))
  for (const k of ['frame-hot', 'frame-cool', 'frame-hot-flat', 'frame-cool-flat']) assert.ok(css.includes(`--nc-win-${k}: url("data:image/svg+xml,`), k)
  for (const k of ['glove16', 'more16', 'heart16-full', 'heart16-half', 'heart16-empty']) assert.ok(css.includes(`--nc-${k}: url(`), k)
  assert.ok(css.includes(`--nc-win-outline: ${WIN16.outline};`))
  assert.ok(css.includes(`--nc-text16-prize: ${TEXT16.prize};`))
})

test('the window stays inside its canvas, and the icons use their palette', () => {
  for (const [w, h] of [[24, 24], [120, 40], [8, 8]]) {
    for (const [x, y, rw, rh] of window16Rects(w, h)) {
      assert.ok(x >= 0 && y >= 0 && x + rw <= w + 6 && y + rh <= h + 6, `${x},${y},${rw},${rh} in ${w}×${h}`)
    }
  }
  for (const rows of [GLOVE16, ...Object.values(HEARTS16)]) {
    for (const row of rows) {
      assert.equal(row.length, rows[0].length)
      for (const ch of row) assert.ok(ch === '.' || INK16[/** @type {keyof typeof INK16} */ (ch)], ch)
    }
  }
})

test('EPX gives a staircase its half step and adds no colours', () => {
  const out = epx([1, 2, 2, 2], 2, 2)
  assert.deepEqual([...out], [1, 1, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
  assert.deepEqual([...epx([5, 5, 5, 5], 2, 2)], Array(16).fill(5))
})

test('quantize15 keeps five bits a channel; selout colours an outline from inside', () => {
  const img = { data: new Uint8ClampedArray([128, 0, 255, 255]), width: 1, height: 1 }
  quantize15(img, { dither: false })
  assert.deepEqual([...img.data], [132, 0, 255, 255])
  // ink | pink | (see-through): the ink touches pink and takes it, darkened.
  const px = new Uint8ClampedArray([11, 6, 22, 255, 255, 47, 160, 255, 0, 0, 0, 0])
  seloutPixels(px, 3, 1)
  assert.deepEqual([...px.slice(0, 4)], [128, 24, 80, 255])
  assert.deepEqual([...px.slice(4)], [255, 47, 160, 255, 0, 0, 0, 0])
})
