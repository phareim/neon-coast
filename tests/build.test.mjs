import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('dist/ matches src/ (run npm run build after editing src)', () => {
  const script = fileURLToPath(new URL('../scripts/build.mjs', import.meta.url))
  assert.doesNotThrow(() => execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }))
})
