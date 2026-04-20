import type { OfficialChannelOtaLinks } from './officialChannelData'
import { readOfficialChannelSyncData } from './officialChannelData'
import { isGuestDemoSession } from './guestDemo'
import { readScopedStoragePreferHostForCleaner } from './cleanerHostScopedStorage'
import { getCurrentPlanTier, getListingLimitForPlan } from './subscriptionAccess'

type ChannelKey = 'airbnb' | 'booking' | 'channelManager'

export type ConnectedApartment = {
  id: string
  platform: ChannelKey
  name: string
  address: string
  channelLinks?: OfficialChannelOtaLinks
}

const CHANNEL_STORAGE_KEY = 'staypilot_connected_channels'
const ACCESS_STORAGE_KEY = 'staypilot_reservation_access'
const APARTMENT_NAME_KEY = 'staypilot_connected_apartment_names'

function fallbackName(platform: ChannelKey) {
  if (platform === 'airbnb') return 'Appartement 1'
  if (platform === 'booking') return 'Logement Booking'
  return 'Logement Channel Manager'
}

function normalizeSegment(segment: string) {
  return segment
    .replace(/\.ics$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeOpaqueId(value: string) {
  const compact = value.replace(/\s+/g, '')
  return /^\d{8,}$/.test(compact)
}

function guessNameFromIcal(ical: string, platform: ChannelKey) {
  if (!ical) return fallbackName(platform)
  try {
    const url = new URL(ical)
    const last = url.pathname
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .pop()
    if (!last) return fallbackName(platform)
    const decoded = decodeURIComponent(last)
    const clean = normalizeSegment(decoded)
    if (clean.length < 4 || looksLikeOpaqueId(clean)) return fallbackName(platform)
    return clean
  } catch {
    const raw = normalizeSegment(ical.split('?')[0] ?? '')
    if (raw.length < 4 || looksLikeOpaqueId(raw)) return fallbackName(platform)
    return raw
  }
}

export function getConnectedApartmentsFromStorage(): ConnectedApartment[] {
  try {
    if (isGuestDemoSession()) return []
    const planTier = getCurrentPlanTier()
    const listingLimit = getListingLimitForPlan(planTier)
    const official = readOfficialChannelSyncData()
    if (official && official.properties.length > 0) {
      const mapped = official.properties.map((prop) => ({
        id: `channelManager:${prop.id}`,
        platform: 'channelManager',
        name: prop.name,
        address: prop.address || '',
        channelLinks: prop.channelLinks,
      }))
      return listingLimit == null ? mapped : mapped.slice(0, listingLimit)
    }

    const channelsRaw = readScopedStoragePreferHostForCleaner(CHANNEL_STORAGE_KEY)
    const accessRaw = readScopedStoragePreferHostForCleaner(ACCESS_STORAGE_KEY)
    const namesRaw = readScopedStoragePreferHostForCleaner(APARTMENT_NAME_KEY)
    const connected = channelsRaw ? (JSON.parse(channelsRaw) as Partial<Record<ChannelKey, boolean>>) : {}
    const access = accessRaw
      ? (JSON.parse(accessRaw) as Partial<Record<ChannelKey, { ical?: string; address?: string }>>)
      : {}
    const detectedNames = namesRaw ? (JSON.parse(namesRaw) as Partial<Record<ChannelKey, string>>) : {}

    const result: ConnectedApartment[] = []
    ;(['airbnb', 'booking', 'channelManager'] as const).forEach((platform) => {
      if (!connected[platform]) return
      const ical = access[platform]?.ical?.trim() ?? ''
      const name = detectedNames[platform]?.trim() || guessNameFromIcal(ical, platform)
      const rawAddr = access[platform]?.address?.trim() ?? ''
      const address = rawAddr === 'Adresse' ? '' : rawAddr
      result.push({
        id: platform,
        platform,
        name,
        address,
      })
    })
    return listingLimit == null ? result : result.slice(0, listingLimit)
  } catch {
    return []
  }
}

/** Nombre de logements connectés sans appliquer la limite du forfait actuel (utile avant un downgrade). */
export function getConnectedListingsCountRaw(): number {
  try {
    const official = readOfficialChannelSyncData()
    if (official && official.properties.length > 0) {
      return official.properties.length
    }

    const channelsRaw = readScopedStoragePreferHostForCleaner(CHANNEL_STORAGE_KEY)
    const connected = channelsRaw ? (JSON.parse(channelsRaw) as Partial<Record<ChannelKey, boolean>>) : {}
    let n = 0
    ;(['airbnb', 'booking', 'channelManager'] as const).forEach((platform) => {
      if (connected[platform]) n += 1
    })
    return n
  } catch {
    return 0
  }
}
