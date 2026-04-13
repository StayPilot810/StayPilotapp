import type { Locale } from './navbar'

export type WhyBenefit = {
  title: string
  body: string
}

export type WhyStayPilotCopy = {
  whySectionTitle: string
  whySectionSubtitle: string
  whyBenefits: [WhyBenefit, WhyBenefit, WhyBenefit, WhyBenefit]
}

const fr: WhyStayPilotCopy = {
  whySectionTitle: 'Hôte Airbnb : reprenez le contrôle de votre temps et de votre encaisse',
  whySectionSubtitle:
    'Vous voulez scaler, voyager, dormir — pas passer vos soirées sur trois onglets. StayPilot est le cockpit qui transforme vos annonces en cash récurrent, sans vous embaucher vous-même comme coordinateur.',
  whyBenefits: [
    {
      title: 'Jusqu’à +18 % de RevPAR quand vous jouez prix + calendrier serré',
      body: 'Ce n’est pas « une appli de plus » : c’est + de nuits au bon tarif. Quand la demande monte, vous êtes déjà prêt — pas en train de rattraper le ménage.',
    },
    {
      title: 'Airbnb + Booking : une seule vérité = zéro nuit offerte au client furieux',
      body: 'Double résa et trous entre deux séjours coûtent plus cher qu’un abonnement. Un calendrier maître, c’est du cash préservé et des avis qui restent verts.',
    },
    {
      title: '8 h / semaine à réinvestir dans votre liberté — ou dans l’achat de la prochaine clé',
      body: 'Moins de relances, moins de copier-coller, moins de « tu as bien fini le ménage ? ». Vous pilotez ; vous ne courez plus après l’opérationnel.',
    },
    {
      title: 'Des départs nickel → des notes qui vous remplissent le mois suivant',
      body: 'Chaque checkout déclenche le flux : photos, horaires, consignes. Moins d’incidents = plus de réservations futures au prix fort.',
    },
  ],
}

const en: WhyStayPilotCopy = {
  whySectionTitle: 'Airbnb host: take back your time and your payout',
  whySectionSubtitle:
    'You want to scale, travel, sleep—not live in three browser tabs. StayPilot is the cockpit that turns listings into recurring cash without hiring yourself as night coordinator.',
  whyBenefits: [
    {
      title: 'Up to +18% RevPAR when you tighten pricing + calendar discipline',
      body: 'Not another app to babysit—more nights at the right ADR. When demand spikes you are ready, not scrambling cleaners.',
    },
    {
      title: 'Airbnb + Booking: one truth—no comp nights for angry guests',
      body: 'Double bookings and calendar gaps cost more than software. A master calendar protects cash and keeps reviews green.',
    },
    {
      title: '8 hours/week to reinvest in freedom—or your next unit',
      body: 'Fewer follow-ups, less copy-paste, fewer “did cleaning finish?” pings. You command ops—you do not chase them.',
    },
    {
      title: 'Clean handoffs → ratings that refill next month at peak rate',
      body: 'Every checkout kicks the workflow: photos, timing, instructions. Fewer fires means more future bookings at full price.',
    },
  ],
}

const es: WhyStayPilotCopy = {
  whySectionTitle: 'Anfitrión Airbnb: recupere su tiempo y su cobro',
  whySectionSubtitle:
    'Quiere escalar, viajar, dormir — no vivir en tres pestañas. StayPilot es la cabina que convierte anuncios en cash recurrente sin contratarse usted como coordinador.',
  whyBenefits: [
    {
      title: 'Hasta +18 % RevPAR al afinar precio + calendario',
      body: 'No es «otra app»: son más noches al ADR correcto. Cuando sube la demanda, usted está listo — no persiguiendo la limpieza.',
    },
    {
      title: 'Airbnb + Booking: una verdad — cero noches gratis por enfado',
      body: 'Doble reserva y huecos cuestan más que el software. Un calendario maestro protege el cash y las reseñas.',
    },
    {
      title: '8 h / semana para libertad — o para la próxima llave',
      body: 'Menos follow-ups, menos copiar-pegar, menos «¿terminó la limpieza?». Usted manda la operación — no la persigue.',
    },
    {
      title: 'Salidas impecables → notas que llenan el mes siguiente a tarifa plena',
      body: 'Cada salida dispara el flujo: fotos, horarios, instrucciones. Menos incendios = más reservas futuras al precio fuerte.',
    },
  ],
}

const de: WhyStayPilotCopy = {
  whySectionTitle: 'Airbnb-Gastgeber: holen Sie Zeit und Auszahlung zurück',
  whySectionSubtitle:
    'Sie wollen skalieren, reisen, schlafen — nicht in drei Tabs leben. StayPilot ist das Cockpit, das Listings in wiederkehrenden Cashflow verwandelt — ohne sich selbst als Nacht-Koordinator einzustellen.',
  whyBenefits: [
    {
      title: 'Bis zu +18 % RevPAR bei diszipliniertem Pricing + Kalender',
      body: 'Keine weitere App zum Hüten — mehr Nächte zum richtigen ADR. Wenn Nachfrage springt, sind Sie bereit — nicht hinter der Reinigung her.',
    },
    {
      title: 'Airbnb + Booking: eine Wahrheit — keine Gratisnächte für wütende Gäste',
      body: 'Doppelbuchungen und Lücken kosten mehr als Software. Ein Master-Kalender schützt Cash und Bewertungen.',
    },
    {
      title: '8 Std./Woche für Freiheit — oder die nächste Immobilie',
      body: 'Weniger Follow-ups, weniger Copy-Paste, weniger „Reinigung fertig?“. Sie steuern Ops — Sie jagen sie nicht.',
    },
    {
      title: 'Saubere Übergaben → Bewertungen, die den nächsten Monat zum Top-Preis füllen',
      body: 'Jeder Check-out startet den Flow: Fotos, Zeiten, Anweisungen. Weniger Feuer = mehr Folgebuchungen zum vollen Preis.',
    },
  ],
}

const it: WhyStayPilotCopy = {
  whySectionTitle: 'Host Airbnb: riprendete tempo e incassi',
  whySectionSubtitle:
    'Volete scalare, viaggiare, dormire — non vivere su tre tab. StayPilot è la cabina che trasforma gli annunci in cash ricorrente senza assumervi come coordinatori notturni.',
  whyBenefits: [
    {
      title: 'Fino a +18 % RevPAR con prezzo + calendario serrati',
      body: 'Non è «un’altra app»: sono più notti all’ADR giusto. Quando la domanda sale, siete pronti — non a rincorrere le pulizie.',
    },
    {
      title: 'Airbnb + Booking: una verità — zero notti omaggio agli ospiti furiosi',
      body: 'Doppie prenotazioni e buchi costano più del software. Un calendario master protegge cash e recensioni.',
    },
    {
      title: '8 h / settimana per la libertà — o per la prossima chiave',
      body: 'Meno follow-up, meno copia-incolla, meno «pulizie finite?». Comandate l’ops — non la rincorrete.',
    },
    {
      title: 'Passaggi impeccabili → voti che riempiono il mese dopo a tariffa piena',
      body: 'Ogni check-out avvia il flusso: foto, orari, istruzioni. Meno incendi = più prenotazioni future al prezzo pieno.',
    },
  ],
}

export const whyStayPilotTranslations: Record<Locale, WhyStayPilotCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
