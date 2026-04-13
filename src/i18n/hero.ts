import type { Locale } from './navbar'
import { HERO_PRIMARY_CTA_FR } from './frHeroCta'

export type HeroCopy = {
  /** Laisser vide pour masquer le surtitre */
  heroEyebrow: string
  headlineLine1: string
  /** Deuxième ligne du titre (couleur d’accent) */
  headlineAccent: string
  subheadline: string
  ctaStart: string
  ctaDemo: string
  /** Sous le bouton principal uniquement */
  ctaMicroTrust: string
  /** Une ligne avec les ✔ (sous les deux boutons) */
  heroTrustBullets: string
  platforms: string
  revenueTitle: string
  revenueTrend: string
  occupancyTitle: string
  occupancyTrend: string
  heroBubble1: string
  heroBubble2: string
  heroBubble3: string
  monthShort: readonly string[]
  tooltipMonth: string
  tooltipRevenue: string
  tooltipOccupancy: string
  localSignalsTitle: string
  targetApartmentLabel: string
  gpsLabel: string
  eventsSummaryTitle: string
  eventsSummarySubtitle: string
  premiumSignalsLine: string
  chipCity: string
  chipEvents: string
  chipRevenue: string
  estimatedRevenueHeadline: string
  strongOpportunityBadge: string
  applyOptimizationsCta: string
  closeDropdownCta: string
  localEvents: ReadonlyArray<{
    title: string
    action: string
    estimatedImpact: string
    strongOpportunity?: boolean
  }>
}

