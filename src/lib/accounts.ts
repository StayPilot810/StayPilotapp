export type StoredAccount = {
  id: string
  plan: string
  role?: 'host' | 'cleaner'
  hostUsername?: string
  clientType?: 'b2b' | 'b2c'
  countryCode?: string
  vatNumber?: string
  vatVerified?: boolean
  firstName: string
  lastName: string
  username: string
  email: string
  /** Set when the signup email was confirmed with a one-time code. */
  emailVerified?: boolean
  password: string
  company?: string
  phone?: string
  /** Optional promotional code entered at signup (hosts). */
  promoCode?: string
  preferredLocale?: 'fr' | 'en' | 'es' | 'de' | 'it'
  createdAt: string
}

import { isServerAccountsMandatory } from './serverAccountsPolicy'

const ACCOUNTS_KEY = 'staypilot_accounts'

export function normalizeStoredLoginPiece(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

/** Identifiant courant (email ou username) déjà en minuscules — tolère champs non-string après JSON.parse. */
export function storedAccountMatchesNormalizedId(
  a: Pick<StoredAccount, 'email' | 'username'>,
  loginIdNorm: string,
): boolean {
  const id = normalizeStoredLoginPiece(loginIdNorm)
  if (!id) return false
  return normalizeStoredLoginPiece(a.email) === id || normalizeStoredLoginPiece(a.username) === id
}

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : []
  } catch {
    return []
  }
}

export function saveStoredAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function clearStoredAccounts() {
  localStorage.removeItem(ACCOUNTS_KEY)
}

/** Si le serveur (KV) n’a aucun compte mais le navigateur garde d’anciennes entrées locales, on les retire (évite faux « comptes » vs connexion prod). */
export async function clearLocalAccountsIfRemoteServerEmpty(): Promise<void> {
  try {
    const st = (await fetch('/api/auth-status', { method: 'GET' }).then((r) =>
      r.json().catch(() => ({})),
    )) as { remoteAuth?: boolean }
    if (!st?.remoteAuth) return
    const meta = (await fetch('/api/auth-accounts-meta', { method: 'GET' }).then((r) =>
      r.json().catch(() => ({})),
    )) as { remoteAuth?: boolean; serverHasAccounts?: boolean | null }
    if (!meta?.remoteAuth || meta.serverHasAccounts !== false) return
    if (getStoredAccounts().length > 0) clearStoredAccounts()
  } catch {
    /* ignore */
  }
}

export function hasAnyAccount() {
  return getStoredAccounts().length > 0
}

export function accountExistsByEmailOrUsername(email: string, username: string) {
  const emailNorm = normalizeStoredLoginPiece(email)
  const userNorm = normalizeStoredLoginPiece(username)
  return getStoredAccounts().some(
    (a) => normalizeStoredLoginPiece(a.email) === emailNorm || normalizeStoredLoginPiece(a.username) === userNorm,
  )
}

/** Vérifie les doublons sur le serveur KV si activé, sinon local uniquement. */
export async function accountExistsByEmailOrUsernameAsync(email: string, username: string) {
  try {
    const r = await fetch('/api/auth-status', { method: 'GET' })
    const j = (await r.json().catch(() => ({}))) as { remoteAuth?: boolean }
    if (!j?.remoteAuth) {
      if (isServerAccountsMandatory()) return false
      return accountExistsByEmailOrUsername(email, username)
    }
    const res = await fetch('/api/auth-check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username }),
    })
    if (res.status === 503) {
      if (isServerAccountsMandatory()) return false
      return accountExistsByEmailOrUsername(email, username)
    }
    const d = (await res.json().catch(() => ({}))) as { duplicate?: boolean }
    return Boolean(d?.duplicate)
  } catch {
    if (isServerAccountsMandatory()) return false
    return accountExistsByEmailOrUsername(email, username)
  }
}

export function createAccount(account: Omit<StoredAccount, 'id' | 'createdAt'>) {
  const accounts = getStoredAccounts()
  const newAccount: StoredAccount = {
    ...account,
    id: `acc_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  saveStoredAccounts([...accounts, newAccount])
  return newAccount
}

export function findAccountForLogin(identifier: string, password: string) {
  const idNorm = normalizeStoredLoginPiece(identifier)
  return getStoredAccounts().find(
    (a) =>
      (normalizeStoredLoginPiece(a.email) === idNorm || normalizeStoredLoginPiece(a.username) === idNorm) &&
      a.password === password,
  )
}

