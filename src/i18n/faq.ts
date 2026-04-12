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
  faqSubtitle: 'Réponses directes pour décider vite — et passer à l’action.',
  faqSeeMore: 'Voir plus de questions',
  faqSeeLess: 'Voir moins de questions',
  faqItems: [
    {
      question: "À qui s'adresse StayManager ?",
      answer: `Aux propriétaires et conciergeries qui veulent industrialiser la location courte durée : de 1 à 50+ logements sur Airbnb, Booking.com ou ailleurs. L’objectif : moins d’administration manuelle, plus de nuits vendues et une vision claire sur la rentabilité.`,
    },
    {
      question: 'Combien de temps pour être opérationnel ?',
      answer: `Très vite : l’interface est pensée pour monter en charge sans friction. Vous connectez vos flux, invitez vos équipes, et vous pilotez dès les premiers jours. Notre support accélère le time-to-value si vous avez un parc large.`,
    },
    {
      question: 'Comment se fait la connexion aux plateformes ?',
      answer: `Par import des flux iCal (Airbnb, Booking.com, etc.). Les réservations, dates et voyageurs remontent automatiquement : fini les ressaisies, moins d’erreurs coûteuses, des réactions plus rapides sur chaque créneau.`,
    },
    {
      question: 'Est-ce un channel manager ?',
      answer: `Non. StayManager ne diffuse pas vos annonces sur les OTA. C’est un outil d’exploitation : calendrier unifié, ménage, indicateurs, tâches. Vous gardez votre stack de distribution actuelle ; nous sécurisons l’opérationnel et la marge.`,
    },
    {
      question: 'Puis-je scaler sur plusieurs logements ?',
      answer: `Oui. Un seul tableau de bord pour suivre CA, occupation et opérations sur tout le parc. Indispensable pour ajouter des unités sans exploser votre charge interne.`,
    },
    {
      question: 'Puis-je suivre mes performances financières ?',
      answer: `Oui : revenus, occupation, prix moyens et autres signaux pour arbitrer vite — où investir le ménage, où ajuster votre stratégie tarifaire en dehors des OTA.`,
    },
    {
      question: 'Comment le ménage est-il piloté ?',
      answer: `De A à Z : checklists par logement, notes et photos pour contrôler la qualité, horaires d’intervention. Moins de litiges voyageurs, plus de turnovers fiables — donc plus de revenus récurrents.`,
    },
    {
      question: 'La prestataire de ménage a-t-elle un accès dédié ?',
      answer: `Oui, un accès limité aux seuls biens assignés : elle voit l’essentiel (tâches, notes, créneaux), vous gardez la donnée sensible et le contrôle. Moins d’allers-retours, plus d’exécution.`,
    },
    {
      question: 'Puis-je suivre les consommables et achats ?',
      answer: `Oui : listes par logement (café, papier toilette, etc.), suivi des achats, partage avec les prestataires. Moins de ruptures, meilleure expérience voyageur — et moins de dépenses improvisées.`,
    },
    {
      question: "Puis-je changer mes tarifs depuis l'application ?",
      answer: `Les prix restent sur Airbnb / Booking.com. En Pro, un outil vous oriente sur les bonnes fenêtres (vacances, événements, jours fériés) pour ne pas laisser de marge sur la table.`,
    },
    {
      question: 'Puis-je parler aux voyageurs dans StayManager ?',
      answer: `Pas pour l’instant : la messagerie reste sur les plateformes. Nous concentrons le produit sur ce qui fait gagner du cash-flow : organisation, ménage, pilotage — pas sur la duplication des OTA.`,
    },
    {
      question: "L'application fonctionne-t-elle sur mobile ?",
      answer: `Oui, 100 % web : ordinateur, tablette, smartphone. Aucune installation. Idéal entre deux visites ou quand il faut trancher sur un turnover.`,
    },
    {
      question: 'Le support est-il à la hauteur quand on scale ?',
      answer: `Oui : réponses rapides. Email sur Starter/Pro ; priorité WhatsApp sur Scale pour les volumes qui ne peuvent pas attendre.`,
    },
    {
      question: "Y a-t-il un engagement longue durée ?",
      answer: `Non. Mensuel, résiliable sans pénalité ni frais cachés. Nous préférons prouver la valeur chaque mois plutôt que vous enfermer dans un contrat.`,
    },
    {
      question: 'Comment se passe la facturation ?',
      answer: `Prélèvement mensuel automatique selon le plan (Starter, Pro, Scale), carte sécurisée, facture par email. Changement de plan possible quand votre parc évolue.`,
    },
  ],
}

