import { useLanguage } from '../hooks/useLanguage'

export function DashboardBlankPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen flex-1 bg-white px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Cette section n'est pas incluse dans votre forfait actuel. Augmentez votre forfait pour y accéder.
      </div>
    </section>
  )
}

