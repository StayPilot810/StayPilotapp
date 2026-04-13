import { useEffect, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import {
  extractAddressFromIcalText,
  extractCalendarNameFromIcalText,
  fetchIcalBody,
} from '../utils/icalAddress'

type ChannelKey = 'airbnb' | 'booking' | 'channelManager'

const STORAGE_KEY = 'staypilot_connected_channels'
const RESERVATION_ACCESS_KEY = 'staypilot_reservation_access'
const APARTMENT_NAME_KEY = 'staypilot_connected_apartment_names'
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'

function notifyConnectionsUpdated() {
  window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT))
}

export function DashboardConnectPage() {
  const { t } = useLanguage()
  const [accessInputs, setAccessInputs] = useState<
    Record<
      'airbnb' | 'booking' | 'channelManager',
      { ical: string; address: string; apiToken: string; accountId: string; nightlyRate: string; commissionRate: string }
    >
  >(() => {
    const raw = localStorage.getItem(RESERVATION_ACCESS_KEY)
    if (!raw) {
      return {
        airbnb: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        booking: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        channelManager: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
      }
    }
    try {
      const parsed = JSON.parse(raw) as Record<
        'airbnb' | 'booking' | 'channelManager',
        { ical?: string; address?: string; apiToken?: string; accountId?: string; nightlyRate?: string; commissionRate?: string }
      >
      return {
        airbnb: {
          ical: parsed.airbnb?.ical ?? '',
          address: parsed.airbnb?.address ?? '',
          apiToken: parsed.airbnb?.apiToken ?? '',
          accountId: parsed.airbnb?.accountId ?? '',
          nightlyRate: parsed.airbnb?.nightlyRate ?? '',
          commissionRate: parsed.airbnb?.commissionRate ?? '',
        },
        booking: {
          ical: parsed.booking?.ical ?? '',
          address: parsed.booking?.address ?? '',
          apiToken: parsed.booking?.apiToken ?? '',
          accountId: parsed.booking?.accountId ?? '',
          nightlyRate: parsed.booking?.nightlyRate ?? '',
          commissionRate: parsed.booking?.commissionRate ?? '',
        },
        channelManager: {
          ical: parsed.channelManager?.ical ?? '',
          address: parsed.channelManager?.address ?? '',
          apiToken: parsed.channelManager?.apiToken ?? '',
          accountId: parsed.channelManager?.accountId ?? '',
          nightlyRate: parsed.channelManager?.nightlyRate ?? '',
          commissionRate: parsed.channelManager?.commissionRate ?? '',
        },
      }
    } catch {
      return {
        airbnb: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        booking: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        channelManager: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
      }
    }
  })

  const [connectedChannels, setConnectedChannels] = useState<Record<ChannelKey, boolean>>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { airbnb: false, booking: false, channelManager: false }

    try {
      const parsed = JSON.parse(raw) as Partial<Record<ChannelKey, boolean>>
      return {
        airbnb: Boolean(parsed.airbnb),
        booking: Boolean(parsed.booking),
        channelManager: Boolean(parsed.channelManager),
      }
    } catch {
      return { airbnb: false, booking: false, channelManager: false }
    }
  })
  const [connectionFeedback, setConnectionFeedback] = useState<Record<ChannelKey, 'idle' | 'success' | 'error'>>({
    airbnb: 'idle',
    booking: 'idle',
    channelManager: 'idle',
  })
  const hasValidConnection = (platform: ChannelKey) => {
    const data = accessInputs[platform]
    return data.ical.trim().length > 0
  }

  useEffect(() => {
    const next = {
      airbnb: hasValidConnection('airbnb'),
      booking: hasValidConnection('booking'),
      channelManager: hasValidConnection('channelManager'),
    }
    setConnectedChannels(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    notifyConnectionsUpdated()
  }, [accessInputs])

  const detectedListings = getConnectedApartmentsFromStorage()
  const airbnbListings = detectedListings
    .filter((item) => item.platform === 'airbnb')
    .map((item, index) => ({ id: `AB-${index + 1}`, name: item.name, address: item.address }))
  const bookingListings = detectedListings
    .filter((item) => item.platform === 'booking')
    .map((item, index) => ({ id: `BK-${index + 1}`, name: item.name, address: item.address }))

  const onSaveConnections = () => {
    const next = {
      airbnb: accessInputs.airbnb.ical.trim().length > 0,
      booking: accessInputs.booking.ical.trim().length > 0,
      channelManager: accessInputs.channelManager.ical.trim().length > 0,
    }
    setConnectedChannels(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    localStorage.setItem(RESERVATION_ACCESS_KEY, JSON.stringify(accessInputs))
    notifyConnectionsUpdated()
  }

  const onConnectOne = async (platform: ChannelKey) => {
    const isValid = hasValidConnection(platform)

    const nextConnected = {
      ...connectedChannels,
      [platform]: isValid,
    }
    setConnectedChannels(nextConnected)
    setConnectionFeedback((prev) => ({
      ...prev,
      [platform]: isValid ? 'success' : 'error',
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConnected))
    localStorage.setItem(RESERVATION_ACCESS_KEY, JSON.stringify(accessInputs))

    if (isValid) {
      const body = await fetchIcalBody(accessInputs[platform].ical)
      if (body) {
        const name = extractCalendarNameFromIcalText(body)
        if (name) {
          const raw = localStorage.getItem(APARTMENT_NAME_KEY)
          const prev = raw ? (JSON.parse(raw) as Partial<Record<ChannelKey, string>>) : {}
          localStorage.setItem(APARTMENT_NAME_KEY, JSON.stringify({ ...prev, [platform]: name }))
        }
        const addr = extractAddressFromIcalText(body)
        const prevAddr = accessInputs[platform].address.trim()
        const shouldFillAddr = !prevAddr || prevAddr === 'Adresse'
        if (addr && shouldFillAddr) {
          setAccessInputs((prev) => {
            const next = {
              ...prev,
              [platform]: { ...prev[platform], address: addr },
            }
            localStorage.setItem(RESERVATION_ACCESS_KEY, JSON.stringify(next))
            return next
          })
        }
      }
    }
    notifyConnectionsUpdated()
  }

  const onDisconnectOne = (platform: ChannelKey) => {
    const nextConnected = {
      ...connectedChannels,
      [platform]: false,
    }
    setConnectedChannels(nextConnected)
    setConnectionFeedback((prev) => ({ ...prev, [platform]: 'idle' }))
    setAccessInputs((prev) => ({
      ...prev,
      [platform]: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConnected))

    const rawAccess = localStorage.getItem(RESERVATION_ACCESS_KEY)
    const prevAccess = rawAccess
      ? (JSON.parse(rawAccess) as Partial<Record<ChannelKey, { ical?: string; address?: string; apiToken?: string; accountId?: string; nightlyRate?: string; commissionRate?: string }>>)
      : {}
    localStorage.setItem(
      RESERVATION_ACCESS_KEY,
      JSON.stringify({
        ...prevAccess,
        [platform]: { ical: '', address: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
      }),
    )

    const rawNames = localStorage.getItem(APARTMENT_NAME_KEY)
    const prevNames = rawNames ? (JSON.parse(rawNames) as Partial<Record<ChannelKey, string>>) : {}
    delete prevNames[platform]
    localStorage.setItem(APARTMENT_NAME_KEY, JSON.stringify(prevNames))
    notifyConnectionsUpdated()
  }

  return (
    <section className="min-h-screen flex-1 bg-white px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardConnectTitle}</h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">{t.dashboardConnectSubtitle}</p>
        <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{t.dashboardReservationAccessSubtitle}</p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <h2 className="text-lg font-bold text-zinc-900">{t.dashboardReservationAccessTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {(['airbnb', 'booking'] as const).map((platform) => (
              <article key={platform} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5">
                <p className="text-sm font-semibold text-zinc-900">
                  {platform === 'airbnb' ? t.dashboardConnectAirbnb : t.dashboardConnectBooking}
                </p>
                <label className="mt-3 block text-xs font-semibold text-zinc-600">{t.dashboardIcalLabel}</label>
                <input
                  type="text"
                  value={accessInputs[platform].ical}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], ical: e.target.value },
                    }))
                  }
                  placeholder={t.dashboardPlaceholderIcal}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <label className="mt-2 block text-xs font-semibold text-zinc-600">{t.dashboardApiLabel}</label>
                <label className="mt-2 block text-xs font-semibold text-zinc-600">Adresse du logement</label>
                <input
                  type="text"
                  value={accessInputs[platform].address}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], address: e.target.value },
                    }))
                  }
                  placeholder="Ex: 24 rue de la Paix, 75002 Paris"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <label className="mt-2 block text-xs font-semibold text-zinc-600">{t.dashboardApiLabel}</label>
                <input
                  type="text"
                  value={accessInputs[platform].apiToken}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], apiToken: e.target.value },
                    }))
                  }
                  placeholder={t.dashboardPlaceholderApi}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <label className="mt-2 block text-xs font-semibold text-zinc-600">{t.dashboardAccountIdLabel}</label>
                <input
                  type="text"
                  value={accessInputs[platform].accountId}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], accountId: e.target.value },
                    }))
                  }
                  placeholder={t.dashboardPlaceholderAccountId}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <label className="mt-2 block text-xs font-semibold text-zinc-600">Prix moyen par nuit (EUR)</label>
                <input
                  type="number"
                  min="0"
                  value={accessInputs[platform].nightlyRate}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], nightlyRate: e.target.value },
                    }))
                  }
                  placeholder="120"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <label className="mt-2 block text-xs font-semibold text-zinc-600">Commission plateforme (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={accessInputs[platform].commissionRate}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], commissionRate: e.target.value },
                    }))
                  }
                  placeholder="15"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <button
                  type="button"
                  onClick={() => onConnectOne(platform)}
                  className="mt-3 inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  {t.dashboardConnectAction}
                </button>
                {connectedChannels[platform] ? (
                  <button
                    type="button"
                    onClick={() => onDisconnectOne(platform)}
                    className="ml-2 mt-3 inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    Supprimer le logement connecte
                  </button>
                ) : null}
                {connectionFeedback[platform] === 'success' ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">{t.dashboardConnectConnected}</p>
                ) : connectionFeedback[platform] === 'error' ? (
                  <p className="mt-2 text-xs font-semibold text-rose-600">{t.dashboardConnectFailed}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 sm:text-sm">
            <p className="font-semibold">Pour afficher les prix et revenus détaillés :</p>
            <p className="mt-1">- Airbnb : renseigne le lien iCal + token API/app password (compte hôte).</p>
            <p>- Booking : renseigne le lien iCal + API key + Hotel ID / Account ID.</p>
            <p className="mt-1">Le iCal seul suffit pour l'occupation, pas pour les montants.</p>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900">{t.dashboardConnectChannelManager}</h2>
            <p className="text-xs font-medium text-zinc-400">{t.dashboardChannelOptionalNote}</p>
            <span
              className={`ml-auto inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                connectedChannels.channelManager
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {connectedChannels.channelManager ? t.dashboardConnectConnected : t.dashboardConnectPending}
            </span>
          </div>
          {!connectedChannels.channelManager ? (
            <details className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
                {t.dashboardChannelHelpTitle}
              </summary>
              <p className="mt-2 text-sm text-zinc-600">{t.dashboardChannelHelpBody}</p>
              <p className="mt-2 text-sm text-zinc-600">{t.dashboardChannelPlanLimit}</p>
            </details>
          ) : null}
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-600">{t.dashboardIcalLabel}</label>
              <input
                type="text"
                value={accessInputs.channelManager.ical}
                onChange={(e) =>
                  setAccessInputs((prev) => ({
                    ...prev,
                    channelManager: { ...prev.channelManager, ical: e.target.value },
                  }))
                }
                placeholder={t.dashboardPlaceholderIcal}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Adresse du logement</label>
              <input
                type="text"
                value={accessInputs.channelManager.address}
                onChange={(e) =>
                  setAccessInputs((prev) => ({
                    ...prev,
                    channelManager: { ...prev.channelManager, address: e.target.value },
                  }))
                }
                placeholder="Ex: 15 avenue des Fleurs, 06000 Nice"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => onConnectOne('channelManager')}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                {t.dashboardConnectAction}
              </button>
              {connectedChannels.channelManager ? (
                <button
                  type="button"
                  onClick={() => onDisconnectOne('channelManager')}
                  className="ml-2 inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  Supprimer le logement connecte
                </button>
              ) : null}
              {connectionFeedback.channelManager === 'success' ? (
                <p className="mt-2 text-xs font-semibold text-emerald-600">{t.dashboardConnectConnected}</p>
              ) : connectionFeedback.channelManager === 'error' ? (
                <p className="mt-2 text-xs font-semibold text-rose-600">{t.dashboardConnectFailed}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <h3 className="text-lg font-bold text-zinc-900">{t.dashboardSummaryTitle}</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
            <div className="grid grid-cols-2 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              <p>{t.dashboardSummaryPlatform}</p>
              <p>{t.dashboardSummaryConnectedCount}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-zinc-100 px-3 py-2 text-sm">
              <p className="flex items-center gap-2 font-semibold text-zinc-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#ff5a5f] text-[10px] font-bold text-white">A</span>
                {t.dashboardConnectAirbnb}
              </p>
              <p className="font-semibold text-zinc-700">{airbnbListings.length}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-zinc-100 px-3 py-2 text-sm">
              <p className="flex items-center gap-2 font-semibold text-zinc-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#003580] text-[10px] font-bold text-white">B</span>
                {t.dashboardConnectBooking}
              </p>
              <p className="font-semibold text-zinc-700">{bookingListings.length}</p>
            </div>
          </div>

          <details className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
              {t.dashboardSummaryShowListings}
            </summary>
            <div className="mt-2 space-y-2 text-sm text-zinc-700">
              <p className="flex items-center gap-2 font-semibold">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#ff5a5f] text-[10px] font-bold text-white">A</span>
                {t.dashboardConnectAirbnb}
              </p>
              {airbnbListings.length > 0 ? (
                <ul className="list-inside list-disc">
                  {airbnbListings.map((listing) => (
                    <li key={listing.id}>
                      {listing.name} - {listing.address} - ID: {listing.id}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500">{t.dashboardSummaryNoListings}</p>
              )}

              <p className="flex items-center gap-2 pt-1 font-semibold">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#003580] text-[10px] font-bold text-white">B</span>
                {t.dashboardConnectBooking}
              </p>
              {bookingListings.length > 0 ? (
                <ul className="list-inside list-disc">
                  {bookingListings.map((listing) => (
                    <li key={listing.id}>
                      {listing.name} - {listing.address} - ID: {listing.id}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500">{t.dashboardSummaryNoListings}</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}

