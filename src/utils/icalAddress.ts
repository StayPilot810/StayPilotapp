import { readScopedStoragePreferHostForCleaner } from './cleanerHostScopedStorage'
import { readScopedStorage, writeScopedStorage } from './sessionStorageScope'
type ChannelKey = 'airbnb' | 'booking' | 'channelManager'

const CHANNEL_STORAGE_KEY = 'staypilot_connected_channels'
const ACCESS_STORAGE_KEY = 'staypilot_reservation_access'

type AccessRecord = {
  ical?: string
  address?: string
  apiToken?: string
  accountId?: string
  nightlyRate?: string
  commissionRate?: string
}

function unfoldIcal(text: string) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
}

function decodeIcsValue(value: string) {
  return value.replace(/\\n/g, ', ').replace(/\\,/g, ',').replace(/\\\\/g, '\\').trim()
}

function looksLikeUsefulLocation(value: string) {
  if (!value || value.length < 4) return false
  if (/^https?:\/\//i.test(value)) return false
  if (/^(geo|mailto):/i.test(value)) return false
  return true
}

export async function fetchIcalBody(icalUrl: string): Promise<string | null> {
  const url = icalUrl.trim()
  if (!url) return null

  try {
    const res = await fetch(url)
    if (res.ok) return await res.text()
  } catch {
    /* CORS or network */
  }

  try {
    const proxyUrl = `/api/ical?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl)
    if (res.ok) return await res.text()
  } catch {
    /* proxy unavailable */
  }

  return null
}

export function extractCalendarNameFromIcalText(text: string): string {
  const unfolded = unfoldIcal(text)
  const m = unfolded.match(/X-WR-CALNAME:(.+)/i) || unfolded.match(/^NAME:(.+)/im)
  return m?.[1] ? decodeIcsValue(m[1].split(/\r?\n/)[0] ?? '') : ''
}

export function extractAddressFromIcalText(text: string): string {
  const unfolded = unfoldIcal(text)
  const lines = unfolded.split(/\r?\n/)
  const candidates: string[] = []

  for (const line of lines) {
    const loc = line.match(/^LOCATION(?:;[^:]*)*:(.+)$/i)
    if (loc?.[1]) {
      const v = decodeIcsValue(loc[1])
      if (looksLikeUsefulLocation(v)) candidates.push(v)
    }
    const appleAddr = line.match(/X-ADDRESS=([^;]+)/i)
    if (appleAddr?.[1]) {
      const v = decodeIcsValue(appleAddr[1])
      if (looksLikeUsefulLocation(v)) candidates.push(v)
    }
    const desc = line.match(/^DESCRIPTION(?:;[^:]*)*:(.+)$/i)
    if (desc?.[1]) {
      const firstLine = decodeIcsValue(desc[1].split(/\r?\n/)[0] ?? '')
      if (
        firstLine.length >= 12 &&
        firstLine.length <= 220 &&
        /\d/.test(firstLine) &&
        /(rue|avenue|av\.|bd|boulevard|street|st\.|road|rd\.|,)/i.test(firstLine)
      ) {
        candidates.push(firstLine)
      }
    }
  }

  if (candidates.length === 0) return ''
  return candidates.reduce((best, cur) => (cur.length > best.length ? cur : best))
}

function shouldAutoFillAddress(stored: string | undefined) {
  const t = stored?.trim() ?? ''
  return t.length === 0 || t === 'Adresse'
}

export async function enrichReservationAccessAddressesFromIcal(): Promise<boolean> {
  const rawChannels = readScopedStoragePreferHostForCleaner(CHANNEL_STORAGE_KEY)
  const rawAccess = readScopedStoragePreferHostForCleaner(ACCESS_STORAGE_KEY)
  if (!rawAccess) return false

  let connected: Partial<Record<ChannelKey, boolean>> = {}
  try {
    connected = rawChannels ? (JSON.parse(rawChannels) as Partial<Record<ChannelKey, boolean>>) : {}
  } catch {
    return false
  }

  let access: Record<ChannelKey, AccessRecord>
  try {
    access = JSON.parse(rawAccess) as Record<ChannelKey, AccessRecord>
  } catch {
    return false
  }

  const platforms: ChannelKey[] = ['airbnb', 'booking', 'channelManager']
  let changed = false

  for (const platform of platforms) {
    if (!connected[platform]) continue
    const ical = access[platform]?.ical?.trim()
    if (!ical) continue
    if (!shouldAutoFillAddress(access[platform]?.address)) continue

    const body = await fetchIcalBody(ical)
    if (!body) continue
    const addr = extractAddressFromIcalText(body)
    if (!addr) continue

    access = {
      ...access,
      [platform]: {
        ...access[platform],
        address: addr,
      },
    }
    changed = true
  }

  if (changed) {
    writeScopedStorage(ACCESS_STORAGE_KEY, JSON.stringify(access))
  }
  return changed
}
