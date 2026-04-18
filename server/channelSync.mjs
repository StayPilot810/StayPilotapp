import https from 'node:https'
import { Resolver } from 'node:dns/promises'

const BEDS24_BASE_URLS = ['https://api.beds24.com/v2', 'https://beds24.com/api/v2']
const HOSTAWAY_BASE_URL = 'https://api.hostaway.com/v1'
const GUESTY_BASE_URL = 'https://open-api.guesty.com'
const LODGIFY_BASE_URL = 'https://api.lodgify.com/v2'

function pickString(v) {
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeBeds24Credential(rawValue) {
  const compact = pickString(rawValue).replace(/\s+/g, '')
  const raw = compact.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!raw) return ''
  // Accept copied values like "beds24.com/...." without protocol.
  if (!/^https?:\/\//i.test(raw) && /beds24\.com/i.test(raw)) {
    try {
      const withProtocol = `https://${raw.replace(/^\/+/, '')}`
      const url = new URL(withProtocol)
      const fromQuery =
        pickString(url.searchParams.get('code')) ||
        pickString(url.searchParams.get('token')) ||
        pickString(url.searchParams.get('inviteCode')) ||
        pickString(url.searchParams.get('invite')) ||
        pickString(url.searchParams.get('access_token'))
      if (fromQuery) return fromQuery
      const lastSegment = pickString(url.pathname.split('/').filter(Boolean).pop())
      return lastSegment || raw
    } catch {
      return raw
    }
  }
  if (!/^https?:\/\//i.test(raw)) return raw
  try {
    const url = new URL(raw)
    const fromQuery =
      pickString(url.searchParams.get('code')) ||
      pickString(url.searchParams.get('token')) ||
      pickString(url.searchParams.get('inviteCode')) ||
      pickString(url.searchParams.get('invite')) ||
      pickString(url.searchParams.get('access_token'))
    if (fromQuery) return fromQuery
    const lastSegment = pickString(url.pathname.split('/').filter(Boolean).pop())
    return lastSegment || raw
  } catch {
    return raw
  }
}

function normalizeProvider(provider) {
  const p = pickString(provider).toLowerCase()
  if (p === 'beds24' || p === 'hostaway' || p === 'guesty' || p === 'lodgify') return p
  return ''
}

function pickArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.bookings)) return payload.bookings
  if (Array.isArray(payload?.apartments)) return payload.apartments
  return []
}

function collectPossibleIds(input, acc = new Set(), depth = 0) {
  if (depth > 8 || input == null) return acc
  if (Array.isArray(input)) {
    input.forEach((v) => collectPossibleIds(v, acc, depth + 1))
    return acc
  }
  if (typeof input !== 'object') return acc
  for (const [key, value] of Object.entries(input)) {
    const k = key.toLowerCase()
    if (
      k === 'id' ||
      k === 'userid' ||
      k === 'user_id' ||
      k === 'accountid' ||
      k === 'account_id' ||
      k === 'ownerid' ||
      k === 'owner_id'
    ) {
      const v = pickString(value)
      if (v) acc.add(v)
    }
    if (value && typeof value === 'object') collectPossibleIds(value, acc, depth + 1)
  }
  return acc
}

function pickAddress(obj) {
  const direct =
    pickString(obj?.address) ||
    pickString(obj?.fullAddress) ||
    pickString(obj?.location?.address) ||
    pickString(obj?.location?.fullAddress) ||
    pickString(obj?.publicAddress) ||
    pickString(obj?.street)
  const city = pickString(obj?.city || obj?.location?.city)
  const country = pickString(obj?.country || obj?.countryCode || obj?.location?.country)
  if (direct) return direct
  const combined = [city, country].filter(Boolean).join(', ')
  return combined
}

function pickNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(',', '.'))
    if (Number.isFinite(n)) return n
  }
  return 0
}

async function httpsGetJson(url, headers, insecure = false) {
  return await new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers,
        rejectUnauthorized: !insecure,
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          let json = {}
          try {
            json = raw ? JSON.parse(raw) : {}
          } catch {
            json = { raw }
          }
          resolve({
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            status: res.statusCode || 500,
            json,
          })
        })
      },
    )
    req.on('error', reject)
    req.end()
  })
}

