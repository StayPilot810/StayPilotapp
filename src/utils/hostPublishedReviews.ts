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

function dedupeOneReviewPerAccount(reviews: StoredHostReview[]): StoredHostReview[] {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.submittedAtIso).getTime() - new Date(a.submittedAtIso).getTime(),
  )
  const seen = new Set<string>()
  const out: StoredHostReview[] = []
  for (const r of sorted) {
    const k = (r.accountKey || '').trim().toLowerCase()
    if (!k) {
      out.push(r)
      continue
    }
    if (seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }
  return out
}

export function readStoredHostReviews(): StoredHostReview[] {
  try {
    const raw = localStorage.getItem(HOST_PUBLISHED_REVIEWS_LS_KEY)
    let list = safeParse(raw).map((r) => ({
      ...r,
      stars: Math.min(5, Math.max(1, Math.round(Number(r.stars)))) as ReviewEntry['stars'],
    }))
    const deduped = dedupeOneReviewPerAccount(list)
    if (deduped.length !== list.length) {
      localStorage.setItem(HOST_PUBLISHED_REVIEWS_LS_KEY, JSON.stringify(deduped))
      list = deduped
      window.dispatchEvent(new Event(HOST_REVIEWS_UPDATED_EVENT))
    }
    return list
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

function normalizeAccountKey(s: string) {
  return String(s || '').trim().toLowerCase()
}

export function getHostReviewForAccount(accountKey: string): StoredHostReview | null {
  const k = normalizeAccountKey(accountKey)
  if (!k) return null
  const all = readStoredHostReviews()
  const mine = all.filter((r) => normalizeAccountKey(r.accountKey) === k)
  if (!mine.length) return null
  return mine.sort((a, b) => new Date(b.submittedAtIso).getTime() - new Date(a.submittedAtIso).getTime())[0]
}

export function removeHostPublishedReviewForAccount(accountKey: string): boolean {
  const k = normalizeAccountKey(accountKey)
  if (!k) return false
  const prev = readStoredHostReviews()
  const next = prev.filter((p) => normalizeAccountKey(p.accountKey) !== k)
  if (next.length === prev.length) return false
  localStorage.setItem(HOST_PUBLISHED_REVIEWS_LS_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(HOST_REVIEWS_UPDATED_EVENT))
  return true
}

/** Un seul avis par compte : un nouvel envoi remplace l’ancien pour la même `accountKey`. */
export function appendHostPublishedReview(
  entry: ReviewEntry & { accountKey: string },
): { ok: true; replaced: boolean } | { ok: false; error: string } {
  const acct = normalizeAccountKey(entry.accountKey)
  if (!acct) {
    return { ok: false as const, error: 'Compte invalide pour publier un avis.' }
  }
  const id = `hr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const submittedAtIso = new Date().toISOString()
  const full: StoredHostReview = {
    ...entry,
    accountKey: acct,
    id,
    submittedAtIso,
  }
  const prev = readStoredHostReviews()
  const hadExisting = prev.some((p) => normalizeAccountKey(p.accountKey) === acct)
  const withoutSameAccount = prev.filter((p) => normalizeAccountKey(p.accountKey) !== acct)
  const next = [full, ...withoutSameAccount].slice(0, 80)
  localStorage.setItem(HOST_PUBLISHED_REVIEWS_LS_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(HOST_REVIEWS_UPDATED_EVENT))
  return { ok: true as const, replaced: hadExisting }
}
