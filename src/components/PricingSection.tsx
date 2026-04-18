import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { computeHtFromTtc, formatEuroForLocale, getPlanMonthlyTtcEur, type PlanKey } from '../utils/planPricing'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'

const primary = '#4a86f7'
const green = '#16a34a'

type PlanVariant = 'light' | 'featured'

function FeatureRow({
  text,
  variant,
}: {
  text: string
  variant: PlanVariant
}) {
  const iconClass =
    variant === 'featured'
      ? 'text-white'
      : 'text-[#16a34a]'
  return (
    <li className="flex gap-2.5 text-left">
      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2.5} aria-hidden />
      <span
        className={`text-[14px] leading-snug sm:text-sm ${
          variant === 'featured' ? 'text-white/95' : 'text-[#3f3f46]'
        }`}
      >
        {text}
      </span>
    </li>
  )
}

type PlanInnerProps = {
  planKey: PlanKey
  variant: PlanVariant
  roiBadge?: string
  popularBadge?: string
  name: string
  range: string
  outcome: string
  priceSuffix: string
  trial: string
  features: string[]
  cta: string
  loadingLabel: string
  locale: 'fr' | 'en' | 'es' | 'de' | 'it'
  onCheckout?: (planKey: PlanKey) => void
  loading?: boolean
}

function PlanCardInner({
  variant,
  roiBadge,
  popularBadge,
  name,
  range,
  outcome,
  priceSuffix,
  trial,
  features,
  cta,
  loadingLabel,
  planKey,
  locale,
  onCheckout,
  loading = false,
}: PlanInnerProps) {
  const isFeatured = variant === 'featured'
  const reduceMotion = useReducedMotion()
  const ttc = getPlanMonthlyTtcEur(planKey)
  const ht = computeHtFromTtc(ttc, 20)

  return (
    <>
      {roiBadge ? (
        <div className="pointer-events-none absolute -top-4 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-2">
          <motion.span
            className="whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-4px_rgba(245,158,11,0.55)] ring-2 ring-amber-200/60"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.04, 1],
                    boxShadow: [
                      '0 8px 24px -4px rgba(245,158,11,0.45)',
                      '0 12px 28px -4px rgba(245,158,11,0.65)',
                      '0 8px 24px -4px rgba(245,158,11,0.45)',
                    ],
                  }
            }
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {roiBadge}
          </motion.span>
        </div>
      ) : null}
      <div className={roiBadge ? 'pt-5' : ''}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-lg font-bold tracking-tight ${isFeatured ? 'text-white' : 'text-zinc-900'}`}>
            {name}
          </h3>
          {popularBadge && isFeatured ? (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/30">
              {popularBadge}
            </span>
          ) : null}
        </div>
        <p className={`mt-1.5 text-sm ${isFeatured ? 'text-white/90' : 'text-zinc-600'}`}>{range}</p>
        <p className={`mt-2 text-sm font-semibold leading-snug ${isFeatured ? 'text-white/95' : 'text-zinc-800'}`}>
          {outcome}
        </p>
      </div>
      <div className="mt-5">
        <p className={`flex flex-wrap items-baseline gap-x-1 ${isFeatured ? 'text-white' : 'text-zinc-900'}`}>
          <span
            className={`font-bold tracking-tight ${isFeatured ? 'text-4xl sm:text-[2.35rem]' : 'text-3xl sm:text-[2rem]'}`}
          >
            {formatEuroForLocale(locale, ht)}
          </span>
          <span className={`text-sm font-semibold ${isFeatured ? 'text-white/90' : 'text-zinc-700'}`}>
            HT {priceSuffix}
          </span>
        </p>
        <p className={`mt-1 text-xs ${isFeatured ? 'text-white/80' : 'text-zinc-500'}`}>
          {`${formatEuroForLocale(locale, ttc)} TTC`}
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${isFeatured ? 'text-white' : ''}`}
          style={!isFeatured ? { color: green } : undefined}
        >
          {trial}
        </p>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {features.map((f, i) => (
          <FeatureRow key={`${name}-${i}`} text={f} variant={variant} />
        ))}
      </ul>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => onCheckout?.(planKey)}
          disabled={loading}
          className={`flex min-h-[48px] w-full items-center justify-center rounded-xl px-4 py-3 text-[15px] font-semibold shadow-pm-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-h-0 sm:text-[14px] ${
            isFeatured
              ? 'bg-white text-[#4a86f7] shadow-pm-md hover:bg-zinc-50 focus-visible:ring-white/50'
              : 'border border-zinc-900/90 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-[#4a86f7]/35'
          } disabled:cursor-not-allowed disabled:opacity-60`}
          style={isFeatured ? { color: primary } : undefined}
        >
          {loading ? loadingLabel : cta}
        </button>
      </div>
    </>
  )
}