async function resolveHostWithDoh(hostname) {
  const providers = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
  ]
  for (const url of providers) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/dns-json' },
      })
      if (!res.ok) continue
      const json = await res.json().catch(() => ({}))
      const answers = Array.isArray(json?.Answer) ? json.Answer : []
      const a = answers.find((r) => typeof r?.data === 'string' && /^\d{1,3}(\.\d{1,3}){3}$/.test(r.data))
      if (a?.data) return a.data
    } catch {
      // try next provider
    }
  }
  return ''
}

async function resolveHostWithPublicDns(hostname) {
  try {
    const resolver = new Resolver()
    resolver.setServers(['1.1.1.1', '8.8.8.8'])
    const records = await resolver.resolve4(hostname)
    const first = Array.isArray(records) ? records.find((ip) => typeof ip === 'string' && ip.trim()) : ''
    return first || ''
  } catch {
    return ''
  }
}

async function httpsGetJsonViaIp(urlString, headers, ip, insecure = false) {
  return await new Promise((resolve, reject) => {
    const target = new URL(urlString)
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: ip,
        port: target.port ? Number(target.port) : 443,
        method: 'GET',
        path: `${target.pathname}${target.search}`,
        headers: { ...headers, Host: target.hostname },
        servername: target.hostname,
        rejectUnauthorized: !insecure,
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          let json = {}
          try {
            json = raw ? JSON.parse(raw) : {}
          } catch {
            json = { raw }
          }
          resolve({
            ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
            status: res.statusCode || 500,
            json,
          })
        })
      },
    )
    req.on('error', reject)
    req.end()
  })
}

function normalizePayments(input) {
  const list = pickArray(input)
  return list.map((p, idx) => ({
    id: pickString(p?.id || p?.paymentId) || `payment-${idx + 1}`,
    amount: pickNumber(p?.amount || p?.paidAmount || p?.value),
    currency: pickString(p?.currency || p?.currencyCode) || 'EUR',
    status: pickString(p?.status || p?.paymentStatus) || 'unknown',
    paidAt: pickString(p?.paidAt || p?.date || p?.createdAt),
    method: pickString(p?.method || p?.paymentMethod || p?.provider),
  }))
}

function normalizeMessages(input) {
  const list = pickArray(input)
  return list.map((m, idx) => ({
    id: pickString(m?.id || m?.messageId) || `message-${idx + 1}`,
    sender: pickString(m?.sender || m?.from || m?.author),
    body: pickString(m?.body || m?.message || m?.text),
    sentAt: pickString(m?.sentAt || m?.date || m?.createdAt),
  }))
}

function normalizeNotes(input) {
  const list = Array.isArray(input) ? input : pickString(input) ? [input] : []
  return list.map((n, idx) => ({
    id: pickString(n?.id) || `note-${idx + 1}`,
    body: pickString(n?.body || n?.note || n?.text || n),
    createdAt: pickString(n?.createdAt || n?.date),
  }))
}

function buildFinancialBundle(source) {
  const gross = pickNumber(
    source?.totalPrice || source?.totalAmount || source?.price || source?.invoiceTotal || source?.amount,
  )
  const platformFees = pickNumber(
    source?.platformFee || source?.channelFee || source?.commission || source?.commissionAmount || source?.otaFee,
  )
  const taxes = pickNumber(source?.tax || source?.taxes || source?.vat || source?.vatAmount)
  const cleaningFee = pickNumber(source?.cleaningFee || source?.cleaning)
  const otherFees = pickNumber(source?.otherFees || source?.extraFees || source?.serviceFee)
  const payout = pickNumber(source?.payout || source?.hostPayout || source?.netPayout)
  const revenueNetDetaille = payout || gross - platformFees - taxes - cleaningFee - otherFees
  const currency = pickString(source?.currency || source?.currencyCode) || 'EUR'
  const platformFeePercent =
    gross + cleaningFee > 0 ? Number((((platformFees / (gross + cleaningFee)) * 100).toFixed(2))) : 0

  return {
    prixTotalVoyageur: {
      amount: gross,
      currency,
    },
    fraisMenage: {
      amount: cleaningFee,
      currency,
    },
    autresFrais: {
      amount: otherFees,
      currency,
    },
    revenuNetDetaille: {
      amount: revenueNetDetaille,
      currency,
      formula: 'gross - platformFees - taxes - cleaningFee - otherFees',
    },
    fraisPlateforme: {
      amount: platformFees,
      percent: platformFeePercent,
      currency,
      detail: pickString(source?.feeDescription || source?.commissionType || ''),
    },
    taxesTva: {
      totalTaxes: taxes,
      vatAmount: pickNumber(source?.vatAmount || source?.vat),
      vatRate: pickNumber(source?.vatRate || source?.taxRate),
      currency,
    },
    paiements: normalizePayments(source?.payments || source?.transactions || source?.charges),
    messagesVoyageurs: normalizeMessages(source?.messages || source?.conversation || source?.guestMessages),
    notesInternes: normalizeNotes(source?.notes || source?.internalNotes),
  }
}

