import { ChevronDown, ChevronUp } from 'lucide-react'
import { useId, useState } from 'react'
import { FAQ_INITIAL_COUNT } from '../i18n/faq'
import { useLanguage } from '../hooks/useLanguage'

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
        <header className="text-center">
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

        <div className="mt-6 space-y-2 sm:mt-7 sm:space-y-2.5">
          {visible.map((item, i) => {
            const panelId = `${baseId}-panel-${i}`
            const btnId = `${baseId}-btn-${i}`
            return (
              <details
                key={`faq-${item.question}`}
                className="group overflow-hidden rounded-xl border bg-white shadow-none open:shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                style={{ borderColor: borderCard }}
              >
                <summary
                  id={btnId}
                  className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-bold transition-colors marker:content-none group-open:bg-[#F9FAFB] [&::-webkit-details-marker]:hidden"
                  style={{ color: textTitle }}
                >
                  {item.question}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
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
            )
          })}
        </div>

        {hasMore ? (
          <div className="mt-5 flex justify-center sm:mt-6">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 focus-visible:ring-offset-2 rounded-sm"
              style={{ color: accentBlue }}
              aria-expanded={showAll}
            >
              {showAll ? t.faqSeeLess : t.faqSeeMore}
              {showAll ? (
                <ChevronUp className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
