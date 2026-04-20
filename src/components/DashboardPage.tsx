import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChartColumn, Gem, MessageCircle, Package, Sparkles, Wallet } from 'lucide-react'
import {
  getStoredAccounts,
  normalizeStoredLoginPiece,
  saveStoredAccounts,
  storedAccountMatchesNormalizedId,
  type StoredAccount,
} from '../lib/accounts'
import { useLanguage } from '../hooks/useLanguage'
import { useCleanerAssignedListingReactive } from '../hooks/useCleanerAssignedListingReactive'
import { canAccessDashboardPath, getPlanTierFromValue } from '../utils/subscriptionAccess'
import { isGuestDemoRoutingActive, isGuestDemoSession } from '../utils/guestDemo'

export function DashboardPage() {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const getStoredRole = () => (localStorage.getItem('staypilot_current_role') || '').trim().toLowerCase()
  const c = {
    fr: {
      profileSettings: 'Profil & paramètres',
      testOn: 'Mode test actif (désactiver)',
      testOff: 'Activer mode test (accès complet)',
      upgradeRequired: 'Upgrade requis',
      upgradeAlert: "Cette fonctionnalité n'est pas incluse dans votre forfait actuel. Augmentez votre forfait pour y accéder.",
      guestDemoPillLabel:
        "Démonstration de l'application — exploration sans compte. Aucun logement n'est connecté dans cette session.",
      guestDemoTabUnavailable: 'Non disponible pour la démo',
    },
    en: {
      profileSettings: 'Profile & settings',
      testOn: 'Test mode active (disable)',
      testOff: 'Enable test mode (full access)',
      upgradeRequired: 'Upgrade required',
      upgradeAlert: 'This feature is not included in your current plan. Upgrade your plan to access it.',
      guestDemoPillLabel:
        'Application demo — browse without an account. No listings are connected in this session.',
      guestDemoTabUnavailable: 'Not available in this demo',
    },
    es: {
      profileSettings: 'Perfil y ajustes',
      testOn: 'Modo prueba activo (desactivar)',
      testOff: 'Activar modo prueba (acceso completo)',
      upgradeRequired: 'Mejora requerida',
      upgradeAlert: 'Esta función no está incluida en su plan actual. Mejore su plan para acceder.',
      guestDemoPillLabel:
        'Demostración de la aplicación — exploración sin cuenta. No hay alojamientos conectados en esta sesión.',
      guestDemoTabUnavailable: 'No disponible en la demo',
    },
    de: {
      profileSettings: 'Profil & Einstellungen',
      testOn: 'Testmodus aktiv (deaktivieren)',
      testOff: 'Testmodus aktivieren (voller Zugriff)',
      upgradeRequired: 'Upgrade erforderlich',
      upgradeAlert: 'Diese Funktion ist in Ihrem aktuellen Tarif nicht enthalten. Bitte upgraden Sie Ihren Tarif.',
      guestDemoPillLabel:
        'Demonstration der App — Erkundung ohne Konto. In dieser Sitzung sind keine Unterkünfte verbunden.',
      guestDemoTabUnavailable: 'In der Demo nicht verfügbar',
    },
    it: {
      profileSettings: 'Profilo e impostazioni',
      testOn: 'Modalità test attiva (disattiva)',
      testOff: 'Attiva modalità test (accesso completo)',
      upgradeRequired: 'Upgrade richiesto',
      upgradeAlert: 'Questa funzione non è inclusa nel tuo piano attuale. Esegui l upgrade del piano per accedere.',
      guestDemoPillLabel:
        'Dimostrazione dell’app — esplorazione senza account. Nessun alloggio è collegato in questa sessione.',
      guestDemoTabUnavailable: 'Non disponibile nella demo',
    },
  }[ll]
  const [activePlanLabel, setActivePlanLabel] = useState(t.proName)
  const [currentRole, setCurrentRole] = useState(getStoredRole)
  const isCleanerSession = currentRole === 'cleaner'
  const cleanerHasAssignedListing = useCleanerAssignedListingReactive(isCleanerSession)
  const [currentPlanRaw, setCurrentPlanRaw] = useState('Pro')

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('checkout') !== 'success') return
    const sessionId = sp.get('session_id')?.trim()
    if (!sessionId) return
    const doneKey = `staypilot_host_checkout_done_${sessionId}`
    if (sessionStorage.getItem(doneKey)) return
    sessionStorage.setItem(doneKey, '1')

    void (async () => {
      try {
        const res = await fetch('/api/complete-host-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          accounts?: StoredAccount[]
          accountId?: string
        }
        if (!res.ok || !data.ok || !Array.isArray(data.accounts)) return
        saveStoredAccounts(data.accounts)
        const acc =
          (data.accountId && data.accounts.find((a) => a.id === data.accountId)) ||
          data.accounts[data.accounts.length - 1]
        if (!acc?.username) return
        localStorage.setItem('staypilot_current_user', String(acc.username).trim())
        localStorage.setItem('staypilot_login_identifier', String(acc.username).trim().toLowerCase())
        localStorage.setItem('staypilot_session_active', 'true')
        localStorage.setItem('staypilot_current_plan', String(acc.plan || 'Pro').trim())
        localStorage.setItem('staypilot_current_role', String(acc.role || 'host').trim())
        window.dispatchEvent(new Event('staypilot-session-changed'))
        window.history.replaceState({}, '', '/dashboard')
        window.location.reload()
      } catch {
        /* ignore */
      }
    })()
  }, [])

  useEffect(() => {
    const syncRoleFromSession = () => setCurrentRole(getStoredRole())
    syncRoleFromSession()
    window.addEventListener('staypilot-session-changed', syncRoleFromSession)
    return () => window.removeEventListener('staypilot-session-changed', syncRoleFromSession)
  }, [])

  useEffect(() => {
    const localizePlanLabel = (plan: string) => {
      const normalized = plan.trim().toLowerCase()
      if (normalized === 'starter') return t.starterName
      if (normalized === 'pro') return t.proName
      if (normalized === 'scale') return t.scaleName
      if (normalized === 'gratuit' || normalized === 'free') return t.planFreeLabel
      return plan
    }

    function applyPlanFromSession() {
      const savedIdentifier = localStorage.getItem('staypilot_login_identifier')?.trim().toLowerCase()
      const accounts = getStoredAccounts()
      const currentAccount =
        accounts.find((a) => storedAccountMatchesNormalizedId(a, savedIdentifier || '')) ?? accounts[0]
      const accountPlan = (currentAccount?.plan || '').trim()
      const sessionPlan = (localStorage.getItem('staypilot_current_plan') || '').trim()

      const effective = accountPlan || sessionPlan || 'Pro'

      if (accountPlan && accountPlan !== sessionPlan) {
        localStorage.setItem('staypilot_current_plan', accountPlan)
      }

      setCurrentPlanRaw(effective)
      setActivePlanLabel(localizePlanLabel(effective))
    }

    applyPlanFromSession()
    window.addEventListener('staypilot-session-changed', applyPlanFromSession)
    return () => window.removeEventListener('staypilot-session-changed', applyPlanFromSession)
  }, [t.planFreeLabel, t.proName, t.scaleName, t.starterName])
  const planTier = useMemo(() => getPlanTierFromValue(currentPlanRaw), [currentPlanRaw])

  const cleanerInviterDisplayName = useMemo(() => {
    if (!isCleanerSession) return ''
    const savedIdentifier = (
      localStorage.getItem('staypilot_login_identifier') ||
      localStorage.getItem('staypilot_current_user') ||
      ''
    )
      .trim()
      .toLowerCase()
    if (!savedIdentifier) return ''
    const accounts = getStoredAccounts()
    const matchAccount = (a: StoredAccount) => storedAccountMatchesNormalizedId(a, savedIdentifier)
    const cleaner = accounts.find((a) => matchAccount(a) && (a.role || 'host') === 'cleaner')
    if (!cleaner) return ''
    const hostRef = (cleaner.hostUsername || '').trim()
    if (!hostRef) return ''
    const hostRefNorm = normalizeStoredLoginPiece(hostRef)
    const host = accounts.find(
      (a) =>
        (a.role || 'host') === 'host' &&
        (normalizeStoredLoginPiece(a.username) === hostRefNorm || normalizeStoredLoginPiece(a.email) === hostRefNorm),
    )
    if (!host) return String(cleaner.hostUsername ?? '').trim() || ''
    return `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.username
  }, [isCleanerSession])

  const guestDemo = isGuestDemoSession() || isGuestDemoRoutingActive()
  const tabIsGuestDemoLocked = (tab: string) =>
    tab === t.dashboardTabConnect || tab === t.dashboardTabWhatsApp || tab === t.dashboardTabEarlyAccess

  useEffect(() => {
    if (!guestDemo) return
    const targetRole = 'host'
    if (currentRole === targetRole) return
    localStorage.setItem('staypilot_current_role', targetRole)
    setCurrentRole(targetRole)
    window.dispatchEvent(new Event('staypilot-session-changed'))
  }, [currentRole, guestDemo])

  const hostTabsWithConnect = [
    t.dashboardTabConnect,
    t.dashboardTabCalendar,
    t.dashboardTabStats,
    t.dashboardTabIntel,
    t.dashboardTabCleaning,
    t.dashboardTabExpenses,
    t.dashboardTabSupplies,
    t.dashboardTabWhatsApp,
    t.dashboardTabEarlyAccess,
  ]

  const tabs = isCleanerSession
    ? cleanerHasAssignedListing
      ? [t.dashboardTabCalendar, t.dashboardTabCleaning, t.dashboardTabSupplies]
      : [t.dashboardTabCleaning]
    : hostTabsWithConnect
  const primaryTab = isCleanerSession ? t.dashboardTabCleaning : tabs[0]
  const scaleOnlyTabs = new Set([t.dashboardTabWhatsApp, t.dashboardTabEarlyAccess])
  const rowOneTabs = isCleanerSession
    ? cleanerHasAssignedListing
      ? [t.dashboardTabCalendar, primaryTab, t.dashboardTabSupplies]
      : [primaryTab]
    : [tabs[0], tabs[1], tabs[2], tabs[3]]
  const rowTwoTabs = isCleanerSession ? [] : [tabs[4], tabs[5], tabs[6], tabs[7], tabs[8]]
  const tabIcons: Record<string, JSX.Element> = {
    [t.dashboardTabConnect]: <Gem className="h-5 w-5 text-[#4a86f7]" />,
    [t.dashboardTabCalendar]: <CalendarDays className="h-5 w-5 text-zinc-500" />,
    [t.dashboardTabStats]: <ChartColumn className="h-5 w-5 text-zinc-500" />,
    [t.dashboardTabIntel]: <Sparkles className="h-5 w-5 text-zinc-500" />,
    [t.dashboardTabCleaning]: <span className="text-lg grayscale saturate-0" aria-hidden>🧽</span>,
    [t.dashboardTabExpenses]: <Wallet className="h-5 w-5 text-zinc-500" />,
    [t.dashboardTabSupplies]: <Package className="h-5 w-5 text-zinc-500" />,
    [t.dashboardTabWhatsApp]: <MessageCircle className="h-5 w-5 text-violet-600" />,
    [t.dashboardTabEarlyAccess]: <Sparkles className="h-5 w-5 text-violet-600" />,
  }
  const getTabHref = (tab: string) => {
    if (tab === t.dashboardTabConnect) return '/dashboard/connecter-logements'
    if (tab === t.dashboardTabCalendar) return '/dashboard/calendrier'
    if (tab === t.dashboardTabStats) return '/dashboard/statistiques'
    if (tab === t.dashboardTabIntel) return '/dashboard/veille-informationnelle'
    if (tab === t.dashboardTabCleaning) return '/dashboard/prestataire-menage'
    if (tab === t.dashboardTabExpenses) return '/dashboard/tableau-charges'
    if (tab === t.dashboardTabSupplies) return '/dashboard/consommables'
    if (tab === t.dashboardTabWhatsApp) return '/dashboard/whatsapp'
    if (tab === t.dashboardTabEarlyAccess) return '/dashboard/acces-anticipe'
    return '/dashboard'
  }

  const onTabClick = (tab: string) => {
    if (guestDemo && tabIsGuestDemoLocked(tab)) return
    const href = getTabHref(tab)
    if (isCleanerSession || guestDemo || canAccessDashboardPath(planTier, href)) {
      window.location.href = href
      return
    }
    window.alert(c.upgradeAlert)
  }
  return (
    <section className="relative flex min-h-screen flex-1 items-center justify-center border-t border-zinc-200/60 bg-[radial-gradient(ellipse_70%_60%_at_20%_0%,rgba(79,134,247,0.14),transparent_60%),linear-gradient(180deg,#f8fbff_0%,#f4f7fc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      {!guestDemo ? (
        <a
          href="/profil"
          className="absolute right-4 top-4 z-20 inline-flex items-center rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 to-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow sm:right-6 sm:top-6 lg:right-8 lg:top-7"
        >
          {c.profileSettings}
        </a>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1180px] flex-col">
        <div className="mb-2 flex justify-center">
          <p className="rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1.5 text-center text-xs font-semibold text-blue-800 sm:text-sm">
            {guestDemo ? (
              <>{c.guestDemoPillLabel}</>
            ) : isCleanerSession ? (
              <>
                {t.dashboardCleanerInvitedPrefix}{' '}
                {cleanerInviterDisplayName || t.dashboardCleanerInvitedUnknownHost}
              </>
            ) : (
              <>
                {t.dashboardActiveOffer} {activePlanLabel}
              </>
            )}
          </p>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTitle}</h1>
        <p className="mt-1 text-center text-sm text-zinc-600">{t.dashboardTabsTitle}</p>
        <div className="mx-auto mt-6 hidden w-full max-w-[1220px] flex-col gap-4 lg:flex">
          <div className="flex items-stretch justify-center gap-4">
            {rowOneTabs.map((tab) => {
              const isPrimary = tab === primaryTab
              const isScaleOnly = scaleOnlyTabs.has(tab)
              const demoLocked = guestDemo && tabIsGuestDemoLocked(tab)
              const showScaleLook = isScaleOnly && !demoLocked
              const isLocked = !isCleanerSession && !guestDemo && !canAccessDashboardPath(planTier, getTabHref(tab))
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={demoLocked}
                  onClick={() => onTabClick(tab)}
                  className={`group rounded-2xl border p-4 text-center shadow-pm-sm transition-all ${
                    demoLocked ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5 hover:shadow-pm-md'
                  } ${
                    isPrimary
                      ? `w-[360px] border-[#4a86f7]/40 bg-[linear-gradient(180deg,#eef4ff_0%,#f6f9ff_100%)] ring-1 ring-[#4a86f7]/20 ${demoLocked ? '' : 'hover:border-[#4a86f7]/55'}`
                      : showScaleLook
                        ? `w-[210px] border-violet-300/90 bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(192,132,252,0.26),transparent_55%),linear-gradient(180deg,#f7f0ff_0%,#ffffff_70%)] ring-1 ring-violet-300/60 shadow-[0_16px_40px_-18px_rgba(139,92,246,0.55)] ${demoLocked ? '' : 'hover:border-violet-400 hover:shadow-[0_24px_48px_-16px_rgba(139,92,246,0.55)]'}`
                        : `w-[210px] border-zinc-200/80 bg-white ${demoLocked ? '' : 'hover:border-[#4a86f7]/35'}`
                  } ${isLocked ? 'opacity-70' : ''}`}
                >
                  <div className="mb-2 flex justify-center">
                    <span className={`rounded-xl p-2 ${showScaleLook ? 'bg-violet-100/80 ring-1 ring-violet-200/80' : 'bg-zinc-100/80'}`}>
                      {tabIcons[tab]}
                    </span>
                  </div>
                  {demoLocked ? (
                    <p className="mx-auto mb-2 max-w-[11rem] text-center text-[10px] font-semibold leading-snug text-zinc-500">
                      {c.guestDemoTabUnavailable}
                    </p>
                  ) : isScaleOnly ? (
                    <p className="mx-auto mb-2 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_-10px_rgba(79,70,229,0.8)]">
                      {t.dashboardPremiumScale}
                    </p>
                  ) : null}
                  <p className="text-[15px] font-semibold leading-snug text-zinc-800 transition-colors group-hover:text-zinc-900">
                    {tab}
                  </p>
                  {isLocked ? <p className="mt-1 text-[10px] font-semibold text-amber-700">{c.upgradeRequired}</p> : null}
                </button>
              )
            })}
          </div>

          {rowTwoTabs.length > 0 ? <div className="flex items-stretch justify-center gap-4">
            {rowTwoTabs.map((tab) => {
              const isScaleOnly = scaleOnlyTabs.has(tab)
              const demoLocked = guestDemo && tabIsGuestDemoLocked(tab)
              const showScaleLook = isScaleOnly && !demoLocked
              const isLocked = !isCleanerSession && !guestDemo && !canAccessDashboardPath(planTier, getTabHref(tab))
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={demoLocked}
                  onClick={() => onTabClick(tab)}
                  className={`group w-[210px] rounded-2xl border p-4 text-center shadow-pm-sm transition-all ${
                    demoLocked ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5 hover:shadow-pm-md'
                  } ${
                    showScaleLook
                      ? `border-violet-300/90 bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(192,132,252,0.26),transparent_55%),linear-gradient(180deg,#f7f0ff_0%,#ffffff_70%)] ring-1 ring-violet-300/60 shadow-[0_16px_40px_-18px_rgba(139,92,246,0.55)] ${demoLocked ? '' : 'hover:border-violet-400 hover:shadow-[0_24px_48px_-16px_rgba(139,92,246,0.55)]'}`
                      : `border-zinc-200/80 bg-white ${demoLocked ? '' : 'hover:border-[#4a86f7]/35'}`
                  } ${isLocked ? 'opacity-70' : ''}`}
                >
                  <div className="mb-2 flex justify-center">
                    <span className={`rounded-xl p-2 ${showScaleLook ? 'bg-violet-100/80 ring-1 ring-violet-200/80' : 'bg-zinc-100/80'}`}>
                      {tabIcons[tab]}
                    </span>
                  </div>
                  {demoLocked ? (
                    <p className="mx-auto mb-2 max-w-[11rem] text-center text-[10px] font-semibold leading-snug text-zinc-500">
                      {c.guestDemoTabUnavailable}
                    </p>
                  ) : isScaleOnly ? (
                    <p className="mx-auto mb-2 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_-10px_rgba(79,70,229,0.8)]">
                      {t.dashboardPremiumScale}
                    </p>
                  ) : null}
                  <p className="text-[15px] font-semibold leading-snug text-zinc-800 transition-colors group-hover:text-zinc-900">
                    {tab}
                  </p>
                  {isLocked ? <p className="mt-1 text-[10px] font-semibold text-amber-700">{c.upgradeRequired}</p> : null}
                </button>
              )
            })}
          </div> : null}
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-[980px] grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
          {tabs.map((tab) => {
            const isScaleOnly = scaleOnlyTabs.has(tab)
            const demoLocked = guestDemo && tabIsGuestDemoLocked(tab)
            const showScaleLook = isScaleOnly && !demoLocked
            const isLocked = !isCleanerSession && !guestDemo && !canAccessDashboardPath(planTier, getTabHref(tab))
            return (
              <button
                key={tab}
                type="button"
                disabled={demoLocked}
                onClick={() => onTabClick(tab)}
                className={`group aspect-square max-h-[210px] rounded-2xl border p-4 text-center shadow-pm-sm transition-all ${
                  demoLocked ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5 hover:shadow-pm-md'
                } ${
                  tab === primaryTab
                    ? `border-[#4a86f7]/40 bg-[linear-gradient(180deg,#eef4ff_0%,#f6f9ff_100%)] ring-1 ring-[#4a86f7]/20 ${demoLocked ? '' : 'hover:border-[#4a86f7]/55'}`
                    : showScaleLook
                      ? `border-violet-300/90 bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(192,132,252,0.26),transparent_55%),linear-gradient(180deg,#f7f0ff_0%,#ffffff_70%)] ring-1 ring-violet-300/60 shadow-[0_16px_40px_-18px_rgba(139,92,246,0.55)] ${demoLocked ? '' : 'hover:border-violet-400 hover:shadow-[0_24px_48px_-16px_rgba(139,92,246,0.55)]'}`
                      : `border-zinc-200/80 bg-white ${demoLocked ? '' : 'hover:border-[#4a86f7]/35'}`
                } ${isLocked ? 'opacity-70' : ''}`}
              >
                <div className="mb-2 flex justify-center">
                  <span className={`rounded-xl p-2 ${showScaleLook ? 'bg-violet-100/80 ring-1 ring-violet-200/80' : 'bg-zinc-100/80'}`}>
                    {tabIcons[tab]}
                  </span>
                </div>
                {demoLocked ? (
                  <p className="mx-auto mb-2 max-w-[11rem] text-center text-[10px] font-semibold leading-snug text-zinc-500">
                    {c.guestDemoTabUnavailable}
                  </p>
                ) : isScaleOnly ? (
                  <p className="mx-auto mb-2 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_-10px_rgba(79,70,229,0.8)]">
                    {t.dashboardPremiumScale}
                  </p>
                ) : null}
                <p className="text-[15px] font-semibold leading-snug text-zinc-800 transition-colors group-hover:text-zinc-900">
                  {tab}
                </p>
                {isLocked ? <p className="mt-1 text-[10px] font-semibold text-amber-700">{c.upgradeRequired}</p> : null}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