function inferReservationChannel(source) {
  const candidates = [
    source?.channel,
    source?.channelName,
    source?.channelType,
    source?.source,
    source?.sourceName,
    source?.origin,
    source?.ota,
    source?.otaName,
    source?.bookingChannel,
    source?.reservationSource,
  ]
  const merged = candidates
    .map((v) => pickString(v).toLowerCase())
    .filter(Boolean)
    .join(' ')
  if (!merged) return ''
  if (merged.includes('airbnb')) return 'airbnb'
  if (merged.includes('booking.com') || merged.includes('bookingcom') || merged.includes('booking')) return 'booking'
  return ''
}

function completenessFromBundle(bundle) {
  const hasFinance =
    bundle.revenuNetDetaille.amount > 0 ||
    bundle.fraisPlateforme.amount > 0 ||
    bundle.taxesTva.totalTaxes > 0 ||
    bundle.paiements.length > 0
  const hasComms = bundle.messagesVoyageurs.length > 0 || bundle.notesInternes.length > 0
  return {
    status: hasFinance && hasComms ? 'complete' : hasFinance ? 'partial_missing_communication_scopes' : 'partial_missing_financial_scopes',
    hasFinance,
    hasComms,
  }
}

async function fetchBeds24Json(path, token) {
  let lastNetworkError = ''
  let lastHttpError = { status: 502, error: 'beds24_request_failed' }
  let hasHttpError = false
  for (const baseUrl of BEDS24_BASE_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          token,
        },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message =
          pickString(json?.message) ||
          pickString(json?.error) ||
          pickString(json?.error_description) ||
          pickString(json?.details) ||
          'beds24_request_failed'
        lastHttpError = { status: res.status, error: message }
        hasHttpError = true
        continue
      }
      return { ok: true, status: 200, data: json }
    } catch (e) {
      lastNetworkError = e instanceof Error ? e.message : 'beds24_network_error'
      try {
        const strictRes = await httpsGetJson(`${baseUrl}${path}`, { accept: 'application/json', token }, false)
        if (strictRes.ok) return { ok: true, status: strictRes.status, data: strictRes.json }
        const strictMessage =
          pickString(strictRes.json?.message) ||
          pickString(strictRes.json?.error) ||
          pickString(strictRes.json?.error_description) ||
          pickString(strictRes.json?.details) ||
          'beds24_request_failed'
        lastHttpError = { status: strictRes.status, error: strictMessage }
        hasHttpError = true
      } catch (strictErr) {
        lastNetworkError = strictErr instanceof Error ? strictErr.message : lastNetworkError
        try {
          const insecureRes = await httpsGetJson(`${baseUrl}${path}`, { accept: 'application/json', token }, true)
          if (insecureRes.ok) return { ok: true, status: insecureRes.status, data: insecureRes.json }
          const insecureMessage =
            pickString(insecureRes.json?.message) ||
            pickString(insecureRes.json?.error) ||
            pickString(insecureRes.json?.error_description) ||
            pickString(insecureRes.json?.details) ||
            'beds24_request_failed'
          lastHttpError = { status: insecureRes.status, error: insecureMessage }
          hasHttpError = true
        } catch (insecureErr) {
          lastNetworkError = insecureErr instanceof Error ? insecureErr.message : lastNetworkError
          const dnsFailed = String(lastNetworkError).toLowerCase().includes('enotfound')
          if (dnsFailed) {
            try {
              const host = new URL(baseUrl).hostname
              const ip = (await resolveHostWithPublicDns(host)) || (await resolveHostWithDoh(host))
              if (ip) {
                const viaIpRes = await httpsGetJsonViaIp(`${baseUrl}${path}`, { accept: 'application/json', token }, ip, true)
                if (viaIpRes.ok) return { ok: true, status: viaIpRes.status, data: viaIpRes.json }
                const viaIpMessage =
                  pickString(viaIpRes.json?.message) ||
                  pickString(viaIpRes.json?.error) ||
                  pickString(viaIpRes.json?.error_description) ||
                  pickString(viaIpRes.json?.details) ||
                  'beds24_request_failed'
                lastHttpError = { status: viaIpRes.status, error: viaIpMessage }
                hasHttpError = true
              }
            } catch {
              // keep original network error
            }
          }
        }
      }
    }
  }
  if (hasHttpError) return { ok: false, status: lastHttpError.status, error: lastHttpError.error }
  if (lastNetworkError) return { ok: false, status: 502, error: lastNetworkError }
  return { ok: false, status: lastHttpError.status, error: lastHttpError.error }
}

