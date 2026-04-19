/**
 * Affectations prestataire ménage par logement : stock KV par hôte pour que le prestataire
 * les charge depuis n'importe quel navigateur (sans partager le même appareil que l'hôte).
 */
import { kv } from '@vercel/kv'
import { isRemoteAccountsConfigured, readAccountsBlob } from './authAccounts.mjs'

const PREFIX = 'staypilot_host_cleaning_assignments_v1:'

function normUser(s) {
  return String(s || '').trim().toLowerCase()
}

function kvKeyForHostUsername(hostUsername) {
  const h = normUser(hostUsername)
  if (!h) return ''
  return `${PREFIX}${h.replace(/[^a-z0-9@._-]/g, '_')}`
}

function sanitizeAssignments(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || typeof v !== 'string') continue
    const id = k.trim().slice(0, 200)
    if (!id) continue
    out[id] = v.trim().slice(0, 500)
  }
  return out
}

export async function handleCleaningProviderAssignmentsRequest(body = {}) {
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
    if (!hostUser) return { status: 400, json: { error: 'invalid_account' } }
    const key = kvKeyForHostUsername(hostUser)
    if (!key) return { status: 400, json: { error: 'invalid_account' } }
    const assignments = sanitizeAssignments(body?.assignments)
    await kv.set(key, {
      assignments,
      updatedAt: new Date().toISOString(),
    })
    return { status: 200, json: { ok: true } }
  }

  // pull
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
    if (!row || typeof row !== 'object') {
      return { status: 200, json: { ok: true, assignments: {} } }
    }
    const assignments = sanitizeAssignments(row.assignments)
    return { status: 200, json: { ok: true, assignments } }
  } catch (e) {
    console.error('[cleaningProviderAssignmentsKv] pull', e)
    return { status: 500, json: { error: 'pull_failed' } }
  }
}
