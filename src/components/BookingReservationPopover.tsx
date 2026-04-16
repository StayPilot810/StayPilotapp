import { Check, Star } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { BookingCalendarCopy } from '../i18n/bookingCalendar'
import type { Locale } from '../i18n/navbar'

const airbnbRed = '#ef4444'
const bookingBlue = '#006ce4'
const payoutGreen = '#16a34a'

const BCP47: Record<Locale, string> = {
  fr: 'fr-FR',
  es: 'es-ES',
  en: 'en-GB',
  de: 'de-DE',
  it: 'it-IT',
}

export type CalendarReservationDetail = {
  apt: number
  channel: 'airbnb' | 'booking'
  start: number
  end: number
  guest: string
  nights: number
  reservationId: string
  bookingGenius?: boolean
  totalGuestEur: number
  cleaningEur: number
  platformFeePercent: number
  platformFeeEur: number
  netPayoutEur: number
}

type Anchor = { left: number; top: number; width: number; height: number }

function capitalizeFirst(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Props = {
  booking: CalendarReservationDetail
  anchor: Anchor
  t: BookingCalendarCopy
  locale: Locale
  referenceYear: number
  referenceMonthIndex: number
  apartmentLabel: (n: number) => string
  nightsLabel: (n: number) => string
  restrictedView?: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function BookingReservationPopover({
  booking,
  anchor,
  t,
  locale,
  referenceYear,
  referenceMonthIndex,
  apartmentLabel,
  nightsLabel,
  restrictedView = false,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const bcp47 = BCP47[locale]
  const fmtEur = new Intl.NumberFormat(bcp47, { style: 'currency', currency: 'EUR' })
  const fmtDate = (dayOfMonth: number) => {
    const d = new Date(referenceYear, referenceMonthIndex, dayOfMonth)
    return capitalizeFirst(
      new Intl.DateTimeFormat(bcp47, { day: 'numeric', month: 'long', year: 'numeric' }).format(d),
    )
  }

  const checkInDay = booking.start
  const checkOutDay = booking.end + 1

  const popoverWidth = 320
  const centerX = anchor.left + anchor.width / 2
  const left = Math.min(
    Math.max(8, centerX - popoverWidth / 2),
    typeof window !== 'undefined' ? window.innerWidth - popoverWidth - 8 : 8,
  )
  const top = anchor.top - 10

  const node = (
    <div
      className="pointer-events-auto fixed z-[200] w-[min(calc(100vw-1rem),320px)] max-w-[320px] -translate-y-full rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-pm-xl"
      style={{ left, top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
    >
      {restrictedView ? null : <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#a1a1aa]">
            {t.reservationNumberLabel}
          </p>
          <span className="inline-block max-w-full truncate rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-[#3f3f46]">
            {booking.reservationId}
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
          <Check className="h-3 w-3" strokeWidth={2.5} />
          {t.popoverStatusConfirmed}
        </span>
      </div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-bold leading-tight text-[#1a1a1a]">{booking.guest}</h4>
        {booking.channel === 'airbnb' ? (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: '#fee2e2', color: airbnbRed }}
          >
            {t.legendAirbnb}
          </span>
        ) : (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: '#dbeafe', color: bookingBlue }}
          >
            {t.legendBooking}
          </span>
        )}
        {booking.channel === 'booking' && booking.bookingGenius ? (
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
            {t.badgeGenius}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[#71717a]">{apartmentLabel(booking.apt + 1)}</p>

      <hr className="my-3 border-gray-100" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-[#a1a1aa]">{t.popoverCheckIn}</p>
          <p className="mt-0.5 text-sm font-bold text-[#1a1a1a]">{fmtDate(checkInDay)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#a1a1aa]">{t.popoverCheckOut}</p>
          <p className="mt-0.5 text-sm font-bold text-[#1a1a1a]">{fmtDate(checkOutDay)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-[#71717a]">
        {t.popoverDuration}{' '}
        <span className="font-bold text-[#1a1a1a]">{nightsLabel(booking.nights)}</span>
      </p>

      {restrictedView ? null : <hr className="my-3 border-gray-100" />}

      {restrictedView ? null : <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa]">
        {t.popoverFinancialTitle}
      </p>}
      {restrictedView ? null : <ul className="mt-2 space-y-2 text-sm">
        <li className="flex justify-between gap-2">
          <span className="text-[#71717a]">{t.popoverTotalGuestPrice}</span>
          <span className="font-semibold text-[#1a1a1a]">{fmtEur.format(booking.totalGuestEur)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#71717a]">{t.popoverCleaningFee}</span>
          <span className="font-semibold text-[#1a1a1a]">{fmtEur.format(booking.cleaningEur)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#71717a]">
            {t.popoverPlatformFee.replace('{pct}', String(booking.platformFeePercent))}
          </span>
          <span className="font-semibold text-red-600">
            −{fmtEur.format(booking.platformFeeEur)}
          </span>
        </li>
      </ul>}

      {!restrictedView && booking.channel === 'booking' && booking.bookingGenius ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium leading-snug text-amber-950">
          <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
          {t.popoverGeniusBanner}
        </div>
      ) : null}

      {restrictedView ? null : <hr className="my-3 border-gray-100" />}

      {restrictedView ? null : <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#1a1a1a]">{t.popoverNetPayout}</span>
        <span className="text-lg font-bold" style={{ color: payoutGreen }}>
          {fmtEur.format(booking.netPayoutEur)}
        </span>
      </div>}
    </div>
  )

  return createPortal(node, document.body)
}
