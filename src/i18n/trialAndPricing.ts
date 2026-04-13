import type { Locale } from './navbar'

export type TrialPricingCopy = {
  ctaTitle: string
  ctaSubtitle: string
  ctaButton: string
  ctaFinePrint: string
  pricingTitle: string
  pricingSubtitle: string
  starterOutcome: string
  proOutcome: string
  scaleOutcome: string
}

export const trialAndPricingTranslations: Record<Locale, TrialPricingCopy> = {
  fr: {
    ctaTitle: 'Ce soir encore, un concurrent remplit votre créneau. Ou vous.',
    ctaSubtitle:
      '14 jours gratuits, sans blague : branchez Airbnb & Booking, voyez vos trous de calendrier et votre marge sur un écran. Si ça ne vous fait pas encaisser plus vite, vous ne payez rien.',
    ctaButton: 'Réserver mon essai gratuit — 14 jours',
    ctaFinePrint: '14 jours pour voir les trous disparaître • Zéro engagement : stop en un clic avant la facturation',
    pricingTitle: 'Choisissez le plan qui multiplie vos nuits payantes',
    pricingSubtitle:
      'Vous payez au nombre de clés — vous gagnez sur chaque nuit vendue au bon prix. Pas de frais cachés, pas d’engagement qui vous coince.',
    starterOutcome: 'Idéal pour éviter les erreurs et centraliser vos réservations',
    proOutcome: 'Optimise vos prix et vous fait gagner du temps chaque semaine',
    scaleOutcome: 'Conçu pour maximiser les revenus de plusieurs logements',
  },
  es: {
    ctaTitle: 'Esta noche otro host ocupa su hueco. ¿O lo ocupa usted?',
    ctaSubtitle:
      '14 días gratis: conecte Airbnb y Booking, vea huecos y margen en una pantalla. Si no cobra más rápido, no paga.',
    ctaButton: 'Activar prueba gratis — 14 días',
    ctaFinePrint: '14 días para ver cómo se cierran los huecos • Sin ataduras: baja en un clic antes del cargo',
    pricingTitle: 'Elija el plan que multiplique sus noches pagadas',
    pricingSubtitle:
      'Paga por llaves — gana por cada noche al precio correcto. Sin letra pequeña, sin ataduras.',
    starterOutcome: 'Ideal para evitar errores y centralizar sus reservas',
    proOutcome: 'Optimiza sus precios y le ahorra tiempo cada semana',
    scaleOutcome: 'Diseñado para maximizar los ingresos de varios alojamientos',
  },
  en: {
    ctaTitle: 'Tonight someone else books that gap—or you do. Pick.',
    ctaSubtitle:
      '14 days free, no tricks: plug Airbnb & Booking, see your calendar holes and margin on one screen. If it does not help you collect faster, you pay nothing.',
    ctaButton: 'Claim my free 14-day trial',
    ctaFinePrint: '14 days to watch gaps close • No lock-in—cancel in one click before billing hits',
    pricingTitle: 'Pick the plan that multiplies paid nights',
    pricingSubtitle:
      'You pay per key—you earn on every night sold at the right rate. No hidden fees, no lock-in games.',
    starterOutcome: 'Ideal to avoid mistakes and centralize your bookings',
    proOutcome: 'Optimizes your pricing and saves you time every week',
    scaleOutcome: 'Built to maximize revenue across multiple properties',
  },
  de: {
    ctaTitle: 'Heute Abend bucht ein anderer Ihre Lücke — oder Sie.',
    ctaSubtitle:
      '14 Tage gratis: Airbnb & Booking anbinden, Lücken und Marge auf einem Screen. Wenn Sie nicht schneller kassieren, zahlen Sie nichts.',
    ctaButton: 'Gratis-Test sichern — 14 Tage',
    ctaFinePrint: '14 Tage, um Lücken zu schließen • Kein Lock-in — Kündigung mit einem Klick vor der Rechnung',
    pricingTitle: 'Wählen Sie den Plan, der bezahlte Nächte multipliziert',
    pricingSubtitle:
      'Zahlen pro Schlüssel — verdienen pro richtig verkaufter Nacht. Keine versteckten Gebühren, keine Knebelverträge.',
    starterOutcome: 'Ideal, um Fehler zu vermeiden und Buchungen zu zentralisieren',
    proOutcome: 'Optimiert Ihre Preise und spart jede Woche Zeit',
    scaleOutcome: 'Entwickelt, um den Umsatz mehrerer Unterkünfte zu maximieren',
  },
  it: {
    ctaTitle: 'Stanotte qualcuno riempie quel buco — o ci siete voi.',
    ctaSubtitle:
      '14 giorni gratis: collegate Airbnb e Booking, vedete buchi e margine su uno schermo. Se non incassate più in fretta, non pagate.',
    ctaButton: 'Attivare prova gratis — 14 giorni',
    ctaFinePrint: '14 giorni per chiudere i buchi • Niente vincoli — stop in un clic prima dell’addebito',
    pricingTitle: 'Scegliete il piano che moltiplica le notti pagate',
    pricingSubtitle:
      'Pagate per chiavi — guadagnate su ogni notte al prezzo giusto. Niente costi nascosti, niente vincoli.',
    starterOutcome: 'Ideale per evitare errori e centralizzare le prenotazioni',
    proOutcome: 'Ottimizza i prezzi e ti fa risparmiare tempo ogni settimana',
    scaleOutcome: 'Pensato per massimizzare i ricavi di più alloggi',
  },
}
