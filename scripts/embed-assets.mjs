import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const output = resolve('src/client/generated/assets.ts')
const sourcePairs = [
  ['huabao', 'huabao.png', 'huabao-renwu.jpg'],
  ['niulai', 'niulai.png', 'niulai-renwu.jpg'],
  ['niulaima', 'niulaima.png', 'niulaima-renwu.jpg'],
]
const entries = await Promise.all(sourcePairs.map(async ([id, backgroundFile, companionFile]) => [id, {
  background: `data:image/png;base64,${(await readFile(resolve(backgroundFile))).toString('base64')}`,
  companion: `data:image/jpeg;base64,${(await readFile(resolve(companionFile))).toString('base64')}`,
}]))
const assets = Object.fromEntries(entries)
await mkdir(dirname(output), { recursive: true })
await writeFile(output, [
  '// Generated at build time from repository-owner supplied artwork.',
  `export const themeAssets = ${JSON.stringify(assets)} as const;`,
  '',
].join('\n'))
