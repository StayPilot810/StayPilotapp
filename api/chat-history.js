import { loadAiChatHistory, saveAiChatHistory } from '../server/aiChatHistory.mjs'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userKey = String(req.query?.userKey || '').trim()
    const result = await loadAiChatHistory(userKey)
    if (!result.ok) {
      res.status(result.status || 400).json({ error: result.error || 'invalid_request' })
      return
    }
    res.status(200).json({ ok: true, remote: result.remote, messages: result.messages, profile: result.profile || {} })
    return
  }

  if (req.method === 'POST') {
    let body = {}
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    } catch {
      res.status(400).json({ error: 'invalid_json' })
      return
    }
    const result = await saveAiChatHistory(body?.userKey, body?.messages, body?.profilePatch)
    if (!result.ok) {
      res.status(result.status || 400).json({ error: result.error || 'invalid_request' })
      return
    }
    res.status(200).json({ ok: true, remote: result.remote })
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}

