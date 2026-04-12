import type { Locale } from './navbar'

export type BookingCalendarCopy = {
  calendarTitle: string
  legendAirbnb: string
  legendBooking: string
  tabThisMonth: string
  tabLastMonth: string
  tabNextMonth: string
  customDates: string
  allApartments: string
  filterPropertiesAria: string
  apartmentLabel: string
  nightsLabel: string
  footerOccupancy: string
  footerTotalBookings: string
  footerBookedNights: string
  footerAirbnb: string
  footerBooking: string
  demoUnavailableOption: string
  demoUnavailableAction: string
  modalClose: string
  popoverStatusConfirmed: string
  popoverCheckIn: string
  popoverCheckOut: string
  popoverDuration: string
  popoverFinancialTitle: string
  popoverTotalGuestPrice: string
  popoverCleaningFee: string
  popoverPlatformFee: string
  popoverNetPayout: string
  popoverGeniusBanner: string
  badgeGenius: string
  reservationNumberLabel: string
}

export const bookingCalendarTranslations: Record<Locale, BookingCalendarCopy> = {
  fr: {
    calendarTitle: 'Calendrier des réservations',
    legendAirbnb: 'Airbnb',
    legendBooking: 'Booking.com',
    tabThisMonth: 'Ce mois',
    tabLastMonth: 'Mois dernier',
    tabNextMonth: 'Mois prochain',
    customDates: 'Dates personnalisées',
    allApartments: 'Tous les appartements',
    filterPropertiesAria: 'Filtrer les biens',
    apartmentLabel: 'Appartement {n}',
    nightsLabel: '{n} nuits',
    footerOccupancy: "Taux d'occupation",
    footerTotalBookings: 'Total des réservations',
    footerBookedNights: 'Nuits réservées',
    footerAirbnb: 'Airbnb',
    footerBooking: 'Booking.com',
    demoUnavailableOption: "Cette option n'est pas disponible pour la démo.",
    demoUnavailableAction: "Cette action n'est pas disponible pour la démo.",
    modalClose: 'Fermer',
    popoverStatusConfirmed: 'Confirmé',
    popoverCheckIn: 'Arrivée',
    popoverCheckOut: 'Départ',
    popoverDuration: 'Durée :',
    popoverFinancialTitle: 'Détails financiers',
    popoverTotalGuestPrice: 'Prix total voyageur',
    popoverCleaningFee: 'Frais de ménage',
    popoverPlatformFee: 'Frais de plateforme ({pct} %)',
    popoverNetPayout: 'Versement net',
    popoverGeniusBanner: 'Voyageur Genius — commission majorée appliquée',
    badgeGenius: 'Genius',
    reservationNumberLabel: 'N° de réservation',
  },
  es: {
    calendarTitle: 'Vista del calendario de reservas',
    legendAirbnb: 'Airbnb',
    legendBooking: 'Booking.com',
    tabThisMonth: 'Este mes',
    tabLastMonth: 'Mes pasado',
    tabNextMonth: 'Próximo mes',
    customDates: 'Fechas personalizadas',
    allApartments: 'Todos los apartamentos',
    filterPropertiesAria: 'Filtrar propiedades',
    apartmentLabel: 'Apartamento {n}',
    nightsLabel: '{n} noches',
    footerOccupancy: 'Tasa de ocupación',
    footerTotalBookings: 'Total de reservas',
    footerBookedNights: 'Noches reservadas',
    footerAirbnb: 'Airbnb',
    footerBooking: 'Booking.com',
    demoUnavailableOption: 'Esta opción no está disponible en la demo.',
    demoUnavailableAction: 'Esta acción no está disponible en la demo.',
    modalClose: 'Cerrar',
    popoverStatusConfirmed: 'Confirmada',
    popoverCheckIn: 'Entrada',
    popoverCheckOut: 'Salida',
    popoverDuration: 'Estancia:',
    popoverFinancialTitle: 'Detalles financieros',
    popoverTotalGuestPrice: 'Precio total huésped',
    popoverCleaningFee: 'Tasa de limpieza',
    popoverPlatformFee: 'Comisión de plataforma ({pct} %)',
    popoverNetPayout: 'Pago neto al anfitrión',
    popoverGeniusBanner: 'Huésped Genius — comisión más alta aplicada',
    badgeGenius: 'Genius',
    reservationNumberLabel: 'N.º de reserva',
  },
  en: {
    calendarTitle: 'Booking calendar overview',
    legendAirbnb: 'Airbnb',
    legendBooking: 'Booking.com',
    tabThisMonth: 'This month',
    tabLastMonth: 'Last month',
    tabNextMonth: 'Next month',
    customDates: 'Custom dates',
    allApartments: 'All apartments',
    filterPropertiesAria: 'Filter properties',
    apartmentLabel: 'Apartment {n}',
    nightsLabel: '{n} nights',
    footerOccupancy: 'Occupancy rate',
    footerTotalBookings: 'Total bookings',
    footerBookedNights: 'Booked nights',
    footerAirbnb: 'Airbnb',
    footerBooking: 'Booking.com',
    demoUnavailableOption: 'This option is not available in the demo.',
    demoUnavailableAction: 'This action is not available in the demo.',
    modalClose: 'Close',
    popoverStatusConfirmed: 'Confirmed',
    popoverCheckIn: 'Check-in',
    popoverCheckOut: 'Check-out',
    popoverDuration: 'Duration:',
    popoverFinancialTitle: 'Financial details',
    popoverTotalGuestPrice: 'Total guest price',
    popoverCleaningFee: 'Cleaning fee',
    popoverPlatformFee: 'Platform fee ({pct} %)',
    popoverNetPayout: 'Net host payout',
    popoverGeniusBanner: 'Genius guest — higher commission applied',
    badgeGenius: 'Genius',
    reservationNumberLabel: 'Reservation number',
  },
  de: {
    calendarTitle: 'Überblick Buchungskalender',
    legendAirbnb: 'Airbnb',
    legendBooking: 'Booking.com',
    tabThisMonth: 'Dieser Monat',
    tabLastMonth: 'Letzter Monat',
    tabNextMonth: 'Nächster Monat',
    customDates: 'Eigene Daten',
    allApartments: 'Alle Apartments',
    filterPropertiesAria: 'Unterkünfte filtern',
    apartmentLabel: 'Apartment {n}',
    nightsLabel: '{n} Nächte',
    footerOccupancy: 'Auslastung',
    footerTotalBookings: 'Buchungen gesamt',
    footerBookedNights: 'Gebuchte Nächte',
    footerAirbnb: 'Airbnb',
    footerBooking: 'Booking.com',
    demoUnavailableOption: 'Diese Option ist in der Demo nicht verfügbar.',
    demoUnavailableAction: 'Diese Aktion ist in der Demo nicht verfügbar.',
    modalClose: 'Schließen',
    popoverStatusConfirmed: 'Bestätigt',
    popoverCheckIn: 'Anreise',
    popoverCheckOut: 'Abreise',
    popoverDuration: 'Dauer:',
    popoverFinancialTitle: 'Finanzielle Details',
    popoverTotalGuestPrice: 'Gesamtpreis Gast',
    popoverCleaningFee: 'Reinigungsgebühr',
    popoverPlatformFee: 'Plattformgebühr ({pct} %)',
    popoverNetPayout: 'Netto-Auszahlung',
    popoverGeniusBanner: 'Genius-Gast — höhere Provision angewendet',
    badgeGenius: 'Genius',
    reservationNumberLabel: 'Buchungsnummer',
  },
  it: {
    calendarTitle: 'Panoramica calendario prenotazioni',
    legendAirbnb: 'Airbnb',
    legendBooking: 'Booking.com',
    tabThisMonth: 'Questo mese',
    tabLastMonth: 'Mese scorso',
    tabNextMonth: 'Mese prossimo',
    customDates: 'Date personalizzate',
    allApartments: 'Tutti gli appartamenti',
    filterPropertiesAria: 'Filtra le strutture',
    apartmentLabel: 'Appartamento {n}',
    nightsLabel: '{n} notti',
    footerOccupancy: 'Tasso di occupazione',
    footerTotalBookings: 'Prenotazioni totali',
    footerBookedNights: 'Notti prenotate',
    footerAirbnb: 'Airbnb',
    footerBooking: 'Booking.com',
    demoUnavailableOption: "Questa opzione non è disponibile nella demo.",
    demoUnavailableAction: "Questa azione non è disponibile nella demo.",
    modalClose: 'Chiudi',
    popoverStatusConfirmed: 'Confermata',
    popoverCheckIn: 'Check-in',
    popoverCheckOut: 'Check-out',
    popoverDuration: 'Durata:',
    popoverFinancialTitle: 'Dettagli finanziari',
    popoverTotalGuestPrice: 'Prezzo totale ospite',
    popoverCleaningFee: 'Spese di pulizia',
    popoverPlatformFee: 'Commissione piattaforma ({pct} %)',
    popoverNetPayout: 'Netto per l’host',
    popoverGeniusBanner: 'Ospite Genius — commissione maggiorata applicata',
    badgeGenius: 'Genius',
    reservationNumberLabel: 'Numero prenotazione',
  },
}
