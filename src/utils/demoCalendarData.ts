export const DEMO_BASE_YEAR = 2026
export const DEMO_MIN_MONTH_INDEX = 0
export const DEMO_MAX_MONTH_INDEX = 11

export type DemoBookingStatus = 'reserved' | 'cancelled'

export type DemoCalendarBooking = {
  apt: number
  channel: 'airbnb' | 'booking'
  start: number
  end: number
  guest: string
  nights: number
  reservationId: string
  totalGuestEur: number
  cleaningEur: number
  platformFeePercent: number
  platformFeeEur: number
  netPayoutEur: number
  bookingGenius?: boolean
  status: DemoBookingStatus
}

export function buildGuestDemoMonthBookings(daysInMonth: number, monthIndex: number): DemoCalendarBooking[] {
  if (monthIndex < DEMO_MIN_MONTH_INDEX || monthIndex > DEMO_MAX_MONTH_INDEX) return []
  const occupancyBaseByApt = [0.65, 0.69, 0.72, 0.76, 0.8]
  const occupancySeasonalityByMonth = [-0.03, -0.02, -0.01, 0, 0.02, 0.04, 0.05, 0.04, 0.01, 0, -0.02, -0.03]
  const nightlySeasonMultiplier = [0.9, 0.92, 0.97, 1.02, 1.08, 1.2, 1.28, 1.25, 1.12, 1.0, 0.95, 0.9]
  const bookings: DemoCalendarBooking[] = []
  for (let apt = 0; apt < 5; apt += 1) {
    const occupancyTarget = Math.max(
      0.65,
      Math.min(0.8, occupancyBaseByApt[apt] + occupancySeasonalityByMonth[monthIndex]),
    )
    const targetNights = Math.max(1, Math.round(daysInMonth * occupancyTarget))
    let bookedNights = 0
    let bookingIdx = 0
    let cursor = 1 + ((monthIndex + apt) % 2)
    let previousChannel: 'airbnb' | 'booking' | null = null
    const aptBookingIndexes: number[] = []

    while (bookedNights < targetNights && cursor <= daysInMonth) {
      const remaining = targetNights - bookedNights
      const maxLen = Math.min(7, remaining, daysInMonth - cursor + 1)
      if (maxLen <= 0) break
      const minLen = Math.min(3, maxLen)
      const tentativeLen = 3 + ((monthIndex + apt + bookingIdx) % 5)
      const nights = Math.min(maxLen, Math.max(minLen, tentativeLen))
      const start = cursor
      const end = start + nights - 1

      let channel: 'airbnb' | 'booking'
      if (previousChannel && (monthIndex + apt + bookingIdx) % 3 !== 0) {
        channel = previousChannel
      } else {
        channel = (apt + bookingIdx + monthIndex) % 2 === 0 ? 'airbnb' : 'booking'
      }
      const cancellationRate = channel === 'booking' ? 0.18 : 0.09
      const cancellationSeed = (monthIndex * 11 + apt * 7 + bookingIdx * 5) % 100
      const forcedCancellation = bookingIdx === 1 && (monthIndex + apt) % 4 === 0
      const status: DemoBookingStatus =
        forcedCancellation || cancellationSeed < Math.round(cancellationRate * 100) ? 'cancelled' : 'reserved'
      const commissionRate =
        channel === 'booking'
          ? 0.17 + ((monthIndex + bookingIdx) % 4) * 0.005
          : 0.142 + ((monthIndex + apt + bookingIdx) % 3) * 0.004
      const baseNightly = 94 + apt * 9
      const seasonalNightly = Math.round(baseNightly * nightlySeasonMultiplier[monthIndex])
      const totalGuestEur = Math.round(nights * seasonalNightly + 48 + monthIndex * 4)
      const cleaningEur = 44 + (apt % 3) * 6 + (nights >= 6 ? 8 : 0)
      const platformFeeEur = Math.round((totalGuestEur + cleaningEur) * commissionRate)
      const netPayoutEur = totalGuestEur + cleaningEur - platformFeeEur

      bookings.push({
        apt,
        channel,
        start,
        end,
        guest: `Guest ${apt + 1}${String.fromCharCode(65 + (bookingIdx % 26))}`,
        nights,
        reservationId: `D26-${monthIndex + 1}-${apt + 1}-${bookingIdx + 1}`,
        totalGuestEur,
        cleaningEur,
        platformFeePercent: commissionRate * 100,
        platformFeeEur,
        netPayoutEur,
        bookingGenius: channel === 'booking' && (monthIndex + bookingIdx) % 2 === 0,
        status,
      })
      aptBookingIndexes.push(bookings.length - 1)

      bookedNights += nights
      previousChannel = channel
      const gap = (monthIndex + apt + bookingIdx) % 5 === 0 ? 0 : 1 + ((monthIndex + apt + bookingIdx) % 2)
      cursor = end + gap + 1
      bookingIdx += 1
    }

    // Garde-fou: éviter un mois totalement annulé pour un logement.
    const hasReserved = aptBookingIndexes.some((idx) => bookings[idx]?.status === 'reserved')
    if (!hasReserved) {
      const firstCancelledIdx = aptBookingIndexes.find((idx) => bookings[idx]?.status === 'cancelled')
      if (firstCancelledIdx != null) {
        bookings[firstCancelledIdx] = {
          ...bookings[firstCancelledIdx],
          status: 'reserved',
        }
      }
    }
  }
  return bookings
}
