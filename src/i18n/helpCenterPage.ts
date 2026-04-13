import type { Locale } from './navbar'
import { CONTACT_EMAIL } from './contactPage'

export type HelpCenterBlock = {
  title: string
  paragraphs: string[]
}

export type HelpCenterPageCopy = {
  helpBackLink: string
  helpPageKicker: string
  helpPageTitle: string
  introParagraphs: string[]
  blocks: HelpCenterBlock[]
  supportTitle: string
  supportParagraphs: string[]
  supportContactLabel: string
  supportEmail: string
}

const fr: HelpCenterPageCopy = {
  helpBackLink: "Retour à l'accueil",
  helpPageKicker: "🧾 Centre d'aide",
  helpPageTitle: "Centre d'aide",
  introParagraphs: [
    "Bienvenue dans le centre d'aide.",
    'Cette section a été conçue pour vous accompagner dans la prise en main de la plateforme et vous permettre d’exploiter pleinement ses fonctionnalités.',
    'Vous y trouverez les informations essentielles pour comprendre le fonctionnement de la solution, structurer votre utilisation et optimiser votre gestion au quotidien.',
  ],
  blocks: [
    {
      title: 'Prise en main',
      paragraphs: [
        'La plateforme a été pensée pour être simple d’accès et rapide à configurer.',
        'Après la création de votre compte, vous pouvez immédiatement commencer par ajouter vos logements.',
        'Chaque logement constitue une base de travail à partir de laquelle toutes les informations seront centralisées.',
        'L’objectif est de vous offrir une vision claire et structurée de votre activité dès les premières étapes.',
      ],
    },
    {
      title: 'Connexion des calendriers',
      paragraphs: [
        'Le fonctionnement de la plateforme repose sur l’import de vos calendriers via des liens iCal, provenant notamment de Airbnb et Booking.com.',
        'Une fois ces liens ajoutés, les disponibilités et réservations sont automatiquement intégrées dans votre espace.',
        'Ce système permet de centraliser les informations sans nécessiter de connexion complexe ou d’accès à vos comptes externes.',
      ],
    },
    {
      title: 'Organisation et gestion',
      paragraphs: [
        'La plateforme vous permet de structurer efficacement la gestion de vos logements.',
        'Vous pouvez visualiser vos réservations, organiser les tâches associées à chaque logement et suivre l’ensemble de votre activité depuis une interface unique.',
        'Cette approche vise à simplifier les opérations quotidiennes et à réduire les risques d’erreurs liés à une gestion dispersée.',
      ],
    },
    {
      title: 'Vision globale',
      paragraphs: [
        'L’un des objectifs principaux de la solution est de vous offrir une lecture claire de votre activité.',
        'Vous accédez à une vue d’ensemble de vos logements, de vos périodes de réservation et des moments clés à anticiper.',
        'Les informations présentées sont conçues pour vous aider à prendre des décisions plus rapides et plus pertinentes.',
      ],
    },
    {
      title: 'Recommandations et indications',
      paragraphs: [
        'La plateforme met à disposition des indications destinées à vous accompagner dans votre gestion.',
        'Ces éléments ne remplacent pas vos outils de réservation, mais vous permettent d’anticiper certaines situations, notamment les variations de demande.',
        'L’objectif est de vous fournir des repères utiles pour ajuster votre organisation et votre stratégie.',
      ],
    },
    {
      title: 'Accès et collaboration',
      paragraphs: [
        'Vous avez la possibilité de donner accès à votre espace à des collaborateurs.',
        'Les accès peuvent être configurés de manière restreinte, afin de limiter la visibilité aux seuls logements concernés.',
        'Cela permet de travailler de manière structurée, tout en gardant le contrôle sur les informations partagées.',
      ],
    },
    {
      title: 'Fonctionnement de la plateforme',
      paragraphs: [
        'La solution ne remplace pas un channel manager.',
        'Elle s’inscrit comme un outil complémentaire, destiné à centraliser les informations et à améliorer la lisibilité de votre activité.',
        'Les modifications liées aux réservations ou aux tarifs doivent être effectuées directement sur les plateformes d’origine.',
      ],
    },
  ],
  supportTitle: 'Support',
  supportParagraphs: [
    'Quelle que soit votre question, notre équipe reste joignable et à votre écoute.',
    'Nous privilégions des réponses précises, rapides et adaptées au contexte de votre activité, pour vous remettre sur les rails sans friction.',
  ],
  supportContactLabel: 'Écrire au support',
  supportEmail: CONTACT_EMAIL,
}

