import type { Locale } from './navbar'

export type FeatureCardsCopy = {
  featuresHeading: string
  featureCard1Title: string
  featureCard1Subtitle: string
  featureCard2Title: string
  featureCard2Subtitle: string
  featureCard3Title: string
  featureCard3Subtitle: string
}

export const featureCardsTranslations: Record<Locale, FeatureCardsCopy> = {
  fr: {
    featuresHeading: 'Trois leviers pour votre rentabilité',
    featureCard1Title: 'Turnovers sans friction',
    featureCard1Subtitle: 'Ménage piloté, moins d’imprévus, des séjours qui se vendent',
    featureCard2Title: 'Une équipe qui monte en charge',
    featureCard2Subtitle: 'Des centaines de pros sur le terrain, sans perdre le contrôle',
    featureCard3Title: 'Multi-logements, même rigueur',
    featureCard3Subtitle: 'Plus de biens gérés sans exploser votre coût opérationnel',
  },
  es: {
    featuresHeading: 'Tres palancas para su rentabilidad',
    featureCard1Title: 'Turnovers sin fricción',
    featureCard1Subtitle: 'Limpieza coordinada, menos sorpresas, estancias que venden',
    featureCard2Title: 'Equipo que escala',
    featureCard2Subtitle: 'Cientos de profesionales en destino, usted manda',
    featureCard3Title: 'Multipropiedad, misma exigencia',
    featureCard3Subtitle: 'Más viviendas sin disparar su coste operativo',
  },
  en: {
    featuresHeading: 'Three levers for stronger margins',
    featureCard1Title: 'Frictionless turnovers',
    featureCard1Subtitle: 'Cleaning on rails—fewer surprises, stays that earn five-star reviews',
    featureCard2Title: 'Teams that scale with you',
    featureCard2Subtitle: 'Hundreds of pros in the field—you stay in control',
    featureCard3Title: 'More units, same standard',
    featureCard3Subtitle: 'Grow the portfolio without blowing up ops cost',
  },
  de: {
    featuresHeading: 'Drei Hebel für Ihre Marge',
    featureCard1Title: 'Reibungslose Übergaben',
    featureCard1Subtitle: 'Reinigung im Griff, weniger Überraschungen, Aufenthalte, die sich verkaufen',
    featureCard2Title: 'Teams, die mitwachsen',
    featureCard2Subtitle: 'Hunderte Profis vor Ort—Sie behalten die Kontrolle',
    featureCard3Title: 'Mehr Objekte, gleiche Qualität',
    featureCard3Subtitle: 'Portfolio wachsen lassen ohne explodierende Betriebskosten',
  },
  it: {
    featuresHeading: 'Tre leve per la redditività',
    featureCard1Title: 'Turnover senza attriti',
    featureCard1Subtitle: 'Pulizie coordinate, meno imprevisti, soggiorni che convertono',
    featureCard2Title: 'Team che scala',
    featureCard2Subtitle: 'Centinaia di professionisti sul campo, comando resta vostro',
    featureCard3Title: 'Multi-alloggio, stesso standard',
    featureCard3Subtitle: 'Più immobili senza far esplodere i costi operativi',
  },
}

export const FEATURE_CARD_IMAGES = [
  '/features/card-living.jpg',
  '/features/card-host.jpg',
  '/features/card-interior.jpg',
] as const
