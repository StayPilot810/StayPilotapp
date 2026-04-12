import type { Locale } from './navbar'

export type StatsRowCopy = {
  stat1Value: string
  stat1Label: string
  stat2Value: string
  stat2Label: string
  stat3Value: string
  stat3Label: string
  statsSectionTitleBefore: string
  statsSectionTitleAccent: string
  statsSectionSubtitle: string
}

export const statsRowTranslations: Record<Locale, StatsRowCopy> = {
  fr: {
    stat1Value: '+30%',
    stat1Label: 'de temps gagné',
    stat2Value: '-50%',
    stat2Label: 'de tâches manuelles',
    stat3Value: '+100%',
    stat3Label: 'de visibilité sur vos opérations',
    statsSectionTitleBefore: 'Une vue complète de votre activité',
    statsSectionTitleAccent: 'en temps réel',
    statsSectionSubtitle:
      'Visualisez vos performances et prenez les bonnes décisions',
  },
  es: {
    stat1Value: '+30%',
    stat1Label: 'de tiempo ahorrado',
    stat2Value: '-50%',
    stat2Label: 'de tareas manuales',
    stat3Value: '+100%',
    stat3Label: 'de visibilidad sobre sus operaciones',
    statsSectionTitleBefore: 'Una visión completa de su actividad',
    statsSectionTitleAccent: 'en tiempo real',
    statsSectionSubtitle:
      'Visualice su rendimiento y tome las decisiones adecuadas',
  },
  en: {
    stat1Value: '+30%',
    stat1Label: 'time saved',
    stat2Value: '-50%',
    stat2Label: 'manual tasks',
    stat3Value: '+100%',
    stat3Label: 'visibility on your operations',
    statsSectionTitleBefore: 'A complete view of your activity',
    statsSectionTitleAccent: 'in real time',
    statsSectionSubtitle:
      'See how you perform and make the right decisions',
  },
  de: {
    stat1Value: '+30%',
    stat1Label: 'Zeitersparnis',
    stat2Value: '-50%',
    stat2Label: 'manuelle Aufgaben',
    stat3Value: '+100%',
    stat3Label: 'Transparenz Ihrer Abläufe',
    statsSectionTitleBefore: 'Ein vollständiger Überblick über Ihre Aktivität',
    statsSectionTitleAccent: 'in Echtzeit',
    statsSectionSubtitle:
      'Sehen Sie Ihre Leistung und treffen Sie die richtigen Entscheidungen',
  },
  it: {
    stat1Value: '+30%',
    stat1Label: 'di tempo risparmiato',
    stat2Value: '-50%',
    stat2Label: 'di attività manuali',
    stat3Value: '+100%',
    stat3Label: 'di visibilità sulle operazioni',
    statsSectionTitleBefore: "Una visione completa dell'attività",
    statsSectionTitleAccent: 'in tempo reale',
    statsSectionSubtitle:
      'Visualizza le performance e prendi le decisioni giuste',
  },
}
