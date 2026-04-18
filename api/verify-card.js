import { verifyCardWithStripe } from '../server/stripeCardVerification.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  } catch {
    res.status(400).json({ error: 'invalid_json' })
    return
  }

  try {
    const result = await verifyCardWithStripe(body)
    if (!result.ok) {
      res.status(result.status || 500).json({ error: result.error || 'card_verification_failed' })
      return
    }
    res.status(200).json({ ok: true, verified: true })
  } catch (e) {
    res.status(500).json({
      error: 'card_verification_failed',
      message: e instanceof Error ? e.message : 'Erreur verification carte',
    })
  }
}
