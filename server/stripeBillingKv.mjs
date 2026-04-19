/**
 * État facturation Stripe par compte StayPilot (KV), pour couper l’accès dashboard
 * dès le premier invoice.payment_failed et le rétablir quand l’abonnement redevient actif / en essai.
 */
import { kv } from '@vercel/kv'
import {
  isRemoteAccountsConfigured,
  readAccountsBlob,
  updateAccountPlanFromStripeSubscription,
} from './authAccounts.mjs'
import { getStripeClient } from './stripeBilling.mjs'
import { tryFinalizeHostCheckoutSession } from './hostCheckoutFinalize.mjs'

const PREFIX = 'staypilot_stripe_billing_v1:'

export function stripeBillingKvKey(accountId) {
  return `${PREFIX}${String(accountId || '').trim()}`
}

export async function readStripeBillingState(accountId) {
  if (!isRemoteAccountsConfigured() || !String(accountId || '').trim()) return null
  try {
    const v = await kv.get(stripeBillingKvKey(accountId))
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

export async function writeStripeBillingState(accountId, patch) {
  const id = String(accountId || '').trim()
  if (!isRemoteAccountsConfigured() || !id) return
  const key = stripeBillingKvKey(id)
  try {
    let prev = {}
    const existing = await kv.get(key)
    if (existing && typeof existing === 'object') prev = existing
    await kv.set(key, {
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[stripeBillingKv] write failed', key, e)
  }
}

function pickAccountIdFromSubscription(sub) {
  return String(sub?.metadata?.accountId || '').trim()
}

function subscriptionAllowsAccess(status) {
  return status === 'active' || status === 'trialing'
}

/**
 * @param {import('stripe').Stripe.Event} event
 */
export async function processStripeBillingWebhook(event, env = process.env) {
  if (!isRemoteAccountsConfigured()) return { handled: false, reason: 'no_kv' }

  const stripe = getStripeClient(env)
  const type = event.type

  try {
    if (type === 'checkout.session.completed') {
      const session = event.data.object
      const finalize = await tryFinalizeHostCheckoutSession(session, env)
      const accountId = String(
        (finalize && finalize.accountId) || session.metadata?.accountId || '',
      ).trim()
      const subRef = session.subscription
      const subId = typeof subRef === 'string' ? subRef : subRef?.id || ''
      const custRef = session.customer
      const customerId = typeof custRef === 'string' ? custRef : custRef?.id || ''
      if (!accountId) return { handled: true, reason: 'no_account_after_checkout' }
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        await updateAccountPlanFromStripeSubscription(accountId, sub, env).catch(() => {})
        await writeStripeBillingState(accountId, {
          blocked: !subscriptionAllowsAccess(sub.status),
          stripeCustomerId: customerId || String(sub.customer || ''),
          stripeSubscriptionId: subId,
          subscriptionStatus: sub.status,
          lastEvent: type,
        })
      } else {
        await writeStripeBillingState(accountId, {
          blocked: false,
          stripeCustomerId: customerId,
          lastEvent: type,
        })
      }
      return { handled: true }
    }

    if (type === 'invoice.payment_failed') {
      const invoice = event.data.object
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id || ''
      if (!subId) return { handled: true }
      const sub = await stripe.subscriptions.retrieve(subId)
      const accountId = pickAccountIdFromSubscription(sub)
      if (!accountId) return { handled: true, reason: 'no_account_id_on_sub' }
      await writeStripeBillingState(accountId, {
        blocked: true,
        lastReason: 'invoice.payment_failed',
        subscriptionStatus: sub.status,
        stripeSubscriptionId: subId,
        lastEvent: type,
      })
      return { handled: true }
    }

    if (type === 'invoice.paid') {
      const invoice = event.data.object
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id || ''
      if (!subId) return { handled: true }
      const sub = await stripe.subscriptions.retrieve(subId)
      const accountId = pickAccountIdFromSubscription(sub)
      if (!accountId) return { handled: true, reason: 'no_account_id_on_sub' }
      await updateAccountPlanFromStripeSubscription(accountId, sub, env).catch(() => {})
      await writeStripeBillingState(accountId, {
        blocked: !subscriptionAllowsAccess(sub.status),
        subscriptionStatus: sub.status,
        stripeSubscriptionId: subId,
        lastReason: 'invoice.paid',
        lastEvent: type,
      })
      return { handled: true }
    }

    if (type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const accountId = pickAccountIdFromSubscription(sub)
      if (!accountId) return { handled: true, reason: 'no_account_id_on_sub' }
      await writeStripeBillingState(accountId, {
        blocked: true,
        subscriptionStatus: 'canceled',
        lastReason: 'subscription.deleted',
        lastEvent: type,
      })
      return { handled: true }
    }

    if (type === 'customer.subscription.updated') {
      const sub = event.data.object
      const accountId = pickAccountIdFromSubscription(sub)
      if (!accountId) return { handled: true, reason: 'no_account_id_on_sub' }
      const status = sub.status
      await updateAccountPlanFromStripeSubscription(accountId, sub, env).catch(() => {})
      await writeStripeBillingState(accountId, {
        blocked: !subscriptionAllowsAccess(status),
        subscriptionStatus: status,
        lastEvent: type,
      })
      return { handled: true }
    }
  } catch (e) {
    console.error('[stripeBillingKv] webhook handler error', type, e)
    return { handled: false, error: e instanceof Error ? e.message : String(e) }
  }

  return { handled: false }
}

export async function handleStripeBillingStatusRequest(body) {
  const accountId = String(body?.accountId || '').trim()
  if (!accountId) return { status: 400, json: { error: 'missing_account_id' } }
  if (!isRemoteAccountsConfigured()) {
    return { status: 200, json: { ok: true, blocked: false, remote: false, subscriptionStatus: null, plan: null } }
  }
  const state = await readStripeBillingState(accountId)
  const accounts = await readAccountsBlob()
  const acc = accounts.find((a) => String(a.id || '').trim() === accountId)
  const plan = acc?.plan ? String(acc.plan).trim() : null
  return {
    status: 200,
    json: {
      ok: true,
      blocked: Boolean(state?.blocked),
      subscriptionStatus: state?.subscriptionStatus ? String(state.subscriptionStatus) : null,
      remote: true,
      plan,
    },
  }
}
