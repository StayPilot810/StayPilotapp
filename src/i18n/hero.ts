import type { Locale } from './navbar'

export type HeroCopy = {
  headlineLine1: string
  headlineAccent: string
  subheadline: string
  ctaStart: string
  ctaDemo: string
  platforms: string
  revenueTitle: string
  revenueTrend: string
  occupancyTitle: string
  occupancyTrend: string
  /** 12 abréviations de mois pour les axes des graphiques */
  monthShort: readonly string[]
  tooltipMonth: string
  tooltipRevenue: string
  tooltipOccupancy: string
}

export const heroTranslations: Record<Locale, HeroCopy> = {
  fr: {
    headlineLine1: 'Gérez vos locations courte durée',
    headlineAccent: 'sans effort',
    subheadline:
      'Automatisez vos check-in, centralisez vos réservations et gagnez du temps chaque jour',
    ctaStart: 'Commencer gratuitement',
    ctaDemo: 'Voir la démo',
    platforms: 'Compatible avec les principales plateformes de réservation',
    revenueTitle: 'Revenus mensuels',
    revenueTrend: '+8% vs mois dernier',
    occupancyTitle: "Taux d'occupation",
    occupancyTrend: '+4% vs mois dernier',
    monthShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    tooltipMonth: 'Mois',
    tooltipRevenue: 'Revenus',
    tooltipOccupancy: "taux d'occupation",
  },
  es: {
    headlineLine1: 'Gestiona tus alquileres de corta estancia',
    headlineAccent: 'sin esfuerzo',
    subheadline:
      'Automatiza los check-in, centraliza las reservas y ahorra tiempo cada día',
    ctaStart: 'Empezar gratis',
    ctaDemo: 'Ver la demo',
    platforms: 'Compatible con las principales plataformas de reserva',
    revenueTitle: 'Ingresos mensuales',
    revenueTrend: '+8% vs mes anterior',
    occupancyTitle: 'Tasa de ocupación',
    occupancyTrend: '+4% vs mes anterior',
    monthShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    tooltipMonth: 'Mes',
    tooltipRevenue: 'Ingresos',
    tooltipOccupancy: 'Ocupación',
  },
  en: {
    headlineLine1: 'Run your short-term rentals',
    headlineAccent: 'effortlessly',
    subheadline: 'Automate check-ins, centralize bookings, and save time every day',
    ctaStart: 'Start for free',
    ctaDemo: 'Watch demo',
    platforms: 'Works with major booking platforms',
    revenueTitle: 'Monthly revenue',
    revenueTrend: '+8% vs last month',
    occupancyTitle: 'Occupancy rate',
    occupancyTrend: '+4% vs last month',
    monthShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    tooltipMonth: 'Month',
    tooltipRevenue: 'Revenue',
    tooltipOccupancy: 'Occupancy',
  },
  de: {
    headlineLine1: 'Verwalten Sie Ihre Kurzzeitmieten',
    headlineAccent: 'mühelos',
    subheadline:
      'Automatisieren Sie Check-ins, bündeln Sie Buchungen und sparen Sie täglich Zeit',
    ctaStart: 'Kostenlos starten',
    ctaDemo: 'Demo ansehen',
    platforms: 'Kompatibel mit den wichtigsten Buchungsplattformen',
    revenueTitle: 'Monatliche Einnahmen',
    revenueTrend: '+8% zum Vormonat',
    occupancyTitle: 'Auslastung',
    occupancyTrend: '+4% zum Vormonat',
    monthShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    tooltipMonth: 'Monat',
    tooltipRevenue: 'Einnahmen',
    tooltipOccupancy: 'Auslastung',
  },
  it: {
    headlineLine1: 'Gestisci gli affitti brevi',
    headlineAccent: 'senza sforzo',
    subheadline:
      'Automatizza i check-in, centralizza le prenotazioni e risparmia tempo ogni giorno',
    ctaStart: 'Inizia gratis',
    ctaDemo: 'Vedi la demo',
    platforms: 'Compatibile con le principali piattaforme di prenotazione',
    revenueTitle: 'Ricavi mensili',
    revenueTrend: '+8% vs mese scorso',
    occupancyTitle: 'Tasso di occupazione',
    occupancyTrend: '+4% vs mese scorso',
    monthShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    tooltipMonth: 'Mese',
    tooltipRevenue: 'Ricavi',
    tooltipOccupancy: 'Occupazione',
  },
}
