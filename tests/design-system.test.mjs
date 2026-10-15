import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

test('the claude.ai design system exports cleanly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nc-ds-'))
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/export-design-system.mjs', import.meta.url)), dir], { stdio: 'pipe' })
    const p = join(dir, 'project')
    const tokens = JSON.parse(readFileSync(join(p, 'tokens.json'), 'utf8'))
    const names = new Set()
    for (const [family, f] of Object.entries(tokens)) {
      if (!f?.tokens) continue
      for (const t of f.tokens) {
        assert.match(t.name, /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/, t.name)
        assert.ok(!names.has(t.name), `${t.name} twice`)
        names.add(t.name)
        assert.ok(t.usage, `${family}/${t.name} has no usage note`)
      }
    }
    for (const t of tokens.color.tokens) {
      const v = String(t.value)
      if (v.startsWith('{')) assert.ok(names.has(v.slice(1, -1)), `${t.name} aliases a missing token`)
      else assert.match(v, /^(#[0-9a-f]{6}|rgba\([\d., ]+\))$/, t.name)
    }
    for (const f of tokens.type.fonts) assert.ok(existsSync(join(p, f.file)), f.file)
    const js = readFileSync(join(p, 'components/bundle.js'), 'utf8')
    assert.ok(js.startsWith('/* @ds-bundle: '), 'bundle header on line 1')
    assert.doesNotMatch(js, /<\/script|<!--/i)
    assert.doesNotMatch(readFileSync(join(p, 'components/bundle.css'), 'utf8'), /<\/style/i)
    for (const c of readdirSync(join(p, 'components'), { withFileTypes: true }).filter(d => d.isDirectory())) {
      const preview = readFileSync(join(p, 'components', c.name, 'preview.html'), 'utf8')
      assert.match(preview.split('\n')[0], /^<!-- @dsCard .*height=\d+/, `${c.name} preview marker`)
      if (c.name !== 'Cover') assert.ok(existsSync(join(p, 'components', c.name, 'README.md')), `${c.name} README`)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
