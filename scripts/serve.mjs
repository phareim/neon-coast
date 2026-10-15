#!/usr/bin/env node
// A tiny static server for the style guide and the examples:
//   node scripts/serve.mjs [port]   →   http://localhost:5173/
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.argv[2] ?? process.env.PORT ?? 5173)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
  if (path === '' || path.endsWith('/')) path += 'index.html'
  const file = join(root, path)
  if (!file.startsWith(root)) { res.writeHead(403).end(); return }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
  }
}).listen(port, () => console.log(`http://localhost:${port}/`))
