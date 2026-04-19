import { appendNewAccountRecord, readAccountsBlob } from './authAccounts.mjs'
import { getStripeClient } from './stripeBilling.mjs'
import { peekPendingHostCheckoutPayload, deletePendingHostCheckout } from './hostCheckoutPending.mjs'
import { sendWelcomeOnboardingEmail } from './cancellationEmail.mjs'

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

/**
 * Crée le compte KV après Checkout Stripe réussi (webhook ou API client).
 * Idempotent si l’abonnement porte déjà accountId ou si le compte existe (409).
 * @returns {Promise<{ accountId?: string }>}
 */
export async function tryFinalizeHostCheckoutSession(session, env = process.env) {
  const out = {}
  try {
    if (!session || session.mode !== 'subscription' || session.status !== 'complete') {
      return out
    }
    const pendingId = String(session.metadata?.pendingSignupId || '').trim()
    const subRef = session.subscription
    const subId = typeof subRef === 'string' ? subRef : subRef?.id || ''
    if (!subId) return out

    const stripe = getStripeClient(env)
    let sub = await stripe.subscriptions.retrieve(subId)
    let accountId = String(sub.metadata?.accountId || '').trim()
    if (accountId) {
      out.accountId = accountId
      return out
    }

    if (!pendingId) return out

    const pending = await peekPendingHostCheckoutPayload(pendingId)
    if (!pending) return out

    const appendRes = await appendNewAccountRecord(pending)
    let account = null
    if (appendRes.ok && appendRes.account) {
      account = appendRes.account
      accountId = String(account.id || '').trim()
    } else if (!appendRes.ok && appendRes.status === 409) {
      const accounts = await readAccountsBlob()
      account = accounts.find((a) => normalize(a.email) === normalize(pending.email)) || null
      if (account) accountId = String(account.id || '').trim()
    } else {
      console.error('[hostCheckoutFinalize] append failed', appendRes)
      return out
    }

    if (!accountId) {
      return out
    }

    sub = await stripe.subscriptions.retrieve(subId)
    const mergedMeta = {
      ...(sub.metadata && typeof sub.metadata === 'object' ? sub.metadata : {}),
      accountId,
      planKey: String(session.metadata?.planKey || sub.metadata?.planKey || '').trim(),
      clientType: String(session.metadata?.clientType || sub.metadata?.clientType || 'b2b').trim(),
      trialGranted: String(session.metadata?.trialGranted || sub.metadata?.trialGranted || 'false').trim(),
      requestedBy: 'staypilot_web_pricing',
    }
    delete mergedMeta.pendingSignupId

    await stripe.subscriptions.update(subId, { metadata: mergedMeta })
    await deletePendingHostCheckout(pendingId)

    if (appendRes.ok && account) {
      void sendWelcomeOnboardingEmail(
        {
          to: String(account.email || '').trim(),
          firstName: String(account.firstName || '').trim(),
          locale: account.preferredLocale || 'fr',
          role: String(account.role || 'host').trim().toLowerCase(),
        },
        env,
      ).catch(() => {})
    }

    out.accountId = accountId
    return out
  } catch (e) {
    console.error('[hostCheckoutFinalize] error', e)
    return out
  }
}

export async function handleCompleteHostSignupRequest(body, env = process.env) {
  const sessionId = String(body?.sessionId || '').trim()
  if (!sessionId) {
    return { status: 400, json: { error: 'missing_session_id' } }
  }
  try {
    const stripe = getStripeClient(env)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const { accountId } = await tryFinalizeHostCheckoutSession(session, env)
    if (!accountId) {
      return { status: 400, json: { error: 'signup_not_finalized' } }
    }
    const accounts = await readAccountsBlob()
    return { status: 200, json: { ok: true, accounts, accountId } }
  } catch (e) {
    console.error('[hostCheckoutFinalize] complete request', e)
    return { status: 500, json: { error: 'complete_host_signup_failed' } }
  }
}
