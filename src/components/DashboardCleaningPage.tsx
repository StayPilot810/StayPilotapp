import { ClipboardList, Copy, FileText, ImagePlus, Inbox, Link2, ListChecks, Receipt, Send, Wallet, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_APARTMENT_ROW_COUNT, DEMO_MONTH_INDEX, DEMO_YEAR } from '../data/demoCalendarBookings'
import { useLanguage } from '../hooks/useLanguage'
import type { Locale } from '../i18n/navbar'
import { getStoredAccounts } from '../lib/accounts'
import { getConnectedApartmentsFromStorage, type ConnectedApartment } from '../utils/connectedApartments'
import { isTestModeEnabled } from '../utils/testMode'
import { getDemoCheckoutEventsForSuivi, type SuiviCheckoutEvent } from '../utils/suiviMenageCheckouts'

type InvoiceDirection = 'received' | 'sent'
type CleaningPanel = 'overview' | 'providers' | 'invoices' | 'chat' | 'tasks' | 'suivi'
type TaskFrequency = 'weekly' | 'monthly'

type CleaningInvoice = {
  id: string
  direction: InvoiceDirection
  label: string
  provider: string
  ownerUsername?: string
  counterpartyUsername?: string
  month: string
  amountEur: number
  fileName: string
  note: string
  createdAt: string
}

type CleaningChatMessage = {
  id: string
  provider: string
  sender: 'manager' | 'provider'
  text: string
  imageDataUrl?: string
  createdAt: string
}

const VAT_RATE_BY_COUNTRY: Record<string, number> = {
  FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21, PT: 23, IE: 23, LU: 17, AT: 20,
  SE: 25, DK: 25, FI: 24, PL: 23, CZ: 21, RO: 19, BG: 20, GR: 24, HR: 25, HU: 27,
  SK: 20, SI: 22, LT: 21, LV: 21, EE: 22,
}

type CleaningTaskItem = {
  id: string
  label: string
  done: boolean
  doneAt?: string
}

type CleaningTaskBoard = {
  id: string
  apartmentId: string
  apartmentName: string
  month: string
  frequency: TaskFrequency
  provider: string
  tasks: CleaningTaskItem[]
  updatedAt: string
}

const STORAGE_KEY = 'staypilot_cleaning_invoices_v1'
const CHAT_STORAGE_KEY = 'staypilot_cleaning_chat_v1'
const TASK_BOARDS_KEY = 'staypilot_cleaning_task_boards_v1'
const CLEANER_INVITES_KEY = 'staypilot_cleaner_invites_v1'
const PROVIDER_ASSIGNMENTS_KEY = 'staypilot_cleaning_provider_assignments_v1'
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_CURRENT_ROLE = 'staypilot_current_role'
const LS_LOGIN_IDENTIFIER = 'staypilot_login_identifier'
const MAX_CHAT_IMAGE_DATA_URL_LEN = 500_000

const cleaningCopy: Record<
  Locale,
  {
    invoicesTitle: string
    invoicesSubtitle: string
    invoicesAddTitle: string
    invoicesDirectionHint: string
    invoicesReceived: string
    invoicesSent: string
    label: string
    provider: string
    selectProvider: string
    noProvider: string
    month: string
    amountEur: string
    invoiceFileOptional: string
    noteOptional: string
    sendTo: string
    addInvoice: string
    total: string
    shownMonth: string
    previous: string
    next: string
    allProviders: string
    noInvoiceYet: string
    delete: string
    importantInfo: string
    importantInfoBody: string
    backToCleaningTools: string
  }
> = {
  fr: {
    invoicesTitle: 'Gérer les factures',
    invoicesSubtitle: 'Créez, suivez et exportez en PDF vos factures de ménage (reçues ou émises).',
    invoicesAddTitle: 'Ajouter une facture',
    invoicesDirectionHint: 'Choisissez si la facture est reçue du prestataire ménage ou envoyée par vous.',
    invoicesReceived: 'Factures reçues',
    invoicesSent: 'Factures envoyées',
    label: 'Libellé',
    provider: 'Prestataire ménage',
    selectProvider: 'Sélectionner un prestataire',
    noProvider: 'Aucun prestataire enregistré',
    month: 'Mois',
    amountEur: 'Montant TTC (EUR)',
    invoiceFileOptional: 'Fichier facture (optionnel)',
    noteOptional: 'Note (optionnel)',
    sendTo: 'Envoyer à :',
    addInvoice: 'Ajouter la facture',
    total: 'Total',
    shownMonth: 'Mois affiché',
    previous: '← Précédent',
    next: 'Suivant →',
    allProviders: 'Tous les prestataires',
    noInvoiceYet: "Aucune facture pour l'instant.",
    delete: 'Supprimer',
    importantInfo: 'Information importante',
    importantInfoBody:
      'Cet espace sert à créer, centraliser et suivre vos factures de ménage (mois, prestataire, PDF). Le règlement financier n’est pas géré dans StayPilot : le paiement doit être effectué hors plateforme (virement, espèces ou autre moyen convenu entre vous).',
    backToCleaningTools: '← Retour aux outils prestataire ménage',
  },
  en: {
    invoicesTitle: 'Manage invoices',
    invoicesSubtitle: 'Create, track and export your cleaning invoices to PDF (received or sent).',
    invoicesAddTitle: 'Add invoice',
    invoicesDirectionHint: 'Choose whether the invoice is received from the cleaner or sent by you.',
    invoicesReceived: 'Received invoices',
    invoicesSent: 'Sent invoices',
    label: 'Label',
    provider: 'Cleaning provider',
    selectProvider: 'Select a provider',
    noProvider: 'No provider registered',
    month: 'Month',
    amountEur: 'Amount incl. VAT (EUR)',
    invoiceFileOptional: 'Invoice file (optional)',
    noteOptional: 'Note (optional)',
    sendTo: 'Send to:',
    addInvoice: 'Add invoice',
    total: 'Total',
    shownMonth: 'Displayed month',
    previous: '← Previous',
    next: 'Next →',
    allProviders: 'All providers',
    noInvoiceYet: 'No invoices yet.',
    delete: 'Delete',
    importantInfo: 'Important information',
    importantInfoBody:
      'This area is used to create, centralize and track your cleaning invoices (month, provider, PDF). Financial transfer is not handled in StayPilot: payment must be made outside the platform (bank transfer, cash, or any method agreed between you).',
    backToCleaningTools: '← Back to cleaning tools',
  },
  es: {
    invoicesTitle: 'Gestionar facturas',
    invoicesSubtitle: 'Crea, sigue y exporta en PDF tus facturas de limpieza (recibidas o enviadas).',
    invoicesAddTitle: 'Añadir factura',
    invoicesDirectionHint: 'Elige si la factura es recibida del proveedor de limpieza o enviada por ti.',
    invoicesReceived: 'Facturas recibidas',
    invoicesSent: 'Facturas enviadas',
    label: 'Concepto',
    provider: 'Proveedor de limpieza',
    selectProvider: 'Seleccionar proveedor',
    noProvider: 'Ningún proveedor registrado',
    month: 'Mes',
    amountEur: 'Importe con IVA (EUR)',
    invoiceFileOptional: 'Archivo de factura (opcional)',
    noteOptional: 'Nota (opcional)',
    sendTo: 'Enviar a:',
    addInvoice: 'Añadir factura',
    total: 'Total',
    shownMonth: 'Mes mostrado',
    previous: '← Anterior',
    next: 'Siguiente →',
    allProviders: 'Todos los proveedores',
    noInvoiceYet: 'Todavía no hay facturas.',
    delete: 'Eliminar',
    importantInfo: 'Información importante',
    importantInfoBody:
      'Este espacio sirve para crear, centralizar y seguir tus facturas de limpieza (mes, proveedor, PDF). El pago no se gestiona en StayPilot: debe realizarse fuera de la plataforma (transferencia, efectivo u otro medio acordado entre vosotros).',
    backToCleaningTools: '← Volver a herramientas de limpieza',
  },
  de: {
    invoicesTitle: 'Rechnungen verwalten',
    invoicesSubtitle: 'Erstellen, verfolgen und exportieren Sie Ihre Reinigungsrechnungen als PDF (eingehend oder gesendet).',
    invoicesAddTitle: 'Rechnung hinzufügen',
    invoicesDirectionHint: 'Wählen Sie, ob die Rechnung vom Reinigungsdienst empfangen oder von Ihnen gesendet wird.',
    invoicesReceived: 'Eingehende Rechnungen',
    invoicesSent: 'Gesendete Rechnungen',
    label: 'Bezeichnung',
    provider: 'Reinigungsdienst',
    selectProvider: 'Dienstleister auswählen',
    noProvider: 'Kein Dienstleister registriert',
    month: 'Monat',
    amountEur: 'Betrag inkl. MwSt. (EUR)',
    invoiceFileOptional: 'Rechnungsdatei (optional)',
    noteOptional: 'Notiz (optional)',
    sendTo: 'Senden an:',
    addInvoice: 'Rechnung hinzufügen',
    total: 'Gesamt',
    shownMonth: 'Angezeigter Monat',
    previous: '← Zurück',
    next: 'Weiter →',
    allProviders: 'Alle Dienstleister',
    noInvoiceYet: 'Noch keine Rechnungen.',
    delete: 'Löschen',
    importantInfo: 'Wichtige Information',
    importantInfoBody:
      'Dieser Bereich dient zum Erstellen, Zentralisieren und Verfolgen Ihrer Reinigungsrechnungen (Monat, Dienstleister, PDF). Die Zahlung wird nicht von StayPilot abgewickelt: sie muss außerhalb der Plattform erfolgen (Überweisung, Bargeld oder andere zwischen Ihnen vereinbarte Methode).',
    backToCleaningTools: '← Zurück zu Reinigungs-Tools',
  },
  it: {
    invoicesTitle: 'Gestisci fatture',
    invoicesSubtitle: 'Crea, monitora ed esporta in PDF le tue fatture di pulizia (ricevute o inviate).',
    invoicesAddTitle: 'Aggiungi fattura',
    invoicesDirectionHint: 'Scegli se la fattura è ricevuta dal fornitore pulizie o inviata da te.',
    invoicesReceived: 'Fatture ricevute',
    invoicesSent: 'Fatture inviate',
    label: 'Descrizione',
    provider: 'Fornitore pulizie',
    selectProvider: 'Seleziona fornitore',
    noProvider: 'Nessun fornitore registrato',
    month: 'Mese',
    amountEur: 'Importo IVA inclusa (EUR)',
    invoiceFileOptional: 'File fattura (opzionale)',
    noteOptional: 'Nota (opzionale)',
    sendTo: 'Invia a:',
    addInvoice: 'Aggiungi fattura',
    total: 'Totale',
    shownMonth: 'Mese visualizzato',
    previous: '← Precedente',
    next: 'Successivo →',
    allProviders: 'Tutti i fornitori',
    noInvoiceYet: 'Nessuna fattura al momento.',
    delete: 'Elimina',
    importantInfo: 'Informazione importante',
    importantInfoBody:
      'Questo spazio serve per creare, centralizzare e monitorare le tue fatture di pulizia (mese, fornitore, PDF). Il pagamento non è gestito da StayPilot: deve essere effettuato fuori piattaforma (bonifico, contanti o altro metodo concordato tra voi).',
    backToCleaningTools: '← Torna agli strumenti pulizie',
  },
}

