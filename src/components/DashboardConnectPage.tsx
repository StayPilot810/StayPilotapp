import { useEffect, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

type ChannelKey = 'airbnb' | 'booking' | 'channelManager'

const STORAGE_KEY = 'sm_connected_channels'
const RESERVATION_ACCESS_KEY = 'sm_reservation_access'

export function DashboardConnectPage() {
  const { t } = useLanguage()
  const [accessInputs, setAccessInputs] = useState<
    Record<'airbnb' | 'booking' | 'channelManager', { ical: string; api: string; accountId: string }>
  >(() => {
    const raw = localStorage.getItem(RESERVATION_ACCESS_KEY)
    if (!raw) {
      return {
        airbnb: { ical: '', api: '', accountId: '' },
        booking: { ical: '', api: '', accountId: '' },
        channelManager: { ical: '', api: '', accountId: '' },
      }
    }
    try {
      const parsed = JSON.parse(raw) as Record<'airbnb' | 'booking' | 'channelManager', { ical: string; api: string; accountId: string }>
      return {
        airbnb: parsed.airbnb ?? { ical: '', api: '', accountId: '' },
        booking: parsed.booking ?? { ical: '', api: '', accountId: '' },
        channelManager: parsed.channelManager ?? { ical: '', api: '', accountId: '' },
      }
    } catch {
      return {
        airbnb: { ical: '', api: '', accountId: '' },
        booking: { ical: '', api: '', accountId: '' },
        channelManager: { ical: '', api: '', accountId: '' },
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
    return data.ical.trim().length > 0 && data.api.trim().length > 0 && data.accountId.trim().length > 0
  }

  useEffect(() => {
    const next = {
      airbnb: hasValidConnection('airbnb'),
      booking: hasValidConnection('booking'),
      channelManager: hasValidConnection('channelManager'),
    }
    setConnectedChannels(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [accessInputs])

  const airbnbListings = connectedChannels.airbnb
    ? [
        { id: 'AB-1001', name: 'Rivoli 10 - Studio 1', address: '10 Rue de Rivoli, 75001 Paris' },
        { id: 'AB-1003', name: 'Rivoli 10 - Studio 3', address: '10 Rue de Rivoli, 75001 Paris' },
      ]
    : []
  const bookingListings = connectedChannels.booking
    ? [{ id: 'BK-2002', name: 'Rivoli 10 - Studio 2', address: '10 Rue de Rivoli, 75001 Paris' }]
    : []

  const onSaveConnections = () => {
    const next = {
      airbnb:
        accessInputs.airbnb.ical.trim().length > 0 ||
        accessInputs.airbnb.api.trim().length > 0 ||
        accessInputs.airbnb.accountId.trim().length > 0,
      booking:
        accessInputs.booking.ical.trim().length > 0 ||
        accessInputs.booking.api.trim().length > 0 ||
        accessInputs.booking.accountId.trim().length > 0,
      channelManager:
        accessInputs.channelManager.ical.trim().length > 0 ||
        accessInputs.channelManager.api.trim().length > 0 ||
        accessInputs.channelManager.accountId.trim().length > 0,
    }
    setConnectedChannels(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    localStorage.setItem(RESERVATION_ACCESS_KEY, JSON.stringify(accessInputs))
  }

  const onConnectOne = (platform: ChannelKey) => {
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
                <label className="mt-3 block text-xs font-semibold text-zinc-600">{t.dashboardApiLabel}</label>
                <input
                  type="text"
                  value={accessInputs[platform].api}
                  onChange={(e) =>
                    setAccessInputs((prev) => ({
                      ...prev,
                      [platform]: { ...prev[platform], api: e.target.value },
                    }))
                  }
                  placeholder={t.dashboardPlaceholderApi}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <label className="mt-3 block text-xs font-semibold text-zinc-600">{t.dashboardAccountIdLabel}</label>
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
                <button
                  type="button"
                  onClick={() => onConnectOne(platform)}
                  className="mt-3 inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  {t.dashboardConnectAction}
                </button>
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
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
              <label className="block text-xs font-semibold text-zinc-600">{t.dashboardApiLabel}</label>
              <input
                type="text"
                value={accessInputs.channelManager.api}
                onChange={(e) =>
                  setAccessInputs((prev) => ({
                    ...prev,
                    channelManager: { ...prev.channelManager, api: e.target.value },
                  }))
                }
                placeholder={t.dashboardPlaceholderApi}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600">{t.dashboardAccountIdLabel}</label>
              <input
                type="text"
                value={accessInputs.channelManager.accountId}
                onChange={(e) =>
                  setAccessInputs((prev) => ({
                    ...prev,
                    channelManager: { ...prev.channelManager, accountId: e.target.value },
                  }))
                }
                placeholder={t.dashboardPlaceholderAccountId}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => onConnectOne('channelManager')}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                {t.dashboardConnectAction}
              </button>
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

