import type { ReviewEntry } from '../i18n/reviews'

export const HOST_PUBLISHED_REVIEWS_LS_KEY = 'staypilot_host_published_reviews_v1'
export const HOST_REVIEWS_UPDATED_EVENT = 'staypilot-reviews-updated'

export type StoredHostReview = ReviewEntry & {
  id: string
  submittedAtIso: string
  accountKey: string
}

function safeParse(raw: string | null): StoredHostReview[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter((x) => {
      if (!x || typeof x !== 'object') return false
      const r = x as StoredHostReview
      const st = Number(r.stars)
      return (
        typeof r.id === 'string' &&
        typeof r.quote === 'string' &&
        typeof r.name === 'string' &&
        typeof r.role === 'string' &&
        typeof r.accountKey === 'string' &&
        typeof r.submittedAtIso === 'string' &&
        st >= 1 &&
        st <= 5 &&
        Number.isFinite(st)
      )
    }) as StoredHostReview[]
  } catch {
    return []
  }
}

export function readStoredHostReviews(): StoredHostReview[] {
  try {
    return safeParse(localStorage.getItem(HOST_PUBLISHED_REVIEWS_LS_KEY)).map((r) => ({
      ...r,
      stars: Math.min(5, Math.max(1, Math.round(Number(r.stars)))) as ReviewEntry['stars'],
    }))
  } catch {
    return []
  }
}

/** Plus recent en premier. */
export function readHostReviewsSorted(): StoredHostReview[] {
  return [...readStoredHostReviews()].sort(
    (a, b) => new Date(b.submittedAtIso).getTime() - new Date(a.submittedAtIso).getTime(),
  )
}

function normalizeQuoteKey(s: string) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function appendHostPublishedReview(
  entry: ReviewEntry & { accountKey: string },
): { ok: true } | { ok: false; error: string } {
  const id = `hr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const submittedAtIso = new Date().toISOString()
  const full: StoredHostReview = {
    ...entry,
    id,
    submittedAtIso,
  }
  const prev = readStoredHostReviews()
  const key = normalizeQuoteKey(full.quote)
  const dup = prev.some(
    (p) =>
      p.accountKey === full.accountKey &&
      normalizeQuoteKey(p.quote) === key &&
      Date.now() - new Date(p.submittedAtIso).getTime() < 86400000,
  )
  if (dup) {
    return { ok: false as const, error: 'Un avis identique a deja ete enregistre recemment pour ce compte.' }
  }
  const next = [full, ...prev].slice(0, 80)
  localStorage.setItem(HOST_PUBLISHED_REVIEWS_LS_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(HOST_REVIEWS_UPDATED_EVENT))
  return { ok: true as const }
}
