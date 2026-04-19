/**
 * Comptes StayPilot partagés entre navigateurs via Vercel KV (Upstash Redis).
 * Définir KV_REST_API_URL et KV_REST_API_TOKEN (ex. intégration Vercel KV / Redis).
 * Sans ces variables, l’app reste 100 % locale (localStorage) comme avant.
 *
 * Attention : les mots de passe sont stockés comme sur le client actuel (clair).
 * À terme : hachage côté serveur + cookies de session HttpOnly.
 */
import { kv } from '@vercel/kv'
import { sendPasswordVerificationCodeEmail } from './cancellationEmail.mjs'

const ACCOUNTS_KEY = 'staypilot_accounts_blob_v1'
const OTP_KEY_PREFIX = 'staypilot_pw_otp_v1:'

export function isRemoteAccountsConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function readAccounts() {
  const v = await kv.get(ACCOUNTS_KEY)
  if (!v) return []
  return Array.isArray(v) ? v : []
}

/** Lecture des comptes KV (pour finalisation inscription hôte / Stripe). */
export async function readAccountsBlob() {
  if (!isRemoteAccountsConfigured()) return []
  return readAccounts()
}

async function writeAccounts(accounts) {
  await kv.set(ACCOUNTS_KEY, accounts)
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function createSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function handleAuthStatus() {
  return { status: 200, json: { ok: true, remoteAuth: isRemoteAccountsConfigured() } }
}

/** Méta légère pour aligner le cache navigateur (sans exposer la liste des comptes). */
export async function handleAuthAccountsMeta() {
  if (!isRemoteAccountsConfigured()) {
    return { status: 200, json: { ok: true, remoteAuth: false, serverHasAccounts: null } }
  }
  const accounts = await readAccounts()
  return { status: 200, json: { ok: true, remoteAuth: true, serverHasAccounts: accounts.length > 0 } }
}

/** Purge la liste des comptes côté KV. Protégé par variable d’environnement (usage ponctuel). */
export async function handleAuthPurgeAccounts(body) {
  const expected = process.env.STAYPILOT_PURGE_ACCOUNTS_SECRET
  if (!expected || String(expected).length < 16) {
    return { status: 501, json: { error: 'purge_not_configured' } }
  }
  if (String(body?.secret ?? '') !== String(expected)) {
    return { status: 403, json: { error: 'forbidden' } }
  }
  if (!isRemoteAccountsConfigured()) {
    return { status: 503, json: { error: 'remote_auth_unavailable' } }
  }
  await kv.del(ACCOUNTS_KEY)
  return { status: 200, json: { ok: true, purged: true } }
}

export async function handleAuthCheckDuplicate(body) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const emailNorm = normalize(body?.email)
  const userNorm = normalize(body?.username)
  if (!emailNorm && !userNorm) return { status: 400, json: { error: 'missing_fields' } }
  const accounts = await readAccounts()
  const duplicate = accounts.some(
    (a) => normalize(a.email) === emailNorm || normalize(a.username) === userNorm,
  )
  return { status: 200, json: { ok: true, duplicate } }
}

export async function handleAuthLogin(body) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const identifier = String(body?.identifier || '').trim()
  const password = String(body?.password || '')
  if (!identifier || !password) return { status: 400, json: { error: 'missing_fields' } }
  const accounts = await readAccounts()
  const idNorm = normalize(identifier)
  const account = accounts.find(
    (a) => (normalize(a.email) === idNorm || normalize(a.username) === idNorm) && a.password === password,
  )
  if (!account) return { status: 401, json: { error: 'invalid_credentials' } }
  return { status: 200, json: { ok: true, accounts } }
}

/**
 * Crée un compte dans le blob KV (utilisé par l’API register et par la finalisation Stripe).
 * @returns {{ ok: true, account: object, accounts: object[] } | { ok: false, status: number, error: string }}
 */
