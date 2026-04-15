import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { BookingCalendarOverview } from './BookingCalendarOverview'

const FEATURE_VIDEO_OPTIONS = [
  { lang: 'fr', src: '/intel-watch-tutorial.mp4' },
  { lang: 'en', src: '/intel-watch-tutorial.en.mp4' },
  { lang: 'es', src: '/intel-watch-tutorial.es.mp4' },
  { lang: 'de', src: '/intel-watch-tutorial.de.mp4' },
  { lang: 'it', src: '/intel-watch-tutorial.it.mp4' },
] as const

const STATS_VIDEO_OPTIONS = [
  { lang: 'fr', src: '/stats-occupancy-tutorial.mp4' },
  { lang: 'en', src: '/stats-occupancy-tutorial.en.mp4' },
  { lang: 'es', src: '/stats-occupancy-tutorial.es.mp4' },
  { lang: 'de', src: '/stats-occupancy-tutorial.de.mp4' },
  { lang: 'it', src: '/stats-occupancy-tutorial.it.mp4' },
] as const

function normalizeFeatureLocale(locale: string): (typeof FEATURE_VIDEO_OPTIONS)[number]['lang'] {
  const value = locale.toLowerCase()
  if (value.startsWith('fr')) return 'fr'
  if (value.startsWith('en')) return 'en'
  if (value.startsWith('es')) return 'es'
  if (value.startsWith('de')) return 'de'
  if (value.startsWith('it')) return 'it'
  return 'fr'
}

type FeatureTab = 'intel' | 'stats' | 'calendar' | 'cleaning' | 'expenses' | 'supplies'

const FEATURE_TABS: Array<{ id: FeatureTab; label: string }> = [
  { id: 'intel', label: 'Veille informationnelle sur votre logement' },
  { id: 'stats', label: "Statistiques encaissement + taux d'occupation" },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'cleaning', label: 'Prestataire menage' },
  { id: 'expenses', label: 'Tableau des charges' },
  { id: 'supplies', label: 'Liste des consommables' },
]

