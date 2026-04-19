import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from 'react'
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
import { useCleanerAssignedListingReactive } from './hooks/useCleanerAssignedListingReactive'
import { canAccessDashboardPath, getPlanTierFromValue } from './utils/subscriptionAccess'
import {
  clearStaypilotClientSessionAndCaches,
  getStoredAccounts,
  saveStoredAccounts,
  storedAccountMatchesNormalizedId,
} from './lib/accounts'
import { isServerAccountsMandatory } from './lib/serverAccountsPolicy'
import { readProviderAssignmentsMap } from './utils/cleaningProviderAssignments'
import {
  pullCleaningProviderAssignmentsFromServer,
  pushCleaningProviderAssignmentsToServer,
} from './utils/cleaningProviderAssignmentsRemote'
import { OFFICIAL_CHANNEL_SYNC_KEY } from './utils/officialChannelData'
import {
  pullOfficialChannelSyncFromServer,
  pushOfficialChannelSyncToServer,
} from './utils/officialChannelSyncRemote'
import { readScopedStorage } from './utils/sessionStorageScope'

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

declare global {
  interface Window {
    /** Console : `window.__staypilotClearLocal?.()` puis recharger, pour tout vider côté navigateur après une purge serveur. */
    __staypilotClearLocal?: () => void
  }
}

