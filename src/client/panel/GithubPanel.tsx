import { useEffect, useMemo, useState } from 'react'
import type { AccountSummary, GitAction, GitHubSettings, RepoSummary, GitResult } from '../../protocol.ts'
import type { GithubApi } from '../api.ts'
import type { PanelController } from '../controller.ts'

interface Props { api: GithubApi; controller: PanelController }
type Tab = 'accounts' | 'repos' | 'git' | 'settings'
const emptySettings: GitHubSettings = { apiUrl: 'https://api.github.com', gitExecutable: 'git', autoFetchOnOpen: false, allowPush: false, allowForcePush: false }

export function GithubPanel({ api, controller }: Props) {
  const [tab, setTab] = useState<Tab>('accounts')
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const [settings, setSettings] = useState<GitHubSettings>(emptySettings)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [accountAlias, setAccountAlias] = useState('')
  const [token, setToken] = useState('')
  const [accountApiUrl, setAccountApiUrl] = useState('https://api.github.com')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [repoSearch, setRepoSearch] = useState('')
  const [repos, setRepos] = useState<RepoSummary[]>([])
  const [action, setAction] = useState<GitAction['action']>('status')
  const [repoPath, setRepoPath] = useState('')
  const [remoteUrl, setRemoteUrl] = useState('')
  const [destination, setDestination] = useState('')
  const [branch, setBranch] = useState('')
  const [remote, setRemote] = useState('origin')
  const [message, setMessage] = useState('')
  const [stageAll, setStageAll] = useState(true)
  const [force, setForce] = useState(false)
  const [result, setResult] = useState<GitResult | null>(null)
  const [open, setOpen] = useState(controller.getSnapshot().open)

  const refresh = async (): Promise<void> => {
    setError(''); setBusy(true)
    try { const [nextAccounts, nextSettings] = await Promise.all([api.listAccounts(), api.getConfig()]); setAccounts(nextAccounts); setSettings(nextSettings); setSelectedAccount(current => current || nextSettings.defaultAccount || nextAccounts[0]?.alias || ''); setRepoPath(current => current || nextSettings.defaultRepoDir || '') }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBusy(false) }
  }
  useEffect(() => controller.subscribe(() => setOpen(controller.getSnapshot().open)), [controller])
  useEffect(() => { void refresh() }, [])
  useEffect(() => { const account = accounts.find(item => item.alias === accountAlias); if (account) setAccountApiUrl(account.apiUrl) }, [accountAlias, accounts])

  const selected = useMemo(() => selectedAccount || settings.defaultAccount || accounts[0]?.alias || '', [selectedAccount, settings.defaultAccount, accounts])
  const run = async (operation: () => Promise<void>): Promise<void> => { setError(''); setNotice(''); setBusy(true); try { await operation() } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) } finally { setBusy(false) } }
  const saveAccount = async (): Promise<void> => run(async () => { const saved = await api.saveAccount({ alias: accountAlias.trim(), token: token.trim() || undefined, apiUrl: accountApiUrl.trim() }); setToken(''); setNotice('账号已保存：' + saved.alias); await refresh() })
  const testAccount = async (alias: string): Promise<void> => run(async () => { const checked = await api.testAccount(alias); if (!checked.ok) throw new Error(checked.error || 'GitHub 认证失败'); setNotice('认证成功：' + (checked.username || alias)); await refresh() })
  const removeAccount = async (alias: string): Promise<void> => { if (!window.confirm('删除 GitHub 账号 ' + alias + '？')) return; await run(async () => { await api.deleteAccount(alias); setNotice('账号已删除'); await refresh() }) }
  const loadRepos = async (): Promise<void> => run(async () => { if (!selected) throw new Error('请先配置 GitHub 账号'); setRepos(await api.listRepos(selected, repoSearch)); setNotice('仓库列表已刷新') })
  const saveSettings = async (): Promise<void> => run(async () => { const next = await api.saveConfig(settings); setSettings(next); setNotice('设置已保存') })
  useEffect(() => {
    if (!open || !settings.autoFetchOnOpen || !repoPath.trim() || !selected) return
    void run(async () => { const next = await api.git({ action: 'pull', account: selected, repoPath: repoPath.trim(), branch: settings.defaultBranch }); setResult(next); if (!next.ok) setError(next.error || next.stderr || '自动 fetch 失败') })
  }, [open])
  const executeGit = async (): Promise<void> => run(async () => {
    const payload: GitAction = { action, account: selected || undefined, repoPath: repoPath.trim() || undefined, remote: remote.trim() || undefined, branch: branch.trim() || undefined, remoteUrl: remoteUrl.trim() || undefined, destination: destination.trim() || undefined, message: message.trim() || undefined, all: stageAll, force }
    const next = await api.git(payload); setResult(next); if (!next.ok) setError(next.error || next.stderr || 'Git 操作失败')
  })

  const accountOptions = accounts.length === 0 ? <option value="">未配置账号</option> : accounts.map(account => <option value={account.alias} key={account.alias}>{account.alias}{account.username ? ' · ' + account.username : ''}</option>)
  return <div className="dshGithubPanel">
    <div className="dshGithubHeader"><div><h2 className="dshGithubTitle">GitHub</h2><div className="dshGithubSubtle">账号、仓库与本地 Git</div></div><button className="dshGithubClose" type="button" onClick={() => controller.close()}>关闭</button></div>
    <nav className="dshGithubTabs" aria-label="GitHub"><button className="dshGithubTab" data-active={tab === 'accounts'} onClick={() => setTab('accounts')}>账号</button><button className="dshGithubTab" data-active={tab === 'repos'} onClick={() => setTab('repos')}>仓库</button><button className="dshGithubTab" data-active={tab === 'git'} onClick={() => setTab('git')}>本地 Git</button><button className="dshGithubTab" data-active={tab === 'settings'} onClick={() => setTab('settings')}>设置</button></nav>
    <main className="dshGithubBody">
      {error && <div className="dshGithubNotice" data-kind="error">{error}</div>}
      {notice && <div className="dshGithubNotice">{notice}</div>}
      {tab === 'accounts' && <div className="dshGithubGrid">
        <section className="dshGithubSection"><h3>添加或更新账号</h3><div className="dshGithubForm"><label className="dshGithubField"><span>账号别名</span><input className="dshGithubInput" value={accountAlias} onChange={event => setAccountAlias(event.target.value)} placeholder="例如 work" /></label><label className="dshGithubField"><span>Personal Access Token</span><input className="dshGithubInput" type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="留空表示保留已保存 Token" /><span className="dshGithubSubtle">Token 只在 Host 端保存，不在列表或 Git URL 中显示。</span></label><label className="dshGithubField"><span>GitHub API 地址</span><input className="dshGithubInput" value={accountApiUrl} onChange={event => setAccountApiUrl(event.target.value)} /></label><div className="dshGithubActions"><button className="dshGithubButton" data-primary="true" type="button" disabled={busy} onClick={() => void saveAccount()}>保存账号</button><button className="dshGithubButton" type="button" disabled={busy} onClick={() => void refresh()}>刷新</button></div></div></section>
        <section className="dshGithubSection"><h3>已配置账号</h3>{accounts.length === 0 ? <div className="dshGithubSubtle">暂无账号</div> : <table className="dshGithubTable"><thead><tr><th>别名</th><th>用户</th><th>Token</th><th>操作</th></tr></thead><tbody>{accounts.map(account => <tr key={account.alias}><td>{account.alias}</td><td>{account.username || '未验证'}</td><td><span className="dshGithubBadge">{account.tokenConfigured ? '已配置' : '未配置'}</span></td><td><div className="dshGithubActions"><button className="dshGithubButton" type="button" disabled={busy} onClick={() => { setAccountAlias(account.alias); setAccountApiUrl(account.apiUrl) }}>编辑</button><button className="dshGithubButton" type="button" disabled={busy} onClick={() => void testAccount(account.alias)}>验证</button><button className="dshGithubButton" data-danger="true" type="button" disabled={busy} onClick={() => void removeAccount(account.alias)}>删除</button></div></td></tr>)}</tbody></table>}</section>
      </div>}
      {tab === 'repos' && <div className="dshGithubGrid"><section className="dshGithubSection dshGithubSectionWide"><h3>GitHub 仓库</h3><div className="dshGithubRow"><label className="dshGithubField"><span>账号</span><select className="dshGithubSelect" value={selected} onChange={event => setSelectedAccount(event.target.value)}>{accountOptions}</select></label><label className="dshGithubField"><span>搜索</span><input className="dshGithubInput" value={repoSearch} onChange={event => setRepoSearch(event.target.value)} placeholder="仓库名或描述" /></label><button className="dshGithubButton" type="button" disabled={busy} onClick={() => void loadRepos()}>刷新仓库</button></div>{repos.length > 0 && <table className="dshGithubTable"><thead><tr><th>仓库</th><th>可见性</th><th>默认分支</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{repos.map(repo => <tr key={repo.id}><td><a href={repo.htmlUrl} target="_blank" rel="noreferrer">{repo.fullName}</a><div className="dshGithubSubtle">{repo.description || ''}</div></td><td>{repo.private ? 'Private' : 'Public'}</td><td>{repo.defaultBranch}</td><td>{repo.updatedAt || ''}</td><td><button className="dshGithubButton" type="button" onClick={() => { setRemoteUrl(repo.cloneUrl); setDestination((settings.defaultRepoDir || '').replace(/[\/]$/, '') + '/' + repo.name); setBranch(repo.defaultBranch); setTab('git'); setAction('clone') }}>准备 Clone</button></td></tr>)}</tbody></table>}</section></div>}
      {tab === 'git' && <div className="dshGithubGrid"><section className="dshGithubSection dshGithubSectionWide"><h3>本地 Git 操作</h3><div className="dshGithubRow"><label className="dshGithubField"><span>操作</span><select className="dshGithubSelect" value={action} onChange={event => setAction(event.target.value as GitAction['action'])}><option value="status">Status</option><option value="clone">Clone</option><option value="pull">Pull</option><option value="commit">Commit</option><option value="push">Push</option></select></label><label className="dshGithubField"><span>账号</span><select className="dshGithubSelect" value={selected} onChange={event => setSelectedAccount(event.target.value)}>{accountOptions}</select></label><label className="dshGithubField"><span>分支</span><input className="dshGithubInput" value={branch} onChange={event => setBranch(event.target.value)} placeholder="留空使用当前分支" /></label><label className="dshGithubField"><span>Remote</span><input className="dshGithubInput" value={remote} onChange={event => setRemote(event.target.value)} /></label></div><div className="dshGithubForm"><label className="dshGithubField"><span>本地仓库路径</span><input className="dshGithubInput" value={repoPath} onChange={event => setRepoPath(event.target.value)} placeholder="绝对路径，例如 D:/项目/repo" /></label>{action === 'clone' && <div className="dshGithubRow"><label className="dshGithubField"><span>Clone URL</span><input className="dshGithubInput" value={remoteUrl} onChange={event => setRemoteUrl(event.target.value)} placeholder="https://github.com/owner/repo.git" /></label><label className="dshGithubField"><span>目标目录</span><input className="dshGithubInput" value={destination} onChange={event => setDestination(event.target.value)} /></label></div>}{action === 'commit' && <label className="dshGithubField"><span>Commit message</span><textarea className="dshGithubTextarea" value={message} onChange={event => setMessage(event.target.value)} /></label>}<label className="dshGithubCheck"><input type="checkbox" checked={stageAll} onChange={event => setStageAll(event.target.checked)} /> Commit 前执行 git add -A</label>{action === 'push' && <label className="dshGithubCheck"><input type="checkbox" checked={force} onChange={event => setForce(event.target.checked)} /> 使用 force-with-lease</label>}<div className="dshGithubActions"><button className="dshGithubButton" data-primary="true" type="button" disabled={busy} onClick={() => void executeGit()}>{busy ? '执行中…' : '执行'}</button><span className="dshGithubSubtle">Push: {settings.allowPush ? '已开启' : '已关闭'} · Force: {settings.allowForcePush ? '已开启' : '已关闭'}</span></div></div>{result && <pre className="dshGithubOutput">{JSON.stringify(result, null, 2)}</pre>}</section></div>}
      {tab === 'settings' && <div className="dshGithubGrid"><section className="dshGithubSection"><h3>GitHub 与 Git</h3><div className="dshGithubForm"><label className="dshGithubField"><span>默认 API 地址</span><input className="dshGithubInput" value={settings.apiUrl} onChange={event => setSettings({ ...settings, apiUrl: event.target.value })} /></label><label className="dshGithubField"><span>Git 可执行文件</span><input className="dshGithubInput" value={settings.gitExecutable} onChange={event => setSettings({ ...settings, gitExecutable: event.target.value })} /></label><label className="dshGithubField"><span>默认账号</span><select className="dshGithubSelect" value={settings.defaultAccount || ''} onChange={event => setSettings({ ...settings, defaultAccount: event.target.value || undefined })}><option value="">自动选择</option>{accountOptions}</select></label><label className="dshGithubField"><span>默认仓库目录</span><input className="dshGithubInput" value={settings.defaultRepoDir || ''} onChange={event => setSettings({ ...settings, defaultRepoDir: event.target.value })} placeholder="Clone 面板的目标目录前缀" /></label><label className="dshGithubField"><span>默认分支</span><input className="dshGithubInput" value={settings.defaultBranch || ''} onChange={event => setSettings({ ...settings, defaultBranch: event.target.value })} /></label></div></section><section className="dshGithubSection"><h3>操作安全</h3><div className="dshGithubForm"><label className="dshGithubCheck"><input type="checkbox" checked={settings.autoFetchOnOpen} onChange={event => setSettings({ ...settings, autoFetchOnOpen: event.target.checked })} /> 打开面板时自动 fetch</label><label className="dshGithubCheck"><input type="checkbox" checked={settings.allowPush} onChange={event => setSettings({ ...settings, allowPush: event.target.checked })} /> 允许 Agent 和面板 push</label><label className="dshGithubCheck"><input type="checkbox" checked={settings.allowForcePush} onChange={event => setSettings({ ...settings, allowForcePush: event.target.checked })} /> 允许 force-with-lease</label><div className="dshGithubNotice">推送是外部副作用；默认关闭。建议先验证 status、pull 和 commit，再单独打开 push。</div><button className="dshGithubButton" data-primary="true" type="button" disabled={busy} onClick={() => void saveSettings()}>保存设置</button></div></section></div>}
    </main>
  </div>
}
