import type { Locale } from './navbar'
import type { BlogPageCopy } from './blogTypes'
import { blogDe, blogEs, blogIt } from './blogArticlesLocales'

export type { BlogArticle, BlogPageCopy, BlogSection } from './blogTypes'

const fr: BlogPageCopy = {
  blogBackLink: "Retour à l'accueil",
  blogPageTitle: 'Blog',
  blogPageSubtitle: 'Conseils et regards sur la location courte durée.',
  blogConclusionLabel: 'Conclusion',
  articles: [
    {
      indexLabel: 'Article 1',
      title: 'Comment augmenter ses revenus en location courte durée grâce aux événements locaux',
      lead: [
        'La rentabilité d’un logement en courte durée ne dépend pas uniquement de son emplacement ou de sa qualité. Elle repose également sur la capacité à anticiper la demande et à adapter ses tarifs en conséquence.',
        'Parmi les facteurs les plus déterminants, les événements locaux occupent une place centrale.',
      ],
      sections: [
        {
          heading: 'Comprendre l’impact des événements sur la demande',
          paragraphs: [
            'Concerts, événements sportifs, festivals ou salons professionnels génèrent des pics de fréquentation souvent sous-estimés. Ces périodes entraînent une hausse significative de la demande, parfois concentrée sur quelques jours.',
            'Un logement situé à proximité d’un événement peut voir son taux d’occupation augmenter rapidement, à condition d’avoir une stratégie adaptée.',
          ],
        },
        {
          heading: 'Adapter ses tarifs de manière dynamique',
          paragraphs: [
            'L’une des erreurs les plus fréquentes consiste à conserver des tarifs fixes tout au long de l’année.',
            'Une approche plus efficace consiste à :',
          ],
          bullets: [
            'identifier les événements à venir',
            'analyser leur impact potentiel sur la demande',
            'ajuster les prix en fonction de cette dynamique',
          ],
          afterBullets: [
            'Cette stratégie permet d’optimiser le revenu par nuit tout en maintenant un bon taux d’occupation.',
          ],
        },
        {
          heading: 'Anticiper plutôt que subir',
          paragraphs: [
            'L’anticipation est un facteur clé de performance. Les réservations liées à des événements importants peuvent intervenir plusieurs semaines à l’avance.',
            'Disposer d’une vision claire des périodes à forte demande permet d’adapter sa stratégie en amont, plutôt que de réagir tardivement.',
          ],
        },
        {
          heading: 'Structurer sa gestion',
          paragraphs: [
            'Mettre en place une organisation qui intègre ces données devient rapidement indispensable lorsque l’on gère plusieurs logements.',
            'Centraliser les informations, visualiser les périodes clés et ajuster ses décisions en conséquence permet de gagner en efficacité et en performance.',
          ],
        },
      ],
      conclusion: [
        'Les événements locaux représentent une opportunité majeure d’optimisation des revenus. Encore faut-il être en mesure de les identifier et de les exploiter correctement.',
        'Une gestion structurée et anticipée permet de transformer ces périodes en véritable levier de croissance.',
      ],
    },
    {
      indexLabel: 'Article 2',
      title: 'Gérer plusieurs logements sans perdre en efficacité',
      lead: [
        'À mesure que le nombre de logements augmente, la gestion devient plus complexe. Sans organisation adaptée, les tâches s’accumulent et les risques d’erreurs se multiplient.',
        'Mettre en place une structure claire devient alors essentiel.',
      ],
      sections: [
        {
          heading: 'Les limites d’une gestion dispersée',
          paragraphs: [
            'Utiliser plusieurs plateformes sans centralisation entraîne rapidement un manque de visibilité. Les informations sont réparties, les calendriers ne sont pas toujours synchronisés et la prise de décision devient plus difficile.',
            'Cette fragmentation nuit à l’efficacité globale.',
          ],
        },
        {
          heading: 'Centraliser pour gagner en clarté',
          paragraphs: [
            'Une gestion performante repose sur une vision globale de l’activité. Pouvoir accéder rapidement aux informations essentielles — réservations, disponibilités, périodes clés — permet de simplifier considérablement le pilotage.',
            'La centralisation devient alors un levier d’optimisation.',
          ],
        },
        {
          heading: 'Structurer les tâches opérationnelles',
          paragraphs: [
            'Au-delà des réservations, la gestion quotidienne implique de nombreuses actions : suivi des ménages, préparation des logements, coordination des intervenants.',
            'Structurer ces éléments permet :',
          ],
          bullets: [
            'de réduire les oublis',
            'd’améliorer la réactivité',
            'de fluidifier l’organisation',
          ],
        },
        {
          heading: 'Anticiper les périodes sensibles',
          paragraphs: [
            'Certaines périodes nécessitent une attention particulière : week-ends prolongés, vacances, événements locaux.',
            'Anticiper ces moments permet d’adapter les ressources et d’éviter les situations de surcharge.',
          ],
        },
      ],
      conclusion: [
        'Gérer plusieurs logements ne doit pas être synonyme de complexité. Avec une organisation adaptée et des outils appropriés, il est possible de maintenir une gestion fluide, même à plus grande échelle.',
      ],
    },
    {
      indexLabel: 'Article 3',
      title: 'Les erreurs les plus fréquentes en location courte durée',
      lead: [
        'La location courte durée offre un fort potentiel de rentabilité, mais certaines erreurs peuvent rapidement limiter les performances d’un logement.',
        'Les identifier permet de mettre en place des actions correctives efficaces.',
      ],
      sections: [
        {
          heading: '1. Ne pas adapter ses prix',
          paragraphs: [
            'Un tarif fixe ne permet pas de tirer parti des variations de la demande. La saisonnalité, les événements et les tendances locales doivent être pris en compte pour optimiser les revenus.',
          ],
        },
        {
          heading: '2. Manquer de visibilité sur son activité',
          paragraphs: [
            'Une gestion sans vue d’ensemble rend difficile la prise de décision. Sans indicateurs clairs, il devient compliqué d’identifier les axes d’amélioration.',
          ],
        },
        {
          heading: '3. Sous-estimer l’organisation',
          paragraphs: [
            'La gestion opérationnelle (ménage, préparation, coordination) est souvent négligée. Pourtant, elle impacte directement la qualité du service et la satisfaction des voyageurs.',
          ],
        },
        {
          heading: '4. Réagir au lieu d’anticiper',
          paragraphs: [
            'Attendre qu’un problème survienne pour agir est une erreur fréquente. Une approche proactive permet d’éviter de nombreuses situations critiques.',
          ],
        },
        {
          heading: '5. Multiplier les outils sans cohérence',
          paragraphs: [
            'Accumuler des solutions sans réelle logique d’ensemble peut compliquer davantage la gestion au lieu de la simplifier.',
          ],
        },
      ],
      conclusion: [],
    },
  ],
}

