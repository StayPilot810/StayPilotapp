import {
  getCleanerAssignmentMatchKeysForCurrentSession,
  providerAssignmentMatchesCleanerSession,
} from './cleanerAssignmentIdentity'
import { readProviderAssignmentsMap } from './cleaningProviderAssignments'

/** Prestataire ménage connectée avec au moins un logement attribué (même logique que DashboardCleaningPage). */
export function cleanerHasAssignedListingForCurrentSession(): boolean {
  if (typeof window === 'undefined') return false
  const role = (localStorage.getItem('staypilot_current_role') || '').trim().toLowerCase()
  if (role !== 'cleaner') return true

  const keys = getCleanerAssignmentMatchKeysForCurrentSession()
  if (!keys.length) return false

  const assignments = readProviderAssignmentsMap()
  return Object.values(assignments).some((v) => providerAssignmentMatchesCleanerSession(String(v ?? ''), keys))
}