type CleanerInvite = {
  code: string
  hostUsername: string
  createdAt: string
}

function readCleanerInvites(): CleanerInvite[] {
  try {
    const raw = localStorage.getItem(CLEANER_INVITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CleanerInvite[]) : []
  } catch {
    return []
  }
}

function saveCleanerInvites(invites: CleanerInvite[]) {
  localStorage.setItem(CLEANER_INVITES_KEY, JSON.stringify(invites))
}

function createInviteCode() {
  return `SPM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function compressImageToJpegDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image'))
      el.src = url
    })
    const maxW = 1280
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxW) {
      h = Math.round((h * maxW) / w)
      w = maxW
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function formatChatMessageTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch {
    return ''
  }
}

function formatChatMessageTitle(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return ''
  }
}

function chatDayKey(iso: string): string {
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

function formatChatDayLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return ''
  }
}

function readInvoices(): CleaningInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean)
  } catch {
    return []
  }
}

function saveInvoices(invoices: CleaningInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
}

function readChatMessages(): CleaningChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean).map((row: CleaningChatMessage) => {
      const img =
        typeof row.imageDataUrl === 'string' && row.imageDataUrl.startsWith('data:image/jpeg;base64,')
          ? row.imageDataUrl
          : undefined
      return {
        ...row,
        text: typeof row.text === 'string' ? row.text : '',
        imageDataUrl: img,
      }
    })
  } catch {
    return []
  }
}

function saveChatMessages(messages: CleaningChatMessage[]) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
}

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function defaultTaskLabels(frequency: TaskFrequency): string[] {
  if (frequency === 'weekly') {
    return [
      'Vider et nettoyer les poubelles',
      'Dépoussiérer meubles et surfaces visibles',
      'Aspirer puis passer la serpillière (sols)',
      'Nettoyer salle de bain (lavabo, miroir, douche)',
      'Vérifier le stock papier toilette et essuie-tout',
    ]
  }
  return [
    'Nettoyer les vitres (côté intérieur)',
    'Nettoyer plinthes, coins et zones peu passées',
    'Détartrer bouilloire / cafetière',
    'Nettoyer hottes, filtres simples et extérieurs d’électroménager',
    'Aspirer sous canapé / lit (accès possible)',
    'Dépoussiérer interrupteurs, poignées de portes et rampes',
  ]
}

function newTaskBoard(
  apartmentId: string,
  apartmentName: string,
  month: string,
  frequency: TaskFrequency,
  provider: string,
): CleaningTaskBoard {
  const labels = defaultTaskLabels(frequency)
  const now = new Date().toISOString()
  return {
    id: randomId(),
    apartmentId,
    apartmentName,
    month,
    frequency,
    provider: provider.trim(),
    tasks: labels.map((label) => ({ id: randomId(), label, done: false })),
    updatedAt: now,
  }
}

function normalizeTaskBoard(row: Partial<CleaningTaskBoard>): CleaningTaskBoard | null {
  if (!row || typeof row !== 'object') return null
  if (typeof row.apartmentId !== 'string' || typeof row.month !== 'string') return null
  if (row.frequency !== 'weekly' && row.frequency !== 'monthly') return null
  const tasksRaw = Array.isArray(row.tasks) ? row.tasks : []
  const tasks: CleaningTaskItem[] = tasksRaw
    .filter((t): t is CleaningTaskItem => Boolean(t && typeof (t as CleaningTaskItem).label === 'string'))
    .map((t) => ({
      id: typeof t.id === 'string' ? t.id : randomId(),
      label: String(t.label),
      done: Boolean(t.done),
      doneAt: typeof t.doneAt === 'string' ? t.doneAt : undefined,
    }))
  return {
    id: typeof row.id === 'string' ? row.id : randomId(),
    apartmentId: row.apartmentId,
    apartmentName: typeof row.apartmentName === 'string' ? row.apartmentName : '',
    month: row.month,
    frequency: row.frequency,
    provider: typeof row.provider === 'string' ? row.provider : '',
    tasks,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
  }
}

function readTaskBoards(): CleaningTaskBoard[] {
  try {
    const raw = localStorage.getItem(TASK_BOARDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((r) => normalizeTaskBoard(r)).filter(Boolean) as CleaningTaskBoard[]
  } catch {
    return []
  }
}

function saveTaskBoards(boards: CleaningTaskBoard[]) {
  localStorage.setItem(TASK_BOARDS_KEY, JSON.stringify(boards))
}

function readProviderAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PROVIDER_ASSIGNMENTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    Object.entries(parsed).forEach(([apartmentId, provider]) => {
      if (typeof apartmentId === 'string' && typeof provider === 'string') out[apartmentId] = provider
    })
    return out
  } catch {
    return {}
  }
}

function saveProviderAssignments(map: Record<string, string>) {
  localStorage.setItem(PROVIDER_ASSIGNMENTS_KEY, JSON.stringify(map))
}

type SuiviMenageReport = {
  note: string
  photosBefore: string[]
  photosAfter: string[]
  keyInBox: '' | 'yes' | 'no'
  timeArrival: string
  timeDeparture: string
  updatedAt: string
}

const SUIVI_STORAGE_KEY = 'staypilot_suivi_menage_v1'
const MAX_SUIVI_PHOTOS_PER_SLOT = 4
const MAX_SUIVI_IMAGE_LEN = 350_000

function sanitizeSuiviPhotoList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((u) => typeof u === 'string' && u.startsWith('data:image/jpeg;base64,'))
    .slice(0, MAX_SUIVI_PHOTOS_PER_SLOT)
}

function readSuiviReports(): Record<string, SuiviMenageReport> {
  try {
    const raw = localStorage.getItem(SUIVI_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<SuiviMenageReport>>
    const out: Record<string, SuiviMenageReport> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || typeof v !== 'object') continue
      const keyInBox = v.keyInBox === 'yes' || v.keyInBox === 'no' ? v.keyInBox : ''
      out[k] = {
        note: typeof v.note === 'string' ? v.note : '',
        photosBefore: sanitizeSuiviPhotoList(v.photosBefore),
        photosAfter: sanitizeSuiviPhotoList(v.photosAfter),
        keyInBox,
        timeArrival: typeof v.timeArrival === 'string' ? v.timeArrival : '',
        timeDeparture: typeof v.timeDeparture === 'string' ? v.timeDeparture : '',
        updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : new Date().toISOString(),
      }
    }
    return out
  } catch {
    return {}
  }
}

function saveSuiviReports(map: Record<string, SuiviMenageReport>) {
  localStorage.setItem(SUIVI_STORAGE_KEY, JSON.stringify(map))
}

function todayIsoLocal(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function suiviEventStatus(event: SuiviCheckoutEvent, report?: SuiviMenageReport) {
  const today = todayIsoLocal()
  if (event.checkoutIso < today && report) {
    return {
      label: 'Enregistré',
      tone: 'green' as const,
      helper: `Dernière sauvegarde : ${formatChatMessageTitle(report.updatedAt)}`,
    }
  }
  if (event.checkoutIso < today) {
    return {
      label: 'Non enregistré',
      tone: 'red' as const,
      helper: "Le départ est passé : merci de compléter ce suivi dès que possible.",
    }
  }
  if (event.checkoutIso === today) {
    return {
      label: report ? 'Pré-rempli (jour J)' : 'Rappel à remplir',
      tone: 'gray' as const,
      helper: report
        ? `Saisi avant départ. Vérifiez ce soir. Dernière sauvegarde : ${formatChatMessageTitle(report.updatedAt)}`
        : 'À remplir avant minuit pour éviter un suivi manquant demain.',
    }
  }
  return {
    label: report ? 'Pré-rempli (à venir)' : 'À venir',
    tone: 'gray' as const,
    helper: report
      ? `Saisi en avance. Dernière sauvegarde : ${formatChatMessageTitle(report.updatedAt)}`
      : "Ce départ n'est pas encore passé.",
  }
}

function downloadInvoicePdf(invoice: CleaningInvoice, vatRate: number) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const createdLabel = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(invoice.createdAt))
  const ttc = invoice.amountEur
  const ht = ttc / (1 + vatRate / 100)
  const vat = ttc - ht

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Facture ménage', 16, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Type: ${invoice.direction === 'received' ? 'Facture reçue' : 'Facture envoyée'}`, 16, 30)
  doc.text(`Date de creation: ${createdLabel}`, 16, 36)
  doc.text(`Mois: ${invoice.month}`, 16, 42)
  doc.text(`Prestataire: ${invoice.provider}`, 16, 48)
  doc.text(`Libelle: ${invoice.label}`, 16, 54)
  doc.text(`Montant TTC: ${ttc.toFixed(2)} EUR`, 16, 60)
  doc.text(`TVA (${vatRate}%): ${vat.toFixed(2)} EUR`, 16, 66)
  doc.text(`Montant HT: ${ht.toFixed(2)} EUR`, 16, 72)
  if (invoice.note) {
    const wrapped = doc.splitTextToSize(`Note: ${invoice.note}`, 178)
    doc.text(wrapped, 16, 82)
  }

  const outName = `${invoice.fileName || `facture-menage-${invoice.month}-${invoice.id}`}.pdf`
  doc.save(outName)
}

