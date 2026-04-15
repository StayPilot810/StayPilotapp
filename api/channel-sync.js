import { syncOfficialChannelData } from '../server/channelSync.mjs'

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

  const result = await syncOfficialChannelData(body)
  res.status(result.status || 500).json(result)
}
