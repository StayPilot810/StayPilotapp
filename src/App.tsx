import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { LanguageProvider } from './context/LanguageProvider'
import { FeatureCards } from './components/FeatureCards'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { FaqSection } from './components/FaqSection'
import { SiteFooter } from './components/SiteFooter'
import { PricingSection } from './components/PricingSection'
import { ReviewsSection } from './components/ReviewsSection'
import { StatsRow } from './components/StatsRow'
import { TrialCtaSection } from './components/TrialCtaSection'
import { LoginPage } from './components/LoginPage'
import { SignupPage } from './components/SignupPage'
import { DashboardPage } from './components/DashboardPage'
import { DashboardBlankPage } from './components/DashboardBlankPage'
import { DashboardConnectPage } from './components/DashboardConnectPage'
import { DashboardIntelPage } from './components/DashboardIntelPage'
import { DashboardCalendarPage } from './components/DashboardCalendarPage'
import { DashboardSuppliesPage } from './components/DashboardSuppliesPage'
import { DashboardStatsPage } from './components/DashboardStatsPage'
import { DashboardWhatsAppPage } from './components/DashboardWhatsAppPage'
import { DashboardEarlyAccessPage } from './components/DashboardEarlyAccessPage'
import { DashboardExpensesPage } from './components/DashboardExpensesPage'
import { DashboardCleaningPage } from './components/DashboardCleaningPage'
import { DashboardCompanyPage } from './components/DashboardCompanyPage'
import { AboutPage } from './components/AboutPage'
import { BlogPage } from './components/BlogPage'
import { CareersPage } from './components/CareersPage'
import { HelpCenterPage } from './components/HelpCenterPage'
import { ContactPage } from './components/ContactPage'
import { NewsPage } from './components/NewsPage'
import { WhyStayPilotPage } from './components/WhyStayPilotPage'
import { LegalPage } from './components/LegalPage'
import { PrivacyPage } from './components/PrivacyPage'
import { TermsPage } from './components/TermsPage'
import { AiChatWidget } from './components/AiChatWidget'
import { useAppPathname } from './hooks/useAppPathname'

export default function App() {
  const pathname = useAppPathname()
  const isLoginPage = pathname === '/connexion'
  const isSignupPage = pathname === '/inscription'
  const isAboutPage = pathname === '/a-propos'
  const isBlogPage = pathname === '/blog'
  const isWhyStayPilotPage = pathname === '/pourquoi-staypilot'
  const isCareersPage = pathname === '/carrieres'
  const isNewsPage = pathname === '/nouveautes'
  const isLegalPage = pathname === '/mentions-legales'
  const isPrivacyPage = pathname === '/confidentialite'
  const isTermsPage = pathname === '/cgu'
  const isHelpCenterPage = pathname === '/centre-aide'
  const isContactPage = pathname === '/contact'
  const isDashboardPage = pathname === '/dashboard'
  const isDashboardConnectPage = pathname === '/dashboard/connecter-logements'
  const isDashboardIntelPage = pathname === '/dashboard/veille-informationnelle'
  const isDashboardCalendarPage = pathname === '/dashboard/calendrier'
  const isDashboardSuppliesPage = pathname === '/dashboard/consommables'
  const isDashboardStatsPage = pathname === '/dashboard/statistiques'
  const isDashboardCleaningPage = pathname === '/dashboard/prestataire-menage'
  const isDashboardWhatsAppPage = pathname === '/dashboard/whatsapp'
  const isDashboardEarlyAccessPage = pathname === '/dashboard/acces-anticipe'
  const isDashboardExpensesPage = pathname === '/dashboard/tableau-charges'
  const isDashboardCompanyPage = pathname === '/dashboard/societe'
  const isDashboardSubPage = pathname.startsWith('/dashboard/')

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
      <LanguageProvider>
      <div className="flex min-h-screen min-w-0 flex-col bg-pm-app text-zinc-900 antialiased">
        <Navbar />
        <main className="flex min-w-0 flex-1 flex-col">
          {isLoginPage ? (
            <LoginPage />
          ) : isSignupPage ? (
            <SignupPage />
          ) : isAboutPage ? (
            <>
              <AboutPage />
              <SiteFooter />
            </>
          ) : isBlogPage ? (
            <>
              <BlogPage />
              <SiteFooter />
            </>
          ) : isWhyStayPilotPage ? (
            <>
              <WhyStayPilotPage />
              <SiteFooter />
            </>
          ) : isCareersPage ? (
            <>
              <CareersPage />
              <SiteFooter />
            </>
          ) : isNewsPage ? (
            <>
              <NewsPage />
              <SiteFooter />
            </>
          ) : isLegalPage ? (
            <>
              <LegalPage />
              <SiteFooter />
            </>
          ) : isPrivacyPage ? (
            <>
              <PrivacyPage />
              <SiteFooter />
            </>
          ) : isTermsPage ? (
            <>
              <TermsPage />
              <SiteFooter />
            </>
          ) : isHelpCenterPage ? (
            <>
              <HelpCenterPage />
              <SiteFooter />
            </>
          ) : isContactPage ? (
            <>
              <ContactPage />
              <SiteFooter />
            </>
          ) : isDashboardPage ? (
            <DashboardPage />
          ) : isDashboardConnectPage ? (
            <DashboardConnectPage />
          ) : isDashboardIntelPage ? (
            <DashboardIntelPage />
          ) : isDashboardCalendarPage ? (
            <DashboardCalendarPage />
          ) : isDashboardSuppliesPage ? (
            <DashboardSuppliesPage />
          ) : isDashboardStatsPage ? (
            <DashboardStatsPage />
          ) : isDashboardCleaningPage ? (
            <DashboardCleaningPage />
          ) : isDashboardWhatsAppPage ? (
            <DashboardWhatsAppPage />
          ) : isDashboardEarlyAccessPage ? (
            <DashboardEarlyAccessPage />
          ) : isDashboardExpensesPage ? (
            <DashboardExpensesPage />
          ) : isDashboardCompanyPage ? (
            <DashboardCompanyPage />
          ) : isDashboardSubPage ? (
            <DashboardBlankPage />
          ) : (
            <>
              <Hero />
              <FeatureCards />
              <StatsRow />
              <ReviewsSection />
              <TrialCtaSection />
              <PricingSection />
              <FaqSection />
              <SiteFooter />
            </>
          )}
        </main>
        <AiChatWidget />
      </div>
      </LanguageProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
