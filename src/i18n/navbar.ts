export type Locale = 'fr' | 'es' | 'en' | 'de' | 'it'

export const LOCALES: Locale[] = ['fr', 'es', 'en', 'de', 'it']

/** Libellés du menu langue (comme demandé : noms en français) */
export const LANGUAGE_MENU_LABELS: Record<Locale, string> = {
  fr: 'Français',
  es: 'Espagnol',
  en: 'Anglais',
  de: 'Allemand',
  it: 'Italien',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: '🇫🇷',
  es: '🇪🇸',
  en: '🇬🇧',
  de: '🇩🇪',
  it: '🇮🇹',
}

export type NavbarCopy = {
  brand: string
  /** Lien vers la section « pourquoi nous » */
  whyUs: string
  features: string
  reviews: string
  pricing: string
  faq: string
  support: string
  bookCall: string
  login: string
  signup: string
  openMenu: string
  closeMenu: string
  navMainLabel: string
  navMobileLabel: string
  /** Libellé du bloc langue (onglet) dans la navbar */
  languagesTab: string
  guestDemoBadge: string
  guestDemoExit: string
  guestDemoStripHint: string
}

export const translations: Record<Locale, NavbarCopy> = {
  fr: {
    brand: 'StayPilot',
    whyUs: 'Encaisser plus',
    features: 'Fonctionnalités',
    reviews: 'Avis',
    pricing: 'Tarifs',
    faq: 'FAQ',
    support: 'Support',
    bookCall: 'Réserver un appel',
    login: 'Se connecter',
    signup: 'S’inscrire',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    navMainLabel: 'Navigation principale',
    navMobileLabel: 'Navigation mobile',
    languagesTab: 'Langues',
    guestDemoBadge: 'Démo',
    guestDemoExit: 'Quitter la démo',
    guestDemoStripHint: 'Parcours sans compte : les connexions réelles de logements sont désactivées.',
  },
  es: {
    brand: 'StayPilot',
    whyUs: 'Cobrar más',
    features: 'Palancas de ingreso',
    reviews: 'Pruebas',
    pricing: 'Precios',
    faq: 'FAQ',
    support: 'Soporte',
    bookCall: 'Hablar con un experto',
    login: 'Iniciar sesión',
    signup: 'Registrarse',
    openMenu: 'Abrir el menú',
    closeMenu: 'Cerrar el menú',
    navMainLabel: 'Navegación principal',
    navMobileLabel: 'Navegación móvil',
    languagesTab: 'Idiomas',
    guestDemoBadge: 'Demo',
    guestDemoExit: 'Salir de la demo',
    guestDemoStripHint: 'Recorrido sin cuenta: las conexiones reales de alojamientos están desactivadas.',
  },
  en: {
    brand: 'StayPilot',
    whyUs: 'Earn more',
    features: 'Revenue levers',
    reviews: 'Proof',
    pricing: 'Pricing',
    faq: 'FAQ',
    support: 'Support',
    bookCall: 'Talk to sales',
    login: 'Log in',
    signup: 'Sign up',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    navMainLabel: 'Main navigation',
    navMobileLabel: 'Mobile navigation',
    languagesTab: 'Languages',
    guestDemoBadge: 'Demo',
    guestDemoExit: 'Exit demo',
    guestDemoStripHint: 'No-account tour: real listing connections are disabled.',
  },
  de: {
    brand: 'StayPilot',
    whyUs: 'Mehr kassieren',
    features: 'Umsatz-Hebel',
    reviews: 'Bewertungen',
    pricing: 'Preise',
    faq: 'FAQ',
    support: 'Support',
    bookCall: 'Mit Expert:in sprechen',
    login: 'Anmelden',
    signup: 'Registrieren',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    navMainLabel: 'Hauptnavigation',
    navMobileLabel: 'Mobile Navigation',
    languagesTab: 'Sprachen',
    guestDemoBadge: 'Demo',
    guestDemoExit: 'Demo beenden',
    guestDemoStripHint: 'Rundgang ohne Konto: echte Unterkunftsverbindungen sind deaktiviert.',
  },
  it: {
    brand: 'StayPilot',
    whyUs: 'Incassare di più',
    features: 'Leve di ricavo',
    reviews: 'Prove',
    pricing: 'Prezzi',
    faq: 'FAQ',
    support: 'Supporto',
    bookCall: 'Parla con un esperto',
    login: 'Accedi',
    signup: 'Iscriviti',
    openMenu: 'Apri il menu',
    closeMenu: 'Chiudi il menu',
    navMainLabel: 'Navigazione principale',
    navMobileLabel: 'Navigazione mobile',
    languagesTab: 'Lingue',
    guestDemoBadge: 'Demo',
    guestDemoExit: 'Esci dalla demo',
    guestDemoStripHint: 'Tour senza account: le connessioni reali degli alloggi sono disattivate.',
  },
}
