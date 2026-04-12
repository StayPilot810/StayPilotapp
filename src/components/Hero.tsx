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
      className="rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-[13px] shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <p className="mb-1.5 font-semibold text-[#1a1a1a]">
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
      className="rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-[13px] shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <p className="mb-1.5 font-semibold text-[#1a1a1a]">{monthLine}</p>
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
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#ff5a5f] shadow-sm">
          <AirbnbBelo />
        </div>
        <span className="text-[15px] font-bold text-[#1a1a1a]">Airbnb</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#003580] shadow-sm">
          <Calendar className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
        </div>
        <span className="text-[15px] font-bold text-[#1a1a1a]">Booking.com</span>
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
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-5 pb-20 pt-12 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-x-14 lg:gap-y-0 lg:px-8 lg:pt-16">
        {/* Colonne gauche */}
        <Reveal className="mx-auto max-w-[560px] text-center lg:mx-0 lg:text-left" y={22}>
          <h1 className="text-[2.5rem] font-bold leading-[1.15] tracking-[-0.02em] text-[#1a1a1a] sm:text-[2.85rem] lg:text-[3.15rem]">
            {t.headlineLine1}{' '}
            <span className="text-[#4f86f7]">{t.headlineAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[480px] text-[17px] leading-[1.55] text-[#4b5563] lg:mx-0">
            {t.subheadline}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <MotionAnchor
              href="#"
              className="inline-flex items-center justify-center rounded-[10px] px-8 py-[14px] text-[16px] font-semibold text-white shadow-[0_8px_24px_rgba(79,134,247,0.35)] transition-[filter] duration-200 hover:brightness-95"
              style={{ backgroundColor: primary }}
            >
              {t.ctaStart}
            </MotionAnchor>
            <MotionAnchor
              href="#"
              variant="subtle"
              className="inline-flex items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white px-8 py-[14px] text-[16px] font-semibold text-[#1a1a1a] transition-colors duration-200 hover:border-[#d1d5db]"
            >
              {t.ctaDemo}
            </MotionAnchor>
          </div>
          <p className="mt-12 text-[13px] font-medium text-[#9ca3af]">{t.platforms}</p>
          <div className="mt-4 flex justify-center lg:justify-start">
            <IntegrationBadges />
          </div>
        </Reveal>

        {/* Colonne droite — cartes */}
        <StaggerReveal className="flex w-full flex-col gap-6">
          <motion.div
            variants={staggerItem(reduceMotion, 14)}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -4,
                    boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.12)',
                    transition: { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),0_2px_4px_-2px_rgb(0_0_0_/_0.1)]"
          >
            <p className="text-[13px] font-medium text-[#9ca3af]">{t.revenueTitle}</p>
            <p className="mt-1 text-[2.25rem] font-bold tracking-tight text-[#1a1a1a]">
              {formatEuros(2180, loc)}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold" style={{ color: green }}>
              {t.revenueTrend}
            </p>
            <div className="mt-4 h-[200px] w-full">
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
                    y: -4,
                    boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.12)',
                    transition: { type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),0_2px_4px_-2px_rgb(0_0_0_/_0.1)]"
          >
            <p className="text-[13px] font-medium text-[#9ca3af]">{t.occupancyTitle}</p>
            <p className="mt-1 text-[2.25rem] font-bold tracking-tight text-[#1a1a1a]">76%</p>
            <p className="mt-0.5 text-[13px] font-semibold" style={{ color: green }}>
              {t.occupancyTrend}
            </p>
            <div className="mt-4 h-[200px] w-full">
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
