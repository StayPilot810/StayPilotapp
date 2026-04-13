import { motion, useReducedMotion } from 'framer-motion'
import { LayoutDashboard, RefreshCw, Timer, Workflow } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'

const accent = '#4f86f7'

const icons = [Workflow, RefreshCw, Timer, LayoutDashboard] as const

export function WhyStayPilot() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const { whyBenefits, whySectionSubtitle, whySectionTitle } = t

  return (
    <section
      id="pourquoi-nous"
      className="scroll-mt-[64px] border-b border-zinc-200/50 bg-white py-12 sm:scroll-mt-[72px] sm:py-16 lg:py-20"
      aria-labelledby="why-staypilot-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center" y={18}>
          <h2
            id="why-staypilot-heading"
            className="text-[1.375rem] font-bold tracking-[-0.03em] text-zinc-900 sm:text-3xl lg:text-[2rem]"
          >
            {whySectionTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            {whySectionSubtitle}
          </p>
        </Reveal>

        <StaggerReveal className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:mt-14 lg:gap-6">
          {whyBenefits.map((benefit, i) => {
            const Icon = icons[i] ?? Workflow
            return (
              <motion.article
                key={benefit.title}
                variants={staggerItem(reduceMotion, 18)}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -5,
                        boxShadow:
                          '0 20px 40px -12px rgba(15, 23, 42, 0.11), 0 0 0 1px rgba(79, 134, 247, 0.12)',
                        transition: { type: 'tween', duration: 0.28, ease: easePremium },
                      }
                }
                className="group flex gap-4 rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white to-zinc-50/80 p-5 shadow-pm-sm sm:gap-5 sm:p-6 sm:shadow-pm-md"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0fe] shadow-pm-xs ring-2 ring-[#4f86f7]/15 transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
                  aria-hidden
                >
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} style={{ color: accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-snug text-zinc-900 sm:text-lg">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">{benefit.body}</p>
                </div>
              </motion.article>
            )
          })}
        </StaggerReveal>
      </div>
    </section>
  )
}
