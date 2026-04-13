import type { Locale } from './navbar'

/** `percent` : cible signée animée en ±N%. `hoursSaved` : 0→N, affiché en −Nh (temps récupéré). */
export type StatItemFormat = 'percent' | 'hoursSaved'

export type StatsRowCopy = {
  stat1Target: number
  stat1Format: StatItemFormat
  stat2Target: number
  stat2Format: StatItemFormat
  stat3Target: number
  stat3Format: StatItemFormat
  stat4Target: number
  stat4Format: StatItemFormat
  stat5Target: number
  stat5Format: StatItemFormat
  stat1Value: string
  stat1Label: string
  stat2Value: string
  stat2Label: string
  stat3Value: string
  stat3Label: string
  stat4Value: string
  stat4Label: string
  stat5Value: string
  stat5Label: string
  statsSectionTitleBefore: string
  statsSectionTitleAccent: string
  statsSectionSubtitle: string
}

export const statsRowTranslations: Record<Locale, StatsRowCopy> = {
  fr: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'sur le revenu par nuit (RevPAR) quand vous ajustez vite',
    stat2Value: '+22%',
    stat2Label: 'sur le remplissage vs votre objectif de nuits',
    stat3Value: '−8h',
    stat3Label: 'par semaine récupérées sur le hors-cash (messages, synchro)',
    stat4Value: '+90%',
    stat4Label: 'des relances & synchros passées en auto (zéro ressaisie)',
    stat5Value: '−45%',
    stat5Label: 'd’écart vs le prix marché (vous arrêtez de sous-vendre)',
    statsSectionTitleBefore: 'Ce que gagnent les hôtes',
    statsSectionTitleAccent: 'qui arrêtent de bricoler',
    statsSectionSubtitle:
      'Projection : vous fermez l’ordi le soir en sachant combien vous avez encaissé et où pousser le tarif demain. RevPAR, remplissage, temps volé, prix voisins — le pack que les tops regardent avant de dormir, enfin au même endroit.',
  },
  es: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'en ingreso por noche (RevPAR) al ajustar rápido',
    stat2Value: '+22%',
    stat2Label: 'en llenado vs su objetivo de noches',
    stat3Value: '−8h',
    stat3Label: 'por semana fuera del cash (mensajes, sync)',
    stat4Value: '+90%',
    stat4Label: 'de follow-ups y sync en automático (cero reescritura)',
    stat5Value: '−45%',
    stat5Label: 'vs precio de mercado (deja de vender barato)',
    statsSectionTitleBefore: 'Lo que ganan los hosts',
    statsSectionTitleAccent: 'que dejan de improvisar',
    statsSectionSubtitle:
      'Proyecte: cierra el portátil sabiendo cuánto cobró y dónde subir mañana. RevPAR, llenado, tiempo perdido, precios vecinos—lo que los mejores miran antes de dormir, en un solo sitio.',
  },
  en: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'lift on revenue per night (RevPAR) when you move fast',
    stat2Value: '+22%',
    stat2Label: 'lift on fill rate vs your night target',
    stat3Value: '−8h',
    stat3Label: 'weekly hours back from non-revenue work (inbox, sync)',
    stat4Value: '+90%',
    stat4Label: 'of follow-ups & sync on autopilot—zero retyping',
    stat5Value: '−45%',
    stat5Label: 'gap vs market rate (stop underpricing)',
    statsSectionTitleBefore: 'What hosts earn',
    statsSectionTitleAccent: 'when they quit guessing',
    statsSectionSubtitle:
      'Picture closing the laptop knowing what you banked and where to raise rates tomorrow. RevPAR, fill rate, stolen hours, neighbor pricing—what top hosts check before bed, finally in one stack.',
  },
  de: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'mehr Umsatz pro Nacht (RevPAR) bei schnellen Moves',
    stat2Value: '+22%',
    stat2Label: 'mehr Füllung vs. Ihr Nacht-Ziel',
    stat3Value: '−8h',
    stat3Label: 'pro Woche zurück vom Nicht-Cash (Postfach, Sync)',
    stat4Value: '+90%',
    stat4Label: 'Follow-ups & Sync automatisch—kein Neu-Tippen',
    stat5Value: '−45%',
    stat5Label: 'unter Marktpreis (Schluss mit Unterverkauf)',
    statsSectionTitleBefore: 'Was Gastgeber einnehmen',
    statsSectionTitleAccent: 'wenn sie aufhören zu raten',
    statsSectionSubtitle:
      'Stellen Sie sich vor: Laptop zu, Konto klar, morgen Preise gezielt anheben. RevPAR, Füllung, verlorene Zeit, Nachbarpreise—was Top-Hosts vor dem Schlaf prüfen, endlich an einem Ort.',
  },
  it: {
    stat1Target: 18,
    stat1Format: 'percent',
    stat2Target: 22,
    stat2Format: 'percent',
    stat3Target: 8,
    stat3Format: 'hoursSaved',
    stat4Target: 90,
    stat4Format: 'percent',
    stat5Target: -45,
    stat5Format: 'percent',
    stat1Value: '+18%',
    stat1Label: 'su ricavo per notte (RevPAR) se agite in fretta',
    stat2Value: '+22%',
    stat2Label: 'su riempimento vs obiettivo notti',
    stat3Value: '−8h',
    stat3Label: 'a settimana fuori dal cash (inbox, sync)',
    stat4Value: '+90%',
    stat4Label: 'follow-up e sync in auto—zero riscrittura',
    stat5Value: '−45%',
    stat5Label: 'sotto il prezzo di mercato (basta sottovendere)',
    statsSectionTitleBefore: 'Cosa incassano gli host',
    statsSectionTitleAccent: 'che smettono di improvvisare',
    statsSectionSubtitle:
      'Immaginate: chiudete il laptop sapendo quanto avete incassato e dove alzare domani. RevPAR, riempimento, ore rubate, prezzi vicini—ciò che i migliori controllano prima di dormire, tutto in uno stack.',
  },
}
