import { Check } from 'lucide-react'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { BookingCalendarCopy } from '../i18n/bookingCalendar'
import type { Locale } from '../i18n/navbar'

const airbnbRed = '#ef4444'
const bookingBlue = '#006ce4'
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
  referenceStartDate?: Date
  apartmentLabel: (n: number) => string
  nightsLabel: (n: number) => string
  restrictedView?: boolean
  /** Masque identifiants, voyageur, plateforme et finances (vue prestataire ménage). */
  cleanerPrivacy?: boolean
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
  referenceStartDate,
  apartmentLabel,
  nightsLabel,
  restrictedView = false,
  cleanerPrivacy = false,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const bcp47 = BCP47[locale]
  const fmtMoney = useMemo(
    () =>
      new Intl.NumberFormat(bcp47, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    [bcp47],
  )
  const fmtDate = (dayIndex: number) => {
    const d = referenceStartDate
      ? new Date(referenceStartDate.getFullYear(), referenceStartDate.getMonth(), referenceStartDate.getDate() + (dayIndex - 1))
      : new Date(referenceYear, referenceMonthIndex, dayIndex)
    return capitalizeFirst(
      new Intl.DateTimeFormat(bcp47, { day: 'numeric', month: 'long', year: 'numeric' }).format(d),
    )
  }

  const checkInDay = booking.start
  const checkOutDay = booking.end + 1
  const platformFeeLabel = t.popoverPlatformFee.replace('{pct}', booking.platformFeePercent.toFixed(1))

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
      {cleanerPrivacy ? (
        <>
          <h4 className="text-lg font-bold leading-tight text-[#1a1a1a]">{apartmentLabel(booking.apt + 1)}</h4>
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
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className="inline-block max-w-full truncate rounded-xl border border-zinc-200 bg-gray-100 px-3 py-1.5 font-mono text-[12px] font-semibold tracking-wide text-[#3f3f46]">
              {booking.reservationId}
            </span>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" strokeWidth={2.5} />
                {t.popoverStatusConfirmed}
              </span>
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
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-bold leading-tight text-[#1a1a1a]">{booking.guest}</h4>
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

          <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-2.5 py-2">
            <p className="text-xs font-medium text-[#71717a]">{t.popoverDuration}</p>
            <p className="text-xs font-semibold text-[#1a1a1a]">{nightsLabel(booking.nights)}</p>
          </div>

          {!restrictedView ? (
            <>
              <hr className="my-3 border-gray-100" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#a1a1aa]">{t.popoverFinancialTitle}</p>

              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[#71717a]">{t.popoverTotalGuestPrice}</p>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{fmtMoney.format(booking.totalGuestEur)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[#71717a]">{t.popoverCleaningFee}</p>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{fmtMoney.format(booking.cleaningEur)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[#71717a]">{platformFeeLabel}</p>
                  <p className="text-sm font-semibold text-[#dc2626]">-{fmtMoney.format(booking.platformFeeEur)}</p>
                </div>
                <div className="mt-1 h-px bg-zinc-100" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-[#3f3f46]">{t.popoverNetPayout}</p>
                  <p className="text-sm font-bold text-emerald-600">{fmtMoney.format(booking.netPayoutEur)}</p>
                </div>
              </div>

              {booking.channel === 'booking' && booking.bookingGenius ? (
                <p className="mt-3 rounded-md bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-900">
                  {t.popoverGeniusBanner}
                </p>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  )

  return createPortal(node, document.body)
}
