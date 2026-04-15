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

    // TODO: Persist this in DB when backend billing storage is ready.
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('[stripe] checkout.session.completed', session.id)
    }
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      console.log(`[stripe] ${event.type}`, subscription.id)
    }

    res.status(200).json({ received: true })
  } catch (e) {
    res.status(400).json({ error: 'invalid_webhook_signature', message: e instanceof Error ? e.message : 'Webhook invalide' })
  }
}
