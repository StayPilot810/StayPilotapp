import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { bookingCalendarTranslations } from '../i18n/bookingCalendar'
import { faqTranslations } from '../i18n/faq'
import { footerTranslations } from '../i18n/footer'
import { featureCardsTranslations } from '../i18n/featureCards'
import { heroTranslations } from '../i18n/hero'
import { pricingPlansTranslations } from '../i18n/pricingPlans'
import { reviewsTranslations } from '../i18n/reviews'
import { statsRowTranslations } from '../i18n/statsRow'
import { whyStayPilotTranslations } from '../i18n/whyStayPilot'
import { trialAndPricingTranslations } from '../i18n/trialAndPricing'
import { authDashboardTranslations } from '../i18n/authDashboard'
import { aboutPageTranslations } from '../i18n/aboutPage'
import { blogPageTranslations } from '../i18n/blogPage'
import { careersPageTranslations } from '../i18n/careersPage'
import { helpCenterPageTranslations } from '../i18n/helpCenterPage'
import { contactPageTranslations } from '../i18n/contactPage'
import { aiChatTranslations } from '../i18n/aiChat'
import type { Locale } from '../i18n/navbar'
import { translations } from '../i18n/navbar'
import { LanguageContext } from './languageContext'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: {
        ...translations[locale],
        ...heroTranslations[locale],
        ...featureCardsTranslations[locale],
        ...whyStayPilotTranslations[locale],
        ...statsRowTranslations[locale],
        ...bookingCalendarTranslations[locale],
        ...reviewsTranslations[locale],
        ...trialAndPricingTranslations[locale],
        ...pricingPlansTranslations[locale],
        ...faqTranslations[locale],
        ...footerTranslations[locale],
        ...authDashboardTranslations[locale],
        ...aboutPageTranslations[locale],
        ...blogPageTranslations[locale],
        ...careersPageTranslations[locale],
        ...helpCenterPageTranslations[locale],
        ...contactPageTranslations[locale],
        ...aiChatTranslations[locale],
      },
    }),
    [locale, setLocale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
