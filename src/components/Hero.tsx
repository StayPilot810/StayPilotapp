import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Calendar } from 'lucide-react'
import { HERO_PRIMARY_CTA_FR } from '../i18n/frHeroCta'
import { heroTranslations } from '../i18n/hero'
import { useLanguage } from '../hooks/useLanguage'
import { MotionAnchor, Reveal, StaggerReveal, staggerItem } from './motion'
import { markGuestDemoOpenedFromHeroCta } from '../utils/guestDemo'

const primary = '#4f86f7'
const green = '#22c55e'

const REVENUE_VALUES = [1180, 1320, 1480, 1620, 1780, 1950, 2320, 2680, 2440, 2160, 1720, 2180]
const OCCUPANCY_VALUES = [52, 56, 61, 64, 68, 72, 79, 84, 80, 75, 69, 74]

const axisTick = { fill: '#9ca3af', fontSize: 11, fontFamily: 'Inter, sans-serif' }

const easeHero = [0.22, 1, 0.36, 1] as const

function formatEuros(n: number, locale: string) {
  return `${n.toLocaleString(locale)}\u00a0€`
}

type ChartMetric = 'revenue' | 'occupancy'
type ChartRow = { m: string; revenue: number; occupancy: number }

function RevenueTooltip({
  active,
  payload,
  label,
  loc,
  monthLabel,
  valueLabel,
  metric,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartRow }>
  label?: string | number
  loc: string
  monthLabel: string
  valueLabel: string
  metric: ChartMetric
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const month = label != null ? String(label) : row.m
  return (
    <div
      className="rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-[13px] shadow-pm-lg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <p className="mb-1.5 font-semibold text-zinc-900">
        {monthLabel}: {month}
      </p>
      <p className="font-semibold" style={{ color: primary }}>
        {valueLabel}: {metric === 'revenue' ? formatEuros(row.revenue, loc) : `${row.occupancy}%`}
      </p>
    </div>
  )
}

function AirbnbBelo() {
  return (
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 22.21c-1.21-1.5-2.02-2.86-2.02-4.09 0-1.27.95-2.15 2.02-2.15 1.08 0 2.02.88 2.02 2.15 0 1.23-.8 2.59-2.02 4.09m0-18.21c4.34 4.26 7.2 6.82 7.2 9.91 0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.09 2.86-5.65 7.2-9.91" />
    </svg>
  )
}

function IntegrationBadges() {
  const reduceMotion = useReducedMotion()
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start sm:gap-4">
      <motion.div
        className="flex items-center gap-2"
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.92 }}
        animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -4, 0], scale: 1 }}
        transition={reduceMotion ? { duration: 0.2 } : { duration: 0.55, delay: 0.15, ease: easeHero }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.045,
                y: -1,
                transition: { duration: 0.18, ease: easeHero },
              }
        }
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a5f] shadow-pm-xs sm:h-10 sm:w-10">
          <AirbnbBelo />
        </div>
        <span className="text-sm font-bold text-zinc-900 sm:text-[15px]">Airbnb</span>
      </motion.div>
      <motion.div
        className="flex items-center gap-2"
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.92 }}
        animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -4, 0], scale: 1 }}
        transition={reduceMotion ? { duration: 0.2 } : { duration: 0.55, delay: 0.28, ease: easeHero }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.045,
                y: -1,
                transition: { duration: 0.18, ease: easeHero },
              }
        }
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003580] shadow-pm-xs sm:h-10 sm:w-10">
          <Calendar className="h-[18px] w-[18px] text-white sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
        </div>
        <span className="text-sm font-bold text-zinc-900 sm:text-[15px]">Booking.com</span>
      </motion.div>
    </div>
  )
}

