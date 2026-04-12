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
    featuresHeading: 'Ce que nous vous apportons',
    featureCard1Title: 'Logements impeccables',
    featureCard1Subtitle: 'Gestion complète des prestataires ménage',
    featureCard2Title: 'Propriétaires satisfaits',
    featureCard2Subtitle: 'Plus de 500 utilisateurs actifs',
    featureCard3Title: 'Gestion professionnelle',
    featureCard3Subtitle: '2 000+ logements gérés',
  },
  es: {
    featuresHeading: 'Lo que ofrecemos',
    featureCard1Title: 'Alojamientos impecables',
    featureCard1Subtitle: 'Gestión integral de proveedores de limpieza',
    featureCard2Title: 'Propietarios satisfechos',
    featureCard2Subtitle: 'Más de 500 usuarios activos',
    featureCard3Title: 'Gestión profesional',
    featureCard3Subtitle: 'Más de 2 000 alojamientos gestionados',
  },
  en: {
    featuresHeading: 'What we deliver',
    featureCard1Title: 'Spotless properties',
    featureCard1Subtitle: 'Full management of cleaning providers',
    featureCard2Title: 'Happy owners',
    featureCard2Subtitle: 'Over 500 active users',
    featureCard3Title: 'Professional management',
    featureCard3Subtitle: '2,000+ properties managed',
  },
  de: {
    featuresHeading: 'Was Sie gewinnen',
    featureCard1Title: 'Tadelllose Unterkünfte',
    featureCard1Subtitle: 'Komplette Verwaltung der Reinigungsdienste',
    featureCard2Title: 'Zufriedene Eigentümer',
    featureCard2Subtitle: 'Über 500 aktive Nutzer',
    featureCard3Title: 'Professionelles Management',
    featureCard3Subtitle: 'Über 2 000 verwaltete Unterkünfte',
  },
  it: {
    featuresHeading: 'Cosa offriamo',
    featureCard1Title: 'Alloggi impeccabili',
    featureCard1Subtitle: 'Gestione completa dei fornitori di pulizie',
    featureCard2Title: 'Proprietari soddisfatti',
    featureCard2Subtitle: 'Oltre 500 utenti attivi',
    featureCard3Title: 'Gestione professionale',
    featureCard3Subtitle: 'Oltre 2 000 alloggi gestiti',
  },
}

export const FEATURE_CARD_IMAGES = [
  '/features/card-living.jpg',
  '/features/card-host.jpg',
  '/features/card-interior.jpg',
] as const
