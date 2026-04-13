type ChannelKey = 'airbnb' | 'booking' | 'channelManager'

export type ConnectedApartment = {
  id: string
  platform: ChannelKey
  name: string
  address: string
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
    const channelsRaw = localStorage.getItem(CHANNEL_STORAGE_KEY)
    const accessRaw = localStorage.getItem(ACCESS_STORAGE_KEY)
    const namesRaw = localStorage.getItem(APARTMENT_NAME_KEY)
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
    return result
  } catch {
    return []
  }
}