const en: FaqCopy = {
  faqTitle: 'Frequently asked questions',
  faqSubtitle: 'Straight answers so you can decide fast—and move.',
  faqSeeMore: 'See more questions',
  faqSeeLess: 'See fewer questions',
  faqItems: [
    {
      question: 'Who is StayManager for?',
      answer: `Owners and concierge teams who want to industrialize short-term rentals—from 1 to 50+ units on Airbnb, Booking.com, or elsewhere. The goal: less manual admin, more nights sold, and clear visibility on profitability.`,
    },
    {
      question: 'How fast can we go live?',
      answer: `Fast. The product is built for rollout without UX debt: connect feeds, invite your team, and operate from day one. Support shortens time-to-value for larger portfolios.`,
    },
    {
      question: 'How do platform connections work?',
      answer: `Via iCal imports (Airbnb, Booking.com, etc.). Bookings, dates, and guest data sync automatically—fewer costly mistakes, faster reactions on every gap night.`,
    },
    {
      question: 'Is it a channel manager?',
      answer: `No. StayManager does not publish listings to OTAs. It is an operations layer: unified calendar, cleaning, metrics, tasks. Keep your distribution stack; we secure execution and margin.`,
    },
    {
      question: 'Can I scale across many units?',
      answer: `Yes. One dashboard for revenue, occupancy, and ops across the portfolio—critical if you add units without linear headcount growth.`,
    },
    {
      question: 'Can I track financial performance?',
      answer: `Yes: revenue, occupancy, ADR-style signals, and more so you decide quickly—where to invest in cleaning, where pricing upside still lives off-platform.`,
    },
    {
      question: 'How is cleaning managed?',
      answer: `End-to-end: per-property checklists, notes and photos for QA, schedules. Fewer guest issues, more reliable turnovers—protecting repeat revenue.`,
    },
    {
      question: 'Do cleaners get their own access?',
      answer: `Yes—scoped logins per assigned property. They see only what they need (tasks, notes, slots); you keep control and cut back-and-forth.`,
    },
    {
      question: 'Can I track consumables and purchasing?',
      answer: `Yes: per-unit lists (coffee, toilet paper, etc.), purchase tracking, sharing with vendors. Fewer stock-outs, better guest experience, less panic spend.`,
    },
    {
      question: 'Can I change rates inside the app?',
      answer: `Rates stay on Airbnb/Booking.com. On Pro, a guidance layer highlights high-demand windows (holidays, events) so you do not leave money on the table.`,
    },
    {
      question: 'Can I message guests in StayManager?',
      answer: `Not today—guest comms stay on the platforms. We focus the product on cash-flow drivers: ops, cleaning, steering—not duplicating OTAs.`,
    },
    {
      question: 'Does it work on mobile?',
      answer: `Yes—100% web on desktop, tablet, or phone. No install. Perfect between viewings or when a turnover decision cannot wait.`,
    },
    {
      question: 'Is support strong when we scale?',
      answer: `Yes—fast responses. Email on Starter/Pro; priority WhatsApp on Scale for teams that cannot afford downtime.`,
    },
    {
      question: 'Is there a long-term contract?',
      answer: `No. Monthly billing, cancel anytime without penalties or hidden fees. We earn retention by outcomes, not lock-in.`,
    },
    {
      question: 'How does billing work?',
      answer: `Monthly auto-billing by plan (Starter, Pro, Scale), secure card, invoice by email. Upgrade or downgrade as your portfolio changes.`,
    },
  ],
}

