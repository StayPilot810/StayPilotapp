/** Cache court pour éviter un GET /api/auth-status à chaque frappe. */
let remoteAuthCache: boolean | null = null
let remoteAuthAt = 0
const REMOTE_AUTH_TTL_MS = 30_000

/**
 * Indique si le stockage comptes distant (Vercel KV) est actif côté serveur.
 * Si false, l’app utilise uniquement le localStorage comme avant.
 */
export async function fetchRemoteAuthEnabled(): Promise<boolean> {
  const now = Date.now()
  if (remoteAuthCache !== null && now - remoteAuthAt < REMOTE_AUTH_TTL_MS) {
    return remoteAuthCache
  }
  try {
    const r = await fetch('/api/auth-status', { method: 'GET' })
    const j = (await r.json().catch(() => ({}))) as { remoteAuth?: boolean }
    remoteAuthCache = Boolean(j?.remoteAuth)
  } catch {
    remoteAuthCache = false
  }
  remoteAuthAt = now
  return remoteAuthCache
}

export function clearRemoteAuthEnabledCache() {
  remoteAuthCache = null
}
