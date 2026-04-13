import { motion, useReducedMotion } from 'framer-motion'
import { FEATURE_CARD_IMAGES } from '../i18n/featureCards'
import { useLanguage } from '../hooks/useLanguage'
import { easePremium, StaggerReveal, staggerItem } from './motion'

export function FeatureCards() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()

  const cards = [
    {
      image: FEATURE_CARD_IMAGES[0],
      title: t.featureCard1Title,
      alt: t.featureCard1Title,
    },
    {
      image: FEATURE_CARD_IMAGES[1],
      title: t.featureCard2Title,
      alt: t.featureCard2Title,
    },
    {
      image: FEATURE_CARD_IMAGES[2],
      title: t.featureCard3Title,
      alt: t.featureCard3Title,
    },
  ] as const

  return (
    <section
      id="fonctionnalites"
      className="scroll-mt-[64px] border-b border-zinc-200/40 bg-pm-app pb-16 pt-4 sm:scroll-mt-[72px] sm:pb-24 sm:pt-8 lg:pb-28"
    >
      <h2 className="sr-only">{t.featuresHeading}</h2>
      <StaggerReveal className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 px-4 sm:gap-7 sm:px-6 md:grid-cols-3 lg:gap-8 lg:px-8">
        {cards.map((card) => (
          <motion.article
            key={card.image}
            variants={staggerItem(reduceMotion, 20)}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -5,
                    scale: 1.008,
                    boxShadow:
                      '0 28px 56px -14px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.06)',
                    transition: { type: 'tween', duration: 0.3, ease: easePremium },
                  }
            }
            className="group relative aspect-[3/4] max-h-[420px] min-h-[260px] overflow-hidden rounded-2xl shadow-pm-md ring-1 ring-black/[0.05] sm:max-h-none sm:min-h-[360px] sm:shadow-pm-lg"
          >
            <img
              src={card.image}
              alt={card.alt}
              className="absolute inset-0 h-full w-full object-cover brightness-[1.08] contrast-[0.97] saturate-[1.08] transition duration-500 ease-out group-hover:scale-[1.04] group-hover:brightness-[1.12]"
              loading="lazy"
            />
            {/* Dégradé léger (style listing Airbnb : photo lumineuse, texte lisible en bas) */}
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.02)_65%,transparent_100%)]"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <h3
                className="text-[1.05rem] font-bold leading-snug text-white sm:text-xl"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.35), 0 2px 16px rgba(0,0,0,0.25)',
                }}
              >
                {card.title}
              </h3>
            </div>
          </motion.article>
        ))}
      </StaggerReveal>
    </section>
  )
}
