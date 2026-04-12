import { motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import type { ReviewEntry } from '../i18n/reviews'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal } from './motion'

const starFilled = '#f59e0b'
const starEmpty = '#d6d3d1'
const starGlow = 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.35))'

type StarSize = 'md' | 'lg' | 'sm'

function Stars({ rating, size = 'md' }: { rating: 4 | 5; size?: StarSize }) {
  const dim =
    size === 'lg'
      ? 'h-6 w-6 sm:h-7 sm:w-7'
      : size === 'sm'
        ? 'h-3.5 w-3.5 sm:h-4 sm:w-4'
        : 'h-5 w-5 sm:h-6 sm:w-6'
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`${rating} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const on = i <= rating
        return (
          <Star
            key={i}
            className={dim}
            strokeWidth={on ? 2 : 1.75}
            style={{
              fill: on ? starFilled : starEmpty,
              color: on ? starFilled : starEmpty,
              filter: on ? starGlow : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

function FeaturedReviewCard({ review }: { review: ReviewEntry }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.article
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -6,
              scale: 1.02,
              boxShadow:
                '0 24px 48px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(245, 158, 11, 0.15)',
              transition: { type: 'tween', duration: 0.32, ease: easePremium },
            }
      }
      className="flex min-w-[min(88vw,300px)] shrink-0 flex-col rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/90 p-5 shadow-pm-md sm:min-w-[340px] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.stars} size="lg" />
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200/80">
          {review.stars === 5 ? '5/5' : '4/5+'}
        </span>
      </div>
      <p className="mt-4 text-base font-bold leading-snug text-zinc-900 sm:text-lg">&ldquo;{review.quote}&rdquo;</p>
      <hr className="my-4 border-zinc-200/80" />
      <div>
        <p className="font-semibold text-zinc-900">{review.name}</p>
        <p className="mt-1 text-sm text-zinc-600">{review.role}</p>
      </div>
    </motion.article>
  )
}

function CompactReviewCard({ review }: { review: ReviewEntry }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.article
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
              scale: 1.02,
              boxShadow:
                '0 14px 28px -8px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(245, 158, 11, 0.12)',
              transition: { type: 'tween', duration: 0.26, ease: easePremium },
            }
      }
      className="flex min-w-[min(78vw,260px)] shrink-0 flex-col rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5 shadow-pm-sm sm:min-w-[280px]"
    >
      <Stars rating={review.stars} size="sm" />
      <p className="mt-2.5 text-[13px] font-semibold leading-snug text-zinc-900 sm:text-sm">{review.quote}</p>
      <p className="mt-2 text-[11px] font-medium leading-snug text-zinc-600 sm:text-xs">
        <span className="font-semibold text-zinc-800">{review.name}</span>
        {' — '}
        {review.role}
      </p>
    </motion.article>
  )
}

type MarqueeRowProps = {
  children: ReactNode
  durationSec: number
  /** Masque le carrousel décoratif pour les lecteurs d’écran (contenu listé ailleurs). */
  decorative?: boolean
}

function MarqueeRow({ children, durationSec, decorative }: MarqueeRowProps) {
  return (
    <div
      className="reviews-marquee-group reviews-marquee-mask relative overflow-hidden py-1"
      role={decorative ? 'presentation' : undefined}
      aria-hidden={decorative ? true : undefined}
    >
      <div
        className="reviews-marquee-track gap-4 sm:gap-5"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

export function ReviewsSection() {
  const { t } = useLanguage()

  const featuredLoop = useMemo(() => [...t.featured, ...t.featured], [t.featured])
  const moreLoop = useMemo(() => [...t.more, ...t.more], [t.more])

  const featuredDuration = Math.max(32, t.featured.length * 2 * 11)
  const moreDuration = Math.max(42, t.more.length * 2 * 2.8)

  return (
    <section
      id="avis"
      className="scroll-mt-[64px] border-t border-zinc-200/50 bg-white py-12 sm:scroll-mt-[72px] sm:py-16 lg:py-20"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center" y={18}>
          <header>
            <h2
              id="reviews-heading"
              className="text-[1.375rem] font-bold tracking-[-0.03em] text-zinc-900 sm:text-3xl lg:text-[2rem]"
            >
              {t.trustTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
              {t.trustSubtitle}
            </p>
          </header>
        </Reveal>

        <div className="relative mt-10 sm:mt-12">
          <MarqueeRow durationSec={featuredDuration} decorative>
            {featuredLoop.map((review, i) => (
              <FeaturedReviewCard key={`feat-${review.name}-${i}`} review={review} />
            ))}
          </MarqueeRow>
        </div>

        <Reveal className="mt-12 sm:mt-14" y={14} delay={0.04}>
          <h3 className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 sm:mb-5 sm:text-xs">
            {t.moreReviewsTitle}
          </h3>
          <MarqueeRow durationSec={moreDuration} decorative>
            {moreLoop.map((review, i) => (
              <CompactReviewCard key={`more-${review.name}-${i}`} review={review} />
            ))}
          </MarqueeRow>
        </Reveal>

        <ul className="sr-only">
          {t.featured.map((review, i) => (
            <li key={`sr-feat-${i}`}>
              {review.quote} — {review.name}, {review.role}
            </li>
          ))}
          {t.more.slice(0, 8).map((review, i) => (
            <li key={`sr-more-${i}`}>
              {review.quote} — {review.name}, {review.role}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
