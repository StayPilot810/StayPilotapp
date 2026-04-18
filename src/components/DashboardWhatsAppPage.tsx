import { useLanguage } from '../hooks/useLanguage'
import { CONTACT_EMAIL } from '../i18n/contactPage'

export function DashboardWhatsAppPage() {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const ui = {
    fr: {
      support: 'Support Premium',
      title: 'Contact WhatsApp prioritaire',
      body:
        'En tant que client Premium, vous bénéficiez d’un accompagnement plus rapide et prioritaire sur WhatsApp. Notre équipe vous répond sur les sujets stratégiques: pricing, occupation, automatisation et optimisation opérationnelle.',
      callNow: "Pour l'instant, vous pouvez me contacter directement au",
      emailLine: 'Vous pouvez aussi nous écrire par email :',
      botLine: "N'hésitez pas à contacter aussi notre chatbot StayPilot (bouton en bas à droite) pour une réponse rapide.",
      benefit1: 'Avantage 1',
      benefit2: 'Avantage 2',
      benefit3: 'Avantage 3',
      benefit1Text: 'Réponse prioritaire',
      benefit2Text: 'Suivi personnalisé',
      benefit3Text: 'Aide au pilotage business',
      cta: 'Nous contacter sur WhatsApp',
      prefill: 'Bonjour équipe StayPilot, je suis client Premium et je souhaite échanger avec vous sur mon compte.',
    },
    en: {
      support: 'Premium support',
      title: 'Priority WhatsApp contact',
      body:
        'As a Premium customer, you get faster and priority support on WhatsApp. Our team replies on strategic topics: pricing, occupancy, automation, and operational optimization.',
      callNow: 'For now, you can contact me directly at',
      emailLine: 'You can also reach us by email:',
      botLine: 'You can also contact our StayPilot chatbot (button at the bottom right) for a quick reply.',
      benefit1: 'Benefit 1',
      benefit2: 'Benefit 2',
      benefit3: 'Benefit 3',
      benefit1Text: 'Priority response',
      benefit2Text: 'Personalized follow-up',
      benefit3Text: 'Business steering help',
      cta: 'Contact us on WhatsApp',
      prefill: 'Hello StayPilot team, I am a Premium customer and would like to discuss my account with you.',
    },
    es: {
      support: 'Soporte Premium',
      title: 'Contacto prioritario por WhatsApp',
      body:
        'Como cliente Premium, tienes un acompañamiento más rápido y prioritario por WhatsApp. Nuestro equipo responde sobre temas estratégicos: pricing, ocupación, automatización y optimización operativa.',
      callNow: 'Por ahora, puedes contactarme directamente al',
      emailLine: 'También puedes escribirnos por correo:',
      botLine: 'También puedes contactar nuestro chatbot StayPilot (botón abajo a la derecha) para una respuesta rápida.',
      benefit1: 'Ventaja 1',
      benefit2: 'Ventaja 2',
      benefit3: 'Ventaja 3',
      benefit1Text: 'Respuesta prioritaria',
      benefit2Text: 'Seguimiento personalizado',
      benefit3Text: 'Ayuda para pilotar el negocio',
      cta: 'Contactarnos por WhatsApp',
      prefill: 'Hola equipo StayPilot, soy cliente Premium y quiero hablar con ustedes sobre mi cuenta.',
    },
    de: {
      support: 'Premium-Support',
      title: 'Priorisierter WhatsApp-Kontakt',
      body:
        'Als Premium-Kunde erhalten Sie schnelleren und priorisierten Support über WhatsApp. Unser Team antwortet zu strategischen Themen: Pricing, Auslastung, Automatisierung und operative Optimierung.',
      callNow: 'Derzeit können Sie mich direkt unter folgender Nummer kontaktieren:',
      emailLine: 'Sie können uns auch per E-Mail schreiben:',
      botLine: 'Sie können auch unseren StayPilot-Chatbot (Button unten rechts) für eine schnelle Antwort nutzen.',
      benefit1: 'Vorteil 1',
      benefit2: 'Vorteil 2',
      benefit3: 'Vorteil 3',
      benefit1Text: 'Priorisierte Antwort',
      benefit2Text: 'Individuelle Betreuung',
      benefit3Text: 'Hilfe bei der Business-Steuerung',
      cta: 'Kontakt per WhatsApp',
      prefill: 'Hallo StayPilot-Team, ich bin Premium-Kunde und möchte mich mit Ihnen zu meinem Konto austauschen.',
    },
    it: {
      support: 'Supporto Premium',
      title: 'Contatto WhatsApp prioritario',
      body:
        'Come cliente Premium, hai un supporto più rapido e prioritario su WhatsApp. Il nostro team risponde su temi strategici: pricing, occupazione, automazione e ottimizzazione operativa.',
      callNow: 'Per ora puoi contattarmi direttamente al',
      emailLine: 'Puoi anche scriverci via email:',
      botLine: 'Puoi anche contattare il nostro chatbot StayPilot (pulsante in basso a destra) per una risposta rapida.',
      benefit1: 'Vantaggio 1',
      benefit2: 'Vantaggio 2',
      benefit3: 'Vantaggio 3',
      benefit1Text: 'Risposta prioritaria',
      benefit2Text: 'Follow-up personalizzato',
      benefit3Text: 'Supporto al controllo del business',
      cta: 'Contattaci su WhatsApp',
      prefill: 'Ciao team StayPilot, sono un cliente Premium e vorrei parlare con voi del mio account.',
    },
  }[ll]

  const prefilledMessage = encodeURIComponent(ui.prefill)

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
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{ui.support}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{ui.title}</h1>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-sm leading-relaxed text-zinc-700">
              {ui.body}
            </p>
            <p className="mt-3 text-sm font-semibold text-zinc-900">
              {ui.callNow}{' '}
              <a href="tel:+971585292561" className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
                +971 58 529 2561
              </a>
              .
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-900">
              {ui.emailLine}{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              {ui.botLine}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.benefit1}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{ui.benefit1Text}</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.benefit2}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{ui.benefit2Text}</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.benefit3}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{ui.benefit3Text}</p>
              </article>
            </div>

            <a
              href={`https://wa.me/971585292561?text=${prefilledMessage}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              {ui.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
