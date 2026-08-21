import { dirname, join } from 'node:path'
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import type { AccountSummary, GitHubConfigPayload, GitHubSettings } from './protocol.ts'

export interface StoredAccount {
  alias: string
  token: string
  apiUrl: string
  username?: string
  createdAt: number
  updatedAt: number
}
interface StoreFile { version: 1; settings: GitHubSettings; accounts: StoredAccount[] }
const DEFAULT_SETTINGS: GitHubSettings = { apiUrl: 'https://api.github.com', gitExecutable: 'git', autoFetchOnOpen: false, allowPush: false, allowForcePush: false }
export function storePath(): string { return join(homedir(), '.dsh', 'dsh-github.json') }

export class GithubStore {
  readonly path: string
  private cache: { mtimeMs: number; size: number; file: StoreFile } | undefined
  constructor(path?: string) { this.path = path ?? storePath() }
  settings(): GitHubSettings { return { ...DEFAULT_SETTINGS, ...this.load().settings } }
  updateSettings(patch: GitHubConfigPayload): GitHubSettings {
    const file = this.load()
    const current = this.settings()
    const next: GitHubSettings = {
      ...current,
      ...(patch.apiUrl !== undefined ? { apiUrl: normalizeApiUrl(patch.apiUrl) } : {}),
      ...(patch.gitExecutable !== undefined ? { gitExecutable: patch.gitExecutable.trim() || 'git' } : {}),
      ...(patch.defaultAccount !== undefined ? { defaultAccount: patch.defaultAccount.trim() || undefined } : {}),
      ...(patch.defaultRepoDir !== undefined ? { defaultRepoDir: patch.defaultRepoDir.trim() || undefined } : {}),
      ...(patch.defaultBranch !== undefined ? { defaultBranch: patch.defaultBranch.trim() || undefined } : {}),
      ...(patch.autoFetchOnOpen !== undefined ? { autoFetchOnOpen: Boolean(patch.autoFetchOnOpen) } : {}),
      ...(patch.allowPush !== undefined ? { allowPush: Boolean(patch.allowPush) } : {}),
      ...(patch.allowForcePush !== undefined ? { allowForcePush: Boolean(patch.allowForcePush) } : {}),
    }
    file.settings = next; this.save(file); return next
  }
  listAccounts(): AccountSummary[] { return this.load().accounts.map(account => this.summarize(account)) }
  findAccount(alias?: string): StoredAccount {
    const file = this.load()
    const selected = alias?.trim() || this.settings().defaultAccount || file.accounts[0]?.alias
    const account = file.accounts.find(candidate => candidate.alias === selected)
    if (account === undefined) throw new Error(selected === undefined ? 'No GitHub account configured. Open the GitHub panel and add an account.' : 'GitHub account ' + selected + ' not found')
    return account
  }
  upsertAccount(payload: { alias: string; token?: string; apiUrl?: string }): AccountSummary {
    const alias = payload.alias.trim()
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(alias)) throw new Error('account alias must start with a letter or digit and use only letters, digits, dots, hyphens or underscores')
    const file = this.load()
    const existing = file.accounts.find(account => account.alias === alias)
    const token = payload.token?.trim() || existing?.token
    if (!token) throw new Error('GitHub token is required')
    const now = Date.now()
    const entry: StoredAccount = { alias, token, apiUrl: normalizeApiUrl(payload.apiUrl || existing?.apiUrl || file.settings.apiUrl), ...(existing?.username !== undefined ? { username: existing.username } : {}), createdAt: existing?.createdAt ?? now, updatedAt: now }
    if (existing === undefined) file.accounts.push(entry); else file.accounts[file.accounts.indexOf(existing)] = entry
    if (file.settings.defaultAccount === undefined) file.settings.defaultAccount = alias
    this.save(file); return this.summarize(entry)
  }
  setUsername(alias: string, username: string): void {
    const file = this.load(); const account = file.accounts.find(candidate => candidate.alias === alias)
    if (account === undefined) throw new Error('GitHub account ' + alias + ' not found')
    account.username = username; account.updatedAt = Date.now(); this.save(file)
  }
  deleteAccount(alias: string): void {
    const file = this.load(); const index = file.accounts.findIndex(account => account.alias === alias)
    if (index < 0) throw new Error('GitHub account ' + alias + ' not found')
    file.accounts.splice(index, 1); if (file.settings.defaultAccount === alias) file.settings.defaultAccount = file.accounts[0]?.alias; this.save(file)
  }
  summarize(account: StoredAccount): AccountSummary { return { alias: account.alias, apiUrl: account.apiUrl, ...(account.username !== undefined ? { username: account.username } : {}), tokenConfigured: account.token.length > 0, createdAt: account.createdAt, updatedAt: account.updatedAt } }
  private load(): StoreFile {
    let stats: { mtimeMs: number; size: number }
    try { stats = statSync(this.path) } catch { return { version: 1, settings: { ...DEFAULT_SETTINGS }, accounts: [] } }
    if (this.cache?.mtimeMs === stats.mtimeMs && this.cache.size === stats.size) return this.cache.file
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as Partial<StoreFile>
      if (parsed.version !== 1 || !Array.isArray(parsed.accounts)) throw new Error('store shape invalid')
      const file: StoreFile = { version: 1, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) }, accounts: parsed.accounts as StoredAccount[] }
      this.cache = { mtimeMs: stats.mtimeMs, size: stats.size, file }; return file
    } catch {
      try { renameSync(this.path, this.path + '.corrupt-' + Date.now()) } catch { /* best effort */ }
      return { version: 1, settings: { ...DEFAULT_SETTINGS }, accounts: [] }
    }
  }
  private save(file: StoreFile): void {
    const dir = dirname(this.path); if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 })
    const tmp = this.path + '.tmp'; writeFileSync(tmp, JSON.stringify(file, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 })
    try { chmodSync(tmp, 0o600) } catch { /* Windows ACLs are inherited */ }
    renameSync(tmp, this.path); this.cache = undefined
  }
}
export function normalizeApiUrl(value: string): string {
  const url = value.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(url)) throw new Error('GitHub API URL must start with http:// or https://')
  return url
}
