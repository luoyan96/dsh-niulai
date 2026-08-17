// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testWindow = window as unknown as Window & { __ModuleLoader__: { load(value: unknown): void } }
testWindow.__ModuleLoader__ = { load: () => {} }
const { apply } = await import('../src/client/index.ts')

type Disposer = () => void
const flush = () => new Promise<void>(resolve => window.setTimeout(resolve, 0))
function applySkin(): Disposer {
  let dispose: Disposer | undefined
  apply({ effect(factory: () => Disposer) { dispose = factory() } } as never)
  if (dispose === undefined) throw new Error('missing disposer')
  return dispose
}

describe('Niulai skin', () => {
  beforeEach(() => {
    window.localStorage.clear(); document.title = 'DeepSeek Harness'
    document.body.removeAttribute('data-dsh-niulai'); document.body.removeAttribute('data-niulai-theme')
    document.body.removeAttribute('data-niulai-better-sidebar'); document.body.innerHTML = '<main id="root"><textarea></textarea></main>'
    vi.unstubAllGlobals()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('uses Better Sidebar without loading legacy panels', async () => {
    const applied: string[] = []
    vi.stubGlobal('__DSH_MODULES__', { import: vi.fn(async (id: string) => ({ apply: () => applied.push(id) })) })
    const dispose = applySkin(); await flush()
    expect(document.body.hasAttribute('data-niulai-better-sidebar')).toBe(true)
    expect(applied).not.toContain('@linxin666/dsh-client-ui-aionui-panel')
    expect(applied).not.toContain('@linxin666/dsh-client-ui-git-graph')
    dispose()
  })

  it('falls back to legacy panels when Better Sidebar is absent', async () => {
    const applied: string[] = []
    vi.stubGlobal('__DSH_MODULES__', { import: vi.fn(async (id: string) => {
      if (id === 'dsh-better-sidebar') throw new Error('not installed')
      return { apply: () => applied.push(id) }
    }) })
    const dispose = applySkin(); await flush()
    expect(applied).toContain('@linxin666/dsh-client-ui-aionui-panel')
    expect(applied).toContain('@linxin666/dsh-client-ui-git-graph')
    dispose()
  })

  it('retracts attributes, art, controls, observer effects, and listeners', async () => {
    const dispose = applySkin()
    const dialog = document.createElement('div'); dialog.setAttribute('role', 'dialog'); document.body.append(dialog)
    await Promise.resolve()
    expect(document.querySelector('[data-niulai-control]')).not.toBeNull()
    dispose()
    expect(document.body.hasAttribute('data-dsh-niulai')).toBe(false)
    expect(document.body.style.getPropertyValue('--niulai-art')).toBe('')
    expect(document.querySelector('[data-niulai-control]')).toBeNull()
    dialog.remove(); await Promise.resolve()
    expect(document.body.hasAttribute('data-niulai-settings-open')).toBe(false)
  })

  it('does not write or activate after disposal wins the async probe', async () => {
    let resolveProbe: ((value: unknown) => void) | undefined
    const applied = vi.fn()
    vi.stubGlobal('__DSH_MODULES__', { import: vi.fn((id: string) => id === 'dsh-better-sidebar'
      ? new Promise(resolve => { resolveProbe = resolve }) : Promise.resolve({ apply: applied })) })
    const dispose = applySkin(); await flush(); dispose(); resolveProbe?.({}); await flush()
    expect(document.body.hasAttribute('data-niulai-better-sidebar')).toBe(false)
    expect(applied).not.toHaveBeenCalled()
  })

  it('persists a settings theme choice and restores it on reapply', async () => {
    const dialog = document.createElement('div'); dialog.setAttribute('role', 'dialog'); document.body.append(dialog)
    const dispose = applySkin(); await Promise.resolve()
    document.querySelector<HTMLButtonElement>('[data-niulai-theme="dusk"]')?.click()
    expect(window.localStorage.getItem('dsh-niulai-theme')).toBe('dusk')
    dispose(); const second = applySkin()
    expect(document.body.dataset.niulaiTheme).toBe('dusk')
    second()
  })

  it('hides background decoration for menus, settings, and narrow screens', async () => {
    const dispose = applySkin()
    const menu = document.createElement('div'); menu.setAttribute('role', 'menu'); document.body.append(menu)
    await Promise.resolve(); expect(document.body.hasAttribute('data-niulai-overlay-open')).toBe(true)
    menu.remove(); const dialog = document.createElement('div'); dialog.setAttribute('role', 'dialog'); document.body.append(dialog)
    await Promise.resolve(); expect(document.body.hasAttribute('data-niulai-settings-open')).toBe(true)
    expect(document.querySelector('[data-niulai-control]')).not.toBeNull()
    Object.defineProperty(window, 'innerWidth', { value: 640, configurable: true })
    window.dispatchEvent(new Event('resize'))
    expect(document.body.hasAttribute('data-niulai-narrow')).toBe(true)
    dispose()
  })
})
