/**
 * Copie serveur du blob calendrier / channel manager (staypilot_official_channel_sync)
 * pour que le prestataire charge réservations et logements sans le navigateur de l’hôte.
 */
import { kv } from '@vercel/kv'
import { isRemoteAccountsConfigured, readAccountsBlob } from './authAccounts.mjs'

const PREFIX = 'staypilot_host_official_channel_sync_v1:'

function normUser(s) {
  return String(s || '').trim().toLowerCase()
}

function kvKeyForHostUsername(hostUsername) {
  const h = normUser(hostUsername)
  if (!h) return ''
  return `${PREFIX}${h.replace(/[^a-z0-9@._-]/g, '_')}`
}

/** ~3,5 Mo UTF-8 — limite prudente pour Vercel KV / temps de réponse. */
const MAX_SYNC_UTF8_BYTES = 3_500_000

function utf8ByteLength(s) {
  return Buffer.byteLength(s, 'utf8')
}

export async function handleHostOfficialChannelSyncRequest(body = {}) {
  if (!isRemoteAccountsConfigured()) {
    return { status: 503, json: { error: 'remote_unavailable' } }
  }
  const accountId = String(body?.accountId || '').trim()
  const password = String(body?.password || '')
  const action = String(body?.action || '').trim().toLowerCase()
  if (!accountId || !password || (action !== 'push' && action !== 'pull')) {
    return { status: 400, json: { error: 'missing_fields' } }
  }
  const accounts = await readAccountsBlob()
  const idx = accounts.findIndex((a) => String(a.id || '').trim() === accountId)
  if (idx === -1) return { status: 404, json: { error: 'account_not_found' } }
  if (String(accounts[idx].password || '') !== password) {
    return { status: 401, json: { error: 'invalid_password' } }
  }
  const acc = accounts[idx]
  const role = String(acc.role || 'host').trim().toLowerCase()

  if (action === 'push') {
    if (role === 'cleaner') return { status: 403, json: { error: 'hosts_only' } }
    const hostUser = String(acc.username || '').trim()
    const key = kvKeyForHostUsername(hostUser)
    if (!key) return { status: 400, json: { error: 'invalid_account' } }
    const raw = String(body?.officialSyncJson ?? '')
    if (!raw.trim()) return { status: 400, json: { error: 'missing_payload' } }
    if (utf8ByteLength(raw) > MAX_SYNC_UTF8_BYTES) {
      return { status: 413, json: { error: 'payload_too_large' } }
    }
    try {
      JSON.parse(raw)
    } catch {
      return { status: 400, json: { error: 'invalid_json' } }
    }
    try {
      await kv.set(key, { officialSyncJson: raw, updatedAt: new Date().toISOString() })
      return { status: 200, json: { ok: true } }
    } catch (e) {
      console.error('[hostOfficialChannelSyncKv] push', e)
      return { status: 500, json: { error: 'push_failed' } }
    }
  }

  let hostLookup = ''
  if (role === 'cleaner') {
    hostLookup = String(acc.hostUsername || '').trim()
    if (!hostLookup) return { status: 400, json: { error: 'missing_host' } }
  } else {
    hostLookup = String(acc.username || '').trim()
    if (!hostLookup) return { status: 400, json: { error: 'invalid_account' } }
  }
  const key = kvKeyForHostUsername(hostLookup)
  if (!key) return { status: 400, json: { error: 'invalid_host' } }
  try {
    const row = await kv.get(key)
    if (!row || typeof row !== 'object' || typeof row.officialSyncJson !== 'string' || !row.officialSyncJson.trim()) {
      return { status: 200, json: { ok: true, officialSyncJson: null } }
    }
    return { status: 200, json: { ok: true, officialSyncJson: row.officialSyncJson } }
  } catch (e) {
    console.error('[hostOfficialChannelSyncKv] pull', e)
    return { status: 500, json: { error: 'pull_failed' } }
  }
}
