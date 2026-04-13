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
    'StayManager : plus de nuits payées, plus de cash sur le compte — moins de soirées perdues sur Airbnb.',
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
  footerTagline:
    'StayManager: more paid nights, more cash in the bank—fewer nights lost refreshing Airbnb.',
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
  footerTagline:
    'StayManager: más noches pagadas, más cash en cuenta — menos noches perdidas en Airbnb.',
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
    'StayManager: mehr bezahlte Nächte, mehr Cash auf dem Konto — weniger Abende mit Airbnb-Refresh.',
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
    'StayManager: più notti pagate, più cash in conto — meno serate buttate su Airbnb.',
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