export default function App() {
  const pathname = useAppPathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.__staypilotClearLocal = clearStaypilotClientSessionAndCaches
    return () => {
      delete window.__staypilotClearLocal
    }
  }, [])

  const currentRoleRaw = typeof window !== 'undefined' ? window.localStorage.getItem('staypilot_current_role') : null
  const isCleanerSession = (currentRoleRaw || '').trim().toLowerCase() === 'cleaner'
  const cleanerHasAssignedListing = useCleanerAssignedListingReactive(isCleanerSession)
  const hostAssignmentsPushOnceRef = useRef(false)
  const hostOfficialSyncPushOnceRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !isServerAccountsMandatory()) return
    const pullCleanerData = async () => {
      await pullCleaningProviderAssignmentsFromServer()
      await pullOfficialChannelSyncFromServer()
    }
    void (async () => {
      if (isCleanerSession) {
        await pullCleanerData()
        return
      }
      if (Object.keys(readProviderAssignmentsMap()).length === 0) {
        await pullCleaningProviderAssignmentsFromServer()
      }
      const syncRaw = readScopedStorage(OFFICIAL_CHANNEL_SYNC_KEY)
      if (!syncRaw?.trim()) {
        await pullOfficialChannelSyncFromServer()
      }
    })()
  }, [isCleanerSession])

  useEffect(() => {
    if (!isServerAccountsMandatory() || !isCleanerSession) return
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      void (async () => {
        await pullCleaningProviderAssignmentsFromServer()
        await pullOfficialChannelSyncFromServer()
      })()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [isCleanerSession])

  useEffect(() => {
    if (typeof window === 'undefined' || !isServerAccountsMandatory() || isCleanerSession) return
    if (hostAssignmentsPushOnceRef.current) return
    const map = readProviderAssignmentsMap()
    if (Object.keys(map).length === 0) return
    hostAssignmentsPushOnceRef.current = true
    void pushCleaningProviderAssignmentsToServer(map)
  }, [isCleanerSession])

  useEffect(() => {
    if (typeof window === 'undefined' || !isServerAccountsMandatory() || isCleanerSession) return
    if (hostOfficialSyncPushOnceRef.current) return
    const raw = readScopedStorage(OFFICIAL_CHANNEL_SYNC_KEY)
    if (!raw?.trim()) return
    hostOfficialSyncPushOnceRef.current = true
    void pushOfficialChannelSyncToServer()
  }, [isCleanerSession])
  const cleanerAllowedDashboardPaths = new Set([
    '/dashboard',
    '/dashboard/calendrier',
    '/dashboard/prestataire-menage',
    '/dashboard/consommables',
  ])
  const cleanerDashboardAllowed =
    cleanerAllowedDashboardPaths.has(pathname) &&
    (pathname === '/dashboard/calendrier' || pathname === '/dashboard/consommables'
      ? cleanerHasAssignedListing
      : true)
  const billingRecoveryRaw =
    typeof window !== 'undefined' ? window.localStorage.getItem('staypilot_billing_recovery_v1') : null
  let billingSuspended = false
  try {
    billingSuspended = Boolean(billingRecoveryRaw ? JSON.parse(billingRecoveryRaw)?.suspended : false)
  } catch {
    billingSuspended = false
  }

  const [stripeDashboardBlocked, setStripeDashboardBlocked] = useState(false)
  const [, setPlanSyncTick] = useState(0)
  useEffect(() => {
    let cancelled = false
    async function syncStripeBillingGate() {
      if (typeof window === 'undefined') return
      if (isCleanerSession) {
        if (!cancelled) setStripeDashboardBlocked(false)
        return
      }
      const user = localStorage.getItem('staypilot_current_user')
      const idNorm = (user || '').trim().toLowerCase()
      if (!idNorm) {
        if (!cancelled) setStripeDashboardBlocked(false)
        return
      }
      const acc = getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, idNorm))
      const aid = acc?.id
      if (!aid) {
        if (!cancelled) setStripeDashboardBlocked(false)
        return
      }
      try {
        const r = await fetch('/api/stripe-billing-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: aid }),
        })
        const j = (await r.json().catch(() => ({}))) as {
          blocked?: boolean
          plan?: string | null
        }
        if (!cancelled) setStripeDashboardBlocked(Boolean(j?.blocked))
        const remotePlan = typeof j?.plan === 'string' ? j.plan.trim() : ''
        if (remotePlan && !cancelled) {
          const prevLs = (localStorage.getItem('staypilot_current_plan') || '').trim()
          const accounts = getStoredAccounts()
          const idx = accounts.findIndex((a) => a.id === aid)
          let updatedCache = false
          if (idx >= 0 && (accounts[idx].plan || '').trim() !== remotePlan) {
            const next = accounts.map((a, i) => (i === idx ? { ...a, plan: remotePlan } : a))
            saveStoredAccounts(next)
            updatedCache = true
          }
          if (prevLs !== remotePlan) {
            localStorage.setItem('staypilot_current_plan', remotePlan)
            window.dispatchEvent(new Event('staypilot-session-changed'))
          }
          if (updatedCache || prevLs !== remotePlan) {
            setPlanSyncTick((n) => n + 1)
          }
        }
      } catch {
        if (!cancelled) setStripeDashboardBlocked(false)
      }
    }
    void syncStripeBillingGate()
    const t = window.setInterval(() => void syncStripeBillingGate(), 120_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void syncStripeBillingGate()
    }
    const onSession = () => void syncStripeBillingGate()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('staypilot-session-changed', onSession)
    return () => {
      cancelled = true
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('staypilot-session-changed', onSession)
    }
  }, [isCleanerSession, pathname])

  const hostBillingBlocked = billingSuspended || stripeDashboardBlocked
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
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardPage />
            )
          ) : isDashboardConnectPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardConnectPage />
            )
          ) : isDashboardIntelPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardIntelPage />
            )
          ) : isDashboardCalendarPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardCalendarPage />
            )
          ) : isDashboardSuppliesPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardSuppliesPage />
            )
          ) : isDashboardStatsPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardStatsPage />
            )
          ) : isDashboardCleaningPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardCleaningPage />
            )
          ) : isDashboardWhatsAppPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardWhatsAppPage />
            )
          ) : isDashboardEarlyAccessPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardEarlyAccessPage />
            )
          ) : isDashboardExpensesPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardExpensesPage />
            )
          ) : isDashboardCompanyPage ? (
            hostBillingBlocked ? (
              <ProfilePage />
            ) : (
            <DashboardSocieteRedirect />
            )
          ) : isDashboardSubPage ? (
            hostBillingBlocked ? (
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
