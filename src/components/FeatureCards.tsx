import { FEATURE_CARD_IMAGES } from '../i18n/featureCards'
import { useLanguage } from '../hooks/useLanguage'

export function FeatureCards() {
  const { t } = useLanguage()

  const cards = [
    {
      image: FEATURE_CARD_IMAGES[0],
      title: t.featureCard1Title,
      subtitle: t.featureCard1Subtitle,
      alt: t.featureCard1Title,
    },
    {
      image: FEATURE_CARD_IMAGES[1],
      title: t.featureCard2Title,
      subtitle: t.featureCard2Subtitle,
      alt: t.featureCard2Title,
    },
    {
      image: FEATURE_CARD_IMAGES[2],
      title: t.featureCard3Title,
      subtitle: t.featureCard3Subtitle,
      alt: t.featureCard3Title,
    },
  ] as const

  return (
    <section className="bg-white pb-20 pt-4 sm:pt-6 lg:pb-24">
      <h2 className="sr-only">{t.featuresHeading}</h2>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 px-5 sm:gap-6 sm:px-6 md:grid-cols-3 lg:gap-8 lg:px-8">
        {cards.map((card) => (
          <article
            key={card.image}
            className="group relative aspect-[3/4] max-h-[480px] min-h-[280px] overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] sm:max-h-none sm:min-h-[360px]"
          >
            <img
              src={card.image}
              alt={card.alt}
              className="absolute inset-0 h-full w-full object-cover brightness-[1.08] contrast-[0.97] saturate-[1.08] transition duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-[1.12]"
              loading="lazy"
            />
            {/* Dégradé léger (style listing Airbnb : photo lumineuse, texte lisible en bas) */}
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.02)_65%,transparent_100%)]"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <h3
                className="text-[1.15rem] font-bold leading-snug text-white sm:text-xl"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.35), 0 2px 16px rgba(0,0,0,0.25)',
                }}
              >
                {card.title}
              </h3>
              <p
                className="mt-1.5 text-[14px] font-medium leading-relaxed text-white sm:text-[15px]"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.35), 0 2px 12px rgba(0,0,0,0.2)',
                }}
              >
                {card.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
