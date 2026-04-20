import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, MessageCircle, Send, X } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { useAppPathname } from '../hooks/useAppPathname'
import { useStaypilotSessionLoggedIn } from '../hooks/useStaypilotSessionLoggedIn'
import { CONTACT_EMAIL } from '../i18n/contactPage'
import { getStoredAccounts, safeAccountText, storedAccountMatchesNormalizedId } from '../lib/accounts'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'
import { isGuestDemoSession } from '../utils/guestDemo'
import { buildGuestDemoMonthBookings } from '../utils/demoCalendarData'

type ChatTurn =
  | { role: 'assistant'; content: string }
  | { role: 'user'; content: string; imageDataUrl?: string }

const CHAT_PATH = '/api/chat'
const CHAT_HISTORY_PATH = '/api/chat-history'
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_LOGIN_IDENTIFIER = 'staypilot_login_identifier'

type LiveChatContext = {
  mode: 'demo' | 'connected'
  listingsCount: number
  listingNames: string[]
  provider?: string
  syncedAt?: string
  upcomingCheckIns14d: number
  upcomingCheckOuts14d: number
  reservationsNext30d: number
  cancellationsLast30d: number
  netRevenueLast30d: number
  averageStayNights: number
  occupancyProjection30dPct: number
  topChannelNext30d: 'airbnb' | 'booking' | 'mixed' | 'unknown'
  anomalies: string[]
  actionPlanToday: string[]
  actionPlan7d: string[]
  listingLocations: Array<{ name: string; address: string; city: string }>
  topCity: string
  multiCityPortfolio: boolean
  ownerProfile?: {
    listingsCount?: number
    primaryGoal?: string
    notes?: string
  }
}

type OwnerProfile = {
  listingsCount?: number
  primaryGoal?: string
  notes?: string
}

async function compressImageToJpegDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image'))
      el.src = url
    })
    const maxW = 1280
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxW) {
      h = Math.round((h * maxW) / w)
      w = maxW
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function mapTurnsToApiPayload(messages: ChatTurn[]) {
  return messages.map((m) => {
    if (m.role === 'assistant') {
      return { role: 'assistant' as const, content: m.content }
    }
    if (m.imageDataUrl) {
      return {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: m.content },
          { type: 'image_url' as const, image_url: { url: m.imageDataUrl } },
        ],
      }
    }
    return { role: 'user' as const, content: m.content }
  })
}

