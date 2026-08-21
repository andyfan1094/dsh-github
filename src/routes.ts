import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { GITHUB_API } from './protocol.ts'
import type { GithubEngine } from './engine.ts'
const MAX_BODY = 256 * 1024
function writeJson(res: ServerResponse, status: number, body: unknown): void { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }); res.end(JSON.stringify(body)) }
async function readJson(req: IncomingMessage): Promise<Record<string, unknown> | undefined> { const parts: Buffer[] = []; let size = 0; for await (const chunk of req) { const part = chunk as Buffer; size += part.byteLength; if (size > MAX_BODY) return undefined; parts.push(part) }; try { const parsed: unknown = JSON.parse(Buffer.concat(parts).toString('utf8')); return parsed !== null && typeof parsed === 'object' ? parsed as Record<string, unknown> : undefined } catch { return undefined } }
function isLoopbackRequest(req: IncomingMessage): boolean { const address = req.socket.remoteAddress ?? ''; return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1' }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error) }
function param(req: IncomingMessage, key: string): string | undefined { return new URL(req.url ?? '/', 'http://localhost').searchParams.get(key) ?? undefined }
function guard(req: IncomingMessage, res: ServerResponse, method: string): boolean { if (!isLoopbackRequest(req)) { writeJson(res, 403, { error: 'forbidden: loopback-only' }); return false }; if (req.method !== method) { writeJson(res, 405, { error: 'method not allowed: ' + req.method }); return false }; return true }

export function makeRoutes(engine: GithubEngine): WebRoute[] {
  const accounts: WebRoute = { kind: 'exact', path: GITHUB_API.accounts, handler: async (req, res) => {
    if (!isLoopbackRequest(req)) { writeJson(res, 403, { error: 'forbidden: loopback-only' }); return }
    if (req.method === 'GET') { writeJson(res, 200, { accounts: engine.listAccounts() }); return }
    const body = await readJson(req); if (body === undefined) { writeJson(res, 400, { error: 'invalid JSON body' }); return }
    try {
      if (req.method === 'POST' || req.method === 'PATCH') { writeJson(res, 200, { account: engine.store.upsertAccount({ alias: String(body.alias ?? ''), token: typeof body.token === 'string' ? body.token : undefined, apiUrl: typeof body.apiUrl === 'string' ? body.apiUrl : undefined }) }); return }
      if (req.method === 'DELETE') { engine.store.deleteAccount(String(body.alias ?? '')); writeJson(res, 200, { ok: true }); return }
      writeJson(res, 405, { error: 'method not allowed: ' + req.method })
    } catch (error) { writeJson(res, 400, { error: errorMessage(error) }) }
  }}
  const accountTest: WebRoute = { kind: 'exact', path: GITHUB_API.accountTest, handler: async (req, res) => { if (!guard(req, res, 'POST')) return; const body = await readJson(req); const alias = typeof body?.alias === 'string' ? body.alias : undefined; try { writeJson(res, 200, { result: await engine.testAccount(alias) }) } catch (error) { writeJson(res, 400, { error: errorMessage(error) }) } }}
  const repos: WebRoute = { kind: 'exact', path: GITHUB_API.repos, handler: async (req, res) => { if (!guard(req, res, 'GET')) return; try { writeJson(res, 200, { repos: await engine.listRepos(param(req, 'account'), param(req, 'query')) }) } catch (error) { writeJson(res, 400, { error: errorMessage(error) }) } }}
  const config: WebRoute = { kind: 'exact', path: GITHUB_API.config, handler: async (req, res) => {
    if (!isLoopbackRequest(req)) { writeJson(res, 403, { error: 'forbidden: loopback-only' }); return }
    if (req.method === 'GET') { writeJson(res, 200, { config: engine.settings() }); return }
    if (req.method !== 'PATCH') { writeJson(res, 405, { error: 'method not allowed: ' + req.method }); return }
    const body = await readJson(req); if (body === undefined) { writeJson(res, 400, { error: 'invalid JSON body' }); return }
    try { writeJson(res, 200, { config: engine.updateSettings(body) }) } catch (error) { writeJson(res, 400, { error: errorMessage(error) }) }
  }}
  const git: WebRoute = { kind: 'exact', path: GITHUB_API.git, handler: async (req, res) => { if (!guard(req, res, 'POST')) return; const body = await readJson(req); if (body === undefined || typeof body.action !== 'string') { writeJson(res, 400, { error: 'action is required' }); return }; try { writeJson(res, 200, { result: await engine.action(body as any) }) } catch (error) { writeJson(res, 400, { error: errorMessage(error) }) } }}
  return [accounts, accountTest, repos, config, git]
}
