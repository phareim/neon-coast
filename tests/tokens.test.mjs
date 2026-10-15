import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PAL, COLORS, SKY, SUN, UI, ROLES } from '../src/js/tokens.js'

const hex = /^#[0-9a-f]{6}$/

test('palette letters are single characters with #rrggbb colours', () => {
  for (const [k, v] of Object.entries(PAL)) {
    assert.equal(k.length, 1)
    assert.notEqual(k, '.')
    assert.match(v, hex, k)
  }
})

test('named colours are palette colours, roles name colours', () => {
  const pal = new Set(Object.values(PAL))
  for (const [name, v] of Object.entries(COLORS)) assert.ok(pal.has(v), `${name} is not in PAL`)
  for (const [role, name] of Object.entries(ROLES)) assert.ok(COLORS[name], `${role} → unknown ${name}`)
  for (const v of [...SKY, ...SUN]) assert.match(v, hex)
  assert.equal(SKY.length, 8)
  assert.equal(SUN.length, 4)
})

test('colors.css carries every token', () => {
  const css = readFileSync(new URL('../src/css/colors.css', import.meta.url), 'utf8')
  for (const [name, v] of Object.entries({ ...COLORS, ...UI })) assert.ok(css.includes(`--nc-${name}: ${v};`), name)
  for (const role of Object.keys(ROLES)) assert.ok(css.includes(`--nc-${role}: var(`), role)
})

test('the CSS only uses tokens that exist', () => {
  const dist = readFileSync(new URL('../dist/neon-coast.css', import.meta.url), 'utf8')
  const defined = new Set([...dist.matchAll(/(--nc-[\w-]+)\s*:/g)].map(m => m[1]))
  // Tokens a page may set that the system only reads, with a fallback.
  const optional = new Set(['--nc-box-pad', '--nc-gap', '--nc-min', '--nc-title', '--nc-sun-size', '--nc-sun-band', '--nc-horizon-height', '--nc-scene-ratio'])
  for (const [, used] of dist.matchAll(/var\((--nc-[\w-]+)/g)) {
    assert.ok(defined.has(used) || optional.has(used), `${used} is used but never defined`)
  }
})
