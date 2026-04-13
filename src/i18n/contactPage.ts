import type { Locale } from './navbar'

/** Adresse support unique (alignée centre d’aide / carrières). */
export const CONTACT_EMAIL = 'contail@staypilot.fr'

export type ContactPageCopy = {
  contactBackLink: string
  contactPageTitle: string
  contactIntro: string[]
  contactReasonsTitle: string
  contactReasons: string[]
  contactEmailSectionTitle: string
  contactEmailIntro: string
  contactEmailLabel: string
  contactEmailNote: string
  contactWhatsAppTitle: string
  contactWhatsAppParagraphs: string[]
}

const fr: ContactPageCopy = {
  contactBackLink: "Retour à l'accueil",
  contactPageTitle: 'Contact',
  contactIntro: [
    'Vous pouvez nous écrire pour toute question liée à StayPilot, à votre compte ou à votre activité.',
    'Pour que votre message soit traité efficacement, choisissez ci-dessous la situation qui correspond à la vôtre, puis utilisez l’adresse e-mail indiquée.',
  ],
  contactReasonsTitle: 'Pour quelles raisons nous contacter ?',
  contactReasons: [
    'Offres, facturation ou abonnement (Starter, Pro, Scale).',
    'Aide à la prise en main ou sujet technique, une fois le centre d’aide consulté.',
    'Question sur votre compte, vos logements ou la configuration (calendriers, accès, etc.).',
    'Demande commerciale, partenariat ou projet spécifique.',
  ],
  contactEmailSectionTitle: 'Nous écrire',
  contactEmailIntro: 'L’unique canal pour nous joindre est l’e-mail. Nous vous répondons dans les meilleurs délais.',
  contactEmailLabel: 'Adresse e-mail',
  contactEmailNote:
    'Indiquez un objet clair (ex. facturation, technique, compte) pour accélérer le traitement de votre demande.',
  contactWhatsAppTitle: 'WhatsApp et offre Scale',
  contactWhatsAppParagraphs: [
    'Le support WhatsApp prioritaire est réservé exclusivement aux clients de l’offre Scale.',
    'Si vous êtes abonné Starter ou Pro, merci d’utiliser uniquement l’e-mail ci-dessus : votre demande sera traitée avec la même attention.',
    'Les abonnés Scale accèdent au canal WhatsApp depuis leur espace personnel, conformément aux conditions de leur offre.',
  ],
}

const en: ContactPageCopy = {
  contactBackLink: 'Back to home',
  contactPageTitle: 'Contact',
  contactIntro: [
    'You can reach out for anything related to StayPilot, your account, or your operations.',
    'To help us respond faster, skim the common reasons below, then use the email address provided.',
  ],
  contactReasonsTitle: 'When should you contact us?',
  contactReasons: [
    'Plans, billing, or subscription questions (Starter, Pro, Scale).',
    'Onboarding or technical help after you have checked the help center.',
    'Account, listings, or setup questions (calendars, access, etc.).',
    'Commercial enquiries, partnerships, or special projects.',
  ],
  contactEmailSectionTitle: 'Email us',
  contactEmailIntro: 'Email is the single channel to reach us. We aim to reply as quickly as we can.',
  contactEmailLabel: 'Email address',
  contactEmailNote: 'Use a clear subject line (e.g. billing, technical, account) so we can route your request faster.',
  contactWhatsAppTitle: 'WhatsApp and the Scale plan',
  contactWhatsAppParagraphs: [
    'Priority WhatsApp support is available only to customers on the Scale plan.',
    'If you are on Starter or Pro, please use the email above only — your request will receive the same care.',
    'Scale subscribers access WhatsApp from their dashboard according to their plan terms.',
  ],
}

