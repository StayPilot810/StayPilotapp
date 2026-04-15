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

const ACCOUNTS_KEY = 'staypilot_accounts'

function normalize(value: string) {
  return value.trim().toLowerCase()
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

export function hasAnyAccount() {
  return getStoredAccounts().length > 0
}

export function accountExistsByEmailOrUsername(email: string, username: string) {
  const emailNorm = normalize(email)
  const userNorm = normalize(username)
  return getStoredAccounts().some(
    (a) => normalize(a.email) === emailNorm || normalize(a.username) === userNorm,
  )
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
  const idNorm = normalize(identifier)
  return getStoredAccounts().find(
    (a) => (normalize(a.email) === idNorm || normalize(a.username) === idNorm) && a.password === password,
  )
}