export function DashboardCleaningPage() {
  const { t, locale } = useLanguage()
  const cc = cleaningCopy[locale] || cleaningCopy.fr
  const [activePanel, setActivePanel] = useState<CleaningPanel>('overview')
  const [invoices, setInvoices] = useState<CleaningInvoice[]>(() => readInvoices())
  const [listTab, setListTab] = useState<InvoiceDirection>('received')
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [label, setLabel] = useState('')
  const [provider, setProvider] = useState('')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [amountEur, setAmountEur] = useState('')
  const [note, setNote] = useState('')
  const [fileName, setFileName] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [chatMessages, setChatMessages] = useState<CleaningChatMessage[]>(() => readChatMessages())
  const [chatProvider, setChatProvider] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [pendingChatImage, setPendingChatImage] = useState<string | null>(null)
  const [chatImageError, setChatImageError] = useState('')
  const chatFileRef = useRef<HTMLInputElement>(null)

  const [taskBoards, setTaskBoards] = useState<CleaningTaskBoard[]>(() => readTaskBoards())
  const [apartments, setApartments] = useState<ConnectedApartment[]>(() => getConnectedApartmentsFromStorage())
  const [taskApartmentId, setTaskApartmentId] = useState('')
  const [taskMonth, setTaskMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [taskFrequency, setTaskFrequency] = useState<TaskFrequency>('monthly')
  const [taskAssignedProvider, setTaskAssignedProvider] = useState('')
  const [taskViewerRole, setTaskViewerRole] = useState<'owner' | 'provider'>('owner')
  const [taskViewerProvider, setTaskViewerProvider] = useState('')
  const [taskNewLabel, setTaskNewLabel] = useState('')

  const [suiviReports, setSuiviReports] = useState<Record<string, SuiviMenageReport>>(() => readSuiviReports())
  const [selectedSuiviEventId, setSelectedSuiviEventId] = useState('')
  const [suiviDraft, setSuiviDraft] = useState({
    note: '',
    photosBefore: [] as string[],
    photosAfter: [] as string[],
    keyInBox: '' as '' | 'yes' | 'no',
    timeArrival: '',
    timeDeparture: '',
  })
  const [suiviPhotoError, setSuiviPhotoError] = useState('')
  const [suiviLogementTab, setSuiviLogementTab] = useState<'all' | number>('all')
  const [suiviHorizonTab, setSuiviHorizonTab] = useState<'past' | 'upcoming'>('upcoming')
  const suiviBeforeRef = useRef<HTMLInputElement>(null)
  const suiviAfterRef = useRef<HTMLInputElement>(null)
  const [cleanerInviteCode, setCleanerInviteCode] = useState('')
  const [providerAssignments, setProviderAssignments] = useState<Record<string, string>>(() => readProviderAssignments())
  const [selectedProviderLink, setSelectedProviderLink] = useState('')
  const [selectedApartmentLink, setSelectedApartmentLink] = useState('')
  const [providerLinkMsg, setProviderLinkMsg] = useState('')

  const currentUser =
    (
      typeof window !== 'undefined'
        ? localStorage.getItem(LS_CURRENT_USER) || localStorage.getItem(LS_LOGIN_IDENTIFIER)
        : ''
    )?.trim() || ''
  const currentRole = ((typeof window !== 'undefined' ? localStorage.getItem(LS_CURRENT_ROLE) : '') || 'host').trim().toLowerCase()
  const isHostSession = currentRole !== 'cleaner'
  const currentAccount = useMemo(() => {
    const identifier = currentUser.trim().toLowerCase()
    if (!identifier) return undefined
    return getStoredAccounts().find(
      (a) => a.email.trim().toLowerCase() === identifier || a.username.trim().toLowerCase() === identifier,
    )
  }, [currentUser])
  const currentVatRate = useMemo(
    () => VAT_RATE_BY_COUNTRY[(currentAccount?.countryCode || 'FR').trim().toUpperCase()] ?? 20,
    [currentAccount?.countryCode],
  )
  const cleanerDisplayName = useMemo(() => {
    if (!currentAccount) return ''
    const full = `${currentAccount.firstName || ''} ${currentAccount.lastName || ''}`.trim()
    return full || currentAccount.username || ''
  }, [currentAccount])
  const cleanerAssignedApartmentNames = useMemo(() => {
    if (isHostSession || !cleanerDisplayName) return []
    return apartments
      .filter((a) => (providerAssignments[a.id] || '').trim().toLowerCase() === cleanerDisplayName.trim().toLowerCase())
      .map((a) => a.name)
  }, [apartments, providerAssignments, isHostSession, cleanerDisplayName])
  const cleanerHostLabel = useMemo(() => {
    const hostUsername = (currentAccount?.hostUsername || '').trim().toLowerCase()
    if (!hostUsername) return 'Votre hôte'
    const host = getStoredAccounts().find((a) => a.username.trim().toLowerCase() === hostUsername)
    if (!host) return `Votre hôte ${currentAccount?.hostUsername}`
    const full = `${host.firstName || ''} ${host.lastName || ''}`.trim()
    return full ? `Votre hôte ${full}` : `Votre hôte ${host.username}`
  }, [currentAccount])
  const cleanerInviteLink = cleanerInviteCode
    ? `${window.location.origin}/inscription?role=cleaner&inviteCode=${encodeURIComponent(cleanerInviteCode)}`
    : ''

  function refreshCleanerInviteState(hostUsername: string) {
    const invites = readCleanerInvites()
    const hostInvite = invites
      .filter((i) => i.hostUsername.trim().toLowerCase() === hostUsername.trim().toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    setCleanerInviteCode(hostInvite?.code || '')
  }

  function ensureCleanerInvite(hostUsername: string) {
    const invites = readCleanerInvites()
    const existing = invites.find(
      (i) => i.hostUsername.trim().toLowerCase() === hostUsername.trim().toLowerCase(),
    )
    if (existing) {
      setCleanerInviteCode(existing.code)
      return
    }
    const created: CleanerInvite = {
      code: createInviteCode(),
      hostUsername,
      createdAt: new Date().toISOString(),
    }
    saveCleanerInvites([...invites, created])
    setCleanerInviteCode(created.code)
  }

  const providerOptions = useMemo(() => {
    const fromInvoices = invoices.map((i) => i.provider.trim()).filter(Boolean)
    const fromAccounts = getStoredAccounts()
      .filter((a) => (a.role || 'host') === 'cleaner')
      .map((a) => `${a.firstName} ${a.lastName}`.trim() || a.username.trim())
      .filter(Boolean)
    const uniq = Array.from(new Set([...fromInvoices, ...fromAccounts]))
    return uniq.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }, [invoices])
  const hasRegisteredProviders = providerOptions.length > 0
  const chatProviderOptions = providerOptions
  const cleanerInvoiceProviderName = cleanerDisplayName.trim() || currentAccount?.username?.trim() || ''
  const effectiveInvoiceProvider = isHostSession ? provider.trim() : cleanerInvoiceProviderName
  const currentUsername = (currentAccount?.username || currentUser || '').trim().toLowerCase()
  const hostCleanerAccounts = useMemo(() => {
    if (!isHostSession || !currentUsername) return []
    return getStoredAccounts().filter(
      (a) => (a.role || 'host') === 'cleaner' && (a.hostUsername || '').trim().toLowerCase() === currentUsername,
    )
  }, [isHostSession, currentUsername])
  const hostCleanerOptions = useMemo(() => {
    return hostCleanerAccounts
      .map((a) => ({
        username: a.username.trim(),
        label: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username.trim(),
      }))
      .filter((r) => r.username && r.label)
  }, [hostCleanerAccounts])
  const hostDisplayName = useMemo(() => {
    const hostUsername = (currentAccount?.hostUsername || '').trim().toLowerCase()
    if (!hostUsername) return ''
    const host = getStoredAccounts().find((a) => a.username.trim().toLowerCase() === hostUsername)
    if (!host) return currentAccount?.hostUsername || ''
    return `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.username
  }, [currentAccount])
  const usernameLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    getStoredAccounts().forEach((a) => {
      const key = (a.username || '').trim().toLowerCase()
      if (!key) return
      const label = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username
      map.set(key, label)
    })
    return map
  }, [])
  function labelForUsername(raw: string) {
    const key = (raw || '').trim().toLowerCase()
    if (!key) return ''
    return usernameLabelMap.get(key) || raw
  }
  const canSendInvoice = useMemo(() => {
    if (isHostSession) {
      if (!effectiveInvoiceProvider) return false
      return hostCleanerOptions.some((o) => o.label === provider.trim())
    }
    return Boolean(effectiveInvoiceProvider && (currentAccount?.hostUsername || '').trim())
  }, [isHostSession, effectiveInvoiceProvider, hostCleanerOptions, provider, currentAccount])

  const filtered = useMemo(() => {
    return invoices
      .filter((i) => {
        const owner = (i.ownerUsername || '').trim().toLowerCase()
        if (!owner || !currentUsername) return true
        return owner === currentUsername
      })
      .filter((i) => i.direction === listTab)
      .filter((i) => i.month === monthFilter)
      .filter((i) =>
        isHostSession
          ? true
          : i.provider.trim().toLowerCase() === cleanerInvoiceProviderName.trim().toLowerCase(),
      )
      .filter((i) => (providerFilter === 'all' ? true : i.provider === providerFilter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, listTab, monthFilter, providerFilter, isHostSession, cleanerInvoiceProviderName, currentUsername])

  const selectedChatProvider = chatProvider || chatProviderOptions[0] || ''

  const filteredChatMessages = useMemo(() => {
    if (!selectedChatProvider) return []
    return chatMessages
      .filter((msg) => msg.provider === selectedChatProvider)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [chatMessages, selectedChatProvider])

  const monthLabel = useMemo(() => {
    const [y, m] = monthFilter.split('-')
    const dt = new Date(Number(y), Math.max(0, Number(m) - 1), 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(dt)
  }, [monthFilter])

  const currentMonthValue = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const monthSelectOptions = useMemo(() => {
    const now = new Date()
    const currentIndex = now.getFullYear() * 12 + now.getMonth()
    const startIndex = currentIndex - 60
    const out: Array<{ value: string; label: string }> = []
    for (let idx = startIndex; idx <= currentIndex; idx++) {
      const year = Math.floor(idx / 12)
      const month = idx % 12
      const dt = new Date(year, month, 1)
      const value = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(dt)
      out.push({ value, label })
    }
    return out.reverse()
  }, [])

  const taskMonthSelectOptions = useMemo(() => {
    const now = new Date()
    const currentIndex = now.getFullYear() * 12 + now.getMonth()
    const startIndex = currentIndex - 60
    const endIndex = currentIndex + 6
    const out: Array<{ value: string; label: string }> = []
    for (let idx = startIndex; idx <= endIndex; idx++) {
      const year = Math.floor(idx / 12)
      const month = idx % 12
      const dt = new Date(year, month, 1)
      const value = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(dt)
      out.push({ value, label })
    }
    return out.reverse()
  }, [])

  useEffect(() => {
    if (!currentUser || !isHostSession) return
    ensureCleanerInvite(currentUser)
    refreshCleanerInviteState(currentUser)
  }, [currentUser, isHostSession])

  useEffect(() => {
    saveProviderAssignments(providerAssignments)
  }, [providerAssignments])

  useEffect(() => {
    setApartments(getConnectedApartmentsFromStorage())
    const sync = () => setApartments(getConnectedApartmentsFromStorage())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const effectiveTaskApartmentId = taskApartmentId || apartments[0]?.id || ''

  const currentTaskBoard = useMemo(() => {
    if (!effectiveTaskApartmentId || !taskMonth) return undefined
    return taskBoards.find(
      (b) =>
        b.apartmentId === effectiveTaskApartmentId && b.month === taskMonth && b.frequency === taskFrequency,
    )
  }, [taskBoards, effectiveTaskApartmentId, taskMonth, taskFrequency])

  const canProviderToggleTasks = useMemo(() => {
    if (!currentTaskBoard || taskViewerRole !== 'provider') return false
    const a = (isHostSession ? taskViewerProvider : cleanerDisplayName).trim().toLowerCase()
    const b = currentTaskBoard.provider.trim().toLowerCase()
    return Boolean(a && b && a === b)
  }, [currentTaskBoard, taskViewerRole, taskViewerProvider, isHostSession, cleanerDisplayName])
  const canOwnerManageTasks = isHostSession && taskViewerRole === 'owner'

  useEffect(() => {
    if (currentTaskBoard) setTaskAssignedProvider(currentTaskBoard.provider)
  }, [currentTaskBoard?.id])
  useEffect(() => {
    if (isHostSession) {
      setTaskViewerRole('owner')
      return
    }
    if (cleanerDisplayName) setTaskViewerProvider(cleanerDisplayName)
    setTaskViewerRole('provider')
  }, [isHostSession, cleanerDisplayName])

  function saveTaskBoardConfig() {
    if (!canOwnerManageTasks) return
    const apt = apartments.find((a) => a.id === effectiveTaskApartmentId)
    if (!apt || !taskMonth.trim() || !taskAssignedProvider.trim()) return
    const idx = taskBoards.findIndex(
      (b) =>
        b.apartmentId === apt.id && b.month === taskMonth && b.frequency === taskFrequency,
    )
    if (idx >= 0) {
      const next = [...taskBoards]
      next[idx] = {
        ...next[idx],
        provider: taskAssignedProvider.trim(),
        apartmentName: apt.name,
        updatedAt: new Date().toISOString(),
      }
      setTaskBoards(next)
      saveTaskBoards(next)
      return
    }
    const nb = newTaskBoard(apt.id, apt.name, taskMonth, taskFrequency, taskAssignedProvider.trim())
    const merged = [...taskBoards, nb]
    setTaskBoards(merged)
    saveTaskBoards(merged)
  }

  function addTaskRow() {
    if (!currentTaskBoard || !canOwnerManageTasks) return
    const label = taskNewLabel.trim()
    if (!label) return
    const nextBoards = taskBoards.map((b) =>
      b.id === currentTaskBoard.id
        ? {
            ...b,
            tasks: [...b.tasks, { id: randomId(), label, done: false }],
            updatedAt: new Date().toISOString(),
          }
        : b,
    )
    setTaskBoards(nextBoards)
    saveTaskBoards(nextBoards)
    setTaskNewLabel('')
  }

  function removeTaskRow(taskId: string) {
    if (!currentTaskBoard || !canOwnerManageTasks) return
    const nextBoards = taskBoards.map((b) =>
      b.id === currentTaskBoard.id
        ? {
            ...b,
            tasks: b.tasks.filter((t) => t.id !== taskId),
            updatedAt: new Date().toISOString(),
          }
        : b,
    )
    setTaskBoards(nextBoards)
    saveTaskBoards(nextBoards)
  }

  function toggleTaskDone(taskId: string) {
    if (!currentTaskBoard || !canProviderToggleTasks) return
    const nextBoards = taskBoards.map((b) => {
      if (b.id !== currentTaskBoard.id) return b
      return {
        ...b,
        tasks: b.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                done: !t.done,
                doneAt: t.done ? undefined : new Date().toISOString(),
              }
            : t,
        ),
        updatedAt: new Date().toISOString(),
      }
    })
    setTaskBoards(nextBoards)
    saveTaskBoards(nextBoards)
  }

  function shiftMonth(delta: number) {
    const [y, m] = monthFilter.split('-')
    const dt = new Date(Number(y), Number(m) - 1 + delta, 1)
    const next = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    if (next > currentMonthValue) return
    setMonthFilter(next)
  }

  const totalAmount = useMemo(
    () => filtered.reduce((sum, i) => sum + (Number.isFinite(i.amountEur) ? i.amountEur : 0), 0),
    [filtered],
  )

  function addInvoice() {
    const parsedAmount = Number(amountEur.replace(',', '.'))
    if (!label.trim() || !canSendInvoice || !month || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return
    const senderUsername = currentUsername
    if (!senderUsername) return
    const hostRecipient = currentAccount?.hostUsername?.trim() || ''
    const selectedCleaner = hostCleanerOptions.find((o) => o.label === provider.trim())
    const recipientUsername = isHostSession ? (selectedCleaner?.username || '').trim() : hostRecipient
    if (!recipientUsername) return
    const recipientDisplayName = isHostSession ? (provider.trim() || effectiveInvoiceProvider) : hostDisplayName || hostRecipient
    const senderDisplayName = isHostSession
      ? `${currentAccount?.firstName || ''} ${currentAccount?.lastName || ''}`.trim() || currentAccount?.username || 'Hôte'
      : cleanerInvoiceProviderName
    const confirmTarget = recipientDisplayName || recipientUsername
    const ok = window.confirm(`Confirmez-vous l'envoi de cette facture à ${confirmTarget} ?`)
    if (!ok) return
    const baseId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const sentInvoice: CleaningInvoice = {
      id: `${baseId}_sent`,
      direction: 'sent',
      label: label.trim(),
      provider: isHostSession ? effectiveInvoiceProvider : cleanerInvoiceProviderName,
      ownerUsername: senderUsername,
      counterpartyUsername: recipientUsername,
      month,
      amountEur: Math.round(parsedAmount * 100) / 100,
      fileName: fileName.trim().replace(/\.[^.]+$/, ''),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }
    const receivedInvoice: CleaningInvoice = {
      ...sentInvoice,
      id: `${baseId}_received`,
      direction: 'received',
      provider: senderDisplayName || effectiveInvoiceProvider,
      ownerUsername: recipientUsername.trim().toLowerCase(),
      counterpartyUsername: senderUsername,
    }
    const merged = [sentInvoice, receivedInvoice, ...invoices]
    setInvoices(merged)
    saveInvoices(merged)
    setLabel('')
    if (isHostSession) setProvider('')
    setMonth('')
    setAmountEur('')
    setFileName('')
    setNote('')
    const vatRate = VAT_RATE_BY_COUNTRY[(currentAccount?.countryCode || 'FR').trim().toUpperCase()] ?? 20
    downloadInvoicePdf(sentInvoice, vatRate)
  }

  function removeInvoice(id: string) {
    const next = invoices.filter((inv) => inv.id !== id)
    setInvoices(next)
    saveInvoices(next)
  }

  async function onPickChatImage(file: File) {
    setChatImageError('')
    try {
      const dataUrl = await compressImageToJpegDataUrl(file)
      if (dataUrl.length > MAX_CHAT_IMAGE_DATA_URL_LEN) {
        setChatImageError('Image trop lourde. Choisissez une photo plus petite.')
        return
      }
      setPendingChatImage(dataUrl)
    } catch {
      setChatImageError('Impossible de charger cette image.')
    }
  }

  function sendChatMessage(sender: 'manager' | 'provider') {
    const text = chatInput.trim()
    const imageDataUrl = pendingChatImage ?? undefined
    if (!selectedChatProvider || (!text && !imageDataUrl)) return
    const nextMessage: CleaningChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      provider: selectedChatProvider,
      sender,
      text,
      imageDataUrl,
      createdAt: new Date().toISOString(),
    }
    const next = [...chatMessages, nextMessage]
    setChatMessages(next)
    saveChatMessages(next)
    setChatInput('')
    setPendingChatImage(null)
    setChatImageError('')
  }

  const canSendChat = Boolean(selectedChatProvider && (chatInput.trim() || pendingChatImage))

  const suiviApartmentCount = useMemo(() => {
    if (apartments.length > 0) return Math.max(apartments.length, DEMO_APARTMENT_ROW_COUNT)
    if (isTestModeEnabled()) return Math.max(2, DEMO_APARTMENT_ROW_COUNT)
    return DEMO_APARTMENT_ROW_COUNT
  }, [apartments.length])

  const suiviCheckoutEvents = useMemo(
    () => getDemoCheckoutEventsForSuivi(suiviApartmentCount),
    [suiviApartmentCount],
  )

  const suiviFilteredCheckoutEvents = useMemo(() => {
    let list =
      suiviLogementTab === 'all'
        ? suiviCheckoutEvents
        : suiviCheckoutEvents.filter((e) => e.aptIndex === suiviLogementTab)
    const today = todayIsoLocal()
    list = list.filter((e) =>
      suiviHorizonTab === 'past' ? e.checkoutIso < today : e.checkoutIso >= today,
    )
    return [...list].sort((a, b) =>
      suiviHorizonTab === 'upcoming'
        ? a.checkoutIso.localeCompare(b.checkoutIso)
        : b.checkoutIso.localeCompare(a.checkoutIso),
    )
  }, [suiviCheckoutEvents, suiviLogementTab, suiviHorizonTab])

  const selectedSuiviEvent = useMemo(
    () => suiviFilteredCheckoutEvents.find((e) => e.id === selectedSuiviEventId),
    [suiviFilteredCheckoutEvents, selectedSuiviEventId],
  )
  const selectedSuiviStatus = useMemo(
    () =>
      selectedSuiviEvent ? suiviEventStatus(selectedSuiviEvent, suiviReports[selectedSuiviEvent.id]) : undefined,
    [selectedSuiviEvent, suiviReports],
  )

  useEffect(() => {
    if (suiviFilteredCheckoutEvents.length === 0) {
      setSelectedSuiviEventId('')
      return
    }
    setSelectedSuiviEventId((prev) =>
      prev && suiviFilteredCheckoutEvents.some((e) => e.id === prev)
        ? prev
        : suiviFilteredCheckoutEvents[0].id,
    )
  }, [suiviFilteredCheckoutEvents])

  useEffect(() => {
    if (!selectedSuiviEventId) return
    const r = suiviReports[selectedSuiviEventId]
    setSuiviDraft(
      r
        ? {
            note: r.note,
            photosBefore: [...r.photosBefore],
            photosAfter: [...r.photosAfter],
            keyInBox: r.keyInBox,
            timeArrival: r.timeArrival,
            timeDeparture: r.timeDeparture,
          }
        : {
            note: '',
            photosBefore: [],
            photosAfter: [],
            keyInBox: '',
            timeArrival: '',
            timeDeparture: '',
          },
    )
    setSuiviPhotoError('')
  }, [selectedSuiviEventId])

  function suiviApartmentLabel(aptIndex: number) {
    const a = apartments[aptIndex]
    if (a) return a.name
    if (isTestModeEnabled() && (aptIndex === 0 || aptIndex === 1)) return `Logement test ${aptIndex + 1}`
    return `Logement ${aptIndex + 1}`
  }

  function formatSuiviCheckoutLabel(iso: string) {
    try {
      const [y, m, d] = iso.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(
        dt,
      )
    } catch {
      return iso
    }
  }

  async function appendSuiviPhotos(slot: 'before' | 'after', files: FileList | null) {
    if (!files?.length) return
    setSuiviPhotoError('')
    const toAdd: string[] = []
    const n = files.length
    for (let i = 0; i < n; i++) {
      try {
        const dataUrl = await compressImageToJpegDataUrl(files[i])
        if (dataUrl.length > MAX_SUIVI_IMAGE_LEN) {
          setSuiviPhotoError('Une photo est trop lourde.')
          return
        }
        toAdd.push(dataUrl)
      } catch {
        setSuiviPhotoError('Impossible de charger une photo.')
        return
      }
    }
    let slotFull = false
    setSuiviDraft((d) => {
      const cur = slot === 'before' ? d.photosBefore : d.photosAfter
      const room = MAX_SUIVI_PHOTOS_PER_SLOT - cur.length
      if (room <= 0) {
        slotFull = true
        return d
      }
      const merged = [...cur, ...toAdd.slice(0, room)]
      return slot === 'before' ? { ...d, photosBefore: merged } : { ...d, photosAfter: merged }
    })
    if (slotFull) setSuiviPhotoError(`Maximum ${MAX_SUIVI_PHOTOS_PER_SLOT} photos par série.`)
  }

  function removeSuiviPhoto(slot: 'before' | 'after', index: number) {
    if (slot === 'before') {
      setSuiviDraft((d) => ({ ...d, photosBefore: d.photosBefore.filter((_, i) => i !== index) }))
    } else {
      setSuiviDraft((d) => ({ ...d, photosAfter: d.photosAfter.filter((_, i) => i !== index) }))
    }
  }

  function saveSuiviDraftToStorage() {
    if (!selectedSuiviEventId) return
    const next: SuiviMenageReport = {
      note: suiviDraft.note.trim(),
      photosBefore: suiviDraft.photosBefore,
      photosAfter: suiviDraft.photosAfter,
      keyInBox: suiviDraft.keyInBox,
      timeArrival: suiviDraft.timeArrival,
      timeDeparture: suiviDraft.timeDeparture,
      updatedAt: new Date().toISOString(),
    }
    const merged = { ...suiviReports, [selectedSuiviEventId]: next }
    setSuiviReports(merged)
    saveSuiviReports(merged)
  }

  const suiviDemoMonthLabel = useMemo(() => {
    const raw = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
      new Date(DEMO_YEAR, DEMO_MONTH_INDEX, 1),
    )
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [])

  function linkProviderToApartment() {
    if (!selectedProviderLink.trim()) {
      setProviderLinkMsg("Sélectionnez d'abord un prestataire ménage.")
      return
    }
    if (!selectedApartmentLink.trim()) {
      setProviderLinkMsg('Selectionnez ensuite un logement.')
      return
    }
    setProviderAssignments((prev) => ({ ...prev, [selectedApartmentLink]: selectedProviderLink.trim() }))
    const apt = apartments.find((a) => a.id === selectedApartmentLink)
    setProviderLinkMsg(
      `Attribution enregistrée : ${selectedProviderLink.trim()} sur ${apt?.name || 'ce logement'}.`,
    )
  }

  function unlinkProviderFromApartment() {
    if (!selectedApartmentLink.trim()) {
      setProviderLinkMsg("Sélectionnez d'abord le logement à désattribuer.")
      return
    }
    setProviderAssignments((prev) => {
      const next = { ...prev }
      delete next[selectedApartmentLink]
      return next
    })
    const apt = apartments.find((a) => a.id === selectedApartmentLink)
    setProviderLinkMsg(`Attribution supprimee pour ${apt?.name || 'ce logement'}.`)
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-6xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Prestataire ménage</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {activePanel === 'overview'
                ? 'Espace prestataire ménage'
                : activePanel === 'providers'
                  ? 'Prestataire ménage'
                : activePanel === 'invoices'
                  ? cc.invoicesTitle
                  : activePanel === 'chat'
                    ? 'Tchat prestataire ménage'
                    : activePanel === 'tasks'
                      ? 'Tâches ménage (hebdomadaire / mensuel)'
                      : 'Suivi ménage'}
            </h1>
            <p className="mt-2 text-sm text-zinc-700">
              {activePanel === 'overview'
                ? 'Retrouvez ici les outils liés au ménage : commencez par la vue d’ensemble, puis ouvrez l’onglet factures quand vous en avez besoin.'
                : activePanel === 'providers'
                  ? 'Étape 1 : sélectionnez le prestataire ménage. Étape 2 : sélectionnez le logement à lui attribuer.'
                : activePanel === 'invoices'
                  ? cc.invoicesSubtitle
                  : activePanel === 'chat'
                    ? 'Discutez avec votre prestataire et sélectionnez le nom du prestataire ménage si vous en avez plusieurs.'
                    : activePanel === 'tasks'
                      ? 'Listes par logement et par mois : la prestataire assignée peut cocher ce qui est fait (accès simulé par profil).'
                      : `Une fiche s’ouvre à chaque départ voyageur détecté sur le calendrier (démo ${suiviDemoMonthLabel}). La prestataire ménage renseigne constats, photos et horaires.`}
            </p>
          </div>

          {activePanel === 'overview' ? (
            <div className="px-5 py-6 sm:px-6">
              {isHostSession ? (
                <button
                  type="button"
                  onClick={() => setActivePanel('providers')}
                  className="group w-full rounded-2xl border border-zinc-200/80 bg-white p-4 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                      <ClipboardList className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-zinc-900">Prestataire ménage</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        D'abord choisir le prestataire, puis choisir le logement à lui attribuer.
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full rounded-2xl border border-zinc-200/80 bg-white p-4 text-left shadow-pm-sm">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                      <ClipboardList className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-zinc-900">
                        {cleanerHostLabel} vous a attribué à :{' '}
                        {cleanerAssignedApartmentNames.length > 0
                          ? cleanerAssignedApartmentNames.join(', ')
                          : 'Aucun logement pour le moment'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActivePanel('invoices')}
                  className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                >
                  <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                    <Receipt className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-base font-semibold text-zinc-900">Gérer les factures</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Ajouter, filtrer par mois/prestataire et exporter en PDF.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel('chat')}
                  className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                >
                  <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                    <Send className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-base font-semibold text-zinc-900">Tchat prestataire</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Sélectionnez le nom du prestataire ménage et échangez des messages dans un espace dédié.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel('tasks')}
                  className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                >
                  <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                    <ClipboardList className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-base font-semibold text-zinc-900">Tâches hebdo / mensuel</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Checklist par logement et par mois (vitres, plinthes…). Coches réservées à la prestataire assignée.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel('suivi')}
                  className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                >
                  <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                    <ListChecks className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-base font-semibold text-zinc-900">Suivi ménage</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Après chaque check-out : compte rendu, photos avant/après, clé en boîte, horaires sur le logement.
                  </p>
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3">
                {isHostSession ? (
                  <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-900">
                          <Link2 className="h-4 w-4" aria-hidden />
                          Lien d&apos;inscription prestataire ménage
                        </p>
                        <p className="mt-1 break-all text-xs text-sky-800">
                          {cleanerInviteLink ||
                            "Impossible de générer le lien : connectez-vous avec un compte hôte enregistré."}
                        </p>
                        <p className="mt-1 text-[11px] text-sky-700">
                          Code hote unique: <strong>{cleanerInviteCode || '...'}</strong> (le meme code peut servir
                          a inviter plusieurs prestataires menage)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!cleanerInviteLink) return
                            void navigator.clipboard.writeText(cleanerInviteLink)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                          Copier
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <p className="text-sm font-semibold text-zinc-800">{cc.importantInfo}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                  {cc.importantInfoBody}
                </p>
              </div>
            </div>
          ) : null}

          <div
            className={
              activePanel !== 'providers' ? 'hidden px-5 py-5 sm:px-6 sm:py-6' : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              ← Retour aux outils prestataire ménage
            </button>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">Étape 1 : sélectionner le prestataire ménage</p>
              <select
                value={selectedProviderLink}
                onChange={(e) => setSelectedProviderLink(e.target.value)}
                className="mt-2 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">{hasRegisteredProviders ? 'Choisir un prestataire' : 'Aucun prestataire enregistré'}</option>
                {providerOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

                <p className="mt-4 text-sm font-semibold text-zinc-900">Étape 2 : sélectionner le logement</p>
              <select
                value={selectedApartmentLink}
                onChange={(e) => setSelectedApartmentLink(e.target.value)}
                disabled={!apartments.length}
                className="mt-2 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                {apartments.length === 0 ? (
                  <option value="">Aucun logement connecté</option>
                ) : (
                  <>
                    <option value="">Choisir un logement</option>
                    {apartments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <button
                type="button"
                onClick={linkProviderToApartment}
                className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Enregistrer l attribution
              </button>
              <button
                type="button"
                onClick={unlinkProviderFromApartment}
                disabled={!selectedApartmentLink || !providerAssignments[selectedApartmentLink]}
                className="mt-4 ml-2 inline-flex rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supprimer l attribution
              </button>

              {providerLinkMsg ? (
                <p className="mt-2 text-xs font-semibold text-zinc-700">{providerLinkMsg}</p>
              ) : null}

              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold text-zinc-900">Attributions actuelles</p>
                {apartments.length === 0 ? (
                  <p className="mt-1 text-xs text-zinc-600">Aucun logement connecté pour le moment.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-zinc-700">
                    {apartments.map((a) => (
                      <li key={`assign-${a.id}`}>
                        {a.name}: <strong>{providerAssignments[a.id] || 'Aucune prestataire assignée'}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div
            className={`grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.1fr_1fr] ${
              activePanel !== 'invoices' ? 'hidden' : ''
            }`}
          >
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => setActivePanel('overview')}
                className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                {cc.backToCleaningTools}
              </button>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">{cc.invoicesAddTitle}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {cc.invoicesDirectionHint}
              </p>

              <div className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-white p-1">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  {cc.invoicesSent}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-700">
                  {cc.label}
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ex: Ménage appartement A"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-zinc-700">
                  {cc.provider}
                  {isHostSession ? (
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">{hostCleanerOptions.length > 0 ? cc.selectProvider : cc.noProvider}</option>
                      {hostCleanerOptions.map((row) => (
                        <option key={row.username} value={row.label}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={cleanerInvoiceProviderName || 'Prestataire ménage'}
                      readOnly
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-700"
                    />
                  )}
                </label>
                <label className="text-sm text-zinc-700">
                  {cc.month}
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    {monthSelectOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-zinc-700">
                  {cc.amountEur}
                  <input
                    value={amountEur}
                    onChange={(e) => setAmountEur(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-zinc-700">
                  {cc.invoiceFileOptional}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm text-zinc-700">
                {cc.noteOptional}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Précisions utiles (période, nombre de passages, remarques...)"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <button
                type="button"
                onClick={addInvoice}
                disabled={!canSendInvoice}
                className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              >
                {isHostSession
                  ? `${cc.sendTo} ${provider.trim() || (hostCleanerOptions.length > 0 ? cc.selectProvider : cc.noProvider)}`
                  : `Envoyer à : ${hostDisplayName || 'mon hôte'}`}
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">
                  {listTab === 'received' ? cc.invoicesReceived : cc.invoicesSent}
                </p>
                <p className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600">
                  <Wallet className="h-3.5 w-3.5" aria-hidden />
                  {cc.total}: {totalAmount.toFixed(2)} EUR
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setListTab('received')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      listTab === 'received' ? 'bg-sky-100 text-sky-700' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {cc.invoicesReceived}
                  </button>
                  <button
                    type="button"
                    onClick={() => setListTab('sent')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      listTab === 'sent' ? 'bg-sky-100 text-sky-700' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {cc.invoicesSent}
                  </button>
                </div>
                <label className="text-xs font-semibold text-zinc-600">{cc.shownMonth}</label>
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  {cc.previous}
                </button>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {monthSelectOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  disabled={monthFilter >= currentMonthValue}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  {cc.next}
                </button>
                <span className="text-xs font-semibold text-zinc-500">({monthLabel})</span>

                <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />

                {isHostSession ? (
                  <>
                    <label className="text-xs font-semibold text-zinc-600">{cc.provider}</label>
                    <select
                      value={providerFilter}
                      onChange={(e) => setProviderFilter(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="all">{cc.allProviders}</option>
                      {hostCleanerOptions.map((row) => (
                        <option key={row.username} value={row.label}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {filtered.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                    {cc.noInvoiceYet}
                  </p>
                ) : (
                  filtered.map((inv) => (
                    <article key={inv.id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{inv.label}</p>
                          <p className="text-xs text-zinc-600">
                            {inv.provider} • {inv.month} • TTC {inv.amountEur.toFixed(2)} EUR • TVA ({currentVatRate}%){' '}
                            {(inv.amountEur - inv.amountEur / (1 + currentVatRate / 100)).toFixed(2)} EUR
                          </p>
                          {inv.direction === 'sent' && inv.counterpartyUsername ? (
                            <p className="mt-1 text-[11px] font-semibold text-sky-700">
                              À : {labelForUsername(inv.counterpartyUsername)}
                            </p>
                          ) : null}
                          {inv.direction === 'received' && inv.counterpartyUsername ? (
                            <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                              De : {labelForUsername(inv.counterpartyUsername)}
                            </p>
                          ) : null}
                          {inv.fileName ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-600">
                              <FileText className="h-3.5 w-3.5" aria-hidden />
                              {inv.fileName}
                            </p>
                          ) : null}
                          {inv.note ? <p className="mt-1 text-xs text-zinc-600">{inv.note}</p> : null}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => removeInvoice(inv.id)}
                          className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          {cc.delete}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={activePanel !== 'chat' ? 'hidden px-5 py-5 sm:px-6 sm:py-6' : 'px-5 py-5 sm:px-6 sm:py-6'}>
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              ← Retour aux outils prestataire ménage
            </button>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                {isHostSession ? (
                  <>
                    <p className="text-sm font-semibold text-zinc-900">Choisir le prestataire ménage</p>
                    <select
                      value={selectedChatProvider}
                      onChange={(e) => setChatProvider(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      {chatProviderOptions.length === 0 ? (
                        <option value="">Aucun prestataire enregistré</option>
                      ) : (
                        chatProviderOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))
                      )}
                    </select>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-zinc-900">
                    Conversation avec votre hôte : {cleanerHostLabel.replace('Votre hôte ', '')}
                  </p>
                )}
              </div>

              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
                {selectedChatProvider ? (
                  filteredChatMessages.length > 0 ? (
                  filteredChatMessages.map((msg, idx) => {
                    const prev = idx > 0 ? filteredChatMessages[idx - 1] : null
                    const showDaySeparator = !prev || chatDayKey(prev.createdAt) !== chatDayKey(msg.createdAt)
                    const senderName = msg.sender === 'manager' ? 'Vous' : selectedChatProvider
                    return (
                      <div key={msg.id}>
                        {showDaySeparator ? (
                          <div className="my-2 flex items-center gap-2">
                            <span className="h-px flex-1 bg-zinc-200" />
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                              {formatChatDayLabel(msg.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-zinc-200" />
                          </div>
                        ) : null}
                        <article
                          title={formatChatMessageTitle(msg.createdAt)}
                          className={`max-w-[90%] rounded-2xl border px-3 py-2 text-sm shadow-sm ${
                            msg.sender === 'manager'
                              ? 'ml-auto border-sky-200 bg-sky-100 text-sky-900'
                              : 'mr-auto border-zinc-200 bg-white text-zinc-800'
                          }`}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{senderName}</p>
                          {msg.imageDataUrl ? (
                            <img
                              src={msg.imageDataUrl}
                              alt=""
                              className="mt-2 max-h-56 w-full max-w-xs rounded-md border border-black/10 object-contain"
                            />
                          ) : null}
                          {msg.text ? <p className={msg.imageDataUrl ? 'mt-1.5' : 'mt-1'}>{msg.text}</p> : null}
                          <time
                            dateTime={msg.createdAt}
                            className="mt-1.5 block text-right text-[11px] font-medium tabular-nums opacity-70"
                          >
                            {formatChatMessageTime(msg.createdAt)}
                          </time>
                        </article>
                      </div>
                    )
                  })
                  ) : (
                    <p className="text-sm text-zinc-600">Aucun message pour l’instant avec ce prestataire.</p>
                  )
                ) : isHostSession ? null : (
                  <p className="text-sm text-zinc-600">Aucun message pour l’instant avec votre hôte.</p>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <input
                  ref={chatFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) void onPickChatImage(f)
                  }}
                />
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items
                    if (!items?.length) return
                    for (let i = 0; i < items.length; i++) {
                      const it = items[i]
                      if (it?.kind === 'file' && it.type.startsWith('image/')) {
                        e.preventDefault()
                        const f = it.getAsFile()
                        if (f) void onPickChatImage(f)
                        return
                      }
                    }
                  }}
                  placeholder="Écrire un message… (photo optionnelle)"
                  rows={3}
                  disabled={!selectedChatProvider}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                />
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    disabled={!selectedChatProvider}
                    onClick={() => chatFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <ImagePlus className="h-4 w-4 text-sky-600" aria-hidden />
                    Photo
                  </button>
                  {pendingChatImage ? (
                    <div className="relative inline-block">
                      <img
                        src={pendingChatImage}
                        alt=""
                        className="h-16 w-16 rounded-md border border-zinc-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPendingChatImage(null)}
                        className="absolute -right-1.5 -top-1.5 rounded-full border border-zinc-200 bg-white p-0.5 text-zinc-600 shadow-sm hover:bg-zinc-50"
                        aria-label="Retirer la photo"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </div>
                {chatImageError ? <p className="text-xs font-medium text-rose-600">{chatImageError}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => sendChatMessage('manager')}
                    disabled={!canSendChat}
                    className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                  >
                    Envoyer (vous)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className={
              activePanel !== 'tasks' ? 'hidden px-5 py-5 sm:px-6 sm:py-6' : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              ← Retour aux outils prestataire ménage
            </button>

            <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
                {isHostSession
                  ? 'Vue hôte : configuration des tâches'
                  : 'Vue prestataire : cochez les tâches réalisées'}
              </div>

              {taskViewerRole === 'provider' && isHostSession ? (
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-zinc-900">Qui consulte la checklist ?</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Seules les cases sont activées si votre nom correspond exactement à la prestataire assignée sur ce
                    logement (même orthographe).
                  </p>
                  {hasRegisteredProviders ? (
                    <select
                      value={taskViewerProvider}
                      onChange={(e) => setTaskViewerProvider(e.target.value)}
                      className="mt-2 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">Choisir ma fiche prestataire</option>
                      {providerOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={taskViewerProvider}
                      onChange={(e) => setTaskViewerProvider(e.target.value)}
                      placeholder="Votre nom (identique à l’assignation sur le logement)"
                      className="mt-2 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  )}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-zinc-700">
                  Logement
                  <select
                    value={effectiveTaskApartmentId}
                    onChange={(e) => setTaskApartmentId(e.target.value)}
                    disabled={!apartments.length}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  >
                    {apartments.length === 0 ? (
                      <option value="">Aucun logement connecté</option>
                    ) : (
                      apartments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                          {a.address ? ` — ${a.address}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="text-sm text-zinc-700">
                  Mois
                  <select
                    value={taskMonth}
                    onChange={(e) => setTaskMonth(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    {taskMonthSelectOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-zinc-700">
                  Fréquence
                  <select
                    value={taskFrequency}
                    onChange={(e) => setTaskFrequency(e.target.value as TaskFrequency)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </label>
                {canOwnerManageTasks ? (
                  <label className="text-sm text-zinc-700 sm:col-span-2 lg:col-span-1">
                    Prestataire assignée à ce logement
                    {hasRegisteredProviders ? (
                      <select
                        value={taskAssignedProvider}
                        onChange={(e) => setTaskAssignedProvider(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="">Choisir…</option>
                        {providerOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={taskAssignedProvider}
                        onChange={(e) => setTaskAssignedProvider(e.target.value)}
                        placeholder="Nom du prestataire ménage pour ce logement"
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    )}
                  </label>
                ) : null}
              </div>

              {apartments.length === 0 ? (
                <p className="text-sm text-amber-800">
                  {isHostSession ? (
                    <>
                      Connectez d’abord un logement dans{' '}
                      <a href="/dashboard/connecter-logements" className="font-semibold underline">
                        Connecter vos logements
                      </a>
                      .
                    </>
                  ) : (
                    'Votre hôte ne vous a pas encore attribué de logement.'
                  )}
                </p>
              ) : null}

              {canOwnerManageTasks ? (
                <button
                  type="button"
                  onClick={saveTaskBoardConfig}
                  disabled={!apartments.length || !taskAssignedProvider.trim()}
                  className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                >
                  {currentTaskBoard ? 'Enregistrer la prestataire assignée' : 'Créer la checklist (exemples inclus)'}
                </button>
              ) : null}

              {currentTaskBoard && taskViewerRole === 'provider' && !canProviderToggleTasks ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Cette checklist est réservée à <strong>{currentTaskBoard.provider}</strong>. Sélectionnez ce nom
                  ci-dessus pour pouvoir cocher.
                </p>
              ) : null}

              {currentTaskBoard && canOwnerManageTasks ? (
                <p className="text-xs text-zinc-600">
                  Les coches sont réservées à la prestataire (mode Prestataire). Vous pouvez modifier la liste
                  ci-dessous.
                </p>
              ) : null}

              {currentTaskBoard ? (
                <ul className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
                  {currentTaskBoard.tasks.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-md border border-zinc-100 px-2 py-2 sm:px-3"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={!canProviderToggleTasks}
                        onChange={() => toggleTaskDone(item.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                          {item.label}
                        </p>
                        {item.done && item.doneAt ? (
                          <p className="text-[11px] text-zinc-500">
                            Fait le {formatChatMessageTitle(item.doneAt)}
                          </p>
                        ) : null}
                      </div>
                      {canOwnerManageTasks ? (
                        <button
                          type="button"
                          onClick={() => removeTaskRow(item.id)}
                          className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Retirer
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-600">
                  {isHostSession
                    ? 'Aucune checklist pour ce logement, ce mois et cette fréquence. Configurez les options hôte pour créer la checklist.'
                    : "Votre hôte n'a pas encore mis ces options en place pour ce logement."}
                </p>
              )}

              {canOwnerManageTasks && currentTaskBoard ? (
                <div className="flex flex-wrap items-end gap-2 border-t border-zinc-200 pt-3">
                  <label className="min-w-[200px] flex-1 text-sm text-zinc-700">
                    Ajouter une tâche
                    <input
                      value={taskNewLabel}
                      onChange={(e) => setTaskNewLabel(e.target.value)}
                      placeholder="Ex: Nettoyer les spots encastrés"
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addTaskRow}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    Ajouter
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={
              activePanel !== 'suivi' ? 'hidden px-5 py-5 sm:px-6 sm:py-6' : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              ← Retour aux outils prestataire ménage
            </button>

            <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <p className="text-xs text-zinc-600">
                Les départs sont détectés à partir du même calendrier que le tableau de bord (données démo{' '}
                {suiviDemoMonthLabel}). Branchement iCal à venir pour vos vraies réservations.
              </p>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">Logement</p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Choisissez le logement concerné ou « Tous » pour voir tous les départs.
                  </p>
                  <select
                    value={suiviLogementTab === 'all' ? 'all' : String(suiviLogementTab)}
                    onChange={(e) =>
                      setSuiviLogementTab(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="mt-2 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="all">Tous les logements</option>
                    {Array.from({ length: suiviApartmentCount }, (_, i) => (
                      <option key={i} value={String(i)}>
                        {suiviApartmentLabel(i)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="shrink-0 lg:max-w-xs">
                  <p className="text-sm font-semibold text-zinc-900 lg:text-right">Check-outs</p>
                  <p className="mt-0.5 text-xs text-zinc-600 lg:text-right">
                    Filtrer par date de départ (par rapport à aujourd’hui).
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => setSuiviHorizonTab('past')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        suiviHorizonTab === 'past'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      Check-outs passés
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuiviHorizonTab('upcoming')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        suiviHorizonTab === 'upcoming'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      Check-outs à venir
                    </button>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-semibold text-zinc-900">
                Check-out à traiter
                {!isHostSession ? (
                  <p className="mt-0.5 text-xs font-medium text-zinc-600">
                    Vue prestataire : les détails de réservation sont masqués.
                  </p>
                ) : null}
                <select
                  value={selectedSuiviEventId}
                  onChange={(e) => setSelectedSuiviEventId(e.target.value)}
                  disabled={suiviFilteredCheckoutEvents.length === 0}
                  className="mt-1 w-full max-w-2xl rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                >
                  {suiviFilteredCheckoutEvents.length === 0 ? (
                    <option value="">
                      {suiviHorizonTab === 'past'
                        ? suiviLogementTab === 'all'
                          ? 'Aucun check-out passé'
                          : 'Aucun check-out passé pour ce logement'
                        : suiviLogementTab === 'all'
                          ? 'Aucun check-out à venir'
                          : 'Aucun check-out à venir pour ce logement'}
                    </option>
                  ) : (
                    suiviFilteredCheckoutEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {suiviEventStatus(ev, suiviReports[ev.id]).tone === 'green'
                          ? '🟢 '
                          : suiviEventStatus(ev, suiviReports[ev.id]).tone === 'red'
                            ? '🔴 '
                            : '⚪️ '}
                        {formatSuiviCheckoutLabel(ev.checkoutIso)}
                        {suiviLogementTab === 'all' ? ` — ${suiviApartmentLabel(ev.aptIndex)}` : ''}
                        {isHostSession
                          ? ` — ${ev.guest} (${ev.channel === 'airbnb' ? 'Airbnb' : 'Booking'}) — ${ev.reservationId}`
                          : ''}
                        {' — '}
                        [{suiviEventStatus(ev, suiviReports[ev.id]).label}]
                      </option>
                    ))
                  )}
                </select>
              </label>

              {selectedSuiviStatus ? (
                <div className="flex justify-end">
                  <div
                    className={`rounded-lg border px-3 py-2 text-right text-sm font-semibold ${
                      selectedSuiviStatus.tone === 'green'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : selectedSuiviStatus.tone === 'red'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    Statut : {selectedSuiviStatus.label}
                    <p className="mt-0.5 text-xs font-medium opacity-90">{selectedSuiviStatus.helper}</p>
                  </div>
                </div>
              ) : null}

              {selectedSuiviEventId ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-zinc-900">Remarques / incidents</label>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Laissez vide ou indiquez « Rien à signaler ». Ex. : vaisselle cassée, tache sur le canapé…
                    </p>
                    <textarea
                      value={suiviDraft.note}
                      onChange={(e) => setSuiviDraft((d) => ({ ...d, note: e.target.value }))}
                      placeholder="Rien à signaler"
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-sm font-semibold text-zinc-900">Photos avant ménage</p>
                      <input
                        ref={suiviBeforeRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          void appendSuiviPhotos('before', e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => suiviBeforeRef.current?.click()}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        <ImagePlus className="h-4 w-4 text-sky-600" aria-hidden />
                        Ajouter des photos
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suiviDraft.photosBefore.map((src, i) => (
                          <div key={`b-${i}`} className="relative">
                            <img src={src} alt="" className="h-20 w-20 rounded-md border border-zinc-200 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSuiviPhoto('before', i)}
                              className="absolute -right-1 -top-1 rounded-full border border-zinc-200 bg-white p-0.5 text-zinc-600 shadow-sm"
                              aria-label="Retirer la photo"
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-sm font-semibold text-zinc-900">Photos après ménage</p>
                      <input
                        ref={suiviAfterRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          void appendSuiviPhotos('after', e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => suiviAfterRef.current?.click()}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        <ImagePlus className="h-4 w-4 text-sky-600" aria-hidden />
                        Ajouter des photos
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suiviDraft.photosAfter.map((src, i) => (
                          <div key={`a-${i}`} className="relative">
                            <img src={src} alt="" className="h-20 w-20 rounded-md border border-zinc-200 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSuiviPhoto('after', i)}
                              className="absolute -right-1 -top-1 rounded-full border border-zinc-200 bg-white p-0.5 text-zinc-600 shadow-sm"
                              aria-label="Retirer la photo"
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {suiviPhotoError ? <p className="text-sm font-medium text-rose-600">{suiviPhotoError}</p> : null}

                  <fieldset className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
                    <legend className="px-1 text-sm font-semibold text-zinc-900">
                      Clé bien rangée dans la boîte à clés ?
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-4">
                      <label className="inline-flex items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="radio"
                          name="suivi-key-box"
                          checked={suiviDraft.keyInBox === 'yes'}
                          onChange={() => setSuiviDraft((d) => ({ ...d, keyInBox: 'yes' }))}
                          className="h-4 w-4 border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                        Oui
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="radio"
                          name="suivi-key-box"
                          checked={suiviDraft.keyInBox === 'no'}
                          onChange={() => setSuiviDraft((d) => ({ ...d, keyInBox: 'no' }))}
                          className="h-4 w-4 border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                        Non
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="radio"
                          name="suivi-key-box"
                          checked={suiviDraft.keyInBox === ''}
                          onChange={() => setSuiviDraft((d) => ({ ...d, keyInBox: '' }))}
                          className="h-4 w-4 border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                        Non renseigné
                      </label>
                    </div>
                  </fieldset>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-zinc-700">
                      Heure d’arrivée sur le logement
                      <input
                        type="time"
                        value={suiviDraft.timeArrival}
                        onChange={(e) => setSuiviDraft((d) => ({ ...d, timeArrival: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                    <label className="text-sm text-zinc-700">
                      Heure de départ du logement
                      <input
                        type="time"
                        value={suiviDraft.timeDeparture}
                        onChange={(e) => setSuiviDraft((d) => ({ ...d, timeDeparture: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={saveSuiviDraftToStorage}
                    className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Enregistrer le suivi
                  </button>
                  {suiviReports[selectedSuiviEventId]?.updatedAt ? (
                    <p className="text-xs text-zinc-500">
                      Dernière sauvegarde :{' '}
                      {formatChatMessageTitle(suiviReports[selectedSuiviEventId].updatedAt)}
                    </p>
                  ) : null}
                </>
              ) : null}

              <div className="border-t border-zinc-200 pt-3">
                <a
                  href="/dashboard/consommables"
                  className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  Aller à la liste des consommables
                </a>
              </div>
            </div>
          </div>

          {activePanel === 'invoices' ? (
            <div className="border-t border-zinc-200 px-5 py-4 sm:px-6">
              <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-800">Information importante</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                  Cet espace sert à créer, centraliser et suivre vos factures de ménage (statut, mois, prestataire,
                  PDF). Le règlement financier n’est pas géré dans StayPilot : le paiement doit être effectué hors
                  plateforme (virement, espèces ou autre moyen convenu entre vous).
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
