export type ClientInvoicePdfLang = 'fr' | 'en' | 'es' | 'de' | 'it'

export function normalizeClientInvoicePdfLang(raw: string): ClientInvoicePdfLang {
  const v = String(raw || '')
    .trim()
    .toLowerCase()
    .slice(0, 2)
  if (v === 'en' || v === 'es' || v === 'de' || v === 'it') return v
  return 'fr'
}

export type ClientInvoicePdfLabels = {
  title: string
  company: string
  address: string
  formation: string
  licence: string
  invoiceFor: string
  client: string
  email: string
  property: string
  billingLine: string
  description: string
  subscriptionPrefix: string
  issueDate: string
  dueDate: string
  amountHT: string
  vat: string
  amountTTC: string
  clientType: string
  country: string
  mentionReverse: string
  mentionCollected: (vatRate: number, countryCode: string) => string
  paymentNote: string
  thanks: string
}

const LABELS: Record<ClientInvoicePdfLang, ClientInvoicePdfLabels> = {
  fr: {
    title: 'FACTURE CLIENT - STAYPILOT',
    company: 'Société',
    address: 'Adresse',
    formation: 'Formation',
    licence: 'Licence',
    invoiceFor: 'Facture pour',
    client: 'Client',
    email: 'E-mail',
    property: 'Bien',
    billingLine: 'Ligne de facturation',
    description: 'Description',
    subscriptionPrefix: 'Abonnement StayPilot',
    issueDate: "Date d'émission",
    dueDate: "Date d'échéance",
    amountHT: 'Montant HT',
    vat: 'TVA',
    amountTTC: 'Montant TTC',
    clientType: 'Type de client',
    country: 'Pays',
    mentionReverse: 'Mention fiscale : autoliquidation de la TVA (B2B).',
    mentionCollected: (vatRate, countryCode) =>
      `Mention fiscale : TVA collectée au taux de ${vatRate} % (${countryCode}).`,
    paymentNote:
      'Paiement : un changement de forfait n’est pas débité immédiatement. Le nouveau tarif s’applique à la prochaine échéance.',
    thanks: 'Merci pour votre confiance.',
  },
  en: {
    title: 'CLIENT INVOICE - STAYPILOT',
    company: 'Company',
    address: 'Address',
    formation: 'Registration',
    licence: 'License',
    invoiceFor: 'Invoice to',
    client: 'Client',
    email: 'Email',
    property: 'Property',
    billingLine: 'Billing line',
    description: 'Description',
    subscriptionPrefix: 'StayPilot subscription',
    issueDate: 'Issue date',
    dueDate: 'Due date',
    amountHT: 'Amount excl. VAT',
    vat: 'VAT',
    amountTTC: 'Amount incl. VAT',
    clientType: 'Client type',
    country: 'Country',
    mentionReverse: 'Tax notice: VAT reverse charge (B2B).',
    mentionCollected: (vatRate, countryCode) =>
      `Tax notice: VAT charged at ${vatRate}% (${countryCode}).`,
    paymentNote:
      'Payment: plan changes are not charged immediately. The new rate applies from the next billing date.',
    thanks: 'Thank you for your trust.',
  },
  es: {
    title: 'FACTURA DE CLIENTE - STAYPILOT',
    company: 'Empresa',
    address: 'Dirección',
    formation: 'Constitución',
    licence: 'Licencia',
    invoiceFor: 'Factura para',
    client: 'Cliente',
    email: 'Correo electrónico',
    property: 'Inmueble',
    billingLine: 'Línea de facturación',
    description: 'Descripción',
    subscriptionPrefix: 'Suscripción StayPilot',
    issueDate: 'Fecha de emisión',
    dueDate: 'Fecha de vencimiento',
    amountHT: 'Importe sin IVA',
    vat: 'IVA',
    amountTTC: 'Importe con IVA',
    clientType: 'Tipo de cliente',
    country: 'País',
    mentionReverse: 'Nota fiscal: inversión del sujeto pasivo (IVA) (B2B).',
    mentionCollected: (vatRate, countryCode) =>
      `Nota fiscal: IVA aplicado al ${vatRate} % (${countryCode}).`,
    paymentNote:
      'Pago: un cambio de plan no se cobra de inmediato. La nueva tarifa se aplica desde la próxima fecha de facturación.',
    thanks: 'Gracias por su confianza.',
  },
  de: {
    title: 'KUNDENRECHNUNG - STAYPILOT',
    company: 'Unternehmen',
    address: 'Adresse',
    formation: 'Eintragung',
    licence: 'Lizenz',
    invoiceFor: 'Rechnung für',
    client: 'Kunde',
    email: 'E-Mail',
    property: 'Objekt',
    billingLine: 'Rechnungsposition',
    description: 'Beschreibung',
    subscriptionPrefix: 'StayPilot-Abonnement',
    issueDate: 'Ausstellungsdatum',
    dueDate: 'Fälligkeitsdatum',
    amountHT: 'Betrag netto',
    vat: 'MwSt.',
    amountTTC: 'Betrag brutto',
    clientType: 'Kundentyp',
    country: 'Land',
    mentionReverse: 'Hinweis: Steuerschuldnerschaft des Leistungsempfängers (B2B).',
    mentionCollected: (vatRate, countryCode) =>
      `Hinweis: Umsatzsteuer ausgewiesen mit ${vatRate} % (${countryCode}).`,
    paymentNote:
      'Zahlung: Ein Planwechsel wird nicht sofort belastet. Der neue Tarif gilt ab dem nächsten Abrechnungsdatum.',
    thanks: 'Vielen Dank für Ihr Vertrauen.',
  },
  it: {
    title: 'FATTURA CLIENTE - STAYPILOT',
    company: 'Azienda',
    address: 'Indirizzo',
    formation: 'Iscrizione',
    licence: 'Licenza',
    invoiceFor: 'Fattura a',
    client: 'Cliente',
    email: 'E-mail',
    property: 'Alloggio',
    billingLine: 'Riga di fatturazione',
    description: 'Descrizione',
    subscriptionPrefix: 'Abbonamento StayPilot',
    issueDate: 'Data di emissione',
    dueDate: 'Data di scadenza',
    amountHT: 'Importo imponibile',
    vat: 'IVA',
    amountTTC: 'Importo totale',
    clientType: 'Tipo di cliente',
    country: 'Paese',
    mentionReverse: 'Nota fiscale: inversione contabile (IVA) (B2B).',
    mentionCollected: (vatRate, countryCode) =>
      `Nota fiscale: IVA assolta con aliquota ${vatRate} % (${countryCode}).`,
    paymentNote:
      "Pagamento: un cambio piano non è addebitato subito. La nuova tariffa si applica dalla prossima scadenza.",
    thanks: 'Grazie per la fiducia.',
  },
}

export function getClientInvoicePdfLabels(lang: ClientInvoicePdfLang): ClientInvoicePdfLabels {
  return LABELS[lang] ?? LABELS.fr
}