export async function appendNewAccountRecord(partial) {
  if (!isRemoteAccountsConfigured()) return { ok: false, status: 503, error: 'remote_auth_unavailable' }
  if (!partial || typeof partial !== 'object') return { ok: false, status: 400, error: 'missing_account' }
  const username = String(partial.username || '').trim()
  const email = String(partial.email || '').trim()
  const password = String(partial.password || '')
  if (!username || !email || !password) return { ok: false, status: 400, error: 'missing_required_fields' }
  const accounts = await readAccounts()
  const emailNorm = normalize(email)
  const userNorm = normalize(username)
  if (accounts.some((a) => normalize(a.email) === emailNorm || normalize(a.username) === userNorm)) {
    return { ok: false, status: 409, error: 'duplicate' }
  }
  const newAccount = {
    ...partial,
    id: `acc_${Date.now()}`,
    createdAt: new Date().toISOString(),
    username,
    email,
    password,
    firstName: String(partial.firstName || '').trim(),
    lastName: String(partial.lastName || '').trim(),
    plan: partial.plan || 'Pro',
    role: partial.role || 'host',
  }
  const next = [...accounts, newAccount]
  await writeAccounts(next)
  return { ok: true, status: 200, account: newAccount, accounts: next }
}

export async function handleAuthRegister(body) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const partial = body?.account
  const result = await appendNewAccountRecord(partial)
  if (!result.ok) {
    return { status: result.status, json: { error: result.error } }
  }
  return { status: 200, json: { ok: true, accounts: result.accounts } }
}

export async function handleAuthUpdatePassword(body) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const username = String(body?.username || '').trim()
  const oldPassword = String(body?.oldPassword || '')
  const newPassword = String(body?.newPassword || '')
  if (!username || !oldPassword || !newPassword) return { status: 400, json: { error: 'missing_fields' } }
  if (newPassword.length < 8) return { status: 400, json: { error: 'weak_password' } }
  const accounts = await readAccounts()
  const uNorm = normalize(username)
  const idx = accounts.findIndex((a) => normalize(a.username) === uNorm)
  if (idx === -1) return { status: 404, json: { error: 'not_found' } }
  if (accounts[idx].password !== oldPassword) return { status: 401, json: { error: 'invalid_old_password' } }
  const next = [...accounts]
  next[idx] = { ...next[idx], password: newPassword }
  await writeAccounts(next)
  return { status: 200, json: { ok: true, accounts: next } }
}

function otpKeyForEmail(email) {
  return `${OTP_KEY_PREFIX}${normalize(email)}`
}

export async function handleAuthPasswordOtpRequest(body, env = process.env) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const identifier = String(body?.identifier || '').trim()
  if (!identifier) return { status: 400, json: { error: 'missing_identifier' } }
  const accounts = await readAccounts()
  const idNorm = normalize(identifier)
  const account = accounts.find((a) => normalize(a.email) === idNorm || normalize(a.username) === idNorm)
  if (!account) return { status: 404, json: { error: 'account_not_found' } }
  const code = createSixDigitCode()
  const email = String(account.email || '').trim()
  if (!email) return { status: 400, json: { error: 'missing_email' } }
  await kv.set(otpKeyForEmail(email), { code, exp: Date.now() + 10 * 60 * 1000 }, { ex: 600 })
  const mail = await sendPasswordVerificationCodeEmail(
    {
      to: email,
      firstName: account.firstName || '',
      locale: account.preferredLocale || 'fr',
      code,
    },
    env,
  )
  if (!mail.ok) return { status: mail.status || 503, json: { error: mail.error || 'email_failed' } }
  return { status: 200, json: { ok: true } }
}

export async function handleAuthVerifyPasswordOtp(body) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const identifier = String(body?.identifier || '').trim()
  const code = String(body?.code || '').trim()
  if (!identifier || !/^\d{6}$/.test(code)) return { status: 400, json: { error: 'invalid_payload' } }
  const accounts = await readAccounts()
  const idNorm = normalize(identifier)
  const account = accounts.find((a) => normalize(a.email) === idNorm || normalize(a.username) === idNorm)
  if (!account) return { status: 404, json: { error: 'account_not_found' } }
  const email = String(account.email || '').trim()
  const stored = await kv.get(otpKeyForEmail(email))
  if (!stored || !stored.code || typeof stored.exp !== 'number') return { status: 400, json: { error: 'no_otp' } }
  if (Date.now() > stored.exp) return { status: 400, json: { error: 'otp_expired' } }
  if (stored.code !== code) return { status: 400, json: { error: 'invalid_code' } }
  return { status: 200, json: { ok: true } }
}

