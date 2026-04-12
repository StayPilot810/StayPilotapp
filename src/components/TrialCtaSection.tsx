import { useLanguage } from '../hooks/useLanguage'
import { MotionAnchor, Reveal } from './motion'

const primary = '#4a86f7'

export function TrialCtaSection() {
  const { t } = useLanguage()

  return (
    <section
      className="relative overflow-hidden border-t border-white/20 py-11 sm:py-14 lg:py-16"
      style={{
        background: 'linear-gradient(180deg, #e8f0fe 0%, #f5f8ff 45%, #ffffff 100%)',
      }}
      aria-labelledby="trial-cta-heading"
    >
      <div className="relative mx-auto max-w-[720px] px-5 text-center sm:px-6">
        <Reveal y={20}>
          <h2
            id="trial-cta-heading"
            className="text-2xl font-bold leading-tight tracking-tight text-[#1a1a1a] sm:text-3xl lg:text-[2rem]"
          >
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-[540px] text-[15px] leading-relaxed text-[#52525b] sm:text-base">
            {t.ctaSubtitle}
          </p>
          <div className="mt-6 sm:mt-7">
            <MotionAnchor
              href="#"
              className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(74,134,247,0.35)] transition-[filter] duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/50 focus-visible:ring-offset-2"
              style={{ backgroundColor: primary }}
            >
              {t.ctaButton}
            </MotionAnchor>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[#71717a] sm:text-sm">{t.ctaFinePrint}</p>
        </Reveal>
      </div>
    </section>
  )
}
