import { useSyncExternalStore } from 'react'
import { getAppPathname } from '../utils/appPath'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  window.addEventListener('pageshow', onStoreChange)
  return () => {
    window.removeEventListener('popstate', onStoreChange)
    window.removeEventListener('pageshow', onStoreChange)
  }
}

function getSnapshot() {
  return getAppPathname()
}

function getServerSnapshot() {
  return '/'
}

/**
 * Pathname courant, réactif au retour arrière / bfcache (pageshow).
 */
export function useAppPathname() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
