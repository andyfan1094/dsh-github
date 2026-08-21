import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { GithubStore, StoredAccount } from './store.ts'
import type { GitResult } from './protocol.ts'

export type GitRun = GitResult & { command: string }
export class GitRunner {
  constructor(private readonly store: GithubStore) {}
  async run(args: string[], cwd?: string, account?: StoredAccount, timeoutMs = 120000): Promise<GitRun> {
    if (cwd !== undefined && !existsSync(cwd)) throw new Error('repository path does not exist: ' + cwd)
    const executable = this.store.settings().gitExecutable || 'git'
    const env: NodeJS.ProcessEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' }
    if (account !== undefined) {
      env.GIT_CONFIG_COUNT = '1'; env.GIT_CONFIG_KEY_0 = 'http.extraheader'; env.GIT_CONFIG_VALUE_0 = 'Authorization: Bearer ' + account.token
    }
    const started = Date.now(); const command = [executable, ...args].join(' ')
    return await new Promise<GitRun>((resolveResult, reject) => {
      const child = spawn(executable, args, { cwd, env, windowsHide: true })
      let stdout = ''; let stderr = ''; let timedOut = false
      const timer = setTimeout(() => { timedOut = true; child.kill() }, timeoutMs)
      child.stdout.on('data', chunk => { stdout += String(chunk) })
      child.stderr.on('data', chunk => { stderr += String(chunk) })
      child.on('error', error => { clearTimeout(timer); reject(new Error('unable to start git: ' + error.message)) })
      child.on('close', code => {
        clearTimeout(timer)
        const clean = (value: string): string => account === undefined ? value : value.split(account.token).join('[redacted-token]')
        const result: GitRun = { ok: code === 0 && !timedOut, action: 'git', exitCode: timedOut ? null : code, stdout: clean(stdout).trim(), stderr: clean(stderr).trim(), durationMs: Date.now() - started, command }
        if (timedOut) result.error = 'git command timed out after ' + timeoutMs + ' ms'
        resolveResult(result)
      })
    })
  }
}
