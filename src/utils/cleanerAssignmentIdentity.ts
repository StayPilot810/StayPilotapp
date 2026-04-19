import { getStoredAccounts, normalizeStoredLoginPiece, storedAccountMatchesNormalizedId } from '../lib/accounts'

/** Même normalisation pour libellé d’attribution côté hôte et fiche prestataire. */
export function squashAssignmentLabel(raw: string) {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Toutes les formes possibles du « nom » prestataire comparé aux champs `provider` des attributions
 * (prénom + nom, pseudo seul, identifiant de session, etc.).
 */
export function getCleanerAssignmentMatchKeysForCurrentSession(): string[] {
  if (typeof window === 'undefined') return []
  const role = (window.localStorage.getItem('staypilot_current_role') || '').trim().toLowerCase()
  if (role !== 'cleaner') return []

  const uid = (
    window.localStorage.getItem('staypilot_login_identifier') ||
    window.localStorage.getItem('staypilot_current_user') ||
    ''
  )
    .trim()
    .toLowerCase()

  const keys = new Set<string>()
  const acc = uid ? getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, uid)) : undefined

  if (acc && String(acc.role || 'host').trim().toLowerCase() === 'cleaner') {
    const full = squashAssignmentLabel(`${acc.firstName || ''} ${acc.lastName || ''}`)
    if (full) keys.add(full)
    const u = squashAssignmentLabel(String(acc.username || ''))
    if (u) keys.add(u)
    const fn = squashAssignmentLabel(String(acc.firstName || ''))
    const ln = squashAssignmentLabel(String(acc.lastName || ''))
    if (fn) keys.add(fn)
    if (ln) keys.add(ln)
    if (fn && ln) keys.add(squashAssignmentLabel(`${fn} ${ln}`))
  }

  const sessionId = squashAssignmentLabel(
    String(
      window.localStorage.getItem('staypilot_login_identifier') ||
        window.localStorage.getItem('staypilot_current_user') ||
        '',
    ),
  )
  if (sessionId) keys.add(sessionId)

  return [...keys].filter(Boolean)
}

export function providerAssignmentMatchesCleanerSession(providerLabelRaw: string, keys: string[]): boolean {
  const t = squashAssignmentLabel(providerLabelRaw)
  if (!keys.length) return false
  if (t && keys.some((k) => k && k === t)) return true
  const norm = normalizeStoredLoginPiece(providerLabelRaw)
  if (norm) {
    for (const k of keys) {
      if (normalizeStoredLoginPiece(k) === norm) return true
    }
  }
  return false
}
