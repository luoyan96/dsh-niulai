import type { Context } from '@deepseek-ai/cordis'
import css from './niulai.module.css'
import { themeAssets } from './generated/assets.ts'

type ThemeId = keyof typeof themeAssets
type ModuleSystem = { import(id: string): Promise<unknown> }

declare global { var __DSH_MODULES__: ModuleSystem | undefined }

const STORAGE_KEY = 'dsh-niulai-theme'
const COMPANION_STORAGE_KEY = 'dsh-niulai-companion-position'
const BETTER_SIDEBAR_ID = 'dsh-better-sidebar'

function themeFromStorage(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'niulai' || stored === 'niulaima' ? stored : 'huabao'
  } catch { return 'huabao' }
}
function storeTheme(theme: ThemeId): void { try { window.localStorage.setItem(STORAGE_KEY, theme) } catch {} }

async function detectBetterSidebar(ctx: Context, modules: ModuleSystem): Promise<boolean> {
  await new Promise<void>(resolve => window.setTimeout(resolve, 0))
  const get = (ctx as Context & { get?: (id: string, strict?: boolean) => unknown }).get
  if (get?.('betterSidebar', false) !== undefined) return true
  try { await modules.import(BETTER_SIDEBAR_ID); return true } catch { return false }
}

function detectSidebarWithoutActivation(ctx: Context): () => void {
  const modules = globalThis.__DSH_MODULES__
  if (modules === undefined) return () => {}
  let disposed = false
  void detectBetterSidebar(ctx, modules).then(async enabled => {
    if (disposed) return
    document.body.toggleAttribute('data-niulai-better-sidebar', enabled)
  }).catch(() => { /* The host UI remains usable when no sidebar extension exists. */ })
  return () => { disposed = true }
}

function hostOverlayIsOpen(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="menu"], [role="listbox"]')).some(node => !node.hidden && window.getComputedStyle(node).display !== 'none')
}

const THEMES: ReadonlyArray<{ id: ThemeId, label: string }> = [
  { id: 'huabao', label: '花豹原野' },
  { id: 'niulai', label: '牛来晴野' },
  { id: 'niulaima', label: '牛来暮野' },
]

function mountSettingsControl(onTheme: (theme: ThemeId) => void): HTMLElement | undefined {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
  if (dialog === null) return undefined
  const appearance = Array.from(dialog.querySelectorAll<HTMLElement>('div, span, h2, h3, strong'))
    .find(element => element.textContent?.trim() === '外观')
  const target = dialog.querySelector<HTMLElement>('[data-settings-appearance]') ?? appearance?.parentElement?.parentElement ?? dialog
  if (target === null) return undefined
  const block = document.createElement('section')
  block.className = css.settingsBlock ?? ''
  block.dataset.niulaiControl = ''
  const label = document.createElement('strong')
  label.className = css.settingsLabel ?? ''
  label.textContent = '牛来主题'
  block.append(label)
  for (const { id, label: text } of THEMES) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = css.themeButton ?? ''
    button.dataset.niulaiTheme = id
    const preview = document.createElement('img')
    preview.src = themeAssets[id].background
    preview.alt = ''
    preview.setAttribute('aria-hidden', 'true')
    const name = document.createElement('span')
    name.textContent = text
    button.append(preview, name)
    button.addEventListener('click', () => onTheme(id))
    block.append(button)
  }
  target.append(block)
  return block
}

function findComposer(): DOMRect | undefined {
  return Array.from(document.querySelectorAll('textarea'))
    .map(element => element.getBoundingClientRect())
    .filter(rect => rect.width >= 320 && rect.height >= 40)
    .sort((left, right) => right.width - left.width)[0]
}

function readCompanionPosition(): { left: number, top: number } | undefined {
  try {
    const value = JSON.parse(window.localStorage.getItem(COMPANION_STORAGE_KEY) ?? '{}') as { left?: unknown, top?: unknown }
    return typeof value.left === 'number' && typeof value.top === 'number' ? { left: value.left, top: value.top } : undefined
  } catch { return undefined }
}
function storeCompanionPosition(left: number, top: number): void {
  try { window.localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify({ left, top })) } catch {}
}

export const inject = ['slots', 'locale', 'connection', 'settingsScope', 'remote', 'sessions', 'workspaces']

