import type { Locale } from './navbar'

export type FaqItem = { question: string; answer: string }

/** Nombre de questions affichées avant « Voir plus » (identique pour toutes les langues). */
export const FAQ_INITIAL_COUNT = 5

export type FaqCopy = {
  faqTitle: string
  faqSubtitle: string
  faqSeeMore: string
  faqSeeLess: string
  faqItems: FaqItem[]
}

const fr: FaqCopy = {
  faqTitle: 'Questions fréquentes',
  faqSubtitle: 'Tout ce que vous devez savoir sur StayPilot.',
  faqSeeMore: 'Voir plus de questions',
  faqSeeLess: 'Voir moins de questions',
  faqItems: [
    {
      question: "À qui s'adresse l'application ?",
      answer: `Notre application est conçue pour les propriétaires et conciergeries souhaitant centraliser et optimiser la gestion de leurs logements courte durée sans complexité. Que vous gériez 1 ou 50 logements sur Airbnb, Booking.com ou d'autres plateformes, StayPilot vous aide à organiser votre activité efficacement. Elle s'adresse aussi bien aux propriétaires débutants qu'aux professionnels expérimentés recherchant une solution simple et complète pour piloter leur activité au quotidien.`,
    },
    {
      question: "L'application est-elle facile à prendre en main ?",
      answer: `Oui, l'interface est simple, intuitive et rapide à configurer. Vous pouvez commencer à l'utiliser en quelques minutes seulement. Aucune compétence technique n'est requise. Tout est pensé pour vous faire gagner du temps dès le premier jour. De plus, notre équipe support est disponible pour vous accompagner si besoin, et des tutoriels sont disponibles pour vous guider dans la prise en main.`,
    },
    {
      question: 'Comment fonctionne la connexion ?',
      answer: `L'application fonctionne via l'import de vos liens et fichiers iCal fournis par vos plateformes de réservation (Airbnb, Booking.com, etc.). Cette synchronisation permet de récupérer automatiquement toutes les informations nécessaires (réservations, dates, prix, voyageurs) pour afficher une vue globale claire et actualisée de votre activité. Vous n'avez rien à saisir manuellement, tout se synchronise automatiquement.`,
    },
    {
      question: 'Est-ce un channel manager ?',
      answer: `Non. L'application n'est pas un channel manager. Elle n'a pas vocation à diffuser vos annonces ou gérer vos calendriers sur plusieurs plateformes simultanément. En revanche, elle offre une vue d'ensemble claire et centralisée de tous vos logements pour mieux organiser votre gestion quotidienne : calendrier unifié, suivi des performances, gestion des ménages, to-do lists, statistiques et bien plus encore. C'est un outil de pilotage et d'organisation, pas de distribution.`,
    },
    {
      question: 'Puis-je gérer plusieurs logements ?',
      answer: `Oui, vous pouvez gérer plusieurs logements depuis un seul tableau de bord unifié, avec une vision claire et centralisée de l'ensemble de votre activité. Que vous ayez 3, 10 ou 50 logements, tout est regroupé au même endroit. Vous pouvez basculer facilement d'un logement à l'autre, visualiser vos réservations sur un calendrier global, et suivre les performances de chaque bien individuellement ou de manière consolidée.`,
    },
    {
      question: 'Puis-je suivre mes performances ?',
      answer: `Oui, vous avez accès à des statistiques complètes et détaillées pour analyser vos performances et mieux piloter votre activité. Vous pouvez suivre vos revenus mensuels, votre taux d'occupation, vos prix moyens, et bien d'autres indicateurs clés. Ces données vous permettent d'identifier rapidement ce qui fonctionne bien et ce qui peut être amélioré, afin de prendre de meilleures décisions pour optimiser votre rentabilité.`,
    },
    {
      question: "L'application permet-elle de gérer les ménages ?",
      answer: `Oui, vous pouvez gérer entièrement vos opérations de ménage de A à Z. L'application vous permet de créer des listes de tâches à effectuer pour chaque logement, d'ajouter des notes pour la prestataire de ménage, de demander l'ajout de photos après chaque intervention pour vérifier la qualité, de suivre les horaires d'arrivée et de départ de vos intervenants, et d'organiser toutes les missions par logement. Vous gagnez ainsi en visibilité et en contrôle sur cette partie essentielle de votre activité.`,
    },
    {
      question: "La prestataire de ménage a-t-elle un accès dédié ?",
      answer: `Oui, chaque intervenant (prestataire de ménage, prestataire) dispose d'un accès personnalisé et restreint uniquement aux logements auxquels il est assigné. Cela garantit la confidentialité des données et facilite leur travail : ils voient uniquement ce qui les concerne (tâches, notes, horaires, photos à ajouter). Vous gardez le contrôle total tout en simplifiant la communication et le suivi des interventions.`,
    },
    {
      question: 'Puis-je gérer les consommables et achats ?',
      answer: `Oui, une to-do list d'achat est intégrée dans l'application pour suivre facilement les besoins en consommables dans chaque logement (café, thé, papier toilette, savon, etc.). Vous pouvez créer des listes par logement, ajouter des articles, cocher ceux qui ont été achetés, et partager ces listes avec vos prestataires. Cela vous évite les ruptures de stock et garantit une expérience voyageur optimale à chaque séjour.`,
    },
    {
      question: "L'application permet-elle de gérer les prix ?",
      answer: `Non, vous ne pouvez pas modifier directement vos prix depuis l'application. Les tarifs restent gérés sur vos plateformes de réservation (Airbnb, Booking.com, etc.). En revanche, l'offre Pro intègre un outil intelligent qui vous donne des indications et recommandations pour optimiser vos tarifs en fonction des périodes : vacances scolaires, événements sportifs, concerts, jours fériés, et autres moments clés. Cela vous aide à prendre de meilleures décisions de pricing sans avoir à surveiller constamment le calendrier.`,
    },
    {
      question: "Puis-je communiquer avec mes voyageurs depuis l'application ?",
      answer: `Non, la messagerie avec les voyageurs n'est pas intégrée pour le moment. Les échanges avec vos voyageurs se font directement via vos plateformes de réservation (Airbnb, Booking.com, etc.). StayPilot se concentre sur l'organisation et le pilotage de votre activité en interne : calendrier, ménages, performances, tâches, consommables. Nous priorisons les fonctionnalités qui vous font vraiment gagner du temps au quotidien.`,
    },
    {
      question: "L'application est-elle accessible sur mobile ?",
      answer: `Oui, l'application est 100% en ligne et accessible depuis n'importe quel appareil connecté à Internet : ordinateur, téléphone, tablette. Aucune installation n'est nécessaire, il suffit d'ouvrir votre navigateur web. L'interface s'adapte automatiquement à la taille de votre écran pour une expérience optimale, que vous soyez au bureau, en déplacement ou chez vous. Vous pouvez ainsi gérer vos logements de partout, à tout moment.`,
    },
    {
      question: 'Le support est-il réactif ?',
      answer: `Oui, notre support est rapide, disponible et à votre écoute pour vous accompagner en cas de besoin. Nous savons que votre temps est précieux, c'est pourquoi nous mettons un point d'honneur à répondre rapidement à toutes vos questions. Selon votre offre, vous bénéficiez d'un support par email (Starter et Pro) ou d'un support prioritaire dédié via WhatsApp pour l'offre Scale. Notre objectif est de vous aider à tirer le meilleur parti de l'application.`,
    },
    {
      question: "Y a-t-il un engagement ?",
      answer: `Non, aucun engagement. Vous pouvez arrêter votre abonnement à tout moment, sans frais cachés ni pénalités. Nous fonctionnons sur la base d'un abonnement mensuel flexible. Si vous décidez que l'application ne correspond plus à vos besoins, vous êtes libre de résilier immédiatement. Notre objectif est de vous apporter de la valeur chaque mois, pas de vous retenir par un contrat contraignant.`,
    },
    {
      question: 'Comment fonctionne le paiement ?',
      answer: `Le paiement est mensuel et s'effectue automatiquement en fonction de l'offre que vous avez choisie (Starter, Pro ou Scale). Vous pouvez régler par carte bancaire de manière sécurisée. Aucune surprise : le prix affiché est le prix que vous payez, sans frais cachés. Vous recevez une facture chaque mois par email. Vous pouvez également changer d'offre à tout moment selon l'évolution de vos besoins.`,
    },
  ],
}

