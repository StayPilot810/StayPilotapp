import type { Locale } from './navbar'
import { CONTACT_EMAIL } from './contactPage'

export type CareersBlock = {
  title: string
  paragraphs: string[]
  bullets?: string[]
  afterBullets?: string[]
}

export type CareersPageCopy = {
  careersBackLink: string
  careersPageTitle: string
  introParagraphs: string[]
  blocks: CareersBlock[]
  applicationTitle: string
  applicationParagraphs: string[]
  applicationEmailLabel: string
  applicationEmail: string
}

const fr: CareersPageCopy = {
  careersBackLink: "Retour à l'accueil",
  careersPageTitle: 'Carrières',
  introParagraphs: [
    'Nous développons une solution dédiée à la gestion de la location courte durée, avec une ambition claire : structurer une activité souvent complexe et offrir une vision fiable, lisible et immédiatement exploitable.',
    'Notre approche s’appuie sur une compréhension concrète des enjeux du terrain, combinée à une exigence élevée en matière de qualité, de cohérence et de performance.',
  ],
  blocks: [
    {
      title: 'Notre vision',
      paragraphs: [
        'Nous considérons que la gestion locative ne doit pas se limiter à une succession de tâches opérationnelles, mais constituer un véritable levier de pilotage.',
        'Notre objectif est de proposer un standard de gestion plus clair, plus structuré et plus efficace, capable d’accompagner l’évolution du marché et les exigences croissantes des professionnels.',
      ],
    },
    {
      title: 'Notre approche',
      paragraphs: [
        'Nous faisons le choix d’une construction produit rigoureuse, centrée sur l’essentiel.',
        'Chaque fonctionnalité est conçue pour apporter une valeur mesurable, avec une attention particulière portée à la clarté des informations, à la simplicité d’utilisation et à la fiabilité des données.',
        'Nous privilégions la précision plutôt que l’accumulation, et l’efficacité plutôt que la complexité.',
      ],
    },
    {
      title: 'Environnement',
      paragraphs: [
        'Nous évoluons dans un cadre exigeant, orienté performance et responsabilisation.',
        'Nous valorisons l’autonomie, la rigueur et la capacité à analyser une situation avec justesse. Les profils capables de proposer des solutions pertinentes et de s’inscrire dans une démarche d’amélioration continue y trouveront un environnement propice.',
      ],
    },
    {
      title: 'Profils',
      paragraphs: [
        'Nous restons attentifs à des profils capables de contribuer à la construction d’un produit structuré et durable, notamment dans les domaines suivants :',
      ],
      bullets: [
        'Développement',
        'Produit et expérience utilisateur',
        'Marketing et acquisition',
        'Opérations',
      ],
      afterBullets: [
        'Nous recherchons avant tout des profils engagés, capables de s’inscrire dans une vision long terme et de participer activement à la qualité du produit.',
      ],
    },
  ],
  applicationTitle: 'Candidature',
  applicationParagraphs: [
    'Nous ne recrutons pas activement à ce stade. Toutefois, nous restons ouverts aux profils à forte valeur ajoutée.',
    'Les candidatures peuvent être adressées à :',
  ],
  applicationEmailLabel: 'Courriel',
  applicationEmail: CONTACT_EMAIL,
}

const en: CareersPageCopy = {
  careersBackLink: 'Back to home',
  careersPageTitle: 'Careers',
  introParagraphs: [
    'We are building a product dedicated to short-term rental management, with a clear ambition: structure a complex activity and deliver a reliable, readable, immediately actionable view.',
    'Our approach combines hands-on understanding of operational realities with high standards for quality, coherence, and performance.',
  ],
  blocks: [
    {
      title: 'Our vision',
      paragraphs: [
        'We believe rental management should not be a chain of ad-hoc tasks, but a real steering lever.',
        'Our goal is to offer a clearer, more structured, more effective management standard that keeps pace with the market and rising professional expectations.',
      ],
    },
    {
      title: 'How we work',
      paragraphs: [
        'We favour rigorous product development focused on what matters.',
        'Every feature is designed to deliver measurable value, with strong emphasis on information clarity, ease of use, and data reliability.',
        'We choose precision over accumulation, and efficiency over unnecessary complexity.',
      ],
    },
    {
      title: 'Environment',
      paragraphs: [
        'We operate in a demanding context, oriented towards performance and ownership.',
        'We value autonomy, rigour, and sound judgment. People who propose relevant solutions and embrace continuous improvement will find a fitting environment.',
      ],
    },
    {
      title: 'Profiles',
      paragraphs: [
        'We keep an eye out for contributors who can help build a structured, durable product, notably in:',
      ],
      bullets: ['Engineering', 'Product & user experience', 'Marketing & acquisition', 'Operations'],
      afterBullets: [
        'Above all, we look for committed people who think long term and care deeply about product quality.',
      ],
    },
  ],
  applicationTitle: 'Applications',
  applicationParagraphs: [
    'We are not hiring actively at this stage. We remain open to exceptional profiles.',
    'You can send applications to:',
  ],
  applicationEmailLabel: 'Email',
  applicationEmail: CONTACT_EMAIL,
}

