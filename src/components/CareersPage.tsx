import { useLanguage } from '../hooks/useLanguage'
import type { CareersBlock } from '../i18n/careersPage'

function Block({ block }: { block: CareersBlock }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{block.title}</h2>
      {block.paragraphs.map((p, i) => (
        <p key={`p-${i}`} className="leading-relaxed">
          {p}
        </p>
      ))}
      {block.bullets && block.bullets.length > 0 ? (
        <ul className="list-disc space-y-2.5 pl-5 marker:text-zinc-400">
          {block.bullets.map((item, i) => (
            <li key={`li-${i}`} className="pl-1 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {(block.afterBullets ?? []).map((p, i) => (
        <p key={`ab-${i}`} className="leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  )
}

export function CareersPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="careers-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.careersBackLink}
        </a>
        <h1
          id="careers-page-title"
          className="mt-8 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
        >
          {t.careersPageTitle}
        </h1>
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
          {t.introParagraphs.map((p, i) => (
            <p key={`intro-${i}`}>{p}</p>
          ))}
        </div>
        <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-zinc-700 sm:mt-14 sm:space-y-14 sm:text-base">
          {t.blocks.map((block) => (
            <Block key={block.title} block={block} />
          ))}
        </div>
        <div className="mt-14 border-t border-zinc-200 pt-12 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{t.applicationTitle}</h2>
          <div className="mt-4 space-y-4">
            {t.applicationParagraphs.map((p, i) => (
              <p key={`app-${i}`}>{p}</p>
            ))}
          </div>
          <p className="mt-6">
            <span className="font-semibold text-zinc-800">{t.applicationEmailLabel} : </span>
            <a
              href={`mailto:${t.applicationEmail}`}
              className="font-semibold text-[#4a86f7] underline decoration-[#4a86f7]/30 underline-offset-2 transition-colors hover:text-[#3b76e8] hover:decoration-[#3b76e8]/40"
            >
              {t.applicationEmail}
            </a>
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            N'hésitez pas à contacter aussi notre chatbot StayPilot (bouton en bas à droite) pour une réponse rapide.
          </p>
        </div>
      </div>
    </section>
  )
}
