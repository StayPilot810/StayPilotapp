import {
  DEMO_APARTMENT_ROW_COUNT,
  DEMO_MONTH_INDEX,
  DEMO_YEAR,
  MOCK_BOOKINGS,
} from '../data/demoCalendarBookings'

export type SuiviCheckoutEvent = {
  id: string
  aptIndex: number
  checkoutIso: string
  guest: string
  reservationId: string
  channel: 'airbnb' | 'booking'
}

function isoDateUtc(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Check-outs dérivés du même calendrier démo que le dashboard (voir `BookingCalendarOverview`).
 * Quand le calendrier réel sera branché sur l’iCal, cette fonction pourra être remplacée par les vrais départs.
 */
export function getDemoCheckoutEventsForSuivi(apartmentRowCount: number): SuiviCheckoutEvent[] {
  const count = Math.max(apartmentRowCount, DEMO_APARTMENT_ROW_COUNT)
  const out: SuiviCheckoutEvent[] = []
  for (const b of MOCK_BOOKINGS) {
    if (b.apt >= count) continue
    const checkout = new Date(DEMO_YEAR, DEMO_MONTH_INDEX, b.end + 1)
    out.push({
      id: `${b.reservationId}|apt${b.apt}`,
      aptIndex: b.apt,
      checkoutIso: isoDateUtc(checkout),
      guest: b.guest,
      reservationId: b.reservationId,
      channel: b.channel,
    })
  }
  return out.sort((a, b) => (a.checkoutIso < b.checkoutIso ? 1 : a.checkoutIso > b.checkoutIso ? -1 : 0))
}
