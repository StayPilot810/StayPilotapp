import { Check } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

const primary = '#4a86f7'
const green = '#16a34a'

type PlanVariant = 'light' | 'featured'

function FeatureRow({
  text,
  variant,
}: {
  text: string
  variant: PlanVariant
}) {
  const iconClass =
    variant === 'featured'
      ? 'text-white'
      : 'text-[#16a34a]'
  return (
    <li className="flex gap-2.5 text-left">
      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2.5} aria-hidden />
      <span
        className={`text-[13px] leading-snug sm:text-sm ${
          variant === 'featured' ? 'text-white/95' : 'text-[#3f3f46]'
        }`}
      >
        {text}
      </span>
    </li>
  )
}

function PlanCard({
  variant,
  badge,
  name,
  range,
  price,
  priceSuffix,
  trial,
  features,
  cta,
}: {
  variant: PlanVariant
  badge?: string
  name: string
  range: string
  price: string
  priceSuffix: string
  trial: string
  features: string[]
  cta: string
}) {
  const isFeatured = variant === 'featured'

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-5 sm:p-5 ${
        isFeatured
          ? 'z-[1] border-transparent shadow-[0_12px_40px_rgba(74,134,247,0.35)]'
          : 'border-gray-200/90 bg-[#ffffff] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
      style={isFeatured ? { backgroundColor: primary } : undefined}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
          {badge}
        </div>
      ) : null}
      <div className={badge ? 'pt-2' : ''}>
        <h3 className={`text-lg font-bold ${isFeatured ? 'text-white' : 'text-[#1a1a1a]'}`}>{name}</h3>
        <p className={`mt-1 text-sm ${isFeatured ? 'text-white/85' : 'text-[#71717a]'}`}>{range}</p>
      </div>
      <div className="mt-5">
        <p className={`flex flex-wrap items-baseline gap-x-1 ${isFeatured ? 'text-white' : 'text-[#1a1a1a]'}`}>
          <span className="text-3xl font-bold tracking-tight sm:text-[2rem]">{price}</span>
          <span className={`text-sm font-medium ${isFeatured ? 'text-white/90' : 'text-[#71717a]'}`}>
            {priceSuffix}
          </span>
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${isFeatured ? 'text-white' : ''}`}
          style={!isFeatured ? { color: green } : undefined}
        >
          {trial}
        </p>
      </div>
      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {features.map((f, i) => (
          <FeatureRow key={`${name}-${i}`} text={f} variant={variant} />
        ))}
      </ul>
      <div className="mt-6">
        <a
          href="#"
          className={`flex w-full items-center justify-center rounded-full py-3 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isFeatured
              ? 'bg-[#ffffff] focus-visible:ring-white/50'
              : 'border border-[#1a1a1a] bg-[#ffffff] text-[#1a1a1a] hover:bg-gray-50 focus-visible:ring-[#4a86f7]/40'
          }`}
          style={isFeatured ? { color: primary } : undefined}
        >
          {cta}
        </a>
      </div>
    </div>
  )
}

export function PricingSection() {
  const { t } = useLanguage()

  return (
    <section
      id="tarifs"
      className="scroll-mt-[72px] border-t border-gray-100 bg-[#ffffff] py-10 sm:py-11 lg:py-12"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="text-2xl font-bold tracking-tight text-[#1a1a1a] sm:text-3xl lg:text-[1.85rem]"
          >
            {t.pricingTitle}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#71717a] sm:text-base">{t.pricingSubtitle}</p>
        </header>

        <div className="mt-8 grid gap-4 sm:mt-9 lg:mt-10 lg:grid-cols-3 lg:items-stretch lg:gap-5">
          <PlanCard
            variant="light"
            name={t.starterName}
            range={t.starterRange}
            price={t.starterPrice}
            priceSuffix={t.starterPriceSuffix}
            trial={t.planTrial}
            features={[...t.starterFeatures]}
            cta={t.planCta}
          />
          <PlanCard
            variant="featured"
            badge={t.popularBadge}
            name={t.proName}
            range={t.proRange}
            price={t.proPrice}
            priceSuffix={t.proPriceSuffix}
            trial={t.planTrial}
            features={[...t.proFeatures]}
            cta={t.planCta}
          />
          <PlanCard
            variant="light"
            name={t.scaleName}
            range={t.scaleRange}
            price={t.scalePrice}
            priceSuffix={t.scalePriceSuffix}
            trial={t.planTrial}
            features={[...t.scaleFeatures]}
            cta={t.planCta}
          />
        </div>
      </div>
    </section>
  )
}
