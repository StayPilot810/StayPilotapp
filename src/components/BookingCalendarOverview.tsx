import { CalendarDays, Filter } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Locale } from '../i18n/navbar'
import { useLanguage } from '../hooks/useLanguage'
import { getStoredAccounts, storedAccountMatchesNormalizedId } from '../lib/accounts'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import {
  CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT,
  readProviderAssignmentsMap,
} from '../utils/cleaningProviderAssignments'
import { isTestModeEnabled } from '../utils/testMode'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'
import {
  BookingReservationPopover,
  type CalendarReservationDetail,
} from './BookingReservationPopover'

const brandBlue = '#4f86f7'
const airbnbRed = '#ef4444'
const bookingBlue = '#006ce4'
/** Blocs réservation en vue prestataire (pas de code couleur OTA). */
const cleanerReservationBarColor = '#64748b'
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'

const BCP47: Record<Locale, string> = {
  fr: 'fr-FR',
  es: 'es-ES',
  en: 'en-GB',
  de: 'de-DE',
  it: 'it-IT',
}

/** Avril 2026 — base de la simulation (données de démo). */
const BASE_YEAR = 2026
const BASE_MONTH_INDEX = 3

const MOCK_BOOKINGS: CalendarReservationDetail[] = [
  {
    apt: 0,
    channel: 'airbnb',
    start: 2,
    end: 6,
    guest: 'Sarah Johnson',
    nights: 5,
    reservationId: 'HMA2B9XK4L',
    totalGuestEur: 612,
    cleaningEur: 58,
    platformFeePercent: 14.2,
    platformFeeEur: 95,
    netPayoutEur: 575,
  },
  {
    apt: 0,
    channel: 'booking',
    start: 14,
    end: 18,
    guest: 'Lucas Martin',
    nights: 5,
    reservationId: '4287193560',
    bookingGenius: true,
    totalGuestEur: 765,
    cleaningEur: 62,
    platformFeePercent: 19.0,
    platformFeeEur: 157,
    netPayoutEur: 670,
  },
  {
    apt: 0,
    channel: 'airbnb',
    start: 25,
    end: 28,
    guest: 'Alex Turner',
    nights: 4,
    reservationId: 'ZQP8WNR3TJ',
    totalGuestEur: 498,
    cleaningEur: 52,
    platformFeePercent: 14.5,
    platformFeeEur: 80,
    netPayoutEur: 470,
  },
  {
    apt: 1,
    channel: 'booking',
    start: 4,
    end: 9,
    guest: 'Emma Dubois',
    nights: 6,
    reservationId: '5912837465',
    totalGuestEur: 720,
    cleaningEur: 60,
    platformFeePercent: 15.5,
    platformFeeEur: 121,
    netPayoutEur: 659,
  },
  {
    apt: 1,
    channel: 'airbnb',
    start: 20,
    end: 24,
    guest: 'James Wilson',
    nights: 5,
    reservationId: 'BVN7M4K2CX',
    totalGuestEur: 540,
    cleaningEur: 55,
    platformFeePercent: 14.8,
    platformFeeEur: 88,
    netPayoutEur: 507,
  },
  {
    apt: 1,
    channel: 'booking',
    start: 26,
    end: 30,
    guest: 'Sofia Rossi',
    nights: 5,
    reservationId: '8839201746',
    bookingGenius: true,
    totalGuestEur: 931,
    cleaningEur: 70,
    platformFeePercent: 19.5,
    platformFeeEur: 195,
    netPayoutEur: 806,
  },
  {
    apt: 2,
    channel: 'airbnb',
    start: 1,
    end: 4,
    guest: 'Marie Laurent',
    nights: 4,
    reservationId: 'LKJ9HGF3QW',
    totalGuestEur: 420,
    cleaningEur: 48,
    platformFeePercent: 15.1,
    platformFeeEur: 71,
    netPayoutEur: 397,
  },
  {
    apt: 2,
    channel: 'airbnb',
    start: 12,
    end: 15,
    guest: 'Paul Klein',
    nights: 4,
    reservationId: 'RTY5UIO0PA',
    totalGuestEur: 380,
    cleaningEur: 45,
    platformFeePercent: 14.3,
    platformFeeEur: 61,
    netPayoutEur: 364,
  },
  {
    apt: 2,
    channel: 'booking',
    start: 17,
    end: 21,
    guest: 'Nina Patel',
    nights: 5,
    reservationId: '1928374650',
    totalGuestEur: 610,
    cleaningEur: 58,
    platformFeePercent: 16.0,
    platformFeeEur: 107,
    netPayoutEur: 561,
  },
  {
    apt: 2,
    channel: 'airbnb',
    start: 23,
    end: 27,
    guest: 'Tom Hansen',
    nights: 5,
    reservationId: 'ZXCV8BNM1Q',
    totalGuestEur: 550,
    cleaningEur: 52,
    platformFeePercent: 15.0,
    platformFeeEur: 90,
    netPayoutEur: 512,
  },
  {
    apt: 3,
    channel: 'booking',
    start: 6,
    end: 11,
    guest: 'Oliver Smith',
    nights: 6,
    reservationId: '7463528190',
    totalGuestEur: 680,
    cleaningEur: 62,
    platformFeePercent: 15.5,
    platformFeeEur: 115,
    netPayoutEur: 627,
  },
  {
    apt: 3,
    channel: 'airbnb',
    start: 16,
    end: 22,
    guest: 'Clara Müller',
    nights: 7,
    reservationId: 'ASDF6GHJKL',
    totalGuestEur: 890,
    cleaningEur: 72,
    platformFeePercent: 14.6,
    platformFeeEur: 140,
    netPayoutEur: 822,
  },
  {
    apt: 3,
    channel: 'booking',
    start: 3,
    end: 5,
    guest: 'Léa Bernard',
    nights: 3,
    reservationId: '3849201756',
    bookingGenius: true,
    totalGuestEur: 672,
    cleaningEur: 60,
    platformFeePercent: 18.5,
    platformFeeEur: 135,
    netPayoutEur: 597,
  },
  {
    apt: 3,
    channel: 'airbnb',
    start: 28,
    end: 30,
    guest: 'Chris Lee',
    nights: 3,
    reservationId: 'QWER4TYUI1',
    totalGuestEur: 310,
    cleaningEur: 40,
    platformFeePercent: 14.4,
    platformFeeEur: 50,
    netPayoutEur: 300,
  },
  {
    apt: 1,
    channel: 'airbnb',
    start: 11,
    end: 13,
    guest: 'Julia Novak',
    nights: 3,
    reservationId: 'PLM9OKN2IJ',
    totalGuestEur: 290,
    cleaningEur: 38,
    platformFeePercent: 15.2,
    platformFeeEur: 50,
    netPayoutEur: 278,
  },
  {
    apt: 0,
    channel: 'booking',
    start: 8,
    end: 11,
    guest: 'Marc Dubois',
    nights: 4,
    reservationId: '5729183046',
    totalGuestEur: 505,
    cleaningEur: 50,
    platformFeePercent: 16.0,
    platformFeeEur: 89,
    netPayoutEur: 466,
  },
]

