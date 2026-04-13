import { useLanguage } from '../hooks/useLanguage'

export function DashboardWhatsAppPage() {
  const { t } = useLanguage()

  const prefilledMessage = encodeURIComponent(
    'Bonjour équipe StayManager, je suis client Premium et je souhaite échanger avec vous sur mon compte.',
  )

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Support Premium</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Contact WhatsApp prioritaire</h1>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-sm leading-relaxed text-zinc-700">
              En tant que client Premium, vous bénéficiez d’un accompagnement plus rapide et prioritaire sur WhatsApp.
              Notre équipe vous répond sur les sujets stratégiques: pricing, occupation, automatisation et optimisation
              opérationnelle.
            </p>
            <p className="mt-3 text-sm font-semibold text-zinc-900">
              Pour l'instant, vous pouvez me contacter directement au{' '}
              <a href="tel:+971585292561" className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
                +971 58 529 2561
              </a>
              .
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-900">
              Vous pouvez aussi nous écrire par email :{' '}
              <a
                href="mailto:support@staymanager.fr"
                className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                support@staymanager.fr
              </a>
              .
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Avantage 1</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Réponse prioritaire</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Avantage 2</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Suivi personnalisé</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Avantage 3</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Aide au pilotage business</p>
              </article>
            </div>

            <a
              href={`https://wa.me/971585292561?text=${prefilledMessage}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Nous contacter sur WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
