import Stripe from 'stripe'
import { deletePendingHostCheckout, saveHostCheckoutPending } from './hostCheckoutPending.mjs'

const PLAN_KEYS = ['starter', 'pro', 'scale']
/** Montants TTC mensuels (centimes) pour abonnements B2C créés via Checkout `price_data`. */
export const B2C_TTC_MONTHLY_CENTS = {
  starter: 1999,
  pro: 5999,
  scale: 9999,
}

function getStripeSecret(env = process.env) {
  return (env.STRIPE_SECRET_KEY || '').trim()
}

export function getPriceIdForPlan(planKey, env = process.env) {
  const key = String(planKey || '').trim().toLowerCase()
  if (!PLAN_KEYS.includes(key)) return ''
  const map = {
    starter: 'STRIPE_PRICE_STARTER',
    pro: 'STRIPE_PRICE_PRO',
    scale: 'STRIPE_PRICE_SCALE',
  }
  return (env[map[key]] || '').trim()
}

function getBaseUrl(env = process.env) {
  return (env.APP_BASE_URL || env.VITE_APP_BASE_URL || '').trim() || 'http://127.0.0.1:5174'
}

function computeUrls(env = process.env) {
  const base = getBaseUrl(env).replace(/\/+$/, '')
  return {
    successUrl: `${base}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/inscription?checkout=cancelled`,
  }
}

/** Stripe Tax / automatic_tax must be configured in the Dashboard; otherwise sessions.create fails. */
function isStripeAutomaticTaxEnabled(env = process.env) {
  const disable =
    ['1', 'true', 'yes', 'on'].includes(String(env.STRIPE_CHECKOUT_DISABLE_AUTOMATIC_TAX || '').trim().toLowerCase()) ||
    ['0', 'false', 'off', 'no'].includes(String(env.STRIPE_CHECKOUT_AUTOMATIC_TAX || 'true').trim().toLowerCase())
  return !disable
}

export function getStripeClient(env = process.env) {
  const secret = getStripeSecret(env)
  if (!secret) throw new Error('missing_stripe_secret_key')
  return new Stripe(secret)
}

export function parsePlanKey(rawPlan) {
  const value = String(rawPlan || '').trim().toLowerCase()
  if (!PLAN_KEYS.includes(value)) return null
  return value
}

async function customerHasConsumedTrial(stripe, customerId) {
  if (!customerId) return false
  try {
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
    return subs.data.some((sub) => Number(sub.trial_start || 0) > 0 || Number(sub.trial_end || 0) > 0)
  } catch {
    return false
  }
}

/**
 * Par défaut : toujours 14 j d’essai sur Checkout (email connu ou saisi plus tard sur Stripe).
 * Pour réactiver l’ancien blocage « un essai par e-mail côté Stripe », définir STRIPE_TRIAL_STRICT_EMAIL_CHECK=true sur Vercel.
 */
async function shouldGrantTrialForEmail(stripe, email, env = process.env) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return true

  const strict = ['1', 'true', 'yes'].includes(
    String(env.STRIPE_TRIAL_STRICT_EMAIL_CHECK || '').trim().toLowerCase(),
  )
  if (!strict) return true

  try {
    const customers = await stripe.customers.list({ email: normalized, limit: 20 })
    if (!customers.data.length) return true
    for (const customer of customers.data) {
      const consumed = await customerHasConsumedTrial(stripe, customer.id)
      if (consumed) return false
    }
    return true
  } catch {
    return false
  }
}

export async function createStripeCheckoutSession(payload = {}, env = process.env) {
  const planKey = parsePlanKey(payload.planKey)
  if (!planKey) {
    return { ok: false, status: 400, error: 'invalid_plan' }
  }
  const clientType = String(payload.clientType || '').trim().toLowerCase()
  const isB2c = clientType === 'b2c'
  const priceId = !isB2c ? getPriceIdForPlan(planKey, env) : ''
  if (!isB2c && !priceId) {
    return { ok: false, status: 500, error: 'missing_plan_price_id' }
  }

  const stripe = getStripeClient(env)
  const urls = computeUrls(env)
  const email = String(payload.email || '').trim() || undefined
  const accountId = String(payload.accountId || '').trim()
  const locale = String(payload.locale || '').trim().toLowerCase() || 'fr'

  let pendingSignupId = ''
  const pendingHost = payload?.pendingHostAccount
  if (pendingHost && typeof pendingHost === 'object') {
    const save = await saveHostCheckoutPending(pendingHost)
    if (!save.ok) {
      if (save.error === 'duplicate') return { ok: false, status: 409, error: 'duplicate_account' }
      if (save.error === 'pending_host_requires_kv') return { ok: false, status: 503, error: 'pending_host_requires_kv' }
      return { ok: false, status: 500, error: save.error || 'pending_save_failed' }
    }
    pendingSignupId = save.pendingId
  }

  const grantTrial = await shouldGrantTrialForEmail(stripe, email, env)
  const b2cAmount = B2C_TTC_MONTHLY_CENTS[planKey]
  const lineItems = isB2c
    ? [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: b2cAmount,
        recurring: { interval: 'month' },
        tax_behavior: 'inclusive',
        product_data: { name: `StayPilot ${planKey}` },
      },
    }]
    : [{ price: priceId, quantity: 1 }]
  const metadata = {
    planKey,
    clientType: isB2c ? 'b2c' : 'b2b',
    trialGranted: grantTrial ? 'true' : 'false',
    requestedBy: 'staypilot_web_pricing',
  }
  if (pendingSignupId) {
    metadata.pendingSignupId = pendingSignupId
  } else if (accountId) {
    metadata.accountId = accountId
  }

  const subscription_data = {
    metadata: { ...metadata },
    ...(grantTrial ? { trial_period_days: 14 } : {}),
  }

  const automaticTaxEnabled = isStripeAutomaticTaxEnabled(env)

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_collection: 'always',
      payment_method_options: {
        card: { request_three_d_secure: 'any' },
      },
      line_items: lineItems,
      success_url: urls.successUrl,
      cancel_url: urls.cancelUrl,
      customer_email: email,
      billing_address_collection: 'required',
      ...(automaticTaxEnabled ? { automatic_tax: { enabled: true } } : {}),
      tax_id_collection: { enabled: !isB2c },
      allow_promotion_codes: true,
      subscription_data,
      locale: ['fr', 'en', 'es', 'de', 'it'].includes(locale) ? locale : 'fr',
      metadata,
    })
  } catch (e) {
    if (pendingSignupId) {
      await deletePendingHostCheckout(pendingSignupId)
    }
    const raw = e instanceof Error ? e.message : String(e)
    console.error('[stripeBilling] checkout.sessions.create failed', raw)
    return {
      ok: false,
      status: 502,
      error: 'stripe_session_failed',
      message: raw,
    }
  }

  return {
    ok: true,
    status: 200,
    url: session.url,
    id: session.id,
  }
}
