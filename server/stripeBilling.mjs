import Stripe from 'stripe'

const PLAN_KEYS = ['starter', 'pro', 'scale']
const B2C_TTC_MONTHLY_CENTS = {
  starter: 1999,
  pro: 5999,
  scale: 9999,
}

function getStripeSecret(env = process.env) {
  return (env.STRIPE_SECRET_KEY || '').trim()
}

function getPriceIdForPlan(planKey, env = process.env) {
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

async function shouldGrantTrialForEmail(stripe, email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return false
  try {
    const customers = await stripe.customers.list({ email: normalized, limit: 20 })
    if (!customers.data.length) return true
    for (const customer of customers.data) {
      const consumed = await customerHasConsumedTrial(stripe, customer.id)
      if (consumed) return false
    }
    return true
  } catch {
    // If Stripe lookup fails, stay conservative to avoid granting repeated free trials.
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
  const grantTrial = await shouldGrantTrialForEmail(stripe, email)
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
  if (accountId) metadata.accountId = accountId

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems,
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    customer_email: email,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: !isB2c },
    customer_creation: 'always',
    allow_promotion_codes: true,
    subscription_data: grantTrial
      ? { trial_period_days: 14 }
      : undefined,
    locale: ['fr', 'en', 'es', 'de', 'it'].includes(locale) ? locale : 'fr',
    metadata,
  })

  return {
    ok: true,
    status: 200,
    url: session.url,
    id: session.id,
  }
}