function ymdToLocalDate(iso: string) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(y, mo, d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function inferOwnerProfilePatchFromText(text: string): Partial<OwnerProfile> {
  const t = text.toLowerCase()
  const patch: Partial<OwnerProfile> = {}
  const listingMatch = t.match(/(\d{1,3})\s*(logements?|appartements?|listings?)/)
  if (listingMatch?.[1]) {
    const n = Number(listingMatch[1])
    if (Number.isFinite(n) && n > 0) patch.listingsCount = n
  }
  if (/(occupation|taux d'occupation|occupancy|jours vides|remplissage|pricing|prix)/.test(t)) {
    patch.primaryGoal = 'optimize_occupancy_and_pricing'
  } else if (/(menage|m[eé]nage|turnover|check-?in|check-?out|operations|ops)/.test(t)) {
    patch.primaryGoal = 'optimize_operations'
  } else if (/(marge|rentabilit[eé]|revenu|revpar|adr|profit)/.test(t)) {
    patch.primaryGoal = 'improve_margin_and_revenue'
  }
  return patch
}

function inferCityFromAddress(address: string) {
  const raw = String(address || '').trim()
  if (!raw) return 'unknown'
  const segments = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const maybeCity = segments.length >= 2 ? segments[segments.length - 1] : segments[0]
  const cleaned = maybeCity
    .replace(/\d{4,6}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'unknown'
}

function buildLocationSummary(connectedApartments: ReturnType<typeof getConnectedApartmentsFromStorage>) {
  const listingLocations = connectedApartments.slice(0, 12).map((apt) => ({
    name: apt.name,
    address: String(apt.address || '').trim() || 'n/a',
    city: inferCityFromAddress(String(apt.address || '')),
  }))
  const cityCounts = listingLocations.reduce<Record<string, number>>((acc, row) => {
    const city = row.city || 'unknown'
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {})
  const ranked = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])
  const topCity = ranked[0]?.[0] || 'unknown'
  const knownCities = new Set(listingLocations.map((x) => x.city).filter((x) => x !== 'unknown'))
  return {
    listingLocations,
    topCity,
    multiCityPortfolio: knownCities.size > 1,
  }
}

function buildAnomaliesAndActions(input: {
  listingsCount: number
  reservationsNext30d: number
  cancellationsLast30d: number
  occupancyProjection30dPct: number
  upcomingCheckIns14d: number
  upcomingCheckOuts14d: number
  topChannelNext30d: 'airbnb' | 'booking' | 'mixed' | 'unknown'
}) {
  const anomalies: string[] = []
  const actionPlanToday: string[] = []
  const actionPlan7d: string[] = []
  const expectedReservations = Math.max(6, input.listingsCount * 4)
  if (input.reservationsNext30d < expectedReservations) {
    anomalies.push('pickup_30d_below_expected')
    actionPlanToday.push('Baisser de 5-8% les dates avec trous sous 10 jours et activer promo last-minute.')
  }
  if (input.cancellationsLast30d >= Math.max(2, input.listingsCount)) {
    anomalies.push('cancellations_spike_30d')
    actionPlanToday.push('Vérifier politiques d annulation et renforcer les règles de séjour minimum sur périodes sensibles.')
  }
  if (input.occupancyProjection30dPct < 55) {
    anomalies.push('low_occupancy_projection_30d')
    actionPlan7d.push('Ajuster min-stay et fenêtres de check-in pour réduire les jours orphelins.')
  }
  if (input.upcomingCheckIns14d + input.upcomingCheckOuts14d > Math.max(8, input.listingsCount * 5)) {
    anomalies.push('operational_load_peak_14d')
    actionPlanToday.push('Sécuriser le planning ménage/turnover sur 14 jours avec équipe backup.')
  }
  if (input.topChannelNext30d === 'unknown') {
    anomalies.push('channel_visibility_low')
    actionPlan7d.push('Contrôler connectivité OTA et parité tarifaire Airbnb/Booking.')
  }
  if (actionPlanToday.length === 0) actionPlanToday.push('Valider les check-ins 72h et fermer les tâches ménage critiques.')
  if (actionPlan7d.length === 0) actionPlan7d.push('Revue hebdo pricing par logement (ADR, occupation, annulations).')
  return {
    anomalies: anomalies.slice(0, 5),
    actionPlanToday: actionPlanToday.slice(0, 4),
    actionPlan7d: actionPlan7d.slice(0, 4),
  }
}

function buildLiveChatContext(ownerProfile?: OwnerProfile): LiveChatContext {
  const connectedApartments = getConnectedApartmentsFromStorage()
  const listingNames = connectedApartments.map((apt) => apt.name).filter(Boolean)
  const listingCount = connectedApartments.length
  const locationSummary = buildLocationSummary(connectedApartments)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const in14d = new Date(startToday)
  in14d.setDate(in14d.getDate() + 14)
  const in30d = new Date(startToday)
  in30d.setDate(in30d.getDate() + 30)
  const minus30d = new Date(startToday)
  minus30d.setDate(minus30d.getDate() - 30)

  if (isGuestDemoSession()) {
    const monthIndex = today.getMonth()
    const daysInMonth = new Date(today.getFullYear(), monthIndex + 1, 0).getDate()
    const demoBookings = buildGuestDemoMonthBookings(daysInMonth, monthIndex)
    const upcomingCheckIns14d = demoBookings.filter((b) => b.start <= 14).length
    const upcomingCheckOuts14d = demoBookings.filter((b) => b.end <= 14).length
    const reservationsNext30d = demoBookings.filter((b) => b.status === 'reserved').length
    const cancellationsLast30d = demoBookings.filter((b) => b.status === 'cancelled').length
    const netRevenueLast30d = demoBookings
      .filter((b) => b.status === 'reserved')
      .reduce((sum, b) => sum + b.netPayoutEur, 0)
    const reservedBookings = demoBookings.filter((b) => b.status === 'reserved')
    const averageStayNights =
      reservedBookings.length > 0
        ? Number((reservedBookings.reduce((sum, b) => sum + b.nights, 0) / reservedBookings.length).toFixed(1))
        : 0
    const totalReservedNights = reservedBookings.reduce((sum, b) => sum + b.nights, 0)
    const occupancyProjection30dPct =
      listingCount > 0 ? Number(((totalReservedNights / Math.max(1, listingCount * 30)) * 100).toFixed(1)) : 0
    const airbnbCount = reservedBookings.filter((b) => b.channel === 'airbnb').length
    const bookingCount = reservedBookings.filter((b) => b.channel === 'booking').length
    const topChannelNext30d: LiveChatContext['topChannelNext30d'] =
      airbnbCount > bookingCount ? 'airbnb' : bookingCount > airbnbCount ? 'booking' : airbnbCount > 0 ? 'mixed' : 'unknown'
    const generated = buildAnomaliesAndActions({
      listingsCount: listingCount,
      reservationsNext30d,
      cancellationsLast30d,
      occupancyProjection30dPct,
      upcomingCheckIns14d,
      upcomingCheckOuts14d,
      topChannelNext30d,
    })
    return {
      mode: 'demo',
      listingsCount: listingCount,
      listingNames,
      provider: 'demo',
      upcomingCheckIns14d,
      upcomingCheckOuts14d,
      reservationsNext30d,
      cancellationsLast30d,
      netRevenueLast30d,
      averageStayNights,
      occupancyProjection30dPct,
      topChannelNext30d,
      anomalies: generated.anomalies,
      actionPlanToday: generated.actionPlanToday,
      actionPlan7d: generated.actionPlan7d,
      listingLocations: locationSummary.listingLocations,
      topCity: locationSummary.topCity,
      multiCityPortfolio: locationSummary.multiCityPortfolio,
      ownerProfile,
    }
  }

  const official = readOfficialChannelSyncData()
  const bookings = official?.bookings ?? []
  const upcomingCheckIns14d = bookings.filter((b) => {
    const d = ymdToLocalDate(b.checkIn)
    return d != null && d >= startToday && d <= in14d
  }).length
  const upcomingCheckOuts14d = bookings.filter((b) => {
    const d = ymdToLocalDate(b.checkOut)
    return d != null && d >= startToday && d <= in14d
  }).length
  const reservationsNext30d = bookings.filter((b) => {
    const d = ymdToLocalDate(b.checkIn)
    return d != null && d >= startToday && d <= in30d && String(b.status || '').toLowerCase() !== 'cancelled'
  }).length
  const cancellationsLast30d = bookings.filter((b) => {
    const checkIn = ymdToLocalDate(b.checkIn)
    return (
      checkIn != null &&
      checkIn >= minus30d &&
      checkIn <= startToday &&
      String(b.status || '').toLowerCase() === 'cancelled'
    )
  }).length
  const reservedLast30d = bookings.filter((b) => {
    const checkIn = ymdToLocalDate(b.checkIn)
    return (
      checkIn != null &&
      checkIn >= minus30d &&
      checkIn <= startToday &&
      String(b.status || '').toLowerCase() !== 'cancelled'
    )
  })
  const netRevenueLast30d = reservedLast30d.reduce((sum, b) => {
    const net = Number(b.revenuNetDetaille?.amount ?? b.prixTotalVoyageur?.amount ?? 0)
    return sum + (Number.isFinite(net) ? net : 0)
  }, 0)
  const averageStayNights =
    reservedLast30d.length > 0
      ? Number(
          (
            reservedLast30d.reduce((sum, b) => {
              const checkIn = ymdToLocalDate(b.checkIn)
              const checkOut = ymdToLocalDate(b.checkOut)
              if (!checkIn || !checkOut) return sum
              const nights = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000))
              return sum + nights
            }, 0) / reservedLast30d.length
          ).toFixed(1),
        )
      : 0
  const reservationsByChannelNext30 = bookings
    .filter((b) => {
      const d = ymdToLocalDate(b.checkIn)
      return d != null && d >= startToday && d <= in30d && String(b.status || '').toLowerCase() !== 'cancelled'
    })
    .reduce(
      (acc, b) => {
        const c = String(b.channel || '').toLowerCase()
        if (c.includes('airbnb')) acc.airbnb += 1
        else if (c.includes('booking')) acc.booking += 1
        return acc
      },
      { airbnb: 0, booking: 0 },
    )
  const topChannelNext30d: LiveChatContext['topChannelNext30d'] =
    reservationsByChannelNext30.airbnb > reservationsByChannelNext30.booking
      ? 'airbnb'
      : reservationsByChannelNext30.booking > reservationsByChannelNext30.airbnb
        ? 'booking'
        : reservationsByChannelNext30.airbnb > 0
          ? 'mixed'
          : 'unknown'
  const occupancyProjection30dPct =
    listingCount > 0
      ? Number(
          (
            (bookings
              .filter((b) => {
                const d = ymdToLocalDate(b.checkIn)
                return d != null && d >= startToday && d <= in30d && String(b.status || '').toLowerCase() !== 'cancelled'
              })
              .reduce((sum, b) => {
                const checkIn = ymdToLocalDate(b.checkIn)
                const checkOut = ymdToLocalDate(b.checkOut)
                if (!checkIn || !checkOut) return sum
                const nights = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000))
                return sum + nights
              }, 0) /
              Math.max(1, listingCount * 30)) *
            100
          ).toFixed(1),
        )
      : 0
  const generated = buildAnomaliesAndActions({
    listingsCount: listingCount,
    reservationsNext30d,
    cancellationsLast30d,
    occupancyProjection30dPct,
    upcomingCheckIns14d,
    upcomingCheckOuts14d,
    topChannelNext30d,
  })

  return {
    mode: 'connected',
    listingsCount: listingCount,
    listingNames,
    provider: official?.provider || undefined,
    syncedAt: official?.syncedAt || undefined,
    upcomingCheckIns14d,
    upcomingCheckOuts14d,
    reservationsNext30d,
    cancellationsLast30d,
    netRevenueLast30d: Number(netRevenueLast30d.toFixed(2)),
    averageStayNights,
    occupancyProjection30dPct,
    topChannelNext30d,
    anomalies: generated.anomalies,
    actionPlanToday: generated.actionPlanToday,
    actionPlan7d: generated.actionPlan7d,
    listingLocations: locationSummary.listingLocations,
    topCity: locationSummary.topCity,
    multiCityPortfolio: locationSummary.multiCityPortfolio,
    ownerProfile,
  }
}