const en: FaqCopy = {
  faqTitle: 'Frequently asked questions',
  faqSubtitle: 'Everything you need to know about StayPilot.',
  faqSeeMore: 'See more questions',
  faqSeeLess: 'See fewer questions',
  faqItems: [
    {
      question: 'Who is the app for?',
      answer: `Our app is designed for owners and concierge services who want to centralize and simplify short-term rental management. Whether you run 1 or 50 listings on Airbnb, Booking.com, or elsewhere, StayPilot helps you stay organized. It suits beginners and experienced operators alike who want a straightforward, complete way to run day-to-day operations.`,
    },
    {
      question: 'Is the app easy to learn?',
      answer: `Yes. The interface is simple, intuitive, and quick to set up—you can get started in minutes. No technical skills are required. Everything is built to save you time from day one. Our support team can help if needed, and tutorials are available to guide you.`,
    },
    {
      question: 'How does connecting work?',
      answer: `The app works by importing iCal links and files from your booking platforms (Airbnb, Booking.com, etc.). Sync pulls reservations, dates, prices, and guest details automatically so you get a clear, up-to-date view of your business—nothing to enter by hand.`,
    },
    {
      question: 'Is it a channel manager?',
      answer: `No. It is not a channel manager. It is not meant to publish listings or manage calendars across platforms for you. Instead, it gives a clear, centralized view of all your units for daily operations: unified calendar, performance, cleaning, to-dos, stats, and more. It is for steering and organization, not distribution.`,
    },
    {
      question: 'Can I manage multiple properties?',
      answer: `Yes. You manage everything from one unified dashboard with a clear, centralized view. Whether you have 3, 10, or 50 units, it is all in one place. Switch between properties easily, see bookings on a global calendar, and track performance per unit or in aggregate.`,
    },
    {
      question: 'Can I track performance?',
      answer: `Yes. You get detailed statistics to analyze performance and run your business better—monthly revenue, occupancy, average prices, and other key metrics—so you can see what works, what to improve, and optimize profitability.`,
    },
    {
      question: 'Can I manage cleaning in the app?',
      answer: `Yes. You can run end-to-end cleaning operations: task lists per property, notes for cleaners, photo requests after each visit to check quality, arrival and departure times for staff, and missions organized by unit—more visibility and control where it matters.`,
    },
    {
      question: 'Does my cleaner get a dedicated login?',
      answer: `Yes. Each provider gets a personal, restricted login only for the properties they are assigned to. That protects confidentiality and makes their job easier—they only see what matters to them (tasks, notes, times, photos to add). You stay in full control while simplifying communication and follow-up.`,
    },
    {
      question: 'Can I manage consumables and purchases?',
      answer: `Yes. A built-in shopping to-do helps track consumables per property (coffee, tea, toilet paper, soap, etc.). Create lists per unit, add items, check off purchases, and share lists with providers—fewer stock-outs and a better guest experience every stay.`,
    },
    {
      question: 'Can I manage prices in the app?',
      answer: `No—you cannot change rates directly in the app. Prices stay on Airbnb, Booking.com, etc. The Pro plan includes a smart tool with guidance and recommendations by period—school holidays, sports events, concerts, public holidays, and other key moments—so you can price better without watching the calendar all day.`,
    },
    {
      question: 'Can I message guests from the app?',
      answer: `No—guest messaging is not built in today. You message guests on Airbnb, Booking.com, etc. StayPilot focuses on internal organization and operations: calendar, cleaning, performance, tasks, consumables. We prioritize features that save you real time every day.`,
    },
    {
      question: 'Does it work on mobile?',
      answer: `Yes. It is 100% online on any internet-connected device—desktop, phone, or tablet. No install: just open your browser. The UI adapts to your screen whether you are at the office, on the go, or at home, so you can manage properties anywhere, anytime.`,
    },
    {
      question: 'Is support responsive?',
      answer: `Yes. Support is fast, available, and here when you need it. We know your time matters, so we reply quickly. Depending on your plan: email support on Starter and Pro, or dedicated priority support via WhatsApp on Scale. We want you to get the most out of the product.`,
    },
    {
      question: 'Is there a commitment?',
      answer: `No long-term lock-in. You can cancel anytime with no hidden fees or penalties. Billing is flexible monthly. If the product is no longer a fit, you can leave immediately. We aim to earn your business every month—not trap you in a rigid contract.`,
    },
    {
      question: 'How does payment work?',
      answer: `Billing is monthly and automatic based on your plan (Starter, Pro, or Scale). Pay securely by card. What you see is what you pay—no hidden fees. You receive a monthly invoice by email. You can also change plans anytime as your needs evolve.`,
    },
  ],
}

