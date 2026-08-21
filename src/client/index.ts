import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { GithubApi } from './api.ts'
import { PanelController } from './controller.ts'
import { mountPanel } from './mount.tsx'
import { mountSidebar } from './sidebar.ts'
import { installStyles } from './styles.ts'
export const inject = ['locale']
export function apply(ctx: ClientContext): void { installStyles(); const controller = new PanelController(); const api = new GithubApi(); const disposers = [mountSidebar(controller), mountPanel(controller, api)]; ctx.effect(() => () => { for (const dispose of disposers) dispose() }, 'dsh-github: ui mounts') }