export function FeaturesVideoPage() {
  const { locale } = useLanguage()
  const videoLang = normalizeFeatureLocale(locale)
  const videoSrc = FEATURE_VIDEO_OPTIONS.find((o) => o.lang === videoLang)?.src ?? FEATURE_VIDEO_OPTIONS[0].src
  const statsVideoSrc = STATS_VIDEO_OPTIONS.find((o) => o.lang === videoLang)?.src ?? STATS_VIDEO_OPTIONS[0].src
  const [activeTab, setActiveTab] = useState<FeatureTab | null>(null)
  const introSkipSeconds = 2.2
  const explainer =
    videoLang === 'fr'
      ? {
          title: 'Comment lire cette analyse',
          body:
            'Cette vidéo présente la veille informationnelle autour de votre logement : nous croisons vos connexions (Airbnb, Booking, iCal, channel manager) avec les signaux locaux de la zone (activité, événements, dynamique de demande) pour vous aider à décider plus vite et plus précisément.',
        }
      : videoLang === 'es'
        ? {
            title: 'Cómo interpretar este análisis',
            body:
              'Este vídeo presenta la vigilancia informativa alrededor de tu alojamiento: combinamos tus conexiones (Airbnb, Booking, iCal, channel manager) con señales locales del área (actividad, eventos y dinámica de demanda) para ayudarte a decidir con más rapidez y precisión.',
          }
        : videoLang === 'de'
          ? {
              title: 'So lesen Sie diese Analyse',
              body:
                'Dieses Video zeigt die lokale Informationsanalyse rund um Ihre Unterkunft: Wir kombinieren Ihre Verbindungen (Airbnb, Booking, iCal, Channel Manager) mit lokalen Signalen (Aktivität, Events, Nachfragedynamik), damit Sie schneller und fundierter entscheiden können.',
            }
          : videoLang === 'it'
            ? {
                title: 'Come interpretare questa analisi',
                body:
                  'Questo video presenta il monitoraggio informativo intorno al tuo alloggio: incrociamo le tue connessioni (Airbnb, Booking, iCal, channel manager) con i segnali locali dell’area (attività, eventi e dinamica della domanda) per aiutarti a decidere in modo più rapido e preciso.',
              }
            : {
                title: 'How to read this analysis',
                body:
                  'This video introduces local intelligence around your property: we combine your connected sources (Airbnb, Booking, iCal, channel manager) with nearby market signals (activity, events, and demand dynamics) so you can make faster, more accurate decisions.',
              }

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#f8fbff] via-white to-[#f6f8fc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 rounded-3xl border border-[#dbe7ff] bg-white/90 px-5 py-5 shadow-[0_10px_30px_rgba(74,134,247,0.10)] backdrop-blur sm:px-6 sm:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a86f7]">Fonctionnalites premium</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Demo interactive StayPilot</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 sm:text-[15px]">
            Explorez chaque module avec une experience visuelle fluide et un rendu haut de gamme.
          </p>
        </div>

        <div className="relative z-20 mb-5 grid grid-cols-1 gap-3 pointer-events-auto sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'calendar') {
                  setActiveTab('calendar')
                  return
                }
                if (tab.id === 'cleaning') {
                  window.location.href = '/dashboard/prestataire-menage'
                  return
                }
                if (tab.id === 'expenses') {
                  window.location.href = '/dashboard/tableau-charges'
                  return
                }
                if (tab.id === 'supplies') {
                  window.location.href = '/dashboard/consommables'
                  return
                }
                setActiveTab(tab.id)
              }}
              className={`relative min-h-[96px] cursor-pointer select-none overflow-hidden rounded-2xl border px-4 py-4 text-center text-[15px] font-semibold leading-snug pointer-events-auto transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-[#c7d9ff] bg-gradient-to-b from-[#f4f8ff] to-[#eaf1ff] text-zinc-900 shadow-[0_8px_20px_rgba(74,134,247,0.16)]'
                  : 'border-zinc-200 bg-white text-zinc-800 shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-[#d7e3fb] hover:shadow-[0_10px_22px_rgba(74,134,247,0.12)]'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-3xl border border-[#dbe7ff] bg-white/90 p-4 shadow-[0_10px_24px_rgba(74,134,247,0.08)] sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4a86f7]">Trust & social proof</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Une expérience pensée pour inspirer confiance</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">Airbnb ready</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">Booking.com ready</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">Channel Manager compatible</span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">Support proactif</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative h-44 overflow-hidden">
                <img src="/trust-airbnb-lifestyle.png" alt="Ambiance premium logement" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">Ambiance premium</div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-zinc-900">Équipe ménage fiable et rigoureuse</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Des protocoles de préparation standardisés pour garantir un niveau de qualité constant avant chaque arrivée.
                </p>
              </div>
            </article>
            <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative h-44 overflow-hidden">
                <img src="/trust-airbnb-mobile.png" alt="Application mobile Airbnb style" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">Mobile first</div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-zinc-900">Mise en scène “Instagrammable”</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Un rendu visuel premium qui renforce l’attractivité de l’annonce et améliore le taux de conversion.
                </p>
              </div>
            </article>
            <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative h-44 overflow-hidden">
                <img src="/trust-cleaning-detail.png" alt="Detail menage et confort" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">Confiance client</div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-zinc-900">Expérience hôte rassurante</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Un pilotage opérationnel clair pour offrir une qualité perçue élevée et durable à chaque séjour.
                </p>
              </div>
            </article>
          </div>
        </div>

        {activeTab === 'intel' ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-4">
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="mb-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
            >
              Retour
            </button>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-inner">
              <video
                key={videoLang}
                className="h-auto w-full"
                controls
                playsInline
                preload="metadata"
                src={videoSrc}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget
                  if (video.duration > introSkipSeconds + 0.5) {
                    try {
                      video.currentTime = introSkipSeconds
                    } catch {
                      /* ignore seek errors */
                    }
                  }
                }}
              >
                Your browser does not support MP4 playback.
              </video>
            </div>
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">{explainer.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700">{explainer.body}</p>
            </div>
          </div>
        ) : null}

        {activeTab === 'stats' ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-4">
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="mb-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
            >
              Retour
            </button>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-inner">
              <video key={`stats-${videoLang}`} className="h-auto w-full" controls playsInline preload="metadata" src={statsVideoSrc}>
                Your browser does not support MP4 playback.
              </video>
            </div>
          </div>
        ) : null}

        {activeTab === 'calendar' ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="mb-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
            >
              Retour
            </button>
            <BookingCalendarOverview />
          </div>
        ) : null}

      </div>
    </section>
  )
}
