import { useEffect, useMemo, useState } from 'react'
import { Crown } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'

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
type ChannelKey = 'airbnb' | 'booking' | 'channelManager'
type ParsedIcalEvent = {
  start: Date
  end: Date
  status: ReservationStatus
}
type AccessConfig = { ical?: string }

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Dec']
type DateFilterMode = 'month' | 'custom'
type ChartOrderMode = 'revenue-first' | 'occupancy-first'
type RevenueSource = 'airbnb' | 'booking' | 'channel_manager'
type DemoMonthlyMetric = {
  month: number
  airbnbRevenue: number
  bookingRevenue: number
  channelRevenue: number
  airbnbOcc: number
  bookingOcc: number
  channelOcc: number
  reservedCount: number
  cancelledCount: number
}

const DEMO_APARTMENTS = ['Loft Centre Ville', 'Studio Port', 'Villa Jardin']
const DEMO_RESERVATION_EVENTS: ReservationEvent[] = [
  { apartment: 'Loft Centre Ville', date: '2026-04-03', status: 'reserved', nights: 3 },
  { apartment: 'Loft Centre Ville', date: '2026-04-10', status: 'reserved', nights: 4 },
  { apartment: 'Studio Port', date: '2026-04-05', status: 'reserved', nights: 2 },
  { apartment: 'Studio Port', date: '2026-04-12', status: 'cancelled', nights: 2 },
  { apartment: 'Villa Jardin', date: '2026-04-08', status: 'reserved', nights: 5 },
  { apartment: 'Villa Jardin', date: '2026-04-18', status: 'reserved', nights: 4 },
  { apartment: 'Villa Jardin', date: '2026-04-24', status: 'reserved', nights: 3 },
]
const DEMO_MONTHLY_METRICS: DemoMonthlyMetric[] = [
  { month: 1, airbnbRevenue: 3245.8, bookingRevenue: 2589.4, channelRevenue: 1132.7, airbnbOcc: 61.2, bookingOcc: 54.7, channelOcc: 49.3, reservedCount: 34, cancelledCount: 4 },
  { month: 2, airbnbRevenue: 3478.2, bookingRevenue: 2812.5, channelRevenue: 1218.3, airbnbOcc: 64.1, bookingOcc: 57.6, channelOcc: 52.8, reservedCount: 37, cancelledCount: 4 },
  { month: 3, airbnbRevenue: 3926.9, bookingRevenue: 3234.7, channelRevenue: 1365.6, airbnbOcc: 69.4, bookingOcc: 63.2, channelOcc: 58.5, reservedCount: 42, cancelledCount: 5 },
  { month: 4, airbnbRevenue: 4688.4, bookingRevenue: 3691.9, channelRevenue: 1522.1, airbnbOcc: 76.3, bookingOcc: 68.9, channelOcc: 63.4, reservedCount: 49, cancelledCount: 5 },
  { month: 5, airbnbRevenue: 5144.1, bookingRevenue: 4058.8, channelRevenue: 1716.4, airbnbOcc: 81.5, bookingOcc: 71.8, channelOcc: 66.7, reservedCount: 53, cancelledCount: 6 },
  { month: 6, airbnbRevenue: 5662.7, bookingRevenue: 4412.3, channelRevenue: 1891.6, airbnbOcc: 84.2, bookingOcc: 74.6, channelOcc: 69.8, reservedCount: 58, cancelledCount: 6 },
  { month: 7, airbnbRevenue: 6125.5, bookingRevenue: 4764.2, channelRevenue: 2075.9, airbnbOcc: 88.1, bookingOcc: 79.4, channelOcc: 73.2, reservedCount: 64, cancelledCount: 7 },
  { month: 8, airbnbRevenue: 5968.3, bookingRevenue: 4598.6, channelRevenue: 1996.2, airbnbOcc: 86.4, bookingOcc: 77.3, channelOcc: 72.1, reservedCount: 61, cancelledCount: 7 },
  { month: 9, airbnbRevenue: 5267.6, bookingRevenue: 4146.9, channelRevenue: 1781.5, airbnbOcc: 79.6, bookingOcc: 70.8, channelOcc: 65.3, reservedCount: 54, cancelledCount: 6 },
  { month: 10, airbnbRevenue: 4748.9, bookingRevenue: 3852.4, channelRevenue: 1633.2, airbnbOcc: 74.2, bookingOcc: 66.5, channelOcc: 61.7, reservedCount: 48, cancelledCount: 5 },
  { month: 11, airbnbRevenue: 4286.4, bookingRevenue: 3524.2, channelRevenue: 1492.9, airbnbOcc: 70.3, bookingOcc: 62.9, channelOcc: 58.4, reservedCount: 43, cancelledCount: 5 },
  { month: 12, airbnbRevenue: 5038.1, bookingRevenue: 4016.8, channelRevenue: 1703.6, airbnbOcc: 78.4, bookingOcc: 69.7, channelOcc: 64.6, reservedCount: 52, cancelledCount: 6 },
]
const DEMO_BOOKINGS_BY_APARTMENT = [
  { apartment: 'Loft Centre Ville', reservations: 171, cancellations: 17 },
  { apartment: 'Studio Port', reservations: 154, cancellations: 19 },
  { apartment: 'Villa Jardin', reservations: 170, cancellations: 24 },
]

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

