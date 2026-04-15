import Stripe from 'stripe'

const PLAN_KEYS = ['starter', 'pro', 'scale']

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

export async function createStripeCheckoutSession(payload = {}, env = process.env) {
  const planKey = parsePlanKey(payload.planKey)
  if (!planKey) {
    return { ok: false, status: 400, error: 'invalid_plan' }
  }
  const priceId = getPriceIdForPlan(planKey, env)
  if (!priceId) {
    return { ok: false, status: 500, error: 'missing_plan_price_id' }
  }

  const stripe = getStripeClient(env)
  const urls = computeUrls(env)
  const email = String(payload.email || '').trim() || undefined
  const locale = String(payload.locale || '').trim().toLowerCase() || 'fr'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    customer_email: email,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    customer_creation: 'always',
    allow_promotion_codes: true,
    locale: ['fr', 'en', 'es', 'de', 'it'].includes(locale) ? locale : 'fr',
    metadata: {
      planKey,
      requestedBy: 'staypilot_web_pricing',
    },
  })

  return {
    ok: true,
    status: 200,
    url: session.url,
    id: session.id,
  }
}