const es: ContactPageCopy = {
  ...en,
  contactBackLink: 'Volver al inicio',
  contactPageTitle: 'Contacto',
  contactIntro: [
    'Puede escribirnos para cualquier tema relacionado con StayPilot, su cuenta o su actividad.',
    'Para agilizar la respuesta, revise los motivos habituales y use la dirección de correo indicada.',
  ],
  contactReasonsTitle: '¿Por qué motivos contactarnos?',
  contactReasons: [
    'Planes, facturación o suscripción (Starter, Pro, Scale).',
    'Ayuda de uso o técnica tras consultar el centro de ayuda.',
    'Cuenta, alojamientos o configuración (calendarios, accesos, etc.).',
    'Consultas comerciales, partnerships o proyectos específicos.',
  ],
  contactEmailSectionTitle: 'Escríbanos',
  contactEmailIntro: 'El único canal es el correo electrónico. Respondemos lo antes posible.',
  contactEmailLabel: 'Correo electrónico',
  contactEmailNote: 'Use un asunto claro (ej. facturación, técnico, cuenta) para agilizar el trámite.',
  contactWhatsAppTitle: 'WhatsApp y el plan Scale',
  contactWhatsAppParagraphs: [
    'El soporte prioritario por WhatsApp está reservado exclusivamente a clientes del plan Scale.',
    'Si está en Starter o Pro, use solo el correo indicado: su solicitud recibirá la misma atención.',
    'Los suscriptores Scale acceden a WhatsApp desde su espacio según las condiciones de su plan.',
  ],
}

const de: ContactPageCopy = {
  ...en,
  contactBackLink: 'Zur Startseite',
  contactPageTitle: 'Kontakt',
  contactIntro: [
    'Schreiben Sie uns zu StayPilot, Ihrem Konto oder Ihrem Betrieb.',
    'Damit wir schneller antworten können, lesen Sie die typischen Anlässe und nutzen Sie die angegebene E-Mail-Adresse.',
  ],
  contactReasonsTitle: 'Wann Sie uns kontaktieren können',
  contactReasons: [
    'Tarife, Abrechnung oder Abonnement (Starter, Pro, Scale).',
    'Einarbeitung oder technische Hilfe nach Konsultation des Hilfe-Centers.',
    'Konto, Unterkünfte oder Einrichtung (Kalender, Zugriffe usw.).',
    'Geschäftsanfragen, Partnerschaften oder Sonderprojekte.',
  ],
  contactEmailSectionTitle: 'Per E-Mail erreichen',
  contactEmailIntro: 'Erreichbar sind wir ausschließlich per E-Mail. Wir antworten so bald wie möglich.',
  contactEmailLabel: 'E-Mail-Adresse',
  contactEmailNote: 'Bitte klaren Betreff wählen (z. B. Abrechnung, Technik, Konto) für schnellere Bearbeitung.',
  contactWhatsAppTitle: 'WhatsApp und der Scale-Tarif',
  contactWhatsAppParagraphs: [
    'Prioritäts-Support per WhatsApp ist ausschließlich Kunden des Scale-Tarifs vorbehalten.',
    'Bei Starter oder Pro nutzen Sie bitte nur die E-Mail oben — Ihre Anfrage wird gleich sorgfältig bearbeitet.',
    'Scale-Kunden erreichen WhatsApp über ihr Konto gemäß Tarifbedingungen.',
  ],
}

const it: ContactPageCopy = {
  ...en,
  contactBackLink: "Torna all'home",
  contactPageTitle: 'Contatto',
  contactIntro: [
    'Potete scriverci per qualsiasi tema legato a StayPilot, al vostro account o alla vostra attività.',
    'Per una risposta più rapida, consultate i motivi più comuni e usate l’indirizzo e-mail indicato.',
  ],
  contactReasonsTitle: 'Per quali motivi contattarci',
  contactReasons: [
    'Piani, fatturazione o abbonamento (Starter, Pro, Scale).',
    'Supporto all’uso o tecnico dopo aver consultato il centro assistenza.',
    'Account, alloggi o configurazione (calendari, accessi, ecc.).',
    'Richieste commerciali, partnership o progetti specifici.',
  ],
  contactEmailSectionTitle: 'Scriverci',
  contactEmailIntro: 'L’unico canale è l’e-mail. Rispondiamo il prima possibile.',
  contactEmailLabel: 'Indirizzo e-mail',
  contactEmailNote: 'Usate un oggetto chiaro (es. fatturazione, tecnico, account) per velocizzare la gestione.',
  contactWhatsAppTitle: 'WhatsApp e piano Scale',
  contactWhatsAppParagraphs: [
    'Il supporto prioritario WhatsApp è riservato esclusivamente ai clienti del piano Scale.',
    'Se siete su Starter o Pro, usate solo l’e-mail sopra: la richiesta avrà la stessa attenzione.',
    'Gli abbonati Scale accedono a WhatsApp dal proprio spazio secondo le condizioni del piano.',
  ],
}

export const contactPageTranslations: Record<Locale, ContactPageCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