const es: FaqCopy = {
  faqTitle: 'Preguntas frecuentes',
  faqSubtitle: 'Lo esencial sobre StayPilot.',
  faqSeeMore: 'Ver más preguntas',
  faqSeeLess: 'Ver menos preguntas',
  faqItems: [
    {
      question: '¿Para quién es la aplicación?',
      answer: `Está pensada para propietarios y concierges que quieren centralizar y optimizar la gestión de alquileres de corta estancia. Tenga 1 o 50 alojamientos en Airbnb, Booking.com u otras plataformas, StayPilot le ayuda a organizarse. Sirve tanto para principiantes como para profesionales que buscan una solución simple y completa para el día a día.`,
    },
    {
      question: '¿Es fácil de usar?',
      answer: `Sí. La interfaz es simple, intuitiva y rápida de configurar; puede empezar en minutos. No hacen falta conocimientos técnicos. Todo está pensado para ahorrar tiempo desde el primer día. El equipo de soporte puede ayudarle y hay tutoriales disponibles.`,
    },
    {
      question: '¿Cómo funciona la conexión?',
      answer: `Funciona importando enlaces y archivos iCal de sus plataformas (Airbnb, Booking.com, etc.). La sincronización recupera reservas, fechas, precios y huéspedes para ofrecer una visión global clara y actualizada, sin introducir datos a mano.`,
    },
    {
      question: '¿Es un channel manager?',
      answer: `No. No es un channel manager: no publica anuncios ni gestiona calendarios en varias plataformas a la vez. En cambio ofrece una visión centralizada para el día a día: calendario unificado, rendimiento, limpieza, listas de tareas, estadísticas y más. Es una herramienta de pilotaje y organización, no de distribución.`,
    },
    {
      question: '¿Puedo gestionar varios alojamientos?',
      answer: `Sí, desde un único panel con visión centralizada. Tenga 3, 10 o 50 unidades, todo está en el mismo sitio. Cambie de alojamiento con facilidad, vea reservas en un calendario global y siga el rendimiento por bien o de forma consolidada.`,
    },
    {
      question: '¿Puedo seguir mi rendimiento?',
      answer: `Sí, con estadísticas detalladas: ingresos mensuales, ocupación, precios medios y otros indicadores para identificar qué funciona, qué mejorar y optimizar la rentabilidad.`,
    },
    {
      question: '¿Permite gestionar limpiezas?',
      answer: `Sí, de principio a fin: listas de tareas por alojamiento, notas para el equipo de limpieza, solicitud de fotos tras cada paso, horarios de llegada y salida del personal y misiones organizadas por vivienda.`,
    },
    {
      question: '¿La empresa de limpieza tiene acceso propio?',
      answer: `Sí. Cada interviniente tiene un acceso personal restringido solo a los alojamientos asignados: confidencialidad y simplicidad; solo ven lo que les concierne (tareas, notas, horarios, fotos). Usted mantiene el control total.`,
    },
    {
      question: '¿Puedo gestionar consumibles y compras?',
      answer: `Sí: lista de compras integrada por alojamiento (café, té, papel higiénico, jabón, etc.). Cree listas, añada artículos, marque lo comprado y compártalas con proveedores para evitar roturas de stock.`,
    },
    {
      question: '¿Permite gestionar precios?',
      answer: `No puede cambiar tarifas directamente en la app: siguen en Airbnb, Booking.com, etc. El plan Pro incluye una herramienta inteligente con indicaciones por periodos (vacaciones, eventos, festivos) para decidir mejor sin vigilar el calendario constantemente.`,
    },
    {
      question: '¿Puedo hablar con huéspedes desde la app?',
      answer: `No, la mensajería con huéspedes no está integrada por ahora: use las plataformas. StayPilot se centra en la organización interna: calendario, limpieza, rendimiento, tareas, consumibles.`,
    },
    {
      question: '¿Funciona en móvil?',
      answer: `Sí: 100% online en ordenador, móvil o tableta, sin instalación, solo navegador. La interfaz se adapta a la pantalla para gestionar desde cualquier lugar.`,
    },
    {
      question: '¿El soporte es rápido?',
      answer: `Sí, respondemos con rapidez. Según el plan: email en Starter y Pro, o soporte prioritario por WhatsApp en Scale.`,
    },
    {
      question: '¿Hay permanencia?',
      answer: `No hay compromiso largo: puede cancelar en cualquier momento sin cargos ocultos ni penalizaciones. Facturación mensual flexible; si ya no encaja, puede darse de baja al momento.`,
    },
    {
      question: '¿Cómo es el pago?',
      answer: `Mensual y automático según el plan (Starter, Pro o Scale). Pago seguro con tarjeta, sin sorpresas ni gastos ocultos. Factura mensual por email y posibilidad de cambiar de plan cuando lo necesite.`,
    },
  ],
}

