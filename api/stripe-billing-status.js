import { handleStripeBillingStatusRequest } from '../server/stripeBillingKv.mjs'

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
    const { status, json } = await handleStripeBillingStatusRequest(body)
    res.status(status).json(json)
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e instanceof Error ? e.message : 'error' })
  }
}
