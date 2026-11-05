import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const assetRoot = path.join(root, 'public/assets')
const manifest = JSON.parse(await readFile(path.join(assetRoot, 'figma-manifest.json'), 'utf8'))
const errors = []
for (const asset of manifest.assets) {
  try {
    const bytes = await readFile(path.join(assetRoot, asset.file))
    if (!bytes.length || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
      errors.push(`원본과 다름: ${asset.file}`)
    }
  } catch { errors.push(`누락: ${asset.file}`) }
}
async function checkReferences(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name)
    if (entry.isDirectory()) { await checkReferences(name); continue }
    if (!/\.(tsx?|css)$/.test(name)) continue
    const source = await readFile(name, 'utf8')
    if (/https:\/\/www\.figma\.com\/api\/mcp\/asset\//.test(source)) errors.push(`임시 URL 참조: ${name}`)
    for (const match of source.matchAll(/['"]\/assets\/([^'"$`]+\.(?:png|svg))['"]/g)) {
      try { await readFile(path.join(assetRoot, match[1])) }
      catch { errors.push(`참조 파일 누락: ${match[1]} (${name})`) }
    }
  }
}
await checkReferences(path.join(root, 'src'))
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
else console.log(`Figma 원본 에셋 ${manifest.assets.length}개: 해시·파일·로컬 참조 확인 완료`)
