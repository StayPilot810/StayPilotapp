import { handleAuthAccountsMeta } from '../server/authAccounts.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  try {
    const { status, json } = await handleAuthAccountsMeta()
    res.status(status).json(json)
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e instanceof Error ? e.message : 'error' })
  }
}
