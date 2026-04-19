import {
  getStoredAccounts,
  normalizeStoredLoginPiece,
  storedAccountMatchesNormalizedId,
} from '../lib/accounts'
import { isServerAccountsMandatory } from '../lib/serverAccountsPolicy'
import { writeScopedStoragePreferHostForCleaner } from './cleanerHostScopedStorage'
import {
  notifyCleaningProviderAssignmentsUpdated,
  PROVIDER_ASSIGNMENTS_STORAGE_KEY,
  readProviderAssignmentsMap,
} from './cleaningProviderAssignments'
import { writeScopedStorage } from './sessionStorageScope'

const LS_LOGIN = 'staypilot_login_identifier'
const LS_USER = 'staypilot_current_user'
const LS_ROLE = 'staypilot_current_role'

function currentSessionAccount() {
  if (typeof window === 'undefined') return undefined
  const uid = (window.localStorage.getItem(LS_LOGIN) || window.localStorage.getItem(LS_USER) || '').trim()
  if (!uid) return undefined
  return getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, normalizeStoredLoginPiece(uid)))
}

/** Envoie la carte d’affectations au KV (hôte uniquement, comptes serveur actifs). */
export async function pushCleaningProviderAssignmentsToServer(map: Record<string, string>): Promise<void> {
  if (!isServerAccountsMandatory() || typeof window === 'undefined') return
  if ((window.localStorage.getItem(LS_ROLE) || '').trim().toLowerCase() === 'cleaner') return
  const acc = currentSessionAccount()
  if (!acc?.id || !acc.password) return
  if (String(acc.role || 'host').trim().toLowerCase() === 'cleaner') return
  await fetch('/api/cleaning-provider-assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: acc.id,
      password: acc.password,
      action: 'push',
      assignments: map,
    }),
  }).catch(() => {})
}

/**
 * Récupère les affectations depuis le KV et les écrit en local (prestataire : scope hôte ;
 * hôte : scope session si le local est vide — ex. nouvel appareil).
 */
export async function pullCleaningProviderAssignmentsFromServer(): Promise<boolean> {
  if (!isServerAccountsMandatory() || typeof window === 'undefined') return false
  const acc = currentSessionAccount()
  if (!acc?.id || !acc.password) return false
  const role = (window.localStorage.getItem(LS_ROLE) || '').trim().toLowerCase()
  const accRole = String(acc.role || 'host').trim().toLowerCase()
  if (role === 'cleaner' && accRole !== 'cleaner') return false
  if (role !== 'cleaner' && accRole === 'cleaner') return false

  const r = await fetch('/api/cleaning-provider-assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: acc.id, password: acc.password, action: 'pull' }),
  }).catch(() => null)
  if (!r?.ok) return false
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; assignments?: Record<string, string> }
  if (!j?.ok || !j.assignments || typeof j.assignments !== 'object' || Array.isArray(j.assignments)) return false

  const jsonStr = JSON.stringify(j.assignments)
  if (role === 'cleaner') {
    writeScopedStoragePreferHostForCleaner(PROVIDER_ASSIGNMENTS_STORAGE_KEY, jsonStr)
  } else {
    const local = readProviderAssignmentsMap()
    if (Object.keys(local).length > 0) return false
    writeScopedStorage(PROVIDER_ASSIGNMENTS_STORAGE_KEY, jsonStr)
  }
  notifyCleaningProviderAssignmentsUpdated()
  return true
}
