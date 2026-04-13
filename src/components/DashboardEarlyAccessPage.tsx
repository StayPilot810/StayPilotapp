import { useLanguage } from '../hooks/useLanguage'

export function DashboardEarlyAccessPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-violet-500/15 via-violet-500/5 to-transparent px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Accès anticipé</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabEarlyAccess}</h1>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-sm leading-relaxed text-zinc-700">
              Actuellement, l'équipe travaille sur l'ajout d'un très grand nombre d'APIs de journaux et de flux médias
              pour renforcer la veille informationnelle et fiabiliser nos signaux de demande.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              En tant que client Premium, vous serez les premiers à en bénéficier.
            </p>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Exemples de sources en cours d'intégration</p>
              <p className="mt-2 text-sm text-zinc-700">
                BFMTV, New York Times, Reuters, Associated Press (AP), BBC News, The Guardian, Le Monde, Les Echos,
                Franceinfo, Financial Times, Bloomberg, CNN, Al Jazeera, Euronews, NewsAPI, GDELT et autres flux
                spécialisés (événements, risques, économie, tourisme).
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Objectif 1</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Données plus fiables</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Objectif 2</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Moins de faux signaux</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Objectif 3</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">Meilleure anticipation prix et occupation</p>
              </article>
            </div>

            <p className="mt-4 text-sm text-zinc-700">
              Notre but est de croiser un maximum de sources, vérifier la cohérence entre elles, puis ne remonter que
              les informations les plus pertinentes pour la veille informationnelle de vos logements.
            </p>
            <p className="mt-2 text-sm text-zinc-700">
              N'hésitez pas à nous envoyer un WhatsApp sur les points que vous souhaitez améliorer.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
