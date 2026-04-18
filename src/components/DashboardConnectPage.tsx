import { useEffect, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { OFFICIAL_CHANNEL_SYNC_KEY, readOfficialChannelSyncData } from '../utils/officialChannelData'
import { readScopedStorage, scopedStorageKey, writeScopedStorage } from '../utils/sessionStorageScope'
import { getCurrentPlanTier, getListingLimitForPlan } from '../utils/subscriptionAccess'
import {
  extractCalendarNameFromIcalText,
  fetchIcalBody,
} from '../utils/icalAddress'

type ChannelKey = 'airbnb' | 'booking' | 'channelManager'

const STORAGE_KEY = 'staypilot_connected_channels'
const RESERVATION_ACCESS_KEY = 'staypilot_reservation_access'
const APARTMENT_NAME_KEY = 'staypilot_connected_apartment_names'
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'
const BEDS24_TUTORIAL_VO_STORAGE = 'staypilot_beds24_tutorial_vo_lang'
const LODGIFY_TUTORIAL_VO_STORAGE = 'staypilot_lodgify_tutorial_vo_lang'
const CHANNEL_MANAGER_PROVIDER_KEY = 'staypilot_channel_manager_provider'

const BEDS24_TUTORIAL_VO_OPTIONS = [
  { lang: 'fr', label: 'Français', src: '/beds24-staypilot-connection-tutorial.mp4' },
  { lang: 'en', label: 'English', src: '/beds24-staypilot-connection-tutorial.en.mp4' },
  { lang: 'es', label: 'Español', src: '/beds24-staypilot-connection-tutorial.es.mp4' },
  { lang: 'de', label: 'Deutsch', src: '/beds24-staypilot-connection-tutorial.de.mp4' },
  { lang: 'it', label: 'Italiano', src: '/beds24-staypilot-connection-tutorial.it.mp4' },
] as const

const LODGIFY_TUTORIAL_VO_OPTIONS = [
  { lang: 'fr', label: 'Français', src: '/lodgify-staypilot-connection-tutorial.mp4' },
  { lang: 'en', label: 'English', src: '/lodgify-staypilot-connection-tutorial.en.mp4' },
  { lang: 'es', label: 'Español', src: '/lodgify-staypilot-connection-tutorial.es.mp4' },
  { lang: 'de', label: 'Deutsch', src: '/lodgify-staypilot-connection-tutorial.de.mp4' },
  { lang: 'it', label: 'Italiano', src: '/lodgify-staypilot-connection-tutorial.it.mp4' },
] as const

const CHANNEL_PROVIDER_LABELS: Record<string, string> = {
  beds24: 'Beds24',
  hostaway: 'Hostaway',
  guesty: 'Guesty',
  lodgify: 'Lodgify',
}

function notifyConnectionsUpdated() {
  window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT))
}

type ChannelAccessInput = {
  ical: string
  apiToken: string
  accountId: string
  nightlyRate: string
  commissionRate: string
}

function sanitizeAccessInputsForStorage(
  inputs: Record<'airbnb' | 'booking' | 'channelManager', ChannelAccessInput>,
) {
  return {
    airbnb: { ...inputs.airbnb, apiToken: '', accountId: '' },
    booking: { ...inputs.booking, apiToken: '', accountId: '' },
    // Never persist API credentials in local storage.
    channelManager: { ...inputs.channelManager, apiToken: '', accountId: '' },
  }
}

function renderOtaLinkCell(state: boolean | undefined) {
  if (state === true) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        Oui
      </span>
    )
  }
  if (state === false) {
    return <span className="text-xs text-zinc-500">Non</span>
  }
  return (
    <span
      className="text-xs text-zinc-400"
      title="Détail non renvoyé par l'API du channel manager. Reconnectez pour actualiser."
    >
      —
    </span>
  )
}

