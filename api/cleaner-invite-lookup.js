import { handleCleanerInviteLookupRequest } from '../server/cleanerInviteKv.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  try {
    const q = req.query || {}
    const { status, json } = await handleCleanerInviteLookupRequest(q)
    res.status(status).json(json)
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e instanceof Error ? e.message : 'error' })
  }
}