export function Hero() {
  const { locale } = useLanguage()
  const copy = heroTranslations[locale]
  const reduceMotion = useReducedMotion()
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue')
  const loc = locale === 'en' ? 'en-GB' : locale === 'de' ? 'de-DE' : locale === 'it' ? 'it-IT' : locale === 'es' ? 'es-ES' : 'fr-FR'

  const chartData = useMemo((): ChartRow[] => {
    const months = copy.monthShort
    return REVENUE_VALUES.map((revenue, i) => ({
      m: months[i] ?? '',
      revenue,
      occupancy: OCCUPANCY_VALUES[i] ?? 0,
    }))
  }, [locale, copy])

  const isRevenue = chartMetric === 'revenue'
  const currentValue = isRevenue ? formatEuros(2180, loc) : '74%'
  const currentTrend = isRevenue ? copy.revenueTrend : copy.occupancyTrend
  const currentTitle = isRevenue ? copy.revenueTitle : copy.occupancyTitle
  const currentTooltipLabel = isRevenue ? copy.tooltipRevenue : copy.tooltipOccupancy

  return (
    <section className="relative border-b border-zinc-200/50 bg-white bg-[radial-gradient(ellipse_100%_60%_at_50%_-30%,rgba(79,134,247,0.09),transparent_55%)]">
      <div className="mx-auto grid max-w-[1200px] items-start gap-8 px-4 pb-16 pt-10 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-x-16 lg:gap-y-0 lg:px-8 lg:pb-24 lg:pt-20">
        {/* Colonne gauche */}
        <Reveal className="mx-auto max-w-[560px] text-center lg:mx-0 lg:text-left" y={22}>
          {copy.heroEyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">
              {copy.heroEyebrow}
            </p>
          ) : null}
          <h1
            className={`text-[1.65rem] font-bold leading-[1.18] tracking-[-0.03em] text-zinc-900 min-[400px]:text-[1.9rem] sm:text-[2.5rem] sm:leading-[1.12] lg:text-[2.85rem] ${copy.heroEyebrow ? 'mt-3 sm:mt-4' : ''}`}
          >
            <span className="block">{copy.headlineLine1}</span>
            <span className="mt-1 block text-[#4f86f7] sm:mt-1.5">{copy.headlineAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[34rem] text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-[17px] lg:mx-0">
            {copy.subheadline}
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-[26rem] flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-start sm:justify-center sm:gap-4 lg:mx-0 lg:justify-start">
            <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
              <motion.a
                href="#essai-gratuit"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-6 py-3.5 text-[15px] font-semibold text-white shadow-pm-cta transition-[filter] duration-200 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f86f7]/45 focus-visible:ring-offset-2 sm:w-auto sm:min-h-0 sm:px-8 sm:py-[14px] sm:text-[16px] lg:shadow-pm-cta-lg whitespace-nowrap"
                style={{ backgroundColor: primary }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        scale: 1.05,
                        boxShadow:
                          '0 14px 34px -12px rgba(79,134,247,0.85), 0 0 0 8px rgba(79,134,247,0.14)',
                        transition: { duration: 0.22, ease: easeHero },
                      }
                }
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              >
                {locale === 'fr' ? HERO_PRIMARY_CTA_FR : copy.ctaStart}
              </motion.a>
              <p className="text-center text-[10px] leading-relaxed text-zinc-400 sm:text-left sm:text-[11px]">
                {copy.ctaMicroTrust}
              </p>
            </div>
            <MotionAnchor
              href="/dashboard"
              onClick={() => {
                markGuestDemoOpenedFromHeroCta()
              }}
              variant="subtle"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-6 py-3.5 text-[15px] font-semibold text-zinc-900 shadow-pm-xs transition-colors duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 sm:w-auto sm:min-h-0 sm:self-start sm:px-8 sm:py-[14px] sm:text-[16px]"
            >
              {copy.ctaDemo}
            </MotionAnchor>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-[11px] leading-relaxed text-zinc-500 sm:mt-5 sm:text-xs lg:mx-0 lg:text-left">
            {copy.heroTrustBullets}
          </p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 sm:mt-10 sm:text-[11px]">
            {copy.platforms}
          </p>
          <div className="mt-3 flex justify-center sm:mt-4 lg:justify-start">
            <IntegrationBadges />
          </div>
        </Reveal>

        {/* Colonne droite — cartes + bulles */}
        <div className="relative w-full min-w-0">
          <StaggerReveal className="flex w-full flex-col gap-5 sm:gap-6">
            <motion.div
              variants={staggerItem(reduceMotion, 14)}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -3,
                      boxShadow:
                        '0 22px 44px -12px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                      transition: { type: 'tween', duration: 0.28, ease: easeHero },
                    }
              }
              className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-pm-sm sm:p-6 sm:shadow-pm-md"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:text-[11px]">
                  {currentTitle}
                </p>
                <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setChartMetric('revenue')}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      isRevenue ? 'bg-white text-zinc-900 shadow-pm-xs' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    €
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('occupancy')}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      !isRevenue ? 'bg-white text-zinc-900 shadow-pm-xs' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-[1.875rem] font-bold tracking-tight text-zinc-900 sm:text-[2.25rem]">
                {currentValue}
              </p>
              <p className="mt-0.5 text-xs font-semibold sm:text-[13px]" style={{ color: green }}>
                {currentTrend}
              </p>
              <div className="mt-3 h-[168px] w-full sm:mt-4 sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="m" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                    <YAxis
                      domain={isRevenue ? [1000, 3000] : [40, 90]}
                      ticks={isRevenue ? [1000, 1500, 2000, 2500, 3000] : [40, 50, 60, 70, 80, 90]}
                      axisLine={false}
                      tickLine={false}
                      tick={axisTick}
                      tickFormatter={(v) => (isRevenue ? `${v}€` : `${v}%`)}
                      width={44}
                    />
                    <Tooltip
                      cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={(props) => (
                        <RevenueTooltip
                          active={props.active}
                          payload={props.payload}
                          label={props.label}
                          loc={loc}
                          monthLabel={copy.tooltipMonth}
                          valueLabel={currentTooltipLabel}
                          metric={chartMetric}
                        />
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey={chartMetric}
                      stroke={primary}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: primary, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem(reduceMotion, 14)}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -3,
                      boxShadow:
                        '0 22px 44px -12px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                      transition: { type: 'tween', duration: 0.28, ease: easeHero },
                    }
              }
              className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-pm-sm sm:p-6 sm:shadow-pm-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:text-[11px]">
                {copy.localSignalsTitle}
              </p>
              <p className="mt-1.5 text-[1.35rem] font-bold tracking-tight text-zinc-900 sm:text-[1.65rem]">
                {copy.targetApartmentLabel}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-500 sm:text-[13px]">
                {copy.gpsLabel}
              </p>
              <p className="mt-2 text-xs font-medium text-zinc-600 sm:text-[13px]">
                {copy.premiumSignalsLine}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold sm:text-xs">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">📍 {copy.chipCity}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">📅 {copy.chipEvents}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">📈 {copy.chipRevenue}</span>
              </div>
              <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3">
                <div className="relative mx-auto h-[124px] max-w-[260px]">
                  <svg viewBox="0 0 220 180" className="h-full w-full" aria-hidden>
                    <path
                      d="M94 14 L121 18 L140 32 L163 42 L171 62 L166 81 L176 99 L165 125 L147 140 L135 162 L113 170 L89 162 L78 143 L57 130 L45 112 L49 90 L38 73 L47 48 L64 36 L80 20 Z"
                      fill="#eaf1ff"
                      stroke="#cfdaf0"
                      strokeWidth="2"
                    />
                    <circle cx="111" cy="72" r="8" fill="#4f86f7" opacity="0.18" />
                    <circle cx="111" cy="72" r="4.5" fill="#4f86f7" />
                  </svg>
                  <div className="absolute left-[58%] top-[30%] -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 shadow-pm-xs">
                    Paris
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[12px] font-semibold text-zinc-700 sm:text-[13px]">
                    {copy.eventsSummaryTitle}
                    <span className="text-zinc-400 transition-transform duration-200 group-open:rotate-180">▼</span>
                  </summary>
                  <div className="space-y-2 border-t border-zinc-200/70 px-3 py-2.5 text-[12px] sm:text-[13px]">
                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-2.5 py-2">
                      <p className="font-medium text-zinc-800">{copy.eventsSummarySubtitle}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-2.5">
                      <p className="text-[13px] font-bold text-emerald-700 sm:text-sm">{copy.estimatedRevenueHeadline}</p>
                    </div>
                    {copy.localEvents.map((event) => (
                      <div
                        key={event.title}
                        className={`rounded-lg border px-2.5 py-2 ${
                          event.strongOpportunity
                            ? 'border-amber-200/90 bg-amber-50/50'
                            : 'border-zinc-200/80 bg-zinc-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-zinc-800">{event.title}</p>
                          {event.strongOpportunity ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:text-[11px]">
                              {copy.strongOpportunityBadge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-semibold text-emerald-600">{event.action}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-emerald-700/80 sm:text-xs">{event.estimatedImpact}</p>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-1 inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 sm:text-[13px]"
                    >
                      {copy.applyOptimizationsCta}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                      className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 py-2 text-[12px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 sm:text-[13px]"
                    >
                      {copy.closeDropdownCta}
                    </button>
                  </div>
                </details>
              </div>
            </motion.div>
          </StaggerReveal>
        </div>
      </div>
    </section>
  )
}