const en: BlogPageCopy = {
  blogBackLink: 'Back to home',
  blogPageTitle: 'Blog',
  blogPageSubtitle: 'Insights for short-term rental hosts.',
  blogConclusionLabel: 'Conclusion',
  articles: [
    {
      indexLabel: 'Article 1',
      title: 'How to grow short-term rental revenue with local events',
      lead: [
        'A listing’s profitability is not only about location or quality. It also depends on anticipating demand and adjusting rates accordingly.',
        'Among the strongest drivers, local events play a central role.',
      ],
      sections: [
        {
          heading: 'Understanding how events shape demand',
          paragraphs: [
            'Concerts, sports events, festivals, or trade shows create demand spikes that are often underestimated. Demand can surge sharply over just a few days.',
            'A home near an event can fill faster with the right strategy.',
          ],
        },
        {
          heading: 'Pricing dynamically',
          paragraphs: [
            'A common mistake is keeping the same rates all year.',
            'A stronger approach is to:',
          ],
          bullets: [
            'map upcoming events',
            'assess their likely impact on demand',
            'adjust prices to match that dynamic',
          ],
          afterBullets: [
            'This helps maximise revenue per night while keeping occupancy healthy.',
          ],
        },
        {
          heading: 'Anticipate, don’t only react',
          paragraphs: [
            'Anticipation drives performance. Bookings for major events can start weeks ahead.',
            'A clear view of high-demand windows lets you plan early instead of catching up late.',
          ],
        },
        {
          heading: 'Structure your operations',
          paragraphs: [
            'As you add listings, you need a system that weaves this intelligence into day-to-day work.',
            'Centralising information, surfacing key periods, and aligning decisions boosts efficiency and results.',
          ],
        },
      ],
      conclusion: [
        'Local events are a major revenue lever — if you can spot them and act on them.',
        'Structured, forward-looking management turns those windows into real growth.',
      ],
    },
    {
      indexLabel: 'Article 2',
      title: 'Running multiple listings without losing efficiency',
      lead: [
        'More homes mean more complexity. Without the right structure, tasks pile up and mistakes multiply.',
        'A clear operating model becomes essential.',
      ],
      sections: [
        {
          heading: 'The limits of scattered tools',
          paragraphs: [
            'Using several platforms without a single view quickly erodes visibility. Data sits in silos, calendars drift out of sync, and decisions get harder.',
            'Fragmentation hurts overall performance.',
          ],
        },
        {
          heading: 'Centralise for clarity',
          paragraphs: [
            'Strong management starts with a global picture. Fast access to reservations, availability, and key periods greatly simplifies steering.',
            'Centralisation becomes a real optimisation lever.',
          ],
        },
        {
          heading: 'Structure daily operations',
          paragraphs: [
            'Beyond bookings, operations cover cleaning, turnovers, and coordinating people on the ground.',
            'Structuring this work helps you:',
          ],
          bullets: [
            'reduce missed tasks',
            'improve responsiveness',
            'smooth the workflow',
          ],
        },
        {
          heading: 'Plan for sensitive periods',
          paragraphs: [
            'Some dates need extra attention: long weekends, holidays, local events.',
            'Planning ahead lets you align resources and avoid overload.',
          ],
        },
      ],
      conclusion: [
        'Multiple listings should not mean chaos. With the right organisation and tools, operations stay smooth at scale.',
      ],
    },
    {
      indexLabel: 'Article 3',
      title: 'Common mistakes in short-term rentals',
      lead: [
        'Short-term rentals can be very profitable, but a few mistakes cap performance quickly.',
        'Spotting them is the first step to fixing them.',
      ],
      sections: [
        {
          heading: '1. Not adjusting prices',
          paragraphs: [
            'Flat rates ignore demand swings. Seasonality, events, and local trends should inform pricing to maximise revenue.',
          ],
        },
        {
          heading: '2. Lacking visibility',
          paragraphs: [
            'Without a dashboard view, decisions are guesswork. Clear indicators make improvement obvious.',
          ],
        },
        {
          heading: '3. Underestimating operations',
          paragraphs: [
            'Cleaning, prep, and coordination are often overlooked — yet they directly shape guest experience and reviews.',
          ],
        },
        {
          heading: '4. Reacting instead of anticipating',
          paragraphs: [
            'Waiting for problems is expensive. A proactive stance prevents many crises.',
          ],
        },
        {
          heading: '5. Too many tools, no system',
          paragraphs: [
            'Stacking apps without a coherent approach can add complexity instead of removing it.',
          ],
        },
      ],
      conclusion: [],
    },
  ],
}

export const blogPageTranslations: Record<Locale, BlogPageCopy> = {
  fr,
  en,
  es: blogEs,
  de: blogDe,
  it: blogIt,
}