const es: FaqCopy = {
  faqTitle: 'Preguntas frecuentes',
  faqSubtitle: 'Respuestas claras para decidir y avanzar sin fricción.',
  faqSeeMore: 'Ver más preguntas',
  faqSeeLess: 'Ver menos preguntas',
  faqItems: [
    {
      question: '¿Para quién es StayManager?',
      answer: `Para propietarios y concierges que quieren industrializar el alquiler turístico: de 1 a 50+ viviendas en Airbnb, Booking.com u otros. Menos administración manual, más noches vendidas y visibilidad de rentabilidad.`,
    },
    {
      question: '¿Cuánto tarda en estar operativo?',
      answer: `Muy poco: interfaz pensada para escalar sin fricción. Conecta feeds, invita al equipo y opera desde el primer día. El soporte acelera el valor si el parque es grande.`,
    },
    {
      question: '¿Cómo se conecta con las plataformas?',
      answer: `Mediante iCal (Airbnb, Booking.com, etc.). Reservas, fechas y huéspedes entran solos: menos errores costosos y reacciones más rápidas a cada hueco.`,
    },
    {
      question: '¿Es un channel manager?',
      answer: `No. No publicamos anuncios en OTAs. Es una capa operativa: calendario, limpieza, métricas, tareas. Mantén tu distribución; nosotros aseguramos ejecución y margen.`,
    },
    {
      question: '¿Puedo escalar a muchas viviendas?',
      answer: `Sí. Un panel para ingresos, ocupación y operaciones de todo el parque—clave para crecer sin disparar el equipo interno.`,
    },
    {
      question: '¿Puedo seguir el rendimiento económico?',
      answer: `Sí: ingresos, ocupación, señales de precio para decidir rápido—dónde invertir en limpieza y dónde captar tarifa fuera de la OTA.`,
    },
    {
      question: '¿Cómo se gestiona la limpieza?',
      answer: `De punta a punta: listas por vivienda, notas y fotos de calidad, horarios. Menos incidencias, turnovers fiables—más ingresos recurrentes.`,
    },
    {
      question: '¿La empresa de limpieza tiene acceso propio?',
      answer: `Sí, acceso acotado a los bienes asignados: ven lo operativo, tú controlas datos y tiempos. Menos idas y vueltas.`,
    },
    {
      question: '¿Puedo gestionar consumibles?',
      answer: `Sí: listas por alojamiento, seguimiento de compras, compartir con proveedores. Menos roturas de stock, mejor experiencia, menos gasto improvisado.`,
    },
    {
      question: '¿Cambio tarifas desde la app?',
      answer: `Las tarifas siguen en Airbnb/Booking.com. En Pro, una capa guía ventanas fuertes (festivos, eventos) para no dejar dinero sobre la mesa.`,
    },
    {
      question: '¿Mensajería con huéspedes?',
      answer: `Aún no: los mensajes siguen en las plataformas. El producto se centra en operación, limpieza y control—no en duplicar OTAs.`,
    },
    {
      question: '¿Funciona en móvil?',
      answer: `Sí, 100 % web. Sin instalación. Útil entre visitas o cuando hay que decidir un turnover al momento.`,
    },
    {
      question: '¿El soporte acompaña al escalar?',
      answer: `Sí, respuestas rápidas. Email en Starter/Pro; WhatsApp prioritario en Scale para equipos de alto volumen.`,
    },
    {
      question: '¿Hay permanencia?',
      answer: `No. Mensual, sin penalizaciones ni letra pequeña. Preferimos retener por resultados, no por contrato.`,
    },
    {
      question: '¿Cómo es el cobro?',
      answer: `Mensual automático según plan, tarjeta segura, factura por email. Puedes cambiar de plan con el parque.`,
    },
  ],
}

const de: FaqCopy = {
  faqTitle: 'Häufige Fragen',
  faqSubtitle: 'Klare Antworten für schnelle Entscheidungen.',
  faqSeeMore: 'Weitere Fragen anzeigen',
  faqSeeLess: 'Weniger Fragen anzeigen',
  faqItems: [
    {
      question: 'Für wen ist StayManager?',
      answer: `Für Eigentümer und Concierge-Dienste, die Kurzzeitvermietung industrialisieren wollen—1 bis 50+ Objekte auf Airbnb, Booking.com oder woanders. Weniger manuelle Admin, mehr verkaufte Nächte, klare Rentabilität.`,
    },
    {
      question: 'Wie schnell startklar?',
      answer: `Sehr schnell: UX für Skalierung ohne Friktion. Feeds anbinden, Team einladen, sofort steuern. Support verkürzt Time-to-Value bei großen Beständen.`,
    },
    {
      question: 'Wie funktioniert die Anbindung?',
      answer: `Über iCal-Importe. Buchungen, Daten und Gäste fließen automatisch—weniger teure Fehler, schnellere Reaktion auf freie Nächte.`,
    },
    {
      question: 'Ist es ein Channel Manager?',
      answer: `Nein. Wir publizieren keine Inserate. StayManager ist die Betriebsebene: Kalender, Reinigung, Kennzahlen, Aufgaben. Distribution bleibt bei Ihnen; wir sichern Ausführung und Marge.`,
    },
    {
      question: 'Skalierung auf viele Objekte?',
      answer: `Ja. Ein Dashboard für Umsatz, Auslastung und Ops über das gesamte Portfolio—entscheidend beim Wachstum ohne lineare Personalspirale.`,
    },
    {
      question: 'Finanzperformance sichtbar?',
      answer: `Ja: Umsatz, Auslastung, Preissignale für schnelle Entscheidungen—wo Reinigung zahlt sich aus, wo Pricing-Potenzial liegt.`,
    },
    {
      question: 'Wie läuft Reinigung?',
      answer: `End-to-End: Checklisten pro Objekt, Notizen und Fotos für QA, Zeiten. Weniger Gästeprobleme, zuverlässigere Übergaben—stabiler wiederkehrender Umsatz.`,
    },
    {
      question: 'Eigenes Login für Reinigung?',
      answer: `Ja—rechtebasiert nur zugewiesene Objekte. Sie behalten Kontrolle, Kommunikation wird schlanker.`,
    },
    {
      question: 'Verbrauchsmaterial & Einkauf?',
      answer: `Ja: Listen pro Objekt, Nachverfolgung, Teilen mit Dienstleistern. Weniger Engpässe, bessere Gästeerfahrung.`,
    },
    {
      question: 'Preise in der App ändern?',
      answer: `Preise bleiben auf den Plattformen. Pro liefert Hinweise zu Hochlastfenstern (Ferien, Events), damit Umsatz nicht liegen bleibt.`,
    },
    {
      question: 'Gäste-Kommunikation in der App?',
      answer: `Noch nicht—läuft über die Portale. Fokus: Ops, Reinigung, Steuerung.`,
    },
    {
      question: 'Mobile Nutzung?',
      answer: `Ja, 100 % Web. Keine Installation—ideal unterwegs.`,
    },
    {
      question: 'Support beim Skalieren?',
      answer: `Ja, schnell. E-Mail Starter/Pro; WhatsApp-Priorität bei Scale.`,
    },
    {
      question: 'Bindung?',
      answer: `Nein. Monatlich kündbar ohne Strafen oder versteckte Gebühren.`,
    },
    {
      question: 'Abrechnung?',
      answer: `Monatlich automatisch je Plan, sichere Kartenzahlung, Rechnung per E-Mail. Planwechsel jederzeit.`,
    },
  ],
}

