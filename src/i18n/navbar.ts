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
}

export const translations: Record<Locale, NavbarCopy> = {
  fr: {
    brand: 'StayManager',
    whyUs: 'Pourquoi nous',
    features: 'Fonctionnalités',
    reviews: 'Avis',
    pricing: 'Tarifs',
    faq: 'FAQ',
    support: 'Support',
    bookCall: 'Parler à un expert',
    login: 'Se connecter',
    signup: 'Inscription',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    navMainLabel: 'Navigation principale',
    navMobileLabel: 'Navigation mobile',
    languagesTab: 'Langues',
  },
  es: {
    brand: 'StayManager',
    whyUs: 'Por qué nosotros',
    features: 'Funcionalidades',
    reviews: 'Reseñas',
    pricing: 'Precios',
    faq: 'FAQ',
    support: 'Soporte',
    bookCall: 'Hablar con un experto',
    login: 'Iniciar sesión',
    signup: 'Registro',
    openMenu: 'Abrir el menú',
    closeMenu: 'Cerrar el menú',
    navMainLabel: 'Navegación principal',
    navMobileLabel: 'Navegación móvil',
    languagesTab: 'Idiomas',
  },
  en: {
    brand: 'StayManager',
    whyUs: 'Why us',
    features: 'Features',
    reviews: 'Reviews',
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
  },
  de: {
    brand: 'StayManager',
    whyUs: 'Warum wir',
    features: 'Funktionen',
    reviews: 'Bewertungen',
    pricing: 'Preise',
    faq: 'FAQ',
    support: 'Support',
    bookCall: 'Mit Expert:in sprechen',
    login: 'Anmelden',
    signup: 'Registrierung',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    navMainLabel: 'Hauptnavigation',
    navMobileLabel: 'Mobile Navigation',
    languagesTab: 'Sprachen',
  },
  it: {
    brand: 'StayManager',
    whyUs: 'Perché noi',
    features: 'Funzionalità',
    reviews: 'Recensioni',
    pricing: 'Prezzi',
    faq: 'FAQ',
    support: 'Supporto',
    bookCall: 'Parla con un esperto',
    login: 'Accedi',
    signup: 'Iscrizione',
    openMenu: 'Apri il menu',
    closeMenu: 'Chiudi il menu',
    navMainLabel: 'Navigazione principale',
    navMobileLabel: 'Navigazione mobile',
    languagesTab: 'Lingue',
  },
}
