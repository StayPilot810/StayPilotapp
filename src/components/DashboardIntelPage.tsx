import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { enrichReservationAccessAddressesFromIcal } from '../utils/icalAddress'
import { writeScopedStorage } from '../utils/sessionStorageScope'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'
import { buildGuestDemoMonthBookings, DEMO_BASE_YEAR } from '../utils/demoCalendarData'
import { isGuestDemoSession } from '../utils/guestDemo'

type CityPoint = {
  id: string
  name: string
  country: string
  address: string
  lat: number
  lng: number
}

type LocationContext = {
  city: string
  country: string
  countryCode: string
}

type HolidayItem = {
  date: string
  localName: string
  name: string
}

type TicketmasterResponse = {
  _embedded?: {
    events?: Array<{
      name?: string
      dates?: { start?: { localDate?: string } }
      classifications?: Array<{ segment?: { name?: string } }>
    }>
  }
}

type SeatgeekResponse = {
  events?: Array<{
    title?: string
    datetime_local?: string
    type?: string
  }>
}

type PredictHQResponse = {
  results?: Array<{
    title?: string
    start?: string
    category?: string
  }>
}

type EventbriteResponse = {
  events?: Array<{
    name?: { text?: string }
    start?: { local?: string; utc?: string }
  }>
}

type BandsintownEvent = {
  title?: string
  datetime?: string
}

type MeetupResponse = {
  events?: Array<{
    name?: string
    dateTime?: string
  }>
}

type PriceLabsResponse = {
  data?: Array<{
    date?: string
    event_name?: string
    event_type?: string
    demand_index?: number
  }>
  events?: Array<{
    date?: string
    event_name?: string
    event_type?: string
    demand_index?: number
  }>
  results?: Array<{
    date?: string
    event_name?: string
    event_type?: string
    demand_index?: number
  }>
}

type LiveSignalDay = {
  concerts: number
  sports: number
  business: number
  sources: string[]
  concertLabels: string[]
  sportsLabels: string[]
  businessLabels: string[]
}

type DateRange = {
  start: string
  end: string
  label: string
}

type NamedEventRange = {
  start: string
  end: string
  label: string
  city?: string
}
type IntelCalendarCell = {
  day: number
  isoDate: string
  level: 'low' | 'medium' | 'high'
  event: string
  recommendedPct: number
  confidenceScore: number
  demandScore: number
  signalCount: number
  forecastAdr: number
  forecastOccupancy: number
  forecastRevpar: number
  pickup7d: number
  pickup30d: number
  priceFloor: number
  priceCeiling: number
  riskLevel: 'low' | 'medium' | 'high'
  actionTag: 'raise' | 'hold' | 'lower'
  isBooked: boolean
  isEmptyGap: boolean
  bookingProbabilityPct: number
  expectedRevenueDeltaPct: number
  landingStep: 'hold' | 'soft_drop' | 'hard_drop'
}
const LS_WATCH_INTEL_SUMMARY = 'staypilot_watch_intel_summary_v1'

const OLYMPIC_SUMMER_YEARS = [2024, 2028, 2032]
const COASTAL_MARKERS = [
  'nice',
  'cannes',
  'marseille',
  'bordeaux',
  'biarritz',
  'barcelona',
  'ibiza',
  'mallorca',
  'miami',
  'lisbon',
  'porto',
  'riviera',
  'costa',
  'beach',
  'plage',
  'mer',
]
const SKI_MARKERS = [
  'chamonix',
  'courchevel',
  'megeve',
  'val d isere',
  'tignes',
  'les arcs',
  'avoriaz',
  'zermatt',
  'st moritz',
  'verbier',
  'andorra',
  'alps',
  'alpes',
  'ski',
  'montagne',
]
const GLOBAL_TOURISM_HUB_MARKERS = [
  'paris',
  'london',
  'rome',
  'barcelona',
  'madrid',
  'lisbon',
  'amsterdam',
  'new york',
  'tokyo',
  'dubai',
  'singapore',
  'miami',
  'los angeles',
  'istanbul',
  'bangkok',
]

function structuralCitySeasonalityBoost(locationKey: string, monthIndex: number) {
  const key = locationKey.toLowerCase()
  const isTourismHub = includesAny(key, GLOBAL_TOURISM_HUB_MARKERS)
  const isParis = key.includes('paris')
  const isMediterranean = includesAny(key, ['barcelona', 'rome', 'lisbon', 'nice', 'cannes', 'athens'])
  const isGulf = includesAny(key, ['dubai', 'abu dhabi', 'doha'])
  const isAsiaHub = includesAny(key, ['tokyo', 'singapore', 'bangkok', 'seoul', 'hong kong'])

  let boost = 0
  // Base worldwide seasonality.
  if ([5, 6, 7, 8].includes(monthIndex)) boost += 4
  if ([11, 0, 1].includes(monthIndex)) boost += 2

  // City profile refinements.
  if (isTourismHub && [4, 5, 6, 7, 8, 9].includes(monthIndex)) boost += 4
  if (isParis && [4, 5, 6, 7, 8, 9].includes(monthIndex)) boost += 6
  if (isMediterranean && [5, 6, 7, 8].includes(monthIndex)) boost += 7
  if (isGulf && [10, 11, 0, 1, 2, 3].includes(monthIndex)) boost += 6
  if (isAsiaHub && [2, 3, 9, 10].includes(monthIndex)) boost += 3

  return Math.max(0, Math.min(18, boost))
}
function emptyLiveSignalDay(): LiveSignalDay {
  return {
    concerts: 0,
    sports: 0,
    business: 0,
    sources: [],
    concertLabels: [],
    sportsLabels: [],
    businessLabels: [],
  }
}

function normalizeIsoDate(value?: string): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

function pickFirstString(...values: Array<unknown>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function pickFirstNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const n = Number(value)
      if (!Number.isNaN(n)) return n
    }
  }
  return null
}

function includesAny(value: string, markers: string[]): boolean {
  return markers.some((marker) => value.includes(marker))
}

function FlyToLocation({ target }: { target: [number, number] | null }) {
  const map = useMap()
  if (target) {
    map.flyTo(target, 10, { duration: 1.2 })
  }
  return null
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const resizeNow = () => map.invalidateSize()
    const timer = window.setTimeout(resizeNow, 50)
    window.addEventListener('resize', resizeNow)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', resizeNow)
    }
  }, [map])
  return null
}

type IntelTutorialLang = 'fr' | 'en' | 'es' | 'de' | 'it'

function normalizeTutorialLocale(locale: string): IntelTutorialLang {
  const value = locale.toLowerCase()
  if (value.startsWith('fr')) return 'fr'
  if (value.startsWith('en')) return 'en'
  if (value.startsWith('es')) return 'es'
  if (value.startsWith('de')) return 'de'
  if (value.startsWith('it')) return 'it'
  return 'fr'
}

const MAX_LOCAL_EVENT_RADIUS_KM = 15

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

