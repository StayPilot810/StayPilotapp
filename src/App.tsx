import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { LanguageProvider } from './context/LanguageProvider'
import { FeatureCards } from './components/FeatureCards'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { FaqSection } from './components/FaqSection'
import { SiteFooter } from './components/SiteFooter'
import { PricingSection } from './components/PricingSection'
import { ReviewsSection } from './components/ReviewsSection'
import { StatsRow } from './components/StatsRow'
import { TrialCtaSection } from './components/TrialCtaSection'

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
      <LanguageProvider>
      <div className="flex min-h-screen min-w-0 flex-col bg-pm-app text-zinc-900 antialiased">
        <Navbar />
        <main className="flex min-w-0 flex-1 flex-col">
          <Hero />
          <FeatureCards />
          <StatsRow />
          <ReviewsSection />
          <TrialCtaSection />
          <PricingSection />
          <FaqSection />
          <SiteFooter />
        </main>
      </div>
      </LanguageProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
