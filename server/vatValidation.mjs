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

function extractTag(xml, tagName) {
  const re = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, 'i')
  const match = xml.match(re)
  return match ? match[1] : ''
}

export async function verifyVatNumberOfficial(payload) {
  const countryCode = sanitizeCountryCode(payload?.countryCode)
  const vatNumber = sanitizeVatNumber(payload?.vatNumber)
  if (!countryCode || !vatNumber) {
    return { ok: false, status: 400, error: 'invalid_payload' }
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