const en: HelpCenterPageCopy = {
  helpBackLink: 'Back to home',
  helpPageKicker: '🧾 Help center',
  helpPageTitle: 'Help center',
  introParagraphs: [
    'Welcome to the help center.',
    'This section is designed to help you get started with the platform and make the most of its features.',
    'Here you will find the essentials to understand how the product works, structure your day-to-day use, and run your operations more smoothly.',
  ],
  blocks: [
    {
      title: 'Getting started',
      paragraphs: [
        'The platform is built to be easy to access and quick to set up.',
        'After creating your account, you can start by adding your properties right away.',
        'Each property is a workspace where all related information comes together.',
        'The goal is to give you a clear, structured view of your activity from day one.',
      ],
    },
    {
      title: 'Connecting calendars',
      paragraphs: [
        'The platform relies on importing calendars via iCal links, including from Airbnb and Booking.com.',
        'Once those links are added, availability and bookings sync into your workspace automatically.',
        'This centralises information without complex connections or access to your external accounts.',
      ],
    },
    {
      title: 'Organisation and management',
      paragraphs: [
        'You can structure how you manage your properties in a consistent way.',
        'View bookings, organise tasks per property, and monitor your activity from a single interface.',
        'The aim is to simplify daily work and reduce errors from scattered spreadsheets or tools.',
      ],
    },
    {
      title: 'Big-picture view',
      paragraphs: [
        'A core goal is to give you a clear read on your business.',
        'You get an overview of properties, booking periods, and key moments to plan for.',
        'Information is presented to support faster, better-informed decisions.',
      ],
    },
    {
      title: 'Recommendations and guidance',
      paragraphs: [
        'The platform provides guidance to support your operations.',
        'It does not replace your booking channels, but helps you anticipate situations such as shifts in demand.',
        'The intent is to give useful reference points to adjust how you organise and plan.',
      ],
    },
    {
      title: 'Access and collaboration',
      paragraphs: [
        'You can invite collaborators into your workspace.',
        'Access can be restricted so people only see the properties that matter to them.',
        'That keeps collaboration structured while you stay in control of what is shared.',
      ],
    },
    {
      title: 'How the platform fits in',
      paragraphs: [
        'This product is not a channel manager.',
        'It is a complementary tool to centralise information and improve visibility into your activity.',
        'Changes to bookings or rates should still be made on the original platforms.',
      ],
    },
  ],
  supportTitle: 'Support',
  supportParagraphs: [
    'Whatever you need, our team is available and ready to help.',
    'We focus on clear, fast answers tailored to your situation so you can move forward without friction.',
  ],
  supportContactLabel: 'Email support',
  supportEmail: CONTACT_EMAIL,
}

const helpEs: HelpCenterPageCopy = {
  helpBackLink: 'Volver al inicio',
  helpPageKicker: '🧾 Centro de ayuda',
  helpPageTitle: 'Centro de ayuda',
  introParagraphs: [
    'Bienvenido al centro de ayuda.',
    'Esta sección está pensada para acompañarle en el uso de la plataforma y permitirle aprovechar al máximo sus funcionalidades.',
    'Encontrará aquí lo esencial para comprender el funcionamiento de la solución, estructurar su uso y optimizar su gestión cotidiana.',
  ],
  blocks: [
    {
      title: 'Primeros pasos',
      paragraphs: [
        'La plataforma está diseñada para ser fácil de acceder y rápida de configurar.',
        'Tras crear su cuenta, puede empezar de inmediato añadiendo sus alojamientos.',
        'Cada alojamiento es una base de trabajo desde la que se centralizará toda la información.',
        'El objetivo es ofrecerle una visión clara y estructurada de su actividad desde los primeros pasos.',
      ],
    },
    {
      title: 'Conexión de calendarios',
      paragraphs: [
        'El funcionamiento de la plataforma se basa en importar sus calendarios mediante enlaces iCal, en particular desde Airbnb y Booking.com.',
        'Una vez añadidos esos enlaces, las disponibilidades y reservas se integran automáticamente en su espacio.',
        'Este sistema centraliza la información sin necesidad de conexiones complejas ni acceso a sus cuentas externas.',
      ],
    },
    {
      title: 'Organización y gestión',
      paragraphs: [
        'La plataforma le permite estructurar de forma eficaz la gestión de sus alojamientos.',
        'Puede visualizar sus reservas, organizar las tareas asociadas a cada alojamiento y seguir toda su actividad desde una interfaz única.',
        'Este enfoque simplifica las operaciones diarias y reduce el riesgo de errores ligados a una gestión dispersa.',
      ],
    },
    {
      title: 'Visión global',
      paragraphs: [
        'Uno de los objetivos principales de la solución es ofrecerle una lectura clara de su actividad.',
        'Puede acceder a una visión general de sus alojamientos, sus periodos de reserva y los momentos clave a anticipar.',
        'La información presentada está pensada para ayudarle a tomar decisiones más rápidas y acertadas.',
      ],
    },
    {
      title: 'Recomendaciones e indicaciones',
      paragraphs: [
        'La plataforma pone a su disposición indicaciones para acompañarle en su gestión.',
        'Estos elementos no sustituyen sus herramientas de reserva, pero le permiten anticipar ciertas situaciones, en particular las variaciones de la demanda.',
        'El objetivo es darle puntos de referencia útiles para ajustar su organización y su estrategia.',
      ],
    },
    {
      title: 'Acceso y colaboración',
      paragraphs: [
        'Puede dar acceso a su espacio a colaboradores.',
        'Los accesos pueden configurarse de forma restringida, limitando la visibilidad a los alojamientos concernidos.',
        'Así se trabaja de forma estructurada manteniendo el control sobre la información compartida.',
      ],
    },
    {
      title: 'Funcionamiento de la plataforma',
      paragraphs: [
        'La solución no sustituye a un channel manager.',
        'Se presenta como una herramienta complementaria, destinada a centralizar la información y mejorar la legibilidad de su actividad.',
        'Las modificaciones relativas a reservas o tarifas deben realizarse directamente en las plataformas de origen.',
      ],
    },
  ],
  supportTitle: 'Soporte',
  supportParagraphs: [
    'Sea cual sea su consulta, nuestro equipo está disponible y a su escucha.',
    'Priorizamos respuestas precisas, rápidas y adaptadas al contexto de su actividad, para que retome el ritmo sin fricción.',
  ],
  supportContactLabel: 'Escribir al soporte',
  supportEmail: CONTACT_EMAIL,
}