const es: CareersPageCopy = {
  careersBackLink: 'Volver al inicio',
  careersPageTitle: 'Carreras',
  introParagraphs: [
    'Desarrollamos una solución dedicada a la gestión del alquiler de corta duración, con una ambición clara: estructurar una actividad a menudo compleja y ofrecer una visión fiable, legible y de aplicación inmediata.',
    'Nuestro enfoque se apoya en una comprensión concreta de los retos del terreno, combinada con una exigencia elevada en calidad, coherencia y rendimiento.',
  ],
  blocks: [
    {
      title: 'Nuestra visión',
      paragraphs: [
        'Consideramos que la gestión del alquiler no debe limitarse a una sucesión de tareas operativas, sino constituir una verdadera palanca de dirección.',
        'Nuestro objetivo es proponer un estándar de gestión más claro, más estructurado y más eficaz, capaz de acompañar la evolución del mercado y las exigencias crecientes de los profesionales.',
      ],
    },
    {
      title: 'Nuestro enfoque',
      paragraphs: [
        'Optamos por una construcción de producto rigurosa, centrada en lo esencial.',
        'Cada funcionalidad está pensada para aportar un valor medible, con especial atención a la claridad de la información, la facilidad de uso y la fiabilidad de los datos.',
        'Priorizamos la precisión frente a la acumulación, y la eficiencia frente a la complejidad.',
      ],
    },
    {
      title: 'Entorno',
      paragraphs: [
        'Evolucionamos en un marco exigente, orientado al rendimiento y a la responsabilización.',
        'Valoramos la autonomía, el rigor y la capacidad de analizar una situación con acierto. Los perfiles capaces de proponer soluciones pertinentes e integrarse en una mejora continua encontrarán un entorno propicio.',
      ],
    },
    {
      title: 'Perfiles',
      paragraphs: [
        'Seguimos atentos a perfiles capaces de contribuir a la construcción de un producto estructurado y duradero, en particular en los siguientes ámbitos:',
      ],
      bullets: [
        'Desarrollo',
        'Producto y experiencia de usuario',
        'Marketing y adquisición',
        'Operaciones',
      ],
      afterBullets: [
        'Buscamos ante todo perfiles implicados, capaces de inscribirse en una visión a largo plazo y de participar activamente en la calidad del producto.',
      ],
    },
  ],
  applicationTitle: 'Candidaturas',
  applicationParagraphs: [
    'No estamos contratando de forma activa en esta fase. No obstante, seguimos abiertos a perfiles de alto valor añadido.',
    'Las candidaturas pueden enviarse a:',
  ],
  applicationEmailLabel: 'Correo',
  applicationEmail: CONTACT_EMAIL,
}