function hasMeaningfulChannelIdValue(val) {
  if (val === true) return true
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return true
  if (typeof val === 'string') {
    const s = val.trim()
    if (!s || s === '0') return false
    return true
  }
  return false
}

function inferGlobalOtaLinksFromPayload(payload) {
  let airbnb = false
  let booking = false

  function walk(node, depth) {
    if (!node || depth > 12) return
    if (Array.isArray(node)) {
      for (const el of node) walk(el, depth + 1)
      return
    }
    if (typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      const kl = key.toLowerCase()
      const valueText = typeof value === 'string' ? value.toLowerCase() : ''
      const hasValue = hasMeaningfulChannelIdValue(value)
      if (
        (kl.includes('airbnb') || valueText.includes('airbnb')) &&
        (hasValue || valueText.includes('connected') || valueText.includes('active'))
      ) {
        airbnb = true
      }
      if (
        (kl.includes('booking.com') || kl.includes('bookingcom') || kl.includes('bcom') || valueText.includes('booking.com')) &&
        (hasValue || valueText.includes('connected') || valueText.includes('active'))
      ) {
        booking = true
      }
      if (value && typeof value === 'object') walk(value, depth + 1)
    }
  }

  walk(payload, 0)
  return { airbnb, booking }
}

/** Heuristique sur la payload Beds24 (champs connus / imbriqués) — sans appels OTA supplémentaires. */
function inferBeds24ChannelLinks(item) {
  let airbnb = false
  let booking = false

  function walk(node, depth) {
    if (!node || typeof node !== 'object' || depth > 14) return
    if (Array.isArray(node)) {
      for (const el of node) walk(el, depth + 1)
      return
    }
    for (const [key, val] of Object.entries(node)) {
      const kl = key.toLowerCase()
      const hasValue = hasMeaningfulChannelIdValue(val)
      const bookingNoise =
        kl.includes('bookingtype') ||
        kl.includes('bookingengine') ||
        kl.includes('directbooking') ||
        kl.includes('bookingdeposit') ||
        kl.includes('bookingwindow')

      // Beds24 channel mapping fields vary by account/channel setup.
      // Detect broad "airbnb*" / "booking*" keys first, then keep strict
      // checks as fallback to avoid missing valid mappings.
      if (hasValue) {
        const likelyAirbnb =
          kl.includes('airbnb') &&
          !kl.includes('airbnbcontent') &&
          !kl.includes('airbnbreview') &&
          !kl.includes('airbnbmessage')
        const likelyBooking =
          (kl.includes('booking.com') || kl.includes('bookingcom') || kl.includes('bcom')) &&
          !bookingNoise
        if (likelyAirbnb) airbnb = true
        if (likelyBooking) booking = true
      }

      if (hasValue) {
        if (
          kl === 'airbnblistingid' ||
          kl === 'airbnbuserid' ||
          kl === 'airbnbusername' ||
          (kl.includes('airbnb') && kl.includes('listing') && kl.includes('id'))
        ) {
          airbnb = true
        }
        if (
          !bookingNoise &&
          (kl === 'bookingroomid' ||
            kl === 'bookinghotelid' ||
            kl === 'bookingcomhotelid' ||
            kl === 'bookingcomroomid' ||
            kl === 'bcomroomid' ||
            kl === 'bcomhotelid' ||
            (kl.includes('booking.com') && kl.includes('id')) ||
            (kl.startsWith('bookingcom') && (kl.includes('hotel') || kl.includes('room'))))
        ) {
          booking = true
        }
      }
      if (val != null && typeof val === 'object') walk(val, depth + 1)
    }
  }

  walk(item, 0)
  return { airbnb, booking }
}

