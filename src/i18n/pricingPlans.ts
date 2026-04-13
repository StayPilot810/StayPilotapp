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
}

const fr: PricingPlansCopy = {
  roiBadge: 'Le plus de marge remboursée',
  popularBadge: 'Le plus choisi pour scaler',
  planTrial: '14 jours gratuits — commencez ce soir',
  planCta: 'Accéder à mon dashboard',
  starterName: 'Starter',
  starterRange: '1 à 3 logements',
  starterPrice: '8€',
  starterPriceSuffix: '/ logement / mois',
  starterFeatures: [
    'Calendrier unique Airbnb + Booking → moins de double résa, moins d’indemnités',
    'Vue encaissements + remplissage pour monter le prix au bon moment',
    'Essai gratuit 14 jours — réponses support quand ça bloque',
  ],
  proName: 'Pro',
  proRange: '3 à 10 logements',
  proPrice: '59€',
  proPriceSuffix: '/ mois',
  proFeatures: [
    'Tout Starter + automatisations qui vous rendent des heures sur le hors-cash',
    'Signaux prix (vacances, événements) pour ne pas laisser de ADR sur la table',
    'Ligne directe ménage : photos, horaires → moins d’avis qui coûtent des nuits',
    'Support prioritaire — on accélère quand votre calendrier est sous pression',
    'Rapports marge par bien : vous tranchez où investir la prochaine euro',
    'Listes consommables par logement → moins de ruptures qui cassent la note',
    'Checklists départ / arrivée par appart → turnovers qui protègent le RevPAR',
    'Pilotage ménage bout-en-bout pour remplir le mois suivant plus vite',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 logements',
  scalePrice: '99€',
  scalePriceSuffix: '/ mois',
  scaleFeatures: [
    'Tout Pro',
    'Flux multi-biens pour ajouter des clés sans saturer votre équipe',
    'Tableaux rentabilité & charge pour voir quelle unité finance la croissance',
    'WhatsApp prioritaire — quand chaque minute coûte une résa',
    'Accès anticipé aux nouveautés qui poussent encaissement & occupation',
  ],
}

const en: PricingPlansCopy = {
  roiBadge: 'Fastest path to paid nights',
  popularBadge: 'Teams scaling on this',
  planTrial: '14 days free—start tonight',
  planCta: 'Unlock this plan',
  starterName: 'Starter',
  starterRange: '1–3 units',
  starterPrice: '€8',
  starterPriceSuffix: '/ unit / month',
  starterFeatures: [
    'Single Airbnb + Booking calendar—fewer double bookings, fewer refunds',
    'Payout + fill-rate view so you raise rates when demand spikes',
    '14-day free trial—support jumps in when you are stuck',
  ],
  proName: 'Pro',
  proRange: '3–10 units',
  proPrice: '€59',
  proPriceSuffix: '/ month',
  proFeatures: [
    'Everything in Starter + automations that claw back non-revenue hours',
    'Pricing signals (holidays, events) so you stop leaving ADR on the table',
    'Cleaner hotline—photos, schedules—fewer reviews that cost you comp nights',
    'Priority support—we move fast when your calendar is under pressure',
    'Per-unit margin reports—see where the next euro should go',
    'Consumables lists per unit—fewer stockouts that tank ratings',
    'Arrival/departure checklists per apartment—turnovers that protect RevPAR',
    'End-to-end cleaning ops to refill next month at peak rate',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ units',
  scalePrice: '€99',
  scalePriceSuffix: '/ month',
  scaleFeatures: [
    'Everything in Pro',
    'Multi-unit workflows to add keys without maxing your team',
    'Profitability + load views—see which unit funds the next acquisition',
    'Priority WhatsApp—when every minute costs a booking',
    'Early access to drops that push payouts and occupancy',
  ],
}

const es: PricingPlansCopy = {
  roiBadge: 'Más noches pagadas rápido',
  popularBadge: 'El que eligen al escalar',
  planTrial: '14 días gratis — empiece hoy',
  planCta: 'Activar este plan',
  starterName: 'Starter',
  starterRange: '1 a 3 viviendas',
  starterPrice: '8€',
  starterPriceSuffix: '/ vivienda / mes',
  starterFeatures: [
    'Calendario único Airbnb + Booking → menos doble reserva, menos reembolsos',
    'Vista cobros + ocupación para subir precio cuando pica la demanda',
    'Prueba 14 días gratis — soporte cuando atasca',
  ],
  proName: 'Pro',
  proRange: '3 a 10 viviendas',
  proPrice: '59€',
  proPriceSuffix: '/ mes',
  proFeatures: [
    'Todo Starter + automatizaciones que devuelven horas fuera del cash',
    'Señales de precio (festivos, eventos) para no regalar ADR',
    'Canal limpieza con fotos y horarios → menos reseñas caras',
    'Soporte prioritario — aceleramos con calendario bajo presión',
    'Informes de margen por vivienda — vea dónde invertir el próximo euro',
    'Listas de consumibles por piso — menos roturas que tumban la nota',
    'Checklists entrada/salida por apartamento — turnovers que protegen RevPAR',
    'Ops de limpieza de punta a punta para llenar el mes siguiente',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 viviendas',
  scalePrice: '99€',
  scalePriceSuffix: '/ mes',
  scaleFeatures: [
    'Todo Pro',
    'Flujos multi-vivienda para sumar llaves sin fundir al equipo',
    'Cuadros de rentabilidad y carga — qué unidad paga la siguiente compra',
    'WhatsApp prioritario — cuando cada minuto cuesta una reserva',
    'Acceso anticipado a novedades que empujan cobro y ocupación',
  ],
}

const de: PricingPlansCopy = {
  roiBadge: 'Schnellste bezahlte Nächte',
  popularBadge: 'Wahl beim Skalieren',
  planTrial: '14 Tage gratis — heute starten',
  planCta: 'Plan freischalten',
  starterName: 'Starter',
  starterRange: '1–3 Objekte',
  starterPrice: '8€',
  starterPriceSuffix: '/ Objekt / Monat',
  starterFeatures: [
    'Ein Kalender Airbnb + Booking — weniger Doppelbuchung, weniger Erstattung',
    'Auszahlung + Füllung sehen — Preis anheben, wenn Nachfrage springt',
    '14 Tage gratis testen — Support, wenn es hakt',
  ],
  proName: 'Pro',
  proRange: '3–10 Objekte',
  proPrice: '59€',
  proPriceSuffix: '/ Monat',
  proFeatures: [
    'Alles aus Starter + Automatisierung holt Nicht-Cash-Zeit zurück',
    'Pricing-Signale (Feiertage, Events) — kein ADR auf dem Tisch lassen',
    'Reinigungs-Hotline mit Fotos & Zeiten — weniger teure Reviews',
    'Prioritäts-Support — schnell, wenn der Kalender brennt',
    'Marge pro Objekt — wo der nächste Euro hin soll',
    'Verbrauchsmaterial-Listen pro Unit — weniger Stockouts, die Bewertungen killen',
    'Checklisten Anreise/Abreise pro Apartment — Übergaben schützen RevPAR',
    'Reinigungs-Ops end-to-end, um den nächsten Monat voll zu bekommen',
  ],
  scaleName: 'Scale',
  scaleRange: '10+ Objekte',
  scalePrice: '99€',
  scalePriceSuffix: '/ Monat',
  scaleFeatures: [
    'Alles aus Pro',
    'Multi-Objekt-Flows — mehr Schlüssel ohne Team-Overload',
    'Rentabilitäts- & Last-Ansicht — welche Einheit finanziert den nächsten Kauf',
    'Prioritäts-WhatsApp — wenn jede Minute eine Buchung kostet',
    'Early Access auf Features für Auszahlung & Auslastung',
  ],
}

const it: PricingPlansCopy = {
  roiBadge: 'Più notti pagate, più in fretta',
  popularBadge: 'Scelto per scalare',
  planTrial: '14 giorni gratis — iniziate stasera',
  planCta: 'Sbloccare questo piano',
  starterName: 'Starter',
  starterRange: '1–3 immobili',
  starterPrice: '8€',
  starterPriceSuffix: '/ immobile / mese',
  starterFeatures: [
    'Calendario unico Airbnb + Booking → meno doppie prenotazioni, meno rimborsi',
    'Vista incassi + riempimento per alzare il prezzo quando la domanda sale',
    'Prova 14 giorni gratis — supporto quando si blocca',
  ],
  proName: 'Pro',
  proRange: '3–10 immobili',
  proPrice: '59€',
  proPriceSuffix: '/ mese',
  proFeatures: [
    'Tutto Starter + automazioni che recuperano ore fuori dal cash',
    'Segnali prezzo (festivi, eventi) per non regalare ADR',
    'Canale pulizie con foto e orari → meno recensioni che costano notti',
    'Supporto prioritario — acceleriamo con calendario sotto pressione',
    'Report margine per immobile — dove investire il prossimo euro',
    'Liste consumabili per unità — meno rotture che affossano il voto',
    'Checklist in/out per appartamento — turnover che proteggono il RevPAR',
    'Ops pulizie end-to-end per riempire il mese dopo',
  ],
  scaleName: 'Scale',
  scaleRange: '+10 immobili',
  scalePrice: '99€',
  scalePriceSuffix: '/ mese',
  scaleFeatures: [
    'Tutto Pro',
    'Flussi multi-immobile per aggiungere chiavi senza fondere il team',
    'Viste redditività e carico — quale unità paga il prossimo acquisto',
    'WhatsApp prioritario — quando ogni minuto costa una prenotazione',
    'Accesso anticipato alle novità su incasso e occupazione',
  ],
}

export const pricingPlansTranslations: Record<Locale, PricingPlansCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