export function DashboardConnectPage() {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const c = {
    fr: {
      tutorialTitle: 'Vidéo tutorielle channel manager (voix, plusieurs langues)',
      tutorialBody: 'Choisissez votre channel manager et la langue de la vidéo, puis ouvrez la lecture.',
      hideVideo: 'Masquer la vidéo',
      showVideo: 'Voir la vidéo',
      videoHint: 'Beds24 et Lodgify : vidéo guide avec voix disponible. Hostaway, Guesty : vidéo à venir.',
      videoFallback: 'Votre navigateur ne lit pas la vidéo MP4.',
      videoOnlyFor:
        "La vidéo pas à pas avec voix est disponible pour Beds24 et Lodgify. Sélectionnez l'un de ces channel managers pour afficher la vidéo.",
      removeConnection: 'Supprimer la connexion au channel manager',
      listing: 'Logement',
      cancel: 'Annuler',
      deleteConnection: 'Supprimer la connexion',
    },
    en: {
      tutorialTitle: 'Channel manager tutorial video (voice, multiple languages)',
      tutorialBody: 'Choose your channel manager and video language, then play.',
      hideVideo: 'Hide video',
      showVideo: 'Show video',
      videoHint: 'Beds24 and Lodgify: guided voice video available. Hostaway, Guesty: coming soon.',
      videoFallback: 'Your browser does not support MP4 video playback.',
      videoOnlyFor:
        'The step-by-step voice video is available for Beds24 and Lodgify. Select one of these managers to display it.',
      removeConnection: 'Remove channel manager connection',
      listing: 'Listing',
      cancel: 'Cancel',
      deleteConnection: 'Delete connection',
    },
    es: {
      tutorialTitle: 'Video tutorial de channel manager (voz, varios idiomas)',
      tutorialBody: 'Elige tu channel manager y el idioma del video, luego abre la reproducción.',
      hideVideo: 'Ocultar video',
      showVideo: 'Ver video',
      videoHint: 'Beds24 y Lodgify: video guiado con voz disponible. Hostaway, Guesty: próximamente.',
      videoFallback: 'Tu navegador no admite reproducción de video MP4.',
      videoOnlyFor:
        'El video paso a paso con voz está disponible para Beds24 y Lodgify. Selecciona uno para mostrarlo.',
      removeConnection: 'Eliminar conexión con channel manager',
      listing: 'Alojamiento',
      cancel: 'Cancelar',
      deleteConnection: 'Eliminar conexión',
    },
    de: {
      tutorialTitle: 'Channel-Manager-Tutorialvideo (Voice-over, mehrere Sprachen)',
      tutorialBody: 'Wählen Sie Ihren Channel Manager und die Sprache, dann starten Sie das Video.',
      hideVideo: 'Video ausblenden',
      showVideo: 'Video anzeigen',
      videoHint: 'Beds24 und Lodgify: Sprachvideo verfügbar. Hostaway, Guesty: folgt.',
      videoFallback: 'Ihr Browser unterstützt keine MP4-Videowiedergabe.',
      videoOnlyFor:
        'Das Schritt-für-Schritt-Video mit Stimme ist für Beds24 und Lodgify verfügbar. Wählen Sie einen davon aus.',
      removeConnection: 'Channel-Manager-Verbindung entfernen',
      listing: 'Unterkunft',
      cancel: 'Abbrechen',
      deleteConnection: 'Verbindung löschen',
    },
    it: {
      tutorialTitle: 'Video tutorial channel manager (voce, più lingue)',
      tutorialBody: 'Scegli il tuo channel manager e la lingua del video, poi avvia la riproduzione.',
      hideVideo: 'Nascondi video',
      showVideo: 'Mostra video',
      videoHint: 'Beds24 e Lodgify: video guida con voce disponibile. Hostaway, Guesty: in arrivo.',
      videoFallback: 'Il tuo browser non supporta la riproduzione MP4.',
      videoOnlyFor:
        'Il video passo-passo con voce è disponibile per Beds24 e Lodgify. Seleziona uno di questi manager.',
      removeConnection: 'Rimuovi connessione channel manager',
      listing: 'Alloggio',
      cancel: 'Annulla',
      deleteConnection: 'Elimina connessione',
    },
  }[ll]
  const [selectedProvider, setSelectedProvider] = useState(() => {
    try {
      const saved = (readScopedStorage(CHANNEL_MANAGER_PROVIDER_KEY) || '').trim().toLowerCase()
      if (saved === 'beds24' || saved === 'hostaway' || saved === 'guesty' || saved === 'lodgify') return saved
    } catch {
      /* ignore */
    }
    return 'beds24'
  })
  const [disconnectChannelManagerOpen, setDisconnectChannelManagerOpen] = useState(false)
  const [showTutorialVideo, setShowTutorialVideo] = useState(false)
  const [beds24TutorialVo, setBeds24TutorialVo] = useState<(typeof BEDS24_TUTORIAL_VO_OPTIONS)[number]['lang']>(() => {
    try {
      const s = sessionStorage.getItem(BEDS24_TUTORIAL_VO_STORAGE)
      if (s === 'en' || s === 'es' || s === 'de' || s === 'fr' || s === 'it') return s
    } catch {
      /* ignore */
    }
    return 'fr'
  })
  const [lodgifyTutorialVo, setLodgifyTutorialVo] = useState<(typeof LODGIFY_TUTORIAL_VO_OPTIONS)[number]['lang']>(() => {
    try {
      const s = sessionStorage.getItem(LODGIFY_TUTORIAL_VO_STORAGE)
      if (s === 'en' || s === 'es' || s === 'de' || s === 'fr' || s === 'it') return s
    } catch {
      /* ignore */
    }
    return 'fr'
  })
  const [accessInputs, setAccessInputs] = useState<
    Record<
      'airbnb' | 'booking' | 'channelManager',
      { ical: string; apiToken: string; accountId: string; nightlyRate: string; commissionRate: string }
    >
  >(() => {
    const raw = readScopedStorage(RESERVATION_ACCESS_KEY)
    if (!raw) {
      return {
        airbnb: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        booking: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        channelManager: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
      }
    }
    try {
      const parsed = JSON.parse(raw) as Record<
        'airbnb' | 'booking' | 'channelManager',
        { ical?: string; apiToken?: string; accountId?: string; nightlyRate?: string; commissionRate?: string }
      >
      return {
        airbnb: {
          ical: parsed.airbnb?.ical ?? '',
          apiToken: '',
          accountId: '',
          nightlyRate: parsed.airbnb?.nightlyRate ?? '',
          commissionRate: parsed.airbnb?.commissionRate ?? '',
        },
        booking: {
          ical: parsed.booking?.ical ?? '',
          apiToken: '',
          accountId: '',
          nightlyRate: parsed.booking?.nightlyRate ?? '',
          commissionRate: parsed.booking?.commissionRate ?? '',
        },
        channelManager: {
          ical: parsed.channelManager?.ical ?? '',
          apiToken: '',
          accountId: '',
          nightlyRate: parsed.channelManager?.nightlyRate ?? '',
          commissionRate: parsed.channelManager?.commissionRate ?? '',
        },
      }
    } catch {
      return {
        airbnb: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        booking: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        channelManager: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
      }
    }
  })

  const [connectedChannels, setConnectedChannels] = useState<Record<ChannelKey, boolean>>(() => {
    const raw = readScopedStorage(STORAGE_KEY)
    const official = readOfficialChannelSyncData()
    const hasOfficialListings = Array.isArray(official?.properties) && official.properties.length > 0
    if (!raw) return { airbnb: false, booking: false, channelManager: false }

    try {
      const parsed = JSON.parse(raw) as Partial<Record<ChannelKey, boolean>>
      return {
        airbnb: Boolean(parsed.airbnb),
        booking: Boolean(parsed.booking),
        channelManager: Boolean(parsed.channelManager) || hasOfficialListings,
      }
    } catch {
      return { airbnb: false, booking: false, channelManager: hasOfficialListings }
    }
  })
  const [connectionFeedback, setConnectionFeedback] = useState<Record<ChannelKey, 'idle' | 'success' | 'error'>>({
    airbnb: 'idle',
    booking: 'idle',
    channelManager: 'idle',
  })
  const [connectionErrorMessage, setConnectionErrorMessage] = useState('')
  const hasTutorialVideo = selectedProvider === 'beds24' || selectedProvider === 'lodgify'
  const tutorialOptions =
    selectedProvider === 'lodgify' ? LODGIFY_TUTORIAL_VO_OPTIONS : BEDS24_TUTORIAL_VO_OPTIONS
  const selectedTutorialVo = selectedProvider === 'lodgify' ? lodgifyTutorialVo : beds24TutorialVo
  const hasValidConnection = (platform: ChannelKey) => {
    const data = accessInputs[platform]
    const hasToken = data.apiToken.trim().length > 0
    const hasAccountId = data.accountId.trim().length > 0
    if (platform === 'channelManager' && (selectedProvider === 'lodgify' || selectedProvider === 'beds24')) return hasToken
    return hasToken && hasAccountId
  }

  const detectedListings = getConnectedApartmentsFromStorage()
  const channelManagerListings = detectedListings.filter((l) => l.platform === 'channelManager')
  const nonChannelManagerListings = detectedListings.filter((l) => l.platform !== 'channelManager')

  useEffect(() => {
    if (connectedChannels.channelManager || channelManagerListings.length === 0) return
    const nextConnected = { ...connectedChannels, channelManager: true }
    setConnectedChannels(nextConnected)
    writeScopedStorage(STORAGE_KEY, JSON.stringify(nextConnected))
  }, [channelManagerListings.length, connectedChannels])

  useEffect(() => {
    // Prevent stale listings from staying visible when credentials are gone.
    const staleAirbnb =
      connectedChannels.airbnb &&
      !accessInputs.airbnb.apiToken.trim() &&
      !accessInputs.airbnb.accountId.trim()
    const staleBooking =
      connectedChannels.booking &&
      !accessInputs.booking.apiToken.trim() &&
      !accessInputs.booking.accountId.trim()

    if (!staleAirbnb && !staleBooking) return

    const nextConnected = {
      ...connectedChannels,
      airbnb: staleAirbnb ? false : connectedChannels.airbnb,
      booking: staleBooking ? false : connectedChannels.booking,
      channelManager: connectedChannels.channelManager,
    }
    setConnectedChannels(nextConnected)
    writeScopedStorage(STORAGE_KEY, JSON.stringify(nextConnected))

    const rawNames = readScopedStorage(APARTMENT_NAME_KEY)
    const prevNames = rawNames ? (JSON.parse(rawNames) as Partial<Record<ChannelKey, string>>) : {}
    if (staleAirbnb) delete prevNames.airbnb
    if (staleBooking) delete prevNames.booking
    writeScopedStorage(APARTMENT_NAME_KEY, JSON.stringify(prevNames))

    notifyConnectionsUpdated()
  }, [accessInputs, connectedChannels])

  const onSaveConnections = () => {
    // Keep "connected" status tied to successful provider sync only.
    // Saving credentials alone should not mark channels as connected.
    writeScopedStorage(STORAGE_KEY, JSON.stringify(connectedChannels))
    writeScopedStorage(RESERVATION_ACCESS_KEY, JSON.stringify(sanitizeAccessInputsForStorage(accessInputs)))
    notifyConnectionsUpdated()
  }

  const onConnectOne = async (platform: ChannelKey) => {
    const isValid = hasValidConnection(platform)
    if (!isValid) {
      setConnectionErrorMessage(
        selectedProvider === 'lodgify'
          ? 'Champs obligatoires manquants : cle API Lodgify.'
          : selectedProvider === 'beds24'
            ? 'Champs obligatoires manquants : cle API (ou invite code) Beds24.'
            : 'Champs obligatoires manquants : cle API et identifiant compte du channel manager.',
      )
      setConnectionFeedback((prev) => ({ ...prev, [platform]: 'error' }))
      return
    }
    setConnectionFeedback((prev) => ({ ...prev, [platform]: 'idle' }))
    setConnectionErrorMessage('')
    writeScopedStorage(RESERVATION_ACCESS_KEY, JSON.stringify(sanitizeAccessInputsForStorage(accessInputs)))

    if (isValid) {
      try {
        const payload = {
          provider: selectedProvider,
          apiToken: accessInputs[platform].apiToken,
          accountId: accessInputs[platform].accountId,
        }
        const callSync = async (url: string) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const json = (await res.json().catch(() => ({}))) as {
            ok?: boolean
            error?: string
            message?: string
            data?: { properties?: unknown[]; bookings?: unknown[]; syncedAt?: string; connectionToken?: string }
          }
          return { res, json }
        }

        const localCall = await callSync('/api/channel-sync')
        let syncRes = localCall.res
        let syncJson: {
          ok?: boolean
          error?: string
          message?: string
          data?: { properties?: unknown[]; bookings?: unknown[]; syncedAt?: string; connectionToken?: string }
        } = localCall.json

        // Browser always calls local API route only.
        // DNS/network fallback to Vercel is handled server-side in vite middleware.
        if (!syncRes.ok || !syncJson?.ok || !syncJson?.data) {
          const reverted = { ...connectedChannels, [platform]: false }
          setConnectedChannels(reverted)
          writeScopedStorage(STORAGE_KEY, JSON.stringify(reverted))
          const providerDetail = typeof syncJson?.message === 'string' && syncJson.message.trim()
            ? syncJson.message.trim()
            : typeof syncJson?.error === 'string' && syncJson.error.trim()
              ? syncJson.error.trim()
              : ''
          setConnectionErrorMessage(
            providerDetail ||
              (syncJson?.error === 'financial_scopes_required'
                ? 'Scopes financiers manquants sur le provider. Activez les droits finance complets.'
                : 'Connexion API refusee par le provider. Verifiez token/API v2 et droits.'),
          )
          setConnectionFeedback((prev) => ({ ...prev, [platform]: 'error' }))
          return
        }
        const syncedPropertiesRaw = Array.isArray(syncJson.data.properties) ? syncJson.data.properties : []
        const planTier = getCurrentPlanTier()
        const listingLimit = getListingLimitForPlan(planTier)
        const syncedProperties = listingLimit == null ? syncedPropertiesRaw : syncedPropertiesRaw.slice(0, listingLimit)
        if (syncedProperties.length === 0) {
          const reverted = { ...connectedChannels, [platform]: false }
          setConnectedChannels(reverted)
          writeScopedStorage(STORAGE_KEY, JSON.stringify(reverted))
          localStorage.removeItem(scopedStorageKey(OFFICIAL_CHANNEL_SYNC_KEY))
          setConnectionErrorMessage(
            selectedProvider === 'beds24'
              ? 'Connexion etablie mais aucun logement remonte. Verifiez les droits du token (Proprietes + Inventaire + Reservations) et les proprietes autorisees dans Beds24.'
              : 'Connexion etablie mais aucun logement remonte depuis le provider. Verifiez les droits API et les logements partages.',
          )
          setConnectionFeedback((prev) => ({ ...prev, [platform]: 'error' }))
          return
        }
        const allowedPropertyIds = new Set(
          syncedProperties
            .map((p) => {
              if (!p || typeof p !== 'object') return ''
              const rec = p as Record<string, unknown>
              return String(rec.id ?? '').trim()
            })
            .filter(Boolean),
        )
        const bookingsRaw = Array.isArray(syncJson.data.bookings) ? syncJson.data.bookings : []
        const limitedBookings =
          listingLimit == null
            ? bookingsRaw
            : bookingsRaw.filter((b) => {
                if (!b || typeof b !== 'object') return false
                const rec = b as Record<string, unknown>
                const propertyId = String(rec.propertyId ?? '').trim()
                return propertyId ? allowedPropertyIds.has(propertyId) : true
              })

        writeScopedStorage(
          OFFICIAL_CHANNEL_SYNC_KEY,
          JSON.stringify({
            provider: selectedProvider,
            syncedAt: syncJson.data.syncedAt || new Date().toISOString(),
            properties: syncedProperties,
            bookings: limitedBookings,
          }),
        )
        if (selectedProvider === 'beds24' && typeof syncJson.data.connectionToken === 'string' && syncJson.data.connectionToken.trim()) {
          setAccessInputs((prev) => {
            const next = {
              ...prev,
              [platform]: { ...prev[platform], apiToken: syncJson.data!.connectionToken!.trim() },
            }
            writeScopedStorage(RESERVATION_ACCESS_KEY, JSON.stringify(sanitizeAccessInputsForStorage(next)))
            return next
          })
        }
        const nextConnected = { ...connectedChannels, [platform]: true }
        setConnectedChannels(nextConnected)
        writeScopedStorage(STORAGE_KEY, JSON.stringify(nextConnected))
        writeScopedStorage(CHANNEL_MANAGER_PROVIDER_KEY, selectedProvider)
        setConnectionErrorMessage('')
        setConnectionFeedback((prev) => ({ ...prev, [platform]: 'success' }))
      } catch (e) {
        const reverted = { ...connectedChannels, [platform]: false }
        setConnectedChannels(reverted)
        writeScopedStorage(STORAGE_KEY, JSON.stringify(reverted))
        setConnectionErrorMessage(
          e instanceof Error && e.message ? e.message : 'Erreur reseau pendant la verification du provider.',
        )
        setConnectionFeedback((prev) => ({ ...prev, [platform]: 'error' }))
        return
      }

      const body = await fetchIcalBody(accessInputs[platform].ical)
      if (body) {
        const name = extractCalendarNameFromIcalText(body)
        if (name) {
          const raw = readScopedStorage(APARTMENT_NAME_KEY)
          const prev = raw ? (JSON.parse(raw) as Partial<Record<ChannelKey, string>>) : {}
          writeScopedStorage(APARTMENT_NAME_KEY, JSON.stringify({ ...prev, [platform]: name }))
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
      [platform]: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
    }))
    writeScopedStorage(STORAGE_KEY, JSON.stringify(nextConnected))

    const rawAccess = readScopedStorage(RESERVATION_ACCESS_KEY)
    const prevAccess = rawAccess
      ? (JSON.parse(rawAccess) as Partial<Record<ChannelKey, { ical?: string; apiToken?: string; accountId?: string; nightlyRate?: string; commissionRate?: string }>>)
      : {}
    writeScopedStorage(
      RESERVATION_ACCESS_KEY,
      JSON.stringify(
        sanitizeAccessInputsForStorage({
          airbnb: {
            ical: prevAccess.airbnb?.ical ?? '',
            apiToken: prevAccess.airbnb?.apiToken ?? '',
            accountId: prevAccess.airbnb?.accountId ?? '',
            nightlyRate: prevAccess.airbnb?.nightlyRate ?? '',
            commissionRate: prevAccess.airbnb?.commissionRate ?? '',
          },
          booking: {
            ical: prevAccess.booking?.ical ?? '',
            apiToken: prevAccess.booking?.apiToken ?? '',
            accountId: prevAccess.booking?.accountId ?? '',
            nightlyRate: prevAccess.booking?.nightlyRate ?? '',
            commissionRate: prevAccess.booking?.commissionRate ?? '',
          },
          channelManager: {
            ical: prevAccess.channelManager?.ical ?? '',
            apiToken: prevAccess.channelManager?.apiToken ?? '',
            accountId: prevAccess.channelManager?.accountId ?? '',
            nightlyRate: prevAccess.channelManager?.nightlyRate ?? '',
            commissionRate: prevAccess.channelManager?.commissionRate ?? '',
          },
          [platform]: { ical: '', apiToken: '', accountId: '', nightlyRate: '', commissionRate: '' },
        }),
      ),
    )

    const rawNames = readScopedStorage(APARTMENT_NAME_KEY)
    const prevNames = rawNames ? (JSON.parse(rawNames) as Partial<Record<ChannelKey, string>>) : {}
    delete prevNames[platform]
    writeScopedStorage(APARTMENT_NAME_KEY, JSON.stringify(prevNames))
    localStorage.removeItem(scopedStorageKey(OFFICIAL_CHANNEL_SYNC_KEY))
    if (platform === 'channelManager') {
      localStorage.removeItem(scopedStorageKey(CHANNEL_MANAGER_PROVIDER_KEY))
      setSelectedProvider('beds24')
    }
    notifyConnectionsUpdated()
  }

  const confirmDisconnectChannelManager = () => {
    onDisconnectOne('channelManager')
    setDisconnectChannelManagerOpen(false)
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

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <h2 className="text-lg font-bold text-zinc-900">Options pour connecter vos logements</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Connexion uniquement via Channel Manager / PMS pour centraliser toutes les données officielles.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-1">
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-zinc-900">Canal unique - PMS / Channel Manager</p>
              <p className="mt-1 text-xs text-zinc-600">
              Source complète pour stats, réservations, logements, statuts et synchronisation avancée.
              </p>
              <p className="mt-2 text-[11px] font-semibold text-emerald-700">Exemples: Hostaway, Guesty, Lodgify, Beds24.</p>
              <p className="mt-2 text-[11px] font-semibold text-zinc-700">
                Le client se connecte lui-même: aucune saisie manuelle de ta part.
              </p>
            </article>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{c.tutorialTitle}</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {c.tutorialBody}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTutorialVideo((v) => !v)}
              className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {showTutorialVideo ? c.hideVideo : c.showVideo}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-zinc-600 sm:max-w-[14rem]">
              <span className="font-medium text-zinc-700">Channel manager</span>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={connectedChannels.channelManager}
                className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm font-medium text-zinc-800 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              >
                <option value="beds24">Beds24</option>
                <option value="hostaway">Hostaway</option>
                <option value="guesty">Guesty</option>
                <option value="lodgify">Lodgify</option>
              </select>
              {connectedChannels.channelManager ? (
                <p className="mt-1 text-[11px] text-zinc-500">
                  Un seul channel manager actif: supprimez la connexion actuelle pour en choisir un autre.
                </p>
              ) : null}
            </label>
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-zinc-600 sm:max-w-[14rem]">
              <span className="font-medium text-zinc-700">Langue de la narration</span>
              <select
                value={selectedTutorialVo}
                disabled={!hasTutorialVideo}
                onChange={(e) => {
                  const v = e.target.value
                  if (selectedProvider === 'lodgify') {
                    const lang = v as (typeof LODGIFY_TUTORIAL_VO_OPTIONS)[number]['lang']
                    setLodgifyTutorialVo(lang)
                    try {
                      sessionStorage.setItem(LODGIFY_TUTORIAL_VO_STORAGE, lang)
                    } catch {
                      /* ignore */
                    }
                    return
                  }
                  const lang = v as (typeof BEDS24_TUTORIAL_VO_OPTIONS)[number]['lang']
                  setBeds24TutorialVo(lang)
                  try {
                    sessionStorage.setItem(BEDS24_TUTORIAL_VO_STORAGE, lang)
                  } catch {
                    /* ignore */
                  }
                }}
                className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm font-medium text-zinc-800 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tutorialOptions.map((o) => (
                  <option key={o.lang} value={o.lang}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            {c.videoHint}
          </p>

          {showTutorialVideo ? (
            <div className="mt-4">
              {hasTutorialVideo ? (
                <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black">
                  <video
                    key={`${selectedProvider}-${selectedTutorialVo}`}
                    className="h-auto w-full"
                    controls
                    playsInline
                    preload="metadata"
                    src={tutorialOptions.find((o) => o.lang === selectedTutorialVo)?.src ?? tutorialOptions[0].src}
                    onError={() => {
                      if (selectedProvider === 'lodgify') {
                        if (lodgifyTutorialVo !== 'fr') {
                          setLodgifyTutorialVo('fr')
                          try {
                            sessionStorage.setItem(LODGIFY_TUTORIAL_VO_STORAGE, 'fr')
                          } catch {
                            /* ignore */
                          }
                        }
                        return
                      }
                      if (beds24TutorialVo !== 'fr') {
                        setBeds24TutorialVo('fr')
                        try {
                          sessionStorage.setItem(BEDS24_TUTORIAL_VO_STORAGE, 'fr')
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                  >
                    {c.videoFallback}
                  </video>
                </div>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                  {c.videoOnlyFor}
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <h3 className="text-sm font-bold text-zinc-900">
              {selectedProvider === 'lodgify' ? 'Etapes Lodgify (une par une)' : 'Etapes Beds24 (une par une)'}
            </h3>
            {selectedProvider === 'lodgify' ? (
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
                <li>Connectez-vous a votre compte Lodgify.</li>
                <li>
                  Depuis le menu lateral gauche, ouvrez <span className="font-medium text-zinc-800">Parametres</span>.
                </li>
                <li>
                  Dans la liste des parametres, cliquez sur <span className="font-medium text-zinc-800">API publique</span>.
                </li>
                <li>
                  Cliquez sur <span className="font-medium text-zinc-800">Copier</span> pour recuperer la cle API.
                </li>
                <li>
                  Revenez dans StayPilot et collez cette cle dans <span className="font-medium text-zinc-800">Cle API Lodgify</span>.
                </li>
                <li>
                  Le numero de compte Lodgify est <span className="font-medium text-zinc-800">optionnel</span>.
                </li>
                <li>
                  Cliquez sur <span className="font-medium text-zinc-800">Connecter</span> pour lancer la synchronisation.
                </li>
              </ol>
            ) : (
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
                <li>Connectez-vous a votre compte Beds24 (navigateur).</li>
                <li>
                  Ouvrez la section liee a l API : menu du type <span className="font-medium text-zinc-800">Marketplace</span>,{' '}
                  <span className="font-medium text-zinc-800">API / Developers</span> ou integrations selon votre interface.
                </li>
                <li>
                  Creez ou copiez une <span className="font-medium text-zinc-800">cle API longue duree</span> (API v2) ou un{' '}
                  <span className="font-medium text-zinc-800">invite code</span> fourni par Beds24 pour un partenaire.
                </li>
                <li>
                  Dans <span className="font-medium text-zinc-800">Compte / Account</span> Beds24, relevez votre{' '}
                  <span className="font-medium text-zinc-800">numero proprietaire (Owner id)</span> : vous pouvez le recopier dans StayPilot comme{' '}
                  <span className="font-medium text-zinc-800">identifiant compte</span> (optionnel mais recommande).
                </li>
                <li>
                  Dans StayPilot, verifiez le <span className="font-medium text-zinc-800">channel manager</span> dans le menu au-dessus de
                  cette liste, puis en bas de page collez la cle API ou l invite code dans le premier champ du formulaire de connexion.
                </li>
                <li>
                  Si vous le connaissez, renseignez l&apos;identifiant compte <span className="font-medium text-zinc-800">Beds24</span> (Owner id)
                  dans le second champ.
                </li>
                <li>
                  Cliquez sur <span className="font-medium text-zinc-800">Connecter</span> : StayPilot convertit automatiquement un invite
                  code en jeton si besoin, puis synchronise logements et reservations.
                </li>
                <li>
                  Verifiez le bandeau de statut et, plus bas, le <span className="font-medium text-zinc-800">resume des logements</span> ainsi
                  que le detail Airbnb / Booking lorsque les donnees sont disponibles.
                </li>
              </ol>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 sm:text-sm">
            <p className="font-semibold">Connexion officielle via Channel Manager / PMS uniquement.</p>
            <p className="mt-1">
              {selectedProvider === 'beds24'
                ? 'Pour Beds24 : cle API ou invite code (StayPilot convertit l invite si besoin). Identifiant compte optionnel (Owner id recommande).'
                : selectedProvider === 'lodgify'
                  ? 'Pour Lodgify : cle API obligatoire. Numero de compte optionnel (si renseigne, il doit correspondre a la cle API).'
                  : 'Cle API + identifiant compte obligatoires.'}
            </p>
            <p>Aucune autre information n'est demandee.</p>
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            Channel manager selectionne :{' '}
            <span className="font-semibold text-zinc-700">{CHANNEL_PROVIDER_LABELS[selectedProvider] ?? selectedProvider}</span> —
            modifiez-le dans le bloc video ci-dessus si besoin.
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900">{t.dashboardConnectChannelManager}</h2>
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
              <label className="block text-xs font-semibold text-zinc-600">
                {selectedProvider === 'beds24'
                  ? 'API key ou invite code Beds24 (obligatoire)'
                  : `Cle API ${selectedProvider} (obligatoire)`}
              </label>
              <input
                type="text"
                value={accessInputs.channelManager.apiToken}
                onChange={(e) =>
                  setAccessInputs((prev) => ({
                    ...prev,
                    channelManager: {
                      ...prev.channelManager,
                      apiToken: e.target.value.replace(/\s+/g, ''),
                    },
                  }))
                }
                placeholder={
                  selectedProvider === 'beds24'
                    ? 'Ex: sejourpilote_xxx ou invite code'
                    : 'Ex: sk_live_xxx / api_key_xxx'
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600">
                Identifiant compte {selectedProvider} {selectedProvider === 'hostaway' || selectedProvider === 'guesty' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <input
                type="text"
                value={accessInputs.channelManager.accountId}
                onChange={(e) =>
                  setAccessInputs((prev) => ({
                    ...prev,
                    channelManager: {
                      ...prev.channelManager,
                      accountId:
                        selectedProvider === 'beds24' ? e.target.value.replace(/\D/g, '') : e.target.value,
                    },
                  }))
                }
                placeholder={
                  selectedProvider === 'beds24'
                    ? 'Ex: 164301 (Owner id / proprietaire)'
                    : selectedProvider === 'lodgify'
                      ? 'Optionnel: numero de compte Lodgify'
                      : 'Ex: account_67890'
                }
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
                  onClick={() => setDisconnectChannelManagerOpen(true)}
                  className="ml-2 inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  {c.removeConnection}
                </button>
              ) : null}
              {connectionFeedback.channelManager === 'success' ? (
                <p className="mt-2 text-xs font-semibold text-emerald-600">{t.dashboardConnectConnected}</p>
              ) : connectionFeedback.channelManager === 'error' ? (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  {connectionErrorMessage || t.dashboardConnectFailed}
                </p>
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
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#3a86ff] text-[10px] font-bold text-white">CM</span>
                {t.dashboardConnectChannelManager}
              </p>
              <p className="font-semibold text-zinc-700">{detectedListings.length}</p>
            </div>
          </div>

          <details className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
              {t.dashboardSummaryShowListings}
            </summary>
            <div className="mt-2 space-y-3 text-sm text-zinc-700">
              {detectedListings.length > 0 ? (
                <>
                  {channelManagerListings.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                      <table className="w-full min-w-[280px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                            <th className="px-3 py-2">{c.listing}</th>
                            <th className="px-3 py-2">Airbnb</th>
                            <th className="px-3 py-2">Booking.com</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channelManagerListings.map((listing) => (
                            <tr key={listing.id} className="border-b border-zinc-100 last:border-0">
                              <td className="px-3 py-2 align-top font-medium text-zinc-800">
                                <div>{listing.name}</div>
                                {listing.address ? (
                                  <div className="mt-0.5 text-xs font-normal text-zinc-500">{listing.address}</div>
                                ) : null}
                                <div className="mt-0.5 text-xs font-normal text-zinc-400">ID: {listing.id}</div>
                              </td>
                              <td className="px-3 py-2 align-top">{renderOtaLinkCell(listing.channelLinks?.airbnb)}</td>
                              <td className="px-3 py-2 align-top">{renderOtaLinkCell(listing.channelLinks?.booking)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-500">
                        Airbnb / Booking : detection depuis les donnees du channel manager (ex. Beds24) a la derniere
                        sync. Reconnectez pour mettre a jour.
                      </p>
                    </div>
                  ) : null}
                  {nonChannelManagerListings.length > 0 ? (
                    <ul className="list-inside list-disc text-zinc-700">
                      {nonChannelManagerListings.map((listing) => (
                        <li key={listing.id}>
                          {listing.name} {listing.address ? `- ${listing.address}` : ''} - ID: {listing.id}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <p className="text-zinc-500">{t.dashboardSummaryNoListings}</p>
              )}
            </div>
          </details>
        </div>
      </div>

      {disconnectChannelManagerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disconnect-cm-title"
          onClick={() => setDisconnectChannelManagerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="disconnect-cm-title" className="text-lg font-bold text-zinc-900">
              Confirmer la suppression
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Voulez-vous vraiment supprimer la connexion au channel manager ? Dans ce cas,{' '}
              <span className="font-semibold text-zinc-800">StayPilot n&apos;aura plus accès</span> à votre PMS : plus de
              synchronisation automatique des logements, des réservations ni des données officielles (revenus,
              disponibilités, statuts, etc.). Le tableau de bord et les fonctionnalités qui s&apos;appuient sur ce canal ne
              seront plus alimentés tant que vous n&apos;aurez pas reconnecté un channel manager.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDisconnectChannelManagerOpen(false)}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                {c.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDisconnectChannelManager}
                className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
              >
                {c.deleteConnection}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

