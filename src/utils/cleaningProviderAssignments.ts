import { readScopedStorage } from './sessionStorageScope'

export const PROVIDER_ASSIGNMENTS_STORAGE_KEY = 'staypilot_cleaning_provider_assignments_v1'

export const CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT = 'staypilot-cleaning-assignments-updated'

export function readProviderAssignmentsMap(): Record<string, string> {
  try {
    const raw = readScopedStorage(PROVIDER_ASSIGNMENTS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    Object.entries(parsed as Record<string, unknown>).forEach(([apartmentId, provider]) => {
      if (typeof apartmentId === 'string' && typeof provider === 'string') out[apartmentId] = provider
    })
    return out
  } catch {
    return {}
  }
}

export function notifyCleaningProviderAssignmentsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT))
}
