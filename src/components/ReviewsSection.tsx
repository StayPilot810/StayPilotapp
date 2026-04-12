import { motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { ReviewEntry } from '../i18n/reviews'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal, StaggerReveal, staggerItem } from './motion'

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

function FeaturedCardBody({ review }: { review: ReviewEntry }) {
  return (
    <>
      <Stars rating={review.stars} />
      <p className="mt-3 text-lg font-bold leading-snug text-[#1a1a1a] sm:text-xl">{review.quote}</p>
      <hr className="my-4 border-gray-100" />
      <div>
        <p className="font-semibold text-[#1a1a1a]">{review.name}</p>
        <p className="mt-1 text-sm text-[#71717a]">{review.role}</p>
      </div>
    </>
  )
}

function CompactReviewBody({ review }: { review: ReviewEntry }) {
  return (
    <>
      <Stars rating={review.stars} />
      <p className="mt-2 text-sm font-semibold leading-snug text-[#1a1a1a]">{review.quote}</p>
      <p className="mt-2 text-xs font-medium text-[#71717a]">
        <span className="font-semibold text-[#52525b]">{review.name}</span>
        {' — '}
        {review.role}
      </p>
    </>
  )
}

export function ReviewsSection() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="avis"
      className="scroll-mt-[72px] border-t border-gray-100 bg-white py-11 sm:py-14 lg:py-16"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center" y={18}>
          <header>
            <h2
              id="reviews-heading"
              className="text-2xl font-bold tracking-tight text-[#1a1a1a] sm:text-3xl lg:text-[2rem]"
            >
              {t.trustTitle}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#71717a] sm:text-base">{t.trustSubtitle}</p>
          </header>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1fr_minmax(280px,320px)] lg:items-start xl:gap-8">
          <StaggerReveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {t.featured.map((review, i) => (
              <motion.article
                key={`${review.name}-${i}`}
                variants={staggerItem(reduceMotion, 18)}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -5,
                        boxShadow: '0 20px 44px -16px rgba(15, 23, 42, 0.14)',
                        transition: { type: 'tween', duration: 0.28, ease: easePremium },
                      }
                }
                className="flex flex-col rounded-2xl border border-gray-100/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6"
              >
                <FeaturedCardBody review={review} />
              </motion.article>
            ))}
          </StaggerReveal>

          <Reveal className="flex min-h-0 flex-col lg:sticky lg:top-24" y={16} delay={0.08}>
            <h3 className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a1a1aa] lg:text-left">
              {t.moreReviewsTitle}
            </h3>
            <div
              className="max-h-[min(58vh,480px)] overflow-y-auto overscroll-y-contain rounded-2xl border border-gray-100 bg-[#fafafa] p-2.5 pr-2 shadow-inner sm:p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent"
              tabIndex={0}
              aria-label={t.moreReviewsTitle}
            >
              <StaggerReveal className="space-y-2.5" stagger={0.04}>
                {t.more.map((review, i) => (
                  <motion.article
                    key={`${review.name}-${i}`}
                    variants={staggerItem(reduceMotion, 10)}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : {
                            scale: 1.01,
                            transition: { type: 'tween', duration: 0.2, ease: easePremium },
                          }
                    }
                    className="rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <CompactReviewBody review={review} />
                  </motion.article>
                ))}
              </StaggerReveal>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
