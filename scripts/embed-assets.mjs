import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const output = resolve('src/client/generated/assets.ts')
const background = await readFile(resolve('huabao.png'))
await mkdir(dirname(output), { recursive: true })
await writeFile(output, [
  '// Generated at build time from repository-owner supplied artwork.',
  `export const meadowBackground = ${JSON.stringify(`data:image/png;base64,${background.toString('base64')}`)} as const;`,
  '',
].join('\n'))
