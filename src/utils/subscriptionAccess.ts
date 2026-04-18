export type PlanTier = 'starter' | 'pro' | 'scale'

function normalizePlan(raw: string) {
  return raw.trim().toLowerCase()
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

export function canAccessDashboardPath(plan: PlanTier, pathname: string): boolean {
  if (plan === 'scale') return true
  const normalizedPath = pathname.trim().toLowerCase()
  if (plan === 'starter') {
    return (
      normalizedPath === '/dashboard' ||
      normalizedPath === '/dashboard/connecter-logements' ||
      normalizedPath === '/dashboard/calendrier' ||
      normalizedPath === '/dashboard/veille-informationnelle'
    )
  }
  // Pro
  return normalizedPath !== '/dashboard/whatsapp' && normalizedPath !== '/dashboard/acces-anticipe'
}
