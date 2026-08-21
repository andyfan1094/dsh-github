import { dirname, isAbsolute, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { GithubApi } from './github-api.ts'
import { GitRunner } from './git.ts'
import type { AccountSummary, GitAction, GitHubConfigPayload, GitHubSettings, GitResult, RepoSummary } from './protocol.ts'
import type { StoredAccount } from './store.ts'
import { GithubStore } from './store.ts'

export class GithubEngine {
  readonly api: GithubApi
  readonly git: GitRunner
  constructor(readonly store: GithubStore) { this.api = new GithubApi(store); this.git = new GitRunner(store) }
  settings(): GitHubSettings { return this.store.settings() }
  updateSettings(patch: GitHubConfigPayload): GitHubSettings { return this.store.updateSettings(patch) }
  listAccounts(): AccountSummary[] { return this.store.listAccounts() }
  async testAccount(alias?: string) { return await this.api.test(alias) }
  async listRepos(alias?: string, query?: string): Promise<RepoSummary[]> { return await this.api.listRepos(alias, query) }
  async action(input: GitAction): Promise<GitResult> {
    if (input.action === 'clone') return await this.clone(input)
    const repoPath = this.requireRepoPath(input.repoPath)
    if (input.action === 'pull') return await this.pull(repoPath, input, this.store.findAccount(input.account))
    if (input.action === 'push') return await this.push(repoPath, input, this.store.findAccount(input.account))
    if (input.action === 'commit') return await this.commit(repoPath, input, this.store.findAccount(input.account))
    const result = await this.git.run(['status', '--short', '--branch'], repoPath, undefined, input.timeoutMs); result.action = 'status'; return this.withStatus(result, repoPath)
  }
  private async clone(input: GitAction): Promise<GitResult> {
    const destination = this.requireRepoPath(input.destination); const rawSource = input.remoteUrl?.trim()
    if (!rawSource) throw new Error('remoteUrl is required for clone')
    if (existsSync(destination)) throw new Error('clone destination already exists: ' + destination)
    const source = /^[^:/\s]+\/[^/\s]+(?:\.git)?$/.test(rawSource) ? 'https://github.com/' + rawSource.replace(/\.git$/, '') + '.git' : rawSource
    const account = this.store.findAccount(input.account); const args = ['clone']
    const branch = input.branch?.trim() || this.store.settings().defaultBranch
    if (branch) args.push('--branch', branch)
    args.push(source, destination)
    const result = await this.git.run(args, dirname(destination), account, input.timeoutMs); result.action = 'clone'; result.repoPath = destination; return result
  }
  private async pull(repoPath: string, input: GitAction, account: StoredAccount): Promise<GitResult> {
    const args = ['pull', '--ff-only']; if (input.remote?.trim()) args.push(input.remote.trim()); const branch = input.branch?.trim() || this.store.settings().defaultBranch; if (branch) args.push(branch)
    const result = await this.git.run(args, repoPath, account, input.timeoutMs); result.action = 'pull'; return this.withStatus(result, repoPath)
  }
  private async push(repoPath: string, input: GitAction, account: StoredAccount): Promise<GitResult> {
    const settings = this.store.settings(); if (!settings.allowPush) throw new Error('push is disabled in GitHub settings; enable Allow push in the panel first')
    if (input.force && !settings.allowForcePush) throw new Error('force push is disabled in GitHub settings')
    const args = ['push']; if (input.force) args.push('--force-with-lease'); if (input.remote?.trim()) args.push(input.remote.trim()); const branch = input.branch?.trim() || this.store.settings().defaultBranch; if (branch) args.push(branch)
    const result = await this.git.run(args, repoPath, account, input.timeoutMs); result.action = 'push'; return this.withStatus(result, repoPath)
  }
  private async commit(repoPath: string, input: GitAction, account: StoredAccount): Promise<GitResult> {
    if (!input.message?.trim()) throw new Error('commit message is required')
    if (input.all) { const added = await this.git.run(['add', '-A'], repoPath, account, input.timeoutMs); if (!added.ok) { added.action = 'commit'; added.repoPath = repoPath; return added } }
    const result = await this.git.run(['commit', '-m', input.message.trim()], repoPath, account, input.timeoutMs); result.action = 'commit'; return this.withStatus(result, repoPath)
  }
  private withStatus(result: GitResult, repoPath: string): GitResult { result.repoPath = repoPath; const branch = result.stdout.split(/\r?\n/).find(line => line.startsWith('## ')); result.branch = branch?.slice(3).split('...')[0] || undefined; result.dirty = result.stdout.split(/\r?\n/).some(line => line !== '' && !line.startsWith('## ')); return result }
  private requireRepoPath(value?: string): string { const path = value?.trim(); if (!path) throw new Error('repository path is required'); if (!isAbsolute(path)) throw new Error('repository path must be absolute'); return resolve(path) }
}
