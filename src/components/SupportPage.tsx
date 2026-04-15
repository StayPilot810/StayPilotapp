import { MessageCircle, Mail, Bot } from 'lucide-react'

export function SupportPage() {
  const currentPlan =
    typeof window !== 'undefined' ? (window.localStorage.getItem('staypilot_current_plan') || '').trim() : ''
  const hasScaleSupport = currentPlan.toLowerCase() === 'scale'

  return (
    <section className="border-t border-zinc-200/70 bg-pm-app px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[980px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-pm-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a86f7]">Support StayPilot</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Tous vos canaux d&apos;aide en un seul endroit
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Contactez-nous par e-mail, utilisez notre chatbot pour une reponse immediate, et activez WhatsApp en
            priorite avec l&apos;offre Scale.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="inline-flex rounded-lg bg-white p-2 text-zinc-700">
                <Mail className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900">Support e-mail</p>
              <p className="mt-1 text-xs text-zinc-600">
                Pour les sujets compte, facturation et assistance technique.
              </p>
              <a href="mailto:support@staypilot.fr" className="mt-2 inline-block text-sm font-semibold text-[#4a86f7]">
                support@staypilot.fr
              </a>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="inline-flex rounded-lg bg-white p-2 text-zinc-700">
                <Bot className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900">Chatbot Agent StayPilot</p>
              <p className="mt-1 text-xs text-zinc-600">
                Disponible directement sur le site pour les questions rapides, 24h/24.
              </p>
              <p className="mt-2 text-xs font-medium text-emerald-700">Inclus pour tous les plans.</p>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="inline-flex rounded-lg bg-white p-2 text-zinc-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900">Support WhatsApp</p>
              <p className="mt-1 text-xs text-zinc-600">
                Canal prioritaire pour urgences operationnelles (check-in, menage, calendrier).
              </p>
              {hasScaleSupport ? (
                <a href="/dashboard/whatsapp" className="mt-2 inline-block text-sm font-semibold text-[#4a86f7]">
                  Acceder au support WhatsApp
                </a>
              ) : (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  Disponible uniquement avec l&apos;offre Scale.
                </p>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
