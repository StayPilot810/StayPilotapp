import { kv } from '@vercel/kv'

const AI_CHAT_HISTORY_PREFIX = 'staypilot_ai_chat_history_v1:'
const HISTORY_TTL_SECONDS = 60 * 60 * 24 * 30
const HISTORY_MAX_TURNS = 60

function isAiHistoryConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

function normalizeUserKey(raw) {
  return String(raw || '').trim().toLowerCase().slice(0, 120)
}

function historyKey(userKey) {
  return `${AI_CHAT_HISTORY_PREFIX}${userKey}`
}

function sanitizeHistoryTurn(raw) {
  if (!raw || typeof raw !== 'object') return null
  const role = raw.role === 'assistant' ? 'assistant' : raw.role === 'user' ? 'user' : null
  if (!role) return null
  const content = String(raw.content || '').trim().slice(0, 4000)
  if (!content) return null
  return { role, content }
}

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(sanitizeHistoryTurn)
    .filter(Boolean)
    .slice(-HISTORY_MAX_TURNS)
}

function sanitizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const out = {}
  if (Number.isFinite(raw.listingsCount)) {
    out.listingsCount = Math.max(0, Math.trunc(Number(raw.listingsCount)))
  }
  if (typeof raw.primaryGoal === 'string') {
    const v = raw.primaryGoal.trim().slice(0, 80)
    if (v) out.primaryGoal = v
  }
  if (typeof raw.notes === 'string') {
    const v = raw.notes.trim().slice(0, 300)
    if (v) out.notes = v
  }
  if (typeof raw.updatedAt === 'string') {
    const v = raw.updatedAt.trim().slice(0, 60)
    if (v) out.updatedAt = v
  }
  return out
}

export async function loadAiChatHistory(userKeyRaw) {
  if (!isAiHistoryConfigured()) return { ok: true, remote: false, messages: [] }
  const userKey = normalizeUserKey(userKeyRaw)
  if (!userKey) return { ok: false, status: 400, error: 'missing_user_key' }
  const row = await kv.get(historyKey(userKey))
  return {
    ok: true,
    remote: true,
    messages: sanitizeHistory(Array.isArray(row?.messages) ? row.messages : []),
    profile: sanitizeProfile(row?.profile),
  }
}

export async function saveAiChatHistory(userKeyRaw, turnsRaw, profilePatchRaw) {
  if (!isAiHistoryConfigured()) return { ok: true, remote: false }
  const userKey = normalizeUserKey(userKeyRaw)
  if (!userKey) return { ok: false, status: 400, error: 'missing_user_key' }
  const turns = sanitizeHistory(turnsRaw)
  const key = historyKey(userKey)
  const current = await kv.get(key)
  const currentProfile = sanitizeProfile(current?.profile)
  const profilePatch = sanitizeProfile(profilePatchRaw)
  const profile =
    Object.keys(profilePatch).length > 0
      ? {
          ...currentProfile,
          ...profilePatch,
          updatedAt: new Date().toISOString(),
        }
      : currentProfile
  await kv.set(
    key,
    {
      messages: turns,
      profile,
      updatedAt: new Date().toISOString(),
    },
    { ex: HISTORY_TTL_SECONDS },
  )
  return { ok: true, remote: true }
}

