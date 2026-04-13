import { BarChart3, CalendarRange, CircleCheckBig, MessageCircle, Sparkles } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { CONTACT_EMAIL } from '../i18n/contactPage'

export function WhyStayPilotPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="why-page-title">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.footerWhyTitle}
        </a>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4a86f7]">Positionnement premium</p>
          <h1 id="why-page-title" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {t.footerWhyTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-700">
            {t.footerWhyDescription}
          </p>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-700">
            StayPilot est pense pour les exploitants exigeants: moins de dispersion, plus de maitrise, et une execution
            business plus rapide au quotidien.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <CalendarRange className="h-4 w-4 text-[#4a86f7]" aria-hidden />
                Pilotage haut de gamme, sans friction
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Centralisez vos calendriers et vos operations sur une interface fluide pour reduire les erreurs, liberer
                du temps et garder le controle sur chaque logement.
              </p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <BarChart3 className="h-4 w-4 text-[#4a86f7]" aria-hidden />
                Decisions business immediates
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Visualisez les KPI decisifs et passez a l’action sur l’occupation, les charges et la marge avant que les
                opportunites ne disparaissent.
              </p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Sparkles className="h-4 w-4 text-[#4a86f7]" aria-hidden />
                Accompagnement commercial ultra vendeur
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                Notre assistant qualifie votre besoin, recommande Starter, Pro ou Scale, puis vous guide vers la
                conversion la plus pertinente.
              </p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <CircleCheckBig className="h-4 w-4 text-[#4a86f7]" aria-hidden />
                Deployement rapide, impact visible
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                En quelques etapes, vous passez d’une gestion eparpillee a une machine de pilotage claire, mesurable et
                orientee resultat.
              </p>
            </article>
          </div>

          <div className="mt-9 rounded-2xl border border-[#4a86f7]/25 bg-gradient-to-br from-[#4a86f7]/10 to-white p-6">
            <p className="text-sm font-semibold text-zinc-900">Prochaine etape recommandee</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              Activez maintenant l’offre adaptee a votre volume et transformez vos operations en avantage competitif.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/#tarifs"
                className="inline-flex rounded-lg bg-[#4a86f7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3b76e8]"
              >
                Voir les tarifs
              </a>
              <a
                href="/contact"
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Contacter l'equipe
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <MessageCircle className="h-4 w-4 text-[#4a86f7]" aria-hidden />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
