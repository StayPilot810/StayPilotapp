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
    ctaTitle: "Passez à une gestion automatisée dès aujourd'hui",
    ctaSubtitle:
      'Rejoignez StayManager et transformez votre activité de location courte durée.',
    ctaButton: "Commencer l'essai gratuit (14 jours)",
    ctaFinePrint: 'Aucun prélèvement avant la fin de l’essai • Annulation en 1 clic',
    pricingTitle: 'Tarifs simples et transparents',
    pricingSubtitle: 'Choisissez l’offre qui correspond à vos besoins.',
  },
  es: {
    ctaTitle: 'Pase a una gestión automatizada hoy mismo',
    ctaSubtitle:
      'Únase a StayManager y transforme su actividad de alquiler de corta duración.',
    ctaButton: 'Empezar la prueba gratuita (14 días)',
    ctaFinePrint: 'Sin cargo hasta el final de la prueba • Cancelación en 1 clic',
    pricingTitle: 'Precios simples y transparentes',
    pricingSubtitle: 'Elija el plan que se adapta a sus necesidades.',
  },
  en: {
    ctaTitle: 'Move to automated management today',
    ctaSubtitle: 'Join StayManager and transform your short-term rental business.',
    ctaButton: 'Start your free trial (14 days)',
    ctaFinePrint: 'No charge until the trial ends • Cancel in one click',
    pricingTitle: 'Simple, transparent pricing',
    pricingSubtitle: 'Choose the plan that fits your needs.',
  },
  de: {
    ctaTitle: 'Wechseln Sie noch heute zur automatisierten Verwaltung',
    ctaSubtitle:
      'Werden Sie Teil von StayManager und modernisieren Sie Ihre Kurzzeitvermietung.',
    ctaButton: 'Kostenlose Testphase starten (14 Tage)',
    ctaFinePrint: 'Keine Abbuchung bis zum Testende • Kündigung mit einem Klick',
    pricingTitle: 'Einfache, transparente Preise',
    pricingSubtitle: 'Wählen Sie das Paket, das zu Ihren Anforderungen passt.',
  },
  it: {
    ctaTitle: 'Passa subito a una gestione automatizzata',
    ctaSubtitle:
      'Unisciti a StayManager e trasforma la tua attività di affitti brevi.',
    ctaButton: 'Inizia la prova gratuita (14 giorni)',
    ctaFinePrint: 'Nessun addebito fino alla fine della prova • Annulla in 1 clic',
    pricingTitle: 'Prezzi semplici e trasparenti',
    pricingSubtitle: 'Scegli l’offerta adatta alle tue esigenze.',
  },
}
