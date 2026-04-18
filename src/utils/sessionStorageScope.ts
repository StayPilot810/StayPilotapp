const LS_CURRENT_USER = 'staypilot_current_user'
const LS_LOGIN_IDENTIFIER = 'staypilot_login_identifier'

function normalizeScope(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')
}

export function getCurrentSessionScope() {
  if (typeof window === 'undefined') return 'anonymous'
  const fromCurrent = window.localStorage.getItem(LS_CURRENT_USER) || ''
  const fromLogin = window.localStorage.getItem(LS_LOGIN_IDENTIFIER) || ''
  const value = normalizeScope(fromCurrent || fromLogin)
  return value || 'anonymous'
}

export function scopedStorageKey(baseKey: string) {
  return `${baseKey}::${getCurrentSessionScope()}`
}

export function readScopedStorage(baseKey: string) {
  if (typeof window === 'undefined') return null
  const scoped = window.localStorage.getItem(scopedStorageKey(baseKey))
  if (scoped != null) return scoped
  // Backward compatibility: fallback to legacy non-scoped key.
  return window.localStorage.getItem(baseKey)
}

export function writeScopedStorage(baseKey: string, value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(scopedStorageKey(baseKey), value)
}
