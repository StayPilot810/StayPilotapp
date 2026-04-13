import { motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReviewEntry } from '../i18n/reviews'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, Reveal } from './motion'

const starFilled = '#4f86f7'
const starEmpty = '#d4d4d8'
const starGlow = 'drop-shadow(0 1px 2px rgba(79, 134, 247, 0.35))'

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
                '0 24px 48px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(79, 134, 247, 0.2)',
              transition: { type: 'tween', duration: 0.32, ease: easePremium },
            }
      }
      className="flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white via-white to-blue-50/30 p-5 shadow-pm-md sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.stars} size="lg" />
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200/80">
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
                '0 14px 28px -8px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(79, 134, 247, 0.16)',
              transition: { type: 'tween', duration: 0.26, ease: easePremium },
            }
      }
      className="flex h-full flex-col rounded-xl border border-zinc-200/70 bg-gradient-to-b from-white to-zinc-50/60 px-4 py-3.5 shadow-pm-sm"
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

export function ReviewsSection() {
  const { t } = useLanguage()
  const featured = t.featured.slice(0, 3)
  const more = t.more.slice(0, 10)
  const loopedMore = useMemo(() => [...more, ...more], [more])
  const autoScrollRef = useRef<HTMLDivElement>(null)
  const [manualPauseUntil, setManualPauseUntil] = useState(0)

  useEffect(() => {
    const node = autoScrollRef.current
    if (!node) return

    let raf = 0
    let lastTs = 0
    const pxPerSecond = 14

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts
      const dt = (ts - lastTs) / 1000
      lastTs = ts

      const pauseActive = Date.now() < manualPauseUntil
      if (!pauseActive) {
        node.scrollTop += pxPerSecond * dt
        const halfHeight = node.scrollHeight / 2
        if (node.scrollTop >= halfHeight) node.scrollTop = 0
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [manualPauseUntil, loopedMore.length])

  const onManualScrollIntent = () => {
    setManualPauseUntil(Date.now() + 2400)
  }

  return (
    <section
      id="avis"
      className="scroll-mt-[64px] border-t border-zinc-200/50 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(79,134,247,0.08),transparent_70%)] py-12 sm:scroll-mt-[72px] sm:py-16 lg:py-20"
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

        <div className="relative mt-10 grid gap-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-3 shadow-pm-sm sm:mt-12 sm:grid-cols-[minmax(0,1fr)_260px] sm:p-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
            {featured.map((review, i) => (
              <FeaturedReviewCard key={`feat-${review.name}-${i}`} review={review} />
            ))}
          </div>
          <aside className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3">
            <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 sm:text-[11px]">
              {t.moreReviewsTitle}
            </h3>
            <div
              ref={autoScrollRef}
              onWheel={onManualScrollIntent}
              onTouchMove={onManualScrollIntent}
              className="h-[420px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]"
            >
              {loopedMore.map((review, i) => (
                <CompactReviewCard key={`more-${review.name}-${i}`} review={review} />
              ))}
            </div>
          </aside>
        </div>

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