const helpDe: HelpCenterPageCopy = {
  helpBackLink: 'Zur Startseite',
  helpPageKicker: '🧾 Hilfe-Center',
  helpPageTitle: 'Hilfe-Center',
  introParagraphs: [
    'Willkommen im Hilfe-Center.',
    'Dieser Bereich soll Sie beim Einstieg in die Plattform begleiten und Ihnen helfen, alle Funktionen voll zu nutzen.',
    'Hier finden Sie das Wesentliche, um die Lösung zu verstehen, Ihre Nutzung zu strukturieren und den Alltag effizienter zu steuern.',
  ],
  blocks: [
    {
      title: 'Erste Schritte',
      paragraphs: [
        'Die Plattform ist leicht zugänglich und schnell einzurichten.',
        'Nach der Kontoerstellung können Sie sofort mit dem Hinzufügen Ihrer Unterkünfte beginnen.',
        'Jede Unterkunft ist eine Arbeitsbasis, auf der alle Informationen zusammenlaufen.',
        'Ziel ist eine klare, strukturierte Sicht auf Ihre Aktivität von Anfang an.',
      ],
    },
    {
      title: 'Kalender anbinden',
      paragraphs: [
        'Die Plattform basiert auf dem Import Ihrer Kalender per iCal-Links, etwa von Airbnb und Booking.com.',
        'Nach dem Hinzufügen werden Verfügbarkeiten und Buchungen automatisch in Ihren Bereich übernommen.',
        'So werden Daten zentralisiert — ohne komplexe Anbindungen oder Zugriff auf Ihre externen Konten.',
      ],
    },
    {
      title: 'Organisation und Steuerung',
      paragraphs: [
        'Sie können das Management Ihrer Unterkünfte effizient strukturieren.',
        'Sie sehen Buchungen ein, organisieren Aufgaben je Unterkunft und verfolgen die gesamte Aktivität über eine einzige Oberfläche.',
        'Das vereinfacht den Tagesbetrieb und verringert Fehlerrisiken durch zerstreute Ablage.',
      ],
    },
    {
      title: 'Gesamtbild',
      paragraphs: [
        'Ein Hauptziel ist eine klare Lesart Ihrer Aktivität.',
        'Sie erhalten Überblick über Unterkünfte, Buchungszeiträume und wichtige Termine im Voraus.',
        'Die Darstellung soll schnellere, fundiertere Entscheidungen unterstützen.',
      ],
    },
    {
      title: 'Hinweise und Empfehlungen',
      paragraphs: [
        'Die Plattform stellt Hinweise bereit, die Ihr Management unterstützen.',
        'Sie ersetzen keine Buchungskanäle, helfen aber, Situationen wie Nachfrageschwankungen früh zu erkennen.',
        'Ziel sind nützliche Orientierungspunkte für Organisation und Strategie.',
      ],
    },
    {
      title: 'Zugang und Zusammenarbeit',
      paragraphs: [
        'Sie können Mitarbeitende in Ihren Bereich einladen.',
        'Zugriffe lassen sich einschränken, sodass nur die betreffenden Unterkünfte sichtbar sind.',
        'So bleibt die Zusammenarbeit strukturiert und Sie behalten die Kontrolle über geteilte Informationen.',
      ],
    },
    {
      title: 'Einordnung der Plattform',
      paragraphs: [
        'Die Lösung ist kein Channel-Manager.',
        'Sie ergänzt Ihre Tools, bündelt Informationen und verbessert die Lesbarkeit Ihrer Aktivität.',
        'Änderungen an Buchungen oder Preisen nehmen Sie weiterhin direkt auf den Ursprungsplattformen vor.',
      ],
    },
  ],
  supportTitle: 'Support',
  supportParagraphs: [
    'Bei jeder Frage ist unser Team erreichbar und für Sie da.',
    'Wir legen Wert auf präzise, schnelle Antworten, passend zu Ihrer Situation — damit Sie ohne Reibung weiterkommen.',
  ],
  supportContactLabel: 'Support schreiben',
  supportEmail: CONTACT_EMAIL,
}

