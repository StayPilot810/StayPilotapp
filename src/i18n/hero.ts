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
    headlineLine1: 'Automatisez vos locations.',
    headlineAccent: 'Augmentez vos revenus.',
    subheadline:
      'Centralisez réservations et opérations, réduisez la charge manuelle et vendez plus de nuits — avec une vision claire sur votre CA et votre occupation.',
    ctaStart: 'Démarrer gratuitement',
    ctaDemo: 'Voir la démo',
    platforms: 'Connecté à Airbnb, Booking.com et les grands canaux de réservation',
    revenueTitle: 'Revenus mensuels',
    revenueTrend: '+8 % vs mois dernier',
    occupancyTitle: "Taux d'occupation",
    occupancyTrend: '+4 % vs mois dernier',
    monthShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    tooltipMonth: 'Mois',
    tooltipRevenue: 'Revenus',
    tooltipOccupancy: "Taux d'occupation",
  },
  es: {
    headlineLine1: 'Automatice sus alquileres.',
    headlineAccent: 'Haga crecer los ingresos.',
    subheadline:
      'Unifique reservas y operaciones, reduzca el trabajo manual y venda más noches — con visibilidad clara de ingresos y ocupación.',
    ctaStart: 'Empezar gratis',
    ctaDemo: 'Ver la demo',
    platforms: 'Conectado a Airbnb, Booking.com y los principales canales',
    revenueTitle: 'Ingresos mensuales',
    revenueTrend: '+8 % vs mes anterior',
    occupancyTitle: 'Tasa de ocupación',
    occupancyTrend: '+4 % vs mes anterior',
    monthShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    tooltipMonth: 'Mes',
    tooltipRevenue: 'Ingresos',
    tooltipOccupancy: 'Ocupación',
  },
  en: {
    headlineLine1: 'Automate your rentals.',
    headlineAccent: 'Grow revenue.',
    subheadline:
      'Unify bookings and operations, cut manual work, and sell more nights—with clear visibility on revenue and occupancy.',
    ctaStart: 'Start free',
    ctaDemo: 'Watch demo',
    platforms: 'Works with Airbnb, Booking.com, and major booking channels',
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
    headlineLine1: 'Automatisieren Sie Ihre Vermietung.',
    headlineAccent: 'Steigern Sie den Umsatz.',
    subheadline:
      'Buchungen und Abläufe an einem Ort, weniger manuelle Arbeit, mehr verkaufte Nächte — mit klarem Blick auf Einnahmen und Auslastung.',
    ctaStart: 'Kostenlos starten',
    ctaDemo: 'Demo ansehen',
    platforms: 'Anbindung an Airbnb, Booking.com und große Buchungskanäle',
    revenueTitle: 'Monatliche Einnahmen',
    revenueTrend: '+8 % zum Vormonat',
    occupancyTitle: 'Auslastung',
    occupancyTrend: '+4 % zum Vormonat',
    monthShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    tooltipMonth: 'Monat',
    tooltipRevenue: 'Einnahmen',
    tooltipOccupancy: 'Auslastung',
  },
  it: {
    headlineLine1: 'Automatizzate gli affitti.',
    headlineAccent: 'Aumentate i ricavi.',
    subheadline:
      'Unite prenotazioni e operazioni, riducete il lavoro manuale e vendete più notti — con chiarezza su fatturato e occupazione.',
    ctaStart: 'Inizia gratis',
    ctaDemo: 'Vedi la demo',
    platforms: 'Collegato ad Airbnb, Booking.com e ai principali canali',
    revenueTitle: 'Ricavi mensili',
    revenueTrend: '+8 % vs mese scorso',
    occupancyTitle: 'Tasso di occupazione',
    occupancyTrend: '+4 % vs mese scorso',
    monthShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    tooltipMonth: 'Mese',
    tooltipRevenue: 'Ricavi',
    tooltipOccupancy: 'Occupazione',
  },
}