const de: FaqCopy = {
  faqTitle: 'Häufige Fragen',
  faqSubtitle: 'Das Wichtigste über StayPilot.',
  faqSeeMore: 'Weitere Fragen anzeigen',
  faqSeeLess: 'Weniger Fragen anzeigen',
  faqItems: [
    {
      question: 'Für wen ist die App?',
      answer: `Für Eigentümer und Concierge-Dienste, die Kurzzeitvermietung zentral und ohne Overhead steuern wollen—ob 1 oder 50 Objekte auf Airbnb, Booking.com oder woanders. Für Einsteiger und Profis, die eine klare, vollständige Alltagslösung suchen.`,
    },
    {
      question: 'Ist die App leicht zu bedienen?',
      answer: `Ja: einfache, intuitive Oberfläche, schnell eingerichtet, Start in wenigen Minuten. Keine technischen Vorkenntnisse nötig. Support und Tutorials stehen bereit.`,
    },
    {
      question: 'Wie funktioniert die Anbindung?',
      answer: `Über Import von iCal-Links und -Dateien Ihrer Buchungsplattformen. Die Synchronisation holt Reservierungen, Daten, Preise und Gästeinfos automatisch—ohne manuelle Eingabe.`,
    },
    {
      question: 'Ist es ein Channel Manager?',
      answer: `Nein. Kein Channel Manager: keine Ausspielung oder Kalendersteuerung über mehrere Portale hinweg. Stattdessen zentrale Sicht für den Betrieb: Kalender, Performance, Reinigung, To-dos, Statistiken. Steuerung und Organisation, nicht Distribution.`,
    },
    {
      question: 'Kann ich mehrere Objekte verwalten?',
      answer: `Ja, aus einem Dashboard mit zentraler Übersicht—3, 10 oder 50 Einheiten. Einfaches Wechseln, globaler Kalender, Performance pro Objekt oder aggregiert.`,
    },
    {
      question: 'Kann ich Performance messen?',
      answer: `Ja, mit ausführlichen Statistiken: Umsatz, Auslastung, Durchschnittspreise und weitere KPIs für bessere Entscheidungen und Rentabilität.`,
    },
    {
      question: 'Kann ich Reinigung steuern?',
      answer: `Ja, End-to-End: Aufgabenlisten pro Objekt, Notizen für Teams, Foto-Nachweise, An- und Abfahrtszeiten, Einsätze pro Einheit.`,
    },
    {
      question: 'Hat die Reinigungsfirma einen eigenen Zugang?',
      answer: `Ja: personalisierter, eingeschränkter Zugang nur für zugewiesene Objekte—Datenschutz und fokussierte Ansicht für Aufgaben, Notizen, Zeiten, Fotos. Sie behalten die Kontrolle.`,
    },
    {
      question: 'Kann ich Verbrauchsmaterial und Einkauf planen?',
      answer: `Ja: integrierte Einkaufs-To-dos pro Objekt (Kaffee, Tee, Papier, Seife …), Listen teilen, Häkchen bei gekauften Artikeln—weniger Engpässe, bessere Gästeerfahrung.`,
    },
    {
      question: 'Kann ich Preise in der App ändern?',
      answer: `Nein, Preise bleiben auf den Plattformen. Pro bietet ein intelligentes Hilfsmittel mit Empfehlungen zu Ferien, Events, Feiertagen—ohne ständiges Kalender-Monitoring.`,
    },
    {
      question: 'Kann ich Gäste in der App kontaktieren?',
      answer: `Nein, Gäste-Messaging ist derzeit nicht integriert—das läuft über die Portale. StayPilot fokussiert interne Organisation: Kalender, Reinigung, Performance, Aufgaben, Verbrauchsmaterial.`,
    },
    {
      question: 'Funktioniert es mobil?',
      answer: `Ja, 100% online im Browser auf PC, Handy oder Tablet—keine Installation, responsives Layout für unterwegs.`,
    },
    {
      question: 'Ist der Support schnell?',
      answer: `Ja. Je nach Paket E-Mail-Support oder priorisierte Betreuung per WhatsApp bei Scale.`,
    },
    {
      question: 'Gibt es eine Bindung?',
      answer: `Nein: monatlich kündbar ohne versteckte Gebühren oder Strafen—wir wollen monatlich überzeugen, nicht vertraglich festhalten.`,
    },
    {
      question: 'Wie läuft die Zahlung?',
      answer: `Monatlich automatisch je nach Paket (Starter, Pro, Scale). Sichere Kartenzahlung, keine versteckten Kosten, Rechnung per E-Mail, Planwechsel jederzeit möglich.`,
    },
  ],
}

