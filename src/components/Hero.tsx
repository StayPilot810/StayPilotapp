import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
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
import { heroTranslations } from '../i18n/hero'
import { useLanguage } from '../hooks/useLanguage'
import { MotionAnchor, Reveal, StaggerReveal, staggerItem } from './motion'

const primary = '#4f86f7'
const green = '#22c55e'

const REVENUE_VALUES = [1180, 1320, 1480, 1620, 1780, 1950, 2320, 2680, 2440, 2160, 1720, 2180]
const OCCUPANCY_VALUES = [52, 55, 58, 61, 64, 67, 72, 90, 78, 74, 73, 76]

const axisTick = { fill: '#9ca3af', fontSize: 11, fontFamily: 'Inter, sans-serif' }

function formatEuros(n: number, locale: string) {
  return `${n.toLocaleString(locale)}\u00a0€`
}

type ChartRow = { m: string; revenue: number; occupancy: number }

/** Graphique du haut = revenus → infobulle uniquement en € */
function RevenueTooltip({
  active,
  payload,
  label,
  loc,
  monthLabel,
  valueLabel,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartRow }>
  label?: string | number
  loc: string
  monthLabel: string
  valueLabel: string
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
        {valueLabel}: {formatEuros(row.revenue, loc)}
      </p>
    </div>
  )
}

/** Infobulle occupation : mois + « taux d'occupation : X% » */
function OccupancyTooltip({
  active,
  payload,
  label,
  monthLabel,
  valueLabel,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartRow }>
  label?: string | number
  monthLabel: string
  valueLabel: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const month = label != null ? String(label) : row.m
  const monthLine = `${monthLabel} : ${month}`
  const rateLine = `${valueLabel} : ${row.occupancy}%`
  return (
    <div
      className="rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-[13px] shadow-pm-lg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <p className="mb-1.5 font-semibold text-zinc-900">{monthLine}</p>
      <p className="font-semibold" style={{ color: green }}>
        {rateLine}
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
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start sm:gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a5f] shadow-pm-xs sm:h-10 sm:w-10">
          <AirbnbBelo />
        </div>
        <span className="text-sm font-bold text-zinc-900 sm:text-[15px]">Airbnb</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#003580] shadow-pm-xs sm:h-10 sm:w-10">
          <Calendar className="h-[18px] w-[18px] text-white sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
        </div>
        <span className="text-sm font-bold text-zinc-900 sm:text-[15px]">Booking.com</span>
      </div>
    </div>
  )
}

export function Hero() {
  const { t, locale } = useLanguage()
  const reduceMotion = useReducedMotion()
  const loc = locale === 'en' ? 'en-GB' : locale === 'de' ? 'de-DE' : locale === 'it' ? 'it-IT' : locale === 'es' ? 'es-ES' : 'fr-FR'

  const chartData = useMemo((): ChartRow[] => {
    const months = heroTranslations[locale].monthShort
    return REVENUE_VALUES.map((revenue, i) => ({
      m: months[i] ?? '',
      revenue,
      occupancy: OCCUPANCY_VALUES[i] ?? 0,
    }))
  }, [locale])

  return (
    <section className="relative border-b border-zinc-200/50 bg-white bg-[radial-gradient(ellipse_100%_60%_at_50%_-30%,rgba(79,134,247,0.09),transparent_55%)]">
      <div className="mx-auto grid max-w-[1200px] items-start gap-8 px-4 pb-16 pt-10 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-x-16 lg:gap-y-0 lg:px-8 lg:pb-24 lg:pt-20">
        {/* Colonne gauche */}
        <Reveal className="mx-auto max-w-[560px] text-center lg:mx-0 lg:text-left" y={22}>
          <h1 className="text-[1.875rem] font-bold leading-[1.16] tracking-[-0.03em] text-zinc-900 min-[400px]:text-[2.125rem] sm:text-[2.75rem] sm:leading-[1.12] lg:text-[3.25rem]">
            {t.headlineLine1}{' '}
            <span className="text-[#4f86f7]">{t.headlineAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[32rem] text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-[17px] lg:mx-0">
            {t.subheadline}
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-[22rem] flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 lg:mx-0 lg:justify-start">
            <MotionAnchor
              href="#"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white shadow-pm-cta transition-[filter] duration-200 hover:brightness-[0.97] sm:w-auto sm:min-h-0 sm:px-8 sm:py-[14px] sm:text-[16px] lg:shadow-pm-cta-lg"
              style={{ backgroundColor: primary }}
            >
              {t.ctaStart}
            </MotionAnchor>
            <MotionAnchor
              href="#"
              variant="subtle"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-6 py-3.5 text-[15px] font-semibold text-zinc-900 shadow-pm-xs transition-colors duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 sm:w-auto sm:min-h-0 sm:px-8 sm:py-[14px] sm:text-[16px]"
            >
              {t.ctaDemo}
            </MotionAnchor>
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 sm:mt-12 sm:text-[11px]">
            {t.platforms}
          </p>
          <div className="mt-3 flex justify-center sm:mt-4 lg:justify-start">
            <IntegrationBadges />
          </div>
        </Reveal>

        {/* Colonne droite — cartes */}
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
                    transition: { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-pm-sm sm:p-6 sm:shadow-pm-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:text-[11px]">
              {t.revenueTitle}
            </p>
            <p className="mt-1.5 text-[1.875rem] font-bold tracking-tight text-zinc-900 sm:text-[2.25rem]">
              {formatEuros(2180, loc)}
            </p>
            <p className="mt-0.5 text-xs font-semibold sm:text-[13px]" style={{ color: green }}>
              {t.revenueTrend}
            </p>
            <div className="mt-3 h-[168px] w-full sm:mt-4 sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis
                    domain={[1000, 3000]}
                    ticks={[1000, 1500, 2000, 2500, 3000]}
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    tickFormatter={(v) => `${v}€`}
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
                        monthLabel={t.tooltipMonth}
                        valueLabel={t.tooltipRevenue}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
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
                    transition: { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-pm-sm sm:p-6 sm:shadow-pm-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:text-[11px]">
              {t.occupancyTitle}
            </p>
            <p className="mt-1.5 text-[1.875rem] font-bold tracking-tight text-zinc-900 sm:text-[2.25rem]">76%</p>
            <p className="mt-0.5 text-xs font-semibold sm:text-[13px]" style={{ color: green }}>
              {t.occupancyTrend}
            </p>
            <div className="mt-3 h-[168px] w-full sm:mt-4 sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    tickFormatter={(v) => `${v}%`}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={(props) => (
                      <OccupancyTooltip
                        active={props.active}
                        payload={props.payload}
                        label={props.label}
                        monthLabel={t.tooltipMonth}
                        valueLabel={t.tooltipOccupancy}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    stroke={green}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: green, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </StaggerReveal>
      </div>
    </section>
  )
}