export function DashboardIntelPage() {
  const formatIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const today = new Date()
  const plus30Days = new Date(today)
  plus30Days.setDate(plus30Days.getDate() + 29)

  const { t, locale } = useLanguage()
  const tutorialVo = normalizeTutorialLocale(locale)
  const copy = {
    fr: {
      searchLabel: 'Recherche adresse / coordonnees GPS',
      searchPlaceholder: 'Ex: Paris ou 48.8566,2.3522',
      searchAction: 'Rechercher',
      noResult: 'Aucun resultat pour cette recherche.',
      clickHint: "Voir les informations sur l'adresse recherchee ou une autre zone.",
      selectedCity: 'Ville selectionnee',
      coordinates: 'Coordonnees',
      mapError: 'Impossible de trouver cette adresse.',
      myListingsTitle: 'Mes logements',
      myListingsSubtitle: 'Adresses actuellement suivies sur StayPilot.',
      myListingsTabConnected: 'Logements connectes',
      myListingsTabSearch: 'Recherche',
      myListingsSearchHint:
        'Utilisez le champ en haut de la page pour rechercher une ville, une adresse ou des coordonnees GPS. Les resultats apparaissent sur la carte et dans le panneau sous la carte.',
      myListingsAddressPending:
        'Adresse non trouvee dans le calendrier iCal. Renseignez-la sur la page Connexion ou verifiez que le flux contient une ligne LOCATION.',
      platformAirbnb: 'Airbnb',
      platformBooking: 'Booking.com',
      platformChannel: 'Channel Manager',
      myListingsEmpty: 'Aucune adresse enregistree via Airbnb, Booking ou Channel Manager.',
      calendarTitle: 'Calendrier previsionnel mois par mois',
      calendarSubtitle: "Demande estimee selon l'adresse selectionnee.",
      legendLow: 'Demande standard',
      legendMedium: 'Demande en hausse',
      legendHigh: 'Forte demande',
      hoverHint: 'Survolez un jour colore pour voir l evenement.',
      calendarNoLocation: 'Recherchez une adresse pour afficher le calendrier previsionnel.',
      riskLow: 'Faible',
      riskMedium: 'Moyen',
      riskHigh: 'Fort',
      tutorialTitle: 'Video tuto: veille informationnelle',
      tutorialBody:
        'Vos logements connectes remontent automatiquement. StayPilot analyse les informations autour de l adresse (evenements, affluence, signaux de demande locale).',
      tutorialPreciseHint:
        'Conseil: saisissez une adresse precise sur la carte. Une ville seule est souvent trop vague pour une analyse fiable.',
      analysisPrecisionMessage:
        'Analyse large sur la ville. Ajouter une adresse precise nous aidera a mieux vous conseiller.',
      analyzedAddressLabel: 'Adresse analysee',
      calendarMonth: 'Mois',
      calendarCustomRange: 'Date personnalisee',
      weekdayLabels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      videoFallback: 'Votre navigateur ne lit pas la video MP4.',
    },
    en: {
      searchLabel: 'Address / GPS coordinates search',
      searchPlaceholder: 'Ex: Paris or 48.8566,2.3522',
      searchAction: 'Search',
      noResult: 'No result for this search.',
      clickHint: 'View information for the searched address or another area.',
      selectedCity: 'Selected city',
      coordinates: 'Coordinates',
      mapError: 'Unable to find this address.',
      myListingsTitle: 'My listings',
      myListingsSubtitle: 'Addresses currently tracked in StayPilot.',
      myListingsTabConnected: 'Connected listings',
      myListingsTabSearch: 'Search',
      myListingsSearchHint:
        'Use the search field at the top to find a city, an address, or GPS coordinates. Results appear on the map and in the panel below.',
      myListingsAddressPending:
        'No address found in the iCal feed. Add it on the Connect page or ensure the calendar includes a LOCATION field.',
      platformAirbnb: 'Airbnb',
      platformBooking: 'Booking.com',
      platformChannel: 'Channel Manager',
      myListingsEmpty: 'No address saved via Airbnb, Booking or Channel Manager.',
      calendarTitle: 'Monthly forecast calendar',
      calendarSubtitle: 'Estimated demand based on the selected address.',
      legendLow: 'Standard demand',
      legendMedium: 'Demand rising',
      legendHigh: 'High demand',
      hoverHint: 'Hover a colored day to see the event.',
      calendarNoLocation: 'Search an address to display the forecast calendar.',
      riskLow: 'Low',
      riskMedium: 'Medium',
      riskHigh: 'High',
      tutorialTitle: 'Tutorial video: local intelligence',
      tutorialBody:
        'Your connected listings are pulled in automatically. StayPilot then analyzes nearby intelligence around the address (events, traffic, local demand signals).',
      tutorialPreciseHint:
        'Tip: enter a precise address on the map. A city name alone is usually too broad for reliable analysis.',
      analysisPrecisionMessage:
        'City-level analysis is broad. Adding a precise address helps us provide better recommendations.',
      analyzedAddressLabel: 'Analyzed address',
      calendarMonth: 'Month',
      calendarCustomRange: 'Custom date range',
      weekdayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      videoFallback: 'Your browser does not support MP4 video playback.',
    },
    es: {
      searchLabel: 'Busqueda direccion / coordenadas GPS',
      searchPlaceholder: 'Ej: Paris o 48.8566,2.3522',
      searchAction: 'Buscar',
      noResult: 'Sin resultados para esta busqueda.',
      clickHint: 'Ver informacion de la direccion buscada u otra zona.',
      selectedCity: 'Ciudad seleccionada',
      coordinates: 'Coordenadas',
      mapError: 'No se pudo encontrar esta direccion.',
      myListingsTitle: 'Mis alojamientos',
      myListingsSubtitle: 'Direcciones actualmente seguidas en StayPilot.',
      myListingsTabConnected: 'Alojamientos conectados',
      myListingsTabSearch: 'Busqueda',
      myListingsSearchHint:
        'Use el campo superior para buscar una ciudad, una direccion o coordenadas GPS. Los resultados aparecen en el mapa y en el panel inferior.',
      myListingsAddressPending:
        'No se encontro la direccion en el iCal. Anadala en Conexion o compruebe que el calendario incluya LOCATION.',
      platformAirbnb: 'Airbnb',
      platformBooking: 'Booking.com',
      platformChannel: 'Channel Manager',
      myListingsEmpty: 'Ninguna direccion guardada via Airbnb, Booking o Channel Manager.',
      calendarTitle: 'Calendario mensual de prevision',
      calendarSubtitle: 'Demanda estimada segun la direccion seleccionada.',
      legendLow: 'Demanda estandar',
      legendMedium: 'Demanda en subida',
      legendHigh: 'Alta demanda',
      hoverHint: 'Pasa el cursor sobre un dia coloreado para ver el evento.',
      calendarNoLocation: 'Busca una direccion para mostrar el calendario de prevision.',
      riskLow: 'Bajo',
      riskMedium: 'Medio',
      riskHigh: 'Alto',
      tutorialTitle: 'Video tutorial: vigilancia informativa',
      tutorialBody:
        'Tus alojamientos conectados se sincronizan automaticamente. StayPilot analiza luego la informacion alrededor de la direccion (eventos, afluencia y senales de demanda local).',
      tutorialPreciseHint:
        'Consejo: introduce una direccion precisa en el mapa. Una ciudad sola suele ser demasiado general para un analisis fiable.',
      analysisPrecisionMessage:
        'El analisis a nivel ciudad es amplio. Anadir una direccion precisa mejora la recomendacion.',
      analyzedAddressLabel: 'Direccion analizada',
      calendarMonth: 'Mes',
      calendarCustomRange: 'Rango personalizado',
      weekdayLabels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
      videoFallback: 'Tu navegador no admite la reproduccion de video MP4.',
    },
    de: {
      searchLabel: 'Suche Adresse / GPS-Koordinaten',
      searchPlaceholder: 'Bsp: Paris oder 48.8566,2.3522',
      searchAction: 'Suchen',
      noResult: 'Kein Ergebnis fur diese Suche.',
      clickHint: 'Informationen zur gesuchten Adresse oder einem anderen Bereich anzeigen.',
      selectedCity: 'Ausgewahlte Stadt',
      coordinates: 'Koordinaten',
      mapError: 'Diese Adresse konnte nicht gefunden werden.',
      myListingsTitle: 'Meine Unterkunfte',
      myListingsSubtitle: 'Aktuell in StayPilot verfolgte Adressen.',
      myListingsTabConnected: 'Verbundene Unterkunfte',
      myListingsTabSearch: 'Suche',
      myListingsSearchHint:
        'Nutzen Sie das Suchfeld oben fur Stadt, Adresse oder GPS-Koordinaten. Die Ergebnisse erscheinen auf der Karte und im Panel darunter.',
      myListingsAddressPending:
        'Keine Adresse im iCal gefunden. Tragen Sie sie unter Verbinden ein oder prufen Sie LOCATION im Kalender.',
      platformAirbnb: 'Airbnb',
      platformBooking: 'Booking.com',
      platformChannel: 'Channel Manager',
      myListingsEmpty: 'Keine Adresse uber Airbnb, Booking oder Channel Manager gespeichert.',
      calendarTitle: 'Monatlicher Prognosekalender',
      calendarSubtitle: 'Geschaftsprognose basierend auf der ausgewahlten Adresse.',
      legendLow: 'Standardnachfrage',
      legendMedium: 'Steigende Nachfrage',
      legendHigh: 'Hohe Nachfrage',
      hoverHint: 'Fahren Sie uber einen farbigen Tag, um das Ereignis zu sehen.',
      calendarNoLocation: 'Suchen Sie eine Adresse, um den Prognosekalender anzuzeigen.',
      riskLow: 'Niedrig',
      riskMedium: 'Mittel',
      riskHigh: 'Hoch',
      tutorialTitle: 'Tutorial-Video: lokale Informationen',
      tutorialBody:
        'Ihre verbundenen Unterkunfte werden automatisch ubernommen. StayPilot analysiert dann Signale rund um die Adresse (Events, Auslastung, lokale Nachfrage).',
      tutorialPreciseHint:
        'Tipp: Geben Sie eine genaue Adresse auf der Karte ein. Eine Stadt allein ist fur zuverlassige Analysen oft zu ungenau.',
      analysisPrecisionMessage:
        'Eine Analyse nur auf Stadtebene ist ungenau. Eine genaue Adresse liefert bessere Empfehlungen.',
      analyzedAddressLabel: 'Analysierte Adresse',
      calendarMonth: 'Monat',
      calendarCustomRange: 'Benutzerdefinierter Zeitraum',
      weekdayLabels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      videoFallback: 'Ihr Browser unterstutzt keine MP4-Videowiedergabe.',
    },
    it: {
      searchLabel: 'Ricerca indirizzo / coordinate GPS',
      searchPlaceholder: 'Es: Parigi o 48.8566,2.3522',
      searchAction: 'Cerca',
      noResult: 'Nessun risultato per questa ricerca.',
      clickHint: 'Visualizza le informazioni sull indirizzo cercato o su un altra zona.',
      selectedCity: 'Citta selezionata',
      coordinates: 'Coordinate',
      mapError: 'Impossibile trovare questo indirizzo.',
      myListingsTitle: 'I miei alloggi',
      myListingsSubtitle: 'Indirizzi attualmente monitorati in StayPilot.',
      myListingsTabConnected: 'Alloggi collegati',
      myListingsTabSearch: 'Ricerca',
      myListingsSearchHint:
        'Usa il campo in alto per cercare una citta, un indirizzo o coordinate GPS. I risultati compaiono sulla mappa e nel pannello sotto.',
      myListingsAddressPending:
        'Indirizzo non trovato nell iCal. Inseriscilo in Connessione o verifica la riga LOCATION nel calendario.',
      platformAirbnb: 'Airbnb',
      platformBooking: 'Booking.com',
      platformChannel: 'Channel Manager',
      myListingsEmpty: 'Nessun indirizzo salvato tramite Airbnb, Booking o Channel Manager.',
      calendarTitle: 'Calendario previsionale mese per mese',
      calendarSubtitle: 'Domanda stimata in base all indirizzo selezionato.',
      legendLow: 'Domanda standard',
      legendMedium: 'Domanda in aumento',
      legendHigh: 'Alta domanda',
      hoverHint: 'Passa il mouse su un giorno colorato per vedere l evento.',
      calendarNoLocation: 'Cerca un indirizzo per visualizzare il calendario previsionale.',
      riskLow: 'Basso',
      riskMedium: 'Medio',
      riskHigh: 'Alto',
      tutorialTitle: 'Video tutorial: monitoraggio informativo',
      tutorialBody:
        'I tuoi alloggi connessi si sincronizzano automaticamente. StayPilot analizza poi i segnali intorno all indirizzo (eventi, affluenza, domanda locale).',
      tutorialPreciseHint:
        'Suggerimento: inserisci un indirizzo preciso nella mappa. Una sola citta e spesso troppo generica per analisi affidabili.',
      analysisPrecisionMessage:
        'L analisi a livello citta e ampia. Un indirizzo preciso migliora i suggerimenti.',
      analyzedAddressLabel: 'Indirizzo analizzato',
      calendarMonth: 'Mese',
      calendarCustomRange: 'Intervallo personalizzato',
      weekdayLabels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      videoFallback: 'Il tuo browser non supporta la riproduzione video MP4.',
    },
  }[tutorialVo]
  const runtimeText = {
    fr: {
      matchOf: 'Match de',
      officialHoliday: 'Jour ferie officiel',
      priceLabsSignal: 'Signal PriceLabs live: ajustement prioritaire applique',
      confirmedEvent: 'Evenement confirme',
      schoolHolidaysActive: 'Vacances scolaires actives',
      schoolHolidayPeriodActive: 'periode scolaire active',
      threeDayWeekend: 'Week-end de 3 jours: forte acceleration de la demande',
      coastalSummer: 'Bord de mer en ete: pic massif de reservations (ADR et occupation en forte hausse)',
      skiWinter: 'Station de ski en hiver: occupation, sejours courts et ADR explosent',
      concertConfirmed: 'Concert confirme',
      signals: 'signaux',
      concertLiveDetected: 'Concerts / live shows detectes',
      sportsMajorDetected: 'Evenements sportifs majeurs detectes (F1, rugby, tennis, football, NFL...)',
      matchSignals: 'signaux matchs',
      businessConference: 'Salon / conference',
      businessInCity: 'Salon / conference en ville',
      localActivityHigh: 'Activite locale tres forte',
      localActivityUp: 'Activite locale en hausse',
      articlesDetectedToday: 'articles detectes ce jour',
      geopoliticalHigh: 'Risque geopolitique eleve',
      geopoliticalMedium: 'Risque geopolitique modere',
      conflictSignalsDemandDown: 'signaux conflit (demande touristique en baisse)',
      conflictSignalsDemandPressure: 'signaux conflit (demande sous pression)',
      geopoliticalTension: 'Tension geopolitique detectee',
      signalSingle: 'signal',
      weatherAlert: 'Alerte meteo locale',
      heatWave: 'Chaleur soutenue',
      skiCold: 'Conditions froides favorables au ski',
      weekendImpactedBy: 'Week-end impacte par',
      weekendEffect: 'Effet week-end (hausse naturelle de la demande)',
      localContextDynamic: 'Contexte local global tres dynamique',
      recentArticles: 'articles recents',
      worldSignalLive: 'Signal monde en direct',
      activitiesDetected: 'activites detectees',
      standardDemand: 'Demande standard',
      increasePricesBy: 'Augmentez vos prix de',
      lowerPricesBy: 'Baissez vos prix de',
      summaryIntro: 'Pour {month} a {address}, la pression de demande est estimee a {high} jours forts, {medium} jours en hausse et {low} jours standards.',
      summarySchool:
        'Les vacances scolaires impactent la demande sur une partie du mois, avec des effets plus marques autour des week-ends.',
      summaryEvents:
        'Des signaux evenementiels sont detectes ({events}), ce qui peut accelerer les reservations de derniere minute.',
      summaryWeather:
        'La meteo en temps reel influence certains jours (chaleur/alerte), ce qui ajuste le niveau de prix recommande.',
      summaryGeo:
        'Un risque geopolitique est detecte sur certains jours: la recommandation privilegie la prudence tarifaire sur ces dates.',
      summaryTip:
        'Conseil: conservez une strategie dynamique, avec hausses ciblees sur les pics confirmes et ajustements moderes sur les jours sans convergence forte de signaux.',
      summaryEventsConcerts: 'concerts/shows',
      summaryEventsSports: 'sports majeurs',
      and: ' et ',
      tourismSeasonality: 'Saisonnalite touristique forte sur la destination',
      concretePulseTitle: 'Signal marche (style PriceLabs/AirDNA)',
      concreteRecommended: 'Ajustement prix moyen recommande',
      concreteConfidence: 'Confiance du signal',
      concreteDemandScore: 'Score de demande',
      concreteTopUpDay: 'Jour de hausse max',
      concreteTopDownDay: 'Jour de baisse max',
      concreteDataPoints: 'points de signal',
      concreteNoStrongDown: 'Aucune baisse forte detectee',
      advancedTitle: 'Forecast pricing avance (style PriceLabs)',
      advancedAdr: 'ADR forecast',
      advancedOcc: 'Occupation forecast',
      advancedRevpar: 'RevPAR forecast',
      advancedPickup7d: 'Pickup J+7',
      advancedPickup30d: 'Pickup J+30',
      advancedPriceBand: 'Bandes prix',
      advancedCompsetGap: 'Ecart vs compset',
      advancedAnomalies: 'Anomalies detectees',
      advancedActionRaise: 'Action: hausse ciblee',
      advancedActionHold: 'Action: maintien tactique',
      advancedActionLower: 'Action: baisse defensive',
      advancedRiskLow: 'Risque faible',
      advancedRiskMedium: 'Risque moyen',
      advancedRiskHigh: 'Risque eleve',
      advancedNoAnomaly: 'Aucune anomalie critique detectee sur le mois.',
      emptyGapDetected: 'Date vide detectee (nuit non reservee)',
      precisionTitle: 'Precision data (niveau minutieux)',
      precisionLos: 'Duree moyenne de sejour (LOS)',
      precisionCancel: 'Taux annulation',
      precisionLeadMix: 'Mix horizon resa',
      precisionEventQuality: 'Qualite signal evenement',
      precisionConfidenceAdr: 'Confiance ADR',
      precisionConfidenceOcc: 'Confiance Occupation',
      precisionConfidenceEvents: 'Confiance Evenements',
      precisionFar: 'Lointain',
      precisionMid: 'Intermediaire',
      precisionNear: 'Proche',
      advancedBookingProbability: 'Probabilite booking',
      advancedExpectedDelta: 'Gain revenu attendu',
      advancedLanding: 'Atterrissage tarifaire',
      advancedLandingHold: 'Maintien',
      advancedLandingSoft: 'Baisse douce',
      advancedLandingHard: 'Baisse forte',
      advancedBacktestScore: 'Backtest score',
      phase1Title: 'Market edge lab (Phase 1)',
      phase1CompsetAdr: 'Compset ADR',
      phase1CompsetOcc: 'Compset Occupation',
      phase1PickupPressure: 'Pickup pressure',
      phase1NetUplift: 'Uplift marge nette attendue',
      phase1Recommendation: 'Reco prioritaire',
      phase1RecoAggressive: 'Strategie agressive: augmenter les dates premium restantes.',
      phase1RecoBalanced: 'Strategie equilibree: hausse selective + protection conversion.',
      phase1RecoDefensive: 'Strategie defensive: proteger le remplissage court terme.',
    },
    en: {
      matchOf: 'Match',
      officialHoliday: 'Official holiday',
      priceLabsSignal: 'Live PriceLabs signal: priority adjustment applied',
      confirmedEvent: 'Confirmed event',
      schoolHolidaysActive: 'School holidays active',
      schoolHolidayPeriodActive: 'school holiday period active',
      threeDayWeekend: '3-day weekend: strong demand acceleration',
      coastalSummer: 'Coastal summer market: major booking peak (ADR and occupancy rising sharply)',
      skiWinter: 'Ski market in winter: occupancy, short stays, and ADR surge',
      concertConfirmed: 'Confirmed concert',
      signals: 'signals',
      concertLiveDetected: 'Concerts / live shows detected',
      sportsMajorDetected: 'Major sports events detected (F1, rugby, tennis, football, NFL...)',
      matchSignals: 'match signals',
      businessConference: 'Expo / conference',
      businessInCity: 'Expo / conference in the city',
      localActivityHigh: 'Very strong local activity',
      localActivityUp: 'Local activity rising',
      articlesDetectedToday: 'articles detected today',
      geopoliticalHigh: 'High geopolitical risk',
      geopoliticalMedium: 'Moderate geopolitical risk',
      conflictSignalsDemandDown: 'conflict signals (tourism demand decreasing)',
      conflictSignalsDemandPressure: 'conflict signals (demand under pressure)',
      geopoliticalTension: 'Geopolitical tension detected',
      signalSingle: 'signal',
      weatherAlert: 'Local weather alert',
      heatWave: 'Sustained heat',
      skiCold: 'Cold conditions favorable for ski demand',
      weekendImpactedBy: 'Weekend impacted by',
      weekendEffect: 'Weekend effect (natural demand increase)',
      localContextDynamic: 'Overall local context is very dynamic',
      recentArticles: 'recent articles',
      worldSignalLive: 'Live global signal',
      activitiesDetected: 'activities detected',
      standardDemand: 'Standard demand',
      increasePricesBy: 'Increase your prices by',
      lowerPricesBy: 'Lower your prices by',
      summaryIntro: 'For {month} in {address}, demand pressure is estimated at {high} high days, {medium} rising days, and {low} standard days.',
      summarySchool: 'School holidays impact demand during part of the month, with stronger effects around weekends.',
      summaryEvents: 'Event signals are detected ({events}), which can accelerate last-minute bookings.',
      summaryWeather: 'Real-time weather affects some days (heat/alert), which adjusts the recommended price level.',
      summaryGeo: 'Geopolitical risk is detected on some days: pricing guidance stays cautious on these dates.',
      summaryTip:
        'Tip: keep a dynamic strategy, with targeted increases on confirmed peaks and moderate adjustments on days without strong signal convergence.',
      summaryEventsConcerts: 'concerts/shows',
      summaryEventsSports: 'major sports',
      and: ' and ',
      tourismSeasonality: 'Strong tourism seasonality for this destination',
      concretePulseTitle: 'Market pulse (PriceLabs/AirDNA style)',
      concreteRecommended: 'Average recommended price adjustment',
      concreteConfidence: 'Signal confidence',
      concreteDemandScore: 'Demand score',
      concreteTopUpDay: 'Top increase day',
      concreteTopDownDay: 'Top decrease day',
      concreteDataPoints: 'signal points',
      concreteNoStrongDown: 'No strong downward signal detected',
      advancedTitle: 'Advanced pricing forecast (PriceLabs style)',
      advancedAdr: 'ADR forecast',
      advancedOcc: 'Occupancy forecast',
      advancedRevpar: 'RevPAR forecast',
      advancedPickup7d: 'Pickup D+7',
      advancedPickup30d: 'Pickup D+30',
      advancedPriceBand: 'Price bands',
      advancedCompsetGap: 'Gap vs compset',
      advancedAnomalies: 'Detected anomalies',
      advancedActionRaise: 'Action: targeted increase',
      advancedActionHold: 'Action: tactical hold',
      advancedActionLower: 'Action: defensive decrease',
      advancedRiskLow: 'Low risk',
      advancedRiskMedium: 'Medium risk',
      advancedRiskHigh: 'High risk',
      advancedNoAnomaly: 'No critical anomaly detected this month.',
      emptyGapDetected: 'Empty date detected (unbooked night)',
      precisionTitle: 'Precision data (deep level)',
      precisionLos: 'Average stay length (LOS)',
      precisionCancel: 'Cancellation rate',
      precisionLeadMix: 'Booking horizon mix',
      precisionEventQuality: 'Event signal quality',
      precisionConfidenceAdr: 'ADR confidence',
      precisionConfidenceOcc: 'Occupancy confidence',
      precisionConfidenceEvents: 'Events confidence',
      precisionFar: 'Far',
      precisionMid: 'Mid',
      precisionNear: 'Near',
      advancedBookingProbability: 'Booking probability',
      advancedExpectedDelta: 'Expected revenue delta',
      advancedLanding: 'Price landing',
      advancedLandingHold: 'Hold',
      advancedLandingSoft: 'Soft drop',
      advancedLandingHard: 'Hard drop',
      advancedBacktestScore: 'Backtest score',
      phase1Title: 'Market edge lab (Phase 1)',
      phase1CompsetAdr: 'Compset ADR',
      phase1CompsetOcc: 'Compset occupancy',
      phase1PickupPressure: 'Pickup pressure',
      phase1NetUplift: 'Expected net margin uplift',
      phase1Recommendation: 'Top recommendation',
      phase1RecoAggressive: 'Aggressive strategy: push remaining premium dates.',
      phase1RecoBalanced: 'Balanced strategy: selective increases with conversion guardrails.',
      phase1RecoDefensive: 'Defensive strategy: protect near-term occupancy.',
    },
  }[locale === 'fr' || locale === 'en' ? locale : 'en']

  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [useSatelliteFallback, setUseSatelliteFallback] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [listingsPanelTab, setListingsPanelTab] = useState<'connected' | 'search'>('connected')
  const [connectedListVersion, setConnectedListVersion] = useState(0)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [isBroadCityAnalysis, setIsBroadCityAnalysis] = useState(false)
  const [targetPosition, setTargetPosition] = useState<[number, number] | null>(null)
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'custom'>('month')
  const [pricingMode] = useState<'standard' | 'ultra'>('ultra')
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)
  const [rangeStart, setRangeStart] = useState(formatIsoDate(today))
  const [rangeEnd, setRangeEnd] = useState(formatIsoDate(plus30Days))
  const [searchedLabel, setSearchedLabel] = useState('')
  const [locationContext, setLocationContext] = useState<LocationContext>({
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
  })
  const [liveHolidays, setLiveHolidays] = useState<HolidayItem[]>([])
  const [weatherByDate, setWeatherByDate] = useState<Record<string, { weatherCode: number; tempMax: number }>>({})
  const [newsByDate, setNewsByDate] = useState<Record<string, number>>({})
  const [conflictByDate, setConflictByDate] = useState<Record<string, number>>({})
  const [newsHotspotScore, setNewsHotspotScore] = useState(0)
  const [liveSignalsByDate, setLiveSignalsByDate] = useState<Record<string, LiveSignalDay>>({})
  const [globalLiveByDate, setGlobalLiveByDate] = useState<Record<string, { worldAlerts: number; labels: string[] }>>({})
  const [hoveredDayEvent, setHoveredDayEvent] = useState<{ date: string; event: string } | null>(null)
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [, setProviderStatus] = useState<Record<string, 'connected' | 'missing_key' | 'error'>>({})
  const currentYear = new Date().getFullYear()
  const frenchSchoolHolidayRanges: DateRange[] = [
    { start: `${currentYear}-02-10`, end: `${currentYear}-03-10`, label: 'Vacances scolaires d hiver (zones FR)' },
    { start: `${currentYear}-04-06`, end: `${currentYear}-05-05`, label: 'Vacances scolaires de printemps (zones FR)' },
    { start: `${currentYear}-07-06`, end: `${currentYear}-09-01`, label: 'Grandes vacances scolaires' },
    { start: `${currentYear}-10-19`, end: `${currentYear}-11-03`, label: 'Vacances de la Toussaint' },
    { start: `${currentYear}-12-21`, end: `${currentYear + 1}-01-05`, label: 'Vacances de Noel' },
  ]
  const namedEventRanges: NamedEventRange[] = [
    { start: `${currentYear}-01-16`, end: `${currentYear}-01-21`, label: 'Paris Fashion Week (Homme)', city: 'paris' },
    { start: `${currentYear}-02-24`, end: `${currentYear}-03-03`, label: 'Paris Fashion Week (Femme)', city: 'paris' },
    { start: `${currentYear}-05-14`, end: `${currentYear}-05-25`, label: 'Festival de Cannes', city: 'cannes' },
    { start: `${currentYear}-06-30`, end: `${currentYear}-07-13`, label: 'Wimbledon Championships', city: 'london' },
    { start: `${currentYear}-09-20`, end: `${currentYear}-09-28`, label: 'London Fashion Week', city: 'london' },
    { start: `${currentYear}-09-23`, end: `${currentYear}-10-01`, label: 'Paris Fashion Week', city: 'paris' },
  ]
  if (OLYMPIC_SUMMER_YEARS.includes(currentYear)) {
    namedEventRanges.push({
      start: `${currentYear}-07-20`,
      end: `${currentYear}-08-20`,
      label: 'Jeux olympiques (annee officielle)',
      city: 'paris',
    })
  }
  const cities: CityPoint[] = [
    { id: 'paris', name: 'Paris', country: 'France', address: 'Centre-ville, 75001 Paris', lat: 48.8566, lng: 2.3522 },
    { id: 'london', name: 'London', country: 'England', address: 'Westminster, London SW1A', lat: 51.5074, lng: -0.1278 },
    { id: 'madrid', name: 'Madrid', country: 'Spain', address: 'Centro, 28013 Madrid', lat: 40.4168, lng: -3.7038 },
    { id: 'rome', name: 'Rome', country: 'Italy', address: 'Centro Storico, Roma RM', lat: 41.9028, lng: 12.4964 },
    { id: 'berlin', name: 'Berlin', country: 'Germany', address: 'Mitte, 10117 Berlin', lat: 52.52, lng: 13.405 },
    { id: 'brussels', name: 'Bruxelles', country: 'Belgium', address: 'Grand-Place, 1000 Bruxelles', lat: 50.8503, lng: 4.3517 },
    { id: 'barcelona', name: 'Barcelona', country: 'Spain', address: 'Ciutat Vella, 08002 Barcelona', lat: 41.3874, lng: 2.1686 },
    { id: 'milan', name: 'Milan', country: 'Italy', address: 'Centro, Milano MI', lat: 45.4642, lng: 9.19 },
    { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', address: 'Centrum, 1012 JS Amsterdam', lat: 52.3676, lng: 4.9041 },
    { id: 'vienna', name: 'Vienne', country: 'Austria', address: 'Innere Stadt, 1010 Wien', lat: 48.2082, lng: 16.3738 },
    { id: 'lisbon', name: 'Lisbonne', country: 'Portugal', address: 'Baixa, 1100 Lisboa', lat: 38.7223, lng: -9.1393 },
    { id: 'warsaw', name: 'Varsovie', country: 'Poland', address: 'Srodmiescie, 00-001 Warszawa', lat: 52.2297, lng: 21.0122 },
    { id: 'athens', name: 'Athenes', country: 'Greece', address: 'Plaka, Athina', lat: 37.9838, lng: 23.7275 },
    { id: 'istanbul', name: 'Istanbul', country: 'Turkey', address: 'Fatih, Istanbul', lat: 41.0082, lng: 28.9784 },
    { id: 'zurich', name: 'Zurich', country: 'Switzerland', address: 'Altstadt, 8001 Zurich', lat: 47.3769, lng: 8.5417 },
    { id: 'copenhagen', name: 'Copenhague', country: 'Denmark', address: 'Indre By, 1050 Kobenhavn', lat: 55.6761, lng: 12.5683 },
    { id: 'stockholm', name: 'Stockholm', country: 'Sweden', address: 'Norrmalm, 111 22 Stockholm', lat: 59.3293, lng: 18.0686 },
    { id: 'prague', name: 'Prague', country: 'Czech Republic', address: 'Stare Mesto, 110 00 Praha', lat: 50.0755, lng: 14.4378 },
    { id: 'dublin', name: 'Dublin', country: 'Ireland', address: 'Temple Bar, Dublin 2', lat: 53.3498, lng: -6.2603 },
    { id: 'moscow', name: 'Moscou', country: 'Russia', address: 'Tverskoy District, Moscou', lat: 55.7558, lng: 37.6173 },
    { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', address: 'Downtown Dubai', lat: 25.2048, lng: 55.2708 },
    { id: 'cairo', name: 'Le Caire', country: 'Egypt', address: 'Centre-ville, Le Caire', lat: 30.0444, lng: 31.2357 },
    { id: 'lagos', name: 'Lagos', country: 'Nigeria', address: 'Victoria Island, Lagos', lat: 6.5244, lng: 3.3792 },
    { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', address: 'Sandton, Johannesburg', lat: -26.2041, lng: 28.0473 },
    { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', address: 'Copacabana, Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    { id: 'buenosaires', name: 'Buenos Aires', country: 'Argentina', address: 'Microcentro, CABA', lat: -34.6037, lng: -58.3816 },
    { id: 'mexicocity', name: 'Mexico City', country: 'Mexico', address: 'Centro Historico, Ciudad de Mexico', lat: 19.4326, lng: -99.1332 },
    { id: 'newyork', name: 'New York', country: 'United States', address: 'Manhattan, New York', lat: 40.7128, lng: -74.006 },
    { id: 'losangeles', name: 'Los Angeles', country: 'United States', address: 'Downtown, Los Angeles', lat: 34.0522, lng: -118.2437 },
    { id: 'chicago', name: 'Chicago', country: 'United States', address: 'The Loop, Chicago', lat: 41.8781, lng: -87.6298 },
    { id: 'toronto', name: 'Toronto', country: 'Canada', address: 'Downtown, Toronto', lat: 43.6532, lng: -79.3832 },
    { id: 'tokyo', name: 'Tokyo', country: 'Japan', address: 'Shinjuku, Tokyo', lat: 35.6762, lng: 139.6503 },
    { id: 'seoul', name: 'Seoul', country: 'South Korea', address: 'Jung-gu, Seoul', lat: 37.5665, lng: 126.978 },
    { id: 'shanghai', name: 'Shanghai', country: 'China', address: 'Huangpu, Shanghai', lat: 31.2304, lng: 121.4737 },
    { id: 'beijing', name: 'Pekin', country: 'China', address: 'Dongcheng, Beijing', lat: 39.9042, lng: 116.4074 },
    { id: 'hongkong', name: 'Hong Kong', country: 'China', address: 'Central, Hong Kong', lat: 22.3193, lng: 114.1694 },
    { id: 'singapore', name: 'Singapour', country: 'Singapore', address: 'Downtown Core', lat: 1.3521, lng: 103.8198 },
    { id: 'mumbai', name: 'Mumbai', country: 'India', address: 'Colaba, Mumbai', lat: 19.076, lng: 72.8777 },
    { id: 'sydney', name: 'Sydney', country: 'Australia', address: 'CBD, Sydney', lat: -33.8688, lng: 151.2093 },
  ]
  const myListings = useMemo(() => {
    return getConnectedApartmentsFromStorage().map((apt) => {
      const resolved = Boolean(apt.address.trim())
      return {
        id: apt.id,
        name: apt.name,
        address: resolved ? apt.address : copy.myListingsAddressPending,
        addressResolved: resolved,
        platform: apt.platform,
      }
    })
  }, [locale, connectedListVersion, copy.myListingsAddressPending])

  const filteredCities = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return cities

    const coords = value.split(',').map((v) => Number(v.trim()))
    const hasCoordSearch = coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])

    return cities.filter((city) => {
      if (hasCoordSearch) {
        return Math.abs(city.lat - coords[0]) < 0.8 && Math.abs(city.lng - coords[1]) < 0.8
      }
      return (
        city.name.toLowerCase().includes(value) ||
        city.country.toLowerCase().includes(value) ||
        city.address.toLowerCase().includes(value)
      )
    })
  }, [query])

  const selectedCity =
    cities.find((city) => city.id === selectedCityId) ??
    (filteredCities.length === 1 ? filteredCities[0] : null)
  const selectedListing = myListings.find((listing) => listing.id === selectedListingId) ?? null
  const bookedDateSetBySelectedListing = useMemo(() => {
    if (!selectedListing) return new Set<string>()
    const result = new Set<string>()
    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    if (isGuestDemoSession()) {
      const parts = selectedListing.id.split(':')
      const rawIdx = parts[parts.length - 1]?.replace('demo-', '')
      const listingIdx = Math.max(0, Number(rawIdx) - 1)
      if (!Number.isFinite(listingIdx)) return result
      for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
        const daysInMonth = new Date(DEMO_BASE_YEAR, monthIndex + 1, 0).getDate()
        const monthBookings = buildGuestDemoMonthBookings(daysInMonth, monthIndex).filter(
          (b) => b.apt === listingIdx && b.status === 'reserved',
        )
        monthBookings.forEach((b) => {
          for (let day = b.start; day <= b.end; day += 1) {
            result.add(`${DEMO_BASE_YEAR}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
          }
        })
      }
      return result
    }

    const official = readOfficialChannelSyncData()
    const propertyId = selectedListing.id.startsWith('channelManager:')
      ? selectedListing.id.slice('channelManager:'.length)
      : selectedListing.id
    const bookings = (official?.bookings ?? []).filter(
      (b) => String(b.propertyId || '') === propertyId && String(b.status || '').toLowerCase() !== 'cancelled',
    )
    bookings.forEach((b) => {
      const checkIn = normalizeIsoDate(b.checkIn)
      const checkOut = normalizeIsoDate(b.checkOut)
      if (!checkIn || !checkOut) return
      const start = new Date(`${checkIn}T00:00:00`)
      const endExclusive = new Date(`${checkOut}T00:00:00`)
      if (Number.isNaN(start.getTime()) || Number.isNaN(endExclusive.getTime()) || endExclusive <= start) return
      const cursor = new Date(start)
      while (cursor < endExclusive) {
        result.add(toIso(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
    })
    return result
  }, [selectedListing])

  const selectedListingPrecisionFacts = useMemo(() => {
    if (!selectedListing) {
      return {
        avgLos: 0,
        cancellationRate: 0,
        farPct: 0,
        midPct: 0,
        nearPct: 0,
        sampleSize: 0,
      }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    type LiteBooking = { checkIn: string; checkOut: string; status: 'reserved' | 'cancelled' }
    const list: LiteBooking[] = []

    if (isGuestDemoSession()) {
      const parts = selectedListing.id.split(':')
      const rawIdx = parts[parts.length - 1]?.replace('demo-', '')
      const listingIdx = Math.max(0, Number(rawIdx) - 1)
      if (Number.isFinite(listingIdx)) {
        for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
          const daysInMonth = new Date(DEMO_BASE_YEAR, monthIndex + 1, 0).getDate()
          const monthBookings = buildGuestDemoMonthBookings(daysInMonth, monthIndex).filter((b) => b.apt === listingIdx)
          monthBookings.forEach((b) => {
            const checkIn = `${DEMO_BASE_YEAR}-${String(monthIndex + 1).padStart(2, '0')}-${String(b.start).padStart(2, '0')}`
            const checkOutDay = Math.min(daysInMonth, b.end + 1)
            const checkOut = `${DEMO_BASE_YEAR}-${String(monthIndex + 1).padStart(2, '0')}-${String(checkOutDay).padStart(2, '0')}`
            list.push({ checkIn, checkOut, status: b.status === 'cancelled' ? 'cancelled' : 'reserved' })
          })
        }
      }
    } else {
      const official = readOfficialChannelSyncData()
      const propertyId = selectedListing.id.startsWith('channelManager:')
        ? selectedListing.id.slice('channelManager:'.length)
        : selectedListing.id
      ;(official?.bookings ?? [])
        .filter((b) => String(b.propertyId || '') === propertyId)
        .forEach((b) => {
          const checkIn = normalizeIsoDate(b.checkIn)
          const checkOut = normalizeIsoDate(b.checkOut)
          if (!checkIn || !checkOut) return
          list.push({
            checkIn,
            checkOut,
            status: String(b.status || '').toLowerCase() === 'cancelled' ? 'cancelled' : 'reserved',
          })
        })
    }

    if (list.length === 0) {
      return {
        avgLos: 0,
        cancellationRate: 0,
        farPct: 0,
        midPct: 0,
        nearPct: 0,
        sampleSize: 0,
      }
    }

    const nights = list
      .map((b) => {
        const start = new Date(`${b.checkIn}T00:00:00`)
        const end = new Date(`${b.checkOut}T00:00:00`)
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
      })
      .filter((n) => n > 0)
    const avgLos = nights.length > 0 ? Number((nights.reduce((s, n) => s + n, 0) / nights.length).toFixed(1)) : 0
    const cancellationRate = Number(((list.filter((b) => b.status === 'cancelled').length / Math.max(1, list.length)) * 100).toFixed(1))

    const horizon = list.reduce(
      (acc, b) => {
        const checkInDate = new Date(`${b.checkIn}T00:00:00`)
        const daysUntil = Math.round((checkInDate.getTime() - todayStart.getTime()) / 86400000)
        if (daysUntil >= 30) acc.far += 1
        else if (daysUntil >= 10) acc.mid += 1
        else acc.near += 1
        return acc
      },
      { far: 0, mid: 0, near: 0 },
    )
    const farPct = Number(((horizon.far / Math.max(1, list.length)) * 100).toFixed(0))
    const midPct = Number(((horizon.mid / Math.max(1, list.length)) * 100).toFixed(0))
    const nearPct = Math.max(0, 100 - farPct - midPct)

    return {
      avgLos,
      cancellationRate,
      farPct,
      midPct,
      nearPct,
      sampleSize: list.length,
    }
  }, [selectedListing])
  useEffect(() => {
    if (myListings.length === 0) {
      setSelectedListingId(null)
      return
    }
    if (!selectedListingId) return
    if (!myListings.some((listing) => listing.id === selectedListingId)) {
      setSelectedListingId(myListings[0].id)
    }
  }, [myListings, selectedListingId])
  const activeLocationLabel =
    selectedCity?.name || searchedLabel || (targetPosition ? `${targetPosition[0]}, ${targetPosition[1]}` : locationContext.city)
  const activeLocationAddress =
    selectedListing?.addressResolved
      ? selectedListing.address
      : (!isBroadCityAnalysis && searchedLabel ? searchedLabel : '') ||
        selectedCity?.address ||
        `${locationContext.city}, ${locationContext.country}`
  const displayedAnalyzedAddress = isBroadCityAnalysis
    ? `${locationContext.city}, ${locationContext.country}`
    : selectedListing
      ? selectedListing.addressResolved
        ? selectedListing.address
        : copy.myListingsAddressPending
      : activeLocationAddress
  const normalizedAddress = activeLocationAddress.toLowerCase()
  const isPreciseAddress =
    /\d/.test(activeLocationAddress) ||
    normalizedAddress.includes('rue') ||
    normalizedAddress.includes('avenue') ||
    normalizedAddress.includes('boulevard') ||
    normalizedAddress.includes('street') ||
    normalizedAddress.includes('road')
  const analysisPrecisionMessage =
    isBroadCityAnalysis || !isPreciseAddress
      ? copy.analysisPrecisionMessage
      : ''
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' })
  const localAddressNeedle = `${locationContext.city} ${locationContext.country}`.toLowerCase()
  const matchesLocalArea = (text: string) => {
    const normalized = (text || '').toLowerCase()
    if (!normalized.trim()) return false
    return (
      normalized.includes(locationContext.city.toLowerCase()) ||
      normalized.includes(locationContext.country.toLowerCase()) ||
      normalized.includes(localAddressNeedle)
    )
  }
  const isWithinLocalRadius = (lat: number | null | undefined, lng: number | null | undefined) => {
    if (lat == null || lng == null) return false
    const [originLat, originLng] = targetPosition ?? [selectedCity?.lat ?? null, selectedCity?.lng ?? null]
    if (originLat == null || originLng == null) return false
    return haversineDistanceKm(originLat, originLng, lat, lng) <= MAX_LOCAL_EVENT_RADIUS_KM
  }

  const countryToCode: Record<string, string> = {
    france: 'FR',
    spain: 'ES',
    espagne: 'ES',
    italy: 'IT',
    italie: 'IT',
    germany: 'DE',
    allemagne: 'DE',
    belgium: 'BE',
    belgique: 'BE',
    england: 'GB',
    'united kingdom': 'GB',
    'royaume uni': 'GB',
    netherlands: 'NL',
    'pays-bas': 'NL',
    austria: 'AT',
    autriche: 'AT',
    portugal: 'PT',
    poland: 'PL',
    pologne: 'PL',
    greece: 'GR',
    grece: 'GR',
    turkey: 'TR',
    turquie: 'TR',
    switzerland: 'CH',
    suisse: 'CH',
    denmark: 'DK',
    danemark: 'DK',
    sweden: 'SE',
    suede: 'SE',
    'czech republic': 'CZ',
    tchequie: 'CZ',
    ireland: 'IE',
    irlande: 'IE',
    russia: 'RU',
    russie: 'RU',
    egypt: 'EG',
    egypte: 'EG',
    nigeria: 'NG',
    'south africa': 'ZA',
    'afrique du sud': 'ZA',
    brazil: 'BR',
    bresil: 'BR',
    argentina: 'AR',
    argentine: 'AR',
    mexico: 'MX',
    mexique: 'MX',
    'united states': 'US',
    'etats-unis': 'US',
    canada: 'CA',
    japan: 'JP',
    japon: 'JP',
    'south korea': 'KR',
    'coree du sud': 'KR',
    china: 'CN',
    chine: 'CN',
    singapore: 'SG',
    india: 'IN',
    inde: 'IN',
    australia: 'AU',
    australie: 'AU',
    'united arab emirates': 'AE',
    uae: 'AE',
  }

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshTick((v) => v + 1), 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const [lat, lng] = targetPosition ?? [48.8566, 2.3522]
    const year = new Date().getFullYear()

    const fetchLiveSources = async () => {
      const status: Record<string, 'connected' | 'missing_key' | 'error'> = {}
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max&timezone=auto`,
        )
        const weatherData = (await weatherRes.json()) as {
          daily?: { time?: string[]; weathercode?: number[]; temperature_2m_max?: number[] }
        }
        const weatherMap: Record<string, { weatherCode: number; tempMax: number }> = {}
        if (weatherData.daily?.time) {
          weatherData.daily.time.forEach((date, idx) => {
            weatherMap[date] = {
              weatherCode: weatherData.daily?.weathercode?.[idx] ?? 0,
              tempMax: weatherData.daily?.temperature_2m_max?.[idx] ?? 0,
            }
          })
        }
        setWeatherByDate(weatherMap)
      } catch {
        setWeatherByDate({})
      }

      try {
        const code = locationContext.countryCode || 'FR'
        const holidaysRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`)
        const holidays = (await holidaysRes.json()) as HolidayItem[]
        setLiveHolidays(Array.isArray(holidays) ? holidays : [])
      } catch {
        setLiveHolidays([])
      }

      try {
        const dateCounts: Record<string, number> = {}
        const conflictCounts: Record<string, number> = {}
        const typedSignals: Record<string, LiveSignalDay> = {}
        const total = 0

        status.NewsAPI = 'missing_key'
        status.NYT = 'missing_key'

        const ticketmasterKey = import.meta.env.VITE_TICKETMASTER_API_KEY as string | undefined
        if (ticketmasterKey) {
          const tmRes = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterKey}&size=50&sort=date,asc&countryCode=${locationContext.countryCode}`,
          )
          if (tmRes.ok) {
            status.Ticketmaster = 'connected'
            const tmData = (await tmRes.json()) as TicketmasterResponse
            for (const event of tmData._embedded?.events ?? []) {
              const venue = event._embedded?.venues?.[0] as
                | { city?: { name?: string }; location?: { latitude?: string; longitude?: string } }
                | undefined
              const lat = venue?.location?.latitude ? Number(venue.location.latitude) : null
              const lng = venue?.location?.longitude ? Number(venue.location.longitude) : null
              const venueCity = venue?.city?.name ?? ''
              if (!(isWithinLocalRadius(lat, lng) || matchesLocalArea(`${event.name ?? ''} ${venueCity}`))) continue
              const iso = event.dates?.start?.localDate
              if (!iso) continue
              if (!typedSignals[iso]) typedSignals[iso] = emptyLiveSignalDay()
              const category = (event.classifications?.[0]?.segment?.name ?? '').toLowerCase()
              const eventName = (event.name ?? '').trim()
              if (category.includes('sport')) {
                typedSignals[iso].sports += 2
                if (!typedSignals[iso].sources.includes('Ticketmaster')) typedSignals[iso].sources.push('Ticketmaster')
                if (eventName && typedSignals[iso].sportsLabels.length < 6)
                  typedSignals[iso].sportsLabels.push(`${runtimeText.matchOf} ${eventName}`)
              } else if (category.includes('music')) {
                typedSignals[iso].concerts += 2
                if (!typedSignals[iso].sources.includes('Ticketmaster')) typedSignals[iso].sources.push('Ticketmaster')
                if (eventName && typedSignals[iso].concertLabels.length < 6) typedSignals[iso].concertLabels.push(eventName)
              } else {
                typedSignals[iso].business += 1
                if (!typedSignals[iso].sources.includes('Ticketmaster')) typedSignals[iso].sources.push('Ticketmaster')
                if (eventName && typedSignals[iso].businessLabels.length < 6) typedSignals[iso].businessLabels.push(eventName)
              }
            }
          } else {
            status.Ticketmaster = 'error'
          }
        } else status.Ticketmaster = 'missing_key'

        const seatGeekClientId = import.meta.env.VITE_SEATGEEK_CLIENT_ID as string | undefined
        if (seatGeekClientId) {
          const sgRes = await fetch(
            `https://api.seatgeek.com/2/events?client_id=${seatGeekClientId}&per_page=50&sort=datetime_local.asc`,
          )
          if (sgRes.ok) {
            status.SeatGeek = 'connected'
            const sgData = (await sgRes.json()) as SeatgeekResponse
            for (const event of sgData.events ?? []) {
              const lat = typeof event.venue?.location?.lat === 'number' ? event.venue.location.lat : null
              const lng = typeof event.venue?.location?.lon === 'number' ? event.venue.location.lon : null
              const venueCity = event.venue?.city ?? ''
              if (!(isWithinLocalRadius(lat, lng) || matchesLocalArea(`${event.title ?? ''} ${venueCity}`))) continue
              const date = event.datetime_local?.slice(0, 10)
              if (!date) continue
              if (!typedSignals[date]) typedSignals[date] = emptyLiveSignalDay()
              const type = (event.type ?? '').toLowerCase()
              const title = (event.title ?? '').trim()
              if (type.includes('sport')) {
                typedSignals[date].sports += 2
                if (!typedSignals[date].sources.includes('SeatGeek')) typedSignals[date].sources.push('SeatGeek')
                if (title && typedSignals[date].sportsLabels.length < 6)
                  typedSignals[date].sportsLabels.push(`${runtimeText.matchOf} ${title}`)
              } else if (type.includes('concert') || type.includes('music')) {
                typedSignals[date].concerts += 2
                if (!typedSignals[date].sources.includes('SeatGeek')) typedSignals[date].sources.push('SeatGeek')
                if (title && typedSignals[date].concertLabels.length < 6) typedSignals[date].concertLabels.push(title)
              } else {
                typedSignals[date].business += 1
                if (!typedSignals[date].sources.includes('SeatGeek')) typedSignals[date].sources.push('SeatGeek')
                if (title && typedSignals[date].businessLabels.length < 6) typedSignals[date].businessLabels.push(title)
              }
            }
          } else {
            status.SeatGeek = 'error'
          }
        } else status.SeatGeek = 'missing_key'

        const predictHqToken = import.meta.env.VITE_PREDICTHQ_API_TOKEN as string | undefined
        if (predictHqToken) {
          const phqRes = await fetch('https://api.predicthq.com/v1/events/?limit=50&sort=start', {
            headers: { Authorization: `Bearer ${predictHqToken}` },
          })
          if (phqRes.ok) {
            status.PredictHQ = 'connected'
            const phqData = (await phqRes.json()) as PredictHQResponse
            for (const event of phqData.results ?? []) {
              const phqLat = Array.isArray(event.location) ? Number(event.location[1]) : null
              const phqLng = Array.isArray(event.location) ? Number(event.location[0]) : null
              if (!(isWithinLocalRadius(phqLat, phqLng) || matchesLocalArea(event.title ?? ''))) continue
              const date = event.start?.slice(0, 10)
              if (!date) continue
              if (!typedSignals[date]) typedSignals[date] = emptyLiveSignalDay()
              const category = (event.category ?? '').toLowerCase()
              const title = (event.title ?? '').trim()
              if (category.includes('sports')) {
                typedSignals[date].sports += 2
                if (!typedSignals[date].sources.includes('PredictHQ')) typedSignals[date].sources.push('PredictHQ')
                if (title && typedSignals[date].sportsLabels.length < 6)
                  typedSignals[date].sportsLabels.push(`${runtimeText.matchOf} ${title}`)
              } else if (category.includes('concerts') || category.includes('performing-arts')) {
                typedSignals[date].concerts += 2
                if (!typedSignals[date].sources.includes('PredictHQ')) typedSignals[date].sources.push('PredictHQ')
                if (title && typedSignals[date].concertLabels.length < 6) typedSignals[date].concertLabels.push(title)
              } else {
                typedSignals[date].business += 1
                if (!typedSignals[date].sources.includes('PredictHQ')) typedSignals[date].sources.push('PredictHQ')
                if (title && typedSignals[date].businessLabels.length < 6) typedSignals[date].businessLabels.push(title)
              }
            }
          } else {
            status.PredictHQ = 'error'
          }
        } else status.PredictHQ = 'missing_key'

        const eventbriteToken = import.meta.env.VITE_EVENTBRITE_API_TOKEN as string | undefined
        if (eventbriteToken) {
          const ebRes = await fetch(
            `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(
              locationContext.city,
            )}&expand=venue&sort_by=date`,
            { headers: { Authorization: `Bearer ${eventbriteToken}` } },
          )
          if (ebRes.ok) {
            status.Eventbrite = 'connected'
            const ebData = (await ebRes.json()) as EventbriteResponse
            for (const event of ebData.events ?? []) {
              const venue = event.venue as { address?: { city?: string }; latitude?: string; longitude?: string } | undefined
              const lat = venue?.latitude ? Number(venue.latitude) : null
              const lng = venue?.longitude ? Number(venue.longitude) : null
              const venueCity = venue?.address?.city ?? ''
              const eventName = event.name?.text ?? ''
              if (!(isWithinLocalRadius(lat, lng) || matchesLocalArea(`${eventName} ${venueCity}`))) continue
              const iso = normalizeIsoDate(event.start?.local ?? event.start?.utc)
              if (!iso) continue
              if (!typedSignals[iso]) typedSignals[iso] = emptyLiveSignalDay()
              typedSignals[iso].business += 2
              if (!typedSignals[iso].sources.includes('Eventbrite')) typedSignals[iso].sources.push('Eventbrite')
              const label = event.name?.text?.trim()
              if (label && typedSignals[iso].businessLabels.length < 8) typedSignals[iso].businessLabels.push(label)
            }
          } else {
            status.Eventbrite = 'error'
          }
        } else status.Eventbrite = 'missing_key'

        const bandsintownAppId = import.meta.env.VITE_BANDSINTOWN_APP_ID as string | undefined
        if (bandsintownAppId) {
          status.Bandsintown = 'connected'
          const artistHints = [locationContext.city, 'Coldplay', 'Taylor Swift', 'Drake']
          for (const artist of artistHints) {
            const biRes = await fetch(
              `https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?app_id=${bandsintownAppId}`,
            )
            if (!biRes.ok) {
              status.Bandsintown = 'error'
              continue
            }
            const biData = (await biRes.json()) as BandsintownEvent[]
            for (const event of biData ?? []) {
              const lat = typeof event.venue?.latitude === 'number' ? event.venue.latitude : null
              const lng = typeof event.venue?.longitude === 'number' ? event.venue.longitude : null
              const venueCity = event.venue?.city ?? ''
              if (!(isWithinLocalRadius(lat, lng) || matchesLocalArea(`${event.title ?? ''} ${venueCity}`))) continue
              const iso = normalizeIsoDate(event.datetime)
              if (!iso) continue
              if (!typedSignals[iso]) typedSignals[iso] = emptyLiveSignalDay()
              typedSignals[iso].concerts += 2
              if (!typedSignals[iso].sources.includes('Bandsintown')) typedSignals[iso].sources.push('Bandsintown')
              const label = event.title?.trim()
              if (label && typedSignals[iso].concertLabels.length < 8) typedSignals[iso].concertLabels.push(label)
            }
          }
        } else status.Bandsintown = 'missing_key'

        status.Songkick = 'missing_key'
        status.AllEvents = 'missing_key'

        const meetupToken = import.meta.env.VITE_MEETUP_API_TOKEN as string | undefined
        if (meetupToken) {
          const meetupRes = await fetch(`https://api.meetup.com/find/upcoming_events?query=${encodeURIComponent(locationContext.city)}`, {
            headers: { Authorization: `Bearer ${meetupToken}` },
          })
          if (meetupRes.ok) {
            status.Meetup = 'connected'
            const meetupData = (await meetupRes.json()) as MeetupResponse
            for (const event of meetupData.events ?? []) {
              const lat = event.venue?.lat ?? null
              const lng = event.venue?.lon ?? null
              if (!(isWithinLocalRadius(lat, lng) || matchesLocalArea(event.name ?? ''))) continue
              const iso = normalizeIsoDate(event.dateTime)
              if (!iso) continue
              if (!typedSignals[iso]) typedSignals[iso] = emptyLiveSignalDay()
              typedSignals[iso].business += 1
              if (!typedSignals[iso].sources.includes('Meetup')) typedSignals[iso].sources.push('Meetup')
              const label = event.name?.trim()
              if (label && typedSignals[iso].businessLabels.length < 8) typedSignals[iso].businessLabels.push(label)
            }
          } else {
            status.Meetup = 'error'
          }
        } else status.Meetup = 'missing_key'

        const feverToken = import.meta.env.VITE_FEVER_API_TOKEN as string | undefined
        const feverEndpoint = import.meta.env.VITE_FEVER_ENDPOINT as string | undefined
        if (feverToken && feverEndpoint) {
          const feverRes = await fetch(
            `${feverEndpoint}?city=${encodeURIComponent(locationContext.city)}&from=${encodeURIComponent(
              rangeStart,
            )}&to=${encodeURIComponent(rangeEnd)}`,
            {
              headers: { Authorization: `Bearer ${feverToken}` },
            },
          )
          if (feverRes.ok) {
            status.Fever = 'connected'
            const feverData = (await feverRes.json()) as { events?: Array<{ name?: string; start_time?: string; category?: string }> }
            for (const event of feverData.events ?? []) {
              const lat = (event as { venue?: { lat?: number } }).venue?.lat ?? null
              const lng = (event as { venue?: { lon?: number } }).venue?.lon ?? null
              if (!(isWithinLocalRadius(lat, lng) || matchesLocalArea(event.name ?? ''))) continue
              const iso = normalizeIsoDate(event.start_time)
              if (!iso) continue
              if (!typedSignals[iso]) typedSignals[iso] = emptyLiveSignalDay()
              const category = (event.category ?? '').toLowerCase()
              const label = (event.name ?? '').trim()
              if (category.includes('music') || category.includes('concert') || category.includes('show')) {
                typedSignals[iso].concerts += 2
                if (!typedSignals[iso].sources.includes('Fever')) typedSignals[iso].sources.push('Fever')
                if (label && typedSignals[iso].concertLabels.length < 8) typedSignals[iso].concertLabels.push(label)
              } else {
                typedSignals[iso].business += 1
                if (!typedSignals[iso].sources.includes('Fever')) typedSignals[iso].sources.push('Fever')
                if (label && typedSignals[iso].businessLabels.length < 8) typedSignals[iso].businessLabels.push(label)
              }
            }
          } else {
            status.Fever = 'error'
          }
        } else status.Fever = 'missing_key'

        const priceLabsApiKey = import.meta.env.VITE_PRICELABS_API_KEY as string | undefined
        const priceLabsEndpoint = import.meta.env.VITE_PRICELABS_ENDPOINT as string | undefined
        if (priceLabsApiKey && priceLabsEndpoint) {
          const plRes = await fetch(
            `${priceLabsEndpoint}?city=${encodeURIComponent(locationContext.city)}&country=${encodeURIComponent(
              locationContext.country,
            )}&start_date=${encodeURIComponent(rangeStart)}&end_date=${encodeURIComponent(rangeEnd)}`,
            {
              headers: {
                Authorization: `Bearer ${priceLabsApiKey}`,
              },
            },
          )
          if (plRes.ok) {
            status.PriceLabs = 'connected'
            const plData = (await plRes.json()) as PriceLabsResponse | Record<string, unknown>
            const candidateRows = [
              ...((plData as PriceLabsResponse).data ?? []),
              ...((plData as PriceLabsResponse).events ?? []),
              ...((plData as PriceLabsResponse).results ?? []),
              ...((Array.isArray((plData as { items?: unknown[] }).items) ? (plData as { items?: unknown[] }).items : []) as Array<
                Record<string, unknown>
              >),
            ] as Array<Record<string, unknown>>
            for (const row of candidateRows) {
              const rowLat = pickFirstNumber(row.lat, row.latitude, row.event_lat, row.venue_lat)
              const rowLng = pickFirstNumber(row.lng, row.lon, row.longitude, row.event_lng, row.venue_lng)
              const rowNameForLocal = pickFirstString(row.event_name, row.name, row.title, row.description, row.city)
              if (!(isWithinLocalRadius(rowLat, rowLng) || matchesLocalArea(rowNameForLocal))) continue
              const iso = normalizeIsoDate(
                pickFirstString(
                  row.date,
                  row.event_date,
                  row.start_date,
                  row.check_in_date,
                  row.day,
                  row.start,
                  row.datetime,
                ),
              )
              if (!iso) continue
              if (!typedSignals[iso]) typedSignals[iso] = emptyLiveSignalDay()
              if (!typedSignals[iso].sources.includes('PriceLabs')) typedSignals[iso].sources.push('PriceLabs')

              const eventType = pickFirstString(row.event_type, row.type, row.category, row.event_category).toLowerCase()
              const name = pickFirstString(row.event_name, row.name, row.title, row.description)
              const demandIndex = pickFirstNumber(row.demand_index, row.demand, row.score, row.demandScore, row.multiplier)
              const demandBoost = demandIndex && demandIndex > 0 ? Math.min(5, Math.max(1, Math.round(demandIndex / 20))) : 1

              if (eventType.includes('sport')) {
                typedSignals[iso].sports += demandBoost
                if (name && typedSignals[iso].sportsLabels.length < 8)
                  typedSignals[iso].sportsLabels.push(`${runtimeText.matchOf} ${name}`)
              } else if (eventType.includes('concert') || eventType.includes('music')) {
                typedSignals[iso].concerts += demandBoost
                if (name && typedSignals[iso].concertLabels.length < 8) typedSignals[iso].concertLabels.push(name)
              } else {
                typedSignals[iso].business += demandBoost
                if (name && typedSignals[iso].businessLabels.length < 8) typedSignals[iso].businessLabels.push(name)
              }
            }
          } else {
            status.PriceLabs = 'error'
          }
        } else status.PriceLabs = 'missing_key'

        const globalSignals: Record<string, { worldAlerts: number; labels: string[] }> = {}

        setNewsByDate(dateCounts)
        setConflictByDate(conflictCounts)
        setNewsHotspotScore(total)
        setLiveSignalsByDate(typedSignals)
        setGlobalLiveByDate(globalSignals)
        setProviderStatus(status)
      } catch {
        setNewsByDate({})
        setConflictByDate({})
        setNewsHotspotScore(0)
        setLiveSignalsByDate({})
        setGlobalLiveByDate({})
        setProviderStatus(status)
      }
    }

    fetchLiveSources()
  }, [locationContext.city, locationContext.country, locationContext.countryCode, targetPosition, refreshTick, rangeEnd, rangeStart])

  const monthlyCalendar = useMemo(() => {
    const seed = Math.abs(Math.round((targetPosition?.[0] ?? selectedCity?.lat ?? 48.8566) * 100))
    const startMonthDate = new Date()
    startMonthDate.setDate(1)
    return Array.from({ length: 60 }, (_, monthOffset) => {
      const monthDate = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + monthOffset, 1)
      const year = monthDate.getFullYear()
      const monthIndex = monthDate.getMonth()
      const firstDay = new Date(year, monthIndex, 1)
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      const jsStartDay = firstDay.getDay() // 0 Sunday
      const startOffset = jsStartDay === 0 ? 6 : jsStartDay - 1 // Monday first
      const monthName = `${monthFormatter.format(firstDay).charAt(0).toUpperCase() + monthFormatter.format(firstDay).slice(1)} ${year}`
      const cells: Array<IntelCalendarCell | null> = []

      for (let i = 0; i < startOffset; i += 1) cells.push(null)

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, monthIndex, day)
        const dow = date.getDay()
        const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isWeekend = dow === 0 || dow === 6
        const holiday = liveHolidays.find((h) => h.date === isoDate)
        const weather = weatherByDate[isoDate]
        const liveNewsCount = newsByDate[isoDate] ?? 0
        const liveConflictCount = conflictByDate[isoDate] ?? 0
        const liveSignals = liveSignalsByDate[isoDate] ?? {
          concerts: 0,
          sports: 0,
          business: 0,
          sources: [],
          concertLabels: [],
          sportsLabels: [],
          businessLabels: [],
        }
        const hasPriceLabsSignal = liveSignals.sources.includes('PriceLabs')
        const globalLive = globalLiveByDate[isoDate] ?? { worldAlerts: 0, labels: [] }
        const severeWeather = weather ? [95, 96, 99, 65, 66, 67].includes(weather.weatherCode) : false
        const heatWave = weather ? weather.tempMax >= 32 : false
        const isPeakWeekend = isWeekend && ((seed + day + monthIndex) % 3 === 0)
        const isWeekendLift = isWeekend && ((seed + day + monthIndex) % 2 === 0)
        const isFriday = dow === 5
        const isMonday = dow === 1
        const isSummer = [5, 6, 7, 8].includes(monthIndex)
        const isWinter = [11, 0, 1, 2].includes(monthIndex)
        const schoolHolidayRange = frenchSchoolHolidayRanges.find((range) => isoDate >= range.start && isoDate <= range.end)
        const activeCityKey = (selectedCity?.name || locationContext.city || '').toLowerCase()
        const activeLocationKey = `${activeLocationLabel} ${locationContext.city} ${locationContext.country}`.toLowerCase()
        const isCoastalMarket = includesAny(activeLocationKey, COASTAL_MARKERS)
        const isSkiMarket = includesAny(activeLocationKey, SKI_MARKERS)
        const citySeasonalityBoost = structuralCitySeasonalityBoost(activeLocationKey, monthIndex)
        const namedEvent = namedEventRanges.find(
          (range) =>
            isoDate >= range.start &&
            isoDate <= range.end &&
            (!range.city || activeCityKey.includes(range.city) || activeLocationLabel.toLowerCase().includes(range.city)),
        )
        const schoolHolidayFromPublicHoliday = holiday
          ? /(school|vacances scolaires|spring break|autumn break|winter break|summer break)/i.test(
              `${holiday.localName} ${holiday.name}`,
            )
          : false
        const hasSchoolHoliday = Boolean(schoolHolidayRange) || schoolHolidayFromPublicHoliday
        const previousIso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Math.max(1, day - 1)).padStart(2, '0')}`
        const nextIso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Math.min(daysInMonth, day + 1)).padStart(2, '0')}`
        const previousHoliday = liveHolidays.find((h) => h.date === previousIso)
        const nextHoliday = liveHolidays.find((h) => h.date === nextIso)
        const isLongWeekend = (isFriday && nextHoliday) || (isMonday && previousHoliday)

        const reasons: string[] = []
        let bump = 2
        let structuralBump = 0
        let eventDrivenBump = 0

        if (holiday) {
          reasons.push(`${runtimeText.officialHoliday}: ${holiday.localName || holiday.name}`)
          bump += 8
          eventDrivenBump += 8
        }
        if (hasPriceLabsSignal) {
          reasons.push(runtimeText.priceLabsSignal)
          bump += 4
          eventDrivenBump += 4
        }
        if (namedEvent) {
          reasons.push(`${runtimeText.confirmedEvent}: ${namedEvent.label}`)
          bump += 7
          eventDrivenBump += 7
        }
        if (hasSchoolHoliday) {
          reasons.push(`${runtimeText.schoolHolidaysActive}: ${schoolHolidayRange?.label ?? runtimeText.schoolHolidayPeriodActive}`)
          bump += 5
          structuralBump += 5
        }
        if (isLongWeekend) {
          reasons.push(runtimeText.threeDayWeekend)
          bump += 8
          eventDrivenBump += 8
        }
        if (isCoastalMarket && isSummer) {
          reasons.push(runtimeText.coastalSummer)
          bump += isWeekend ? 9 : 6
          structuralBump += isWeekend ? 9 : 6
        }
        if (isSkiMarket && isWinter) {
          reasons.push(runtimeText.skiWinter)
          bump += hasSchoolHoliday || isWeekend ? 10 : 6
          structuralBump += hasSchoolHoliday || isWeekend ? 10 : 6
        }
        if (citySeasonalityBoost > 0) {
          reasons.push(runtimeText.tourismSeasonality)
          bump += citySeasonalityBoost
          structuralBump += citySeasonalityBoost
        }
        if (liveSignals.concerts >= 3) {
          reasons.push(
            liveSignals.concertLabels[0]
              ? `${runtimeText.concertConfirmed}: ${liveSignals.concertLabels[0]} (${liveSignals.concerts} ${runtimeText.signals})`
              : `${runtimeText.concertLiveDetected} (${liveSignals.concerts} ${runtimeText.signals})`,
          )
          bump += 7
          eventDrivenBump += 7
        }
        if (liveSignals.sports >= 3) {
          reasons.push(
            liveSignals.sportsLabels[0]
              ? `${liveSignals.sportsLabels[0]} (${liveSignals.sports} ${runtimeText.matchSignals})`
              : `${runtimeText.sportsMajorDetected} - ${liveSignals.sports} ${runtimeText.signals}`,
          )
          bump += 6
          eventDrivenBump += 6
        }
        if (liveSignals.business >= 3) {
          reasons.push(
            liveSignals.businessLabels[0]
              ? `${runtimeText.businessConference}: ${liveSignals.businessLabels[0]} (${liveSignals.business} ${runtimeText.signals})`
              : `${runtimeText.businessInCity} (${liveSignals.business} ${runtimeText.signals})`,
          )
          bump += 4
          eventDrivenBump += 4
        }
        if (liveNewsCount >= 8) {
          reasons.push(`${runtimeText.localActivityHigh}: ${liveNewsCount} ${runtimeText.articlesDetectedToday}`)
          bump += 5
          eventDrivenBump += 5
        } else if (liveNewsCount >= 4) {
          reasons.push(`${runtimeText.localActivityUp}: ${liveNewsCount} ${runtimeText.articlesDetectedToday}`)
          bump += 3
          eventDrivenBump += 3
        }
        if (liveConflictCount >= 6) {
          reasons.push(`${runtimeText.geopoliticalHigh}: ${liveConflictCount} ${runtimeText.conflictSignalsDemandDown}`)
          bump -= 14
        } else if (liveConflictCount >= 3) {
          reasons.push(`${runtimeText.geopoliticalMedium}: ${liveConflictCount} ${runtimeText.conflictSignalsDemandPressure}`)
          bump -= 8
        } else if (liveConflictCount >= 1) {
          reasons.push(`${runtimeText.geopoliticalTension}: ${liveConflictCount} ${runtimeText.signalSingle}`)
          bump -= 3
        }
        if (severeWeather) {
          reasons.push(
            `${runtimeText.weatherAlert}: code ${weather?.weatherCode ?? 'N/A'} / max ${Math.round(weather?.tempMax ?? 0)}C`,
          )
          bump += 2
          eventDrivenBump += 2
        } else if (heatWave) {
          reasons.push(`${runtimeText.heatWave}: ${Math.round(weather?.tempMax ?? 0)}C max`)
          bump += 2
          structuralBump += 2
        }
        if (isSkiMarket && isWinter && weather && weather.tempMax <= 1) {
          reasons.push(`${runtimeText.skiCold}: ${Math.round(weather.tempMax)}C max`)
          bump += 4
          structuralBump += 4
        }
        if (isPeakWeekend || isWeekendLift) {
          if (namedEvent) {
            reasons.push(`${runtimeText.weekendImpactedBy}: ${namedEvent.label}`)
            bump += 4
            eventDrivenBump += 4
          } else if (liveSignals.concertLabels[0]) {
            reasons.push(`${runtimeText.weekendImpactedBy}: ${liveSignals.concertLabels[0]}`)
            bump += 4
            eventDrivenBump += 4
          } else if (liveSignals.sportsLabels[0]) {
            reasons.push(`${runtimeText.weekendImpactedBy}: ${liveSignals.sportsLabels[0]}`)
            bump += 4
            eventDrivenBump += 4
          } else {
            reasons.push(runtimeText.weekendEffect)
            bump += 3
            structuralBump += 3
          }
        }
        if (newsHotspotScore >= 60 && (seed + day + monthIndex) % 5 === 0) {
          reasons.push(`${runtimeText.localContextDynamic} (${newsHotspotScore} ${runtimeText.recentArticles})`)
          bump += 2
          eventDrivenBump += 2
        }
        if (globalLive.worldAlerts >= 10) {
          reasons.push(
            globalLive.labels[0]
              ? `${runtimeText.worldSignalLive}: ${globalLive.labels[0]}`
              : `${runtimeText.worldSignalLive}: ${globalLive.worldAlerts} ${runtimeText.activitiesDetected}`,
          )
          bump += 3
          eventDrivenBump += 3
        }

        const sourceCount = new Set(liveSignals.sources).size
        const dynamicMultiplier = pricingMode === 'ultra' ? 1.35 + Math.min(0.55, sourceCount * 0.08) : 1
        let cappedBump =
          pricingMode === 'ultra'
            ? Math.max(-35, Math.min(55, Math.round(bump * dynamicMultiplier)))
            : Math.max(-20, Math.min(25, bump))
        // Guardrails: structural seasonality alone should not become ultra-red.
        if (pricingMode === 'ultra' && eventDrivenBump < 8) cappedBump = Math.min(cappedBump, 28)
        if (pricingMode === 'ultra' && eventDrivenBump < 5 && structuralBump >= 10) cappedBump = Math.min(cappedBump, 24)
        const level: 'low' | 'medium' | 'high' =
          cappedBump >= (pricingMode === 'ultra' ? 18 : 12)
            ? 'high'
            : cappedBump >= (pricingMode === 'ultra' ? 10 : 7)
              ? 'medium'
              : 'low'
        const reasonsLabel = reasons.length > 0 ? reasons.join(' | ') : runtimeText.standardDemand
        const sourceLabel = liveSignals.sources.length > 0 ? ` [sources: ${liveSignals.sources.join(', ')}]` : ''
        const actionLabel = cappedBump >= 0 ? runtimeText.increasePricesBy : runtimeText.lowerPricesBy
        const isBooked = selectedListing ? bookedDateSetBySelectedListing.has(isoDate) : true
        const isEmptyGap = selectedListing ? !isBooked : false
        const event = `${reasonsLabel} - ${activeLocationAddress} - ${actionLabel} ${Math.abs(cappedBump)}%${
          isEmptyGap ? ` | ${runtimeText.emptyGapDetected}` : ''
        }${sourceLabel}`
        const confidenceScore = Math.max(
          35,
          Math.min(97, 42 + sourceCount * 9 + Math.min(18, liveSignals.concerts + liveSignals.sports + liveSignals.business)),
        )
        const demandScore = Math.max(0, Math.min(100, 50 + cappedBump))
        const adrBase = selectedCity ? 120 + (Math.abs(selectedCity.lat) % 12) * 4 : 110
        const forecastAdr = Math.max(55, Math.round(adrBase * (1 + cappedBump / 100)))
        const forecastOccupancy = Math.max(28, Math.min(96, Math.round(54 + cappedBump * 0.9)))
        const forecastRevpar = Number(((forecastAdr * forecastOccupancy) / 100).toFixed(1))
        const pickup7d = Number((Math.max(0.3, Math.min(4.8, 1.2 + cappedBump / 18 + sourceCount * 0.15))).toFixed(1))
        const pickup30d = Number((Math.max(0.6, Math.min(8.4, 2.5 + cappedBump / 12 + sourceCount * 0.25))).toFixed(1))
        const priceFloor = Math.max(45, Math.round(forecastAdr * 0.82))
        const priceCeiling = Math.max(priceFloor + 15, Math.round(forecastAdr * 1.22))
        const riskLevel: 'low' | 'medium' | 'high' =
          confidenceScore >= 78 ? 'low' : confidenceScore >= 62 ? 'medium' : 'high'
        const actionTag: 'raise' | 'hold' | 'lower' = cappedBump >= 7 ? 'raise' : cappedBump <= -5 ? 'lower' : 'hold'
        const bookingProbabilityPct = Math.max(
          8,
          Math.min(
            96,
            Math.round(
              24 +
                confidenceScore * 0.42 +
                demandScore * 0.36 +
                (isEmptyGap ? 6 : 0) -
                Math.max(0, cappedBump - 25) * 0.8,
            ),
          ),
        )
        const expectedRevenueDeltaPct = Number((cappedBump * (bookingProbabilityPct / 100)).toFixed(1))
        const landingStep: 'hold' | 'soft_drop' | 'hard_drop' =
          bookingProbabilityPct < 38 ? 'hard_drop' : bookingProbabilityPct < 55 ? 'soft_drop' : 'hold'
        cells.push({
          day,
          isoDate,
          level,
          event,
          recommendedPct: cappedBump,
          confidenceScore,
          demandScore,
          signalCount: sourceCount,
          forecastAdr,
          forecastOccupancy,
          forecastRevpar,
          pickup7d,
          pickup30d,
          priceFloor,
          priceCeiling,
          riskLevel,
          actionTag,
          isBooked,
          isEmptyGap,
          bookingProbabilityPct,
          expectedRevenueDeltaPct,
          landingStep,
        })
      }

      return {
        key: `${year}-${monthIndex}`,
        monthName,
        cells,
      }
    })
  }, [
    activeLocationAddress,
    activeLocationLabel,
    locale,
    liveHolidays,
    liveSignalsByDate,
    monthFormatter,
    newsByDate,
    conflictByDate,
    newsHotspotScore,
    pricingMode,
    globalLiveByDate,
    selectedCity,
    targetPosition,
    weatherByDate,
    selectedListing,
    bookedDateSetBySelectedListing,
  ])
  const displayedMonth = monthlyCalendar[selectedMonthIndex] ?? monthlyCalendar[0]
  const rangeFilteredMonths = monthlyCalendar
    .map((month) => ({
      ...month,
      cells: month.cells.map((cell) => {
        if (!cell) return null
        if (cell.isoDate < rangeStart || cell.isoDate > rangeEnd) return null
        return cell
      }),
    }))
    .filter((month) => month.cells.some(Boolean))
  const monthlyWatchSummary = useMemo(() => {
    const cells = displayedMonth.cells.filter((cell): cell is IntelCalendarCell => Boolean(cell))
    const highDays = cells.filter((cell) => cell.level === 'high').length
    const mediumDays = cells.filter((cell) => cell.level === 'medium').length
    const lowDays = cells.filter((cell) => cell.level === 'low').length
    const hasConcert = cells.some((cell) => cell.event.toLowerCase().includes('concert'))
    const hasSports = cells.some(
      (cell) =>
        cell.event.toLowerCase().includes('match') ||
        cell.event.toLowerCase().includes('sport') ||
        cell.event.toLowerCase().includes('f1'),
    )
    const hasSchoolHoliday = cells.some((cell) => cell.event.toLowerCase().includes('vacances scolaires'))
    const hasConflictRisk = cells.some((cell) => cell.event.toLowerCase().includes('geopolitique'))
    const hasStrongWeather = cells.some(
      (cell) => cell.event.toLowerCase().includes('alerte meteo') || cell.event.toLowerCase().includes('chaleur'),
    )

    const lines: string[] = []
    lines.push(
      runtimeText.summaryIntro
        .replace('{month}', displayedMonth.monthName)
        .replace('{address}', displayedAnalyzedAddress)
        .replace('{high}', String(highDays))
        .replace('{medium}', String(mediumDays))
        .replace('{low}', String(lowDays)),
    )
    if (hasSchoolHoliday) {
      lines.push(runtimeText.summarySchool)
    }
    if (hasConcert || hasSports) {
      const eventsLabel = `${hasConcert ? runtimeText.summaryEventsConcerts : ''}${hasConcert && hasSports ? runtimeText.and : ''}${hasSports ? runtimeText.summaryEventsSports : ''}`
      lines.push(
        runtimeText.summaryEvents.replace('{events}', eventsLabel),
      )
    }
    if (hasStrongWeather) {
      lines.push(runtimeText.summaryWeather)
    }
    if (hasConflictRisk) {
      lines.push(runtimeText.summaryGeo)
    }
    lines.push(runtimeText.summaryTip)
    return lines
  }, [displayedMonth, displayedAnalyzedAddress, locale])

  const monthConcreteInsights = useMemo(() => {
    const cells = displayedMonth.cells.filter((cell): cell is IntelCalendarCell => Boolean(cell))
    const avgRecommendedPct =
      cells.length > 0 ? Number((cells.reduce((sum, cell) => sum + cell.recommendedPct, 0) / cells.length).toFixed(1)) : 0
    const avgConfidence =
      cells.length > 0 ? Number((cells.reduce((sum, cell) => sum + cell.confidenceScore, 0) / cells.length).toFixed(0)) : 0
    const avgDemandScore =
      cells.length > 0 ? Number((cells.reduce((sum, cell) => sum + cell.demandScore, 0) / cells.length).toFixed(0)) : 0
    const signalPoints = cells.reduce((sum, cell) => sum + cell.signalCount, 0)
    const topUp = [...cells].sort((a, b) => b.recommendedPct - a.recommendedPct)[0] ?? null
    const topDown = [...cells].sort((a, b) => a.recommendedPct - b.recommendedPct)[0] ?? null
    const topDownEffective = topDown && topDown.recommendedPct < 0 ? topDown : null
    return {
      avgRecommendedPct,
      avgConfidence,
      avgDemandScore,
      signalPoints,
      topUp,
      topDown: topDownEffective,
    }
  }, [displayedMonth])

  const advancedPricingInsights = useMemo(() => {
    const cells = displayedMonth.cells.filter((cell): cell is IntelCalendarCell => Boolean(cell))
    if (cells.length === 0) {
      return {
        adr: 0,
        occ: 0,
        revpar: 0,
        pickup7d: 0,
        pickup30d: 0,
        priceFloor: 0,
        priceCeiling: 0,
        compsetGapPct: 0,
        anomalies: [] as string[],
        topAction: 'hold' as 'raise' | 'hold' | 'lower',
        riskLevel: 'medium' as 'low' | 'medium' | 'high',
      }
    }
    const avg = <T extends number>(arr: T[]) => arr.reduce((s, v) => s + v, 0) / Math.max(1, arr.length)
    const adr = Math.round(avg(cells.map((c) => c.forecastAdr)))
    const occ = Number(avg(cells.map((c) => c.forecastOccupancy)).toFixed(1))
    const revpar = Number(avg(cells.map((c) => c.forecastRevpar)).toFixed(1))
    const pickup7d = Number(avg(cells.map((c) => c.pickup7d)).toFixed(1))
    const pickup30d = Number(avg(cells.map((c) => c.pickup30d)).toFixed(1))
    const priceFloor = Math.round(avg(cells.map((c) => c.priceFloor)))
    const priceCeiling = Math.round(avg(cells.map((c) => c.priceCeiling)))

    // Simule un compset micro-zone à partir de la même zone + volatilité locale.
    const compsetAdr = adr * (1 + ((activeLocationAddress.length % 9) - 4) / 100)
    const compsetGapPct = Number((((adr - compsetAdr) / Math.max(1, compsetAdr)) * 100).toFixed(1))

    const anomalies: string[] = []
    if (pickup30d < 2.2) anomalies.push('pickup_30d_faible')
    if (occ < 58) anomalies.push('occupation_previsionnelle_faible')
    if (compsetGapPct < -6) anomalies.push('adr_sous_compset')
    if (cells.filter((c) => c.riskLevel === 'high').length >= 6) anomalies.push('volatilite_signaux_elevee')

    const avgReco = avg(cells.map((c) => c.recommendedPct))
    const topAction: 'raise' | 'hold' | 'lower' = avgReco >= 6 ? 'raise' : avgReco <= -4 ? 'lower' : 'hold'
    const avgConfidence = avg(cells.map((c) => c.confidenceScore))
    const riskLevel: 'low' | 'medium' | 'high' = avgConfidence >= 78 ? 'low' : avgConfidence >= 62 ? 'medium' : 'high'
    const eventQualityScore = Math.min(
      100,
      Math.max(0, Math.round((avg(cells.map((c) => c.signalCount)) * 20 + avg(cells.map((c) => c.demandScore)) * 0.55))),
    )
    const bookingProbability = Number(avg(cells.map((c) => c.bookingProbabilityPct)).toFixed(1))
    const expectedRevenueDeltaPct = Number(avg(cells.map((c) => c.expectedRevenueDeltaPct)).toFixed(1))
    const landingDistribution = cells.reduce(
      (acc, c) => {
        acc[c.landingStep] += 1
        return acc
      },
      { hold: 0, soft_drop: 0, hard_drop: 0 },
    )
    const dominantLanding: 'hold' | 'soft_drop' | 'hard_drop' =
      landingDistribution.hard_drop >= landingDistribution.soft_drop && landingDistribution.hard_drop >= landingDistribution.hold
        ? 'hard_drop'
        : landingDistribution.soft_drop >= landingDistribution.hold
          ? 'soft_drop'
          : 'hold'
    const confidenceAdr = Math.min(98, Math.max(45, Math.round(avgConfidence * 0.92 + Math.min(14, cells.length / 3))))
    const confidenceOcc = Math.min(98, Math.max(42, Math.round(avgConfidence * 0.88 + Math.min(16, cells.length / 2.5))))
    const confidenceEvents = Math.min(98, Math.max(35, Math.round(eventQualityScore * 0.9 + Math.min(12, cells.length / 4))))
    const backtestScore = Math.max(
      35,
      Math.min(
        97,
        Math.round(
          confidenceAdr * 0.34 +
            confidenceOcc * 0.34 +
            confidenceEvents * 0.22 +
            Math.max(0, 100 - Math.abs(expectedRevenueDeltaPct - avg(cells.map((c) => c.recommendedPct)))) * 0.1,
        ),
      ),
    )

    return {
      adr,
      occ,
      revpar,
      pickup7d,
      pickup30d,
      priceFloor,
      priceCeiling,
      compsetGapPct,
      anomalies,
      topAction,
      riskLevel,
      bookingProbability,
      expectedRevenueDeltaPct,
      dominantLanding,
      eventQualityScore,
      confidenceAdr,
      confidenceOcc,
      confidenceEvents,
      backtestScore,
    }
  }, [displayedMonth, activeLocationAddress])

  const phase1MarketEdge = useMemo(() => {
    const cells = displayedMonth.cells.filter((cell): cell is IntelCalendarCell => Boolean(cell))
    if (cells.length === 0) {
      return {
        compsetAdr: 0,
        compsetOcc: 0,
        pickupPressureScore: 0,
        expectedNetMarginUpliftPct: 0,
        recommendation: runtimeText.phase1RecoBalanced,
      }
    }
    const avg = (values: number[]) => values.reduce((s, v) => s + v, 0) / Math.max(1, values.length)
    const adr = avg(cells.map((c) => c.forecastAdr))
    const occ = avg(cells.map((c) => c.forecastOccupancy))
    const compsetAdr = Number((adr * (1 + ((activeLocationAddress.length % 11) - 5) / 100)).toFixed(1))
    const compsetOcc = Number((occ * (1 + ((activeLocationAddress.length % 7) - 3) / 120)).toFixed(1))

    // Pickup pressure = cadence court terme + trous calendrier + signaux marché.
    const pickupNear = avg(cells.map((c) => c.pickup7d))
    const gapRatio = cells.filter((c) => c.isEmptyGap).length / Math.max(1, cells.length)
    const signalStrength = avg(cells.map((c) => c.signalCount * 10 + c.demandScore * 0.5))
    const pickupPressureScore = Math.max(
      0,
      Math.min(100, Number((pickupNear * 12 + signalStrength * 0.45 - gapRatio * 22).toFixed(1))),
    )

    // Expected net uplift: pricing edge vs compset * conversion proxy.
    const pricingEdgePct = ((adr - compsetAdr) / Math.max(1, compsetAdr)) * 100
    const conversionProxy = avg(cells.map((c) => c.bookingProbabilityPct)) / 100
    const expectedNetMarginUpliftPct = Number((pricingEdgePct * 0.6 + conversionProxy * 18 + (pickupPressureScore - 50) * 0.15).toFixed(1))

    let recommendation = runtimeText.phase1RecoBalanced
    if (pickupPressureScore >= 68 && expectedNetMarginUpliftPct >= 8) recommendation = runtimeText.phase1RecoAggressive
    else if (pickupPressureScore <= 45 || expectedNetMarginUpliftPct <= 2) recommendation = runtimeText.phase1RecoDefensive

    return {
      compsetAdr,
      compsetOcc: Number(compsetOcc.toFixed(1)),
      pickupPressureScore,
      expectedNetMarginUpliftPct,
      recommendation,
    }
  }, [
    displayedMonth,
    activeLocationAddress,
    runtimeText.phase1RecoAggressive,
    runtimeText.phase1RecoBalanced,
    runtimeText.phase1RecoDefensive,
  ])

  useEffect(() => {
    const cells = displayedMonth.cells.filter((cell): cell is IntelCalendarCell => Boolean(cell))
    const highEvents = cells
      .filter((cell) => cell.level === 'high')
      .slice(0, 8)
      .map((cell) => ({
        date: cell.isoDate,
        event: cell.event,
      }))
    const payload = {
      updatedAtIso: new Date().toISOString(),
      monthLabel: displayedMonth.monthName,
      analyzedAddress: displayedAnalyzedAddress,
      summaryLines: monthlyWatchSummary,
      highEvents,
    }
    writeScopedStorage(LS_WATCH_INTEL_SUMMARY, JSON.stringify(payload))
  }, [displayedAnalyzedAddress, displayedMonth, monthlyWatchSummary])

  const onSearch = async (e: FormEvent) => {
    e.preventDefault()
    const value = query.trim()
    if (!value) return

    const coords = value.split(',').map((v) => Number(v.trim()))
    const hasCoordSearch = coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])
    const queryLooksLikePreciseAddress =
      /\d/.test(value) ||
      /(rue|avenue|boulevard|street|road|lane|chemin|impasse|place)/i.test(value)
    if (hasCoordSearch) {
      setTargetPosition([coords[0], coords[1]])
      setSearchError('')
      setSelectedListingId(null)
      setSelectedCityId(null)
      setIsBroadCityAnalysis(false)
      setSearchedLabel(`${coords[0]}, ${coords[1]}`)
      setLocationContext((prev) => ({ ...prev, city: `${coords[0]}, ${coords[1]}` }))
      return
    }

    // Fallback local: match known cities/listings first
    const localMatch = cities.find(
      (city) =>
        city.name.toLowerCase().includes(value.toLowerCase()) ||
        city.address.toLowerCase().includes(value.toLowerCase()),
    )
    if (localMatch) {
      setTargetPosition([localMatch.lat, localMatch.lng])
      setSearchError('')
      setSelectedListingId(null)
      setSelectedCityId(localMatch.id)
      setIsBroadCityAnalysis(!queryLooksLikePreciseAddress && value.toLowerCase() === localMatch.name.toLowerCase())
      setSearchedLabel(localMatch.name)
      const code = countryToCode[localMatch.country.toLowerCase()] ?? 'FR'
      setLocationContext({ city: localMatch.name, country: localMatch.country, countryCode: code })
      return
    }

    setIsSearching(true)
    setSearchError('')
    try {
      // Provider 1: Nominatim (OSM)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
          value,
        )}`,
      )
      const results = (await response.json()) as Array<{
        lat: string
        lon: string
        address?: { city?: string; town?: string; village?: string; country?: string }
      }>
      if (results.length > 0) {
        const lat = Number(results[0].lat)
        const lng = Number(results[0].lon)
        setTargetPosition([lat, lng])
        setSearchedLabel(value)
        setSelectedListingId(null)
        setSelectedCityId(null)
        const city = results[0].address?.city || results[0].address?.town || results[0].address?.village || value
        const country = results[0].address?.country || 'France'
        const code = countryToCode[country.toLowerCase()] ?? 'FR'
        setLocationContext({ city, country, countryCode: code })
        setIsBroadCityAnalysis(!queryLooksLikePreciseAddress && value.toLowerCase() === city.toLowerCase())
        return
      }

      // Provider 2 fallback: maps.co (Nominatim mirror)
      const fallbackResponse = await fetch(
        `https://geocode.maps.co/search?q=${encodeURIComponent(value)}&limit=1`,
      )
      const fallbackResults = (await fallbackResponse.json()) as Array<{ lat: string; lon: string }>
      if (fallbackResults.length > 0) {
        const lat = Number(fallbackResults[0].lat)
        const lng = Number(fallbackResults[0].lon)
        setTargetPosition([lat, lng])
        setSearchedLabel(value)
        setSelectedListingId(null)
        setSelectedCityId(null)
        setLocationContext((prev) => ({ ...prev, city: value }))
        setIsBroadCityAnalysis(!queryLooksLikePreciseAddress)
        return
      }

      setSearchError(copy.mapError)
    } catch {
      setSearchError(copy.mapError)
    } finally {
      setIsSearching(false)
    }
  }

  const onCalendarDayEnter = (date: string, event: string) => {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current)
      hoverClearTimer.current = null
    }
    setHoveredDayEvent({ date, event })
  }

  const onCalendarDayLeave = () => {
    if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current)
    hoverClearTimer.current = setTimeout(() => setHoveredDayEvent(null), 120)
  }

  useEffect(() => {
    return () => {
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current)
    }
  }, [])

  useEffect(() => {
    const onConnectionsUpdated = () => setConnectedListVersion((v) => v + 1)
    window.addEventListener('sm-connections-updated', onConnectionsUpdated)
    return () => window.removeEventListener('sm-connections-updated', onConnectionsUpdated)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const changed = await enrichReservationAccessAddressesFromIcal()
      if (!cancelled && changed) setConnectedListVersion((v) => v + 1)
    })()
    return () => {
      cancelled = true
    }
  }, [connectedListVersion])

  return (
    <section className="min-h-screen flex-1 bg-white px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabIntel}</h1>
        <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-pm-sm sm:p-5">
          <form onSubmit={onSearch}>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">{copy.searchLabel}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-xl bg-[#4a86f7] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
              >
                {copy.searchAction}
              </button>
            </div>
          </form>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
            <MapContainer
              center={[48.5, 8.5]}
              zoom={2}
              scrollWheelZoom
              minZoom={2}
              maxZoom={16}
              className="europe-map h-[320px] w-full sm:h-[440px]"
            >
              <TileLayer
                attribution={
                  useSatelliteFallback
                    ? '&copy; OpenStreetMap contributors'
                    : '&copy; NASA Earth Observatory'
                }
                url={
                  useSatelliteFallback
                    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    : 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg'
                }
                className="europe-night-tiles"
                eventHandlers={{
                  tileerror: () => {
                    setUseSatelliteFallback(true)
                  },
                }}
              />
              <FlyToLocation target={targetPosition} />
              <MapResizer />
              {cities.map((city) => (
                <CircleMarker
                  key={city.id}
                  center={[city.lat, city.lng]}
                  radius={selectedCity?.id === city.id ? 6 : 4}
                  pathOptions={{
                    color: selectedCity?.id === city.id ? '#1e3a8a' : '#dbeafe',
                    weight: 1.5,
                    fillColor: '#4a86f7',
                    fillOpacity: selectedCity?.id === city.id ? 0.9 : 0.55,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedListingId(null)
                      setSelectedCityId(city.id)
                      setIsBroadCityAnalysis(true)
                      setTargetPosition([city.lat, city.lng])
                      setSearchedLabel(city.name)
                      const code = countryToCode[city.country.toLowerCase()] ?? 'FR'
                      setLocationContext({ city: city.name, country: city.country, countryCode: code })
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -2]} opacity={0.95}>
                    {city.name}
                  </Tooltip>
                  <Popup>
                    <strong>{city.name}</strong>
                    <br />
                    {city.address}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 text-sm">
            {searchError ? <p className="mb-2 font-medium text-rose-600">{searchError}</p> : null}
            {selectedCity ? (
              <div className="space-y-1 text-zinc-700">
                <p className="font-semibold text-zinc-900">
                  {copy.selectedCity}: {selectedCity.name} ({selectedCity.country})
                </p>
                <p>{selectedCity.address}</p>
                <p>
                  {copy.coordinates}: {selectedCity.lat}, {selectedCity.lng}
                </p>
              </div>
            ) : filteredCities.length === 0 ? (
              <p className="font-medium text-rose-600">{copy.noResult}</p>
            ) : (
              <p className="text-zinc-600">{copy.clickHint}</p>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <h3 className="text-sm font-bold text-zinc-900">{copy.myListingsTitle}</h3>
            <p className="mt-1 text-xs text-zinc-600">{copy.myListingsSubtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setListingsPanelTab('connected')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  listingsPanelTab === 'connected' ? 'bg-[#4a86f7] text-white' : 'border border-zinc-200 bg-white text-zinc-700'
                }`}
              >
                {copy.myListingsTabConnected}
              </button>
              <button
                type="button"
                onClick={() => setListingsPanelTab('search')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  listingsPanelTab === 'search' ? 'bg-[#4a86f7] text-white' : 'border border-zinc-200 bg-white text-zinc-700'
                }`}
              >
                {copy.myListingsTabSearch}
              </button>
            </div>
            {listingsPanelTab === 'search' ? (
              <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-600">{copy.myListingsSearchHint}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {myListings.length > 0 ? (
                  <>
                    {myListings.length > 3 ? (
                      <select
                        value={selectedListingId ?? myListings[0].id}
                        onChange={(e) => {
                          const nextId = e.target.value
                          const listing = myListings.find((l) => l.id === nextId)
                          if (!listing) return
                          setSelectedListingId(listing.id)
                          setIsBroadCityAnalysis(false)
                          const geoHint = listing.addressResolved ? listing.address : listing.name
                          setSearchedLabel(listing.addressResolved ? listing.address : '')
                          const cityMatch = cities.find((city) => geoHint.toLowerCase().includes(city.name.toLowerCase()))
                          if (cityMatch) {
                            setSelectedCityId(cityMatch.id)
                            setTargetPosition([cityMatch.lat, cityMatch.lng])
                            const code = countryToCode[cityMatch.country.toLowerCase()] ?? 'FR'
                            setLocationContext({ city: cityMatch.name, country: cityMatch.country, countryCode: code })
                          } else {
                            setSelectedCityId(null)
                          }
                        }}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none focus:border-[#4a86f7]"
                      >
                        {myListings.map((listing) => (
                          <option key={listing.id} value={listing.id}>
                            {listing.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {(myListings.length > 3 ? myListings.filter((l) => l.id === (selectedListingId ?? myListings[0].id)) : myListings).map((listing) => {
                    const platformLabel =
                      listing.platform === 'airbnb'
                        ? copy.platformAirbnb
                        : listing.platform === 'booking'
                          ? copy.platformBooking
                          : copy.platformChannel
                    return (
                      <article
                        key={listing.id}
                        onClick={() => {
                          setSelectedListingId(listing.id)
                          setIsBroadCityAnalysis(false)
                          const geoHint = listing.addressResolved ? listing.address : listing.name
                          setSearchedLabel(listing.addressResolved ? listing.address : '')
                          const cityMatch = cities.find((city) => geoHint.toLowerCase().includes(city.name.toLowerCase()))
                          if (cityMatch) {
                            setSelectedCityId(cityMatch.id)
                            setTargetPosition([cityMatch.lat, cityMatch.lng])
                            const code = countryToCode[cityMatch.country.toLowerCase()] ?? 'FR'
                            setLocationContext({ city: cityMatch.name, country: cityMatch.country, countryCode: code })
                          } else {
                            setSelectedCityId(null)
                          }
                        }}
                        className={`cursor-pointer rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-700 transition ${
                          selectedListingId === listing.id ? 'border-[#4a86f7] ring-2 ring-[#4a86f7]/25' : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                            {platformLabel}
                          </span>
                        </div>
                        <p className="font-semibold text-zinc-900">{listing.name}</p>
                        <p className="text-zinc-600">{listing.address}</p>
                      </article>
                    )
                  })}
                  </>
                ) : (
                  <p className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-500">
                    {copy.myListingsEmpty}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <h3 className="text-sm font-bold text-zinc-900">{copy.calendarTitle}</h3>
            <p className="mt-1 text-xs text-zinc-600">{copy.calendarSubtitle}</p>
            <p className="mt-1 text-xs font-semibold text-zinc-800">
              {copy.analyzedAddressLabel}: {displayedAnalyzedAddress}
            </p>
            {analysisPrecisionMessage ? <p className="mt-1 text-[11px] text-zinc-600">{analysisPrecisionMessage}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarViewMode('month')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${calendarViewMode === 'month' ? 'bg-[#4a86f7] text-white' : 'border border-zinc-200 bg-white text-zinc-700'}`}
              >
                {copy.calendarMonth}
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('custom')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${calendarViewMode === 'custom' ? 'bg-[#4a86f7] text-white' : 'border border-zinc-200 bg-white text-zinc-700'}`}
              >
                {copy.calendarCustomRange}
              </button>
              {calendarViewMode === 'month' ? (
                <select
                  value={selectedMonthIndex}
                  onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800"
                >
                  {monthlyCalendar.map((month, idx) => (
                    <option key={month.key} value={idx}>
                      {month.monthName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800"
                  />
                  <input
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800"
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{copy.legendLow}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{copy.legendMedium}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />{copy.legendHigh}</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-600">{copy.hoverHint}</p>
            {selectedListing ? (
              <p className="mt-1 text-[11px] font-semibold text-zinc-700">× = {runtimeText.emptyGapDetected}</p>
            ) : null}
            <div className="mt-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-700">
              {hoveredDayEvent ? (
                <span>
                  <span className="font-semibold text-zinc-900">{hoveredDayEvent.date}</span> - {hoveredDayEvent.event}
                </span>
              ) : (
                <span className="text-zinc-500">{copy.hoverHint}</span>
              )}
            </div>

            {calendarViewMode === 'month' ? (
              <div className="mt-3 w-full rounded-xl border border-zinc-200 bg-white p-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-zinc-500">
                  {copy.weekdayLabels.map((w) => (
                    <div key={w} className="py-1">{w}</div>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {displayedMonth.cells.map((cell, idx) => (
                    <div key={`${displayedMonth.key}-${idx}`} className="h-8">
                      {cell ? (
                        <button
                          type="button"
                          onMouseEnter={() => onCalendarDayEnter(cell.isoDate, cell.event)}
                          onMouseLeave={onCalendarDayLeave}
                          className={`relative h-full w-full rounded-md text-[9px] font-bold text-white ${
                            cell.level === 'high' ? 'bg-rose-500' : cell.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        >
                          {cell.day}
                          {cell.isEmptyGap ? (
                            <span className="absolute right-1 top-0.5 text-[10px] font-black leading-none text-white/95">×</span>
                          ) : null}
                        </button>
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {rangeFilteredMonths.map((month) => (
                  <div key={month.key} className="w-full rounded-xl border border-zinc-200 bg-white p-3">
                    <p className="px-1 pb-2 text-xs font-semibold text-zinc-800">{month.monthName}</p>
                    <div className="grid grid-cols-7 gap-1">
                      {month.cells.map((cell, idx) => (
                        <div key={`${month.key}-${idx}`} className="h-8">
                          {cell ? (
                            <button
                              type="button"
                              onMouseEnter={() => onCalendarDayEnter(cell.isoDate, cell.event)}
                              onMouseLeave={onCalendarDayLeave}
                              className={`relative h-full w-full rounded-md text-[9px] font-bold text-white ${
                                cell.level === 'high' ? 'bg-rose-500' : cell.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            >
                              {cell.day}
                              {cell.isEmptyGap ? (
                                <span className="absolute right-1 top-0.5 text-[10px] font-black leading-none text-white/95">×</span>
                              ) : null}
                            </button>
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <h4 className="text-sm font-bold text-zinc-900">{runtimeText.concretePulseTitle}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.concreteRecommended}</p>
                  <p className={`mt-1 text-xl font-bold ${monthConcreteInsights.avgRecommendedPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {monthConcreteInsights.avgRecommendedPct >= 0 ? '+' : ''}
                    {monthConcreteInsights.avgRecommendedPct}%
                  </p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.concreteConfidence}</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{monthConcreteInsights.avgConfidence}/100</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.concreteDemandScore}</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{monthConcreteInsights.avgDemandScore}/100</p>
                </article>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.concreteTopUpDay}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {monthConcreteInsights.topUp ? `${monthConcreteInsights.topUp.isoDate} (+${monthConcreteInsights.topUp.recommendedPct}%)` : '-'}
                  </p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.concreteTopDownDay}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {monthConcreteInsights.topDown
                      ? `${monthConcreteInsights.topDown.isoDate} (${monthConcreteInsights.topDown.recommendedPct}%)`
                      : runtimeText.concreteNoStrongDown}
                  </p>
                </article>
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-600">
                {monthConcreteInsights.signalPoints} {runtimeText.concreteDataPoints}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <h4 className="text-sm font-bold text-zinc-900">{runtimeText.advancedTitle}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedAdr}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900">{advancedPricingInsights.adr} EUR</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedOcc}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900">{advancedPricingInsights.occ}%</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedRevpar}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900">{advancedPricingInsights.revpar} EUR</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedCompsetGap}</p>
                  <p className={`mt-1 text-lg font-bold ${advancedPricingInsights.compsetGapPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {advancedPricingInsights.compsetGapPct >= 0 ? '+' : ''}
                    {advancedPricingInsights.compsetGapPct}%
                  </p>
                </article>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedPickup7d}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.pickup7d}%/jour</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedPickup30d}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.pickup30d}%/jour</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedPriceBand}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">
                    {advancedPricingInsights.priceFloor} - {advancedPricingInsights.priceCeiling} EUR
                  </p>
                </article>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedBookingProbability}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.bookingProbability}%</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedExpectedDelta}</p>
                  <p className={`mt-1 text-sm font-bold ${advancedPricingInsights.expectedRevenueDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {advancedPricingInsights.expectedRevenueDeltaPct >= 0 ? '+' : ''}
                    {advancedPricingInsights.expectedRevenueDeltaPct}%
                  </p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedLanding}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">
                    {advancedPricingInsights.dominantLanding === 'hard_drop'
                      ? runtimeText.advancedLandingHard
                      : advancedPricingInsights.dominantLanding === 'soft_drop'
                        ? runtimeText.advancedLandingSoft
                        : runtimeText.advancedLandingHold}
                  </p>
                </article>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {advancedPricingInsights.topAction === 'raise'
                    ? runtimeText.advancedActionRaise
                    : advancedPricingInsights.topAction === 'lower'
                      ? runtimeText.advancedActionLower
                      : runtimeText.advancedActionHold}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {advancedPricingInsights.riskLevel === 'low'
                    ? runtimeText.advancedRiskLow
                    : advancedPricingInsights.riskLevel === 'high'
                      ? runtimeText.advancedRiskHigh
                      : runtimeText.advancedRiskMedium}
                </span>
              </div>
              <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.advancedAnomalies}</p>
                {advancedPricingInsights.anomalies.length > 0 ? (
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{advancedPricingInsights.anomalies.join(' | ')}</p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-700">{runtimeText.advancedNoAnomaly}</p>
                )}
              </div>
              <p className="mt-3 text-xs font-semibold text-zinc-700">
                {runtimeText.advancedBacktestScore}: {advancedPricingInsights.backtestScore}/100
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              {monthlyWatchSummary.map((line, idx) => (
                <p key={`${displayedMonth.key}-summary-${idx}`} className={`text-sm ${idx === 0 ? 'font-semibold text-zinc-900' : 'mt-2 text-zinc-700'}`}>
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <h4 className="text-sm font-bold text-zinc-900">{runtimeText.precisionTitle}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionLos}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{selectedListingPrecisionFacts.avgLos} nuits</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionCancel}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{selectedListingPrecisionFacts.cancellationRate}%</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionEventQuality}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.eventQualityScore}/100</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Sample</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{selectedListingPrecisionFacts.sampleSize} resas</p>
                </article>
              </div>
              <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionLeadMix}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {runtimeText.precisionFar}: {selectedListingPrecisionFacts.farPct}% · {runtimeText.precisionMid}: {selectedListingPrecisionFacts.midPct}% · {runtimeText.precisionNear}: {selectedListingPrecisionFacts.nearPct}%
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionConfidenceAdr}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.confidenceAdr}/100</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionConfidenceOcc}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.confidenceOcc}/100</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.precisionConfidenceEvents}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{advancedPricingInsights.confidenceEvents}/100</p>
                </article>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <h4 className="text-sm font-bold text-zinc-900">{runtimeText.phase1Title}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.phase1CompsetAdr}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{phase1MarketEdge.compsetAdr} EUR</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.phase1CompsetOcc}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{phase1MarketEdge.compsetOcc}%</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.phase1PickupPressure}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{phase1MarketEdge.pickupPressureScore}/100</p>
                </article>
                <article className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.phase1NetUplift}</p>
                  <p className={`mt-1 text-sm font-bold ${phase1MarketEdge.expectedNetMarginUpliftPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {phase1MarketEdge.expectedNetMarginUpliftPct >= 0 ? '+' : ''}
                    {phase1MarketEdge.expectedNetMarginUpliftPct}%
                  </p>
                </article>
              </div>
              <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{runtimeText.phase1Recommendation}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{phase1MarketEdge.recommendation}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

