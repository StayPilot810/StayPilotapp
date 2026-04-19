import {
  getStoredAccounts,
  normalizeStoredLoginPiece,
  storedAccountMatchesNormalizedId,
} from '../lib/accounts'
import { readScopedStorage, writeScopedStorage } from './sessionStorageScope'

const LS_ROLE = 'staypilot_current_role'
const LS_USER = 'staypilot_current_user'
const LS_LOGIN = 'staypilot_login_identifier'

function normalizeScopePiece(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')
}

function findHostAccountForCleanerHostRef(hostRefRaw: string) {
  const huNorm = normalizeStoredLoginPiece(hostRefRaw)
  if (!huNorm) return undefined
  return getStoredAccounts().find(
    (a) =>
      String(a.role || 'host').trim().toLowerCase() === 'host' &&
      (normalizeStoredLoginPiece(a.username) === huNorm || normalizeStoredLoginPiece(a.email) === huNorm),
  )
}

/**
 * Scopes localStorage possibles pour les données hôte (`clé::scope`), car l’hôte peut avoir
 * enregistré avec son pseudo ou son e-mail alors que `hostUsername` sur la prestataire ne
 * contient que l’autre forme.
 */
export function getHostStorageScopeCandidatesForCleaner(): string[] {
  if (typeof window === 'undefined') return []
  if ((window.localStorage.getItem(LS_ROLE) || '').trim().toLowerCase() !== 'cleaner') return []
  const uid = (window.localStorage.getItem(LS_LOGIN) || window.localStorage.getItem(LS_USER) || '').trim()
  if (!uid) return []
  const acc = getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, uid.toLowerCase()))
  const hu = (acc?.hostUsername || '').trim()
  if (!hu) return []
  const candidates = new Set<string>()
  const piece = normalizeScopePiece(hu)
  if (piece) candidates.add(piece)
  const host = findHostAccountForCleanerHostRef(hu)
  if (host) {
    const u = normalizeScopePiece(host.username)
    if (u) candidates.add(u)
    if (host.email) {
      const e = normalizeScopePiece(host.email)
      if (e) candidates.add(e)
    }
  }
  return [...candidates]
}

/** @deprecated préférer getHostStorageScopeCandidatesForCleaner ; conservé pour compat. */
export function getHostStorageScopeNormalizedForCleaner(): string | undefined {
  const list = getHostStorageScopeCandidatesForCleaner()
  return list[0]
}

export function readScopedStoragePreferHostForCleaner(baseKey: string): string | null {
  if (typeof window === 'undefined') return null
  for (const hostScope of getHostStorageScopeCandidatesForCleaner()) {
    const scopedKey = `${baseKey}::${hostScope}`
    const scoped = window.localStorage.getItem(scopedKey)
    if (scoped != null) return scoped
  }
  return readScopedStorage(baseKey)
}

export function writeScopedStoragePreferHostForCleaner(baseKey: string, value: string): void {
  if (typeof window === 'undefined') return
  const candidates = getHostStorageScopeCandidatesForCleaner()
  if (candidates.length === 0) {
    writeScopedStorage(baseKey, value)
    return
  }
  let chosen = candidates[0]
  for (const c of candidates) {
    if (window.localStorage.getItem(`${baseKey}::${c}`) != null) {
      chosen = c
      break
    }
  }
  const uid = (window.localStorage.getItem(LS_LOGIN) || window.localStorage.getItem(LS_USER) || '').trim()
  const acc = uid ? getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, uid.toLowerCase())) : undefined
  const hu = (acc?.hostUsername || '').trim()
  const host = hu ? findHostAccountForCleanerHostRef(hu) : undefined
  if (host?.username && window.localStorage.getItem(`${baseKey}::${chosen}`) == null) {
    chosen = normalizeScopePiece(host.username)
  }
  window.localStorage.setItem(`${baseKey}::${chosen}`, value)
}
