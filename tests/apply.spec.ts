// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testWindow = window as unknown as Window & { __ModuleLoader__: { load(value: unknown): void } }
testWindow.__ModuleLoader__ = { load: () => {} }
const { apply } = await import('../src/client/index.ts')

type Disposer = () => void
const flush = () => new Promise<void>(resolve => window.setTimeout(resolve, 0))
const activeDisposers: Disposer[] = []
function applySkin(): Disposer {
  let dispose: Disposer | undefined
  apply({ effect(factory: () => Disposer) { dispose = factory() } } as never)
  if (dispose === undefined) throw new Error('missing disposer')
  activeDisposers.push(dispose)
  return dispose
}

describe('Niulai skin', () => {
  beforeEach(() => {
    window.localStorage.clear(); document.title = 'DeepSeek Harness'
    document.body.removeAttribute('data-dsh-niulai'); document.body.removeAttribute('data-niulai-theme')
    document.body.removeAttribute('data-niulai-better-sidebar'); document.body.innerHTML = '<main id="root"><textarea></textarea></main>'
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    while (activeDisposers.length > 0) activeDisposers.pop()?.()
    vi.unstubAllGlobals()
  })

  it('detects Better Sidebar without loading legacy panels', async () => {
    const modules = { import: vi.fn(async () => ({})) }
    vi.stubGlobal('__DSH_MODULES__', modules)
    const dispose = applySkin(); await flush(); await flush()
    expect(document.body.hasAttribute('data-niulai-better-sidebar')).toBe(true)
    expect(modules.import).toHaveBeenCalledTimes(1)
    expect(modules.import).toHaveBeenCalledWith('dsh-better-sidebar')
    dispose()
  })

  it('uses the native UI as a safe fallback when Better Sidebar is absent', async () => {
    const modules = { import: vi.fn(async (id: string) => {
      if (id === 'dsh-better-sidebar') throw new Error('not installed')
      return {}
    }) }
    vi.stubGlobal('__DSH_MODULES__', modules)
    const dispose = applySkin(); await flush(); await flush()
    expect(document.body.hasAttribute('data-niulai-better-sidebar')).toBe(false)
    expect(modules.import).toHaveBeenCalledTimes(1)
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
    expect(document.querySelector('[data-niulai-companion]')).toBeNull()
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

  it('uses every same-named background and companion pair, then persists the choice', async () => {
    const dialog = document.createElement('div'); dialog.setAttribute('role', 'dialog'); document.body.append(dialog)
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea')
    if (textarea !== null) textarea.getBoundingClientRect = () => ({ x: 100, y: 300, top: 300, right: 760, bottom: 390, left: 100, width: 660, height: 90, toJSON: () => ({}) })
    const dispose = applySkin(); await Promise.resolve()
    expect(document.querySelectorAll('button[data-niulai-theme]')).toHaveLength(3)
    document.querySelector<HTMLButtonElement>('[data-niulai-theme="niulai"]')?.click()
    expect(document.body.style.getPropertyValue('--niulai-art')).toContain('data:image/png;base64')
    expect(document.querySelector<HTMLImageElement>('[data-niulai-companion] img')?.src).toContain('data:image/jpeg;base64')
    expect(window.localStorage.getItem('dsh-niulai-theme')).toBe('niulai')
    dispose(); const second = applySkin()
    expect(document.body.dataset.niulaiTheme).toBe('niulai')
    second()
  })

  it('floats beside the composer and remembers a dragged companion position', async () => {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea')
    if (textarea !== null) textarea.getBoundingClientRect = () => ({ x: 120, y: 300, top: 300, right: 720, bottom: 328, left: 120, width: 600, height: 28, toJSON: () => ({}) })
    const dispose = applySkin(); await flush()
    const companion = document.querySelector<HTMLButtonElement>('[data-niulai-companion]')
    if (companion === null) throw new Error('missing companion')
    companion.setPointerCapture = vi.fn(); companion.hasPointerCapture = vi.fn(() => true); companion.releasePointerCapture = vi.fn()
    companion.getBoundingClientRect = () => {
      const left = Number.parseInt(companion.style.left || '738', 10)
      const top = Number.parseInt(companion.style.top || '310', 10)
      return { x: left, y: top, top, right: left + 74, bottom: top + 74, left, width: 74, height: 74, toJSON: () => ({}) }
    }
    expect(companion.hidden).toBe(false)
    const pointer = (type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY })
      Object.defineProperty(event, 'pointerId', { value: 1 })
      return event
    }
    companion.dispatchEvent(pointer('pointerdown', 760, 340))
    companion.dispatchEvent(pointer('pointermove', 820, 420))
    companion.dispatchEvent(pointer('pointerup', 820, 420))
    expect(companion.style.left).toBe('798px')
    expect(companion.style.top).toBe('334px')
    expect(window.localStorage.getItem('dsh-niulai-companion-position')).toContain('798')
    dispose()
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
