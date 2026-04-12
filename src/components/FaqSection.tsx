import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useId, useState } from 'react'
import { FAQ_INITIAL_COUNT } from '../i18n/faq'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'

/** Fond blanc comme la maquette Figma (cartes FAQ bord gris) */
const bgSection = '#FFFFFF'
const borderCard = '#E5E7EB'
const textTitle = '#111827'
const textBody = '#4B5563'
/** Bleu aligné sur la maquette (#3B82F6) */
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
      className="scroll-mt-[72px] border-t pt-10 sm:pt-11 lg:pt-12"
      style={{ backgroundColor: bgSection, borderColor: borderCard }}
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[720px] px-5 pb-4 sm:px-6 sm:pb-5 lg:px-8 lg:pb-6">
        <Reveal className="text-center" y={16}>
          <header>
            <h2
              id="faq-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-[1.85rem]"
              style={{ color: textTitle }}
            >
              {t.faqTitle}
            </h2>
            <p
              className="mt-2 text-[15px] leading-relaxed sm:text-base"
              style={{ color: textBody }}
            >
              {t.faqSubtitle}
            </p>
          </header>
        </Reveal>

        <StaggerReveal className="mt-6 space-y-2 sm:mt-7 sm:space-y-2.5" stagger={0.05}>
          {visible.map((item, i) => {
            const panelId = `${baseId}-panel-${i}`
            const btnId = `${baseId}-btn-${i}`
            return (
              <motion.div key={`faq-${item.question}`} variants={staggerItem(reduceMotion, 12)}>
                <details
                  className="group overflow-hidden rounded-xl border bg-white shadow-none transition-shadow duration-300 open:shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
                  style={{ borderColor: borderCard }}
                >
                  <summary
                    id={btnId}
                    className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-bold transition-colors duration-200 marker:content-none group-open:bg-[#F9FAFB] [&::-webkit-details-marker]:hidden"
                    style={{ color: textTitle }}
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
                    className="border-t bg-white px-4 pb-4 pt-3 text-[14px] leading-relaxed"
                    style={{ borderColor: borderCard, color: textBody }}
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
              className="inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 focus-visible:ring-offset-2"
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