/** Owns every DOM write so HMR, disable, and reapply fully retract the skin. */
export function apply(ctx: Context): void {
  const body = document.body
  const original = {
    skin: body.getAttribute('data-dsh-niulai'), theme: body.getAttribute('data-niulai-theme'),
    art: body.style.getPropertyValue('--niulai-art'), artPriority: body.style.getPropertyPriority('--niulai-art'),
    sidebar: body.getAttribute('data-niulai-better-sidebar'), overlay: body.getAttribute('data-niulai-overlay-open'), narrow: body.getAttribute('data-niulai-narrow'),
    settings: body.getAttribute('data-niulai-settings-open'), title: document.title,
  }
  const initialTitle = document.title
  let renderedTitle = initialTitle
  let theme = themeFromStorage()
  let control: HTMLElement | undefined
  let companionFrame: number | undefined
  const companion = document.createElement('button')
  companion.type = 'button'
  companion.className = css.companion ?? ''
  companion.dataset.niulaiCompanion = ''
  companion.setAttribute('aria-label', '拖动牛来宠物')
  const companionImage = document.createElement('img')
  companionImage.alt = ''
  companionImage.setAttribute('aria-hidden', 'true')
  companion.append(companionImage)
  body.append(companion)
  let dragStart: { x: number, y: number, left: number, top: number } | undefined

  const moveCompanion = (left: number, top: number): void => {
    const width = companion.getBoundingClientRect().width || 96
    const safeLeft = Math.round(Math.max(12, Math.min(window.innerWidth - width - 12, left)))
    const safeTop = Math.round(Math.max(52, Math.min(window.innerHeight - width - 18, top)))
    companion.style.left = `${safeLeft}px`; companion.style.top = `${safeTop}px`
  }
  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    const rect = companion.getBoundingClientRect()
    dragStart = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top }
    companion.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent): void => {
    if (dragStart === undefined) return
    moveCompanion(dragStart.left + event.clientX - dragStart.x, dragStart.top + event.clientY - dragStart.y)
  }
  const onPointerUp = (event: PointerEvent): void => {
    if (dragStart === undefined) return
    const rect = companion.getBoundingClientRect()
    storeCompanionPosition(rect.left, rect.top)
    dragStart = undefined
    if (companion.hasPointerCapture(event.pointerId)) companion.releasePointerCapture(event.pointerId)
  }
  companion.addEventListener('pointerdown', onPointerDown)
  companion.addEventListener('pointermove', onPointerMove)
  companion.addEventListener('pointerup', onPointerUp)

  const positionCompanion = (): void => {
    const composer = findComposer()
    const blocked = body.hasAttribute('data-niulai-overlay-open') || body.hasAttribute('data-niulai-settings-open') || body.hasAttribute('data-niulai-narrow')
    if (composer === undefined || blocked) { companion.hidden = true; return }
    const width = Math.min(108, Math.max(74, composer.width * .12))
    companion.hidden = false
    companion.style.width = `${Math.round(width)}px`
    const stored = readCompanionPosition()
    if (stored !== undefined) { moveCompanion(stored.left, stored.top); return }
    if (composer.right + width + 24 <= window.innerWidth) { moveCompanion(composer.right + 18, composer.bottom - width); return }
    if (composer.left - width - 24 >= 0) { moveCompanion(composer.left - width - 18, composer.bottom - width); return }
    companion.hidden = true
  }

  const update = (next: ThemeId): void => {
    theme = next
    body.dataset.niulaiTheme = theme
    body.style.setProperty('--niulai-art', `url("${themeAssets[theme].background}")`)
    companionImage.src = themeAssets[theme].companion
    storeTheme(theme)
    renderedTitle = `牛来 · ${THEMES.find(item => item.id === theme)?.label ?? '晴野'} · DeepSeek Harness`
    document.title = renderedTitle
    control?.querySelectorAll<HTMLButtonElement>('[data-niulai-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.niulaiTheme === theme)))
    positionCompanion()
  }
  body.dataset.dshNiulai = ''
  update(theme)
  const refreshSafety = (): void => {
    const settingsOpen = document.querySelector('[role="dialog"]') !== null
    body.toggleAttribute('data-niulai-settings-open', settingsOpen)
    body.toggleAttribute('data-niulai-overlay-open', hostOverlayIsOpen() && !settingsOpen)
    body.toggleAttribute('data-niulai-narrow', window.innerWidth < 860)
    if (settingsOpen && control === undefined) { control = mountSettingsControl(update); update(theme) }
    if (!settingsOpen && control !== undefined) { control.remove(); control = undefined }
    if (companionFrame !== undefined) window.cancelAnimationFrame(companionFrame)
    companionFrame = window.requestAnimationFrame(() => { companionFrame = undefined; positionCompanion() })
  }
  const observer = new MutationObserver(refreshSafety)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-expanded'] })
  const onResize = () => refreshSafety()
  window.addEventListener('resize', onResize)
  refreshSafety()
  const stopClients = detectSidebarWithoutActivation(ctx)

  ctx.effect(() => () => {
    stopClients(); observer.disconnect(); window.removeEventListener('resize', onResize); if (companionFrame !== undefined) window.cancelAnimationFrame(companionFrame); control?.remove(); companion.removeEventListener('pointerdown', onPointerDown); companion.removeEventListener('pointermove', onPointerMove); companion.removeEventListener('pointerup', onPointerUp); companion.remove()
    const restore = (name: string, value: string | null) => value === null ? body.removeAttribute(name) : body.setAttribute(name, value)
    restore('data-dsh-niulai', original.skin); restore('data-niulai-theme', original.theme); restore('data-niulai-better-sidebar', original.sidebar)
    restore('data-niulai-overlay-open', original.overlay); restore('data-niulai-settings-open', original.settings); restore('data-niulai-narrow', original.narrow)
    if (original.art === '') body.style.removeProperty('--niulai-art'); else body.style.setProperty('--niulai-art', original.art, original.artPriority)
    if (document.title === renderedTitle) document.title = original.title
  }, 'ui-skin-niulai: translucent pasture theme')
}