const helpIt: HelpCenterPageCopy = {
  helpBackLink: "Torna all'home",
  helpPageKicker: '🧾 Centro assistenza',
  helpPageTitle: 'Centro assistenza',
  introParagraphs: [
    'Benvenuto nel centro assistenza.',
    'Questa sezione è pensata per accompagnarti nell’uso della piattaforma e sfruttare appieno le sue funzionalità.',
    'Troverai qui le informazioni essenziali per capire il funzionamento della soluzione, strutturare l’uso quotidiano e ottimizzare la gestione.',
  ],
  blocks: [
    {
      title: 'Primi passi',
      paragraphs: [
        'La piattaforma è pensata per essere semplice da raggiungere e rapida da configurare.',
        'Dopo la creazione dell’account puoi subito iniziare aggiungendo i tuoi alloggi.',
        'Ogni alloggio è una base di lavoro da cui tutte le informazioni saranno centralizzate.',
        'L’obiettivo è offrirti una visione chiara e strutturata dell’attività fin dalle prime fasi.',
      ],
    },
    {
      title: 'Collegamento dei calendari',
      paragraphs: [
        'Il funzionamento si basa sull’importazione dei calendari tramite link iCal, in particolare da Airbnb e Booking.com.',
        'Una volta aggiunti i link, disponibilità e prenotazioni si integrano automaticamente nel tuo spazio.',
        'Il sistema centralizza le informazioni senza connessioni complesse né accesso ai tuoi account esterni.',
      ],
    },
    {
      title: 'Organizzazione e gestione',
      paragraphs: [
        'La piattaforma ti permette di strutturare in modo efficace la gestione degli alloggi.',
        'Puoi visualizzare le prenotazioni, organizzare le attività per ogni alloggio e seguire l’intera attività da un’unica interfaccia.',
        'L’approccio mira a semplificare le operazioni quotidiane e ridurre gli errori legati a una gestione frammentata.',
      ],
    },
    {
      title: 'Visione d’insieme',
      paragraphs: [
        'Uno degli obiettivi principali è offrirti una lettura chiara dell’attività.',
        'Accedi a una panoramica di alloggi, periodi di prenotazione e momenti chiave da anticipare.',
        'Le informazioni sono pensate per decisioni più rapide e pertinenti.',
      ],
    },
    {
      title: 'Raccomandazioni e indicazioni',
      paragraphs: [
        'La piattaforma mette a disposizione indicazioni per supportare la tua gestione.',
        'Non sostituiscono i canali di prenotazione, ma aiutano ad anticipare situazioni come le variazioni della domanda.',
        'L’intento è fornire punti di riferimento utili per organizzazione e strategia.',
      ],
    },
    {
      title: 'Accesso e collaborazione',
      paragraphs: [
        'Puoi dare accesso al tuo spazio a collaboratori.',
        'Gli accessi possono essere limitati ai soli alloggi interessati.',
        'Così si lavora in modo strutturato mantenendo il controllo sulle informazioni condivise.',
      ],
    },
    {
      title: 'Ruolo della piattaforma',
      paragraphs: [
        'La soluzione non sostituisce un channel manager.',
        'È uno strumento complementare per centralizzare le informazioni e migliorare la leggibilità dell’attività.',
        'Le modifiche a prenotazioni o tariffe vanno effettuate direttamente sulle piattaforme di origine.',
      ],
    },
  ],
  supportTitle: 'Supporto',
  supportParagraphs: [
    'Per qualsiasi domanda il nostro team è raggiungibile e in ascolto.',
    'Privilegiamo risposte precise, rapide e adatte al contesto della tua attività, per farti ripartire senza attriti.',
  ],
  supportContactLabel: 'Scrivi al supporto',
  supportEmail: CONTACT_EMAIL,
}

export const helpCenterPageTranslations: Record<Locale, HelpCenterPageCopy> = {
  fr,
  en,
  es: helpEs,
  de: helpDe,
  it: helpIt,
}
