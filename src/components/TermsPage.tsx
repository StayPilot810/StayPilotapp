export function TermsPage() {
  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="terms-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← CGU
        </a>
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 id="terms-page-title" className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Conditions générales d'utilisation
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : 18/04/2026</p>

          <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 1 — Champ d'application</h2>
              <p className="mt-2">
                Les présentes Conditions générales d'utilisation (CGU) s'appliquent à toute navigation sur le site et à
                toute utilisation des fonctionnalités proposées par StayPilot.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 2 — Éditeur</h2>
              <p className="mt-2">
                StayPilot est proposé par <span className="font-semibold">Revendia LLC</span>, immatriculée aux Émirats
                arabes unis, à l'adresse <span className="font-semibold">Sharjah Media City (Shams)</span>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 3 — Accès au service</h2>
              <p className="mt-2">
                L'accès au site est en principe continu, sous réserve des opérations de maintenance, des incidents
                techniques ou de tout événement indépendant de la volonté de l'éditeur.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 4 — Obligations de l'utilisateur</h2>
              <p className="mt-2">
                L'utilisateur s'engage à utiliser le service de manière loyale, conforme aux lois applicables, sans
                perturber le fonctionnement du site ni porter atteinte aux droits de tiers.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 5 — Abonnement et changements de forfait</h2>
              <p className="mt-2">
                Les formules d&apos;abonnement (notamment Starter, Pro, Scale) et leurs modalités de facturation sont
                celles présentées sur le site ou communiquées lors de la souscription. Les changements de forfait
                doivent être demandés et utilisés de <span className="font-semibold">bonne foi</span>. Des
                allers-retours répétés ou manifestement abusifs entre formules, visant à contourner le tarif normalement
                applicable à l&apos;usage réel du service, pourront entraîner le refus de certains changements ou
                l&apos;alignement de la facturation sur le forfait correspondant à cet usage, après information de
                l&apos;utilisateur dans la mesure du possible.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 6 — Propriété intellectuelle</h2>
              <p className="mt-2">
                Tous les éléments du service (marques, interfaces, contenus, composants techniques) demeurent la
                propriété de l'éditeur ou de ses partenaires. Toute utilisation non autorisée est interdite.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 7 — Limitation de responsabilité</h2>
              <p className="mt-2">
                L'éditeur met en oeuvre des moyens raisonnables pour assurer la fiabilité et la disponibilité du service,
                sans garantie absolue d'absence d'erreur, d'interruption ou d'incompatibilité.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 8 — Évolution des CGU</h2>
              <p className="mt-2">
                Les CGU peuvent être modifiées à tout moment afin de tenir compte des évolutions du service, des exigences
                techniques et du cadre juridique applicable.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 9 — Droit applicable</h2>
              <p className="mt-2">
                Les présentes CGU sont interprétées selon le droit applicable au siège de l'éditeur, sous réserve des
                dispositions impératives éventuellement applicables aux utilisateurs.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Article 10 — Contact</h2>
              <p className="mt-2">
                Pour toute question contractuelle ou commerciale, merci d'utiliser la page Contact du site.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
