import type { Locale } from './navbar'

export type FooterCopy = {
  footerTagline: string
  footerColProduct: string
  footerColCompany: string
  footerColSupport: string
  footerLinkFeatures: string
  footerLinkPricing: string
  footerLinkNews: string
  footerLinkAbout: string
  footerLinkBlog: string
  footerLinkCareers: string
  footerLinkHelp: string
  footerLinkContact: string
  footerLinkFaq: string
  footerCopyright: string
  footerLegal: string
  footerPrivacy: string
  footerTerms: string
}

const fr: FooterCopy = {
  footerTagline:
    'Automatisez vos locations courte durée. Plus de revenus, moins de charge opérationnelle.',
  footerColProduct: 'Produit',
  footerColCompany: 'Entreprise',
  footerColSupport: 'Support',
  footerLinkFeatures: 'Fonctionnalités',
  footerLinkPricing: 'Tarifs',
  footerLinkNews: 'Nouveautés',
  footerLinkAbout: 'À propos',
  footerLinkBlog: 'Blog',
  footerLinkCareers: 'Carrières',
  footerLinkHelp: "Centre d'aide",
  footerLinkContact: 'Contact',
  footerLinkFaq: 'FAQ',
  footerCopyright: '© 2026 StayManager. Tous droits réservés.',
  footerLegal: 'Mentions légales',
  footerPrivacy: 'Confidentialité',
  footerTerms: 'CGU',
}

const en: FooterCopy = {
  footerTagline: 'Automate short-term rentals. Grow revenue. Cut operational drag.',
  footerColProduct: 'Product',
  footerColCompany: 'Company',
  footerColSupport: 'Support',
  footerLinkFeatures: 'Features',
  footerLinkPricing: 'Pricing',
  footerLinkNews: "What's new",
  footerLinkAbout: 'About',
  footerLinkBlog: 'Blog',
  footerLinkCareers: 'Careers',
  footerLinkHelp: 'Help center',
  footerLinkContact: 'Contact',
  footerLinkFaq: 'FAQ',
  footerCopyright: '© 2026 StayManager. All rights reserved.',
  footerLegal: 'Legal notice',
  footerPrivacy: 'Privacy',
  footerTerms: 'Terms',
}

const es: FooterCopy = {
  footerTagline: 'Automatice alquileres turísticos. Más ingresos, menos carga operativa.',
  footerColProduct: 'Producto',
  footerColCompany: 'Empresa',
  footerColSupport: 'Soporte',
  footerLinkFeatures: 'Funcionalidades',
  footerLinkPricing: 'Precios',
  footerLinkNews: 'Novedades',
  footerLinkAbout: 'Sobre nosotros',
  footerLinkBlog: 'Blog',
  footerLinkCareers: 'Carreras',
  footerLinkHelp: 'Centro de ayuda',
  footerLinkContact: 'Contacto',
  footerLinkFaq: 'FAQ',
  footerCopyright: '© 2026 StayManager. Todos los derechos reservados.',
  footerLegal: 'Aviso legal',
  footerPrivacy: 'Privacidad',
  footerTerms: 'Términos',
}

const de: FooterCopy = {
  footerTagline:
    'Kurzzeitvermietung automatisieren. Mehr Umsatz, weniger operative Last.',
  footerColProduct: 'Produkt',
  footerColCompany: 'Unternehmen',
  footerColSupport: 'Support',
  footerLinkFeatures: 'Funktionen',
  footerLinkPricing: 'Preise',
  footerLinkNews: 'Neuigkeiten',
  footerLinkAbout: 'Über uns',
  footerLinkBlog: 'Blog',
  footerLinkCareers: 'Karriere',
  footerLinkHelp: 'Hilfe-Center',
  footerLinkContact: 'Kontakt',
  footerLinkFaq: 'FAQ',
  footerCopyright: '© 2026 StayManager. Alle Rechte vorbehalten.',
  footerLegal: 'Impressum',
  footerPrivacy: 'Datenschutz',
  footerTerms: 'AGB',
}

const it: FooterCopy = {
  footerTagline:
    'Automatizzate gli affitti brevi. Più ricavi, meno carico operativo.',
  footerColProduct: 'Prodotto',
  footerColCompany: 'Azienda',
  footerColSupport: 'Supporto',
  footerLinkFeatures: 'Funzionalità',
  footerLinkPricing: 'Prezzi',
  footerLinkNews: 'Novità',
  footerLinkAbout: 'Chi siamo',
  footerLinkBlog: 'Blog',
  footerLinkCareers: 'Lavora con noi',
  footerLinkHelp: 'Centro assistenza',
  footerLinkContact: 'Contatto',
  footerLinkFaq: 'FAQ',
  footerCopyright: '© 2026 StayManager. Tutti i diritti riservati.',
  footerLegal: 'Note legali',
  footerPrivacy: 'Privacy',
  footerTerms: 'Termini',
}

export const footerTranslations: Record<Locale, FooterCopy> = {
  fr,
  en,
  es,
  de,
  it,
}
