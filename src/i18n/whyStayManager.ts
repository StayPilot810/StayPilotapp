import type { Locale } from './navbar'

export type WhyBenefit = {
  title: string
  body: string
}

export type WhyStayManagerCopy = {
  whySectionTitle: string
  whySectionSubtitle: string
  whyBenefits: [WhyBenefit, WhyBenefit, WhyBenefit, WhyBenefit]
}

const fr: WhyStayManagerCopy = {
  whySectionTitle: 'Conçu pour le résultat — pas pour la liste de fonctionnalités',
  whySectionSubtitle:
    'Chaque module pousse un KPI : plus de nuits vendues, plus de marge, moins d’heures perdues.',
  whyBenefits: [
    {
      title: 'Plus de CA sur chaque nuitée',
      body: 'Pricing et calendrier alignés sur la demande : vous montez le RevPAR sans bricoler cinq tableurs.',
    },
    {
      title: 'Calendrier plus plein, moins de friction',
      body: 'Airbnb & Booking au même endroit : moins de trous, moins de surbooking, plus d’occupation utile.',
    },
    {
      title: 'Des heures récupérées chaque semaine',
      body: 'Relances, statuts ménage, messages : l’automatisation enlève le répétitif — vous gardez la décision.',
    },
    {
      title: 'Ménage et turnover sans faille',
      body: 'Chaque départ déclenche le bon flux : moins d’incidents, meilleures notes, moins de nuits perdues.',
    },
  ],
}

const en: WhyStayManagerCopy = {
  whySectionTitle: 'Built for outcomes—not feature checklists',
  whySectionSubtitle: 'Every module pushes a KPI: more booked nights, more margin, fewer wasted hours.',
  whyBenefits: [
    {
      title: 'More revenue per night',
      body: 'Pricing and availability aligned to demand—raise RevPAR without juggling five spreadsheets.',
    },
    {
      title: 'Higher occupancy, less chaos',
      body: 'Airbnb & Booking in one place—fewer gaps, fewer double bookings, more useful occupancy.',
    },
    {
      title: 'Hours back every week',
      body: 'Follow-ups, cleaning status, messaging: automation removes the grind—you keep the decisions.',
    },
    {
      title: 'Turnover you can trust',
      body: 'Each checkout triggers the right workflow—fewer incidents, better reviews, fewer lost nights.',
    },
  ],
}

const es: WhyStayManagerCopy = {
  whySectionTitle: 'Pensado para el resultado—no para la lista de funciones',
  whySectionSubtitle: 'Cada módulo empuja un KPI: más noches vendidas, más margen, menos horas perdidas.',
  whyBenefits: [
    {
      title: 'Más ingreso por noche',
      body: 'Precios y calendario alineados a la demanda: sube el RevPAR sin cinco hojas de cálculo.',
    },
    {
      title: 'Más ocupación, menos fricción',
      body: 'Airbnb y Booking en un solo sitio: menos huecos, menos overbooking, ocupación más útil.',
    },
    {
      title: 'Horas recuperadas cada semana',
      body: 'Seguimientos, limpieza, mensajes: la automatización quita lo repetitivo—usted decide.',
    },
    {
      title: 'Limpieza y cambio de huésped sin fallos',
      body: 'Cada salida dispara el flujo correcto: menos incidencias, mejores reseñas, menos noches perdidas.',
    },
  ],
}

const de: WhyStayManagerCopy = {
  whySectionTitle: 'Für Ergebnisse gebaut—nicht für Feature-Listen',
  whySectionSubtitle: 'Jedes Modul treibt eine KPI: mehr gebuchte Nächte, mehr Marge, weniger verlorene Stunden.',
  whyBenefits: [
    {
      title: 'Mehr Umsatz pro Nacht',
      body: 'Pricing und Verfügbarkeit an die Nachfrage gekoppelt—RevPAR steigen ohne Tabellen-Chaos.',
    },
    {
      title: 'Höhere Auslastung, weniger Reibung',
      body: 'Airbnb & Booking an einem Ort—weniger Lücken, weniger Doppelbuchungen, sinnvollere Auslastung.',
    },
    {
      title: 'Stunden zurück jede Woche',
      body: 'Follow-ups, Reinigung, Nachrichten: Automatisierung nimmt Routine—Sie entscheiden.',
    },
    {
      title: 'Wechsel ohne Pannen',
      body: 'Jeder Check-out startet den richtigen Ablauf—weniger Vorfälle, bessere Bewertungen, weniger verlorene Nächte.',
    },
  ],
}

const it: WhyStayManagerCopy = {
  whySectionTitle: 'Pensato per i risultati—non per elenchi di funzioni',
  whySectionSubtitle: 'Ogni modulo spinge un KPI: più notti vendute, più margine, meno ore perse.',
  whyBenefits: [
    {
      title: 'Più ricavo per notte',
      body: 'Prezzi e calendario allineati alla domanda: RevPAR più alto senza cinque fogli di calcolo.',
    },
    {
      title: 'Più occupazione, meno attrito',
      body: 'Airbnb e Booking in un unico posto: meno buchi, meno overbooking, occupazione più utile.',
    },
    {
      title: 'Ore recuperate ogni settimana',
      body: 'Follow-up, pulizie, messaggi: l’automazione toglie il ripetitivo—restano le decisioni.',
    },
    {
      title: 'Turnover senza errori',
      body: 'Ogni check-out attiva il flusso giusto: meno incidenti, recensioni migliori, meno notti perse.',
    },
  ],
}

export const whyStayManagerTranslations: Record<Locale, WhyStayManagerCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
