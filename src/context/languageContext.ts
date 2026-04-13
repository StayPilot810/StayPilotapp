import { createContext } from 'react'
import type { FeatureCardsCopy } from '../i18n/featureCards'
import type { HeroCopy } from '../i18n/hero'
import type { Locale, NavbarCopy } from '../i18n/navbar'
import type { BookingCalendarCopy } from '../i18n/bookingCalendar'
import type { FaqCopy } from '../i18n/faq'
import type { FooterCopy } from '../i18n/footer'
import type { PricingPlansCopy } from '../i18n/pricingPlans'
import type { ReviewsCopy } from '../i18n/reviews'
import type { StatsRowCopy } from '../i18n/statsRow'
import type { WhyStayPilotCopy } from '../i18n/whyStayPilot'
import type { TrialPricingCopy } from '../i18n/trialAndPricing'
import type { AuthDashboardCopy } from '../i18n/authDashboard'
import type { AboutPageCopy } from '../i18n/aboutPage'
import type { BlogPageCopy } from '../i18n/blogPage'
import type { CareersPageCopy } from '../i18n/careersPage'
import type { HelpCenterPageCopy } from '../i18n/helpCenterPage'
import type { ContactPageCopy } from '../i18n/contactPage'
import type { AiChatCopy } from '../i18n/aiChat'

export type AppCopy = NavbarCopy &
  HeroCopy &
  FeatureCardsCopy &
  WhyStayPilotCopy &
  StatsRowCopy &
  BookingCalendarCopy &
  ReviewsCopy &
  TrialPricingCopy &
  PricingPlansCopy &
  FaqCopy &
  FooterCopy &
  AuthDashboardCopy &
  AboutPageCopy &
  BlogPageCopy &
  CareersPageCopy &
  HelpCenterPageCopy &
  ContactPageCopy &
  AiChatCopy

export type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: AppCopy
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