export const heroTranslations: Record<Locale, HeroCopy> = {
  fr: {
    heroEyebrow: '',
    headlineLine1: 'Gérez vos locations courte durée',
    headlineAccent: 'sans effort',
    subheadline:
      'Automatisez vos check-in, centralisez vos réservations et gagnez du temps chaque jour.',
    ctaStart: HERO_PRIMARY_CTA_FR,
    ctaDemo: 'Voir la démo',
    ctaMicroTrust: 'Aucune carte débitée pendant l’essai • Annulation en 1 clic',
    heroTrustBullets:
      '✔ Sans engagement  •  ✔ Configuration en 2 minutes  •  ✔ +500 propriétaires utilisent déjà StayManager',
    platforms: 'Connecté à Airbnb, Booking.com et les principaux canaux',
    revenueTitle: 'Synthèse d’activité (mois)',
    revenueTrend: '+12 % vs mois dernier',
    occupancyTitle: "Taux d'occupation",
    occupancyTrend: '+6% vs mois dernier',
    heroBubble1: '✔ Ménage planifié',
    heroBubble2: '✔ Réservation confirmée',
    heroBubble3: '✔ Tâche terminée',
    monthShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    tooltipMonth: 'Mois',
    tooltipRevenue: 'Volume',
    tooltipOccupancy: 'Taux',
    localSignalsTitle: 'Veille informationnelle - Calendrier local juillet 2026',
    targetApartmentLabel: 'Adresse : 10 Rue de Rivoli, 75001 Paris',
    gpsLabel: 'GPS : 48.8566, 2.3522',
    eventsSummaryTitle: 'Evenements autour du logement (juillet, rayon 12 km)',
    eventsSummarySubtitle: 'Base logement : 48.8566, 2.3522 (Paris centre)',
    premiumSignalsLine: 'Notre IA analyse les evenements locaux pour optimiser vos prix automatiquement.',
    chipCity: 'Paris',
    chipEvents: 'Evenements',
    chipRevenue: 'Revenus',
    estimatedRevenueHeadline: '💰 +420€ de revenus estimes en juillet',
    strongOpportunityBadge: '🔥 Opportunite forte',
    applyOptimizationsCta: 'Appliquer automatiquement ces optimisations',
    closeDropdownCta: "Fermer l'onglet deroulant",
    localEvents: [
      {
        title: 'Paris Plages - 1.0 a 4.8 km',
        action: 'Recommandation : +9% tarif',
        estimatedImpact: '+70€ estimes',
      },
      {
        title: 'Fete nationale (13-14 juillet) - 4.1 km',
        action: 'Recommandation : +18% tarif',
        estimatedImpact: '+120€ estimes',
        strongOpportunity: true,
      },
      {
        title: 'Finale Tour de France - 3.4 km',
        action: 'Recommandation : +15% tarif',
        estimatedImpact: '+95€ estimes',
        strongOpportunity: true,
      },
      {
        title: "Festival Paris l'Ete - 0.8 a 3.0 km",
        action: 'Recommandation : +10% tarif',
        estimatedImpact: '+65€ estimes',
      },
      {
        title: 'Cinema en plein air La Villette - 5.3 km',
        action: 'Recommandation : +8% tarif',
        estimatedImpact: '+45€ estimes',
      },
      {
        title: "Grandes expositions d'ete - 1.5 a 3.2 km",
        action: 'Recommandation : +7% tarif',
        estimatedImpact: '+25€ estimes',
      },
    ],
  },
  es: {
    heroEyebrow: '',
    headlineLine1: 'Deje de perder horas gestionando su alquiler vacacional',
    headlineAccent: 'Automatice todo en unos clics',
    subheadline:
      'Sincronice Airbnb y Booking, coordine limpiezas, tareas y reservas desde una sola interfaz clara y eficaz.',
    ctaStart: 'Automatizar todo en unos clics',
    ctaDemo: 'Ver la demo',
    ctaMicroTrust: 'Sin cargo a la tarjeta en la prueba • Baja en 1 clic',
    heroTrustBullets:
      '✔ Sin compromiso  •  ✔ Configuración en 2 minutos  •  ✔ +500 anfitriones ya usan StayManager',
    platforms: 'Conectado a Airbnb, Booking.com y los principales canales',
    revenueTitle: 'Resumen de actividad (mes)',
    revenueTrend: '+12 % vs mes anterior',
    occupancyTitle: 'Tasa de reservas',
    occupancyTrend: '+6 pts vs mes anterior',
    heroBubble1: '✔ Limpieza programada',
    heroBubble2: '✔ Reserva confirmada',
    heroBubble3: '✔ Tarea completada',
    monthShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    tooltipMonth: 'Mes',
    tooltipRevenue: 'Volumen',
    tooltipOccupancy: 'Tasa',
    localSignalsTitle: 'Monitoreo local - Calendario de julio 2026',
    targetApartmentLabel: 'Direccion: 10 Rue de Rivoli, 75001 Paris',
    gpsLabel: 'GPS: 48.8566, 2.3522',
    eventsSummaryTitle: 'Eventos alrededor del alojamiento (julio, radio 12 km)',
    eventsSummarySubtitle: 'Base del alojamiento: 48.8566, 2.3522 (centro de Paris)',
    premiumSignalsLine: 'Nuestra IA analiza los eventos locales para optimizar tus precios automaticamente.',
    chipCity: 'Paris',
    chipEvents: 'Eventos',
    chipRevenue: 'Ingresos',
    estimatedRevenueHeadline: '💰 +420€ de ingresos estimados en julio',
    strongOpportunityBadge: '🔥 Oportunidad fuerte',
    applyOptimizationsCta: 'Aplicar automaticamente estas optimizaciones',
    closeDropdownCta: 'Cerrar el desplegable',
    localEvents: [
      {
        title: 'Paris Plages - 1.0 a 4.8 km',
        action: 'Aumenta tu precio un +9%',
        estimatedImpact: '+70€ estimados',
      },
      {
        title: 'Fiesta nacional (13-14 julio) - 4.1 km',
        action: 'Aumenta tu precio un +18%',
        estimatedImpact: '+120€ estimados',
        strongOpportunity: true,
      },
      {
        title: 'Final del Tour de France - 3.4 km',
        action: 'Aumenta tu precio un +15%',
        estimatedImpact: '+95€ estimados',
        strongOpportunity: true,
      },
      {
        title: "Festival Paris l'Ete - 0.8 a 3.0 km",
        action: 'Aumenta tu precio un +10%',
        estimatedImpact: '+65€ estimados',
      },
      {
        title: 'Cine al aire libre La Villette - 5.3 km',
        action: 'Aumenta tu precio un +8%',
        estimatedImpact: '+45€ estimados',
      },
      {
        title: 'Grandes exposiciones de verano - 1.5 a 3.2 km',
        action: 'Aumenta tu precio un +7%',
        estimatedImpact: '+25€ estimados',
      },
    ],
  },
  en: {
    heroEyebrow: '',
    headlineLine1: 'Stop burning hours on short-term rental admin',
    headlineAccent: 'Automate everything in a few clicks',
    subheadline:
      'Sync Airbnb & Booking, run cleaning, tasks, and bookings from one simple, clear, effective interface.',
    ctaStart: 'Automate everything in a few clicks',
    ctaDemo: 'Watch demo',
    ctaMicroTrust: 'No card charged during trial • Cancel in 1 click',
    heroTrustBullets:
      '✔ No commitment  •  ✔ Set up in 2 minutes  •  ✔ 500+ hosts already on StayManager',
    platforms: 'Works with Airbnb, Booking.com, and major booking channels',
    revenueTitle: 'Activity overview (month)',
    revenueTrend: '+12% vs last month',
    occupancyTitle: 'Booking rate',
    occupancyTrend: '+6 pts vs last month',
    heroBubble1: '✔ Cleaning scheduled',
    heroBubble2: '✔ Booking confirmed',
    heroBubble3: '✔ Task completed',
    monthShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    tooltipMonth: 'Month',
    tooltipRevenue: 'Volume',
    tooltipOccupancy: 'Rate',
    localSignalsTitle: 'Local intelligence - July 2026 calendar',
    targetApartmentLabel: 'Address: 10 Rue de Rivoli, 75001 Paris',
    gpsLabel: 'GPS: 48.8566, 2.3522',
    eventsSummaryTitle: 'Events around the property (July, 12 km radius)',
    eventsSummarySubtitle: 'Property base: 48.8566, 2.3522 (central Paris)',
    premiumSignalsLine: 'Our AI analyzes local events to optimize your prices automatically.',
    chipCity: 'Paris',
    chipEvents: 'Events',
    chipRevenue: 'Revenue',
    estimatedRevenueHeadline: '💰 +€420 estimated revenue in July',
    strongOpportunityBadge: '🔥 High opportunity',
    applyOptimizationsCta: 'Apply these optimizations automatically',
    closeDropdownCta: 'Close dropdown',
    localEvents: [
      {
        title: 'Paris Plages - 1.0 to 4.8 km',
        action: 'Increase your price by +9%',
        estimatedImpact: '+€70 estimated',
      },
      {
        title: 'Bastille Day (July 13-14) - 4.1 km',
        action: 'Increase your price by +18%',
        estimatedImpact: '+€120 estimated',
        strongOpportunity: true,
      },
      {
        title: 'Tour de France final stage - 3.4 km',
        action: 'Increase your price by +15%',
        estimatedImpact: '+€95 estimated',
        strongOpportunity: true,
      },
      {
        title: "Festival Paris l'Ete - 0.8 to 3.0 km",
        action: 'Increase your price by +10%',
        estimatedImpact: '+€65 estimated',
      },
      {
        title: 'La Villette open-air cinema - 5.3 km',
        action: 'Increase your price by +8%',
        estimatedImpact: '+€45 estimated',
      },
      {
        title: 'Major summer exhibitions - 1.5 to 3.2 km',
        action: 'Increase your price by +7%',
        estimatedImpact: '+€25 estimated',
      },
    ],
  },
  de: {
    heroEyebrow: '',
    headlineLine1: 'Hören Sie auf, Stunden mit Kurzzeitmiete zu verlieren',
    headlineAccent: 'Automatisieren Sie alles in wenigen Klicks',
    subheadline:
      'Airbnb & Booking synchronisieren, Reinigung, Aufgaben und Buchungen in einer klaren, effizienten Oberfläche steuern.',
    ctaStart: 'Alles in wenigen Klicks automatisieren',
    ctaDemo: 'Demo ansehen',
    ctaMicroTrust: 'Keine Kartenbelastung in der Testphase • Kündigung mit 1 Klick',
    heroTrustBullets:
      '✔ Keine Bindung  •  ✔ Einrichtung in 2 Minuten  •  ✔ Bereits 500+ Gastgeber nutzen StayManager',
    platforms: 'Anbindung an Airbnb, Booking.com und große Buchungskanäle',
    revenueTitle: 'Aktivitätsüberblick (Monat)',
    revenueTrend: '+12 % zum Vormonat',
    occupancyTitle: 'Buchungsrate',
    occupancyTrend: '+6 PP zum Vormonat',
    heroBubble1: '✔ Reinigung geplant',
    heroBubble2: '✔ Buchung bestätigt',
    heroBubble3: '✔ Aufgabe erledigt',
    monthShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    tooltipMonth: 'Monat',
    tooltipRevenue: 'Volumen',
    tooltipOccupancy: 'Rate',
    localSignalsTitle: 'Lokales Monitoring - Kalender Juli 2026',
    targetApartmentLabel: 'Adresse: 10 Rue de Rivoli, 75001 Paris',
    gpsLabel: 'GPS: 48.8566, 2.3522',
    eventsSummaryTitle: 'Events rund um die Unterkunft (Juli, Radius 12 km)',
    eventsSummarySubtitle: 'Objektbasis: 48.8566, 2.3522 (Paris Zentrum)',
    premiumSignalsLine: 'Unsere KI analysiert lokale Events, um Ihre Preise automatisch zu optimieren.',
    chipCity: 'Paris',
    chipEvents: 'Events',
    chipRevenue: 'Umsatz',
    estimatedRevenueHeadline: '💰 +420€ geschaetzter Mehrumsatz im Juli',
    strongOpportunityBadge: '🔥 Starke Chance',
    applyOptimizationsCta: 'Diese Optimierungen automatisch anwenden',
    closeDropdownCta: 'Dropdown schliessen',
    localEvents: [
      {
        title: 'Paris Plages - 1.0 bis 4.8 km',
        action: 'Erhoehen Sie Ihren Preis um +9%',
        estimatedImpact: '+70€ geschaetzt',
      },
      {
        title: 'Nationalfeiertag (13.-14. Juli) - 4.1 km',
        action: 'Erhoehen Sie Ihren Preis um +18%',
        estimatedImpact: '+120€ geschaetzt',
        strongOpportunity: true,
      },
      {
        title: 'Tour-de-France-Finale - 3.4 km',
        action: 'Erhoehen Sie Ihren Preis um +15%',
        estimatedImpact: '+95€ geschaetzt',
        strongOpportunity: true,
      },
      {
        title: "Festival Paris l'Ete - 0.8 bis 3.0 km",
        action: 'Erhoehen Sie Ihren Preis um +10%',
        estimatedImpact: '+65€ geschaetzt',
      },
      {
        title: 'Open-Air-Kino La Villette - 5.3 km',
        action: 'Erhoehen Sie Ihren Preis um +8%',
        estimatedImpact: '+45€ geschaetzt',
      },
      {
        title: 'Grosse Sommerausstellungen - 1.5 bis 3.2 km',
        action: 'Erhoehen Sie Ihren Preis um +7%',
        estimatedImpact: '+25€ geschaetzt',
      },
    ],
  },
  it: {
    heroEyebrow: '',
    headlineLine1: 'Smettete di perdere ore nella gestione degli affitti brevi',
    headlineAccent: 'Automatizzate tutto in pochi clic',
    subheadline:
      'Sincronizzate Airbnb e Booking, gestite pulizie, attività e prenotazioni da un’unica interfaccia chiara ed efficace.',
    ctaStart: 'Automatizza tutto in pochi clic',
    ctaDemo: 'Vedi la demo',
    ctaMicroTrust: 'Nessun addebito sulla carta in prova • Disdetta in 1 clic',
    heroTrustBullets:
      '✔ Nessun vincolo  •  ✔ Configurazione in 2 minuti  •  ✔ Oltre 500 host usano già StayManager',
    platforms: 'Collegato ad Airbnb, Booking.com e ai principali canali',
    revenueTitle: 'Panoramica attività (mese)',
    revenueTrend: '+12 % vs mese scorso',
    occupancyTitle: 'Tasso di prenotazione',
    occupancyTrend: '+6 pt vs mese scorso',
    heroBubble1: '✔ Pulizie pianificate',
    heroBubble2: '✔ Prenotazione confermata',
    heroBubble3: '✔ Attività completata',
    monthShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    tooltipMonth: 'Mese',
    tooltipRevenue: 'Volume',
    tooltipOccupancy: 'Tasso',
    localSignalsTitle: 'Monitoraggio locale - Calendario luglio 2026',
    targetApartmentLabel: 'Indirizzo: 10 Rue de Rivoli, 75001 Paris',
    gpsLabel: 'GPS: 48.8566, 2.3522',
    eventsSummaryTitle: "Eventi intorno all'alloggio (luglio, raggio 12 km)",
    eventsSummarySubtitle: "Base alloggio: 48.8566, 2.3522 (centro di Parigi)",
    premiumSignalsLine: 'La nostra IA analizza gli eventi locali per ottimizzare automaticamente i tuoi prezzi.',
    chipCity: 'Parigi',
    chipEvents: 'Eventi',
    chipRevenue: 'Ricavi',
    estimatedRevenueHeadline: '💰 +420€ di ricavi stimati a luglio',
    strongOpportunityBadge: '🔥 Opportunita alta',
    applyOptimizationsCta: 'Applica automaticamente queste ottimizzazioni',
    closeDropdownCta: 'Chiudi il menu a discesa',
    localEvents: [
      {
        title: 'Paris Plages - 1.0 a 4.8 km',
        action: 'Aumenta il tuo prezzo del +9%',
        estimatedImpact: '+70€ stimati',
      },
      {
        title: 'Festa nazionale (13-14 luglio) - 4.1 km',
        action: 'Aumenta il tuo prezzo del +18%',
        estimatedImpact: '+120€ stimati',
        strongOpportunity: true,
      },
      {
        title: 'Finale Tour de France - 3.4 km',
        action: 'Aumenta il tuo prezzo del +15%',
        estimatedImpact: '+95€ stimati',
        strongOpportunity: true,
      },
      {
        title: "Festival Paris l'Ete - 0.8 a 3.0 km",
        action: 'Aumenta il tuo prezzo del +10%',
        estimatedImpact: '+65€ stimati',
      },
      {
        title: "Cinema all'aperto La Villette - 5.3 km",
        action: 'Aumenta il tuo prezzo del +8%',
        estimatedImpact: '+45€ stimati',
      },
      {
        title: 'Grandi mostre estive - 1.5 a 3.2 km',
        action: 'Aumenta il tuo prezzo del +7%',
        estimatedImpact: '+25€ stimati',
      },
    ],
  },
}
