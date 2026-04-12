import type { Locale } from './navbar'

export type PricingPlansCopy = {
  /** Badge doré au-dessus de la carte Pro (rentabilité) */
  roiBadge: string
  /** Pastille secondaire sur le plan Pro (preuve sociale) */
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
  roiBadge: 'Le plus rentable',
  popularBadge: 'Le plus choisi',
  planTrial: '14 jours gratuits',
  planCta: 'Choisir ce plan',
  starterName: 'Starter',
  starterRange: '1 à 3 logements',
  starterPrice: '8€',
  starterPriceSuffix: '/ logement / mois',
  starterFeatures: [
    'Calendrier unifié — moins de risque de double réservation',
    'Indicateurs revenus & occupation pour ajuster vite',
    'Support email',
  ],
  proName: 'Pro',
  proRange: '3 à 10 logements',
  proPrice: '59€',
  proPriceSuffix: '/ mois',
  proFeatures: [
    'Tout Starter + automatisations qui vous font gagner des heures',
    'Pricing intelligent (vacances, événements, jours fériés)',
    'Fil direct avec vos équipes ménage (notes, photos, horaires)',
    'Support email prioritaire',
    'Rapports détaillés pour suivre la marge',
    'To-do achats consommables par logement',
    'Check-lists turnover par appartement',
    'Pilotage complet des opérations ménage',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 logements',
  scalePrice: '99€',
  scalePriceSuffix: '/ mois',
  scaleFeatures: [
    'Tout Pro',
    'Gestion multi-logements avancée pour les gros volumes',
    'Outils rentabilité & performance pour arbitrer vite',
    'Support prioritaire WhatsApp (messages)',
    'Accès anticipé aux nouveautés produit',
  ],
}

const en: PricingPlansCopy = {
  roiBadge: 'Best ROI',
  popularBadge: 'Most popular',
  planTrial: '14-day free trial',
  planCta: 'Get this plan',
  starterName: 'Starter',
  starterRange: '1–3 units',
  starterPrice: '€8',
  starterPriceSuffix: '/ unit / month',
  starterFeatures: [
    'Unified calendar—fewer gaps, fewer double-booking risks',
    'Revenue & occupancy signals to move faster',
    'Email support',
  ],
  proName: 'Pro',
  proRange: '3–10 units',
  proPrice: '€59',
  proPriceSuffix: '/ month',
  proFeatures: [
    'Everything in Starter + automations that claw back hours',
    'Smart pricing signals (holidays, events, high-demand days)',
    'Direct line to cleaners—notes, photos, schedules',
    'Priority email support',
    'Detailed reports to watch margin',
    'Consumables shopping lists per unit',
    'Turnover checklists per apartment',
    'Full cleaning-ops control',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ units',
  scalePrice: '€99',
  scalePriceSuffix: '/ month',
  scaleFeatures: [
    'Everything in Pro',
    'Advanced multi-property workflows for volume',
    'Profitability & performance tools to decide fast',
    'Priority WhatsApp support (messages)',
    'Early access to new product',
  ],
}

const es: PricingPlansCopy = {
  roiBadge: 'Más rentable',
  popularBadge: 'El favorito',
  planTrial: '14 días gratis',
  planCta: 'Elegir plan',
  starterName: 'Starter',
  starterRange: '1 a 3 viviendas',
  starterPrice: '8€',
  starterPriceSuffix: '/ vivienda / mes',
  starterFeatures: [
    'Calendario unificado — menos huecos y menos overbooking',
    'Indicadores de ingresos y ocupación para decidir rápido',
    'Soporte por email',
  ],
  proName: 'Pro',
  proRange: '3 a 10 viviendas',
  proPrice: '59€',
  proPriceSuffix: '/ mes',
  proFeatures: [
    'Todo Starter + automatizaciones que devuelven horas',
    'Señales de precios inteligentes (festivos, eventos, picos)',
    'Canal directo con limpieza: notas, fotos, horarios',
    'Soporte email prioritario',
    'Informes detallados para vigilar el margen',
    'Listas de compra de consumibles por vivienda',
    'Checklists de turnover por apartamento',
    'Control total de operaciones de limpieza',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 viviendas',
  scalePrice: '99€',
  scalePriceSuffix: '/ mes',
  scaleFeatures: [
    'Todo Pro',
    'Gestión multivivienda avanzada para alto volumen',
    'Herramientas de rentabilidad y rendimiento',
    'Soporte prioritario por WhatsApp (mensajes)',
    'Acceso anticipado a novedades',
  ],
}

const de: PricingPlansCopy = {
  roiBadge: 'Beste Rendite',
  popularBadge: 'Am beliebtesten',
  planTrial: '14 Tage kostenlos',
  planCta: 'Plan wählen',
  starterName: 'Starter',
  starterRange: '1–3 Objekte',
  starterPrice: '8€',
  starterPriceSuffix: '/ Objekt / Monat',
  starterFeatures: [
    'Ein Kalender—weniger Lücken, weniger Doppelbuchungen',
    'Umsatz- & Auslastungssignale für schnelle Entscheidungen',
    'E-Mail-Support',
  ],
  proName: 'Pro',
  proRange: '3–10 Objekte',
  proPrice: '59€',
  proPriceSuffix: '/ Monat',
  proFeatures: [
    'Alles aus Starter + Automatisierungen, die Stunden sparen',
    'Smart-Pricing-Hinweise (Ferien, Events, Hochlasttage)',
    'Direkter Kanal zur Reinigung: Notizen, Fotos, Zeiten',
    'Prioritäts-E-Mail-Support',
    'Detaillierte Reports zur Marge',
    'Einkaufslisten Verbrauchsmaterial pro Objekt',
    'Turnover-Checklisten pro Apartment',
    'Vollständige Reinigungs-Ops',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ Objekte',
  scalePrice: '99€',
  scalePriceSuffix: '/ Monat',
  scaleFeatures: [
    'Alles aus Pro',
    'Erweiterte Multi-Objekt-Prozesse für Volumen',
    'Rentabilitäts- & Performance-Tools',
    'Prioritäts-Support via WhatsApp (nur Nachrichten)',
    'Früher Zugang zu neuen Funktionen',
  ],
}

const it: PricingPlansCopy = {
  roiBadge: 'Più redditizio',
  popularBadge: 'Il preferito',
  planTrial: '14 giorni gratis',
  planCta: 'Scegli piano',
  starterName: 'Starter',
  starterRange: '1–3 immobili',
  starterPrice: '8€',
  starterPriceSuffix: '/ immobile / mese',
  starterFeatures: [
    'Calendario unificato — meno buchi, meno overbooking',
    'Indicatori ricavi e occupazione per decidere in fretta',
    'Supporto email',
  ],
  proName: 'Pro',
  proRange: '3–10 immobili',
  proPrice: '59€',
  proPriceSuffix: '/ mese',
  proFeatures: [
    'Tutto Starter + automazioni che recuperano ore',
    'Segnali pricing intelligenti (festività, eventi, picchi)',
    'Canale diretto con le pulizie: note, foto, orari',
    'Supporto email prioritario',
    'Report dettagliati sul margine',
    'Liste acquisti consumabili per alloggio',
    'Checklist turnover per appartamento',
    'Controllo completo delle ops pulizie',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 immobili',
  scalePrice: '99€',
  scalePriceSuffix: '/ mese',
  scaleFeatures: [
    'Tutto Pro',
    'Gestione multi-immobile avanzata per volumi alti',
    'Strumenti su redditività e performance',
    'Supporto prioritario WhatsApp (messaggi)',
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
