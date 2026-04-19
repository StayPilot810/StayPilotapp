import { randomBytes } from 'crypto'
import { kv } from '@vercel/kv'
import { isRemoteAccountsConfigured, readAccountsBlob } from './authAccounts.mjs'

const PENDING_PREFIX = 'staypilot_host_checkout_pending_v1:'
const PENDING_TTL_SEC = 3 * 24 * 60 * 60

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

/**
 * Stocke le payload inscription hôte avant Checkout ; le compte n’est créé qu’après paiement / session complète.
 * @returns {{ ok: true, pendingId: string } | { ok: false, error: string }}
 */
export async function saveHostCheckoutPending(accountPayload) {
  if (!isRemoteAccountsConfigured()) {
    return { ok: false, error: 'pending_host_requires_kv' }
  }
  if (!accountPayload || typeof accountPayload !== 'object') {
    return { ok: false, error: 'invalid_pending_payload' }
  }
  const username = String(accountPayload.username || '').trim()
  const email = String(accountPayload.email || '').trim()
  const password = String(accountPayload.password || '')
  if (!username || !email || !password) {
    return { ok: false, error: 'missing_required_fields' }
  }
  const accounts = await readAccountsBlob()
  const emailNorm = normalize(email)
  const userNorm = normalize(username)
  if (accounts.some((a) => normalize(a.email) === emailNorm || normalize(a.username) === userNorm)) {
    return { ok: false, error: 'duplicate' }
  }
  const pendingId = `pend_${Date.now()}_${randomBytes(6).toString('hex')}`
  const key = `${PENDING_PREFIX}${pendingId}`
  try {
    await kv.set(key, JSON.stringify(accountPayload), { ex: PENDING_TTL_SEC })
    return { ok: true, pendingId }
  } catch (e) {
    console.error('[hostCheckoutPending] kv.set failed', e)
    return { ok: false, error: 'pending_save_failed' }
  }
}

export function pendingHostCheckoutKey(pendingId) {
  return `${PENDING_PREFIX}${String(pendingId || '').trim()}`
}

export async function peekPendingHostCheckoutPayload(pendingId) {
  const id = String(pendingId || '').trim()
  if (!id || !isRemoteAccountsConfigured()) return null
  const key = pendingHostCheckoutKey(id)
  try {
    const raw = await kv.get(key)
    if (!raw) return null
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
    return typeof raw === 'object' ? raw : null
  } catch (e) {
    console.error('[hostCheckoutPending] peek failed', key, e)
    return null
  }
}

export async function deletePendingHostCheckout(pendingId) {
  const id = String(pendingId || '').trim()
  if (!id || !isRemoteAccountsConfigured()) return
  try {
    await kv.del(pendingHostCheckoutKey(id))
  } catch (e) {
    console.error('[hostCheckoutPending] del failed', id, e)
  }
}