const it: FaqCopy = {
  faqTitle: 'Domande frequenti',
  faqSubtitle: 'Risposte nette per decidere e andare avanti.',
  faqSeeMore: 'Mostra altre domande',
  faqSeeLess: 'Mostra meno domande',
  faqItems: [
    {
      question: 'Per chi è StayManager?',
      answer: `Per proprietari e concierge che vogliono industrializzare gli affitti brevi—da 1 a 50+ unità su Airbnb, Booking.com o altro. Meno admin manuale, più notti vendute, chiarezza di marginalità.`,
    },
    {
      question: 'Quanto ci vuole per partire?',
      answer: `Poco: UX pensata per scalare senza attriti. Colleghi i feed, inviti il team, operi subito. Il supporto riduce il time-to-value sui grandi portafogli.`,
    },
    {
      question: 'Come funziona il collegamento?',
      answer: `Tramite iCal: prenotazioni, date e ospiti arrivano da soli—meno errori costosi, reazioni più rapide su ogni buco di calendario.`,
    },
    {
      question: 'È un channel manager?',
      answer: `No: non pubblichiamo annunci. È il layer operativo—calendario, pulizie, metriche, task. La distribuzione resta sulle OTA; noi mettiamo ordine e margine.`,
    },
    {
      question: 'Posso scalare su tanti immobili?',
      answer: `Sì: un cruscotto per fatturato, occupazione e operatività su tutto il parco—fondamentale per crescere senza far esplodere il team.`,
    },
    {
      question: 'Posso monitorare le performance economiche?',
      answer: `Sì: ricavi, occupazione, segnali di prezzo per decidere in fretta—dove investire in pulizie e dove recuperare tariffa.`,
    },
    {
      question: 'Come gestite le pulizie?',
      answer: `End-to-end: checklist per alloggio, note e foto qualità, orari. Meno contestazioni ospiti, turnover affidabili—ricavi ricorrenti protetti.`,
    },
    {
      question: 'Accesso dedicato alle pulizie?',
      answer: `Sì, profilato sugli immobili assegnati: vedono l’operativo, voi tenete il controllo e riducete i ping-pong.`,
    },
    {
      question: 'Consumabili e acquisti?',
      answer: `Sì: liste per unità, stato acquisti, condivisione con fornitori. Meno rotture stock, migliore guest experience.`,
    },
    {
      question: 'Modifico i prezzi nell’app?',
      answer: `I prezzi restano sulle piattaforme. Il piano Pro indica finestre forti (festività, eventi) per non lasciare margine sul tavolo.`,
    },
    {
      question: 'Messaggistica ospiti?',
      answer: `Non ancora: resta sulle OTA. Focus su ops, pulizie, controllo.`,
    },
    {
      question: 'Funziona da mobile?',
      answer: `Sì, 100 % web, zero install—ideale tra un sopralluogo e l’altro.`,
    },
    {
      question: 'Supporto in crescita?',
      answer: `Sì, risposte rapide. Email Starter/Pro; WhatsApp prioritario su Scale.`,
    },
    {
      question: 'Vincoli contrattuali?',
      answer: `No: mensile, disdetta senza penali o costi nascosti.`,
    },
    {
      question: 'Fatturazione?',
      answer: `Addebito mensile automatico per piano, carta sicura, fattura via email. Cambio piano quando serve.`,
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
