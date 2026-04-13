import { useLanguage } from '../hooks/useLanguage'
import type { HelpCenterBlock } from '../i18n/helpCenterPage'
import { Mail } from 'lucide-react'

function ArticleCard({ block, index }: { block: HelpCenterBlock; index: number }) {
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_1px_0_rgba(15,23,42,0.06),0_20px_40px_-18px_rgba(37,99,235,0.18)] sm:p-8"
      aria-labelledby={`help-block-${index}-title`}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-[#4a86f7] via-[#3b76e8] to-[#2563eb] opacity-90"
        aria-hidden
      />
      <div className="pl-4 sm:pl-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a86f7]/90">
          {String(index + 1).padStart(2, '0')}
        </p>
        <h2
          id={`help-block-${index}-title`}
          className="mt-2 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
        >
          {block.title}
        </h2>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
          {block.paragraphs.map((p, i) => (
            <p key={`${block.title}-${i}`}>{p}</p>
          ))}
        </div>
      </div>
    </article>
  )
}

export function HelpCenterPage() {
  const { t } = useLanguage()

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-pm-app pb-20 pt-8 sm:pt-12"
      aria-labelledby="help-page-title"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(42vh,420px)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(74,134,247,0.14),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.helpBackLink}
        </a>

        <header className="mt-8 rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-white to-zinc-50/90 p-8 shadow-[0_1px_0_rgba(15,23,42,0.05),0_24px_48px_-24px_rgba(15,23,42,0.14)] sm:mt-10 sm:p-10">
          <p className="text-sm font-semibold tracking-wide text-[#4a86f7]">{t.helpPageKicker}</p>
          <h1
            id="help-page-title"
            className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
          >
            {t.helpPageTitle}
          </h1>
          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
            {t.introParagraphs.map((p, i) => (
              <p key={`intro-${i}`}>{p}</p>
            ))}
          </div>
        </header>

        <div className="mt-10 flex flex-col gap-6 sm:mt-12 sm:gap-7">
          {t.blocks.map((block, i) => (
            <ArticleCard key={block.title} block={block} index={i} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[#4a86f7]/20 bg-gradient-to-br from-[#4a86f7]/[0.07] via-white to-white p-8 shadow-[0_1px_0_rgba(74,134,247,0.12),0_20px_50px_-24px_rgba(37,99,235,0.25)] sm:mt-14 sm:p-10">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t.supportTitle}</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            {t.supportParagraphs.map((p, i) => (
              <p key={`support-${i}`}>{p}</p>
            ))}
          </div>
          <a
            href={`mailto:${t.supportEmail}?subject=${encodeURIComponent(t.helpPageTitle)}`}
            className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#4a86f7] to-[#3b76e8] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[#4a86f7]/25 transition-[transform,box-shadow] hover:shadow-xl hover:shadow-[#4a86f7]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/50 focus-visible:ring-offset-2 sm:w-auto sm:px-8"
          >
            <Mail className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2.2} aria-hidden />
            <span>{t.supportContactLabel}</span>
            <span className="sr-only"> : {t.supportEmail}</span>
          </a>
          <p className="mt-4 text-center text-sm text-zinc-500 sm:text-left">
            <span className="font-medium text-zinc-600">{t.supportEmail}</span>
          </p>
          <p className="mt-1 text-center text-sm text-zinc-500 sm:text-left">
            N'hésitez pas à contacter aussi notre chatbot StayPilot (bouton en bas à droite) pour une réponse rapide.
          </p>
        </div>
      </div>
    </section>
  )
}
