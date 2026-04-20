import { useEffect, useMemo, useState } from 'react'
import { Crown } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'
import type { Locale } from '../i18n/navbar'
import { isGuestDemoSession } from '../utils/guestDemo'
import {
  buildGuestDemoMonthBookings,
  DEMO_BASE_YEAR,
  DEMO_MAX_MONTH_INDEX,
  DEMO_MIN_MONTH_INDEX,
} from '../utils/demoCalendarData'

function hasRealConnectedListings() {
  try {
    const raw = localStorage.getItem('staypilot_connected_channels')
    const connected = raw ? (JSON.parse(raw) as { airbnb?: boolean; booking?: boolean; channelManager?: boolean }) : {}
    return Boolean(connected.airbnb || connected.booking || connected.channelManager)
  } catch {
    return false
  }
}
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'

type ReservationStatus = 'reserved' | 'cancelled'

type ReservationEvent = {
  apartment: string
  date: string
  status: ReservationStatus
  nights: number
}
type RevenueEntry = {
  apartment: string
  source: RevenueSource
  checkIn: string
  month: number
  year: number
  netRevenue: number
  occupiedNights: number
}
type ChannelKey = 'airbnb' | 'booking' | 'channelManager'
type ParsedIcalEvent = {
  start: Date
  end: Date
  status: ReservationStatus
}
type AccessConfig = { ical?: string }

const MONTH_LABELS: Record<Locale, string[]> = {
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  it: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
}
type DateFilterMode = 'month' | 'custom'
type ChartOrderMode = 'revenue-first' | 'occupancy-first'
type RevenueSource = 'airbnb' | 'booking'

function isYearMonthInRange(year: number, month: number, start: Date, end: Date) {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)
  return monthEnd >= start && monthStart <= end
}

function parseIcalDate(raw: string) {
  const value = raw.trim()
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  return new Date(year, month, day)
}

function parseIcalEvents(icalText: string): ParsedIcalEvent[] {
  const blocks = icalText.split('BEGIN:VEVENT').slice(1)
  return blocks
    .map((block) => {
      const startMatch = block.match(/DTSTART(?:;[^:\n]+)?:([^\r\n]+)/i)
      const endMatch = block.match(/DTEND(?:;[^:\n]+)?:([^\r\n]+)/i)
      if (!startMatch?.[1] || !endMatch?.[1]) return null
      const start = parseIcalDate(startMatch[1])
      const end = parseIcalDate(endMatch[1])
      if (!start || !end || end <= start) return null
      const cancelled = /STATUS:CANCELLED/i.test(block)
      return { start, end, status: cancelled ? 'cancelled' : 'reserved' as ReservationStatus }
    })
    .filter((event): event is ParsedIcalEvent => Boolean(event))
}

function nightsBetween(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime()
  return Math.max(0, Math.round(diff / 86400000))
}

function buildGuestDemoStatsData(apartmentNames: string[]) {
  const reservationEvents: ReservationEvent[] = []
  const revenueEntries: RevenueEntry[] = []

  for (let monthIndex = DEMO_MIN_MONTH_INDEX; monthIndex <= DEMO_MAX_MONTH_INDEX; monthIndex += 1) {
    const month = monthIndex + 1
    const daysInMonth = new Date(DEMO_BASE_YEAR, month, 0).getDate()
    const monthBookings = buildGuestDemoMonthBookings(daysInMonth, monthIndex)
    monthBookings.forEach((b) => {
      const apartment = apartmentNames[b.apt] ?? `Appartement ${b.apt + 1}`
      const checkIn = `${DEMO_BASE_YEAR}-${String(month).padStart(2, '0')}-${String(b.start).padStart(2, '0')}`
      reservationEvents.push({
        apartment,
        date: checkIn,
        status: b.status,
        nights: b.nights,
      })
      if (b.status !== 'cancelled') {
        revenueEntries.push({
          apartment,
          source: b.channel,
          checkIn,
          month,
          year: DEMO_BASE_YEAR,
          netRevenue: b.netPayoutEur,
          occupiedNights: b.nights,
        })
      }
    })
  }

  return { reservationEvents, revenueEntries }
}

