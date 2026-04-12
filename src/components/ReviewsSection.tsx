import { Star } from 'lucide-react'
import type { ReviewEntry } from '../i18n/reviews'
import { useLanguage } from '../hooks/useLanguage'

const starBlue = '#4a86f7'

function Stars({ rating }: { rating: 4 | 5 }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-4 w-4 sm:h-[17px] sm:w-[17px]"
          strokeWidth={1.5}
          style={{
            fill: i <= rating ? starBlue : '#e5e7eb',
            color: i <= rating ? starBlue : '#e5e7eb',
          }}
        />
      ))}
    </div>
  )
}

function FeaturedCard({ review }: { review: ReviewEntry }) {
  return (
    <article className="flex flex-col rounded-2xl border border-gray-100/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
      <Stars rating={review.stars} />
      <p className="mt-3 text-lg font-bold leading-snug text-[#1a1a1a] sm:text-xl">{review.quote}</p>
      <hr className="my-4 border-gray-100" />
      <div>
        <p className="font-semibold text-[#1a1a1a]">{review.name}</p>
        <p className="mt-1 text-sm text-[#71717a]">{review.role}</p>
      </div>
    </article>
  )
}

function CompactReviewCard({ review }: { review: ReviewEntry }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Stars rating={review.stars} />
      <p className="mt-2 text-sm font-semibold leading-snug text-[#1a1a1a]">{review.quote}</p>
      <p className="mt-2 text-xs font-medium text-[#71717a]">
        <span className="font-semibold text-[#52525b]">{review.name}</span>
        {' — '}
        {review.role}
      </p>
    </article>
  )
}

export function ReviewsSection() {
  const { t } = useLanguage()

  return (
    <section
      id="avis"
      className="scroll-mt-[72px] border-t border-gray-100 bg-white py-11 sm:py-14 lg:py-16"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="reviews-heading"
            className="text-2xl font-bold tracking-tight text-[#1a1a1a] sm:text-3xl lg:text-[2rem]"
          >
            {t.trustTitle}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#71717a] sm:text-base">{t.trustSubtitle}</p>
        </header>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1fr_minmax(280px,320px)] lg:items-start xl:gap-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {t.featured.map((review, i) => (
              <FeaturedCard key={`${review.name}-${i}`} review={review} />
            ))}
          </div>

          <div className="flex min-h-0 flex-col lg:sticky lg:top-24">
            <h3 className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a1a1aa] lg:text-left">
              {t.moreReviewsTitle}
            </h3>
            <div
              className="max-h-[min(58vh,480px)] space-y-2.5 overflow-y-auto overscroll-y-contain rounded-2xl border border-gray-100 bg-[#fafafa] p-2.5 pr-2 shadow-inner sm:p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent"
              tabIndex={0}
              aria-label={t.moreReviewsTitle}
            >
              {t.more.map((review, i) => (
                <CompactReviewCard key={`${review.name}-${i}`} review={review} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
