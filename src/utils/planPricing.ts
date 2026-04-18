import type { Locale } from '../i18n/navbar'

export type PlanKey = 'starter' | 'pro' | 'scale'

const PLAN_TTC_MONTHLY_EUR: Record<PlanKey, number> = {
  starter: 19.99,
  pro: 59.99,
  scale: 99.99,
}

const BCP47: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
}

export function getPlanMonthlyTtcEur(plan: PlanKey): number {
  return PLAN_TTC_MONTHLY_EUR[plan]
}

export function computeHtFromTtc(ttc: number, vatRatePercent: number): number {
  if (!Number.isFinite(ttc) || ttc <= 0) return 0
  if (!Number.isFinite(vatRatePercent) || vatRatePercent <= 0) return ttc
  return ttc / (1 + vatRatePercent / 100)
}

export function formatEuroForLocale(locale: Locale, amount: number): string {
  const bcp47 = BCP47[locale] || 'fr-FR'
  return new Intl.NumberFormat(bcp47, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
