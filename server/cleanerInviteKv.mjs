/**
 * Codes d’invitation prestataire ménage : résolution côté KV pour que le seul code SPM-…
 * suffise à l’inscription (sans paramètre host dans l’URL).
 */
import { kv } from '@vercel/kv'
import { isRemoteAccountsConfigured, readAccountsBlob } from './authAccounts.mjs'

const PREFIX = 'staypilot_cleaner_invite_code_v1:'

function normLower(s) {
  return String(s || '').trim().toLowerCase()
}

function normInviteCode(raw) {
  const c = String(raw || '').trim().toUpperCase()
  if (!/^SPM-[A-Z0-9]{5,12}$/.test(c)) return ''
  return c
}

function kvKey(code) {
  return `${PREFIX}${code}`
}

export async function handleCleanerInviteLookupRequest(query = {}) {
  const code = normInviteCode(query?.code ?? query?.inviteCode ?? '')
  if (!code) return { status: 400, json: { error: 'invalid_code' } }
  if (!isRemoteAccountsConfigured()) {
    return { status: 503, json: { error: 'remote_unavailable' } }
  }
  try {
    const row = await kv.get(kvKey(code))
    if (!row || typeof row !== 'object' || !String(row.hostUsername || '').trim()) {
      return { status: 404, json: { error: 'not_found' } }
    }
    return { status: 200, json: { ok: true, hostUsername: String(row.hostUsername).trim() } }
  } catch (e) {
    console.error('[cleanerInviteKv] lookup', e)
    return { status: 500, json: { error: 'lookup_failed' } }
  }
}

export async function handleCleanerInviteSyncRequest(body = {}) {
  const accountId = String(body?.accountId || '').trim()
  const password = String(body?.password || '')
  const code = normInviteCode(body?.code ?? '')
  const hostUsernameClaim = String(body?.hostUsername || '').trim()
  if (!accountId || !password || !code) {
    return { status: 400, json: { error: 'missing_fields' } }
  }
  if (!isRemoteAccountsConfigured()) {
    return { status: 503, json: { error: 'remote_unavailable' } }
  }
  const accounts = await readAccountsBlob()
  const idx = accounts.findIndex((a) => String(a.id || '').trim() === accountId)
  if (idx === -1) return { status: 404, json: { error: 'account_not_found' } }
  if (String(accounts[idx].password || '') !== password) {
    return { status: 401, json: { error: 'invalid_password' } }
  }
  const role = String(accounts[idx].role || 'host').trim().toLowerCase()
  if (role === 'cleaner') return { status: 403, json: { error: 'hosts_only' } }
  const accUser = normLower(accounts[idx].username)
  if (!accUser) return { status: 400, json: { error: 'invalid_account' } }
  if (hostUsernameClaim && normLower(hostUsernameClaim) !== accUser) {
    return { status: 403, json: { error: 'username_mismatch' } }
  }
  try {
    const key = kvKey(code)
    const existing = await kv.get(key)
    if (existing && typeof existing === 'object' && String(existing.hostUsername || '').trim()) {
      const prev = normLower(existing.hostUsername)
      if (prev && prev !== accUser) {
        return { status: 409, json: { error: 'code_already_bound' } }
      }
    }
    const canonical = String(accounts[idx].username || '').trim()
    await kv.set(key, {
      hostUsername: canonical,
      updatedAt: new Date().toISOString(),
    })
    return { status: 200, json: { ok: true } }
  } catch (e) {
    console.error('[cleanerInviteKv] sync', e)
    return { status: 500, json: { error: 'sync_failed' } }
  }
}
