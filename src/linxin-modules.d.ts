declare module '@linxin666/dsh-client-ui-web-ui-settings' {
  import type { Context } from '@deepseek-ai/cordis'
  export const inject: readonly string[]
  export function apply(ctx: Context): void
}
declare module '@linxin666/dsh-client-ui-task-board' {
  import type { Context } from '@deepseek-ai/cordis'
  export const inject: readonly string[]
  export function apply(ctx: Context): void
}
declare module '@linxin666/dsh-live-stats' {
  import type { Context } from '@deepseek-ai/cordis'
  export const inject: readonly string[]
  export function apply(ctx: Context): void
}
