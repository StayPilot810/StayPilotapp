import type { Locale } from './navbar'

export type PricingPlansCopy = {
  /** Badge doré au-dessus de la carte Pro (rentabilité) */
  roiBadge: string
  /** Pastille secondaire sur le plan Pro (preuve sociale) */
  popularBadge: string
  planTrial: string
  planCta: string
  starterName: string
  starterRange: string
  starterPrice: string
  starterPriceSuffix: string
  starterFeatures: string[]
  proName: string
  proRange: string
  proPrice: string
  proPriceSuffix: string
  proFeatures: string[]
  scaleName: string
  scaleRange: string
  scalePrice: string
  scalePriceSuffix: string
  scaleFeatures: string[]
  mandatoryChannelManagerNote: string
}

const fr: PricingPlansCopy = {
  roiBadge: 'Le plus de marge remboursée',
  popularBadge: 'Le plus choisi pour scaler',
  planTrial: '14 jours gratuits — sans engagement',
  planCta: 'Accéder à mon dashboard',
  starterName: 'Starter',
  starterRange: '1 à 3 logements',
  starterPrice: '19,99€',
  starterPriceSuffix: '/ mois',
  starterFeatures: [
    'Calendrier unique Airbnb + Booking → moins de double résa, moins d’indemnités',
    'Statistiques encaissement + taux d’occupation (par logement) pour ajuster le prix au bon moment',
    'Page prestataire ménage : photos, horaires, checklists départ / arrivée, pilotage bout-en-bout',
    'Listes consommables par logement → moins de ruptures qui cassent la note',
    'Agent IA personnalisé qui se souvient du contexte client et aide à closer plus vite',
    'Rapport hebdomadaire/mensuel: réservations, check-in/out, évolution vs période -1 et actions prix',
    'Essai gratuit 14 jours — réponses support quand ça bloque',
  ],
  proName: 'Pro',
  proRange: '3 à 10 logements',
  proPrice: '59,99€',
  proPriceSuffix: '/ mois',
  proFeatures: [
    'Tout Starter + automatisations qui vous rendent des heures sur le hors-cash',
    'Signaux prix (vacances, événements) pour ne pas laisser de ADR sur la table',
    'Veille informationnelle sur vos logements (événements, contexte local)',
    'Support prioritaire — on accélère quand votre calendrier est sous pression',
    'Rapports marge par bien : vous tranchez où investir le prochain euro',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 logements',
  scalePrice: '99,99€',
  scalePriceSuffix: '/ mois',
  scaleFeatures: [
    'Tout Pro',
    'Flux multi-biens pour ajouter des clés sans saturer votre équipe',
    'Tableaux rentabilité & charge pour voir quelle unité finance la croissance',
    'WhatsApp prioritaire — quand chaque minute coûte une résa',
    'Accès anticipé aux nouveautés qui poussent encaissement & occupation',
  ],
  mandatoryChannelManagerNote:
    'Channel manager obligatoire pour accéder à StayPilot : Beds24, Hostaway, Guesty ou Lodgify.',
}

const en: PricingPlansCopy = {
  roiBadge: 'Fastest path to paid nights',
  popularBadge: 'Teams scaling on this',
  planTrial: '14 days free—no commitment',
  planCta: 'Unlock this plan',
  starterName: 'Starter',
  starterRange: '1–3 units',
  starterPrice: '€19.99',
  starterPriceSuffix: '/ unit / month',
  starterFeatures: [
    'Single Airbnb + Booking calendar—fewer double bookings, fewer refunds',
    'Revenue stats + occupancy rate per unit so you raise rates when demand spikes',
    'Cleaning provider workspace—photos, schedules, arrival/departure checklists, end-to-end ops',
    'Consumables lists per unit—fewer stockouts that tank ratings',
    'Personalized AI agent that remembers client context to help close faster',
    'Weekly/monthly report: reservations, check-ins/outs, period-1 trend and pricing actions',
    '14-day free trial—support jumps in when you are stuck',
  ],
  proName: 'Pro',
  proRange: '3–10 units',
  proPrice: '€59.99',
  proPriceSuffix: '/ month',
  proFeatures: [
    'Everything in Starter + automations that claw back non-revenue hours',
    'Pricing signals (holidays, events) so you stop leaving ADR on the table',
    'Informational monitoring for your listings (events, local context)',
    'Priority support—we move fast when your calendar is under pressure',
    'Per-unit margin reports—see where the next euro should go',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ units',
  scalePrice: '€99.99',
  scalePriceSuffix: '/ month',
  scaleFeatures: [
    'Everything in Pro',
    'Multi-unit workflows to add keys without maxing your team',
    'Profitability + load views—see which unit funds the next acquisition',
    'Priority WhatsApp—when every minute costs a booking',
    'Early access to drops that push payouts and occupancy',
  ],
  mandatoryChannelManagerNote:
    'A channel manager is required to use StayPilot: Beds24, Hostaway, Guesty, or Lodgify.',
}

const es: PricingPlansCopy = {
  roiBadge: 'Más noches pagadas rápido',
  popularBadge: 'El que eligen al escalar',
  planTrial: '14 días gratis — sin compromiso',
  planCta: 'Activar este plan',
  starterName: 'Starter',
  starterRange: '1 a 3 viviendas',
  starterPrice: '19,99€',
  starterPriceSuffix: '/ vivienda / mes',
  starterFeatures: [
    'Calendario único Airbnb + Booking → menos doble reserva, menos reembolsos',
    'Estadísticas de cobro + tasa de ocupación por vivienda para ajustar precio a tiempo',
    'Espacio proveedor de limpieza: fotos, horarios, checklists entrada/salida, pilotaje completo',
    'Listas de consumibles por vivienda — menos roturas que tumban la nota',
    'Agente IA personalizado que recuerda el contexto del cliente para cerrar antes',
    'Informe semanal/mensual: reservas, check-in/out, variación vs periodo-1 y acciones de precio',
    'Prueba 14 días gratis — soporte cuando atasca',
  ],
  proName: 'Pro',
  proRange: '3 a 10 viviendas',
  proPrice: '59,99€',
  proPriceSuffix: '/ mes',
  proFeatures: [
    'Todo Starter + automatizaciones que devuelven horas fuera del cash',
    'Señales de precio (festivos, eventos) para no regalar ADR',
    'Vigilancia informativa sobre sus alojamientos (eventos, contexto local)',
    'Soporte prioritario — aceleramos con calendario bajo presión',
    'Informes de margen por vivienda — vea dónde invertir el próximo euro',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 viviendas',
  scalePrice: '99,99€',
  scalePriceSuffix: '/ mes',
  scaleFeatures: [
    'Todo Pro',
    'Flujos multi-vivienda para sumar llaves sin fundir al equipo',
    'Cuadros de rentabilidad y carga — qué unidad paga la siguiente compra',
    'WhatsApp prioritario — cuando cada minuto cuesta una reserva',
    'Acceso anticipado a novedades que empujan cobro y ocupación',
  ],
  mandatoryChannelManagerNote:
    'Channel manager obligatorio para usar StayPilot: Beds24, Hostaway, Guesty o Lodgify.',
}

const de: PricingPlansCopy = {
  roiBadge: 'Schnellste bezahlte Nächte',
  popularBadge: 'Wahl beim Skalieren',
  planTrial: '14 Tage gratis — ohne Bindung',
  planCta: 'Plan freischalten',
  starterName: 'Starter',
  starterRange: '1–3 Objekte',
  starterPrice: '19,99€',
  starterPriceSuffix: '/ Objekt / Monat',
  starterFeatures: [
    'Ein Kalender Airbnb + Booking — weniger Doppelbuchung, weniger Erstattung',
    'Umsatzstatistik + Auslastung pro Objekt — Preise anpassen, wenn Nachfrage springt',
    'Reinigungsdienst-Bereich: Fotos, Zeiten, An-/Abreise-Checklisten, End-to-End-Steuerung',
    'Verbrauchsmaterial-Listen pro Unterkunft — weniger Stockouts, die Bewertungen killen',
    'Personalisierter KI-Agent, der Kundentexte merkt und beim Abschluss hilft',
    'Wochen-/Monatsreport: Buchungen, Check-in/out, Trend vs. Periode-1 und Preisaktionen',
    '14 Tage gratis testen — Support, wenn es hakt',
  ],
  proName: 'Pro',
  proRange: '3–10 Objekte',
  proPrice: '59,99€',
  proPriceSuffix: '/ Monat',
  proFeatures: [
    'Alles aus Starter + Automatisierung holt Nicht-Cash-Zeit zurück',
    'Pricing-Signale (Feiertage, Events) — kein ADR auf dem Tisch lassen',
    'Informations-Monitoring zu Ihren Unterkünften (Events, lokaler Kontext)',
    'Prioritäts-Support — schnell, wenn der Kalender brennt',
    'Marge pro Objekt — wo der nächste Euro hin soll',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ Objekte',
  scalePrice: '99,99€',
  scalePriceSuffix: '/ Monat',
  scaleFeatures: [
    'Alles aus Pro',
    'Multi-Objekt-Flows — mehr Schlüssel ohne Team-Overload',
    'Rentabilitäts- & Last-Ansicht — welche Einheit finanziert den nächsten Kauf',
    'Prioritäts-WhatsApp — wenn jede Minute eine Buchung kostet',
    'Early Access auf Features für Auszahlung & Auslastung',
  ],
  mandatoryChannelManagerNote:
    'Für StayPilot ist ein Channel-Manager erforderlich: Beds24, Hostaway, Guesty oder Lodgify.',
}

const it: PricingPlansCopy = {
  roiBadge: 'Più notti pagate, più in fretta',
  popularBadge: 'Scelto per scalare',
  planTrial: '14 giorni gratis — senza impegno',
  planCta: 'Sbloccare questo piano',
  starterName: 'Starter',
  starterRange: '1–3 immobili',
  starterPrice: '19,99€',
  starterPriceSuffix: '/ immobile / mese',
  starterFeatures: [
    'Calendario unico Airbnb + Booking → meno doppie prenotazioni, meno rimborsi',
    'Statistiche incassi + tasso di occupazione per immobile per aggiustare il prezzo al momento giusto',
    'Area fornitore pulizie: foto, orari, checklist in/out, gestione end-to-end',
    'Liste consumabili per alloggio — meno rotture che affossano il voto',
    'Agente IA personalizzato che ricorda il contesto cliente per chiudere prima',
    'Report settimanale/mensile: prenotazioni, check-in/out, trend vs periodo-1 e azioni prezzo',
    'Prova 14 giorni gratis — supporto quando si blocca',
  ],
  proName: 'Pro',
  proRange: '3–10 immobili',
  proPrice: '59,99€',
  proPriceSuffix: '/ mese',
  proFeatures: [
    'Tutto Starter + automazioni che recuperano ore fuori dal cash',
    'Segnali prezzo (festivi, eventi) per non regalare ADR',
    'Monitoraggio informativo sui tuoi alloggi (eventi, contesto locale)',
    'Supporto prioritario — acceleriamo con calendario sotto pressione',
    'Report margine per immobile — dove investire il prossimo euro',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 immobili',
  scalePrice: '99,99€',
  scalePriceSuffix: '/ mese',
  scaleFeatures: [
    'Tutto Pro',
    'Flussi multi-immobile per aggiungere chiavi senza fondere il team',
    'Viste redditività e carico — quale unità paga il prossimo acquisto',
    'WhatsApp prioritario — quando ogni minuto costa una prenotazione',
    'Accesso anticipato alle novità su incasso e occupazione',
  ],
  mandatoryChannelManagerNote:
    'Per usare StayPilot è obbligatorio un channel manager: Beds24, Hostaway, Guesty o Lodgify.',
}

export const pricingPlansTranslations: Record<Locale, PricingPlansCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
