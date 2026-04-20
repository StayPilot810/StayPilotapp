import { setTestModeEnabled, isTestModeEnabled } from './testMode'

const GUEST_KEY = 'staypilot_guest_demo_v1'
const GUEST_FORCED_TEST_KEY = 'staypilot_guest_demo_forced_test_v1'
/** Posé au clic sur « Voir la démo » (accueil) uniquement — pas d’URL publique. */
const CTA_INTENT_KEY = 'staypilot_guest_demo_cta_v1'

/** À appeler depuis le bouton Hero « Voir la démo » avant la navigation vers /dashboard. */
export function markGuestDemoOpenedFromHeroCta() {
  try {
    sessionStorage.setItem(CTA_INTENT_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Si l’utilisateur vient du CTA démo, active la session invité et consomme l’intention (une fois).
 * @returns true si la démo vient d’être activée par ce flux
 */
export function tryActivateGuestDemoFromHeroCtaIntent(): boolean {
  try {
    if (sessionStorage.getItem(CTA_INTENT_KEY) !== '1') return false
    sessionStorage.removeItem(CTA_INTENT_KEY)
    activateGuestDemoSession()
    return true
  } catch {
    return false
  }
}

export function isGuestDemoSession(): boolean {
  try {
    return sessionStorage.getItem(GUEST_KEY) === '1'
  } catch {
    return false
  }
}

/** Session démo active ou clic CTA en cours (avant useLayoutEffect) — pour ne pas afficher le mur facturation / profil. */
export function isGuestDemoRoutingActive(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(GUEST_KEY) === '1' || sessionStorage.getItem(CTA_INTENT_KEY) === '1'
  } catch {
    return false
  }
}

/** Active la visite guidée (onglets dashboard) + données de démo si besoin. */
export function activateGuestDemoSession() {
  try {
    sessionStorage.setItem(GUEST_KEY, '1')
  } catch {
    /* ignore */
  }
  if (!isTestModeEnabled()) {
    setTestModeEnabled(true)
    try {
      sessionStorage.setItem(GUEST_FORCED_TEST_KEY, '1')
    } catch {
      /* ignore */
    }
  }
}

/** Quitte la démo : retire le flag et le mode test si on l’avait activé pour la démo uniquement. */
export function deactivateGuestDemoSession() {
  try {
    sessionStorage.removeItem(GUEST_KEY)
    sessionStorage.removeItem(CTA_INTENT_KEY)
  } catch {
    /* ignore */
  }
  try {
    if (sessionStorage.getItem(GUEST_FORCED_TEST_KEY) === '1') {
      setTestModeEnabled(false)
      sessionStorage.removeItem(GUEST_FORCED_TEST_KEY)
    }
  } catch {
    /* ignore */
  }
}
