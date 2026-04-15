import { verifyVatNumberOfficial } from '../server/vatValidation.mjs'

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

  const result = await verifyVatNumberOfficial(body)
  if (!result.ok) {
    res.status(result.status || 500).json({ error: result.error || 'vat_check_failed' })
    return
  }
  res.status(200).json(result)
}
