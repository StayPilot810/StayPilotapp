import { CalendarDays, Filter } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Locale } from '../i18n/navbar'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { isTestModeEnabled } from '../utils/testMode'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'
import {
  BookingReservationPopover,
  type CalendarReservationDetail,
} from './BookingReservationPopover'

const brandBlue = '#4f86f7'
const airbnbRed = '#ef4444'
const bookingBlue = '#006ce4'

const BCP47: Record<Locale, string> = {
  fr: 'fr-FR',
  es: 'es-ES',
  en: 'en-GB',
  de: 'de-DE',
  it: 'it-IT',
}

/** Avril 2026 — données de démo (sans logique métier). */
const DEMO_YEAR = 2026
const DEMO_MONTH_INDEX = 3
const DAYS_IN_MONTH = 30

/**
 * Ordres de grandeur pour la démo (les contrats réels varient fortement) :
 * - Airbnb : ici ~14–15 % sur (prix voyageur + ménage), proche de ce que beaucoup d’hôtes voient
 *   comme « frais plateforme » sur l’ensemble du séjour ; en réalité Airbnb mélange souvent un petit
 *   % côté hôte et un plus gros % côté voyageur selon le pays et le type de tarif.
 * - Booking.com : commission hébergement courante ~15–16 %.
 * - Genius : surcoût typique ~+3 points vs le taux de base.
 */
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

type BookingCalendarOverviewProps = {
  /**
   * "connected": use real connected apartment names.
   * "generic": always display "Appartement 1/2/..." regardless of connected names.
   */
  mode?: 'connected' | 'generic'
}

