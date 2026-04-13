import { useEffect, useState } from 'react'
import { CalendarDays, ChartColumn, Gem, MessageCircle, Package, Sparkles, Wallet } from 'lucide-react'
import { getStoredAccounts } from '../lib/accounts'
import { useLanguage } from '../hooks/useLanguage'

export function DashboardPage() {
  const { t } = useLanguage()
  const [activePlanLabel, setActivePlanLabel] = useState(t.proName)

  useEffect(() => {
    const localizePlanLabel = (plan: string) => {
      const normalized = plan.trim().toLowerCase()
      if (normalized === 'starter') return t.starterName
      if (normalized === 'pro') return t.proName
      if (normalized === 'scale') return t.scaleName
      if (normalized === 'gratuit' || normalized === 'free') return t.planFreeLabel
      return plan
    }

    const sessionPlan = localStorage.getItem('sm_current_plan')?.trim()
    if (sessionPlan) {
      setActivePlanLabel(localizePlanLabel(sessionPlan))
      return
    }

    const savedIdentifier = localStorage.getItem('sm_login_identifier')?.trim().toLowerCase()
    const accounts = getStoredAccounts()

    const currentAccount =
      accounts.find(
        (a) =>
          a.email.trim().toLowerCase() === savedIdentifier ||
          a.username.trim().toLowerCase() === savedIdentifier,
      ) ?? accounts[0]

    if (currentAccount?.plan) setActivePlanLabel(localizePlanLabel(currentAccount.plan))
  }, [t.planFreeLabel, t.proName, t.scaleName, t.starterName])

  const tabs = [
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
  const primaryTab = tabs[0]
  const scaleOnlyTabs = new Set([t.dashboardTabWhatsApp, t.dashboardTabEarlyAccess])
  const rowOneTabs = [tabs[1], primaryTab, tabs[2], tabs[3]]
  const rowTwoTabs = [tabs[4], tabs[5], tabs[6], tabs[7], tabs[8]]
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

  return (
    <section className="flex min-h-screen flex-1 items-center justify-center border-t border-zinc-200/60 bg-[radial-gradient(ellipse_70%_60%_at_20%_0%,rgba(79,134,247,0.14),transparent_60%),linear-gradient(180deg,#f8fbff_0%,#f4f7fc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col">
        <div className="mb-2 flex justify-center">
          <p className="rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1.5 text-center text-xs font-semibold text-blue-800 sm:text-sm">
            {t.dashboardActiveOffer} {activePlanLabel}
          </p>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTitle}</h1>
        <p className="mt-1 text-center text-sm text-zinc-600">{t.dashboardTabsTitle}</p>

        <div className="mx-auto mt-6 hidden w-full max-w-[1220px] flex-col gap-4 lg:flex">
          <div className="flex items-stretch justify-center gap-4">
            {rowOneTabs.map((tab) => {
              const isPrimary = tab === primaryTab
              const isScaleOnly = scaleOnlyTabs.has(tab)
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    window.location.href = getTabHref(tab)
                  }}
                  className={`group rounded-2xl border p-4 text-center shadow-pm-sm transition-all hover:-translate-y-0.5 hover:shadow-pm-md ${
                    isPrimary
                      ? 'w-[360px] border-[#4a86f7]/40 bg-[linear-gradient(180deg,#eef4ff_0%,#f6f9ff_100%)] ring-1 ring-[#4a86f7]/20 hover:border-[#4a86f7]/55'
                      : isScaleOnly
                        ? 'w-[210px] border-violet-300/90 bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(192,132,252,0.26),transparent_55%),linear-gradient(180deg,#f7f0ff_0%,#ffffff_70%)] ring-1 ring-violet-300/60 shadow-[0_16px_40px_-18px_rgba(139,92,246,0.55)] hover:border-violet-400 hover:shadow-[0_24px_48px_-16px_rgba(139,92,246,0.55)]'
                      : 'w-[210px] border-zinc-200/80 bg-white hover:border-[#4a86f7]/35'
                  }`}
                >
                  <div className="mb-2 flex justify-center">
                    <span className={`rounded-xl p-2 ${isScaleOnly ? 'bg-violet-100/80 ring-1 ring-violet-200/80' : 'bg-zinc-100/80'}`}>
                      {tabIcons[tab]}
                    </span>
                  </div>
                  {isScaleOnly ? (
                    <p className="mx-auto mb-2 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_-10px_rgba(79,70,229,0.8)]">
                      {t.dashboardPremiumScale}
                    </p>
                  ) : null}
                  <p className="text-[15px] font-semibold leading-snug text-zinc-800 transition-colors group-hover:text-zinc-900">
                    {tab}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="flex items-stretch justify-center gap-4">
            {rowTwoTabs.map((tab) => {
              const isScaleOnly = scaleOnlyTabs.has(tab)
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    window.location.href = getTabHref(tab)
                  }}
                  className={`group w-[210px] rounded-2xl border p-4 text-center shadow-pm-sm transition-all hover:-translate-y-0.5 hover:shadow-pm-md ${
                    isScaleOnly
                      ? 'border-violet-300/90 bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(192,132,252,0.26),transparent_55%),linear-gradient(180deg,#f7f0ff_0%,#ffffff_70%)] ring-1 ring-violet-300/60 shadow-[0_16px_40px_-18px_rgba(139,92,246,0.55)] hover:border-violet-400 hover:shadow-[0_24px_48px_-16px_rgba(139,92,246,0.55)]'
                      : 'border-zinc-200/80 bg-white hover:border-[#4a86f7]/35'
                  }`}
                >
                  <div className="mb-2 flex justify-center">
                    <span className={`rounded-xl p-2 ${isScaleOnly ? 'bg-violet-100/80 ring-1 ring-violet-200/80' : 'bg-zinc-100/80'}`}>
                      {tabIcons[tab]}
                    </span>
                  </div>
                  {isScaleOnly ? (
                    <p className="mx-auto mb-2 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_-10px_rgba(79,70,229,0.8)]">
                      {t.dashboardPremiumScale}
                    </p>
                  ) : null}
                  <p className="text-[15px] font-semibold leading-snug text-zinc-800 transition-colors group-hover:text-zinc-900">
                    {tab}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-[980px] grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
          {tabs.map((tab) => {
            const isScaleOnly = scaleOnlyTabs.has(tab)
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  window.location.href = getTabHref(tab)
                }}
                className={`group aspect-square max-h-[210px] rounded-2xl border p-4 text-center shadow-pm-sm transition-all hover:-translate-y-0.5 hover:shadow-pm-md ${
                  tab === primaryTab
                    ? 'border-[#4a86f7]/40 bg-[linear-gradient(180deg,#eef4ff_0%,#f6f9ff_100%)] ring-1 ring-[#4a86f7]/20 hover:border-[#4a86f7]/55'
                    : isScaleOnly
                      ? 'border-violet-300/90 bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(192,132,252,0.26),transparent_55%),linear-gradient(180deg,#f7f0ff_0%,#ffffff_70%)] ring-1 ring-violet-300/60 shadow-[0_16px_40px_-18px_rgba(139,92,246,0.55)] hover:border-violet-400 hover:shadow-[0_24px_48px_-16px_rgba(139,92,246,0.55)]'
                    : 'border-zinc-200/80 bg-white hover:border-[#4a86f7]/35'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <span className={`rounded-xl p-2 ${isScaleOnly ? 'bg-violet-100/80 ring-1 ring-violet-200/80' : 'bg-zinc-100/80'}`}>
                    {tabIcons[tab]}
                  </span>
                </div>
                {isScaleOnly ? (
                  <p className="mx-auto mb-2 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_22px_-10px_rgba(79,70,229,0.8)]">
                    {t.dashboardPremiumScale}
                  </p>
                ) : null}
                <p className="text-[15px] font-semibold leading-snug text-zinc-800 transition-colors group-hover:text-zinc-900">
                  {tab}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
