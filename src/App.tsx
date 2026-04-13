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

export default function App() {
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/connexion'
  const isSignupPage = typeof window !== 'undefined' && window.location.pathname === '/inscription'
  const isDashboardPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard'
  const isDashboardConnectPage =
    typeof window !== 'undefined' && window.location.pathname === '/dashboard/connecter-logements'
  const isDashboardIntelPage =
    typeof window !== 'undefined' && window.location.pathname === '/dashboard/veille-informationnelle'
  const isDashboardCalendarPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/calendrier'
  const isDashboardSuppliesPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/consommables'
  const isDashboardStatsPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/statistiques'
  const isDashboardWhatsAppPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/whatsapp'
  const isDashboardEarlyAccessPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/acces-anticipe'
  const isDashboardExpensesPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/tableau-charges'
  const isDashboardSubPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard/')

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
          ) : isDashboardWhatsAppPage ? (
            <DashboardWhatsAppPage />
          ) : isDashboardEarlyAccessPage ? (
            <DashboardEarlyAccessPage />
          ) : isDashboardExpensesPage ? (
            <DashboardExpensesPage />
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
      </div>
      </LanguageProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
