import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { GithubEngine } from '../src/engine.ts'
import { GithubStore } from '../src/store.ts'

function engine() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-github-engine-'))
  const store = new GithubStore(join(root, 'config.json'))
  store.upsertAccount({ alias: 'work', token: 'fake-token' })
  return { root, store, engine: new GithubEngine(store) }
}

test('push and force push are independently guarded by Host settings', async () => {
  const f = engine()
  await assert.rejects(() => f.engine.action({ action: 'push', repoPath: f.root, account: 'work' }), /push is disabled/)
  f.store.updateSettings({ allowPush: true })
  await assert.rejects(() => f.engine.action({ action: 'push', repoPath: f.root, account: 'work', force: true }), /force push is disabled/)
})

test('repository paths must be absolute', async () => {
  const f = engine()
  await assert.rejects(() => f.engine.action({ action: 'status', repoPath: 'relative' }), /must be absolute/)
})