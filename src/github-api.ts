import type { RepoSummary } from './protocol.ts'
import type { GithubStore, StoredAccount } from './store.ts'
interface GithubUser { login: string }
interface GithubRepo { id: number; name: string; full_name: string; private: boolean; html_url: string; clone_url: string; default_branch: string; description: string | null; updated_at: string | null }
export class GithubApi {
  constructor(private readonly store: GithubStore) {}
  async test(alias?: string): Promise<{ ok: boolean; alias: string; username?: string; error?: string }> {
    const account = this.store.findAccount(alias)
    try { const user = await this.request<GithubUser>(account, '/user'); this.store.setUsername(account.alias, user.login); return { ok: true, alias: account.alias, username: user.login } }
    catch (error) { return { ok: false, alias: account.alias, error: error instanceof Error ? error.message : String(error) } }
  }
  async listRepos(alias?: string, query?: string): Promise<RepoSummary[]> {
    const account = this.store.findAccount(alias); const repos: RepoSummary[] = []
    for (let page = 1; page <= 10; page += 1) {
      const batch = await this.request<GithubRepo[]>(account, '/user/repos?per_page=100&page=' + page + '&sort=updated')
      repos.push(...batch.map(repo => this.toSummary(repo))); if (batch.length < 100) break
    }
    const needle = query?.trim().toLowerCase()
    return needle === undefined || needle === '' ? repos : repos.filter(repo => (repo.name + ' ' + repo.fullName + ' ' + (repo.description ?? '')).toLowerCase().includes(needle))
  }
  async request<T>(account: StoredAccount, path: string): Promise<T> {
    const response = await fetch(account.apiUrl + path, { headers: { accept: 'application/vnd.github+json', authorization: 'Bearer ' + account.token, 'x-github-api-version': '2022-11-28', 'user-agent': 'dsh-github/0.1.0' } })
    const text = await response.text(); let body: unknown; try { body = JSON.parse(text) } catch { body = text }
    if (!response.ok) { const message = typeof body === 'object' && body !== null && typeof (body as { message?: unknown }).message === 'string' ? (body as { message: string }).message : 'GitHub API HTTP ' + response.status; throw new Error(message + ' (' + response.status + ')') }
    return body as T
  }
  private toSummary(repo: GithubRepo): RepoSummary { return { id: repo.id, name: repo.name, fullName: repo.full_name, private: repo.private, htmlUrl: repo.html_url, cloneUrl: repo.clone_url, defaultBranch: repo.default_branch, ...(repo.description !== null ? { description: repo.description } : {}), ...(repo.updated_at !== null ? { updatedAt: repo.updated_at } : {}) } }
}
