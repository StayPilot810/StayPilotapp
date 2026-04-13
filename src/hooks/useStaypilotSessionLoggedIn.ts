import { useEffect, useState } from 'react'
import { useAppPathname } from './useAppPathname'

const SESSION_KEY = 'staypilot_session_active'

function readSession(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SESSION_KEY) === 'true'
}

/**
 * Indique si l’utilisateur a une session StayPilot (connexion ou accès gratuit dashboard).
 * Se met à jour au changement de page, entre onglets (storage), ou après login (événement custom).
 */
export function useStaypilotSessionLoggedIn(): boolean {
  const pathname = useAppPathname()
  const [loggedIn, setLoggedIn] = useState(readSession)

  useEffect(() => {
    setLoggedIn(readSession())
  }, [pathname])

  useEffect(() => {
    const sync = () => setLoggedIn(readSession())
    window.addEventListener('storage', sync)
    window.addEventListener('staypilot-session-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('staypilot-session-changed', sync)
    }
  }, [])

  return loggedIn
}
