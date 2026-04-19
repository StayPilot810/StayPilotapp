import {
  getCleanerAssignmentMatchKeysForCurrentSession,
  providerAssignmentMatchesCleanerSession,
} from './cleanerAssignmentIdentity'
import { readScopedStoragePreferHostForCleaner } from './cleanerHostScopedStorage'

export const PROVIDER_ASSIGNMENTS_STORAGE_KEY = 'staypilot_cleaning_provider_assignments_v1'

export const CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT = 'staypilot-cleaning-assignments-updated'

function parseAssignmentRecord(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return out
    Object.entries(parsed as Record<string, unknown>).forEach(([apartmentId, provider]) => {
      if (typeof apartmentId === 'string' && typeof provider === 'string') out[apartmentId] = provider
    })
  } catch {
    /* ignore */
  }
  return out
}

/** Si le scope hôte ne correspond pas au pseudo/e-mail stocké sur la prestataire, on retrouve quand même le bon blob sur ce navigateur. */
function mergeAssignmentMapsWhereCleanerListed(keys: string[]): Record<string, string> {
  if (typeof window === 'undefined' || !keys.length) return {}
  const prefix = `${PROVIDER_ASSIGNMENTS_STORAGE_KEY}::`
  const merged: Record<string, string> = {}
  const consider = (raw: string | null) => {
    if (!raw) return
    const rec = parseAssignmentRecord(raw)
    const has = Object.values(rec).some((v) => providerAssignmentMatchesCleanerSession(String(v), keys))
    if (has) Object.assign(merged, rec)
  }
  consider(window.localStorage.getItem(PROVIDER_ASSIGNMENTS_STORAGE_KEY))
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (!k?.startsWith(prefix)) continue
    consider(window.localStorage.getItem(k))
  }
  return merged
}

export function readProviderAssignmentsMap(): Record<string, string> {
  try {
    const raw = readScopedStoragePreferHostForCleaner(PROVIDER_ASSIGNMENTS_STORAGE_KEY)
    let out: Record<string, string> = {}
    if (raw) out = parseAssignmentRecord(raw)

    const role = (typeof window !== 'undefined' && window.localStorage.getItem('staypilot_current_role') || '')
      .trim()
      .toLowerCase()
    if (role === 'cleaner') {
      const keys = getCleanerAssignmentMatchKeysForCurrentSession()
      const hasMatch = Boolean(
        keys.length && Object.values(out).some((v) => providerAssignmentMatchesCleanerSession(String(v), keys)),
      )
      if (keys.length && (!Object.keys(out).length || !hasMatch)) {
        const merged = mergeAssignmentMapsWhereCleanerListed(keys)
        if (Object.keys(merged).length) return merged
      }
    }
    return out
  } catch {
    return {}
  }
}

export function notifyCleaningProviderAssignmentsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT))
}