const it: FaqCopy = {
  faqTitle: 'Domande frequenti',
  faqSubtitle: 'Tutto quello che serve sapere su StayPilot.',
  faqSeeMore: 'Mostra altre domande',
  faqSeeLess: 'Mostra meno domande',
  faqItems: [
    {
      question: 'A chi si rivolge l’app?',
      answer: `È pensata per proprietari e concierge che vogliono centralizzare la gestione degli affitti brevi, da 1 a 50 alloggi su Airbnb, Booking.com o altre piattaforme. Adatta a principianti e professionisti che cercano uno strumento semplice e completo per il quotidiano.`,
    },
    {
      question: "L'app è facile da usare?",
      answer: `Sì: interfaccia semplice e intuitiva, configurazione rapida, si parte in pochi minuti. Nessuna competenza tecnica richiesta. Supporto e tutorial disponibili.`,
    },
    {
      question: 'Come funziona il collegamento?',
      answer: `Tramite import di link e file iCal dalle piattaforme di prenotazione. La sincronizzazione recupera prenotazioni, date, prezzi e ospiti per una vista chiara e aggiornata, senza inserimenti manuali.`,
    },
    {
      question: 'È un channel manager?',
      answer: `No. Non è un channel manager: non pubblica annunci né gestisce i calendari multi-piattaforma per conto vostro. Offre invece una vista centralizzata per operatività quotidiana: calendario unificato, performance, pulizie, to-do, statistiche. È per governo e organizzazione, non distribuzione.`,
    },
    {
      question: 'Posso gestire più alloggi?',
      answer: `Sì, da un’unica dashboard con visione centralizzata—3, 10 o 50 unità. Passaggio rapido tra immobili, calendario globale, performance per bene o consolidate.`,
    },
    {
      question: 'Posso monitorare le performance?',
      answer: `Sì, con statistiche dettagliate: ricavi mensili, occupazione, prezzi medi e altri indicatori per decisioni migliori e redditività.`,
    },
    {
      question: 'Si possono gestire le pulizie?',
      answer: `Sì, dall’inizio alla fine: elenco attività per alloggio, note per il team, richiesta foto dopo ogni intervento, orari di arrivo e partenza, missioni per unità.`,
    },
    {
      question: 'L’impresa di pulizie ha un accesso dedicato?',
      answer: `Sì: ogni operatore ha accesso personale limitato agli alloggi assegnati—riservatezza e solo le informazioni utili (attività, note, orari, foto). Voi mantenete il controllo.`,
    },
    {
      question: 'Posso gestire consumabili e acquisti?',
      answer: `Sì: to-do acquisti integrati per alloggio (caffè, tè, carta igienica, sapone…), liste condivisibili con i fornitori, spunta degli acquisti—meno rotture di stock.`,
    },
    {
      question: 'Si possono gestire i prezzi?',
      answer: `Non potete modificare le tariffe nell’app: restano sulle piattaforme. Il piano Pro include uno strumento intelligente con indicazioni per periodi (vacanze, eventi, festività).`,
    },
    {
      question: 'Posso contattare gli ospiti dall’app?',
      answer: `No, la messaggistica ospiti non è integrata per ora: usate le piattaforme. StayPilot si concentra su organizzazione interna: calendario, pulizie, performance, attività, consumabili.`,
    },
    {
      question: 'Funziona su mobile?',
      answer: `Sì: 100% online su browser, PC, telefono o tablet, senza installazione. Interfaccia adattiva per gestire ovunque.`,
    },
    {
      question: 'Il supporto è reattivo?',
      answer: `Sì, risposte rapide. In base al piano: email per Starter e Pro, supporto prioritario WhatsApp per Scale.`,
    },
    {
      question: 'C’è un vincolo contrattuale?',
      answer: `Nessun vincolo lungo: disdetta in qualsiasi momento senza costi nascosti o penali. Abbonamento mensile flessibile.`,
    },
    {
      question: 'Come funziona il pagamento?',
      answer: `Mensile e automatico in base al piano (Starter, Pro, Scale). Pagamento sicuro con carta, nessun costo nascosto, fattura mensile via email, cambio piano quando serve.`,
    },
  ],
}

export const faqTranslations: Record<Locale, FaqCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
