export function LegalPage() {
  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="legal-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← Mentions légales
        </a>
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 id="legal-page-title" className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Mentions légales
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : 13/04/2026</p>

          <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">1. Éditeur</h2>
              <p className="mt-2">
                Le site StayPilot est édité et exploité par <span className="font-semibold">Revendia LLC</span>,
                immatriculée aux Émirats arabes unis, à l'adresse{' '}
                <span className="font-semibold">Sharjah Media City (Shams)</span>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">2. Hébergement et infrastructure</h2>
              <p className="mt-2">
                Le service est hébergé sur des infrastructures techniques sélectionnées par l'éditeur, avec des mesures
                de sécurité raisonnables adaptées à la nature du service et aux risques identifiés.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">3. Objet du site</h2>
              <p className="mt-2">
                StayPilot propose une plateforme de pilotage pour la location courte durée (calendrier, suivi
                d'exploitation, indicateurs, tâches, assistance). Les informations fournies sur le site ont une valeur
                informative et commerciale.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">4. Propriété intellectuelle</h2>
              <p className="mt-2">
                L'ensemble des contenus (textes, logos, éléments visuels, composants logiciels, base de données) est
                protégé par les droits de propriété intellectuelle applicables. Toute reproduction, extraction,
                réutilisation ou diffusion non autorisée est interdite.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">5. Responsabilité</h2>
              <p className="mt-2">
                L'éditeur met en oeuvre des moyens raisonnables pour assurer l'exactitude et la disponibilité du site,
                sans garantir l'absence d'erreurs, d'interruptions ou d'indisponibilités temporaires.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">6. Contact légal</h2>
              <p className="mt-2">
                Pour toute demande légale, administrative ou contractuelle, merci d'utiliser la page Contact du site.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
