import { MessageCircle } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

export function NewsPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="news-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.footerLinkNews}
        </a>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a86f7]">{t.footerChatbotKicker}</p>
          <h1 id="news-page-title" className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {t.footerChatbotTitle}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-zinc-700 sm:text-base">{t.footerChatbotDescription}</p>
          <div className="mt-6 rounded-xl border border-[#4a86f7]/20 bg-[#4a86f7]/5 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb]">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.footerChatbotHint}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
