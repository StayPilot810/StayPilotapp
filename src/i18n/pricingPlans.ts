import type { Locale } from './navbar'

export type PricingPlansCopy = {
  popularBadge: string
  planTrial: string
  planCta: string
  starterName: string
  starterRange: string
  starterPrice: string
  starterPriceSuffix: string
  starterFeatures: string[]
  proName: string
  proRange: string
  proPrice: string
  proPriceSuffix: string
  proFeatures: string[]
  scaleName: string
  scaleRange: string
  scalePrice: string
  scalePriceSuffix: string
  scaleFeatures: string[]
}

const fr: PricingPlansCopy = {
  popularBadge: 'Le plus populaire',
  planTrial: '14 jours gratuits',
  planCta: 'Commencer',
  starterName: 'Starter',
  starterRange: '1 à 3 logements',
  starterPrice: '8€',
  starterPriceSuffix: '/ logement / mois',
  starterFeatures: [
    'Calendrier synchronisé',
    'Analyse des performances (statistiques)',
    'Support par email',
  ],
  proName: 'Pro',
  proRange: '3 à 10 logements',
  proPrice: '59€',
  proPriceSuffix: '/ mois',
  proFeatures: [
    'Toutes les fonctionnalités Starter',
    'Automatisations avancées',
    'Outil intelligent de gestion des prix (vacances scolaires, événements sportifs, concerts, jours fériés, etc.)',
    'Fil de discussion avec la prestataire ménage',
    'Support prioritaire par email',
    'Rapports détaillés',
    "To-do list d'achat (gestion des consommables)",
    'Liste des tâches à faire dans chaque appartement',
    'Gestion complète des opérations ménage (notes, photos, horaires)',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 logements',
  scalePrice: '99€',
  scalePriceSuffix: '/ mois',
  scaleFeatures: [
    'Toutes les fonctionnalités Pro',
    'Gestion multi-logements avancée',
    'Outils avancés de performance et rentabilité',
    'Support prioritaire dédié via WhatsApp (message uniquement)',
    'Accès anticipé aux nouvelles fonctionnalités',
  ],
}

const en: PricingPlansCopy = {
  popularBadge: 'Most popular',
  planTrial: '14-day free trial',
  planCta: 'Get started',
  starterName: 'Starter',
  starterRange: '1–3 units',
  starterPrice: '€8',
  starterPriceSuffix: '/ unit / month',
  starterFeatures: [
    'Synced calendar',
    'Performance analytics (stats)',
    'Email support',
  ],
  proName: 'Pro',
  proRange: '3–10 units',
  proPrice: '€59',
  proPriceSuffix: '/ month',
  proFeatures: [
    'Everything in Starter',
    'Advanced automations',
    'Smart pricing tool (school holidays, sports events, concerts, public holidays, etc.)',
    'Chat thread with your cleaning provider',
    'Priority email support',
    'Detailed reports',
    'Shopping to-do list (consumables)',
    'Per-apartment task lists',
    'Full cleaning ops (notes, photos, schedules)',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ units',
  scalePrice: '€99',
  scalePriceSuffix: '/ month',
  scaleFeatures: [
    'Everything in Pro',
    'Advanced multi-property management',
    'Advanced performance & profitability tools',
    'Dedicated priority support via WhatsApp (messages only)',
    'Early access to new features',
  ],
}

const es: PricingPlansCopy = {
  popularBadge: 'El más popular',
  planTrial: '14 días gratis',
  planCta: 'Empezar',
  starterName: 'Starter',
  starterRange: '1 a 3 viviendas',
  starterPrice: '8€',
  starterPriceSuffix: '/ vivienda / mes',
  starterFeatures: [
    'Calendario sincronizado',
    'Análisis de rendimiento (estadísticas)',
    'Soporte por email',
  ],
  proName: 'Pro',
  proRange: '3 a 10 viviendas',
  proPrice: '59€',
  proPriceSuffix: '/ mes',
  proFeatures: [
    'Todo lo de Starter',
    'Automatizaciones avanzadas',
    'Herramienta inteligente de precios (vacaciones, eventos, festivos, etc.)',
    'Hilo con la empresa de limpieza',
    'Soporte prioritario por email',
    'Informes detallados',
    'Lista de compras (consumibles)',
    'Tareas por apartamento',
    'Gestión completa de limpieza (notas, fotos, horarios)',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 viviendas',
  scalePrice: '99€',
  scalePriceSuffix: '/ mes',
  scaleFeatures: [
    'Todo lo de Pro',
    'Gestión multivivienda avanzada',
    'Herramientas avanzadas de rendimiento y rentabilidad',
    'Soporte prioritario por WhatsApp (solo mensajes)',
    'Acceso anticipado a novedades',
  ],
}

const de: PricingPlansCopy = {
  popularBadge: 'Am beliebtesten',
  planTrial: '14 Tage kostenlos',
  planCta: 'Loslegen',
  starterName: 'Starter',
  starterRange: '1–3 Objekte',
  starterPrice: '8€',
  starterPriceSuffix: '/ Objekt / Monat',
  starterFeatures: [
    'Synchronisierter Kalender',
    'Performance-Analysen (Statistiken)',
    'E-Mail-Support',
  ],
  proName: 'Pro',
  proRange: '3–10 Objekte',
  proPrice: '59€',
  proPriceSuffix: '/ Monat',
  proFeatures: [
    'Alles aus Starter',
    'Erweiterte Automatisierungen',
    'Intelligentes Pricing (Ferien, Events, Feiertage usw.)',
    'Chat mit Reinigungsdienst',
    'Prioritäts-E-Mail-Support',
    'Detaillierte Reports',
    'Einkaufs-To-dos (Verbrauchsmaterial)',
    'Aufgaben pro Apartment',
    'Komplettes Reinigungs-Ops (Notizen, Fotos, Zeiten)',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ Objekte',
  scalePrice: '99€',
  scalePriceSuffix: '/ Monat',
  scaleFeatures: [
    'Alles aus Pro',
    'Erweiterte Multi-Objekt-Verwaltung',
    'Erweiterte Performance- & Rentabilitätstools',
    'Prioritäts-Support via WhatsApp (nur Nachrichten)',
    'Früher Zugang zu neuen Funktionen',
  ],
}

const it: PricingPlansCopy = {
  popularBadge: 'Il più scelto',
  planTrial: '14 giorni gratis',
  planCta: 'Inizia',
  starterName: 'Starter',
  starterRange: '1–3 immobili',
  starterPrice: '8€',
  starterPriceSuffix: '/ immobile / mese',
  starterFeatures: [
    'Calendario sincronizzato',
    'Analisi delle performance (statistiche)',
    'Supporto via email',
  ],
  proName: 'Pro',
  proRange: '3–10 immobili',
  proPrice: '59€',
  proPriceSuffix: '/ mese',
  proFeatures: [
    'Tutto ciò che c’è in Starter',
    'Automazioni avanzate',
    'Strumento prezzi intelligente (vacanze, eventi, festività, ecc.)',
    'Thread con l’impresa di pulizie',
    'Supporto email prioritario',
    'Report dettagliati',
    'To-do acquisti (consumabili)',
    'Elenco attività per appartamento',
    'Gestione completa pulizie (note, foto, orari)',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 immobili',
  scalePrice: '99€',
  scalePriceSuffix: '/ mese',
  scaleFeatures: [
    'Tutto ciò che c’è in Pro',
    'Gestione multi-immobile avanzata',
    'Strumenti avanzati su performance e redditività',
    'Supporto prioritario via WhatsApp (solo messaggi)',
    'Accesso anticipato alle novità',
  ],
}

export const pricingPlansTranslations: Record<Locale, PricingPlansCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
