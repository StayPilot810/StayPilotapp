import type { Locale } from './navbar'

export type AboutContentBlock = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export type AboutPageCopy = {
  aboutBackLink: string
  aboutPageTitle: string
  introParagraphs: string[]
  blocks: AboutContentBlock[]
}

export const aboutPageTranslations: Record<Locale, AboutPageCopy> = {
  fr: {
    aboutBackLink: "Retour à l'accueil",
    aboutPageTitle: 'À propos',
    introParagraphs: [
      "Nous n'avons pas commencé par construire un produit.",
      'Nous avons commencé par observer.',
      "Avant cette application, nous opérions directement sur le terrain, au cœur de la gestion de logements en courte durée. Une activité exigeante, où chaque détail compte, et où la moindre inefficacité se répercute immédiatement sur le temps, l'organisation et la performance.",
      "Au fil du temps, une réalité s'est imposée avec évidence : la gestion était devenue fragmentée, les informations dispersées, les décisions souvent prises avec un manque de visibilité. Malgré la multiplication des outils, aucun ne permettait d'obtenir une lecture simple, claire et exploitable de l'activité.",
    ],
    blocks: [
      {
        title: 'Une conviction forte',
        paragraphs: [
          "Nous sommes partis d'un principe simple : la complexité ne doit jamais être une fatalité.",
          'La gestion locative courte durée peut — et doit — être structurée, lisible et pilotable.',
          "C'est cette conviction qui a guidé la création de notre solution.",
        ],
      },
      {
        title: 'Une nouvelle manière de piloter son activité',
        paragraphs: [
          "Nous avons conçu une application centrée sur l'essentiel : offrir une vision globale, instantanée et fiable.",
          'Un environnement dans lequel chaque information a sa place, chaque donnée est utile, et chaque action devient plus fluide.',
          'Notre approche repose sur trois piliers :',
        ],
        bullets: [
          "Clarté : rendre l'information immédiatement compréhensible.",
          'Maîtrise : permettre une gestion structurée, sans dispersion.',
          'Anticipation : donner les moyens d’agir avant plutôt que de subir.',
        ],
      },
      {
        title: "Plus qu'un outil, un standard",
        paragraphs: [
          "Nous ne considérons pas cette application comme un simple logiciel : c'est un standard de gestion, pensé pour accompagner l'évolution du marché et les exigences croissantes des propriétaires et des professionnels.",
          "Un outil capable de s'intégrer dans votre quotidien sans le complexifier, et de soutenir votre croissance sans créer de friction.",
        ],
      },
      {
        title: 'Une exigence constante',
        paragraphs: [
          "Chaque fonctionnalité, chaque interface, chaque détail a été conçu avec une seule intention : apporter une valeur réelle.",
        ],
        bullets: [
          'La précision plutôt que l’accumulation.',
          "L'efficacité plutôt que la complexité.",
          'La cohérence plutôt que le volume.',
        ],
      },
      {
        title: 'Notre ambition',
        paragraphs: [
          'Redéfinir la manière dont la gestion locative courte durée est pilotée.',
          'Apporter aux professionnels une solution à la hauteur de leurs enjeux.',
          'Transformer une activité souvent subie en un système maîtrisé, structuré et performant.',
        ],
      },
    ],
  },
  en: {
    aboutBackLink: 'Back to home',
    aboutPageTitle: 'About',
    introParagraphs: [
      "We didn't start by building a product.",
      'We started by observing.',
      'Before this application, we worked on the ground, at the heart of short-term rental operations — a demanding line of work where every detail matters and the slightest inefficiency immediately affects time, organisation, and performance.',
      'Over time, one reality became obvious: management had become fragmented, information scattered, and decisions were often made without enough visibility. Despite more and more tools, none offered a simple, clear, actionable read of the business.',
    ],
    blocks: [
      {
        title: 'A strong conviction',
        paragraphs: [
          'We started from a simple principle: complexity should never be inevitable.',
          'Short-term rental management can — and should — be structured, readable, and steerable.',
          'That conviction guided the creation of our solution.',
        ],
      },
      {
        title: 'A new way to run your activity',
        paragraphs: [
          'We designed an application focused on what matters: a global, instant, and reliable view.',
          'An environment where every piece of information has its place, every data point is useful, and every action flows more smoothly.',
          'Our approach rests on three pillars:',
        ],
        bullets: [
          'Clarity: make information immediately understandable.',
          'Control: enable structured management without dispersion.',
          'Anticipation: make it possible to act ahead instead of merely reacting.',
        ],
      },
      {
        title: 'More than a tool — a standard',
        paragraphs: [
          "We don't see this application as just software: it's a management standard, built to match how the market evolves and what owners and professionals increasingly expect.",
          'A tool that fits your day-to-day without adding complexity, and supports your growth without friction.',
        ],
      },
      {
        title: 'Constant standards',
        paragraphs: [
          'Every feature, every interface, every detail was shaped with one goal: real value.',
        ],
        bullets: [
          'Precision over accumulation.',
          'Efficiency over complexity.',
          'Coherence over volume.',
        ],
      },
      {
        title: 'Our ambition',
        paragraphs: [
          'Redefine how short-term rental management is run.',
          'Give professionals a solution that matches their stakes.',
          'Turn an activity too often endured into a controlled, structured, high-performing system.',
        ],
      },
    ],
  },
  es: {
    aboutBackLink: 'Volver al inicio',
    aboutPageTitle: 'Sobre nosotros',
    introParagraphs: [
      'No empezamos construyendo un producto.',
      'Empezamos observando.',
      'Antes de esta aplicación, trabajamos en el terreno, en el corazón de la gestión de alquileres de corta duración: una actividad exigente donde cada detalle cuenta y la menor ineficiencia repercute al instante en el tiempo, la organización y el rendimiento.',
      'Con el tiempo, una realidad quedó clara: la gestión estaba fragmentada, la información dispersa y las decisiones a menudo se tomaban sin visibilidad suficiente. A pesar de multiplicarse las herramientas, ninguna ofrecía una lectura simple, clara y accionable de la actividad.',
    ],
    blocks: [
      {
        title: 'Una convicción firme',
        paragraphs: [
          'Partimos de un principio simple: la complejidad no debe ser un destino inevitable.',
          'La gestión en alquiler de corta duración puede — y debe — ser estructurada, legible y gobernable.',
          'Esa convicción guió la creación de nuestra solución.',
        ],
      },
      {
        title: 'Una nueva forma de pilotar la actividad',
        paragraphs: [
          'Diseñamos una aplicación centrada en lo esencial: ofrecer una visión global, instantánea y fiable.',
          'Un entorno donde cada información tiene su lugar, cada dato es útil y cada acción fluye mejor.',
          'Nuestro enfoque se apoya en tres pilares:',
        ],
        bullets: [
          'Claridad: hacer la información comprensible al instante.',
          'Dominio: permitir una gestión estructurada, sin dispersión.',
          'Anticipación: dar medios para actuar antes que sufrir.',
        ],
      },
      {
        title: 'Más que una herramienta, un estándar',
        paragraphs: [
          'No consideramos esta aplicación como un simple software: es un estándar de gestión, pensado para acompañar la evolución del mercado y las exigencias crecientes de propietarios y profesionales.',
          'Una herramienta que encaja en el día a día sin complicarlo y apoya el crecimiento sin fricción.',
        ],
      },
      {
        title: 'Una exigencia constante',
        paragraphs: [
          'Cada funcionalidad, cada interfaz, cada detalle se diseñó con una sola intención: aportar valor real.',
        ],
        bullets: [
          'Precisión antes que acumulación.',
          'Eficacia antes que complejidad.',
          'Coherencia antes que volumen.',
        ],
      },
      {
        title: 'Nuestra ambición',
        paragraphs: [
          'Redefinir cómo se pilota la gestión en alquiler de corta duración.',
          'Ofrecer a los profesionales una solución a la altura de sus retos.',
          'Transformar una actividad a menudo sufrida en un sistema dominado, estructurado y eficaz.',
        ],
      },
    ],
  },
  de: {
    aboutBackLink: 'Zur Startseite',
    aboutPageTitle: 'Über uns',
    introParagraphs: [
      'Wir haben nicht mit dem Bau eines Produkts begonnen.',
      'Wir haben mit Beobachten begonnen.',
      'Vor dieser Anwendung waren wir vor Ort im Kern der Kurzzeitvermietung tätig — anspruchsvolle Arbeit, bei der jedes Detail zählt und die geringste Ineffizienz sich sofort auf Zeit, Organisation und Leistung auswirkt.',
      'Mit der Zeit wurde eine Realität offenbar: Die Verwaltung war zersplittert, Informationen verstreut, Entscheidungen oft ohne ausreichende Transparenz getroffen. Trotz immer mehr Tools bot keines eine einfache, klare und nutzbare Lesart des Geschäfts.',
    ],
    blocks: [
      {
        title: 'Eine starke Überzeugung',
        paragraphs: [
          'Wir gingen von einem einfachen Prinzip aus: Komplexität darf kein Schicksal sein.',
          'Kurzzeitvermietung kann — und soll — strukturiert, lesbar und steuerbar sein.',
          'Diese Überzeugung leitete die Entwicklung unserer Lösung.',
        ],
      },
      {
        title: 'Eine neue Art, das Geschäft zu steuern',
        paragraphs: [
          'Wir entwickelten eine Anwendung mit Fokus auf das Wesentliche: ein globales, schnelles und zuverlässiges Bild.',
          'Eine Umgebung, in der jede Information ihren Platz hat, jede Datenzeile nützlich ist und jede Handlung flüssiger wird.',
          'Unser Ansatz ruht auf drei Säulen:',
        ],
        bullets: [
          'Klarheit: Informationen sofort verständlich machen.',
          'Beherrschung: strukturierte Verwaltung ohne Zerstreuung.',
          'Vorausschau: handeln können, bevor man nur reagiert.',
        ],
      },
      {
        title: 'Mehr als ein Tool — ein Standard',
        paragraphs: [
          'Wir sehen diese Anwendung nicht nur als Software: Sie ist ein Managementstandard für Marktentwicklung und wachsende Anforderungen von Eigentümern und Profis.',
          'Ein Tool, das sich in den Alltag einfügt, ohne ihn zu verkomplizieren, und Wachstum ohne Reibung unterstützt.',
        ],
      },
      {
        title: 'Ständiger Anspruch',
        paragraphs: [
          'Jede Funktion, jedes Interface, jedes Detail wurde mit einer Absicht gestaltet: echten Mehrwert.',
        ],
        bullets: [
          'Präzision statt Ansammlung.',
          'Effizienz statt Komplexität.',
          'Kohärenz statt Masse.',
        ],
      },
      {
        title: 'Unser Anspruch',
        paragraphs: [
          'Kurzzeitvermietungs-Management neu denken.',
          'Profis eine Lösung geben, die ihren Herausforderungen gewachsen ist.',
          'Eine oft erduldete Tätigkeit in ein beherrschtes, strukturiertes, leistungsfähiges System verwandeln.',
        ],
      },
    ],
  },
  it: {
    aboutBackLink: "Torna all'home",
    aboutPageTitle: 'Chi siamo',
    introParagraphs: [
      'Non siamo partiti costruendo un prodotto.',
      'Siamo partiti osservando.',
      "Prima di questa applicazione eravamo sul campo, nel cuore della gestione degli affitti brevi: un'attività esigente in cui ogni dettaglio conta e la minima inefficienza si ripercuote subito su tempo, organizzazione e performance.",
      'Col tempo è emersa una realtà: la gestione era frammentata, le informazioni disperse, le decisioni spesso prese senza visibilità sufficiente. Nonostante la proliferazione di strumenti, nessuno offriva una lettura semplice, chiara e operativa dell’attività.',
    ],
    blocks: [
      {
        title: 'Una convinzione forte',
        paragraphs: [
          'Siamo partiti da un principio semplice: la complessità non deve essere un destino inevitabile.',
          'La gestione degli affitti brevi può — e deve — essere strutturata, leggibile e governabile.',
          'Questa convinzione ha guidato la creazione della nostra soluzione.',
        ],
      },
      {
        title: 'Un nuovo modo di guidare l’attività',
        paragraphs: [
          "Abbiamo progettato un'applicazione incentrata sull'essenziale: offrire una visione globale, istantanea e affidabile.",
          'Un ambiente in cui ogni informazione ha il suo posto, ogni dato è utile e ogni azione scorre meglio.',
          'Il nostro approccio si fonda su tre pilastri:',
        ],
        bullets: [
          'Chiarezza: rendere l’informazione immediatamente comprensibile.',
          'Padronanza: consentire una gestione strutturata, senza dispersione.',
          'Anticipazione: dare i mezzi per agire prima piuttosto che subire.',
        ],
      },
      {
        title: 'Più di uno strumento, uno standard',
        paragraphs: [
          'Non consideriamo questa applicazione come un semplice software: è uno standard di gestione, pensato per accompagnare l’evoluzione del mercato e le crescenti esigenze di proprietari e professionisti.',
          'Uno strumento che si integra nel quotidiano senza complicarlo e sostiene la crescita senza attrito.',
        ],
      },
      {
        title: 'Una costante esigenza',
        paragraphs: [
          'Ogni funzionalità, ogni interfaccia, ogni dettaglio è stato progettato con un’unica intenzione: portare un valore reale.',
        ],
        bullets: [
          'Precisione piuttosto che accumulo.',
          'Efficienza piuttosto che complessità.',
          'Coerenza piuttosto che volume.',
        ],
      },
      {
        title: 'La nostra ambizione',
        paragraphs: [
          'Ridefinire il modo in cui si governa la gestione degli affitti brevi.',
          'Offrire ai professionisti una soluzione all’altezza delle loro sfide.',
          'Trasformare un’attività spesso subita in un sistema padroneggiato, strutturato e performante.',
        ],
      },
    ],
  },
}
