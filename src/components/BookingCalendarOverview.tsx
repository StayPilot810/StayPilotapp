import { CalendarDays, Filter } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Locale } from '../i18n/navbar'
import { useLanguage } from '../hooks/useLanguage'
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

const APARTMENT_COUNT = 4

const DEMO_STATS = {
  occupancyRate: '69%',
  totalBookings: 16,
  bookedNights: '83 / 120',
  airbnbCount: 8,
  bookingCount: 8,
} as const

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

export function BookingCalendarOverview() {
  const { t, locale } = useLanguage()
  const modalTitleId = useId()
  const calendarWrapRef = useRef<HTMLDivElement>(null)

  const [periodTab, setPeriodTab] = useState<PeriodTab>('this')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [apartmentFilter, setApartmentFilter] = useState<'all' | string>('all')
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [hoverPop, setHoverPop] = useState<null | {
    booking: CalendarReservationDetail
    anchor: DOMRect
  }>(null)
  const hidePopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bcp47 = BCP47[locale]

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
    if (value === 'all') {
      setApartmentFilter('all')
      return
    }
    setModal('option')
    setApartmentFilter('all')
  }

  const onPeriodTabClick = (id: PeriodTab) => {
    if (id === 'this') {
      setPeriodTab('this')
      return
    }
    showDemoAction()
  }

  const onMiniCalendarDayClick = () => {
    setCalendarOpen(false)
    showDemoAction()
  }

  const modalMessage = modal === 'option' ? t.demoUnavailableOption : t.demoUnavailableAction

  return (
    <div className="mt-8 w-full sm:mt-10 lg:mt-11">
      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#64748b]/25 px-4 py-8 backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="max-w-md rounded-2xl border border-gray-100 bg-white px-6 py-8 text-center shadow-xl sm:px-10"
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
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white sm:mt-8 sm:w-auto sm:min-w-[8rem]"
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

      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#1a1a1a] sm:text-xl">
              {t.calendarTitle}
            </h3>
            <p className="mt-1 text-sm font-medium text-[#71717a]">{monthYearLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:justify-end">
            <div className="flex items-center gap-3 text-sm">
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

        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {periodTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onPeriodTabClick(id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  calendarOpen
                    ? 'border-[#4f86f7] bg-[#f5f8ff] text-[#1a1a1a] ring-2 ring-[#4f86f7]/25'
                    : 'border-transparent text-[#71717a] hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={2} />
                {t.customDates}
              </button>
              {calendarOpen ? (
                <div
                  className="absolute left-0 top-full z-30 mt-2 w-[min(100vw-2.5rem,17.5rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:left-auto sm:right-0"
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
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={onMiniCalendarDayClick}
                          className="flex aspect-square items-center justify-center rounded-lg text-xs font-semibold text-[#3f3f46] transition-colors hover:bg-[#e8f0fe] hover:text-[#1a1a1a]"
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 min-w-[11rem] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-[#1a1a1a] outline-none focus:border-[#4f86f7] focus:ring-2 focus:ring-[#4f86f7]/20"
              aria-label={t.allApartments}
              value={apartmentFilter}
              onChange={(e) => onApartmentChange(e.target.value)}
            >
              <option value="all">{t.allApartments}</option>
              {Array.from({ length: APARTMENT_COUNT }, (_, i) => (
                <option key={i} value={String(i + 1)}>
                  {apartmentName(t.apartmentLabel, i + 1)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#52525b] transition-colors hover:bg-gray-50"
              aria-label={t.filterPropertiesAria}
            >
              <Filter className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[720px] px-5 pb-2 pt-4 sm:px-6">
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

              {Array.from({ length: APARTMENT_COUNT }, (_, apt) => (
                <div key={apt} className="contents">
                  <div className="flex items-center py-3 pr-2 text-sm font-medium text-[#3f3f46]">
                    {apartmentName(t.apartmentLabel, apt + 1)}
                  </div>
                  <div
                    className="relative grid min-h-[3.5rem] items-center border-t border-gray-100 py-0.5"
                    style={{
                      gridColumn: '2 / -1',
                      gridTemplateColumns: `repeat(${DAYS_IN_MONTH}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: DAYS_IN_MONTH }, (_, i) => (
                      <div
                        key={i}
                        className="h-full border-l border-gray-100 first:border-l-0"
                        aria-hidden
                      />
                    ))}
                    {MOCK_BOOKINGS.filter((b) => b.apt === apt).map((b) => {
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

        <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#3f3f46]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#71717a]" strokeWidth={2} />
              <span className="font-medium">{t.footerOccupancy}</span>
              <span className="font-semibold" style={{ color: brandBlue }}>
                {DEMO_STATS.occupancyRate}
              </span>
            </span>
            <span>
              <span className="font-medium">{t.footerTotalBookings}</span>
              <span className="text-[#71717a]"> : </span>
              <span className="font-semibold text-[#1a1a1a]">{DEMO_STATS.totalBookings}</span>
            </span>
            <span>
              <span className="font-medium">{t.footerBookedNights}</span>
              <span className="text-[#71717a]"> : </span>
              <span className="font-semibold text-[#1a1a1a]">{DEMO_STATS.bookedNights}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:justify-end">
            <span className="flex items-center gap-2 text-[#3f3f46]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: airbnbRed }} />
              <span className="font-medium">{t.footerAirbnb}</span>
              <span className="text-[#71717a]"> : </span>
              <span className="font-semibold text-[#1a1a1a]">{DEMO_STATS.airbnbCount}</span>
            </span>
            <span className="flex items-center gap-2 text-[#3f3f46]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bookingBlue }} />
              <span className="font-medium">{t.footerBooking}</span>
              <span className="text-[#71717a]"> : </span>
              <span className="font-semibold text-[#1a1a1a]">{DEMO_STATS.bookingCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
