export type PlanTier = 'starter' | 'pro' | 'scale'

function normalizePlan(raw: string) {
  return String(raw ?? '').trim().toLowerCase()
}

export function getPlanTierFromValue(rawPlan: string): PlanTier {
  const plan = normalizePlan(rawPlan)
  if (plan === 'scale') return 'scale'
  if (plan === 'starter') return 'starter'
  return 'pro'
}

export function getCurrentPlanTier(): PlanTier {
  if (typeof window === 'undefined') return 'pro'
  const fromSession = window.localStorage.getItem('staypilot_current_plan') || ''
  return getPlanTierFromValue(fromSession)
}

export function getListingLimitForPlan(plan: PlanTier): number | null {
  if (plan === 'starter') return 3
  if (plan === 'pro') return 10
  return null
}

/** Accès cumulatif : Starter ⊂ Pro ⊂ Scale (Starter inclut ménage + consommables ; Scale = Pro + WhatsApp + accès anticipé). */
export function canAccessDashboardPath(plan: PlanTier, pathname: string): boolean {
  const normalizedPath = pathname.trim().toLowerCase()

  /** Réservé Scale : WhatsApp prioritaire, accès anticipé aux nouveautés. */
  const scaleOnlyPath =
    normalizedPath === '/dashboard/whatsapp' || normalizedPath === '/dashboard/acces-anticipe'

  if (plan === 'scale') return true
  if (scaleOnlyPath) return false

  if (plan === 'starter') {
    return (
      normalizedPath === '/dashboard' ||
      normalizedPath === '/dashboard/connecter-logements' ||
      normalizedPath === '/dashboard/calendrier' ||
      normalizedPath === '/dashboard/statistiques' ||
      normalizedPath === '/dashboard/prestataire-menage' ||
      normalizedPath === '/dashboard/consommables'
    )
  }

  // Pro : tout sauf les chemins réservés Scale (inclut veille info, tableau des charges, etc.)
  return true
}
