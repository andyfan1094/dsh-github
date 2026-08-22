import test from 'node:test'
import assert from 'node:assert/strict'
import { GithubApi } from '../src/github-api.ts'

const account = { alias: 'work', token: 'fake-token', apiUrl: 'https://api.github.test', createdAt: 1, updatedAt: 1 }

test('GitHub API sends the token only in the Authorization header', async () => {
  const original = globalThis.fetch
  let seenUrl = ''
  let seenHeaders: Record<string, string> = {}
  globalThis.fetch = (async (url, init) => {
    seenUrl = String(url)
    seenHeaders = init?.headers as Record<string, string>
    return new Response(JSON.stringify({ login: 'andy' }), { status: 200 })
  }) as typeof fetch
  try {
    const store = { findAccount: () => account, setUsername() {} } as any
    const result = await new GithubApi(store).test('work')
    assert.equal(result.ok, true)
    assert.equal(seenUrl.includes('fake-token'), false)
    assert.equal(seenHeaders.authorization, 'Bearer fake-token')
  } finally {
    globalThis.fetch = original
  }
})