const deCareers: CareersPageCopy = {
  careersBackLink: 'Zur Startseite',
  careersPageTitle: 'Karriere',
  introParagraphs: [
    'Wir entwickeln eine Lösung für das Management von Kurzzeitvermietung mit einem klaren Ziel: eine oft komplexe Tätigkeit zu strukturieren und eine verlässliche, gut lesbare und sofort nutzbare Sicht zu bieten.',
    'Unser Ansatz verbindet konkretes Verständnis für die Herausforderungen vor Ort mit hohen Ansprüchen an Qualität, Kohärenz und Leistung.',
  ],
  blocks: [
    {
      title: 'Unsere Vision',
      paragraphs: [
        'Wir sind überzeugt: Vermietungsmanagement darf nicht nur eine Kette operativer Aufgaben sein, sondern soll ein echtes Steuerungshebel sein.',
        'Unser Ziel ist es, einen klareren, strukturierteren und wirksameren Managementstandard anzubieten, der Marktentwicklung und wachsende professionelle Anforderungen begleitet.',
      ],
    },
    {
      title: 'Unser Ansatz',
      paragraphs: [
        'Wir setzen auf rigorose Produktentwicklung mit Fokus auf das Wesentliche.',
        'Jede Funktion soll messbaren Mehrwert liefern — mit besonderem Augenmerk auf Klarheit der Informationen, Bedienfreundlichkeit und Datenzuverlässigkeit.',
        'Wir bevorzugen Präzision statt Ansammlung und Effizienz statt unnötiger Komplexität.',
      ],
    },
    {
      title: 'Umfeld',
      paragraphs: [
        'Wir arbeiten in einem anspruchsvollen Rahmen, ausgerichtet auf Leistung und Verantwortung.',
        'Wir schätzen Autonomie, Sorgfalt und die Fähigkeit, Situationen richtig einzuschätzen. Wer passende Lösungen vorschlägt und kontinuierliche Verbesserung lebt, findet hier gute Bedingungen.',
      ],
    },
    {
      title: 'Profile',
      paragraphs: [
        'Wir achten auf Menschen, die ein strukturiertes, nachhaltiges Produkt mitgestalten können, insbesondere in:',
      ],
      bullets: [
        'Entwicklung',
        'Produkt und Nutzererlebnis',
        'Marketing und Akquise',
        'Betrieb',
      ],
      afterBullets: [
        'Vor allem suchen wir engagierte Profile mit langfristiger Perspektive und echtem Qualitätsbewusstsein für das Produkt.',
      ],
    },
  ],
  applicationTitle: 'Bewerbung',
  applicationParagraphs: [
    'Wir stellen derzeit nicht aktiv ein. Ausnahmeprofile mit hohem Mehrwert sind uns dennoch willkommen.',
    'Bewerbungen richten Sie bitte an:',
  ],
  applicationEmailLabel: 'E-Mail',
  applicationEmail: CONTACT_EMAIL,
}

const itCareers: CareersPageCopy = {
  careersBackLink: 'Torna alla home',
  careersPageTitle: 'Carriere',
  introParagraphs: [
    'Sviluppiamo una soluzione dedicata alla gestione degli affitti brevi, con un’ambizione chiara: strutturare un’attività spesso complessa e offrire una visione affidabile, leggibile e subito operativa.',
    'Il nostro approccio unisce una comprensione concreta delle sfide sul campo a un’elevata esigenza di qualità, coerenza e performance.',
  ],
  blocks: [
    {
      title: 'La nostra visione',
      paragraphs: [
        'Riteniamo che la gestione locativa non debba limitarsi a una successione di compiti operativi, ma costituisca una vera leva di governo.',
        'Il nostro obiettivo è proporre uno standard di gestione più chiaro, più strutturato e più efficace, in grado di accompagnare l’evoluzione del mercato e le crescenti richieste dei professionisti.',
      ],
    },
    {
      title: 'Il nostro approccio',
      paragraphs: [
        'Scegliamo una costruzione del prodotto rigorosa, centrata sull’essenziale.',
        'Ogni funzionalità è pensata per portare valore misurabile, con particolare attenzione alla chiarezza delle informazioni, alla semplicità d’uso e all’affidabilità dei dati.',
        'Privilegiamo la precisione piuttosto che l’accumulo, e l’efficienza piuttosto che la complessità.',
      ],
    },
    {
      title: 'Ambiente',
      paragraphs: [
        'Operiamo in un contesto esigente, orientato alla performance e alla responsabilità.',
        'Valorizziamo autonomia, rigore e capacità di analizzare una situazione con pertinenza. Chi propone soluzioni rilevanti e si inserisce in un miglioramento continuo troverà un ambiente favorevole.',
      ],
    },
    {
      title: 'Profili',
      paragraphs: [
        'Restiamo attenti a profili in grado di contribuire a un prodotto strutturato e duraturo, in particolare nei seguenti ambiti:',
      ],
      bullets: [
        'Sviluppo',
        'Prodotto ed esperienza utente',
        'Marketing e acquisizione',
        'Operazioni',
      ],
      afterBullets: [
        'Cerchiamo soprattutto profili coinvolti, capaci di inserirsi in una visione a lungo termine e di partecipare attivamente alla qualità del prodotto.',
      ],
    },
  ],
  applicationTitle: 'Candidature',
  applicationParagraphs: [
    'In questa fase non stiamo reclutando attivamente. Restiamo tuttavia aperti a profili ad alto valore aggiunto.',
    'Le candidature possono essere inviate a:',
  ],
  applicationEmailLabel: 'Email',
  applicationEmail: CONTACT_EMAIL,
}

export const careersPageTranslations: Record<Locale, CareersPageCopy> = {
  fr,
  en,
  es,
  de: deCareers,
  it: itCareers,
}