export function DashboardStatsPage() {
  const { t, locale } = useLanguage()
  const resolvedLocale: Locale =
    locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it'
      ? locale
      : String(locale || 'en').toLowerCase().startsWith('fr')
        ? 'fr'
        : String(locale || 'en').toLowerCase().startsWith('es')
          ? 'es'
          : String(locale || 'en').toLowerCase().startsWith('de')
            ? 'de'
            : String(locale || 'en').toLowerCase().startsWith('it')
              ? 'it'
              : 'en'
  const statsUi =
    resolvedLocale === 'fr'
      ? {
          month: 'Mois', customDate: 'Date personnalisée', previousMonth: 'Mois précédent', nextMonth: 'Mois suivant', start: 'Début', end: 'Fin', allListings: 'Tous les logements', listingPrefix: 'Logement', filterMonthPrefix: 'Mois', filterPeriodPrefix: 'Période', periodIncomplete: 'Période: personnalisée (incomplète)',
          subtitle: "Suivi des encaissements et de l'occupation, logement par logement.", requiredAction: 'Action requise', noListingConnected: 'Aucun logement connecté', connectPrompt: "Connecte d'abord tes logements pour afficher les statistiques d'encaissement et le taux d'occupation.", connectMyListings: 'Connecter mes logements',
          premium: 'Premium', revenueFirst: 'Revenu en haut', occupancyFirst: 'Taux en haut', noConnectedData: 'Aucune donnée de réservation connectée pour le moment.',
          netRevenue: 'Encaissement net', netRevenueMonthHint: 'Somme des revenus nets sur le mois sélectionné.', netRevenuePeriodHint: 'Somme des revenus nets sur la période personnalisée.', pricesUnavailable: 'Les prix ne sont pas disponibles via iCal seul (Airbnb/Booking).',
          globalOccupancy: "Taux d'occupation global", globalOccupancyHint: "Calculé sur l'ensemble des logements affichés.", listingsAndBookings: 'Logements et réservations détectées', reservations: 'Réservations', cancellations: 'Annulations',
          revenueByMonth: 'Revenu par mois (Airbnb / Booking)', occupancyByMonth: "Taux d'occupation par mois (Airbnb / Booking)", activeFilter: 'Filtre actif', splitBookings: 'Répartition réservations / annulations', dataUnavailable: 'Données indisponibles pour le moment. Les chiffres seront affichés à partir des données réelles Airbnb/Booking.',
          reservationRate: 'Taux de réservation', cancellationRate: "Taux d'annulation", reservationCount: 'Nombre de réservations', noData: 'Aucune donnée',
          invalidDates: 'Dates invalides.', endDateAfterStart: 'La date de fin doit être après la date de début.', loadError: 'Impossible de charger les données iCal connectées.'
        }
      : resolvedLocale === 'es'
        ? {
            month: 'Mes', customDate: 'Fecha personalizada', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', start: 'Inicio', end: 'Fin', allListings: 'Todos los alojamientos', listingPrefix: 'Alojamiento', filterMonthPrefix: 'Mes', filterPeriodPrefix: 'Período', periodIncomplete: 'Período: personalizado (incompleto)',
            subtitle: 'Seguimiento de ingresos netos y ocupación, alojamiento por alojamiento.', requiredAction: 'Acción requerida', noListingConnected: 'Ningún alojamiento conectado', connectPrompt: 'Conecta primero tus alojamientos para ver estadísticas de ingresos y ocupación.', connectMyListings: 'Conectar mis alojamientos',
            premium: 'Premium', revenueFirst: 'Ingresos arriba', occupancyFirst: 'Ocupación arriba', noConnectedData: 'No hay datos de reservas conectadas por ahora.',
            netRevenue: 'Ingreso neto', netRevenueMonthHint: 'Suma de ingresos netos del mes seleccionado.', netRevenuePeriodHint: 'Suma de ingresos netos del período personalizado.', pricesUnavailable: 'Los precios no están disponibles solo con iCal (Airbnb/Booking).',
            globalOccupancy: 'Tasa de ocupación global', globalOccupancyHint: 'Calculado sobre todos los alojamientos mostrados.', listingsAndBookings: 'Alojamientos y reservas detectados', reservations: 'Reservas', cancellations: 'Cancelaciones',
            revenueByMonth: 'Ingresos por mes (Airbnb / Booking)', occupancyByMonth: 'Tasa de ocupación por mes (Airbnb / Booking)', activeFilter: 'Filtro activo', splitBookings: 'Reparto reservas / cancelaciones', dataUnavailable: 'Datos no disponibles por el momento. Las cifras se mostrarán con datos reales de Airbnb/Booking.',
            reservationRate: 'Tasa de reserva', cancellationRate: 'Tasa de cancelación', reservationCount: 'Número de reservas', noData: 'Sin datos',
            invalidDates: 'Fechas inválidas.', endDateAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio.', loadError: 'No se pueden cargar los datos iCal conectados.'
          }
        : resolvedLocale === 'de'
          ? {
              month: 'Monat', customDate: 'Benutzerdefiniertes Datum', previousMonth: 'Vormonat', nextMonth: 'Nächster Monat', start: 'Start', end: 'Ende', allListings: 'Alle Unterkünfte', listingPrefix: 'Unterkunft', filterMonthPrefix: 'Monat', filterPeriodPrefix: 'Zeitraum', periodIncomplete: 'Zeitraum: benutzerdefiniert (unvollständig)',
              subtitle: 'Überblick über Netto-Umsätze und Auslastung pro Unterkunft.', requiredAction: 'Aktion erforderlich', noListingConnected: 'Keine Unterkunft verbunden', connectPrompt: 'Verbinden Sie zuerst Ihre Unterkünfte, um Umsatz- und Auslastungsstatistiken zu sehen.', connectMyListings: 'Unterkünfte verbinden',
              premium: 'Premium', revenueFirst: 'Umsatz oben', occupancyFirst: 'Auslastung oben', noConnectedData: 'Aktuell sind keine verbundenen Reservierungsdaten verfügbar.',
              netRevenue: 'Netto-Umsatz', netRevenueMonthHint: 'Summe der Netto-Umsätze im ausgewählten Monat.', netRevenuePeriodHint: 'Summe der Netto-Umsätze im benutzerdefinierten Zeitraum.', pricesUnavailable: 'Preise sind nur über iCal (Airbnb/Booking) nicht verfügbar.',
              globalOccupancy: 'Globale Auslastung', globalOccupancyHint: 'Berechnet über alle angezeigten Unterkünfte.', listingsAndBookings: 'Erkannte Unterkünfte und Buchungen', reservations: 'Reservierungen', cancellations: 'Stornierungen',
              revenueByMonth: 'Umsatz pro Monat (Airbnb / Booking)', occupancyByMonth: 'Auslastung pro Monat (Airbnb / Booking)', activeFilter: 'Aktiver Filter', splitBookings: 'Verteilung Buchungen / Stornierungen', dataUnavailable: 'Daten derzeit nicht verfügbar. Werte werden mit echten Airbnb/Booking-Daten angezeigt.',
              reservationRate: 'Buchungsrate', cancellationRate: 'Stornorate', reservationCount: 'Anzahl Reservierungen', noData: 'Keine Daten',
              invalidDates: 'Ungültige Daten.', endDateAfterStart: 'Das Enddatum muss nach dem Startdatum liegen.', loadError: 'Verbundene iCal-Daten konnten nicht geladen werden.'
            }
          : resolvedLocale === 'it'
            ? {
                month: 'Mese', customDate: 'Data personalizzata', previousMonth: 'Mese precedente', nextMonth: 'Mese successivo', start: 'Inizio', end: 'Fine', allListings: 'Tutti gli alloggi', listingPrefix: 'Alloggio', filterMonthPrefix: 'Mese', filterPeriodPrefix: 'Periodo', periodIncomplete: 'Periodo: personalizzato (incompleto)',
                subtitle: 'Monitoraggio incassi netti e occupazione, alloggio per alloggio.', requiredAction: 'Azione richiesta', noListingConnected: 'Nessun alloggio collegato', connectPrompt: 'Collega prima i tuoi alloggi per vedere statistiche di incassi e occupazione.', connectMyListings: 'Collega i miei alloggi',
                premium: 'Premium', revenueFirst: 'Ricavi in alto', occupancyFirst: 'Occupazione in alto', noConnectedData: 'Nessun dato di prenotazione collegato al momento.',
                netRevenue: 'Incasso netto', netRevenueMonthHint: 'Somma degli incassi netti del mese selezionato.', netRevenuePeriodHint: 'Somma degli incassi netti del periodo personalizzato.', pricesUnavailable: 'I prezzi non sono disponibili con il solo iCal (Airbnb/Booking).',
                globalOccupancy: 'Tasso di occupazione globale', globalOccupancyHint: 'Calcolato su tutti gli alloggi visualizzati.', listingsAndBookings: 'Alloggi e prenotazioni rilevati', reservations: 'Prenotazioni', cancellations: 'Cancellazioni',
                revenueByMonth: 'Ricavi per mese (Airbnb / Booking)', occupancyByMonth: 'Tasso di occupazione per mese (Airbnb / Booking)', activeFilter: 'Filtro attivo', splitBookings: 'Ripartizione prenotazioni / cancellazioni', dataUnavailable: 'Dati momentaneamente non disponibili. I valori verranno mostrati con dati reali Airbnb/Booking.',
                reservationRate: 'Tasso di prenotazione', cancellationRate: 'Tasso di cancellazione', reservationCount: 'Numero di prenotazioni', noData: 'Nessun dato',
                invalidDates: 'Date non valide.', endDateAfterStart: 'La data di fine deve essere successiva alla data di inizio.', loadError: 'Impossibile caricare i dati iCal collegati.'
              }
            : {
                month: 'Month', customDate: 'Custom date', previousMonth: 'Previous month', nextMonth: 'Next month', start: 'Start', end: 'End', allListings: 'All listings', listingPrefix: 'Listing', filterMonthPrefix: 'Month', filterPeriodPrefix: 'Period', periodIncomplete: 'Period: custom (incomplete)',
                subtitle: 'Track net revenue and occupancy listing by listing.', requiredAction: 'Action required', noListingConnected: 'No listing connected', connectPrompt: 'Connect your listings first to view revenue and occupancy statistics.', connectMyListings: 'Connect my listings',
                premium: 'Premium', revenueFirst: 'Revenue first', occupancyFirst: 'Occupancy first', noConnectedData: 'No connected reservation data available right now.',
                netRevenue: 'Net revenue', netRevenueMonthHint: 'Sum of net revenue for the selected month.', netRevenuePeriodHint: 'Sum of net revenue for the custom period.', pricesUnavailable: 'Prices are not available from iCal only (Airbnb/Booking).',
                globalOccupancy: 'Global occupancy rate', globalOccupancyHint: 'Calculated across all displayed listings.', listingsAndBookings: 'Detected listings and bookings', reservations: 'Reservations', cancellations: 'Cancellations',
                revenueByMonth: 'Revenue by month (Airbnb / Booking)', occupancyByMonth: 'Occupancy rate by month (Airbnb / Booking)', activeFilter: 'Active filter', splitBookings: 'Reservation / cancellation split', dataUnavailable: 'Data is currently unavailable. Figures will appear from real Airbnb/Booking data.',
                reservationRate: 'Reservation rate', cancellationRate: 'Cancellation rate', reservationCount: 'Number of reservations', noData: 'No data',
                invalidDates: 'Invalid dates.', endDateAfterStart: 'End date must be after start date.', loadError: 'Unable to load connected iCal data.'
              }
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()
    if (isGuestDemoSession()) {
      return { year: DEMO_BASE_YEAR, month: Math.min(12, Math.max(1, now.getMonth() + 1)) }
    }
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('month')
  const [chartOrderMode, setChartOrderMode] = useState<ChartOrderMode>('revenue-first')
  const [selectedApartmentFilter, setSelectedApartmentFilter] = useState<'all' | string>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [reservationEvents, setReservationEvents] = useState<ReservationEvent[]>([])
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([])
  const [detectedListingFilter, setDetectedListingFilter] = useState<string>('all')
  const [connectionsRefreshKey, setConnectionsRefreshKey] = useState(0)
  const [statsLoadError, setStatsLoadError] = useState('')
  const guestDemoActive = useMemo(() => isGuestDemoSession(), [connectionsRefreshKey])
  useEffect(() => {
    const refresh = () => setConnectionsRefreshKey((v) => v + 1)
    window.addEventListener('storage', refresh)
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  const hasRealConnected = useMemo(() => hasRealConnectedListings(), [connectionsRefreshKey])
  const connected = useMemo(() => guestDemoActive || hasRealConnected, [guestDemoActive, hasRealConnected])
  useEffect(() => {
    if (!guestDemoActive) return
    setSelectedPeriod((prev) => ({
      year: DEMO_BASE_YEAR,
      month: Math.min(12, Math.max(1, prev.month)),
    }))
  }, [guestDemoActive])

  const apartmentNames = useMemo(() => {
    return getConnectedApartmentsFromStorage().map((apt) => apt.name)
  }, [connectionsRefreshKey])
  const apartmentsForFilters = apartmentNames
  const effectiveReservationEvents = reservationEvents
  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  )
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [],
  )

  useEffect(() => {
    if (guestDemoActive) {
      const demo = buildGuestDemoStatsData(apartmentNames)
      setReservationEvents(demo.reservationEvents)
      setRevenueEntries(demo.revenueEntries)
      setStatsLoadError('')
      return
    }
    const connectedApartments = getConnectedApartmentsFromStorage()
    const official = readOfficialChannelSyncData()
    if (official && official.bookings.length > 0) {
      const propertyIdToApartment = new Map<string, string>()
      connectedApartments.forEach((apt) => {
        const parts = String(apt.id).split(':')
        const propId = parts.length > 1 ? parts.slice(1).join(':') : apt.id
        propertyIdToApartment.set(propId, apt.name)
      })
      const mapped = official.bookings
        .map((b) => {
          const apartment = propertyIdToApartment.get(String(b.propertyId))
          if (!apartment) return null
          const checkIn = new Date(`${b.checkIn}T00:00:00`)
          const checkOut = new Date(`${b.checkOut}T00:00:00`)
          if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null
          const source = String(b.channel || '').toLowerCase()
          const mappedSource: RevenueSource | null = source === 'airbnb' ? 'airbnb' : source === 'booking' ? 'booking' : null
          const nights = nightsBetween(checkIn, checkOut)
          const netRevenue = Number(b.revenuNetDetaille?.amount ?? b.prixTotalVoyageur?.amount ?? 0)
          return {
            reservation: {
              apartment,
              date: b.checkIn,
              status: b.status === 'cancelled' ? 'cancelled' : 'reserved',
              nights,
            } as ReservationEvent,
            revenue:
              mappedSource && b.status !== 'cancelled'
                ? ({
                    apartment,
                    source: mappedSource,
                    checkIn: b.checkIn,
                    month: checkIn.getMonth() + 1,
                    year: checkIn.getFullYear(),
                    netRevenue: Number.isFinite(netRevenue) ? netRevenue : 0,
                    occupiedNights: nights,
                  } as RevenueEntry)
                : null,
          }
        })
        .filter((x): x is { reservation: ReservationEvent; revenue: RevenueEntry | null } => Boolean(x))
      setReservationEvents(mapped.map((x) => x.reservation))
      setRevenueEntries(mapped.map((x) => x.revenue).filter((x): x is RevenueEntry => Boolean(x)))
      setStatsLoadError('')
      return
    }
    const accessRaw = localStorage.getItem('staypilot_reservation_access')
    const access = accessRaw ? (JSON.parse(accessRaw) as Partial<Record<ChannelKey, AccessConfig>>) : {}
    let cancelled = false

    const load = async () => {
      try {
        const loaded = await Promise.all(
          connectedApartments.map(async (apt) => {
            const icalUrl = access[apt.platform]?.ical?.trim()
            if (!icalUrl) return []
            try {
              const res = await fetch(`/api/ical?url=${encodeURIComponent(icalUrl)}`)
              if (!res.ok) return []
              const text = await res.text()
              return parseIcalEvents(text).map((evt) => ({ apartment: apt.name, source: apt.platform, ...evt }))
            } catch {
              return []
            }
          }),
        )
        if (cancelled) return
        const flat = loaded.flat()
        setReservationEvents(
          flat.map((evt) => ({
            apartment: evt.apartment,
            date: `${evt.start.getFullYear()}-${String(evt.start.getMonth() + 1).padStart(2, '0')}-${String(evt.start.getDate()).padStart(2, '0')}`,
            status: evt.status,
            nights: nightsBetween(evt.start, evt.end),
          })),
        )
        setRevenueEntries([])

        setStatsLoadError('')
      } catch {
        if (!cancelled) {
          setReservationEvents([])
          setRevenueEntries([])
          setStatsLoadError(statsUi.loadError)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [connectionsRefreshKey, guestDemoActive, apartmentNames, statsUi.loadError])

  const customRangeError = useMemo(() => {
    if (!customStartDate || !customEndDate) return ''
    const start = new Date(`${customStartDate}T00:00:00`)
    const end = new Date(`${customEndDate}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return statsUi.invalidDates
    if (end < start) return statsUi.endDateAfterStart
    return ''
  }, [customStartDate, customEndDate])

  const filteredReservationEvents = useMemo(() => {
    const selectedApartment =
      selectedApartmentFilter === 'all' ? null : apartmentsForFilters.find((name) => name === selectedApartmentFilter) ?? null
    const byApartment = selectedApartment
      ? effectiveReservationEvents.filter((event) => event.apartment === selectedApartment)
      : effectiveReservationEvents

    if (dateFilterMode === 'month') {
      return byApartment.filter((event) => {
        const d = new Date(`${event.date}T00:00:00`)
        return d.getFullYear() === selectedPeriod.year && d.getMonth() + 1 === selectedPeriod.month
      })
    }

    if (!customStartDate || !customEndDate || customRangeError) return byApartment
    const start = new Date(`${customStartDate}T00:00:00`)
    const end = new Date(`${customEndDate}T23:59:59`)
    return byApartment.filter((event) => {
      const d = new Date(`${event.date}T00:00:00`)
      return d >= start && d <= end
    })
  }, [
    apartmentsForFilters,
    customEndDate,
    customRangeError,
    customStartDate,
    dateFilterMode,
    effectiveReservationEvents,
    selectedApartmentFilter,
    selectedPeriod.month,
    selectedPeriod.year,
  ])

  const reservationAndCancellation = useMemo(() => {
    const reservedCount = filteredReservationEvents.filter((event) => event.status === 'reserved').length
    const cancelledCount = filteredReservationEvents.filter((event) => event.status === 'cancelled').length
    const total = reservedCount + cancelledCount
    const reservationRate = total > 0 ? (reservedCount / total) * 100 : 0
    const cancellationRate = total > 0 ? (cancelledCount / total) * 100 : 0
    return {
      reservedCount,
      cancelledCount,
      totalCount: total,
      reservationRate,
      cancellationRate,
      pieData: [
                        { name: statsUi.reservationRate, value: Number(reservationRate.toFixed(1)), color: '#22c55e' },
                        { name: statsUi.cancellationRate, value: Number(cancellationRate.toFixed(1)), color: '#ef4444' },
      ],
    }
  }, [filteredReservationEvents, statsUi.cancellationRate, statsUi.reservationRate])
  const hasReservationData = filteredReservationEvents.length > 0
  const pieDataForDisplay = hasReservationData
    ? reservationAndCancellation.pieData
    : [{ name: statsUi.noData, value: 100, color: '#e5e7eb' }]

  const selectedApartment = useMemo(
    () =>
      selectedApartmentFilter === 'all'
        ? null
        : apartmentsForFilters.find((name) => name === selectedApartmentFilter) ?? null,
    [apartmentsForFilters, selectedApartmentFilter],
  )

  const dateRangeTotalDays = useMemo(() => {
    if (dateFilterMode === 'month') {
      return new Date(selectedPeriod.year, selectedPeriod.month, 0).getDate()
    }
    if (!customStartDate || !customEndDate || customRangeError) return 0
    const start = new Date(`${customStartDate}T00:00:00`)
    const end = new Date(`${customEndDate}T00:00:00`)
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1)
  }, [customEndDate, customRangeError, customStartDate, dateFilterMode, selectedPeriod.month, selectedPeriod.year])

  const statsRows = useMemo(() => {
    const names = selectedApartment ? [selectedApartment] : apartmentsForFilters
    return names.map((apartment) => {
      const occupiedNights = filteredReservationEvents
        .filter((event) => event.apartment === apartment && event.status === 'reserved')
        .reduce((sum, event) => sum + event.nights, 0)
      const totalNights = dateRangeTotalDays
      const occupancyRate = totalNights > 0 ? (occupiedNights / totalNights) * 100 : 0
      const netRevenue = 0
      return { apartment, occupiedNights, totalNights, occupancyRate, netRevenue }
    })
  }, [apartmentsForFilters, dateRangeTotalDays, filteredReservationEvents, selectedApartment])

  const totals = useMemo(() => {
    return statsRows.reduce(
      (acc, row) => ({
        occupiedNights: acc.occupiedNights + row.occupiedNights,
        totalNights: acc.totalNights + row.totalNights,
        netRevenue: acc.netRevenue + row.netRevenue,
      }),
      { occupiedNights: 0, totalNights: 0, netRevenue: 0 },
    )
  }, [statsRows])

  const globalOccupancy = totals.totalNights > 0 ? (totals.occupiedNights / totals.totalNights) * 100 : 0
  const bookingsByApartment = useMemo(() => {
    return apartmentsForFilters.map((apartment) => ({
      apartment,
      reservations: filteredReservationEvents.filter((event) => event.apartment === apartment && event.status === 'reserved').length,
      cancellations: filteredReservationEvents.filter((event) => event.apartment === apartment && event.status === 'cancelled').length,
    }))
  }, [apartmentsForFilters, filteredReservationEvents])
  useEffect(() => {
    if (bookingsByApartment.length <= 2) {
      setDetectedListingFilter('all')
      return
    }
    if (detectedListingFilter === 'all') return
    const exists = bookingsByApartment.some((row) => row.apartment === detectedListingFilter)
    if (!exists) setDetectedListingFilter('all')
  }, [bookingsByApartment, detectedListingFilter])
  const displayedBookingsByApartment = useMemo(() => {
    if (bookingsByApartment.length <= 2 || detectedListingFilter === 'all') return bookingsByApartment
    return bookingsByApartment.filter((row) => row.apartment === detectedListingFilter)
  }, [bookingsByApartment, detectedListingFilter])

  const filteredRevenueEntries = useMemo(() => {
    return revenueEntries.filter((entry) => {
      if (entry.year !== selectedPeriod.year) return false
      if (selectedApartment && entry.apartment !== selectedApartment) return false
      if (dateFilterMode === 'custom' && customStartDate && customEndDate && !customRangeError) {
        const d = new Date(`${entry.checkIn}T00:00:00`)
        const start = new Date(`${customStartDate}T00:00:00`)
        const end = new Date(`${customEndDate}T23:59:59`)
        return d >= start && d <= end
      }
      return true
    })
  }, [
    customEndDate,
    customRangeError,
    customStartDate,
    dateFilterMode,
    revenueEntries,
    selectedApartment,
    selectedPeriod.year,
  ])

  const activeDateFilterLabel =
    dateFilterMode === 'month'
      ? `${statsUi.filterMonthPrefix}: ${MONTH_LABELS[resolvedLocale][selectedPeriod.month - 1]} ${selectedPeriod.year}`
      : customStartDate && customEndDate && !customRangeError
        ? `${statsUi.filterPeriodPrefix}: ${customStartDate} -> ${customEndDate}`
        : statsUi.periodIncomplete
  const activeFilterLabel = `${activeDateFilterLabel} | ${
    selectedApartment ? `${statsUi.listingPrefix}: ${selectedApartment}` : `${statsUi.listingPrefix}: ${statsUi.allListings}`
  }`
  const hasConnectedMetrics = reservationEvents.length > 0 || revenueEntries.length > 0

  const chartData = useMemo(() => {
    const customStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
    const customEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
    const isMonthIncluded = (month: number) => {
      if (dateFilterMode === 'month') return true
      if (dateFilterMode === 'custom' && customStart && customEnd && !customRangeError) {
        return isYearMonthInRange(selectedPeriod.year, month, customStart, customEnd)
      }
      return true
    }
    return MONTH_LABELS[resolvedLocale].map((label, index) => {
      const month = index + 1
      const monthRows = isMonthIncluded(month) ? filteredRevenueEntries.filter((row) => row.month === month) : []
      const airbnb = monthRows.filter((r) => r.source === 'airbnb').reduce((sum, r) => sum + r.netRevenue, 0)
      const booking = monthRows.filter((r) => r.source === 'booking').reduce((sum, r) => sum + r.netRevenue, 0)
      return {
        month: label,
        airbnb,
        booking,
        total: airbnb + booking,
      }
    })
  }, [
    customEndDate,
    customRangeError,
    customStartDate,
    dateFilterMode,
    filteredRevenueEntries,
    resolvedLocale,
    selectedPeriod.month,
    selectedPeriod.year,
  ])

  const occupancyChartData = useMemo(() => {
    const customStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null
    const customEnd = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null
    const isMonthIncluded = (month: number) => {
      if (dateFilterMode === 'month') return true
      if (dateFilterMode === 'custom' && customStart && customEnd && !customRangeError) {
        return isYearMonthInRange(selectedPeriod.year, month, customStart, customEnd)
      }
      return true
    }
    return MONTH_LABELS[resolvedLocale].map((label, index) => {
      const month = index + 1
      const monthRows = isMonthIncluded(month) ? filteredRevenueEntries.filter((row) => row.month === month) : []
      const visibleListingCount = selectedApartment ? 1 : apartmentsForFilters.length
      const sourceRate = (source: RevenueSource) => {
        const rows = monthRows.filter((r) => r.source === source)
        const occupied = rows.reduce((sum, r) => sum + r.occupiedNights, 0)
        const available = visibleListingCount * new Date(selectedPeriod.year, month, 0).getDate()
        return available > 0 ? Number(((occupied / available) * 100).toFixed(1)) : 0
      }
      const airbnb = sourceRate('airbnb')
      const booking = sourceRate('booking')
      return {
        month: label,
        airbnb,
        booking,
      }
    })
  }, [
    apartmentsForFilters.length,
    customEndDate,
    customRangeError,
    customStartDate,
    dateFilterMode,
    filteredRevenueEntries,
    resolvedLocale,
    selectedApartment,
    selectedPeriod.month,
    selectedPeriod.year,
  ])
  const netRevenueDisplay = useMemo(() => {
    if (dateFilterMode === 'month') {
      const current = chartData[selectedPeriod.month - 1]
      return current ? current.total : 0
    }
    if (!customStartDate || !customEndDate || customRangeError) return chartData.reduce((sum, row) => sum + row.total, 0)
    const start = new Date(`${customStartDate}T00:00:00`)
    const end = new Date(`${customEndDate}T23:59:59`)
    return chartData.reduce((sum, row, idx) => {
      const month = idx + 1
      return isYearMonthInRange(selectedPeriod.year, month, start, end) ? sum + row.total : sum
    }, 0)
  }, [chartData, customEndDate, customRangeError, customStartDate, dateFilterMode, selectedPeriod.month, selectedPeriod.year])
  const globalOccupancyDisplay = globalOccupancy

  const yearOptions = useMemo(() => {
    if (guestDemoActive) return [DEMO_BASE_YEAR]
    const nowYear = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => nowYear - 2 + i)
  }, [guestDemoActive])

  const goToPreviousMonth = () => {
    setSelectedPeriod((prev) => {
      if (guestDemoActive) {
        if (prev.year <= DEMO_BASE_YEAR && prev.month <= 1) return { year: DEMO_BASE_YEAR, month: 1 }
        return { year: DEMO_BASE_YEAR, month: prev.month - 1 }
      }
      if (prev.month === 1) return { year: prev.year - 1, month: 12 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setSelectedPeriod((prev) => {
      if (guestDemoActive) {
        if (prev.year >= DEMO_BASE_YEAR && prev.month >= 12) return { year: DEMO_BASE_YEAR, month: 12 }
        return { year: DEMO_BASE_YEAR, month: prev.month + 1 }
      }
      if (prev.month === 12) return { year: prev.year + 1, month: 1 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-5xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabStats}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {statsUi.subtitle}
          </p>
        </div>

        {!connected ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#4a86f7]/10 via-[#4a86f7]/5 to-transparent px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4a86f7]">{statsUi.requiredAction}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{statsUi.noListingConnected}</p>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-sm text-zinc-700">
                {statsUi.connectPrompt}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50 px-3 py-3 shadow-sm sm:px-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-3 py-1">
                  <Crown className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-violet-700">{statsUi.premium}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-violet-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setChartOrderMode('revenue-first')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${chartOrderMode === 'revenue-first' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      {statsUi.revenueFirst}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartOrderMode('occupancy-first')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${chartOrderMode === 'occupancy-first' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      {statsUi.occupancyFirst}
                    </button>
                  </div>
                  <div className="inline-flex rounded-lg border border-violet-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('month')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${dateFilterMode === 'month' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      {statsUi.month}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('custom')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${dateFilterMode === 'custom' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      {statsUi.customDate}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 sm:text-sm"
                    disabled={
                      dateFilterMode === 'custom' ||
                      (guestDemoActive && selectedPeriod.year === DEMO_BASE_YEAR && selectedPeriod.month === 1)
                    }
                  >
                    {statsUi.previousMonth}
                  </button>
                  <select
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod((prev) => ({ ...prev, month: Number(e.target.value) }))}
                    disabled={dateFilterMode === 'custom'}
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-violet-400 disabled:bg-zinc-100 disabled:text-zinc-400 sm:text-sm"
                  >
                    {MONTH_LABELS[resolvedLocale].map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod((prev) => ({ ...prev, year: Number(e.target.value) }))}
                    disabled={dateFilterMode === 'custom' || guestDemoActive}
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-violet-400 disabled:bg-zinc-100 disabled:text-zinc-400 sm:text-sm"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 sm:text-sm"
                    disabled={
                      dateFilterMode === 'custom' ||
                      (guestDemoActive && selectedPeriod.year === DEMO_BASE_YEAR && selectedPeriod.month === 12)
                    }
                  >
                    {statsUi.nextMonth}
                  </button>
                  <select
                    value={selectedApartmentFilter}
                    onChange={(e) => setSelectedApartmentFilter(e.target.value as 'all' | string)}
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-violet-400 sm:text-sm"
                  >
                    <option value="all">{statsUi.allListings}</option>
                    {apartmentsForFilters.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {dateFilterMode === 'custom' ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="text-xs font-semibold text-zinc-600">
                    {statsUi.start}
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="ml-2 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-violet-400 sm:text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-zinc-600">
                    {statsUi.end}
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="ml-2 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-violet-400 sm:text-sm"
                    />
                  </label>
                  {customRangeError ? <p className="w-full text-xs font-semibold text-rose-600">{customRangeError}</p> : null}
                </div>
              ) : null}
            </div>
            {!hasConnectedMetrics ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {statsUi.noConnectedData}
              </div>
            ) : null}
            {statsLoadError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {statsLoadError}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{statsUi.netRevenue}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{`${moneyFormatter.format(netRevenueDisplay)} EUR`}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {dateFilterMode === 'month' ? statsUi.netRevenueMonthHint : statsUi.netRevenuePeriodHint}
                </p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{statsUi.globalOccupancy}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{percentFormatter.format(globalOccupancyDisplay)} %</p>
                <p className="mt-1 text-sm text-zinc-600">{statsUi.globalOccupancyHint}</p>
              </article>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">{statsUi.listingsAndBookings}</p>
              {bookingsByApartment.length > 2 ? (
                <div className="mt-2">
                  <select
                    value={detectedListingFilter}
                    onChange={(e) => {
                      const next = e.target.value
                      setDetectedListingFilter(next)
                      setSelectedApartmentFilter(next === 'all' ? 'all' : next)
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-[#4a86f7] sm:text-sm"
                  >
                    <option value="all">{statsUi.allListings}</option>
                    {bookingsByApartment.map((row) => (
                      <option key={row.apartment} value={row.apartment}>
                        {row.apartment}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {displayedBookingsByApartment.map((row) => (
                  <div key={row.apartment} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-900">{row.apartment}</p>
                    <p className="text-xs text-zinc-600">
                      {statsUi.reservations}: {row.reservations} | {statsUi.cancellations}: {row.cancellations}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {chartOrderMode === 'revenue-first' ? (
              <>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">{statsUi.revenueByMonth}</p>
                  <p className="mt-1 text-xs text-zinc-500">{statsUi.activeFilter}: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number | string, key: string) => [
                            `${moneyFormatter.format(Number(value) || 0)} EUR`,
                            key,
                          ]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">{statsUi.occupancyByMonth}</p>
                  <p className="mt-1 text-xs text-zinc-500">{statsUi.activeFilter}: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number | string, key: string) => [
                            `${percentFormatter.format(Number(value) || 0)} %`,
                            key,
                          ]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">{statsUi.occupancyByMonth}</p>
                  <p className="mt-1 text-xs text-zinc-500">{statsUi.activeFilter}: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number | string, key: string) => [
                            `${percentFormatter.format(Number(value) || 0)} %`,
                            key,
                          ]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">{statsUi.revenueByMonth}</p>
                  <p className="mt-1 text-xs text-zinc-500">{statsUi.activeFilter}: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number | string, key: string) => [
                            `${moneyFormatter.format(Number(value) || 0)} EUR`,
                            key,
                          ]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">{statsUi.splitBookings}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {statsUi.activeFilter}: {selectedApartmentFilter === 'all' ? statsUi.allListings : selectedApartmentFilter}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{statsUi.reservationRate}</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {`${percentFormatter.format(reservationAndCancellation.reservationRate)} %`}
                  </p>
                </article>
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{statsUi.cancellationRate}</p>
                  <p className="mt-1 text-2xl font-bold text-rose-600">
                    {`${percentFormatter.format(reservationAndCancellation.cancellationRate)} %`}
                  </p>
                </article>
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{statsUi.reservationCount}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {reservationAndCancellation.totalCount}
                  </p>
                </article>
              </div>
              <div className="mt-2 grid gap-4 sm:grid-cols-3">
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{statsUi.cancellations}</p>
                  <p className="mt-1 text-2xl font-bold text-rose-600">
                    {reservationAndCancellation.cancelledCount}
                  </p>
                </article>
              </div>
              <p className="mt-3 text-xs font-medium text-zinc-600">
                {`Validées: ${reservationAndCancellation.reservedCount} / Total: ${reservationAndCancellation.totalCount} · Annulations: ${reservationAndCancellation.cancelledCount} / ${reservationAndCancellation.totalCount}`}
              </p>
              <div className="mt-4 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: number | string, key: string) => [
                        `${percentFormatter.format(Number(value) || 0)} %`,
                        key,
                      ]}
                      contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                    />
                    <Pie
                      data={pieDataForDisplay}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={3}
                    >
                      {pieDataForDisplay.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}
