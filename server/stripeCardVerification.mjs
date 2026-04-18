import { getStripeClient } from './stripeBilling.mjs'

function sanitizeDigits(value, maxLen) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLen)
}

function parseExpiry(value) {
  const m = String(value || '').trim().match(/^(\d{2})\/(\d{2})$/)
  if (!m) return null
  const month = Number(m[1])
  const year2 = Number(m[2])
  if (!Number.isFinite(month) || month < 1 || month > 12) return null
  const year = 2000 + year2
  return { exp_month: month, exp_year: year }
}

export async function verifyCardWithStripe(payload = {}, env = process.env) {
  const number = sanitizeDigits(payload?.number, 19)
  const cvc = sanitizeDigits(payload?.cvc, 4)
  const expiry = parseExpiry(payload?.expiry)
  if (!number || number.length < 13 || !cvc || !expiry) {
    return { ok: false, status: 400, error: 'invalid_card_payload' }
  }

  try {
    const stripe = getStripeClient(env)
    const setupIntent = await stripe.setupIntents.create({
      confirm: true,
      usage: 'off_session',
      payment_method_types: ['card'],
      payment_method_data: {
        type: 'card',
        card: {
          number,
          exp_month: expiry.exp_month,
          exp_year: expiry.exp_year,
          cvc,
        },
      },
      metadata: {
        source: 'staypilot_profile_card_verification',
      },
    })

    if (setupIntent.status === 'succeeded') {
      return { ok: true, status: 200, verified: true }
    }
    if (setupIntent.status === 'requires_action') {
      return { ok: false, status: 402, error: 'card_requires_authentication' }
    }
    return { ok: false, status: 402, error: 'card_verification_failed' }
  } catch (e) {
    const message = e instanceof Error ? e.message.toLowerCase() : ''
    if (message.includes('declined') || message.includes('invalid') || message.includes('cvc') || message.includes('expired')) {
      return { ok: false, status: 402, error: 'card_rejected' }
    }
    return { ok: false, status: 502, error: 'stripe_verification_unavailable' }
  }
}
