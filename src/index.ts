import type { Context } from '@deepseek-ai/cordis'

/**
 * Niulai is a skin only. It intentionally does not activate workbench
 * modules, which may already be supplied by another plugin in a DSH profile.
 */
export const inject: readonly string[] = []
export function apply(_ctx: Context): void {}
