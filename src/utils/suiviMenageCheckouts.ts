import type { ConnectedApartment } from './connectedApartments'
import { readOfficialChannelSyncData } from './officialChannelData'

export type SuiviCheckoutEvent = {
  id: string
  aptIndex: number
  checkoutIso: string
  guest: string
  reservationId: string
  channel: 'airbnb' | 'booking' | 'other'
}

function normalizeChannel(raw?: string): SuiviCheckoutEvent['channel'] {
  const value = (raw || '').trim().toLowerCase()
  if (value === 'airbnb') return 'airbnb'
  if (value === 'booking') return 'booking'
  return 'other'
}

function normalizeIsoDate(raw: string): string {
  const text = raw.trim()
  if (!text) return ''
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch?.[1]) return isoMatch[1]
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ''
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getOfficialCheckoutEventsForSuivi(apartments: ConnectedApartment[]): SuiviCheckoutEvent[] {
  if (!apartments.length) return []
  const official = readOfficialChannelSyncData()
  if (!official?.bookings?.length) return []

  const apartmentIndexByPropertyId = new Map<string, number>()
  apartments.forEach((apartment, index) => {
    if (!apartment.id.startsWith('channelManager:')) return
    const propertyId = apartment.id.slice('channelManager:'.length).trim()
    if (propertyId) apartmentIndexByPropertyId.set(propertyId, index)
  })

  if (!apartmentIndexByPropertyId.size) return []

  const out: SuiviCheckoutEvent[] = []
  for (const booking of official.bookings) {
    const aptIndex = apartmentIndexByPropertyId.get((booking.propertyId || '').trim())
    if (typeof aptIndex !== 'number') continue
    const checkoutIso = normalizeIsoDate(booking.checkOut || '')
    if (!checkoutIso) continue
    const reservationId = (booking.id || '').trim()
    const guest = (booking.guestName || '').trim()
    out.push({
      id: reservationId ? `${reservationId}|apt${aptIndex}` : `${booking.propertyId}|${checkoutIso}|apt${aptIndex}`,
      aptIndex,
      checkoutIso,
      guest: guest || 'Voyageur',
      reservationId: reservationId || '-',
      channel: normalizeChannel(booking.channel),
    })
  }
  return out.sort((a, b) => (a.checkoutIso < b.checkoutIso ? 1 : a.checkoutIso > b.checkoutIso ? -1 : 0))
}
