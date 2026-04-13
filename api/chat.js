/**
 * Vercel Serverless Function — POST /api/chat
 * Clés : GROQ_API_KEY (recommandé, quota gratuit sur console.groq.com) et/ou OPENAI_API_KEY.
 * STAYPILOT_AI_PROVIDER=groq|openai si les deux sont définies (sinon OpenAI prioritaire si les deux présents).
 * Modèles : GROQ_CHAT_MODEL (défaut llama-3.1-8b-instant), OPENAI_CHAT_MODEL (défaut gpt-4o-mini).
 */
import { handleAiChat } from '../server/aiChat.mjs'

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

  const { status, json } = await handleAiChat(body)
  res.status(status).json(json)
}
