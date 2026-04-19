import {
  getStoredAccounts,
  normalizeStoredLoginPiece,
  storedAccountMatchesNormalizedId,
} from '../lib/accounts'
import { isServerAccountsMandatory } from '../lib/serverAccountsPolicy'
import { writeScopedStoragePreferHostForCleaner } from './cleanerHostScopedStorage'
import { OFFICIAL_CHANNEL_SYNC_KEY } from './officialChannelData'
import { readScopedStorage, writeScopedStorage } from './sessionStorageScope'

const LS_LOGIN = 'staypilot_login_identifier'
const LS_USER = 'staypilot_current_user'
const LS_ROLE = 'staypilot_current_role'
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'

function currentSessionAccount() {
  if (typeof window === 'undefined') return undefined
  const uid = (window.localStorage.getItem(LS_LOGIN) || window.localStorage.getItem(LS_USER) || '').trim()
  if (!uid) return undefined
  return getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, normalizeStoredLoginPiece(uid)))
}

function bumpConnectionsListeners() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT))
}

/** Envoie le JSON `staypilot_official_channel_sync` du navigateur hôte vers le KV. */
export async function pushOfficialChannelSyncToServer(): Promise<void> {
  if (!isServerAccountsMandatory() || typeof window === 'undefined') return
  if ((window.localStorage.getItem(LS_ROLE) || '').trim().toLowerCase() === 'cleaner') return
  const acc = currentSessionAccount()
  if (!acc?.id || !acc.password) return
  if (String(acc.role || 'host').trim().toLowerCase() === 'cleaner') return
  const raw = readScopedStorage(OFFICIAL_CHANNEL_SYNC_KEY)
  if (!raw?.trim()) return
  await fetch('/api/cleaner-host-calendar-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: acc.id,
      password: acc.password,
      action: 'push',
      officialSyncJson: raw,
    }),
  }).catch(() => {})
}

/**
 * Télécharge le blob calendrier depuis le KV (prestataire : scope hôte ;
 * hôte : uniquement si le local est vide — nouvel appareil).
 */
export async function pullOfficialChannelSyncFromServer(): Promise<boolean> {
  if (!isServerAccountsMandatory() || typeof window === 'undefined') return false
  const acc = currentSessionAccount()
  if (!acc?.id || !acc.password) return false
  const role = (window.localStorage.getItem(LS_ROLE) || '').trim().toLowerCase()
  const accRole = String(acc.role || 'host').trim().toLowerCase()
  if (role === 'cleaner' && accRole !== 'cleaner') return false
  if (role !== 'cleaner' && accRole === 'cleaner') return false

  const r = await fetch('/api/cleaner-host-calendar-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: acc.id, password: acc.password, action: 'pull' }),
  }).catch(() => null)
  if (!r?.ok) return false
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; officialSyncJson?: string | null }
  if (!j?.ok) return false
  const blob = typeof j.officialSyncJson === 'string' ? j.officialSyncJson.trim() : ''
  if (!blob) return false
  try {
    JSON.parse(blob)
  } catch {
    return false
  }
  if (role === 'cleaner') {
    writeScopedStoragePreferHostForCleaner(OFFICIAL_CHANNEL_SYNC_KEY, blob)
  } else {
    const local = readScopedStorage(OFFICIAL_CHANNEL_SYNC_KEY)
    if (local?.trim()) return false
    writeScopedStorage(OFFICIAL_CHANNEL_SYNC_KEY, blob)
  }
  bumpConnectionsListeners()
  return true
}
