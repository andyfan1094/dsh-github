import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { GithubStore, normalizeApiUrl } from '../src/store.ts'

function storeFile(): string {
  return join(mkdtempSync(join(tmpdir(), 'dsh-github-store-')), 'github.json')
}

test('account summaries never expose tokens and the store persists privately', () => {
  const path = storeFile()
  const store = new GithubStore(path)
  const summary = store.upsertAccount({ alias: 'work', token: 'secret-token', apiUrl: 'https://api.github.com/' })
  assert.equal(summary.tokenConfigured, true)
  assert.equal('token' in summary, false)
  assert.equal(store.listAccounts()[0].tokenConfigured, true)
  assert.equal(readFileSync(path, 'utf8').includes('secret-token'), true)
})

test('a corrupt store is moved aside and recovered as an empty store', () => {
  const path = storeFile()
  writeFileSync(path, '{bad json')
  const store = new GithubStore(path)
  assert.deepEqual(store.listAccounts(), [])
})

test('API URLs are normalized and non-http schemes are rejected', () => {
  assert.equal(normalizeApiUrl('https://github.example/api/v3///'), 'https://github.example/api/v3')
  assert.throws(() => normalizeApiUrl('file:///tmp/github'), /must start with http/)
})