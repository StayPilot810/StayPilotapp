import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useId, useState } from 'react'
import { FAQ_INITIAL_COUNT } from '../i18n/faq'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'

const accentBlue = '#3B82F6'

export function FaqSection() {
  const { t } = useLanguage()
  const baseId = useId()
  const [showAll, setShowAll] = useState(false)
  const reduceMotion = useReducedMotion()

  const items = t.faqItems
  const visible = showAll ? items : items.slice(0, FAQ_INITIAL_COUNT)
  const hasMore = items.length > FAQ_INITIAL_COUNT

  return (
    <section
      id="faq"
      className="scroll-mt-[64px] border-t border-zinc-200/50 bg-white py-12 sm:scroll-mt-[72px] sm:py-14 lg:py-16"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[720px] px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        <Reveal className="text-center" y={16}>
          <header>
            <h2
              id="faq-heading"
              className="text-[1.375rem] font-bold tracking-[-0.03em] text-zinc-900 sm:text-3xl lg:text-[1.85rem]"
            >
              {t.faqTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
              {t.faqSubtitle}
            </p>
          </header>
        </Reveal>

        <StaggerReveal className="mt-8 space-y-3 sm:mt-10 sm:space-y-3" stagger={0.05}>
          {visible.map((item, i) => {
            const panelId = `${baseId}-panel-${i}`
            const btnId = `${baseId}-btn-${i}`
            return (
              <motion.div key={`faq-${item.question}`} variants={staggerItem(reduceMotion, 12)}>
                <details
                  className="group overflow-hidden rounded-xl border border-zinc-200/70 bg-white shadow-pm-xs transition-shadow duration-300 open:shadow-pm-sm hover:shadow-pm-sm"
                >
                  <summary
                    id={btnId}
                    className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-semibold text-zinc-900 transition-colors duration-200 marker:content-none group-open:bg-zinc-50/80 sm:min-h-0 sm:py-3 [&::-webkit-details-marker]:hidden"
                  >
                    {item.question}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180"
                      style={{ color: accentBlue }}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </summary>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className="border-t border-zinc-100 bg-white px-4 pb-4 pt-3 text-[15px] leading-relaxed text-zinc-600 sm:text-[14px]"
                  >
                    {item.answer}
                  </div>
                </details>
              </motion.div>
            )
          })}
        </StaggerReveal>

        {hasMore ? (
          <Reveal className="mt-5 flex justify-center sm:mt-6" y={8} delay={0.05}>
            <motion.button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 focus-visible:ring-offset-2 sm:min-h-0 sm:text-[14px]"
              style={{ color: accentBlue }}
              aria-expanded={showAll}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.2, ease: easePremium }}
            >
              {showAll ? t.faqSeeLess : t.faqSeeMore}
              {showAll ? (
                <ChevronUp className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </motion.button>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