export function BookingCalendarOverview({ mode = 'connected' }: BookingCalendarOverviewProps) {
  const { t, locale } = useLanguage()
  const modalTitleId = useId()
  const calendarWrapRef = useRef<HTMLDivElement>(null)

  const [periodTab, setPeriodTab] = useState<PeriodTab>('this')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [apartmentFilter, setApartmentFilter] = useState<'all' | string>('all')
  const [rangeStartDay, setRangeStartDay] = useState<number | null>(null)
  const [rangeEndDay, setRangeEndDay] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [hoverPop, setHoverPop] = useState<null | {
    booking: CalendarReservationDetail
    anchor: DOMRect
  }>(null)
  const hidePopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bcp47 = BCP47[locale]

  const connectedApartments = useMemo(() => {
    if (mode === 'generic') {
      // Lock the home-page simulation so it never changes after a connection.
      return Array.from({ length: DEMO_APARTMENT_ROW_COUNT }, (_, idx) => ({
        id: `demo-${idx + 1}`,
        name: apartmentName(t.apartmentLabel, idx + 1),
      }))
    }

    const fromConnected = getConnectedApartmentsFromStorage().map((apt) => ({
      id: apt.id,
      name: apt.name,
    }))
    if (fromConnected.length > 0) return fromConnected
    if (isTestModeEnabled()) {
      return [
        { id: 'test-1', name: 'Logement test 1' },
        { id: 'test-2', name: 'Logement test 2' },
      ]
    }
    return []
  }, [mode, t.apartmentLabel])

  const officialSync = useMemo(() => {
    if (mode !== 'connected') return null
    if (isTestModeEnabled()) return null
    return readOfficialChannelSyncData()
  }, [mode])

  const realBookings = useMemo(() => {
    if (mode !== 'connected') return []
    if (!officialSync?.bookings?.length) return []

    const propertyIdToAptIndex = new Map<string, number>()
    connectedApartments.forEach((apt, idx) => {
      const prefix = 'channelManager:'
      const propertyId = apt.id.startsWith(prefix) ? apt.id.slice(prefix.length) : apt.id
      propertyIdToAptIndex.set(propertyId, idx)
    })

    const propertyIdToChannelLinks = new Map<string, any>()
    if (Array.isArray(officialSync.properties)) {
      officialSync.properties.forEach((p: any) => propertyIdToChannelLinks.set(String(p.id), p.channelLinks))
    }

    const msPerDay = 24 * 60 * 60 * 1000
    const toDayIndex = (iso: string) => {
      const d = new Date(iso)
      if (!Number.isFinite(d.getTime())) return null
      return d
    }

    return officialSync.bookings
      .map((b: any) => {
        const propertyId = String(b.propertyId ?? '')
        const aptIndex = propertyIdToAptIndex.get(propertyId)
        if (aptIndex == null) return null

        const checkInDate = toDayIndex(String(b.checkIn ?? ''))
        const checkOutDate = toDayIndex(String(b.checkOut ?? ''))
        if (!checkInDate || !checkOutDate) return null
        if (checkInDate.getFullYear() !== DEMO_YEAR || checkInDate.getMonth() !== DEMO_MONTH_INDEX) return null
        if (checkOutDate.getFullYear() !== DEMO_YEAR) return null

        const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay))
        const start = checkInDate.getDate()
        const end = start + nights - 1
        if (start < 1 || end < 1 || start > DAYS_IN_MONTH) return null

        const links = propertyIdToChannelLinks.get(propertyId) as any
        const channel: 'airbnb' | 'booking' =
          links?.airbnb ? 'airbnb' : links?.booking ? 'booking' : 'airbnb'

        const platformFeeEur = b?.fraisPlateforme?.amount ?? 0
        const netPayoutEur = b?.revenuNetDetaille?.amount ?? 0
        const totalGuestEur = netPayoutEur + platformFeeEur
        const cleaningEur = 0
        const platformFeePercent = totalGuestEur > 0 ? (platformFeeEur / totalGuestEur) * 100 : 0

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
  }, [mode, officialSync, connectedApartments])

  /** Assez de lignes pour afficher toute la grille demo (meme avec un seul canal connecte). */
  const calendarRowEntries = useMemo(() => {
    const count = Math.max(connectedApartments.length, DEMO_APARTMENT_ROW_COUNT)
    return Array.from({ length: count }, (_, index) => {
      const conn = connectedApartments[index]
      if (conn) return { id: conn.id, name: conn.name, index }
      return {
        id: `demo-row-${index}`,
        name: apartmentName(t.apartmentLabel, index + 1),
        index,
      }
    })
  }, [connectedApartments, t.apartmentLabel])

  const visibleApartmentEntries = useMemo(() => {
    if (apartmentFilter === 'all') return calendarRowEntries
    return calendarRowEntries.filter((apt) => String(apt.index + 1) === apartmentFilter)
  }, [calendarRowEntries, apartmentFilter])
  const hasConnectedListings = connectedApartments.length > 0
  const apartmentCount = calendarRowEntries.length
  const availableBookings = useMemo(() => {
    const sourceBookings =
      mode === 'connected' && !isTestModeEnabled() ? realBookings : MOCK_BOOKINGS
    return sourceBookings.filter((b) => b.apt < apartmentCount)
  }, [apartmentCount, mode, realBookings])
  const visibleBookings = useMemo(() => {
    const byApartment =
      apartmentFilter === 'all' ? availableBookings : availableBookings.filter((b) => b.apt === Number(apartmentFilter) - 1)
    if (rangeStartDay == null || rangeEndDay == null) return byApartment
    return byApartment.filter((b) => b.end >= rangeStartDay && b.start <= rangeEndDay)
  }, [apartmentFilter, availableBookings, rangeStartDay, rangeEndDay])
  const computedStats = useMemo(() => {
    const totalSlots = visibleApartmentEntries.length * DAYS_IN_MONTH
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
  }, [visibleApartmentEntries.length, visibleBookings])

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
    }).format(new Date(DEMO_YEAR, DEMO_MONTH_INDEX, 1))
    return capitalizeFirst(raw)
  }, [bcp47])

  const dayHeaders = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(bcp47, { weekday: 'short' })
    return Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
      const d = new Date(DEMO_YEAR, DEMO_MONTH_INDEX, i + 1)
      const abbr = fmt.format(d).replace(/\.$/, '')
      return { day: i + 1, weekday: capitalizeFirst(abbr) }
    })
  }, [bcp47])

  const miniCalendarWeekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(bcp47, { weekday: 'short' })
    const monday = new Date(DEMO_YEAR, DEMO_MONTH_INDEX, 7)
    while (monday.getDay() !== 1) {
      monday.setDate(monday.getDate() - 1)
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return capitalizeFirst(fmt.format(d).replace(/\.$/, ''))
    })
  }, [bcp47])

  const leadingBlanks = useMemo(() => {
    const first = new Date(DEMO_YEAR, DEMO_MONTH_INDEX, 1)
    return mondayOffsetFromSundayBasedJsDay(first.getDay())
  }, [])

  const periodTabs: { id: PeriodTab; label: string }[] = [
    { id: 'this', label: t.tabThisMonth },
    { id: 'last', label: t.tabLastMonth },
    { id: 'next', label: t.tabNextMonth },
  ]

  const onApartmentChange = (value: string) => {
    setApartmentFilter(value === 'all' ? 'all' : value)
  }

  const onPeriodTabClick = (id: PeriodTab) => {
    if (id === 'this') {
      setPeriodTab('this')
      return
    }
    showDemoAction()
  }

  const onMiniCalendarDayClick = (day: number) => {
    if (rangeStartDay == null || (rangeStartDay != null && rangeEndDay != null)) {
      setRangeStartDay(day)
      setRangeEndDay(null)
      return
    }
    const start = Math.min(rangeStartDay, day)
    const end = Math.max(rangeStartDay, day)
    setRangeStartDay(start)
    setRangeEndDay(end)
    setCalendarOpen(false)
  }

  const clearDateRange = () => {
    setRangeStartDay(null)
    setRangeEndDay(null)
    setCalendarOpen(false)
  }

  const dateRangeLabel = rangeStartDay != null && rangeEndDay != null ? `${t.customDates}: ${rangeStartDay} - ${rangeEndDay}` : t.customDates

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
          apartmentLabel={(n) => apartmentName(t.apartmentLabel, n)}
          nightsLabel={(n) => nightsText(t.nightsLabel, n)}
          onMouseEnter={clearHidePop}
          onMouseLeave={scheduleHidePop}
        />
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-pm-md sm:shadow-pm-lg">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-6">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 sm:text-xl">
              {t.calendarTitle}
            </h3>
            <p className="mt-1 text-[13px] font-medium text-[#71717a] sm:text-sm">{monthYearLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-4">
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
                  <p className="mb-2 text-center text-xs font-semibold text-[#1a1a1a]">{monthYearLabel}</p>
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
                    {Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
                      const day = i + 1
                      const isSelectedRange = rangeStartDay != null && rangeEndDay != null && day >= rangeStartDay && day <= rangeEndDay
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => onMiniCalendarDayClick(day)}
                          className={`flex min-h-[44px] w-full items-center justify-center rounded-lg text-xs font-semibold transition-colors sm:aspect-square sm:min-h-0 ${
                            isSelectedRange
                              ? 'bg-[#4f86f7] text-white hover:bg-[#3f78eb]'
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
                      Reinitialiser
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-11 min-h-[44px] min-w-0 max-w-full flex-1 cursor-pointer rounded-xl border border-zinc-200/80 bg-white px-3 text-[13px] font-medium text-zinc-900 shadow-pm-xs outline-none focus:border-[#4f86f7] focus:ring-2 focus:ring-[#4f86f7]/20 sm:h-10 sm:min-h-0 sm:min-w-[11rem] sm:max-w-none sm:flex-none sm:text-sm"
              aria-label={t.allApartments}
              value={apartmentFilter}
              onChange={(e) => onApartmentChange(e.target.value)}
            >
              <option value="all">{t.allApartments}</option>
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
                Veuillez connecter vos logements pour afficher le calendrier des reservations et l'analyse detaillee.
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Une fois connectes, vous retrouverez ici la meme vue interactive que sur la page d accueil.
              </p>
            </div>
          </div>
        ) : mode === 'connected' && !isTestModeEnabled() && officialSync && realBookings.length === 0 ? (
          <div className="px-4 py-10 sm:px-6">
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-5 text-center sm:px-6 sm:py-6">
              <p className="text-sm font-semibold text-zinc-900">Aucune reservation trouvée pour ce mois.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Si vous venez de connecter votre channel manager, réessayez après une synchronisation complète.
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
                gridTemplateColumns: `7.5rem repeat(${DAYS_IN_MONTH}, minmax(0, 1fr))`,
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
                      gridTemplateColumns: `repeat(${DAYS_IN_MONTH}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: DAYS_IN_MONTH }, (_, i) => (
                      <div
                        key={i}
                        className="h-full border-l border-zinc-100 first:border-l-0"
                        aria-hidden
                      />
                    ))}
                    {visibleBookings.filter((b) => b.apt === aptEntry.index).map((b) => {
                      const start = Math.max(1, b.start)
                      const end = Math.min(DAYS_IN_MONTH, b.end)
                      const colStart = start
                      const span = end - start + 1
                      const bg = b.channel === 'airbnb' ? airbnbRed : bookingBlue
                      return (
                        <div
                          key={b.reservationId}
                          role="note"
                          aria-label={`${b.guest}, ${nightsText(t.nightsLabel, b.nights)}, ${t.reservationNumberLabel} ${b.reservationId}`}
                          className="absolute inset-y-0.5 z-10 flex min-w-0 cursor-default items-center rounded-md px-1.5 py-0.5 shadow-sm transition-shadow hover:z-30 hover:shadow-md hover:ring-2 hover:ring-white/40 sm:px-2"
                          style={{
                            left: `calc((${colStart - 1}) / ${DAYS_IN_MONTH} * 100%)`,
                            width: `calc(${span} / ${DAYS_IN_MONTH} * 100%)`,
                            backgroundColor: bg,
                          }}
                          onMouseEnter={(e) => openPop(b, e.currentTarget)}
                          onMouseLeave={scheduleHidePop}
                        >
                          <div className="min-w-0 truncate pointer-events-none">
                            <p className="truncate text-xs font-semibold text-white">{b.guest}</p>
                            <p className="truncate text-[9px] font-medium leading-tight text-white/90 sm:text-[10px]">
                              <span>{nightsText(t.nightsLabel, b.nights)}</span>
                              <span className="text-white/55"> · </span>
                              <span className="font-mono tracking-tight text-white/95">{b.reservationId}</span>
                            </p>
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
          </>
        )}
      </div>
    </div>
  )
}
