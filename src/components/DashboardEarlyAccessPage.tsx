import { useLanguage } from '../hooks/useLanguage'

export function DashboardEarlyAccessPage() {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const ui = {
    fr: {
      badge: 'Accès anticipé',
      p1: "Actuellement, l'équipe travaille sur l'ajout d'un très grand nombre d'APIs de journaux et de flux médias pour renforcer la veille informationnelle et fiabiliser nos signaux de demande.",
      p2: 'En tant que client Premium, vous serez les premiers à en bénéficier.',
      sources: "Exemples de sources en cours d'intégration",
      objective1: 'Objectif 1',
      objective2: 'Objectif 2',
      objective3: 'Objectif 3',
      objective1Text: 'Données plus fiables',
      objective2Text: 'Moins de faux signaux',
      objective3Text: 'Meilleure anticipation prix et occupation',
      p3: 'Notre but est de croiser un maximum de sources, vérifier la cohérence entre elles, puis ne remonter que les informations les plus pertinentes pour la veille informationnelle de vos logements.',
      p4: "N'hésitez pas à nous envoyer un WhatsApp sur les points que vous souhaitez améliorer.",
    },
    en: {
      badge: 'Early access',
      p1: 'The team is currently adding a large number of news and media APIs to strengthen local intelligence and improve demand signal reliability.',
      p2: 'As a Premium customer, you will be among the first to benefit.',
      sources: 'Examples of sources currently being integrated',
      objective1: 'Objective 1',
      objective2: 'Objective 2',
      objective3: 'Objective 3',
      objective1Text: 'More reliable data',
      objective2Text: 'Fewer false signals',
      objective3Text: 'Better price and occupancy anticipation',
      p3: 'Our goal is to cross-check as many sources as possible, verify consistency, and surface only the most relevant intelligence for your listings.',
      p4: 'Feel free to send us a WhatsApp with the points you want to improve.',
    },
    es: {
      badge: 'Acceso anticipado',
      p1: 'Actualmente, el equipo está trabajando en añadir un gran número de APIs de prensa y medios para reforzar la inteligencia y fiabilizar nuestras señales de demanda.',
      p2: 'Como cliente Premium, serás de los primeros en beneficiarte.',
      sources: 'Ejemplos de fuentes en integración',
      objective1: 'Objetivo 1',
      objective2: 'Objetivo 2',
      objective3: 'Objetivo 3',
      objective1Text: 'Datos más fiables',
      objective2Text: 'Menos señales falsas',
      objective3Text: 'Mejor anticipación de precio y ocupación',
      p3: 'Nuestro objetivo es cruzar el máximo de fuentes, verificar su coherencia y mostrar solo la información más relevante para tus alojamientos.',
      p4: 'No dudes en enviarnos un WhatsApp sobre los puntos que quieras mejorar.',
    },
    de: {
      badge: 'Frühzugang',
      p1: 'Aktuell arbeitet das Team daran, eine große Zahl an Nachrichten- und Medien-APIs zu integrieren, um die Informationslage zu stärken und unsere Nachfragesignale robuster zu machen.',
      p2: 'Als Premium-Kunde profitieren Sie als Erste davon.',
      sources: 'Beispiele integrierter Quellen',
      objective1: 'Ziel 1',
      objective2: 'Ziel 2',
      objective3: 'Ziel 3',
      objective1Text: 'Zuverlässigere Daten',
      objective2Text: 'Weniger Fehlalarme',
      objective3Text: 'Bessere Preis- und Auslastungsprognose',
      p3: 'Unser Ziel ist es, möglichst viele Quellen zu kreuzen, deren Konsistenz zu prüfen und nur die relevantesten Informationen für Ihre Unterkünfte hervorzuheben.',
      p4: 'Senden Sie uns gern eine WhatsApp mit den Punkten, die Sie verbessern möchten.',
    },
    it: {
      badge: 'Accesso anticipato',
      p1: 'Al momento il team sta aggiungendo un gran numero di API di notizie e media per rafforzare la veille informativa e rendere più affidabili i segnali di domanda.',
      p2: 'Come cliente Premium, sarai tra i primi a beneficiarne.',
      sources: 'Esempi di fonti in fase di integrazione',
      objective1: 'Obiettivo 1',
      objective2: 'Obiettivo 2',
      objective3: 'Obiettivo 3',
      objective1Text: 'Dati più affidabili',
      objective2Text: 'Meno falsi segnali',
      objective3Text: 'Migliore anticipazione di prezzo e occupazione',
      p3: 'Il nostro obiettivo è incrociare il maggior numero possibile di fonti, verificarne la coerenza e mostrare solo le informazioni più rilevanti per i tuoi alloggi.',
      p4: 'Non esitare a inviarci un WhatsApp sui punti che vuoi migliorare.',
    },
  }[ll]

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-violet-500/15 via-violet-500/5 to-transparent px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">{ui.badge}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabEarlyAccess}</h1>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-sm leading-relaxed text-zinc-700">
              {ui.p1}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">
              {ui.p2}
            </p>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.sources}</p>
              <p className="mt-2 text-sm text-zinc-700">
                BFMTV, New York Times, Reuters, Associated Press (AP), BBC News, The Guardian, Le Monde, Les Echos,
                Franceinfo, Financial Times, Bloomberg, CNN, Al Jazeera, Euronews, NewsAPI, GDELT et autres flux
                spécialisés (événements, risques, économie, tourisme).
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.objective1}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{ui.objective1Text}</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.objective2}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{ui.objective2Text}</p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{ui.objective3}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{ui.objective3Text}</p>
              </article>
            </div>

            <p className="mt-4 text-sm text-zinc-700">
              {ui.p3}
            </p>
            <p className="mt-2 text-sm text-zinc-700">
              {ui.p4}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
