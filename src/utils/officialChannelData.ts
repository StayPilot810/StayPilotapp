export const OFFICIAL_CHANNEL_SYNC_KEY = 'staypilot_official_channel_sync'

export type OfficialChannelOtaLinks = {
  airbnb: boolean
  booking: boolean
}

export type OfficialSyncedProperty = {
  id: string
  name: string
  address?: string
  /** Présence de liens OTA détectée dans la réponse du channel (ex. champs Beds24). */
  channelLinks?: OfficialChannelOtaLinks
}

export type OfficialSyncedBooking = {
  id: string
  propertyId: string
  checkIn: string
  checkOut: string
  guestName: string
  status: string
  revenuNetDetaille?: { amount: number; currency: string; formula?: string }
  fraisPlateforme?: { amount: number; currency: string; detail?: string }
  taxesTva?: { totalTaxes: number; vatAmount: number; vatRate: number; currency: string }
  paiements?: Array<{ id: string; amount: number; currency: string; status: string; paidAt?: string; method?: string }>
  messagesVoyageurs?: Array<{ id: string; sender?: string; body?: string; sentAt?: string }>
  notesInternes?: Array<{ id: string; body?: string; createdAt?: string }>
  financeAvancee?: {
    scopeStatus?: { status: string; hasFinance: boolean; hasComms: boolean }
    providerRawFields?: Record<string, boolean>
  }
}

export type OfficialChannelSyncData = {
  provider: string
  syncedAt: string
  properties: OfficialSyncedProperty[]
  bookings: OfficialSyncedBooking[]
}

export function readOfficialChannelSyncData(): OfficialChannelSyncData | null {
  try {
    const raw = localStorage.getItem(OFFICIAL_CHANNEL_SYNC_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OfficialChannelSyncData
    if (!Array.isArray(parsed?.properties) || !Array.isArray(parsed?.bookings)) return null
    return parsed
  } catch {
    return null
  }
}
