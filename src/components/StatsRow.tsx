import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef } from 'react'
import { Clock, Home, LineChart, TrendingUp, Zap } from 'lucide-react'
import { useCountUp } from '../hooks/useCountUp'
import { useLanguage } from '../hooks/useLanguage'
import type { StatItemFormat } from '../i18n/statsRow'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'
import { BookingCalendarOverview } from './BookingCalendarOverview'

const blueIcon = '#2563eb'
const greenIcon = '#059669'
const blueSoft = '#dbeafe'
const greenSoft = '#d1fae5'
const violetIcon = '#7c3aed'
const violetSoft = '#ede9fe'

function formatAnimatedValue(n: number, format: StatItemFormat): string {
  const r = Math.round(n)
  if (format === 'hoursSaved') {
    return `−${Math.abs(r)}h`
  }
  if (r > 0) return `+${r}%`
  if (r < 0) return `−${Math.abs(r)}%`
  return '0%'
}

type StatTone = 'blue' | 'green' | 'blueDeep' | 'violet'

function toneClasses(tone: StatTone) {
  switch (tone) {
    case 'green':
      return {
        number: 'text-emerald-800',
        iconBg: greenSoft,
        ring: 'ring-emerald-600/20',
        iconColor: greenIcon,
      }
    case 'blueDeep':
      return {
        number: 'text-blue-800',
        iconBg: blueSoft,
        ring: 'ring-blue-600/25',
        iconColor: blueIcon,
      }
    case 'violet':
      return {
        number: 'text-violet-900',
        iconBg: violetSoft,
        ring: 'ring-violet-500/25',
        iconColor: violetIcon,
      }
    default:
      return {
        number: 'text-blue-700',
        iconBg: blueSoft,
        ring: 'ring-blue-500/20',
        iconColor: blueIcon,
      }
  }
}

function AnimatedStatValue({
  target,
  format,
  fallback,
  tone,
}: {
  target: number
  format: StatItemFormat
  fallback: string
  tone: StatTone
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.45 })
  const reduceMotion = useReducedMotion()
  const countTarget = format === 'hoursSaved' ? Math.abs(target) : target
  const animatedRaw = useCountUp(countTarget, inView, !!reduceMotion)
  const display = reduceMotion ? fallback : formatAnimatedValue(animatedRaw, format)
  const tc = toneClasses(tone)
  const showLive = inView || reduceMotion

  return (
    <p
      ref={ref}
      className={`mt-4 text-[1.65rem] font-bold tabular-nums tracking-tight sm:mt-5 sm:text-[2rem] lg:text-[1.85rem] xl:text-[2.1rem] ${tc.number}`}
      aria-label={fallback}
    >
      {showLive ? (
        display
      ) : (
        <span className="invisible" aria-hidden>
          {fallback}
        </span>
      )}
    </p>
  )
}

export function StatsRow() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const demoAnchorRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#demo') return
    const el = demoAnchorRef.current
    if (!el) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    })
  }, [])

  const items = [
    {
      icon: TrendingUp,
      target: t.stat1Target,
      format: t.stat1Format,
      fallback: t.stat1Value,
      label: t.stat1Label,
      tone: 'blue' as const,
    },
    {
      icon: Home,
      target: t.stat2Target,
      format: t.stat2Format,
      fallback: t.stat2Value,
      label: t.stat2Label,
      tone: 'green' as const,
    },
    {
      icon: Clock,
      target: t.stat3Target,
      format: t.stat3Format,
      fallback: t.stat3Value,
      label: t.stat3Label,
      tone: 'blueDeep' as const,
    },
    {
      icon: Zap,
      target: t.stat4Target,
      format: t.stat4Format,
      fallback: t.stat4Value,
      label: t.stat4Label,
      tone: 'violet' as const,
    },
    {
      icon: LineChart,
      target: t.stat5Target,
      format: t.stat5Format,
      fallback: t.stat5Value,
      label: t.stat5Label,
      tone: 'blue' as const,
    },
  ] as const

  return (
    <section
      ref={demoAnchorRef}
      id="demo"
      className="scroll-mt-[5.5rem] border-b border-zinc-200/40 bg-pm-band py-6 sm:py-8 sm:scroll-mt-24 lg:py-9"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <StaggerReveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {items.map(({ icon: Icon, target, format, fallback, label, tone }) => {
            const tc = toneClasses(tone)
            return (
              <motion.div
                key={fallback + label}
                variants={staggerItem(reduceMotion, 16)}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -6,
                        scale: 1.02,
                        boxShadow:
                          '0 24px 48px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)',
                        transition: { type: 'tween', duration: 0.3, ease: easePremium },
                      }
                }
                className="flex flex-col items-center rounded-2xl border border-zinc-300/70 bg-white px-4 py-7 text-center shadow-pm-md sm:px-5 sm:py-9 sm:shadow-pm-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-pm-sm ring-2 sm:h-14 sm:w-14 ${tc.ring}`}
                  style={{ backgroundColor: tc.iconBg }}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} style={{ color: tc.iconColor }} />
                </div>
                <AnimatedStatValue target={target} format={format} fallback={fallback} tone={tone} />
                <p className="mt-2 max-w-[220px] text-[13px] font-semibold leading-snug text-zinc-800 sm:max-w-[240px] sm:text-sm">
                  {label}
                </p>
              </motion.div>
            )
          })}
        </StaggerReveal>

        <Reveal className="mx-auto mt-4 max-w-[40rem] text-center sm:mt-6 lg:mt-7" y={20}>
          <h2 className="text-[1.4rem] font-bold leading-[1.2] tracking-[-0.03em] text-zinc-900 sm:text-[1.85rem] lg:text-[2.125rem]">
            {t.statsSectionTitleBefore}{' '}
            <span className="text-blue-600">{t.statsSectionTitleAccent}</span>
          </h2>
          <p className="mt-4 text-[15px] font-normal leading-relaxed text-zinc-700 sm:mt-5 sm:text-[17px]">
            {t.statsSectionSubtitle}
          </p>
        </Reveal>

        <Reveal className="mt-5 sm:mt-6" y={24} delay={0.06}>
          <BookingCalendarOverview mode="generic" />
        </Reveal>
      </div>
    </section>
  )
}
