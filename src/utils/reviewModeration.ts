/** Modération locale des avis hôtes (gros mots, propos dégradants, spam évident). */

function stripDiacritics(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Mots / fragments injurieux ou haineux (FR + quelques EN). Liste courte, mots entiers. */
const BLOCKED_WORDS = [
  'connard',
  'connards',
  'connasse',
  'conasse',
  'merde',
  'putain',
  'putains',
  'bordel',
  'foutre',
  'salope',
  'pute',
  'putes',
  'encule',
  'enculé',
  'enculer',
  'niquer',
  'nique',
  'fdp',
  'pd',
  'tapette',
  'hitler',
  'nazi',
  'negre',
  'nègre',
  'bougnoule',
  'sale juif',
  'sale arabe',
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'nigger',
  'suicide',
  'tuer',
  'crever',
]

function buildBlockedPattern() {
  const parts = BLOCKED_WORDS.map((w) => {
    const core = stripDiacritics(w.trim()).toLowerCase()
    if (!core) return null
    return `\\b${escapeRegExp(core)}\\b`
  }).filter(Boolean) as string[]
  return new RegExp(parts.join('|'), 'iu')
}

const BLOCKED_RE = buildBlockedPattern()

const URL_RE = /https?:\/\/|www\.\S+/i
const EMAIL_RE = /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/

export function moderateHostReviewQuote(raw: string): { ok: true } | { ok: false; reason: string } {
  const text = raw.trim()
  if (text.length < 40) {
    return { ok: false, reason: 'Votre avis est trop court : au moins une quarantaine de caracteres, dans un ton respectueux.' }
  }
  if (text.length > 900) {
    return { ok: false, reason: 'Votre avis depasse la longueur maximale (900 caracteres). Raccourcissez un peu.' }
  }

  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, '')
  if (letters.length > 30) {
    const upper = letters.replace(/[^A-ZÀ-Ÿ]/g, '').length
    if (upper / letters.length > 0.55) {
      return { ok: false, reason: 'Trop de majuscules : reformulez de facon plus lisible et calme.' }
    }
  }

  if (URL_RE.test(text) || EMAIL_RE.test(text)) {
    return { ok: false, reason: 'Merci de ne pas inclure de liens ni d adresses e-mail dans le texte de l avis.' }
  }

  if (/(.)\1{6,}/.test(text)) {
    return { ok: false, reason: 'Ce texte ressemble a du spam (repetitions excessives).' }
  }

  const emojiCount = (text.match(/\p{Extended_Pictographic}/gu) || []).length
  if (emojiCount > 14) {
    return { ok: false, reason: 'Trop d emojis : privilegiez une phrase ecrite claire.' }
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 8) {
    return { ok: false, reason: 'Detaillez un peu plus votre experience (au moins quelques phrases).' }
  }

  const normalized = stripDiacritics(text).toLowerCase()
  if (BLOCKED_RE.test(normalized)) {
    return {
      ok: false,
      reason:
        'Le texte contient des formulations non conformes a notre charte (respect et courtoisie). Reformulez sans insultes ni propos degradants.',
    }
  }

  return { ok: true }
}
