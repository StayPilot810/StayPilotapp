import { useEffect, useMemo, useState } from 'react'
import { CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT } from '../utils/cleaningProviderAssignments'
import { cleanerHasAssignedListingForCurrentSession } from '../utils/cleanerListingAccess'

const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'

/**
 * Recalcule l’attribution ménage quand comptes, attributions ou connexions changent (autre onglet, hôte qui assigne, etc.).
 */
export function useCleanerAssignedListingReactive(isCleanerSession: boolean): boolean {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((n) => n + 1)
    window.addEventListener('staypilot-session-changed', bump)
    window.addEventListener(CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT, bump)
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, bump)
    const onStorage = (e: StorageEvent) => {
      const k = e.key || ''
      if (k === 'staypilot_accounts' || k === null || k.includes('staypilot_cleaning_provider')) bump()
    }
    window.addEventListener('storage', onStorage)
    const onVis = () => {
      if (document.visibilityState === 'visible') bump()
    }
    const onFocus = () => bump()
    const onPageShow = () => bump()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('staypilot-session-changed', bump)
      window.removeEventListener(CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT, bump)
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, bump)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  return useMemo(() => {
    if (!isCleanerSession) return true
    return cleanerHasAssignedListingForCurrentSession()
  }, [isCleanerSession, tick])
}
