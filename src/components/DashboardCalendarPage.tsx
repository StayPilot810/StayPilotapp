import { BookingCalendarOverview } from './BookingCalendarOverview'
import { useLanguage } from '../hooks/useLanguage'

export function DashboardCalendarPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-6xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabCalendar}</h1>
          <p className="mt-2 text-sm text-zinc-600">Vision calendrier par logement avec filtres et disponibilités.</p>
        </div>
        <BookingCalendarOverview />
      </div>
    </section>
  )
}
