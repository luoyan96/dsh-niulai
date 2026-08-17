import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const PACKAGE_ID = 'dsh-niulai'
const prefix = '\0niulai-css:'

function inlineCss() {
  return {
    name: 'niulai-inline-css',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      return `${prefix}${importer === undefined ? source : resolve(dirname(importer), source)}.mjs`
    },
    async load(id: string) {
      if (!id.startsWith(prefix)) return null
      const file = id.slice(prefix.length, -4)
      const compiled = transform({ filename: file, code: await readFile(file), cssModules: { pattern: '[hash]_[local]' }, minify: true })
      const classes: Record<string, string> = {}
      for (const [local, value] of Object.entries(compiled.exports ?? {})) classes[local] = value.name
      const tagId = `${PACKAGE_ID}/${basename(file)}`
      return [
        `const css=${JSON.stringify(compiled.code.toString())};`,
        `const id=${JSON.stringify(tagId)};`,
        'if(typeof document!=="undefined"&&!document.querySelector("style[data-plugin-css=\\\""+id+"\\\"]")){const tag=document.createElement("style");tag.dataset.plugin="dsh-niulai";tag.dataset.pluginCss=id;tag.textContent=css;document.head.append(tag)}',
        `export default ${JSON.stringify(classes)};`,
      ].join('\n')
    },
  }
}

export default [
  {
    entry: { index: 'src/index.ts' }, outDir: 'lib', format: 'esm', platform: 'node', target: 'es2024', dts: false, clean: false,
    deps: { neverBundle: id => id.startsWith('@deepseek-ai/'), onlyBundle: false },
  },
  {
    entry: { client: 'src/client/index.ts' }, outDir: 'lib', format: 'cjs', platform: 'browser', target: 'es2022', dts: false, sourcemap: true, clean: false,
    deps: { alwaysBundle: () => true, onlyBundle: false }, plugins: [inlineCss()],
    outputOptions: { entryFileNames: 'client.js', banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`, footer: 'return module.exports; } });', intro: 'var module={exports:{}};var exports=module.exports;' },
  },
] satisfies UserConfig[]
