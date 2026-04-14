import { sendCancellationConfirmationEmail } from '../server/cancellationEmail.mjs'

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
    const result = await sendCancellationConfirmationEmail(body)
    if (!result.ok) {
      res.status(result.status || 500).json({ error: result.error || 'email_error' })
      return
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({
      error: 'email_send_failed',
      message: e instanceof Error ? e.message : 'Erreur envoi e-mail',
    })
  }
}

