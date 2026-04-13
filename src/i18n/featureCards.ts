import type { Locale } from './navbar'

export type FeatureCardsCopy = {
  featuresHeading: string
  featureCard1Title: string
  featureCard1Subtitle: string
  featureCard2Title: string
  featureCard2Subtitle: string
  featureCard3Title: string
  featureCard3Subtitle: string
}

export const featureCardsTranslations: Record<Locale, FeatureCardsCopy> = {
  fr: {
    featuresHeading: 'Trois boosts concrets sur votre compte bancaire',
    featureCard1Title: '+ occupation : fini les départs qui vous coûtent une nuit',
    featureCard1Subtitle:
      '~40 % des mauvaises notes = ménage ou arrivée. Checklists + équipe synchro → moins d’incidents, plus de créneaux vendus plein pot — directement plus de cash.',
    featureCard2Title: '+ parc : +12 biens en 6 semaines sans embauche',
    featureCard2Subtitle:
      'Même playbook pour vos pros. Coordinateur / bien souvent ~45 → ~20 min : vous ajoutez des clés sans doubler votre temps — la croissance arrête de vous voler vos soirées.',
    featureCard3Title: '+ RevPAR : voyez quel bien vous enrichit (ou vous saigne)',
    featureCard3Subtitle:
      'CA, taux de remplissage, revenu par nuit : en 30 s vous savez où monter le prix et où investir le ménage. Fini de financer vos erreurs.',
  },
  es: {
    featuresHeading: 'Tres subidas concretas en su cuenta',
    featureCard1Title: '+ ocupación: salidas que ya no le cuestan una noche',
    featureCard1Subtitle:
      '~40 % malas reseñas = limpieza o check-in. Checklists + equipo alineado → menos incidentes, más noches a tarifa plena — más cobro.',
    featureCard2Title: '+ parque: +12 viviendas en 6 semanas sin contratar',
    featureCard2Subtitle:
      'Mismo playbook para sus pros. Coordinador / unidad ~45 → ~20 min: más llaves sin duplicar su tiempo — el crecimiento deja de robar sus noches.',
    featureCard3Title: '+ RevPAR: vea qué piso le enriquece (o le sangra)',
    featureCard3Subtitle:
      'Ingresos, ocupación, revenue por noche: en 30 s sabe dónde subir precio y dónde invertir limpieza. Deje de financiar errores.',
  },
  en: {
    featuresHeading: 'Three concrete lifts to your bank balance',
    featureCard1Title: '+ occupancy: checkouts stop costing you free nights',
    featureCard1Subtitle:
      '~40% of bad reviews = cleaning or check-in. Checklists + synced crew → fewer fires, more nights at peak rate—more cash in.',
    featureCard2Title: '+ portfolio: +12 units in 6 weeks—no new hires',
    featureCard2Subtitle:
      'Same playbook for every pro. Coordinator time per unit often ~45 → ~20 min: add keys without doubling your hours—growth stops stealing your nights.',
    featureCard3Title: '+ RevPAR: see which unit pays you (and which bleeds you)',
    featureCard3Subtitle:
      'Revenue, fill rate, revenue per night: in 30s know where to raise rates and where to spend on cleaning. Stop funding your own mistakes.',
  },
  de: {
    featuresHeading: 'Drei konkrete Sprünge auf Ihrem Konto',
    featureCard1Title: '+ Auslastung: Check-outs kosten keine Gratisnächte mehr',
    featureCard1Subtitle:
      '~40 % schlechte Reviews = Reinigung oder Check-in. Checklists + Team-Sync → weniger Vorfälle, mehr Nächte zum Top-Preis — mehr Cash.',
    featureCard2Title: '+ Bestand: +12 Objekte in 6 Wochen ohne Neueinstellung',
    featureCard2Subtitle:
      'Gleiches Playbook für alle Pros. Koordinator / Objekt oft ~45 → ~20 Min: mehr Schlüssel ohne doppelte Zeit — Wachstum klaut keine Abende mehr.',
    featureCard3Title: '+ RevPAR: sehen Sie, welche Einheit zahlt (und welche blutet)',
    featureCard3Subtitle:
      'Umsatz, Auslastung, Umsatz pro Nacht: in 30 s wissen Sie, wo Preis hoch und wo Reinigung rein muss. Hören Sie auf, Fehler mitzufinanzieren.',
  },
  it: {
    featuresHeading: 'Tre incrementi concreti sul conto',
    featureCard1Title: '+ occupazione: i check-out non vi costano più notti gratis',
    featureCard1Subtitle:
      '~40 % recensioni negative = pulizie o check-in. Checklist + team allineato → meno guai, più notti a tariffa piena — più incasso.',
    featureCard2Title: '+ parco: +12 immobili in 6 settimane senza assunzioni',
    featureCard2Subtitle:
      'Stesso playbook per i professionisti. Coordinatore / unità spesso ~45 → ~20 min: più chiavi senza raddoppiare le ore — la crescita smette di rubarvi le serate.',
    featureCard3Title: '+ RevPAR: vedete chi vi paga (e chi vi prosciuga)',
    featureCard3Subtitle:
      'Ricavi, riempimento, revenue per notte: in 30 s sapete dove alzare il prezzo e dove investire sulle pulizie. Basta finanziare gli errori.',
  },
}

export const FEATURE_CARD_IMAGES = [
  '/features/card-living.jpg',
  '/features/card-host.jpg',
  '/features/card-interior.jpg',
] as const
