import type { Context } from '@deepseek-ai/cordis'
import { apply as applySettings, inject as settingsInject } from '@linxin666/dsh-client-ui-web-ui-settings'
import { apply as applyTaskBoard, inject as taskBoardInject } from '@linxin666/dsh-client-ui-task-board'
import { apply as applyLiveStats, inject as liveStatsInject } from '@linxin666/dsh-live-stats'

export const inject = [...new Set([...settingsInject, ...taskBoardInject, ...liveStatsInject])]

/** Server-side wiring is deliberately limited to modules that are not replaced by Better Sidebar. */
export function apply(ctx: Context): void {
  applySettings(ctx as never)
  applyTaskBoard(ctx as never)
  applyLiveStats(ctx as never)
}
