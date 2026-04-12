import { LanguageProvider } from './context/LanguageProvider'
import { FeatureCards } from './components/FeatureCards'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { FaqSection } from './components/FaqSection'
import { PricingSection } from './components/PricingSection'
import { ReviewsSection } from './components/ReviewsSection'
import { StatsRow } from './components/StatsRow'
import { TrialCtaSection } from './components/TrialCtaSection'

export default function App() {
  return (
    <LanguageProvider>
      <Navbar />
      <Hero />
      <FeatureCards />
      <StatsRow />
      <ReviewsSection />
      <TrialCtaSection />
      <PricingSection />
      <FaqSection />
    </LanguageProvider>
  )
}
