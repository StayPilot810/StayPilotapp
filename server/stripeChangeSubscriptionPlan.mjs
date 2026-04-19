/**
 * Mise à jour Stripe + KV pour un upgrade de forfait (évite que le resync App.tsx
 * réécrase le plan local avec l’ancien état KV).
 */
import { readAccountsBlob, updateAccountPlanFromStripeSubscription } from './authAccounts.mjs'
import { readStripeBillingState } from './stripeBillingKv.mjs'
import {
  B2C_TTC_MONTHLY_CENTS,
  getPriceIdForPlan,
  getStripeClient,
  parsePlanKey,
} from './stripeBilling.mjs'

function planTierRank(planKey) {
  const k = String(planKey || '').trim().toLowerCase()
  if (k === 'starter') return 1
  if (k === 'scale') return 3
  return 2
}

function accountPlanKey(account) {
  return parsePlanKey(String(account?.plan || '')) || 'starter'
}

export async function handleStripeChangeSubscriptionPlanRequest(body, env = process.env) {
  const accountId = String(body?.accountId || '').trim()
  const password = String(body?.password || '')
  const planKey = parsePlanKey(body?.planKey)
  if (!accountId || !password || !planKey) {
    return { status: 400, json: { error: 'missing_fields' } }
  }

  const accounts = await readAccountsBlob()
  const idx = accounts.findIndex((a) => String(a.id || '').trim() === accountId)
  if (idx === -1) return { status: 404, json: { error: 'account_not_found' } }
  if (String(accounts[idx].password || '') !== password) {
    return { status: 401, json: { error: 'invalid_password' } }
  }

  const currentKey = accountPlanKey(accounts[idx])
  if (planTierRank(planKey) <= planTierRank(currentKey)) {
    return { status: 400, json: { error: 'not_an_upgrade' } }
  }

  const billing = await readStripeBillingState(accountId)
  const subId = String(billing?.stripeSubscriptionId || '').trim()
  if (!subId) return { status: 400, json: { error: 'no_active_subscription' } }

  let stripe
  try {
    stripe = getStripeClient(env)
  } catch {
    return { status: 503, json: { error: 'stripe_unavailable' } }
  }

  let sub
  try {
    sub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price.product'] })
  } catch {
    return { status: 502, json: { error: 'stripe_sub_retrieve_failed' } }
  }

  const metaAid = String(sub.metadata?.accountId || '').trim()
  if (metaAid !== accountId) {
    return { status: 403, json: { error: 'subscription_mismatch' } }
  }

  const item0 = sub.items?.data?.[0]
  if (!item0?.id) return { status: 400, json: { error: 'no_subscription_item' } }

  const clientType = String(sub.metadata?.clientType || accounts[idx].clientType || 'b2b')
    .trim()
    .toLowerCase()

  try {
    if (clientType === 'b2c') {
      const priceObj = item0.price
      const productRef = priceObj?.product
      const productId = typeof productRef === 'string' ? productRef : productRef?.id
      if (!productId) return { status: 400, json: { error: 'missing_product_for_b2c' } }
      const cents = B2C_TTC_MONTHLY_CENTS[planKey]
      await stripe.subscriptionItems.update(item0.id, {
        price_data: {
          currency: 'eur',
          unit_amount: cents,
          tax_behavior: 'inclusive',
          recurring: { interval: 'month' },
          product: productId,
        },
        proration_behavior: 'none',
      })
      const mergedMeta = { ...(sub.metadata && typeof sub.metadata === 'object' ? sub.metadata : {}), planKey }
      await stripe.subscriptions.update(subId, { metadata: mergedMeta })
    } else {
      const newPriceId = getPriceIdForPlan(planKey, env)
      if (!newPriceId) return { status: 500, json: { error: 'missing_plan_price_id' } }
      const mergedMeta = { ...(sub.metadata && typeof sub.metadata === 'object' ? sub.metadata : {}), planKey }
      await stripe.subscriptions.update(subId, {
        items: [{ id: item0.id, price: newPriceId }],
        metadata: mergedMeta,
        proration_behavior: 'none',
      })
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e)
    console.error('[stripeChangeSubscriptionPlan] update failed', raw)
    return { status: 502, json: { error: 'stripe_update_failed', message: raw } }
  }

  let subAfter
  try {
    subAfter = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price'] })
  } catch {
    return { status: 502, json: { error: 'stripe_sub_retrieve_failed' } }
  }

  const up = await updateAccountPlanFromStripeSubscription(accountId, subAfter, env)
  if (!up.ok) {
    return { status: 500, json: { error: 'plan_sync_failed', reason: up.reason || 'unknown' } }
  }
  return { status: 200, json: { ok: true, plan: up.plan } }
}
