import { motion, useReducedMotion } from 'framer-motion'
import { BarChart3, Clock, Zap } from 'lucide-react'
import { BookingCalendarOverview } from './BookingCalendarOverview'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'

const blueIcon = '#4f86f7'
const greenIcon = '#22c55e'

export function StatsRow() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()

  const items = [
    {
      icon: Clock,
      value: t.stat1Value,
      label: t.stat1Label,
      iconBg: 'bg-[#e8f0fe]',
      iconColor: blueIcon,
    },
    {
      icon: Zap,
      value: t.stat2Value,
      label: t.stat2Label,
      iconBg: 'bg-[#e8f8ef]',
      iconColor: greenIcon,
    },
    {
      icon: BarChart3,
      value: t.stat3Value,
      label: t.stat3Label,
      iconBg: 'bg-[#e8f0fe]',
      iconColor: blueIcon,
    },
  ] as const

  return (
    <section className="bg-[#f4f4f5] py-11 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8">
        <StaggerReveal className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
          {items.map(({ icon: Icon, value, label, iconBg, iconColor }) => (
            <motion.div
              key={value}
              variants={staggerItem(reduceMotion, 16)}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -4,
                      boxShadow: '0 16px 40px -14px rgba(15, 23, 42, 0.12)',
                      transition: { type: 'tween', duration: 0.28, ease: easePremium },
                    }
              }
              className="flex flex-col items-center rounded-2xl border border-gray-100/80 bg-white px-6 py-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:py-10"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} sm:h-14 sm:w-14`}
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} style={{ color: iconColor }} />
              </div>
              <p className="mt-5 text-[2rem] font-bold tracking-tight text-[#1a1a1a] sm:mt-6 sm:text-[2.25rem]">
                {value}
              </p>
              <p className="mt-2 max-w-[240px] text-[15px] font-medium leading-snug text-[#71717a] sm:text-base">
                {label}
              </p>
            </motion.div>
          ))}
        </StaggerReveal>

        <Reveal className="mx-auto mt-9 max-w-[42rem] text-center sm:mt-11 lg:mt-14" y={20}>
          <h2 className="text-[1.65rem] font-bold leading-[1.2] tracking-[-0.02em] text-[#1a1a1a] sm:text-[1.85rem] lg:text-[2.15rem]">
            {t.statsSectionTitleBefore}{' '}
            <span style={{ color: blueIcon }}>{t.statsSectionTitleAccent}</span>
          </h2>
          <p className="mt-4 text-[16px] font-normal leading-relaxed text-[#71717a] sm:mt-5 sm:text-[17px]">
            {t.statsSectionSubtitle}
          </p>
        </Reveal>

        <Reveal className="mt-8 sm:mt-10" y={24} delay={0.06}>
          <BookingCalendarOverview />
        </Reveal>
      </div>
    </section>
  )
}
