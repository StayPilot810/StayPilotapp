import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react'
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
import { SupportPage } from './components/SupportPage'
import { BookCallPage } from './components/BookCallPage'
import { AiChatWidget } from './components/AiChatWidget'
import { ProfilePage } from './components/ProfilePage'
import { FeaturesVideoPage } from './components/FeaturesVideoPage'
import { useAppPathname } from './hooks/useAppPathname'
import { canAccessDashboardPath, getPlanTierFromValue } from './utils/subscriptionAccess'

function DashboardSocieteRedirect() {
  useEffect(() => {
    window.location.replace('/dashboard')
  }, [])
  return null
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { hasError: true, errorMessage: msg.slice(0, 400) }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('App render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center">
            <h1 className="text-xl font-bold text-zinc-900">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Rechargez la page. Si le probleme persiste, reconnectez-vous puis reessayez.
            </p>
            {this.state.errorMessage ? (
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-zinc-100 p-2 text-left text-xs text-zinc-700 whitespace-pre-wrap break-words">
                {this.state.errorMessage}
              </pre>
            ) : null}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Recharger
            </button>
          </div>
        </section>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const pathname = useAppPathname()
  const currentRoleRaw = typeof window !== 'undefined' ? window.localStorage.getItem('staypilot_current_role') : null
  const isCleanerSession = (currentRoleRaw || '').trim().toLowerCase() === 'cleaner'
  const cleanerAllowedDashboardPaths = new Set([
    '/dashboard',
    '/dashboard/calendrier',
    '/dashboard/prestataire-menage',
    '/dashboard/consommables',
  ])
  const cleanerDashboardAllowed = cleanerAllowedDashboardPaths.has(pathname)
  const billingRecoveryRaw =
    typeof window !== 'undefined' ? window.localStorage.getItem('staypilot_billing_recovery_v1') : null
  let billingSuspended = false
  try {
    billingSuspended = Boolean(billingRecoveryRaw ? JSON.parse(billingRecoveryRaw)?.suspended : false)
  } catch {
    billingSuspended = false
  }
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
  const isSupportPage = pathname === '/support'
  const isFeaturesPage = pathname === '/fonctionnalites'
  const isBookCallPage = pathname === '/reserver-un-appel'
  const isProfilePage = pathname === '/profil'
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
  const currentPlanRaw = typeof window !== 'undefined' ? window.localStorage.getItem('staypilot_current_plan') || 'Pro' : 'Pro'
  const planTier = getPlanTierFromValue(currentPlanRaw)
  const hostPlanAllowsPath = !isCleanerSession && canAccessDashboardPath(planTier, pathname)

  return (
    <AppErrorBoundary>
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
          ) : isSupportPage ? (
            <>
              <SupportPage />
              <SiteFooter />
            </>
          ) : isFeaturesPage ? (
            <FeaturesVideoPage />
          ) : isBookCallPage ? (
            <BookCallPage />
          ) : isProfilePage ? (
            <ProfilePage />
          ) : (isDashboardPage || isDashboardSubPage) && isCleanerSession && !cleanerDashboardAllowed ? (
            <DashboardBlankPage />
          ) : (isDashboardPage || isDashboardSubPage) && !isCleanerSession && !hostPlanAllowsPath ? (
            <DashboardBlankPage />
          ) : isDashboardPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardPage />
            )
          ) : isDashboardConnectPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardConnectPage />
            )
          ) : isDashboardIntelPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardIntelPage />
            )
          ) : isDashboardCalendarPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardCalendarPage />
            )
          ) : isDashboardSuppliesPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardSuppliesPage />
            )
          ) : isDashboardStatsPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardStatsPage />
            )
          ) : isDashboardCleaningPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardCleaningPage />
            )
          ) : isDashboardWhatsAppPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardWhatsAppPage />
            )
          ) : isDashboardEarlyAccessPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardEarlyAccessPage />
            )
          ) : isDashboardExpensesPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardExpensesPage />
            )
          ) : isDashboardCompanyPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardSocieteRedirect />
            )
          ) : isDashboardSubPage ? (
            billingSuspended ? (
              <ProfilePage />
            ) : (
            <DashboardBlankPage />
            )
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
    </AppErrorBoundary>
  )
}