export function PricingSection() {
  const { t, locale } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [loadingPlan, setLoadingPlan] = useState<null | 'starter' | 'pro' | 'scale'>(null)
  const loadingLabel = {
    fr: 'Redirection...',
    en: 'Redirecting...',
    es: 'Redirigiendo...',
    de: 'Weiterleitung...',
    it: 'Reindirizzamento...',
  }[locale]

  async function startCheckout(planKey: 'starter' | 'pro' | 'scale') {
    try {
      setLoadingPlan(planKey)
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'checkout_session_failed')
      window.location.href = data.url
    } catch {
      setLoadingPlan(null)
      window.location.href = '/inscription'
    }
  }

  const plans: PlanInnerProps[] = [
    {
      planKey: 'starter',
      variant: 'light',
      name: t.starterName,
      range: t.starterRange,
      outcome: t.starterOutcome,
      priceSuffix: t.starterPriceSuffix,
      trial: t.planTrial,
      features: [...t.starterFeatures],
      cta: t.planCta,
      loadingLabel,
      locale,
    },
    {
      planKey: 'pro',
      variant: 'featured',
      roiBadge: t.roiBadge,
      popularBadge: t.popularBadge,
      name: t.proName,
      range: t.proRange,
      outcome: t.proOutcome,
      priceSuffix: t.proPriceSuffix,
      trial: t.planTrial,
      features: [...t.proFeatures],
      cta: t.planCta,
      loadingLabel,
      locale,
    },
    {
      planKey: 'scale',
      variant: 'light',
      name: t.scaleName,
      range: t.scaleRange,
      outcome: t.scaleOutcome,
      priceSuffix: t.scalePriceSuffix,
      trial: t.planTrial,
      features: [...t.scaleFeatures],
      cta: t.planCta,
      loadingLabel,
      locale,
    },
  ]

  return (
    <section
      id="tarifs"
      className="scroll-mt-[64px] border-t border-zinc-200/50 bg-pm-app py-12 sm:scroll-mt-[72px] sm:py-14 lg:py-16"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-4xl text-center" y={18}>
          <header>
            <h2
              id="pricing-heading"
              className="text-[1.375rem] font-bold tracking-[-0.03em] text-zinc-900 sm:text-3xl lg:text-[1.85rem]"
            >
              {t.pricingTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              {t.pricingSubtitle}
            </p>
            <p className="mx-auto mt-2 max-w-3xl text-[12px] font-normal text-zinc-500 sm:text-[13px]">
              {t.mandatoryChannelManagerNote}
            </p>
          </header>
        </Reveal>

        <StaggerReveal
          className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 lg:mx-auto lg:mt-14 lg:grid lg:max-w-[1100px] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.24fr)_minmax(0,0.88fr)] lg:items-stretch lg:gap-4 lg:px-1"
          stagger={0.07}
        >
          {plans.map((plan) => {
            const isFeatured = plan.variant === 'featured'
            const hoverLift = reduceMotion
              ? undefined
              : isFeatured
                ? {
                    y: -10,
                    scale: 1.03,
                    opacity: 1,
                    boxShadow:
                      '0 32px 64px -12px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                    transition: { type: 'tween' as const, duration: 0.32, ease: easePremium },
                  }
                : {
                    y: -8,
                    scale: 1.02,
                    opacity: 1,
                    boxShadow:
                      '0 22px 44px -12px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.06)',
                    transition: { type: 'tween' as const, duration: 0.3, ease: easePremium },
                  }

            return (
              <motion.div
                key={plan.name}
                variants={staggerItem(reduceMotion, isFeatured ? 32 : 18)}
                whileHover={hoverLift}
                className={`relative flex h-full flex-col rounded-2xl border p-5 sm:p-6 ${
                  isFeatured
                    ? 'z-[2] border-white/20 shadow-pm-featured ring-2 ring-blue-400/35 ring-offset-2 ring-offset-[#f3f4f6] lg:-my-1 lg:py-7'
                    : 'z-[1] border-zinc-200/70 bg-white/95 shadow-pm-md lg:translate-y-1 lg:opacity-[0.94]'
                }`}
                style={{ backgroundColor: isFeatured ? primary : undefined }}
              >
                <PlanCardInner
                  {...plan}
                  onCheckout={startCheckout}
                  loading={loadingPlan === plan.planKey}
                />
              </motion.div>
            )
          })}
        </StaggerReveal>
      </div>
    </section>
  )
}