const DEMO_APARTMENT_ROW_COUNT = 1 + MOCK_BOOKINGS.reduce((max, b) => Math.max(max, b.apt), 0)

type PeriodTab = 'this' | 'last' | 'next'
type ModalKind = 'option' | 'action'

function capitalizeFirst(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function apartmentName(template: string, n: number) {
  return template.replace('{n}', String(n))
}

function nightsText(template: string, n: number) {
  return template.replace('{n}', String(n))
}

/** Lundi = 0 … dimanche = 6 */
function mondayOffsetFromSundayBasedJsDay(jsDay: number) {
  return (jsDay + 6) % 7
}

function addMonths(base: Date, delta: number) {
  const d = new Date(base)
  d.setMonth(d.getMonth() + delta)
  return d
}

function addDays(base: Date, delta: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + delta)
  return d
}

function cleanerBarDateRangeLabel(
  windowStart: Date,
  booking: CalendarReservationDetail,
  fmt: Intl.DateTimeFormat,
) {
  const d0 = addDays(windowStart, booking.start - 1)
  const d1 = addDays(windowStart, booking.end - 1)
  const a = capitalizeFirst(fmt.format(d0))
  const b = capitalizeFirst(fmt.format(d1))
  return a === b ? a : `${a} – ${b}`
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

type BookingCalendarOverviewProps = {
  /**
   * "connected": use real connected apartment names.
   * "generic": always display "Appartement 1/2/..." regardless of connected names.
   */
  mode?: 'connected' | 'generic'
}

export function BookingCalendarOverview({ mode = 'connected' }: BookingCalendarOverviewProps) {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const c = {
    fr: {
      testListing1: 'Logement test 1',
      testListing2: 'Logement test 2',
      prevMonthAria: 'Mois précédent',
      nextMonthAria: 'Mois suivant',
      reset: 'Réinitialiser',
      noListingsTitle:
        "Veuillez connecter vos logements pour afficher le calendrier des réservations et l'analyse détaillée.",
      noListingsHint:
        "Une fois connectes, vous retrouverez ici la meme vue interactive que sur la page d accueil.",
      cleanerNotAssignedTitle: 'Votre hôte ne vous a pas encore attribué de logement pour le ménage.',
      cleanerNotAssignedHint:
        "Dès qu'un logement vous est assigné dans l'outil ménage, son calendrier apparaît ici (dates et nom du logement uniquement).",
      cleanerNoSyncTitle: "Aucun calendrier n'est disponible pour l'instant.",
      cleanerNoSyncHint: 'Votre hôte doit connecter ses logements dans StayPilot pour synchroniser des dates.',
    },
    en: {
      testListing1: 'Test listing 1',
      testListing2: 'Test listing 2',
      prevMonthAria: 'Previous month',
      nextMonthAria: 'Next month',
      reset: 'Reset',
      noListingsTitle: 'Please connect your listings to display the reservation calendar and detailed analytics.',
      noListingsHint: 'Once connected, you will find the same interactive view here as on the home page.',
      cleanerNotAssignedTitle: 'Your host has not assigned any listing to you for cleaning yet.',
      cleanerNotAssignedHint:
        'Once a listing is assigned to you in the cleaning tools, its calendar appears here (dates and listing name only).',
      cleanerNoSyncTitle: 'No calendar is available yet.',
      cleanerNoSyncHint: 'Your host needs to connect their listings in StayPilot before dates can show up here.',
    },
    es: {
      testListing1: 'Alojamiento de prueba 1',
      testListing2: 'Alojamiento de prueba 2',
      prevMonthAria: 'Mes anterior',
      nextMonthAria: 'Mes siguiente',
      reset: 'Restablecer',
      noListingsTitle: 'Conecta tus alojamientos para mostrar el calendario de reservas y el análisis detallado.',
      noListingsHint: 'Una vez conectados, encontrarás aquí la misma vista interactiva que en la página de inicio.',
      cleanerNotAssignedTitle: 'Tu anfitrión aún no te ha asignado ningún alojamiento para la limpieza.',
      cleanerNotAssignedHint:
        'Cuando te asignen un alojamiento en las herramientas de limpieza, su calendario aparecerá aquí (solo fechas y nombre del alojamiento).',
      cleanerNoSyncTitle: 'Todavía no hay ningún calendario disponible.',
      cleanerNoSyncHint: 'Tu anfitrión debe conectar sus alojamientos en StayPilot para que aparezcan fechas aquí.',
    },
    de: {
      testListing1: 'Testunterkunft 1',
      testListing2: 'Testunterkunft 2',
      prevMonthAria: 'Vorheriger Monat',
      nextMonthAria: 'Nächster Monat',
      reset: 'Zurücksetzen',
      noListingsTitle: 'Bitte verbinden Sie Ihre Unterkünfte, um den Reservierungskalender und die Detailanalyse anzuzeigen.',
      noListingsHint: 'Nach der Verbindung sehen Sie hier dieselbe interaktive Ansicht wie auf der Startseite.',
      cleanerNotAssignedTitle: 'Ihr Gastgeber hat Ihnen noch keine Unterkunft für die Reinigung zugewiesen.',
      cleanerNotAssignedHint:
        'Sobald im Reinigungstool eine Unterkunft zugewiesen wird, erscheint der Kalender hier (nur Daten und Unterkunftsname).',
      cleanerNoSyncTitle: 'Derzeit ist kein Kalender verfügbar.',
      cleanerNoSyncHint: 'Ihr Gastgeber muss die Unterkünfte in StayPilot verbinden, damit hier Daten angezeigt werden.',
    },
    it: {
      testListing1: 'Alloggio test 1',
      testListing2: 'Alloggio test 2',
      prevMonthAria: 'Mese precedente',
      nextMonthAria: 'Mese successivo',
      reset: 'Reimposta',
      noListingsTitle:
        "Collega i tuoi alloggi per visualizzare il calendario delle prenotazioni e l'analisi dettagliata.",
      noListingsHint: 'Una volta collegati, troverai qui la stessa vista interattiva della home page.',
      cleanerNotAssignedTitle: 'Il tuo host non ti ha ancora assegnato un alloggio per le pulizie.',
      cleanerNotAssignedHint:
        "Quando ti viene assegnato un alloggio negli strumenti pulizie, il calendario compare qui (solo date e nome dell'alloggio).",
      cleanerNoSyncTitle: 'Nessun calendario è disponibile al momento.',
      cleanerNoSyncHint: 'Il tuo host deve collegare gli alloggi in StayPilot perché compaiano le date qui.',
    },
  }[ll]
  const modalTitleId = useId()
  const calendarWrapRef = useRef<HTMLDivElement>(null)

  const [periodTab, setPeriodTab] = useState<PeriodTab>('this')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [apartmentFilter, setApartmentFilter] = useState<'all' | string>('all')
  const [rangeStartDate, setRangeStartDate] = useState<Date | null>(null)
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>(null)
  const [rangeLimitMessage, setRangeLimitMessage] = useState('')
  const [miniCalendarCursor, setMiniCalendarCursor] = useState<Date>(() => new Date(BASE_YEAR, BASE_MONTH_INDEX, 1))
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [hoverPop, setHoverPop] = useState<null | {
    booking: CalendarReservationDetail
    anchor: DOMRect
  }>(null)
  const hidePopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [connectionsTick, setConnectionsTick] = useState(0)
  const [assignmentsTick, setAssignmentsTick] = useState(0)

  const bcp47 = BCP47[locale]
  const isCleanerSession =
    typeof window !== 'undefined' &&
    (localStorage.getItem('staypilot_current_role') || '').trim().toLowerCase() === 'cleaner'
  const canNavigateFreelyByMonth = mode === 'connected' && !isTestModeEnabled()
  const fmtShortDate = useMemo(
    () => new Intl.DateTimeFormat(bcp47, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [bcp47],
  )

  // "this / last / next" navigation for the dashboard.
  // In "generic" mode we keep periodTab locked on "this", so the calendar stays on the base month.
  const viewMonthMeta = useMemo(() => {
    const base = new Date(BASE_YEAR, BASE_MONTH_INDEX, 1)
    const d = canNavigateFreelyByMonth
      ? new Date(miniCalendarCursor.getFullYear(), miniCalendarCursor.getMonth(), 1)
      : (() => {
          const offset = periodTab === 'last' ? -1 : periodTab === 'next' ? 1 : 0
          const tmp = new Date(base)
          tmp.setMonth(tmp.getMonth() + offset)
          return tmp
        })()

    const year = d.getFullYear()
    const monthIndex = d.getMonth()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    return { year, monthIndex, daysInMonth }
  }, [periodTab, canNavigateFreelyByMonth, miniCalendarCursor])

  const viewYear = viewMonthMeta.year
  const viewMonthIndex = viewMonthMeta.monthIndex
  const daysInMonth = viewMonthMeta.daysInMonth
  const miniYear = miniCalendarCursor.getFullYear()
  const miniMonthIndex = miniCalendarCursor.getMonth()
  const miniDaysInMonth = new Date(miniYear, miniMonthIndex + 1, 0).getDate()

  const { connectedApartments, hostChannelCountBeforeCleanerFilter } = useMemo(() => {
    if (mode === 'generic') {
      return {
        connectedApartments: Array.from({ length: DEMO_APARTMENT_ROW_COUNT }, (_, idx) => ({
          id: `demo-${idx + 1}`,
          name: apartmentName(t.apartmentLabel, idx + 1),
        })),
        hostChannelCountBeforeCleanerFilter: -1,
      }
    }

    // Dashboard calendar must reflect the channel manager state.
    // Ignore iCal-based Airbnb/Booking entries to prevent extra "Appartement N" lines.
    const fromConnected = getConnectedApartmentsFromStorage()
      .filter((apt) => apt.platform === 'channelManager')
      .map((apt) => ({
        id: apt.id,
        name: apt.name,
      }))
    let list = fromConnected
    if (list.length === 0 && isTestModeEnabled()) {
      list = [
        { id: 'test-1', name: c.testListing1 },
        { id: 'test-2', name: c.testListing2 },
      ]
    }
    const unfilteredCount = list.length
    const role =
      typeof window !== 'undefined' ? (localStorage.getItem('staypilot_current_role') || '').trim().toLowerCase() : ''
    const isCleaner = role === 'cleaner'
    if (isCleaner && list.length > 0) {
      const assignments = readProviderAssignmentsMap()
      const uid = (
        typeof window !== 'undefined'
          ? localStorage.getItem('staypilot_current_user') || localStorage.getItem('staypilot_login_identifier') || ''
          : ''
      ).trim()
      const lower = uid.toLowerCase()
      const acc = lower ? getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, lower)) : undefined
      const matchKey = acc
        ? (`${acc.firstName || ''} ${acc.lastName || ''}`.trim() || acc.username || '').trim().toLowerCase()
        : ''
      if (matchKey) {
        list = list.filter((apt) => (assignments[apt.id] || '').trim().toLowerCase() === matchKey)
      } else {
        list = []
      }
    }
    return { connectedApartments: list, hostChannelCountBeforeCleanerFilter: unfilteredCount }
  }, [mode, t.apartmentLabel, connectionsTick, assignmentsTick, c.testListing1, c.testListing2])

  const officialSync = useMemo(() => {
    if (mode !== 'connected') return null
    if (isTestModeEnabled()) return null
    return readOfficialChannelSyncData()
  }, [mode, connectionsTick])

  const selectedRange = useMemo(() => {
    if (!rangeStartDate || !rangeEndDate) return null
    const start = startOfDay(rangeStartDate)
    const end = startOfDay(rangeEndDate)
    if (end.getTime() < start.getTime()) return null
    return { start, end }
  }, [rangeStartDate, rangeEndDate])

  const displayWindow = useMemo(() => {
    if (selectedRange) {
      const days = Math.floor((selectedRange.end.getTime() - selectedRange.start.getTime()) / (24 * 60 * 60 * 1000)) + 1
      return { start: selectedRange.start, end: selectedRange.end, days }
    }
    const start = new Date(viewYear, viewMonthIndex, 1)
    const end = new Date(viewYear, viewMonthIndex, daysInMonth)
    return { start, end, days: daysInMonth }
  }, [selectedRange, viewYear, viewMonthIndex, daysInMonth])

  const fmtCleanerBar = useMemo(
    () => new Intl.DateTimeFormat(bcp47, { day: 'numeric', month: 'short' }),
    [bcp47],
  )

  const emptyConnectedCalendarCopy = useMemo(() => {
    if (mode !== 'connected' || connectedApartments.length > 0) return null
    if (isCleanerSession) {
      if (!isTestModeEnabled() && hostChannelCountBeforeCleanerFilter === 0) {
        return { title: c.cleanerNoSyncTitle, hint: c.cleanerNoSyncHint }
      }
      return { title: c.cleanerNotAssignedTitle, hint: c.cleanerNotAssignedHint }
    }
    return { title: c.noListingsTitle, hint: c.noListingsHint }
  }, [
    mode,
    connectedApartments.length,
    isCleanerSession,
    hostChannelCountBeforeCleanerFilter,
    c.cleanerNoSyncTitle,
    c.cleanerNoSyncHint,
    c.cleanerNotAssignedTitle,
    c.cleanerNotAssignedHint,
    c.noListingsTitle,
    c.noListingsHint,
  ])

  const realBookings = useMemo(() => {
    if (mode !== 'connected') return []
    if (!officialSync?.bookings?.length) return []

    const propertyIdToAptIndex = new Map<string, number>()
    connectedApartments.forEach((apt, idx) => {
      const prefix = 'channelManager:'
      const propertyId = apt.id.startsWith(prefix) ? apt.id.slice(prefix.length) : apt.id
      propertyIdToAptIndex.set(propertyId, idx)
    })

    const propertyIdToChannelLinks = new Map<string, Record<string, unknown>>()
    if (Array.isArray(officialSync.properties)) {
      officialSync.properties.forEach((p: Record<string, unknown>) =>
        propertyIdToChannelLinks.set(String(p.id), (p.channelLinks as Record<string, unknown>) ?? {}),
      )
    }

    const msPerDay = 24 * 60 * 60 * 1000
    const parseYmdToLocalDate = (iso: string) => {
      const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (m) {
        const y = Number(m[1])
        const mo = Number(m[2]) - 1
        const day = Number(m[3])
        return new Date(y, mo, day)
      }
      const d = new Date(iso)
      if (!Number.isFinite(d.getTime())) return null
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }

    const windowStart = startOfDay(displayWindow.start)
    const windowEndExclusive = addDays(startOfDay(displayWindow.end), 1)

    return officialSync.bookings
      .map((b: Record<string, unknown>) => {
        const propertyId = String(b.propertyId ?? '')
        const aptIndex = propertyIdToAptIndex.get(propertyId)
        if (aptIndex == null) return null

        const checkInDate = parseYmdToLocalDate(String(b.checkIn ?? ''))
        const checkOutDate = parseYmdToLocalDate(String(b.checkOut ?? ''))
        if (!checkInDate || !checkOutDate) return null

        // booking = [checkIn, checkOut) overlap with current selected window.
        if (checkInDate >= checkOutDate) return null
        const overlapStartTime = Math.max(checkInDate.getTime(), windowStart.getTime())
        const overlapEndExclusiveTime = Math.min(checkOutDate.getTime(), windowEndExclusive.getTime())
        if (overlapEndExclusiveTime <= overlapStartTime) return null

        const overlapStart = new Date(overlapStartTime)
        const overlapEndExclusive = new Date(overlapEndExclusiveTime)
        const start = Math.floor((overlapStart.getTime() - windowStart.getTime()) / msPerDay) + 1
        const end = Math.floor((overlapEndExclusive.getTime() - windowStart.getTime()) / msPerDay)
        const nights = Math.floor((overlapEndExclusive.getTime() - overlapStart.getTime()) / msPerDay)
        if (start < 1 || end < 1 || start > displayWindow.days || end > displayWindow.days || nights < 1) return null

        const links = propertyIdToChannelLinks.get(propertyId)
        const bookingChannel = String(b?.channel || '').toLowerCase()
        const channel: 'airbnb' | 'booking' =
          bookingChannel === 'booking' || bookingChannel.includes('booking')
            ? 'booking'
            : bookingChannel === 'airbnb' || bookingChannel.includes('airbnb')
              ? 'airbnb'
              : links?.airbnb
                ? 'airbnb'
                : links?.booking
                  ? 'booking'
                  : 'airbnb'

        const totalGuestEur = Number(b?.prixTotalVoyageur?.amount ?? 0)
        const cleaningEur = Number(b?.fraisMenage?.amount ?? 0)
        const platformFeeEur = Number(b?.fraisPlateforme?.amount ?? 0)
        const netPayoutEur = Number(b?.revenuNetDetaille?.amount ?? 0)
        const platformFeePercentFromChannel = Number(b?.fraisPlateforme?.percent ?? 0)
        const computedPercentBase = totalGuestEur + cleaningEur
        const platformFeePercent =
          platformFeePercentFromChannel > 0
            ? platformFeePercentFromChannel
            : computedPercentBase > 0
              ? (platformFeeEur / computedPercentBase) * 100
              : 0

        return {
          apt: aptIndex,
          channel,
          start,
          end,
          guest: String(b.guestName || ''),
          nights,
          reservationId: String(b.id || ''),
          totalGuestEur,
          cleaningEur,
          platformFeePercent,
          platformFeeEur,
          netPayoutEur,
          bookingGenius: false,
        } satisfies CalendarReservationDetail
      })
      .filter(Boolean) as CalendarReservationDetail[]
  }, [mode, officialSync, connectedApartments, displayWindow])

  const calendarRowEntries = useMemo(() => {
    return connectedApartments.map((conn, index) => ({ id: conn.id, name: conn.name, index }))
  }, [connectedApartments, t.apartmentLabel])

  const visibleApartmentEntries = useMemo(() => {
    if (apartmentFilter === 'all') return calendarRowEntries
    return calendarRowEntries.filter((apt) => String(apt.index + 1) === apartmentFilter)
  }, [calendarRowEntries, apartmentFilter])
  const hasConnectedListings = connectedApartments.length > 0
  const apartmentCount = calendarRowEntries.length
  const normalizedMockBookings = useMemo(
    () =>
      MOCK_BOOKINGS.map((b) => {
        const computedPercentBase = Number(b.totalGuestEur || 0) + Number(b.cleaningEur || 0)
        const platformFeePercent = computedPercentBase > 0 ? (Number(b.platformFeeEur || 0) / computedPercentBase) * 100 : 0
        return {
          ...b,
          // Keep percentages strictly tied to fee amounts (no hardcoded approximation drift).
          platformFeePercent,
        }
      }),
    [],
  )
  const availableBookings = useMemo(() => {
    const sourceBookings =
      mode === 'connected' && !isTestModeEnabled() ? realBookings : normalizedMockBookings
    return sourceBookings.filter((b) => b.apt < apartmentCount)
  }, [apartmentCount, mode, realBookings, normalizedMockBookings])
  const visibleBookings = useMemo(() => {
    const byApartment =
      apartmentFilter === 'all' ? availableBookings : availableBookings.filter((b) => b.apt === Number(apartmentFilter) - 1)
    if (mode === 'connected' && !isTestModeEnabled()) return byApartment
    if (!rangeStartDate || !rangeEndDate) return byApartment
    return byApartment.filter((b) => {
      const bookingStart = new Date(viewYear, viewMonthIndex, b.start)
      const bookingEnd = new Date(viewYear, viewMonthIndex, b.end)
      return bookingEnd.getTime() >= rangeStartDate.getTime() && bookingStart.getTime() <= rangeEndDate.getTime()
    })
  }, [apartmentFilter, availableBookings, rangeStartDate, rangeEndDate, viewMonthIndex, viewYear, mode])
  const computedStats = useMemo(() => {
    const totalSlots = visibleApartmentEntries.length * daysInMonth
    const bookedNights = visibleBookings.reduce((sum, b) => sum + b.nights, 0)
    const occupancyRate = totalSlots > 0 ? `${Math.round((bookedNights / totalSlots) * 100)}%` : '0%'
    const airbnbCount = visibleBookings.filter((b) => b.channel === 'airbnb').length
    const bookingCount = visibleBookings.filter((b) => b.channel === 'booking').length
    return {
      occupancyRate,
      totalBookings: visibleBookings.length,
      bookedNights: `${bookedNights} / ${totalSlots}`,
      airbnbCount,
      bookingCount,
    }
  }, [visibleApartmentEntries.length, visibleBookings, daysInMonth])

  // When channel manager data changes, the calendar must update immediately
  // (otherwise it can keep stale apartments and show Appartement 3/4 even if only 2 are connected).
  useEffect(() => {
    if (mode !== 'connected') return
    setApartmentFilter('all')
    setRangeStartDate(null)
    setRangeEndDate(null)
    setHoverPop(null)
  }, [mode, connectionsTick])

  useEffect(() => {
    if (mode !== 'connected') return
    const onUpdated = () => setConnectionsTick((v) => v + 1)
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(CONNECTIONS_UPDATED_EVENT, onUpdated)
  }, [mode])

  useEffect(() => {
    const onAssignments = () => setAssignmentsTick((v) => v + 1)
    window.addEventListener(CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT, onAssignments)
    return () => window.removeEventListener(CLEANING_PROVIDER_ASSIGNMENTS_UPDATED_EVENT, onAssignments)
  }, [])

  const closeModal = useCallback(() => setModal(null), [])

  const showDemoAction = useCallback(() => setModal('action'), [])

  const clearHidePop = useCallback(() => {
    if (hidePopTimer.current != null) {
      clearTimeout(hidePopTimer.current)
      hidePopTimer.current = null
    }
  }, [])

  const scheduleHidePop = useCallback(() => {
    clearHidePop()
    hidePopTimer.current = setTimeout(() => setHoverPop(null), 160)
  }, [clearHidePop])

  const openPop = useCallback(
    (booking: CalendarReservationDetail, el: HTMLElement) => {
      clearHidePop()
      setHoverPop({ booking, anchor: el.getBoundingClientRect() })
    },
    [clearHidePop],
  )

  useEffect(() => {
    if (!modal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [modal])

  useEffect(() => {
    if (!modal && !calendarOpen && !hoverPop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
        setCalendarOpen(false)
        setHoverPop(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, calendarOpen, hoverPop, closeModal])

  useEffect(() => {
    if (!hoverPop) return
    const close = () => setHoverPop(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [hoverPop])

  useEffect(() => {
    if (!calendarOpen) return
    const onPointer = (e: MouseEvent) => {
      const el = calendarWrapRef.current
      if (el && !el.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [calendarOpen])

  useEffect(
    () => () => {
      if (hidePopTimer.current != null) clearTimeout(hidePopTimer.current)
    },
    [],
  )

  const monthYearLabel = useMemo(() => {
    const raw = new Intl.DateTimeFormat(bcp47, {
      month: 'long',
      year: 'numeric',
    }).format(new Date(viewYear, viewMonthIndex, 1))
    return capitalizeFirst(raw)
  }, [bcp47, viewYear, viewMonthIndex])

  const dayHeaders = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(bcp47, { weekday: 'short' })
    return Array.from({ length: displayWindow.days }, (_, i) => {
      const d = addDays(displayWindow.start, i)
      const abbr = fmt.format(d).replace(/\.$/, '')
      return { day: d.getDate(), weekday: capitalizeFirst(abbr) }
    })
  }, [bcp47, displayWindow])

  const miniCalendarWeekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(bcp47, { weekday: 'short' })
    const firstDay = new Date(miniYear, miniMonthIndex, 1)
    const monday = new Date(firstDay)
    const blanks = mondayOffsetFromSundayBasedJsDay(firstDay.getDay())
    monday.setDate(firstDay.getDate() - blanks)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return capitalizeFirst(fmt.format(d).replace(/\.$/, ''))
    })
  }, [bcp47, miniMonthIndex, miniYear])

  const leadingBlanks = useMemo(() => {
    const first = new Date(miniYear, miniMonthIndex, 1)
    return mondayOffsetFromSundayBasedJsDay(first.getDay())
  }, [miniMonthIndex, miniYear])

  const periodTabs: { id: PeriodTab; label: string }[] = [
    { id: 'this', label: t.tabThisMonth },
    { id: 'last', label: t.tabLastMonth },
    { id: 'next', label: t.tabNextMonth },
  ]

  const onApartmentChange = (value: string) => {
    setApartmentFilter(value === 'all' ? 'all' : value)
  }

  const onPeriodTabClick = (id: PeriodTab) => {
    // Dashboard connected: allow navigation across months.
    if (mode === 'connected' && !isTestModeEnabled()) {
      const offset = id === 'last' ? -1 : id === 'next' ? 1 : 0
      const target = addMonths(new Date(BASE_YEAR, BASE_MONTH_INDEX, 1), offset)
      setPeriodTab(id)
      setMiniCalendarCursor(target)
      setRangeStartDate(null)
      setRangeEndDate(null)
      setCalendarOpen(false)
      return
    }

    // Generic mode (home page): keep demo locked.
    if (id === 'this') {
      setPeriodTab('this')
      return
    }
    showDemoAction()
  }

  const onMiniCalendarDayClick = (day: number) => {
    const clicked = new Date(miniYear, miniMonthIndex, day)
    if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
      setRangeStartDate(clicked)
      setRangeEndDate(null)
      setRangeLimitMessage('')
      // Keep dashboard month aligned with selected start date month.
      setMiniCalendarCursor(new Date(clicked.getFullYear(), clicked.getMonth(), 1))
      return
    }
    const start = clicked.getTime() < rangeStartDate.getTime() ? clicked : rangeStartDate
    let end = clicked.getTime() < rangeStartDate.getTime() ? rangeStartDate : clicked
    const msPerDay = 24 * 60 * 60 * 1000
    const spanDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1
    let exceededLimit = false
    if (spanDays > 30) {
      end = addDays(start, 29)
      setRangeLimitMessage('Plage maximale: 30 jours.')
      exceededLimit = true
    } else {
      setRangeLimitMessage('')
    }
    setRangeStartDate(start)
    setRangeEndDate(end)
    // After confirming range, display the month of the selected range start.
    setMiniCalendarCursor(new Date(start.getFullYear(), start.getMonth(), 1))
    setCalendarOpen(exceededLimit)
  }

  const clearDateRange = () => {
    setRangeStartDate(null)
    setRangeEndDate(null)
    setRangeLimitMessage('')
    setCalendarOpen(false)
  }

  const miniMonthLabel = useMemo(() => {
    const raw = new Intl.DateTimeFormat(bcp47, {
      month: 'long',
      year: 'numeric',
    }).format(new Date(miniYear, miniMonthIndex, 1))
    return capitalizeFirst(raw)
  }, [bcp47, miniMonthIndex, miniYear])

  const dateRangeLabel =
    rangeStartDate && rangeEndDate
      ? `${fmtShortDate.format(rangeStartDate)} - ${fmtShortDate.format(rangeEndDate)}`
      : t.customDates

  const modalMessage = modal === 'option' ? t.demoUnavailableOption : t.demoUnavailableAction

  return (
    <div className="mt-8 w-full sm:mt-10 lg:mt-11">
      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#64748b]/25 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-8 backdrop-blur-[3px] sm:items-center sm:pb-8"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="max-h-[min(90dvh,100%)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-200/70 bg-white px-5 py-7 text-center shadow-pm-xl sm:rounded-2xl sm:px-10 sm:py-8"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p
              id={modalTitleId}
              className="text-base font-normal leading-relaxed text-[#9ca3af]/85 sm:text-lg"
            >
              {modalMessage}
            </p>
            <button
              type="button"
              className="mt-6 min-h-[48px] w-full rounded-xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-pm-cta sm:mt-8 sm:min-h-0 sm:w-auto sm:min-w-[8rem] sm:py-3 sm:text-sm"
              style={{ backgroundColor: brandBlue }}
              onClick={closeModal}
            >
              {t.modalClose}
            </button>
          </div>
        </div>
      ) : null}

      {hoverPop ? (
        <BookingReservationPopover
          booking={hoverPop.booking}
          anchor={{
            left: hoverPop.anchor.left,
            top: hoverPop.anchor.top,
            width: hoverPop.anchor.width,
            height: hoverPop.anchor.height,
          }}
          t={t}
          locale={locale}
          referenceYear={viewYear}
          referenceMonthIndex={viewMonthIndex}
          referenceStartDate={displayWindow.start}
          apartmentLabel={(n) => {
            const row = calendarRowEntries[n - 1]
            return row?.name || apartmentName(t.apartmentLabel, n)
          }}
          nightsLabel={(n) => nightsText(t.nightsLabel, n)}
          restrictedView={isCleanerSession && mode === 'connected'}
          cleanerPrivacy={isCleanerSession && mode === 'connected'}
          onMouseEnter={clearHidePop}
          onMouseLeave={scheduleHidePop}
        />
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-pm-md sm:shadow-pm-lg">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-6">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 sm:text-xl">
              {isCleanerSession && mode === 'connected' ? t.calendarTitleCleaner : t.calendarTitle}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[13px] font-medium text-[#71717a] sm:text-sm">{monthYearLabel}</p>
              {canNavigateFreelyByMonth ? (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodTab('this')
                      setMiniCalendarCursor(addMonths(new Date(viewYear, viewMonthIndex, 1), -1))
                      setRangeStartDate(null)
                      setRangeEndDate(null)
                    }}
                    className="rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                    aria-label={c.prevMonthAria}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodTab('this')
                      setMiniCalendarCursor(addMonths(new Date(viewYear, viewMonthIndex, 1), 1))
                      setRangeStartDate(null)
                      setRangeEndDate(null)
                    }}
                    className="rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                    aria-label={c.nextMonthAria}
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-4">
            {isCleanerSession && mode === 'connected' ? null : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] sm:text-sm">
                <span className="flex items-center gap-2 text-[#3f3f46]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: airbnbRed }} />
                  {t.legendAirbnb}
                </span>
                <span className="flex items-center gap-2 text-[#3f3f46]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: bookingBlue }} />
                  {t.legendBooking}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center gap-2">
            {periodTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onPeriodTabClick(id)}
                className={`min-h-[44px] rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm ${
                  periodTab === id
                    ? 'text-white'
                    : 'text-[#71717a] hover:bg-gray-50 hover:text-[#1a1a1a]'
                }`}
                style={periodTab === id ? { backgroundColor: brandBlue } : undefined}
              >
                {label}
              </button>
            ))}
            <div className="relative" ref={calendarWrapRef}>
              <button
                type="button"
                onClick={() => setCalendarOpen((o) => !o)}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm ${
                  calendarOpen
                    ? 'border-[#4f86f7] bg-[#f5f8ff] text-[#1a1a1a] ring-2 ring-[#4f86f7]/25'
                    : 'border-transparent text-[#71717a] hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={2} />
                {dateRangeLabel}
              </button>
              {calendarOpen ? (
                <div
                  className="absolute left-0 top-full z-30 mt-2 w-[min(100vw-2.5rem,17.5rem)] rounded-xl border border-zinc-200/80 bg-white p-3 shadow-pm-lg sm:left-auto sm:right-0"
                  role="dialog"
                  aria-label={t.customDates}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setMiniCalendarCursor((d) => addMonths(d, -1))}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                      aria-label={c.prevMonthAria}
                    >
                      ←
                    </button>
                    <p className="text-center text-xs font-semibold text-[#1a1a1a]">{miniMonthLabel}</p>
                    <button
                      type="button"
                      onClick={() => setMiniCalendarCursor((d) => addMonths(d, 1))}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                      aria-label={c.nextMonthAria}
                    >
                      →
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-[#a1a1aa]">
                    {miniCalendarWeekdays.map((w) => (
                      <div key={w} className="py-1">
                        {w.slice(0, 2)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-0.5">
                    {Array.from({ length: leadingBlanks }, (_, i) => (
                      <div key={`b-${i}`} className="aspect-square" aria-hidden />
                    ))}
                    {Array.from({ length: miniDaysInMonth }, (_, i) => {
                      const day = i + 1
                      const currentDate = new Date(miniYear, miniMonthIndex, day)
                      const inRange =
                        rangeStartDate &&
                        rangeEndDate &&
                        currentDate.getTime() >= rangeStartDate.getTime() &&
                        currentDate.getTime() <= rangeEndDate.getTime()
                      const isStart = isSameDay(currentDate, rangeStartDate)
                      const isEnd = isSameDay(currentDate, rangeEndDate)
                      const isSelected = Boolean(inRange || isStart || isEnd)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => onMiniCalendarDayClick(day)}
                          className={`flex min-h-[44px] w-full items-center justify-center rounded-lg text-xs font-semibold transition-colors sm:aspect-square sm:min-h-0 ${
                            isSelected
                              ? isStart || isEnd
                                ? 'bg-[#2563eb] text-white ring-2 ring-[#1d4ed8]/40'
                                : 'bg-[#dbeafe] text-[#1e3a8a]'
                              : 'text-[#3f3f46] hover:bg-[#e8f0fe] hover:text-[#1a1a1a]'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={clearDateRange}
                      className="rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100"
                    >
                      {c.reset}
                    </button>
                  </div>
                  {rangeLimitMessage ? (
                    <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                      {rangeLimitMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-11 min-h-[44px] min-w-0 max-w-full flex-1 cursor-pointer rounded-xl border border-zinc-200/80 bg-white px-3 text-[13px] font-medium text-zinc-900 shadow-pm-xs outline-none focus:border-[#4f86f7] focus:ring-2 focus:ring-[#4f86f7]/20 sm:h-10 sm:min-h-0 sm:min-w-[11rem] sm:max-w-none sm:flex-none sm:text-sm"
              aria-label={isCleanerSession && mode === 'connected' ? t.allAssignedListings : t.allApartments}
              value={apartmentFilter}
              onChange={(e) => onApartmentChange(e.target.value)}
            >
              <option value="all">
                {isCleanerSession && mode === 'connected' ? t.allAssignedListings : t.allApartments}
              </option>
              {calendarRowEntries.map((apt) => (
                <option key={apt.id} value={String(apt.index + 1)}>
                  {apt.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 text-zinc-600 shadow-pm-xs transition-colors hover:bg-zinc-50 sm:h-10 sm:w-10"
              aria-label={t.filterPropertiesAria}
            >
              <Filter className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {!hasConnectedListings ? (
          <div className="px-4 py-8 sm:px-6 sm:py-10">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center sm:px-6 sm:py-6">
              <p className="text-sm font-semibold text-zinc-900">
                {emptyConnectedCalendarCopy?.title ?? c.noListingsTitle}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {emptyConnectedCalendarCopy?.hint ?? c.noListingsHint}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="-mx-px overflow-x-auto overscroll-x-contain touch-pan-x">
          <div className="min-w-[720px] px-4 pb-2 pt-3 sm:px-6 sm:pt-4">
            <div
              className="grid items-end gap-y-1"
                      style={{
                        gridTemplateColumns: `7.5rem repeat(${displayWindow.days}, minmax(0, 1fr))`,
                      }}
            >
              <div />
              {dayHeaders.map(({ day, weekday }) => (
                <div key={day} className="px-0.5 text-center">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[#a1a1aa] sm:text-[11px]">
                    {weekday}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-[#52525b] sm:text-sm">{day}</div>
                </div>
              ))}

              {visibleApartmentEntries.map((aptEntry) => (
                <div key={aptEntry.id} className="contents">
                  <div className="flex items-center py-3 pr-2 text-sm font-medium text-[#3f3f46]">
                    {aptEntry.name}
                  </div>
                  <div
                    className="relative grid min-h-[3.5rem] items-center border-t border-zinc-100 py-0.5"
                    style={{
                      gridColumn: '2 / -1',
                      gridTemplateColumns: `repeat(${displayWindow.days}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: displayWindow.days }, (_, i) => (
                      <div
                        key={i}
                        className="h-full border-l border-zinc-100 first:border-l-0"
                        aria-hidden
                      />
                    ))}
                    {visibleBookings.filter((b) => b.apt === aptEntry.index).map((b) => {
                      const start = Math.max(1, b.start)
                      const end = Math.min(displayWindow.days, b.end)
                      const colStart = start
                      const span = end - start + 1
                      const cleanerCal = isCleanerSession && mode === 'connected'
                      const bg = cleanerCal
                        ? cleanerReservationBarColor
                        : b.channel === 'airbnb'
                          ? airbnbRed
                          : bookingBlue
                      const barLabel = cleanerBarDateRangeLabel(displayWindow.start, b, fmtCleanerBar)
                      const ariaLabel = cleanerCal
                        ? `${aptEntry.name}, ${barLabel}`
                        : `${b.guest}, ${nightsText(t.nightsLabel, b.nights)}, ${t.reservationNumberLabel} ${b.reservationId}`
                      return (
                        <div
                          key={b.reservationId}
                          role="button"
                          tabIndex={0}
                          aria-label={ariaLabel}
                          className="absolute inset-y-0.5 z-10 flex min-w-0 cursor-pointer items-center rounded-md px-1.5 py-0.5 shadow-sm transition-shadow hover:z-30 hover:shadow-md hover:ring-2 hover:ring-white/40 focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-2"
                          style={{
                            left: `calc((${colStart - 1}) / ${displayWindow.days} * 100%)`,
                            width: `calc(${span} / ${displayWindow.days} * 100%)`,
                            backgroundColor: bg,
                          }}
                          onMouseEnter={(e) => openPop(b, e.currentTarget)}
                          onMouseLeave={scheduleHidePop}
                          onClick={(e) => openPop(b, e.currentTarget)}
                          onFocus={(e) => openPop(b, e.currentTarget)}
                          onBlur={scheduleHidePop}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openPop(b, e.currentTarget)
                            }
                          }}
                        >
                          <div className="min-w-0 truncate pointer-events-none">
                            {cleanerCal ? (
                              <p className="truncate text-xs font-semibold text-white">{barLabel}</p>
                            ) : (
                              <>
                                <p className="truncate text-xs font-semibold text-white">{b.guest}</p>
                                <p className="truncate text-[9px] font-medium leading-tight text-white/90 sm:text-[10px]">
                                  <span>{nightsText(t.nightsLabel, b.nights)}</span>
                                  <span className="text-white/55"> · </span>
                                  <span className="font-mono tracking-tight text-white/95">{b.reservationId}</span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isCleanerSession && mode === 'connected' ? null : (
          <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-4 text-[13px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2 sm:px-6 sm:py-5 sm:text-sm">
            <div className="flex flex-col gap-2 text-[#3f3f46] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#71717a]" strokeWidth={2} />
                <span className="font-medium">{t.footerOccupancy}</span>
                <span className="font-semibold" style={{ color: brandBlue }}>
                  {computedStats.occupancyRate}
                </span>
              </span>
              <span>
                <span className="font-medium">{t.footerTotalBookings}</span>
                <span className="text-[#71717a]"> : </span>
                <span className="font-semibold text-[#1a1a1a]">{computedStats.totalBookings}</span>
              </span>
              <span>
                <span className="font-medium">{t.footerBookedNights}</span>
                <span className="text-[#71717a]"> : </span>
                <span className="font-semibold text-[#1a1a1a]">{computedStats.bookedNights}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:justify-end">
              <span className="flex items-center gap-2 text-[#3f3f46]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: airbnbRed }} />
                <span className="font-medium">{t.footerAirbnb}</span>
                <span className="text-[#71717a]"> : </span>
                <span className="font-semibold text-[#1a1a1a]">{computedStats.airbnbCount}</span>
              </span>
              <span className="flex items-center gap-2 text-[#3f3f46]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bookingBlue }} />
                <span className="font-medium">{t.footerBooking}</span>
                <span className="text-[#71717a]"> : </span>
                <span className="font-semibold text-[#1a1a1a]">{computedStats.bookingCount}</span>
              </span>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
