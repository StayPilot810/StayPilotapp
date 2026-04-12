import type { Locale } from './navbar'

export type TrialPricingCopy = {
  ctaTitle: string
  ctaSubtitle: string
  ctaButton: string
  ctaFinePrint: string
  pricingTitle: string
  pricingSubtitle: string
}

export const trialAndPricingTranslations: Record<Locale, TrialPricingCopy> = {
  fr: {
    ctaTitle: 'Prêt à automatiser et à mieux monétiser vos nuits ?',
    ctaSubtitle:
      'Les équipes qui gagnent sur la location courte durée centralisent calendrier, ménage et indicateurs — sans vivre dans les tableurs.',
    ctaButton: 'Lancer mon essai gratuit — 14 jours',
    ctaFinePrint: 'Aucun prélèvement avant la fin de l’essai • Résiliation en un clic',
    pricingTitle: 'Des tarifs alignés sur votre volume',
    pricingSubtitle: 'Choisissez le plan qui correspond à votre parc — facturation claire, sans frais cachés.',
  },
  es: {
    ctaTitle: '¿Listo para automatizar y monetizar mejor cada noche?',
    ctaSubtitle:
      'Los equipos que ganan en alquiler turístico unifican calendario, limpieza y KPIs — sin vivir en la hoja de cálculo.',
    ctaButton: 'Empezar prueba gratis — 14 días',
    ctaFinePrint: 'Sin cargo hasta el final de la prueba • Baja en un clic',
    pricingTitle: 'Precios acordes a su volumen',
    pricingSubtitle: 'Elija el plan según su parque — precio claro, sin letra pequeña.',
  },
  en: {
    ctaTitle: 'Ready to automate and earn more per night?',
    ctaSubtitle:
      'Top operators unify calendar, cleaning, and KPIs in one stack—instead of living in spreadsheets.',
    ctaButton: 'Start free trial — 14 days',
    ctaFinePrint: 'No charge until the trial ends • Cancel in one click',
    pricingTitle: 'Pricing that scales with your portfolio',
    pricingSubtitle: 'Pick the plan that matches your unit count—straightforward billing, no hidden fees.',
  },
  de: {
    ctaTitle: 'Bereit zu automatisieren und pro Nacht mehr zu verdienen?',
    ctaSubtitle:
      'Führende Teams bündeln Kalender, Reinigung und KPIs in einem System—statt im Tabellenchaos zu arbeiten.',
    ctaButton: 'Gratis testen — 14 Tage',
    ctaFinePrint: 'Keine Abbuchung bis zum Testende • Kündigung mit einem Klick',
    pricingTitle: 'Preise, die mit Ihrem Bestand wachsen',
    pricingSubtitle: 'Wählen Sie das Paket nach Objektzahl—transparent, ohne versteckte Kosten.',
  },
  it: {
    ctaTitle: 'Pronti ad automatizzare e monetizzare meglio ogni notte?',
    ctaSubtitle:
      'Chi vince sugli affitti brevi unifica calendario, pulizie e KPI in un unico posto — non nei fogli di calcolo.',
    ctaButton: 'Prova gratuita — 14 giorni',
    ctaFinePrint: 'Nessun addebito fino alla fine della prova • Disdetta in un clic',
    pricingTitle: 'Prezzi che seguono il vostro volume',
    pricingSubtitle: 'Scegliete il piano in base al parco — conti chiari, zero sorprese.',
  },
}
