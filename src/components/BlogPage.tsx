import { useLanguage } from '../hooks/useLanguage'
import type { BlogArticle, BlogSection } from '../i18n/blogPage'

function SectionBlock({ section }: { section: BlogSection }) {
  return (
    <div className="space-y-3">
      {section.heading ? (
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">{section.heading}</h3>
      ) : null}
      {section.paragraphs.map((p, i) => (
        <p key={`p-${i}`} className="leading-relaxed">
          {p}
        </p>
      ))}
      {section.bullets && section.bullets.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
          {section.bullets.map((item, i) => (
            <li key={`li-${i}`} className="pl-1 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {(section.afterBullets ?? []).map((p, i) => (
        <p key={`ab-${i}`} className="leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  )
}

function ArticleCard({ article, conclusionLabel }: { article: BlogArticle; conclusionLabel: string }) {
  return (
    <article
      className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-pm-sm sm:p-8"
      aria-labelledby={`blog-article-${article.indexLabel.replace(/\s+/g, '-')}`}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-[0.14em] text-[#4a86f7]">
        <span aria-hidden className="text-[15px] leading-none normal-case tracking-normal sm:text-[17px]">
          📝
        </span>
        <span>{article.indexLabel}</span>
      </p>
      <h2
        id={`blog-article-${article.indexLabel.replace(/\s+/g, '-')}`}
        className="mt-2 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
      >
        {article.title}
      </h2>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
        {article.lead.map((p, i) => (
          <p key={`lead-${i}`}>{p}</p>
        ))}
      </div>
      <div className="mt-8 space-y-8">
        {article.sections.map((section, idx) => (
          <SectionBlock key={section.heading ?? `section-${idx}`} section={section} />
        ))}
      </div>
      {article.conclusion.length > 0 ? (
        <div className="mt-8 border-t border-zinc-100 pt-8">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{conclusionLabel}</p>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-700 sm:text-base">
            {article.conclusion.map((p, i) => (
              <p key={`c-${i}`}>{p}</p>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function BlogPage() {
  const { t } = useLanguage()

  return (
    <section className="min-h-screen bg-pm-app pb-16 pt-8 sm:pt-12" aria-labelledby="blog-page-title">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex rounded-lg text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
        >
          ← {t.blogBackLink}
        </a>
        <header className="mt-8">
          <h1 id="blog-page-title" className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {t.blogPageTitle}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base">{t.blogPageSubtitle}</p>
        </header>
        <div className="mt-12 space-y-12 sm:space-y-14">
          {t.articles.map((article) => (
            <ArticleCard key={article.title} article={article} conclusionLabel={t.blogConclusionLabel} />
          ))}
        </div>
      </div>
    </section>
  )
}
