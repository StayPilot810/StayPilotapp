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
    <LanguageProvider>
      <div className="min-w-0 bg-white text-[#1a1a1a]">
        <Navbar />
        <main className="min-w-0">
          <Hero />
          <FeatureCards />
          <StatsRow />
          <ReviewsSection />
          <TrialCtaSection />
          <PricingSection />
          <FaqSection />
        </main>
        <SiteFooter />
      </div>
    </LanguageProvider>
  )
}