export function AiChatWidget() {
  const { t, locale } = useLanguage()
  const pathname = useAppPathname()
  const sessionLoggedIn = useStaypilotSessionLoggedIn()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>({})
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)
  const sessionKeyRef = useRef('')

  const currentUserKey =
    typeof window !== 'undefined'
      ? (localStorage.getItem(LS_CURRENT_USER) ?? localStorage.getItem(LS_LOGIN_IDENTIFIER) ?? '').trim().toLowerCase()
      : ''
  const activeAccount =
    currentUserKey && typeof window !== 'undefined'
      ? getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, currentUserKey))
      : undefined
  const customerFirstName = safeAccountText(activeAccount?.firstName)
  const isIdentifiedSession = sessionLoggedIn && currentUserKey.length > 0
  const storageKey = isIdentifiedSession ? `staypilot_ai_chat_history_${currentUserKey}` : ''

  const disabledByEnv = import.meta.env.VITE_AI_CHAT_ENABLED === 'false'
  const hideOnAuth = pathname === '/connexion' || pathname === '/inscription'

  const closePanel = useCallback(() => {
    setOpen(false)
    initialized.current = false
    setMessages([])
    setInput('')
    setPendingImage(null)
    setLoading(false)
  }, [])

  const onPickImage = useCallback(async (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await compressImageToJpegDataUrl(file)
      setPendingImage(dataUrl)
    } catch {
      /* ignore invalid image */
    }
  }, [])

  useEffect(() => {
    if (!open || initialized.current) return
    initialized.current = true
    sessionKeyRef.current = storageKey
    const load = async () => {
      if (isIdentifiedSession && storageKey) {
        try {
          const userKeyEncoded = encodeURIComponent(currentUserKey)
          const remoteRes = await fetch(`${CHAT_HISTORY_PATH}?userKey=${userKeyEncoded}`)
          if (remoteRes.ok) {
            const remote = (await remoteRes.json().catch(() => ({}))) as {
              messages?: ChatTurn[]
              remote?: boolean
              profile?: OwnerProfile
            }
            if (remote.profile && typeof remote.profile === 'object') setOwnerProfile(remote.profile)
            if (Array.isArray(remote.messages) && remote.messages.length > 0) {
              setMessages(remote.messages.slice(-24))
              return
            }
          }
        } catch {
          // fallback to local storage
        }
        try {
          const raw = localStorage.getItem(storageKey)
          if (raw) {
            const parsed = JSON.parse(raw) as ChatTurn[]
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed.slice(-24))
              return
            }
          }
        } catch {
          // ignore corrupted storage
        }
      }
      const welcome =
        isIdentifiedSession && customerFirstName.length > 0
          ? `${t.aiChatWelcome}\n\nRavi de vous retrouver ${customerFirstName}.`
          : t.aiChatWelcome
      setMessages([{ role: 'assistant', content: welcome }])
    }
    void load()
  }, [open, storageKey, t.aiChatWelcome, customerFirstName, isIdentifiedSession, currentUserKey])

  useEffect(() => {
    if (!open || !isIdentifiedSession || !sessionKeyRef.current) return
    localStorage.setItem(sessionKeyRef.current, JSON.stringify(messages.slice(-24)))
  }, [messages, open, isIdentifiedSession])

  useEffect(() => {
    if (!open || !isIdentifiedSession || !currentUserKey || messages.length === 0) return
    const payload = {
      userKey: currentUserKey,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      profilePatch: ownerProfile,
    }
    void fetch(CHAT_HISTORY_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => undefined)
  }, [messages, open, isIdentifiedSession, currentUserKey, ownerProfile])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    const imageToSend = pendingImage
    if ((!text && !imageToSend) || loading) return

    const userText = text || t.aiChatImageOnlyPrompt
    const nextUser: ChatTurn = {
      role: 'user',
      content: userText,
      ...(imageToSend ? { imageDataUrl: imageToSend } : {}),
    }
    const history = [...messages, nextUser]
    const ownerProfilePatch = inferOwnerProfilePatchFromText(userText)
    if (Object.keys(ownerProfilePatch).length > 0) {
      setOwnerProfile((prev) => ({ ...prev, ...ownerProfilePatch }))
    }
    setMessages(history)
    setInput('')
    setPendingImage(null)
    setLoading(true)
    try {
      const payload = {
        locale,
        customerFirstName: isIdentifiedSession ? customerFirstName : '',
        messages: mapTurnsToApiPayload(history),
        liveContext: isIdentifiedSession ? buildLiveChatContext({ ...ownerProfile, ...ownerProfilePatch }) : undefined,
      }
      const res = await fetch(CHAT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string
        error?: string
        message?: string
      }
      if (!res.ok) {
        const isConfig = res.status === 503 || data.error === 'ai_not_configured'
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isConfig ? t.aiChatErrorUnavailable : data.message || t.aiChatErrorGeneric,
          },
        ])
        return
      }
      const replyText = typeof data.reply === 'string' ? data.reply.trim() : ''
      if (replyText) {
        setMessages((prev) => [...prev, { role: 'assistant', content: replyText }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: t.aiChatErrorGeneric }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t.aiChatErrorGeneric }])
    } finally {
      setLoading(false)
    }
  }, [
    input,
    pendingImage,
    loading,
    locale,
    messages,
    t.aiChatErrorGeneric,
    t.aiChatErrorUnavailable,
    t.aiChatImageOnlyPrompt,
    customerFirstName,
    ownerProfile,
    isIdentifiedSession,
  ])

  const canSend = !loading && (input.trim().length > 0 || Boolean(pendingImage))

  if (disabledByEnv || hideOnAuth || !sessionLoggedIn) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end sm:bottom-6 sm:right-6">
      {open ? (
        <div
          className="pointer-events-auto flex max-h-[min(32rem,72vh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/15 sm:w-[24rem]"
          role="dialog"
          aria-label={t.aiChatTitle}
          onPaste={(e) => {
            const items = e.clipboardData?.items
            if (!items?.length) return
            for (let i = 0; i < items.length; i++) {
              const it = items[i]
              if (it?.kind === 'file' && it.type.startsWith('image/')) {
                e.preventDefault()
                const f = it.getAsFile()
                if (f) void onPickImage(f)
                return
              }
            }
          }}
        >
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 bg-gradient-to-r from-[#4a86f7]/10 to-white px-4 py-3">
            <div>
              <p className="text-sm font-bold text-zinc-900">{t.aiChatTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-600">{t.aiChatSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40"
              aria-label={t.aiChatClose}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}-${m.role === 'user' ? m.imageDataUrl?.slice(0, 24) ?? '' : m.content.slice(0, 12)}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#4a86f7] text-white'
                      : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {m.role === 'user' && m.imageDataUrl ? (
                    <img
                      src={m.imageDataUrl}
                      alt=""
                      className="mb-2 max-h-36 w-full rounded-lg object-cover object-top"
                    />
                  ) : null}
                  <span className="whitespace-pre-wrap break-words">{m.content}</span>
                </div>
              </div>
            ))}
            {loading ? (
              <p className="text-xs text-zinc-500">{t.aiChatThinking}</p>
            ) : null}
          </div>

          <div className="border-t border-zinc-100 p-3">
            {pendingImage ? (
              <div className="relative mb-2 inline-block max-w-full">
                <img
                  src={pendingImage}
                  alt=""
                  className="max-h-24 rounded-lg border border-zinc-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-white shadow-md hover:bg-zinc-900"
                  aria-label={t.aiChatRemovePhoto}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  void onPickImage(f ?? null)
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-[#4a86f7]/50 hover:bg-zinc-50 hover:text-[#4a86f7] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35"
                aria-label={t.aiChatAttachPhoto}
                title={t.aiChatAttachPhoto}
              >
                <ImagePlus className="h-5 w-5" aria-hidden />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder={t.aiChatPlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#4a86f7] focus:outline-none focus:ring-2 focus:ring-[#4a86f7]/25"
                maxLength={4000}
                autoComplete="off"
                aria-label={t.aiChatPlaceholder}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!canSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4a86f7] text-white transition-opacity hover:bg-[#3b76e8] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/45"
                aria-label={t.aiChatSend}
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] leading-snug text-zinc-400">{t.aiChatPastePhotoHint}</p>
            <p className="mt-1 text-center text-[11px] leading-snug text-zinc-500">{t.aiChatFooterHint}</p>
            <p className="mt-1 text-center text-[11px] text-zinc-500">
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-[#4a86f7] hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="pointer-events-auto mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#4a86f7] text-white shadow-lg shadow-[#4a86f7]/35 transition-transform hover:scale-[1.03] hover:bg-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/50 focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-label={open ? t.aiChatClose : t.aiChatFabLabel}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  )
}
