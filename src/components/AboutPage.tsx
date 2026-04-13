import { useLanguage } from '../hooks/useLanguage'

export function AboutPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="about-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.aboutBackLink}
        </a>
        <h1
          id="about-page-title"
          className="mt-8 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
        >
          {t.aboutPageTitle}
        </h1>
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
          {t.introParagraphs.map((p, i) => (
            <p key={`intro-${i}`}>{p}</p>
          ))}
        </div>
        <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-zinc-700 sm:mt-14 sm:space-y-14 sm:text-base">
          {t.blocks.map((block) => (
            <div key={block.title} className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{block.title}</h2>
              {block.paragraphs.map((p, i) => (
                <p key={`${block.title}-p-${i}`}>{p}</p>
              ))}
              {block.bullets && block.bullets.length > 0 ? (
                <ul className="list-disc space-y-2.5 pl-5 marker:text-zinc-400">
                  {block.bullets.map((b, i) => (
                    <li key={`${block.title}-b-${i}`} className="pl-1">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
