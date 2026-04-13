export function PrivacyPage() {
  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="privacy-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← Confidentialité
        </a>
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 id="privacy-page-title" className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Confidentialité
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : 13/04/2026</p>

          <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">1. Responsable du traitement</h2>
              <p className="mt-2">
                Le service StayPilot est opéré par <span className="font-semibold">Revendia LLC</span>, immatriculée aux
                Émirats arabes unis, à l'adresse <span className="font-semibold">Sharjah Media City (Shams)</span>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">2. Catégories de données traitées</h2>
              <p className="mt-2">
                Selon l'usage du service, peuvent être traitées : données d'identification de compte, données
                opérationnelles liées à l'utilisation de la plateforme, données techniques (logs, sécurité, performance)
                et échanges de support.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">3. Finalités du traitement</h2>
              <p className="mt-2">
                Les données sont utilisées pour : fournir les fonctionnalités du service, sécuriser les accès, améliorer
                l'expérience utilisateur, assurer le support, et respecter les obligations légales applicables.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">4. Base juridique et proportionnalité</h2>
              <p className="mt-2">
                Les traitements sont réalisés sur la base de l'exécution du service, de l'intérêt légitime de sécurité et
                de continuité, et, lorsque nécessaire, du respect des obligations légales.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">5. Durées de conservation</h2>
              <p className="mt-2">
                Les données sont conservées pendant la durée strictement nécessaire aux finalités poursuivies, puis
                archivées ou supprimées selon les contraintes techniques, contractuelles et réglementaires.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">6. Sécurité</h2>
              <p className="mt-2">
                Des mesures techniques et organisationnelles raisonnables sont mises en oeuvre pour prévenir les accès non
                autorisés, la perte, l'altération ou la divulgation non conforme des données.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">7. Exercice de vos droits</h2>
              <p className="mt-2">
                Pour toute demande relative à vos données (accès, rectification, suppression, opposition selon le cadre
                applicable), merci d'utiliser la page Contact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