export function DashboardStatsPage() {
  const { t } = useLanguage()
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('month')
  const [chartOrderMode, setChartOrderMode] = useState<ChartOrderMode>('revenue-first')
  const [selectedApartmentFilter, setSelectedApartmentFilter] = useState<'all' | string>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [reservationEvents, setReservationEvents] = useState<ReservationEvent[]>([])
  const [connectionsRefreshKey, setConnectionsRefreshKey] = useState(0)
  const [statsLoadError, setStatsLoadError] = useState('')
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
  const connected = useMemo(() => hasRealConnected, [hasRealConnected])
  const apartmentNames = useMemo(() => {
    return getConnectedApartmentsFromStorage().map((apt) => apt.name)
  }, [connectionsRefreshKey])
  const apartmentsForFilters = useMemo(() => {
    return apartmentNames.length > 0 ? apartmentNames : DEMO_APARTMENTS
  }, [apartmentNames])
  const usingDemoData = reservationEvents.length === 0
  const effectiveReservationEvents = useMemo(
    () => (reservationEvents.length > 0 ? reservationEvents : DEMO_RESERVATION_EVENTS),
    [reservationEvents],
  )
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
    const connectedApartments = getConnectedApartmentsFromStorage()
    const official = readOfficialChannelSyncData()
    if (official && official.bookings.length > 0) {
      const propertyIdToApartment = new Map<string, string>()
      connectedApartments.forEach((apt) => {
        const parts = String(apt.id).split(':')
        const propId = parts.length > 1 ? parts.slice(1).join(':') : apt.id
        propertyIdToApartment.set(propId, apt.name)
      })
      setReservationEvents(
        official.bookings
          .map((b) => {
            const apartment = propertyIdToApartment.get(String(b.propertyId))
            if (!apartment) return null
            const checkIn = new Date(`${b.checkIn}T00:00:00`)
            const checkOut = new Date(`${b.checkOut}T00:00:00`)
            if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null
            return {
              apartment,
              date: b.checkIn,
              status: b.status === 'cancelled' ? 'cancelled' : 'reserved',
              nights: nightsBetween(checkIn, checkOut),
            } as ReservationEvent
          })
          .filter((x): x is ReservationEvent => Boolean(x)),
      )
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

        setStatsLoadError('')
      } catch {
        if (!cancelled) {
          setReservationEvents([])
          setStatsLoadError("Impossible de charger les donnees iCal connectees.")
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [connectionsRefreshKey])

  const customRangeError = useMemo(() => {
    if (!customStartDate || !customEndDate) return ''
    const start = new Date(`${customStartDate}T00:00:00`)
    const end = new Date(`${customEndDate}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Dates invalides.'
    if (end < start) return 'La date de fin doit être après la date de début.'
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

  const selectedDemoMetrics = useMemo(() => {
    if (dateFilterMode === 'month') {
      return DEMO_MONTHLY_METRICS.filter((row) => row.month === selectedPeriod.month)
    }
    if (!customStartDate || !customEndDate || customRangeError) return DEMO_MONTHLY_METRICS
    const start = new Date(`${customStartDate}T00:00:00`)
    const end = new Date(`${customEndDate}T23:59:59`)
    return DEMO_MONTHLY_METRICS.filter((row) => isYearMonthInRange(selectedPeriod.year, row.month, start, end))
  }, [customEndDate, customRangeError, customStartDate, dateFilterMode, selectedPeriod.month, selectedPeriod.year])
  const reservationAndCancellation = useMemo(() => {
    const reservedCount = usingDemoData
      ? selectedDemoMetrics.reduce((sum, row) => sum + row.reservedCount, 0)
      : filteredReservationEvents.filter((event) => event.status === 'reserved').length
    const cancelledCount = usingDemoData
      ? selectedDemoMetrics.reduce((sum, row) => sum + row.cancelledCount, 0)
      : filteredReservationEvents.filter((event) => event.status === 'cancelled').length
    const total = reservedCount + cancelledCount
    const reservationRate = total > 0 ? (reservedCount / total) * 100 : 0
    const cancellationRate = total > 0 ? (cancelledCount / total) * 100 : 0
    return {
      reservedCount,
      cancelledCount,
      reservationRate,
      cancellationRate,
      pieData: [
        { name: 'Taux de reservation', value: Number(reservationRate.toFixed(1)), color: '#22c55e' },
        { name: "Taux d'annulation", value: Number(cancellationRate.toFixed(1)), color: '#ef4444' },
      ],
    }
  }, [filteredReservationEvents, selectedDemoMetrics, usingDemoData])
  const hasReservationData = usingDemoData ? true : filteredReservationEvents.length > 0
  const pieDataForDisplay = hasReservationData
    ? reservationAndCancellation.pieData
    : [{ name: 'Aucune donnee', value: 100, color: '#e5e7eb' }]

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
    if (usingDemoData) return DEMO_BOOKINGS_BY_APARTMENT
    return apartmentsForFilters.map((apartment) => ({
      apartment,
      reservations: effectiveReservationEvents.filter((event) => event.apartment === apartment && event.status === 'reserved').length,
      cancellations: effectiveReservationEvents.filter((event) => event.apartment === apartment && event.status === 'cancelled').length,
    }))
  }, [apartmentsForFilters, effectiveReservationEvents, usingDemoData])

  const filteredRevenueEntries = useMemo(() => [], [])

  const activeDateFilterLabel =
    dateFilterMode === 'month'
      ? `Mois: ${MONTH_LABELS[selectedPeriod.month - 1]} ${selectedPeriod.year}`
      : customStartDate && customEndDate && !customRangeError
        ? `Période: ${customStartDate} -> ${customEndDate}`
        : 'Période: personnalisée (incomplète)'
  const activeFilterLabel = `${activeDateFilterLabel} | ${
    selectedApartment ? `Logement: ${selectedApartment}` : 'Logement: Tous les logements'
  }`
  const hasRevenueData = true
  const demoGlobalOccupancy = useMemo(() => {
    if (selectedDemoMetrics.length === 0) return 0
    const avg =
      selectedDemoMetrics.reduce((sum, row) => sum + (row.airbnbOcc + row.bookingOcc + row.channelOcc) / 3, 0) /
      selectedDemoMetrics.length
    return Number(avg.toFixed(1))
  }, [selectedDemoMetrics])

  const chartData = useMemo(() => {
    const demoMap = new Map(DEMO_MONTHLY_METRICS.map((row) => [row.month, row]))
    return MONTH_LABELS.map((label, index) => {
      const month = index + 1
      const monthRows = filteredRevenueEntries.filter((row) => row.month === month)
      const airbnb = monthRows.filter((r) => r.source === 'airbnb').reduce((sum, r) => sum + r.netRevenue, 0)
      const booking = monthRows.filter((r) => r.source === 'booking').reduce((sum, r) => sum + r.netRevenue, 0)
      const channelManager = monthRows.filter((r) => r.source === 'channel_manager').reduce((sum, r) => sum + r.netRevenue, 0)
      const demo = demoMap.get(month)
      const finalAirbnb = airbnb > 0 ? airbnb : (demo?.airbnbRevenue ?? 0)
      const finalBooking = booking > 0 ? booking : (demo?.bookingRevenue ?? 0)
      const finalChannel = channelManager > 0 ? channelManager : (demo?.channelRevenue ?? 0)
      return {
        month: label,
        airbnb: finalAirbnb,
        booking: finalBooking,
        channelManager: finalChannel,
        total: finalAirbnb + finalBooking + finalChannel,
      }
    })
  }, [filteredRevenueEntries])

  const occupancyChartData = useMemo(() => {
    const demoMap = new Map(DEMO_MONTHLY_METRICS.map((row) => [row.month, row]))
    return MONTH_LABELS.map((label, index) => {
      const month = index + 1
      const monthRows = filteredRevenueEntries.filter((row) => row.month === month)
      const sourceRate = (source: RevenueSource) => {
        const rows = monthRows.filter((r) => r.source === source)
        const occupied = rows.reduce((sum, r) => sum + r.occupiedNights, 0)
        const available = rows.reduce((sum, r) => sum + r.availableNights, 0)
        return available > 0 ? Number(((occupied / available) * 100).toFixed(1)) : 0
      }
      const airbnb = sourceRate('airbnb')
      const booking = sourceRate('booking')
      const channelManager = sourceRate('channel_manager')
      const demo = demoMap.get(month)
      return {
        month: label,
        airbnb: airbnb > 0 ? airbnb : (demo?.airbnbOcc ?? 0),
        booking: booking > 0 ? booking : (demo?.bookingOcc ?? 0),
        channelManager: channelManager > 0 ? channelManager : (demo?.channelOcc ?? 0),
      }
    })
  }, [filteredRevenueEntries])
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
  const globalOccupancyDisplay = usingDemoData ? demoGlobalOccupancy : globalOccupancy

  const yearOptions = useMemo(() => {
    const nowYear = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => nowYear - 2 + i)
  }, [])

  const goToPreviousMonth = () => {
    setSelectedPeriod((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setSelectedPeriod((prev) => {
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
            Suivi des encaissements et de l'occupation, logement par logement.
          </p>
        </div>

        {!connected ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#4a86f7]/10 via-[#4a86f7]/5 to-transparent px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4a86f7]">Action requise</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">Aucun logement connecté</p>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-sm text-zinc-700">
                Connecte d'abord tes logements pour afficher les statistiques d'encaissement et le taux d'occupation.
              </p>
              <a
                href="/dashboard/connecter-logements"
                className="mt-4 inline-flex rounded-lg bg-[#4a86f7] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Connecter mes logements
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-indigo-50 px-3 py-3 shadow-sm sm:px-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-3 py-1">
                  <Crown className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-violet-700">Premium</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-violet-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setChartOrderMode('revenue-first')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${chartOrderMode === 'revenue-first' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      Revenu en haut
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartOrderMode('occupancy-first')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${chartOrderMode === 'occupancy-first' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      Taux en haut
                    </button>
                  </div>
                  <div className="inline-flex rounded-lg border border-violet-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('month')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${dateFilterMode === 'month' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      Mois
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateFilterMode('custom')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${dateFilterMode === 'custom' ? 'bg-violet-100 text-violet-700' : 'text-zinc-600'}`}
                    >
                      Date personnalisée
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 sm:text-sm"
                    disabled={dateFilterMode === 'custom'}
                  >
                    Mois précédent
                  </button>
                  <select
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod((prev) => ({ ...prev, month: Number(e.target.value) }))}
                    disabled={dateFilterMode === 'custom'}
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-violet-400 disabled:bg-zinc-100 disabled:text-zinc-400 sm:text-sm"
                  >
                    {MONTH_LABELS.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod((prev) => ({ ...prev, year: Number(e.target.value) }))}
                    disabled={dateFilterMode === 'custom'}
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
                    disabled={dateFilterMode === 'custom'}
                  >
                    Mois suivant
                  </button>
                  <select
                    value={selectedApartmentFilter}
                    onChange={(e) => setSelectedApartmentFilter(e.target.value as 'all' | string)}
                    className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-violet-400 sm:text-sm"
                  >
                    <option value="all">Tous les logements</option>
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
                    Début
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="ml-2 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-violet-400 sm:text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-zinc-600">
                    Fin
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
            {!hasRealConnected ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Mode démo réaliste activé : les chiffres affichés sont simulés pour illustrer un portefeuille connecté.
              </div>
            ) : null}
            {statsLoadError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {statsLoadError}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Encaissement net</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{hasRevenueData ? `${moneyFormatter.format(netRevenueDisplay)} EUR` : '--'}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {hasRevenueData
                    ? dateFilterMode === 'month'
                      ? 'Somme des revenus nets sur le mois sélectionné.'
                      : 'Somme des revenus nets sur la période personnalisée.'
                    : 'Les prix ne sont pas disponibles via iCal seul (Airbnb/Booking).'}
                </p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Taux d'occupation global</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{percentFormatter.format(globalOccupancyDisplay)} %</p>
                <p className="mt-1 text-sm text-zinc-600">Calculé sur l'ensemble des logements affichés.</p>
              </article>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">Logements et reservations detectees</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {bookingsByApartment.map((row) => (
                  <div key={row.apartment} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-900">{row.apartment}</p>
                    <p className="text-xs text-zinc-600">
                      Reservations: {row.reservations} | Annulations: {row.cancellations}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {chartOrderMode === 'revenue-first' ? (
              <>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">Revenu par mois (Airbnb / Booking)</p>
                  <p className="mt-1 text-xs text-zinc-500">Filtre actif: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, key: string) => [`${moneyFormatter.format(value)} EUR`, key]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="channelManager" name="Channel Manager" fill="#3a86ff" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">Taux d'occupation par mois (Airbnb / Booking)</p>
                  <p className="mt-1 text-xs text-zinc-500">Filtre actif: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, key: string) => [`${percentFormatter.format(value)} %`, key]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="channelManager" name="Channel Manager" fill="#3a86ff" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">Taux d'occupation par mois (Airbnb / Booking)</p>
                  <p className="mt-1 text-xs text-zinc-500">Filtre actif: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, key: string) => [`${percentFormatter.format(value)} %`, key]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="channelManager" name="Channel Manager" fill="#3a86ff" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-zinc-900">Revenu par mois (Airbnb / Booking)</p>
                  <p className="mt-1 text-xs text-zinc-500">Filtre actif: {activeFilterLabel}</p>
                  <div className="mt-3 h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#3f3f46', fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, key: string) => [`${moneyFormatter.format(value)} EUR`, key]}
                          contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }}
                        />
                        <Bar dataKey="airbnb" name="Airbnb" fill="#ff006e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="booking" name="Booking" fill="#ffb703" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="channelManager" name="Channel Manager" fill="#3a86ff" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">Répartition réservations / annulations</p>
              <p className="mt-1 text-xs text-zinc-500">
                Filtre actif: {selectedApartmentFilter === 'all' ? 'Tous les logements' : selectedApartmentFilter}
              </p>
              {!hasReservationData ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Données indisponibles pour le moment. Les chiffres seront affichés à partir des données réelles Airbnb/Booking.
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Taux de réservation</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {hasReservationData ? `${percentFormatter.format(reservationAndCancellation.reservationRate)} %` : '--'}
                  </p>
                </article>
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Taux d'annulation</p>
                  <p className="mt-1 text-2xl font-bold text-rose-600">
                    {hasReservationData ? `${percentFormatter.format(reservationAndCancellation.cancellationRate)} %` : '--'}
                  </p>
                </article>
                <article className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nombre de réservations</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {hasReservationData ? reservationAndCancellation.reservedCount : '--'}
                  </p>
                </article>
              </div>
              <div className="mt-4 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: number, key: string) => [`${percentFormatter.format(value)} %`, key]}
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
