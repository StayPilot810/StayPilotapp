import { useLanguage } from '../hooks/useLanguage'
import { MotionAnchor, Reveal } from './motion'

const primary = '#4a86f7'

export function TrialCtaSection() {
  const { t } = useLanguage()

  return (
    <section
      className="relative overflow-hidden border-t border-zinc-200/30 py-12 sm:py-16 lg:py-20"
      style={{
        background: 'linear-gradient(180deg, #e8ecff 0%, #eef1f8 42%, #f3f4f6 100%)',
      }}
      aria-labelledby="trial-cta-heading"
    >
      <div className="relative mx-auto max-w-[720px] px-4 text-center sm:px-6">
        <Reveal y={20}>
          <h2
            id="trial-cta-heading"
            className="text-[1.375rem] font-bold leading-tight tracking-[-0.03em] text-zinc-900 sm:text-3xl lg:text-[2rem]"
          >
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base">
            {t.ctaSubtitle}
          </p>
          <div className="mt-6 sm:mt-7">
            <MotionAnchor
              href="#"
              className="mx-auto inline-flex min-h-[48px] w-full max-w-[20rem] items-center justify-center rounded-full px-8 py-3.5 text-[15px] font-semibold text-white shadow-pm-cta transition-[filter] duration-200 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/45 focus-visible:ring-offset-2 sm:mx-0 sm:w-auto sm:min-h-0 sm:max-w-none sm:shadow-pm-cta-lg"
              style={{ backgroundColor: primary }}
            >
              {t.ctaButton}
            </MotionAnchor>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500 sm:text-sm">{t.ctaFinePrint}</p>
        </Reveal>
      </div>
    </section>
  )
}
