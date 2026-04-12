import { Calendar } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

const brandIconBg = '#3B82F6'
const footerBg = '#0B1120'
const borderSubtle = '#1E293B'

const itemText =
  'block text-[15px] font-medium leading-snug text-[#94A3B8] sm:text-[15px]'

const legalText =
  'text-[14px] font-medium text-[#94A3B8] sm:text-[14px]'

/** Pied de page global (rendu depuis {@link App}). */
export function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer
      role="contentinfo"
      className="relative z-10 w-full min-w-0 border-t-[5px] border-solid py-10 sm:py-12 lg:py-14"
      style={{
        backgroundColor: footerBg,
        color: '#f8fafc',
        borderTopColor: brandIconBg,
      }}
      aria-labelledby="footer-brand"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] lg:gap-14">
          <div className="sm:col-span-2 lg:col-span-1">
            <div id="footer-brand" className="inline-flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[10px] sm:h-11 sm:w-11"
                style={{ backgroundColor: brandIconBg }}
                aria-hidden
              >
                <Calendar className="h-5 w-5 text-white sm:h-[22px] sm:w-[22px]" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-tight text-white sm:text-xl">{t.brand}</span>
            </div>
            <p className="mt-5 max-w-[360px] text-[15px] leading-relaxed text-[#94A3B8] sm:text-base">
              {t.footerTagline}
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">{t.footerColProduct}</h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              <li>
                <span className={itemText}>{t.footerLinkFeatures}</span>
              </li>
              <li>
                <span className={itemText}>{t.footerLinkPricing}</span>
              </li>
              <li>
                <span className={itemText}>{t.footerLinkNews}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">{t.footerColCompany}</h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              <li>
                <span className={itemText}>{t.footerLinkAbout}</span>
              </li>
              <li>
                <span className={itemText}>{t.footerLinkBlog}</span>
              </li>
              <li>
                <span className={itemText}>{t.footerLinkCareers}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">{t.footerColSupport}</h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              <li>
                <span className={itemText}>{t.footerLinkHelp}</span>
              </li>
              <li>
                <span className={itemText}>{t.footerLinkContact}</span>
              </li>
              <li>
                <span className={itemText}>{t.footerLinkFaq}</span>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col gap-5 border-t pt-9 sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pt-10"
          style={{ borderColor: borderSubtle }}
        >
          <p className="text-[14px] font-medium text-[#94A3B8] sm:text-[15px]">{t.footerCopyright}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className={legalText}>{t.footerLegal}</span>
            <span className={legalText}>{t.footerPrivacy}</span>
            <span className={legalText}>{t.footerTerms}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
