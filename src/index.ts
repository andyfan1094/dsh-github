import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from 'schemastery'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import { GithubEngine } from './engine.ts'
import { makeRoutes } from './routes.ts'
import { GithubStore } from './store.ts'
import { githubAuthListTool, githubAuthTestTool, githubCloneTool, githubCommitTool, githubPullTool, githubPushTool, githubRepoListTool, githubStatusTool } from './tools.ts'

export const name = 'github'
export const inject = ['webServer', 'tools', 'systemPrompt']
export const GITHUB_SETTINGS_NAMESPACE = settingsNamespace('dsh-github')
export interface Config { enabled?: boolean; announceToAgent?: boolean }
export const Config: z<Config> = z.object({ enabled: z.boolean().default(true), announceToAgent: z.boolean().default(true) })
const GUIDANCE = '本机已安装 dsh-github 插件（GitHub 认证与本地 Git 工作流）：侧边栏「GitHub」入口；配置面板可管理 GitHub Token、API 地址、默认账号、默认仓库目录、Git 可执行文件、自动 fetch、push/force-push 安全开关。Agent 工具包括 github_auth_list、github_auth_test、github_repo_list、github_clone、github_pull、github_status、github_commit、github_push。Token 保存在 ~/.dsh/dsh-github.json（权限 0600），工具和面板只返回脱敏账号信息；push 默认关闭，强制推送需要额外开关。用户提到 GitHub 仓库、拉取、推送、提交、clone 或版本控制时使用这些工具。'

export const apply = (ctx: Context, config?: Config): void => {
  let current = (): Config => config ?? {}
  const store = new GithubStore()
  const engine = new GithubEngine(store)
  const routes = makeRoutes(engine)
  const toolList = [githubAuthListTool(engine), githubAuthTestTool(engine), githubRepoListTool(engine), githubCloneTool(engine), githubPullTool(engine), githubPushTool(engine), githubStatusTool(engine), githubCommitTool(engine)]
  let disposeRoutes: (() => void) | undefined
  let disposeTools: (() => void) | undefined
  let disposeSection: (() => void) | undefined
  const sync = (): void => {
    disposeSection?.(); disposeRoutes?.(); disposeTools?.(); disposeSection = undefined; disposeRoutes = undefined; disposeTools = undefined
    const value = current(); if (value.enabled === false) return
    if (value.announceToAgent !== false) disposeSection = ctx.systemPrompt.section({ name: 'plugin:dsh-github', order: 153, text: GUIDANCE })
    disposeRoutes = ctx.effect(() => { const disposers = routes.map(route => ctx.webServer.register(route)); return () => { for (const dispose of disposers) dispose() } }, 'dsh-github: routes')
    disposeTools = ctx.effect(() => { const disposers = toolList.map(tool => ctx.tools.register(tool)); return () => { for (const dispose of disposers) dispose() } }, 'dsh-github: tools')
  }
  installSettingsSection(ctx, GITHUB_SETTINGS_NAMESPACE, Config, config ?? {}, { setSource: source => { current = source; sync() }, onChange: sync })
  sync()
}