export async function handleAuthForgotReset(body) {
  if (!isRemoteAccountsConfigured()) return { status: 503, json: { error: 'remote_auth_unavailable' } }
  const identifier = String(body?.identifier || '').trim()
  const code = String(body?.code || '').trim()
  const newPassword = String(body?.newPassword || '')
  if (!identifier || !/^\d{6}$/.test(code) || !newPassword) return { status: 400, json: { error: 'invalid_payload' } }
  if (newPassword.length < 8) return { status: 400, json: { error: 'weak_password' } }
  const accounts = await readAccounts()
  const idNorm = normalize(identifier)
  const idx = accounts.findIndex((a) => normalize(a.email) === idNorm || normalize(a.username) === idNorm)
  if (idx === -1) return { status: 404, json: { error: 'account_not_found' } }
  const email = String(accounts[idx].email || '').trim()
  const otpKey = otpKeyForEmail(email)
  const stored = await kv.get(otpKey)
  if (!stored || !stored.code || typeof stored.exp !== 'number') return { status: 400, json: { error: 'no_otp' } }
  if (Date.now() > stored.exp) return { status: 400, json: { error: 'otp_expired' } }
  if (stored.code !== code) return { status: 400, json: { error: 'invalid_code' } }
  const next = [...accounts]
  next[idx] = { ...next[idx], password: newPassword }
  await writeAccounts(next)
  await kv.del(otpKey)
  return { status: 200, json: { ok: true, accounts: next } }
}

/** Map Stripe Price id (env) → libellé stocké sur le compte (cohérent avec l’inscription). */
export function planDisplayNameFromStripePriceId(priceId, env = process.env) {
  const id = String(priceId || '').trim()
  if (!id) return ''
  const rows = [
    { label: 'Starter', envKey: 'STRIPE_PRICE_STARTER' },
    { label: 'Pro', envKey: 'STRIPE_PRICE_PRO' },
    { label: 'Scale', envKey: 'STRIPE_PRICE_SCALE' },
  ]
  for (const { label, envKey } of rows) {
    if (String(env[envKey] || '').trim() === id) return label
  }
  return ''
}

export function planDisplayNameFromPlanKey(planKey) {
  const k = String(planKey || '').trim().toLowerCase()
  if (k === 'starter') return 'Starter'
  if (k === 'scale') return 'Scale'
  if (k === 'pro') return 'Pro'
  return ''
}

/**
 * Met à jour le champ `plan` du compte KV selon l’abonnement Stripe (changement d’offre, portail client).
 * @returns {Promise<{ ok: boolean, plan?: string, unchanged?: boolean, reason?: string }>}
 */
export async function updateAccountPlanFromStripeSubscription(accountId, subscription, env = process.env) {
  const aid = String(accountId || '').trim()
  if (!aid || !subscription || typeof subscription !== 'object') {
    return { ok: false, reason: 'invalid_args' }
  }
  const item0 = subscription.items?.data?.[0]
  const priceId =
    typeof item0?.price === 'string' ? item0.price : String(item0?.price?.id || '').trim()
  let planLabel = planDisplayNameFromStripePriceId(priceId, env)
  if (!planLabel) planLabel = planDisplayNameFromPlanKey(subscription.metadata?.planKey)
  if (!planLabel) return { ok: false, reason: 'no_plan_mapping' }

  const accounts = await readAccounts()
  const idx = accounts.findIndex((a) => String(a.id || '').trim() === aid)
  if (idx === -1) return { ok: false, reason: 'account_not_found' }
  if (String(accounts[idx].plan || '').trim() === planLabel) {
    return { ok: true, plan: planLabel, unchanged: true }
  }
  const next = [...accounts]
  next[idx] = { ...next[idx], plan: planLabel }
  await writeAccounts(next)
  return { ok: true, plan: planLabel }
}
