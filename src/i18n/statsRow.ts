import type { Locale } from './navbar'

/** `percent` : cible signée animée en ±N%. `hoursSaved` : 0→N, affiché en −Nh (temps récupéré). */
export type StatItemFormat = 'percent' | 'hoursSaved'

export type StatsRowCopy = {
  stat1Target: number
  stat1Format: StatItemFormat
  stat2Target: number
  stat2Format: StatItemFormat
  stat3Target: number
  stat3Format: StatItemFormat
  stat4Target: number
  stat4Format: StatItemFormat
  stat5Target: number
  stat5Format: StatItemFormat
  stat1Value: string
  stat1Label: string
  stat2Value: string
  stat2Label: string
  stat3Value: string
  stat3Label: string
  stat4Value: string
  stat4Label: string
  stat5Value: string
  stat5Label: string
  statsSectionTitleBefore: string
  statsSectionTitleAccent: string
  statsSectionSubtitle: string
}

export const statsRowTranslations: Record<Locale, StatsRowCopy> = {
  fr: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'de revenu moyen par nuitée (RevPAR)',
    stat2Value: '+22%',
    stat2Label: 'sur le taux d’occupation cible',
    stat3Value: '−8h',
    stat3Label: 'd’administration économisées par semaine',
    stat4Value: '+90%',
    stat4Label: 'des tâches récurrentes en automatisation',
    stat5Value: '−45%',
    stat5Label: 'd’écarts tarifaires vs la concurrence',
    statsSectionTitleBefore: 'Des gains business',
    statsSectionTitleAccent: 'visibles rapidement',
    statsSectionSubtitle:
      'RevPAR, occupation, temps admin, automatisation et prix : les leviers qui font bouger votre marge — sans empiler les outils.',
  },
  es: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'de ingreso medio por noche (RevPAR)',
    stat2Value: '+22%',
    stat2Label: 'en ocupación sobre su objetivo',
    stat3Value: '−8h',
    stat3Label: 'de administración ahorradas por semana',
    stat4Value: '+90%',
    stat4Label: 'de tareas repetitivas automatizadas',
    stat5Value: '−45%',
    stat5Label: 'de desviación de precio frente al mercado',
    statsSectionTitleBefore: 'Resultados de negocio',
    statsSectionTitleAccent: 'que se notan pronto',
    statsSectionSubtitle:
      'RevPAR, ocupación, tiempo admin, automatización y tarifas: palancas que mueven su margen—sin acumular software.',
  },
  en: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'higher ADR / RevPAR',
    stat2Value: '+22%',
    stat2Label: 'lift on target occupancy',
    stat3Value: '−8h',
    stat3Label: 'admin time saved every week',
    stat4Value: '+90%',
    stat4Label: 'of recurring tasks on autopilot',
    stat5Value: '−45%',
    stat5Label: 'pricing gap vs the market',
    statsSectionTitleBefore: 'Business outcomes',
    statsSectionTitleAccent: 'you can actually feel',
    statsSectionSubtitle:
      'RevPAR, occupancy, admin time, automation, and pricing—the levers that move margin without a stack of tools.',
  },
  de: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'höherer RevPAR / Nachtumsatz',
    stat2Value: '+22%',
    stat2Label: 'bei der Zielauslastung',
    stat3Value: '−8h',
    stat3Label: 'weniger Admin pro Woche',
    stat4Value: '+90%',
    stat4Label: 'wiederkehrende Aufgaben automatisiert',
    stat5Value: '−45%',
    stat5Label: 'Preisabweichung vs. Markt',
    statsSectionTitleBefore: 'Messbare Business-Erfolge',
    statsSectionTitleAccent: 'statt nur Features',
    statsSectionSubtitle:
      'RevPAR, Auslastung, Admin-Zeit, Automatisierung und Pricing—Hebel für Ihre Marge, ohne Tool-Wildwuchs.',
  },
  it: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'RevPAR / ricavo medio per notte',
    stat2Value: '+22%',
    stat2Label: 'sull’occupazione rispetto all’obiettivo',
    stat3Value: '−8h',
    stat3Label: 'di admin risparmiate a settimana',
    stat4Value: '+90%',
    stat4Label: 'attività ricorrenti in automazione',
    stat5Value: '−45%',
    stat5Label: 'scostamento prezzi vs mercato',
    statsSectionTitleBefore: 'Risultati concreti',
    statsSectionTitleAccent: 'sul vostro business',
    statsSectionSubtitle:
      'RevPAR, occupazione, tempo admin, automazione e prezzi: leve che muovono il margine—senza accumulare tool.',
  },
}