function normalizeBeds24Properties(raw) {
  const list = pickArray(raw)
  return list.map((item, idx) => {
    const id = item?.id != null ? String(item.id) : `beds24-property-${idx + 1}`
    const name = pickString(item?.name) || `Property ${idx + 1}`
    return {
      id,
      name,
      address: pickAddress(item),
      channelLinks: inferBeds24ChannelLinks(item),
    }
  })
}

function normalizeBeds24Bookings(raw) {
  const list = Array.isArray(raw) ? raw : []
  return list
    .map((item) => {
      const id = item?.id != null ? String(item.id) : ''
      const propertyId = item?.propertyId != null ? String(item.propertyId) : ''
      const checkIn = pickString(item?.arrival)
      const checkOut = pickString(item?.departure)
      const guestName =
        pickString(item?.firstName && item?.lastName ? `${item.firstName} ${item.lastName}` : '') ||
        pickString(item?.lastName) ||
        pickString(item?.firstName) ||
        pickString(item?.name) ||
        'Guest'
      const status = pickString(item?.status).toLowerCase() || 'reserved'
      const channel = inferReservationChannel(item)
      if (!id || !propertyId || !checkIn || !checkOut) return null
      const financial = buildFinancialBundle(item)
      return {
        id,
        propertyId,
        checkIn,
        checkOut,
        guestName,
        channel,
        status,
        ...financial,
        financeAvancee: {
          scopeStatus: completenessFromBundle(financial),
          providerRawFields: {
            hasInvoiceItems: Boolean(item?.invoiceItems),
            hasCharges: Boolean(item?.charges),
          },
        },
      }
    })
    .filter(Boolean)
}

async function syncBeds24({ apiToken }) {
  let token = normalizeBeds24Credential(apiToken)
  if (!token) return { status: 400, ok: false, error: 'missing_api_token' }
  let exchangedFromInviteCode = false

  // Client-friendly flow: accept either a direct API token or an invite code.
  // If direct calls fail, try exchanging invite code -> token automatically.
  const beds24PropertiesPath = '/properties?includeAllRooms=true'
  let propertiesRes = await fetchBeds24Json(beds24PropertiesPath, token)
  let bookingsRes = await fetchBeds24Json('/bookings', token)

  if (!propertiesRes.ok || !bookingsRes.ok) {
    for (const baseUrl of BEDS24_BASE_URLS) {
      let setupOk = false
      let exchanged = ''
      try {
        const setupRes = await fetch(`${baseUrl}/authentication/setup`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            code: token,
          },
        })
        const setupJson = await setupRes.json().catch(() => ({}))
        exchanged = pickString(setupJson?.token)
        setupOk = setupRes.ok
      } catch {
        try {
          const setupRes = await httpsGetJson(`${baseUrl}/authentication/setup`, { accept: 'application/json', code: token }, true)
          exchanged = pickString(setupRes.json?.token)
          setupOk = setupRes.ok
        } catch {
          try {
            const host = new URL(baseUrl).hostname
            const ip = (await resolveHostWithPublicDns(host)) || (await resolveHostWithDoh(host))
            if (ip) {
              const setupRes = await httpsGetJsonViaIp(`${baseUrl}/authentication/setup`, { accept: 'application/json', code: token }, ip, true)
              exchanged = pickString(setupRes.json?.token)
              setupOk = setupRes.ok
            } else {
              setupOk = false
            }
          } catch {
            setupOk = false
          }
        }
      }
      if (setupOk && exchanged) {
        token = exchanged
        exchangedFromInviteCode = true
        propertiesRes = await fetchBeds24Json(beds24PropertiesPath, token)
        bookingsRes = await fetchBeds24Json('/bookings', token)
        break
      }
    }
  }

  if (!propertiesRes.ok) return { status: propertiesRes.status, ok: false, error: propertiesRes.error }
  if (!bookingsRes.ok) return { status: bookingsRes.status, ok: false, error: bookingsRes.error }

  const properties = normalizeBeds24Properties(propertiesRes.data)
  const bookings = normalizeBeds24Bookings(bookingsRes.data)
  let globalOta = { airbnb: false, booking: false }
  const channelsRes = await fetchBeds24Json('/channels', token)
  if (channelsRes.ok) {
    globalOta = inferGlobalOtaLinksFromPayload(channelsRes.data)
  }
  const bookingsOta = inferGlobalOtaLinksFromPayload(bookingsRes.data)
  const mergedGlobalOta = {
    airbnb: globalOta.airbnb || bookingsOta.airbnb,
    booking: globalOta.booking || bookingsOta.booking,
  }
  const propertiesWithOta = properties.map((prop) => ({
    ...prop,
    channelLinks: {
      airbnb: Boolean(prop.channelLinks?.airbnb || mergedGlobalOta.airbnb),
      booking: Boolean(prop.channelLinks?.booking || mergedGlobalOta.booking),
    },
  }))

  return {
    status: 200,
    ok: true,
    provider: 'beds24',
    data: {
      properties: propertiesWithOta,
      bookings,
      connectionToken: token,
      tokenType: exchangedFromInviteCode ? 'exchanged_access_token' : 'provided_token',
      syncedAt: new Date().toISOString(),
    },
  }
}

function hostawayArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.data)) return data.data
  return []
}

async function hostawayGet(path, token) {
  const res = await fetch(`${HOSTAWAY_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

async function hostawayAccessToken(accountId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: accountId,
    client_secret: clientSecret,
    scope: 'general',
  })
  const res = await fetch(`${HOSTAWAY_BASE_URL}/accessTokens`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: body.toString(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, error: 'hostaway_auth_failed' }
  const token = pickString(json?.access_token || json?.token || json?.result?.access_token)
  if (!token) return { ok: false, status: 401, error: 'hostaway_missing_access_token' }
  return { ok: true, status: 200, token }
}

function normalizeHostawayListings(raw) {
  const list = hostawayArray(raw)
  return list.map((item, idx) => ({
    id: item?.id != null ? String(item.id) : `hostaway-listing-${idx + 1}`,
    name: pickString(item?.name || item?.listingName || item?.internalListingName) || `Listing ${idx + 1}`,
    address: pickAddress(item),
  }))
}

function normalizeHostawayReservations(raw) {
  const list = hostawayArray(raw)
  return list
    .map((item) => {
      const id = item?.id != null ? String(item.id) : ''
      const propertyId = item?.listingMapId != null ? String(item.listingMapId) : item?.listingId != null ? String(item.listingId) : ''
      const checkIn = pickString(item?.arrivalDate || item?.checkInDate)
      const checkOut = pickString(item?.departureDate || item?.checkOutDate)
      const guestName =
        pickString(item?.guestName) ||
        pickString(item?.guestFirstName && item?.guestLastName ? `${item.guestFirstName} ${item.guestLastName}` : '') ||
        'Guest'
      const status = pickString(item?.status).toLowerCase() || 'reserved'
      const channel = inferReservationChannel(item)
      if (!id || !propertyId || !checkIn || !checkOut) return null
      const financial = buildFinancialBundle(item)
      return {
        id,
        propertyId,
        checkIn,
        checkOut,
        guestName,
        channel,
        status,
        ...financial,
        financeAvancee: {
          scopeStatus: completenessFromBundle(financial),
          providerRawFields: {
            hasReservationFees: Boolean(item?.reservationFees),
            hasHostProxyEmail: Boolean(item?.hostProxyEmail),
          },
        },
      }
    })
    .filter(Boolean)
}

async function syncHostaway({ apiToken, accountId }) {
  const secretOrToken = pickString(apiToken)
  const account = pickString(accountId)
  if (!secretOrToken || !account) return { status: 400, ok: false, error: 'missing_hostaway_credentials' }

  let accessToken = secretOrToken
  let listingsRes = await hostawayGet('/listings?limit=100&offset=0', accessToken)
  let reservationsRes = await hostawayGet('/reservations?limit=100&offset=0', accessToken)

  if (!listingsRes.ok || !reservationsRes.ok) {
    const authRes = await hostawayAccessToken(account, secretOrToken)
    if (!authRes.ok) return { status: authRes.status, ok: false, error: authRes.error }
    accessToken = authRes.token
    listingsRes = await hostawayGet('/listings?limit=100&offset=0', accessToken)
    reservationsRes = await hostawayGet('/reservations?limit=100&offset=0', accessToken)
  }

  if (!listingsRes.ok) return { status: listingsRes.status, ok: false, error: 'hostaway_listings_failed' }
  if (!reservationsRes.ok) return { status: reservationsRes.status, ok: false, error: 'hostaway_reservations_failed' }

  const properties = normalizeHostawayListings(listingsRes.json)
  const bookings = normalizeHostawayReservations(reservationsRes.json)

  return {
    status: 200,
    ok: true,
    provider: 'hostaway',
    data: {
      properties,
      bookings,
      syncedAt: new Date().toISOString(),
    },
  }
}

async function guestyAccessToken(clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'open-api',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetch(`${GUESTY_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, error: 'guesty_auth_failed' }
  const token = pickString(json?.access_token)
  if (!token) return { ok: false, status: 401, error: 'guesty_missing_access_token' }
  return { ok: true, status: 200, token }
}

async function guestyGet(path, token) {
  const res = await fetch(`${GUESTY_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

function normalizeGuestyProperties(raw) {
  const list = pickArray(raw)
  return list.map((item, idx) => ({
    id: pickString(item?.id || item?._id) || `guesty-listing-${idx + 1}`,
    name: pickString(item?.title || item?.nickname || item?.name) || `Listing ${idx + 1}`,
    address: pickAddress(item),
  }))
}

function normalizeGuestyBookings(raw) {
  const list = pickArray(raw)
  return list
    .map((item) => {
      const id = pickString(item?.id || item?._id)
      const listing = item?.listing || {}
      const propertyId = pickString(item?.listingId || listing?._id || listing?.id)
      const checkIn = pickString(item?.checkInDateLocalized || item?.checkInDate || item?.checkIn)
      const checkOut = pickString(item?.checkOutDateLocalized || item?.checkOutDate || item?.checkOut)
      const guestName =
        pickString(item?.guest?.fullName) ||
        pickString(item?.guestName) ||
        pickString(item?.guest?.firstName && item?.guest?.lastName ? `${item.guest.firstName} ${item.guest.lastName}` : '') ||
        'Guest'
      const status = pickString(item?.status).toLowerCase() || 'reserved'
      const channel = inferReservationChannel(item)
      if (!id || !propertyId || !checkIn || !checkOut) return null
      const financial = buildFinancialBundle(item)
      return {
        id,
        propertyId,
        checkIn,
        checkOut,
        guestName,
        channel,
        status,
        ...financial,
        financeAvancee: {
          scopeStatus: completenessFromBundle(financial),
          providerRawFields: {
            hasMoneyInOut: Boolean(item?.moneyInOut),
            hasGuest: Boolean(item?.guest),
          },
        },
      }
    })
    .filter(Boolean)
}

async function syncGuesty({ apiToken, accountId }) {
  const clientSecret = pickString(apiToken)
  const clientId = pickString(accountId)
  if (!clientSecret || !clientId) return { status: 400, ok: false, error: 'missing_guesty_credentials' }
  const auth = await guestyAccessToken(clientId, clientSecret)
  if (!auth.ok) return { status: auth.status, ok: false, error: auth.error }

  const listingsRes = await guestyGet('/v1/listings?limit=100&skip=0', auth.token)
  if (!listingsRes.ok) return { status: listingsRes.status, ok: false, error: 'guesty_listings_failed' }
  const reservationsRes = await guestyGet('/v1/reservations?limit=100&skip=0', auth.token)
  if (!reservationsRes.ok) return { status: reservationsRes.status, ok: false, error: 'guesty_reservations_failed' }

  return {
    status: 200,
    ok: true,
    provider: 'guesty',
    data: {
      properties: normalizeGuestyProperties(listingsRes.json),
      bookings: normalizeGuestyBookings(reservationsRes.json),
      syncedAt: new Date().toISOString(),
    },
  }
}

async function lodgifyGet(path, apiKey) {
  const res = await fetch(`${LODGIFY_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-ApiKey': apiKey,
    },
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

function normalizeLodgifyProperties(raw) {
  const list = pickArray(raw)
  return list.map((item, idx) => ({
    id: pickString(item?.id || item?.property_id || item?._id) || `lodgify-property-${idx + 1}`,
    name: pickString(item?.name || item?.title) || `Property ${idx + 1}`,
    address: pickAddress(item),
  }))
}

function normalizeLodgifyBookings(raw) {
  const list = pickArray(raw)
  return list
    .map((item) => {
      const id = pickString(item?.id || item?._id || item?.booking_id)
      const propertyId = pickString(item?.propertyId || item?.property_id || item?.houseId)
      const checkIn = pickString(item?.arrival || item?.checkIn || item?.startDate)
      const checkOut = pickString(item?.departure || item?.checkOut || item?.endDate)
      const guestName =
        pickString(item?.guestName) ||
        pickString(item?.guest?.name) ||
        pickString(item?.firstName && item?.lastName ? `${item.firstName} ${item.lastName}` : '') ||
        'Guest'
      const status = pickString(item?.status).toLowerCase() || 'reserved'
      const channel = inferReservationChannel(item)
      if (!id || !propertyId || !checkIn || !checkOut) return null
      const financial = buildFinancialBundle(item)
      return {
        id,
        propertyId,
        checkIn,
        checkOut,
        guestName,
        channel,
        status,
        ...financial,
        financeAvancee: {
          scopeStatus: completenessFromBundle(financial),
          providerRawFields: {
            hasQuote: Boolean(item?.quote),
            hasInvoice: Boolean(item?.invoice),
          },
        },
      }
    })
    .filter(Boolean)
}

async function syncLodgify({ apiToken, accountId }) {
  const apiKey = pickString(apiToken)
  if (!apiKey) return { status: 400, ok: false, error: 'missing_lodgify_credentials' }
  const propertiesRes = await lodgifyGet('/properties', apiKey)
  if (!propertiesRes.ok) return { status: propertiesRes.status, ok: false, error: 'lodgify_properties_failed' }
  const bookingsRes = await lodgifyGet('/reservations/bookings?size=100&includeExternal=true', apiKey)
  if (!bookingsRes.ok) return { status: bookingsRes.status, ok: false, error: 'lodgify_bookings_failed' }

  const providedAccountId = pickString(accountId)
  if (providedAccountId) {
    const possibleIds = collectPossibleIds(propertiesRes.json)
    collectPossibleIds(bookingsRes.json, possibleIds)
    const meRes = await lodgifyGet('/users/me', apiKey)
    if (meRes.ok) collectPossibleIds(meRes.json, possibleIds)
    if (possibleIds.size > 0 && !possibleIds.has(providedAccountId)) {
      return {
        status: 409,
        ok: false,
        error: 'lodgify_account_mismatch',
        message:
          'La cle API Lodgify et le numero de compte saisi ne correspondent pas. Verifiez les informations dans Parametres > API publique.',
      }
    }
  }

  return {
    status: 200,
    ok: true,
    provider: 'lodgify',
    data: {
      properties: normalizeLodgifyProperties(propertiesRes.json),
      bookings: normalizeLodgifyBookings(bookingsRes.json),
      syncedAt: new Date().toISOString(),
    },
  }
}

export async function syncOfficialChannelData(body) {
  const provider = normalizeProvider(body?.provider)
  const apiToken = pickString(body?.apiToken)
  const accountId = pickString(body?.accountId)
  const ical = pickString(body?.ical)
  if (!provider) return { status: 400, ok: false, error: 'invalid_provider' }
  const needsAccountId = provider === 'hostaway' || provider === 'guesty'
  if (!apiToken || (needsAccountId && !accountId)) {
    return { status: 400, ok: false, error: 'missing_required_fields' }
  }

  let result = null
  if (provider === 'beds24') result = await syncBeds24({ apiToken, accountId, ical })
  if (provider === 'hostaway') result = await syncHostaway({ apiToken, accountId, ical })
  if (provider === 'guesty') result = await syncGuesty({ apiToken, accountId, ical })
  if (provider === 'lodgify') result = await syncLodgify({ apiToken, accountId, ical })
  if (result?.ok) {
    const bookings = Array.isArray(result?.data?.bookings) ? result.data.bookings : []
    const missingFinanceCount = bookings.filter(
      (b) => b?.financeAvancee?.scopeStatus?.status === 'partial_missing_financial_scopes',
    ).length
    if (missingFinanceCount > 0) {
      return {
        ...result,
        data: {
          ...result.data,
          scopeWarning: {
            code: 'financial_scopes_partial',
            missingFinanceCount,
            message:
              'Connexion reussie, mais des scopes financiers manquent sur certaines reservations. Activez les droits finance complets pour remonter 100% des donnees.',
          },
        },
      }
    }
    return result
  }
  if (result) return result

  return {
    status: 501,
    ok: false,
    error: 'provider_not_implemented',
    message: `${provider} connector pending`,
  }
}
