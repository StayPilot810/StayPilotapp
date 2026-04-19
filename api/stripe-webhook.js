import { getStripeClient } from '../server/stripeBilling.mjs'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
  if (!secret) {
    res.status(500).json({ error: 'missing_webhook_secret' })
    return
  }

  const signature = req.headers['stripe-signature']
  if (!signature) {
    res.status(400).json({ error: 'missing_stripe_signature' })
    return
  }

  try {
    const rawBody = await readRawBody(req)
    const stripe = getStripeClient()
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret)

    const { processStripeBillingWebhook } = await import('../server/stripeBillingKv.mjs')
    const billingResult = await processStripeBillingWebhook(event, process.env)
    if (billingResult?.handled) {
      console.log('[stripe] billing_kv', event.type, billingResult.reason || 'ok')
    } else {
      console.log('[stripe] event', event.type, billingResult?.reason || '')
    }

    res.status(200).json({ received: true })
  } catch (e) {
    res.status(400).json({ error: 'invalid_webhook_signature', message: e instanceof Error ? e.message : 'Webhook invalide' })
  }
}
