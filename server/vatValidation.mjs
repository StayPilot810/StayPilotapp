function sanitizeCountryCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2)
}

function sanitizeVatNumber(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function normalizeCountryCode(value) {
  const cc = sanitizeCountryCode(value)
  if (cc === 'UK') return 'GB'
  if (cc === 'GR') return 'EL'
  return cc
}

function normalizeUkVatNumber(value) {
  const vat = sanitizeVatNumber(value)
  if (vat.startsWith('GB')) return vat.slice(2)
  if (vat.startsWith('UK')) return vat.slice(2)
  return vat
}

function buildHmrcConfig(env = process.env) {
  const clientId = String(env?.HMRC_CLIENT_ID || '').trim()
  const clientSecret = String(env?.HMRC_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) return null
  return {
    clientId,
    clientSecret,
    tokenUrl: String(env?.HMRC_TOKEN_URL || '').trim() || 'https://api.service.hmrc.gov.uk/oauth/token',
    apiBaseUrl: String(env?.HMRC_API_BASE_URL || '').trim() || 'https://api.service.hmrc.gov.uk',
  }
}

async function getHmrcAccessToken(config) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'read:vat',
  }).toString()

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  const token = String(data?.access_token || '').trim()
  return token || null
}

async function verifyUkVatNumberOfficial(vatNumber, env = process.env) {
  const hmrc = buildHmrcConfig(env)
  if (!hmrc) {
    return { ok: false, status: 503, error: 'hmrc_not_configured' }
  }

  const targetVrn = normalizeUkVatNumber(vatNumber)
  if (!targetVrn) {
    return { ok: false, status: 400, error: 'invalid_uk_vat' }
  }

  try {
    const token = await getHmrcAccessToken(hmrc)
    if (!token) {
      return { ok: false, status: 502, error: 'hmrc_auth_failed' }
    }

    const url = `${hmrc.apiBaseUrl.replace(/\/+$/, '')}/organisations/vat/check-vat-number/lookup/${encodeURIComponent(targetVrn)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.hmrc.2.0+json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 404) {
      return {
        ok: true,
        status: 200,
        verified: false,
        companyName: '',
        companyAddress: '',
        countryCode: 'GB',
        vatNumber: targetVrn,
        verificationSource: 'uk_hmrc',
      }
    }
    if (!res.ok) {
      return { ok: false, status: 502, error: 'hmrc_unavailable' }
    }

    const data = await res.json().catch(() => ({}))
    const companyName = String(data?.name || '').trim()
    const addr = data?.address || {}
    const companyAddress = [addr.line1, addr.line2, addr.postcode, addr.countryCode]
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(' ')

    return {
      ok: true,
      status: 200,
      verified: true,
      companyName,
      companyAddress,
      countryCode: 'GB',
      vatNumber: targetVrn,
      verificationSource: 'uk_hmrc',
    }
  } catch {
    return { ok: false, status: 502, error: 'hmrc_network_error' }
  }
}

function extractTag(xml, tagName) {
  const escaped = String(tagName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`<(?:[A-Za-z0-9_]+:)?${escaped}>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${escaped}>`, 'i')
  const match = xml.match(re)
  return match ? String(match[1] || '').trim() : ''
}

export async function verifyVatNumberOfficial(payload) {
  let countryCode = normalizeCountryCode(payload?.countryCode)
  let vatNumber = sanitizeVatNumber(payload?.vatNumber)

  // Accept common user formats:
  // - country selected + VAT entered with same country prefix (FR + FR123...)
  // - country missing, but VAT entered with country prefix (FR123...)
  // - country selected incorrectly, VAT contains another valid prefix
  const vatPrefix = vatNumber.slice(0, 2)
  const hasVatPrefix = /^[A-Z]{2}$/.test(vatPrefix)
  if (hasVatPrefix) {
    if (!countryCode) {
      countryCode = vatPrefix
      vatNumber = vatNumber.slice(2)
    } else if (vatPrefix === countryCode) {
      vatNumber = vatNumber.slice(2)
    } else if (vatNumber.length > 4) {
      countryCode = vatPrefix
      vatNumber = vatNumber.slice(2)
    }
  }

  if (!countryCode || !vatNumber) {
    return { ok: false, status: 400, error: 'invalid_payload' }
  }

  // UK VAT is no longer covered by VIES after Brexit.
  // Use official HMRC API (OAuth) for a production-grade verification.
  if (countryCode === 'GB') {
    return verifyUkVatNumberOfficial(vatNumber)
  }

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Body>
    <tns:checkVat>
      <tns:countryCode>${countryCode}</tns:countryCode>
      <tns:vatNumber>${vatNumber}</tns:vatNumber>
    </tns:checkVat>
  </soap:Body>
</soap:Envelope>`

  try {
    const res = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: '',
      },
      body: envelope,
    })
    const xml = await res.text()
    if (!res.ok) {
      return { ok: false, status: 502, error: 'vies_unavailable' }
    }
    const validRaw = extractTag(xml, 'valid').toLowerCase()
    const name = extractTag(xml, 'name').trim()
    const address = extractTag(xml, 'address').trim().replace(/\s+/g, ' ')
    const valid = validRaw === 'true'
    return {
      ok: true,
      status: 200,
      verified: valid,
      companyName: name,
      companyAddress: address,
      countryCode,
      vatNumber,
    }
  } catch {
    return { ok: false, status: 502, error: 'vies_network_error' }
  }
}
