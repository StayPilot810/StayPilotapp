import { Mail, MessageCircle } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { CONTACT_EMAIL } from '../i18n/contactPage'

export function ContactPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="contact-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.contactBackLink}
        </a>

        <h1
          id="contact-page-title"
          className="mt-8 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
        >
          {t.contactPageTitle}
        </h1>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
          {t.contactIntro.map((p, i) => (
            <p key={`intro-${i}`}>{p}</p>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t.contactReasonsTitle}</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 marker:text-[#4a86f7]/80">
            {t.contactReasons.map((item, i) => (
              <li key={`r-${i}`} className="pl-1 leading-relaxed text-zinc-700">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-[#4a86f7]/20 bg-gradient-to-br from-[#4a86f7]/[0.06] via-white to-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4a86f7]/10 text-[#4a86f7]">
              <Mail className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t.contactEmailSectionTitle}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">{t.contactEmailIntro}</p>
              <p className="mt-5">
                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{t.contactEmailLabel}</span>
                <br />
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.contactPageTitle)}`}
                  className="mt-1 inline-block text-lg font-semibold text-[#4a86f7] underline decoration-[#4a86f7]/30 underline-offset-2 transition-colors hover:text-[#3b76e8]"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">{t.contactEmailNote}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                N'hésitez pas à contacter aussi notre chatbot StayPilot (bouton en bas à droite) pour une réponse rapide.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
              <MessageCircle className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t.contactWhatsAppTitle}</h2>
              <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
                {t.contactWhatsAppParagraphs.map((p, i) => (
                  <p key={`wa-${i}`}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
