import { ClipboardList, Copy, FileText, ImagePlus, Link2, ListChecks, Receipt, Send, Wallet, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import type { Locale } from '../i18n/navbar'
import {
  getStoredAccounts,
  normalizeStoredLoginPiece,
  safeAccountText,
  storedAccountMatchesNormalizedId,
} from '../lib/accounts'
import { isServerAccountsMandatory } from '../lib/serverAccountsPolicy'
import { readScopedStorage, writeScopedStorage } from '../utils/sessionStorageScope'
import {
  notifyCleaningProviderAssignmentsUpdated,
  PROVIDER_ASSIGNMENTS_STORAGE_KEY,
  readProviderAssignmentsMap,
} from '../utils/cleaningProviderAssignments'
import { getConnectedApartmentsFromStorage, type ConnectedApartment } from '../utils/connectedApartments'
import { getOfficialCheckoutEventsForSuivi, type SuiviCheckoutEvent } from '../utils/suiviMenageCheckouts'

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
  hostUsername: string
  cleanerUsername: string
  senderUsername: string
  recipientUsername: string
  sender: 'manager' | 'provider'
  text: string
  imageDataUrl?: string
  createdAt: string
}

const VAT_RATE_BY_COUNTRY: Record<string, number> = {
  FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21, PT: 23, IE: 23, LU: 17, AT: 20,
  SE: 25, DK: 25, FI: 24, PL: 23, CZ: 21, RO: 19, BG: 20, GR: 24, EL: 24, HR: 25, HU: 27,
  SK: 20, SI: 22, LT: 21, LV: 21, EE: 22,
}

type CleaningTaskItem = {
  id: string
  label: string
  cadence: TaskFrequency
  done: boolean
  doneAt?: string
  weeklyChecks?: [boolean, boolean, boolean, boolean]
  weeklyDoneAt?: [string?, string?, string?, string?]
}

type CleaningTaskBoard = {
  id: string
  apartmentId: string
  apartmentName: string
  month: string
  ownerUsername?: string
  frequency: TaskFrequency
  provider: string
  tasks: CleaningTaskItem[]
  updatedAt: string
}

const STORAGE_KEY = 'staypilot_cleaning_invoices_v1'
const CHAT_STORAGE_KEY = 'staypilot_cleaning_chat_v1'
const TASK_BOARDS_KEY = 'staypilot_cleaning_task_boards_v1'
const CLEANER_INVITES_KEY = 'staypilot_cleaner_invites_v1'
const PROVIDER_ASSIGNMENTS_KEY = PROVIDER_ASSIGNMENTS_STORAGE_KEY
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_CURRENT_ROLE = 'staypilot_current_role'
const LS_LOGIN_IDENTIFIER = 'staypilot_login_identifier'
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'
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

const cleaningUiCopy: Record<
  Locale,
  {
    cleanerProviderTitle: string
    cleanerWorkspaceTitle: string
    cleanerChatTitle: string
    cleanerTasksTitle: string
    cleanerTrackingTitle: string
    backToCleaningTools: string
    photoPlaceholder: string
    noProviderYet: string
    removePhotoAria: string
    addPhotos: string
    yes: string
    no: string
    notProvided: string
  }
> = {
  fr: {
    cleanerProviderTitle: 'Prestataire menage',
    cleanerWorkspaceTitle: 'Espace prestataire menage',
    cleanerChatTitle: 'Tchat prestataire menage',
    cleanerTasksTitle: 'Taches menage (hebdomadaire / mensuel)',
    cleanerTrackingTitle: 'Suivi menage',
    backToCleaningTools: '← Retour aux outils prestataire menage',
    photoPlaceholder: 'Ecrire un message... (photo optionnelle)',
    noProviderYet: 'Aucun prestataire enregistre',
    removePhotoAria: 'Retirer la photo',
    addPhotos: 'Ajouter des photos',
    yes: 'Oui',
    no: 'Non',
    notProvided: 'Non renseigne',
  },
  en: {
    cleanerProviderTitle: 'Cleaning provider',
    cleanerWorkspaceTitle: 'Cleaning provider space',
    cleanerChatTitle: 'Provider chat',
    cleanerTasksTitle: 'Cleaning tasks (weekly / monthly)',
    cleanerTrackingTitle: 'Cleaning tracking',
    backToCleaningTools: '← Back to cleaning tools',
    photoPlaceholder: 'Write a message... (optional photo)',
    noProviderYet: 'No provider registered',
    removePhotoAria: 'Remove photo',
    addPhotos: 'Add photos',
    yes: 'Yes',
    no: 'No',
    notProvided: 'Not provided',
  },
  es: {
    cleanerProviderTitle: 'Proveedor de limpieza',
    cleanerWorkspaceTitle: 'Espacio del proveedor de limpieza',
    cleanerChatTitle: 'Chat del proveedor',
    cleanerTasksTitle: 'Tareas de limpieza (semanal / mensual)',
    cleanerTrackingTitle: 'Seguimiento de limpieza',
    backToCleaningTools: '← Volver a herramientas de limpieza',
    photoPlaceholder: 'Escribir un mensaje... (foto opcional)',
    noProviderYet: 'Ningun proveedor registrado',
    removePhotoAria: 'Quitar foto',
    addPhotos: 'Agregar fotos',
    yes: 'Si',
    no: 'No',
    notProvided: 'Sin indicar',
  },
  de: {
    cleanerProviderTitle: 'Reinigungsdienst',
    cleanerWorkspaceTitle: 'Bereich Reinigungsdienst',
    cleanerChatTitle: 'Dienstleister-Chat',
    cleanerTasksTitle: 'Reinigungsaufgaben (wochentlich / monatlich)',
    cleanerTrackingTitle: 'Reinigungsnachverfolgung',
    backToCleaningTools: '← Zuruck zu Reinigungs-Tools',
    photoPlaceholder: 'Nachricht schreiben... (optionales Foto)',
    noProviderYet: 'Kein Dienstleister registriert',
    removePhotoAria: 'Foto entfernen',
    addPhotos: 'Fotos hinzufugen',
    yes: 'Ja',
    no: 'Nein',
    notProvided: 'Nicht angegeben',
  },
  it: {
    cleanerProviderTitle: 'Fornitore pulizie',
    cleanerWorkspaceTitle: 'Spazio fornitore pulizie',
    cleanerChatTitle: 'Chat fornitore',
    cleanerTasksTitle: 'Attivita pulizie (settimanale / mensile)',
    cleanerTrackingTitle: 'Monitoraggio pulizie',
    backToCleaningTools: '← Torna agli strumenti pulizie',
    photoPlaceholder: 'Scrivi un messaggio... (foto opzionale)',
    noProviderYet: 'Nessun fornitore registrato',
    removePhotoAria: 'Rimuovi foto',
    addPhotos: 'Aggiungi foto',
    yes: 'Si',
    no: 'No',
    notProvided: 'Non indicato',
  },
}

type CleanerInvite = {
  code: string
  hostUsername: string
  createdAt: string
}

function readCleanerInvites(): CleanerInvite[] {
  try {
    // Cleaner signup is public (no host session), so invite codes must be readable
    // without scoped storage.
    const raw = localStorage.getItem(CLEANER_INVITES_KEY) || readScopedStorage(CLEANER_INVITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CleanerInvite[]) : []
  } catch {
    return []
  }
}

function saveCleanerInvites(invites: CleanerInvite[]) {
  localStorage.setItem(CLEANER_INVITES_KEY, JSON.stringify(invites))
  writeScopedStorage(CLEANER_INVITES_KEY, JSON.stringify(invites))
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
    const raw = readScopedStorage(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean)
  } catch {
    return []
  }
}

function saveInvoices(invoices: CleaningInvoice[]) {
  writeScopedStorage(STORAGE_KEY, JSON.stringify(invoices))
}

function readChatMessages(): CleaningChatMessage[] {
  try {
    const raw = readScopedStorage(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean).map((row: Partial<CleaningChatMessage> & { provider?: string }) => {
      const img =
        typeof row.imageDataUrl === 'string' && row.imageDataUrl.startsWith('data:image/jpeg;base64,')
          ? row.imageDataUrl
          : undefined
      return {
        id: typeof row.id === 'string' ? row.id : randomId(),
        hostUsername: typeof row.hostUsername === 'string' ? row.hostUsername.trim().toLowerCase() : '',
        cleanerUsername: typeof row.cleanerUsername === 'string' ? row.cleanerUsername.trim().toLowerCase() : '',
        senderUsername: typeof row.senderUsername === 'string' ? row.senderUsername.trim().toLowerCase() : '',
        recipientUsername: typeof row.recipientUsername === 'string' ? row.recipientUsername.trim().toLowerCase() : '',
        sender: row.sender === 'provider' ? 'provider' : 'manager',
        text: typeof row.text === 'string' ? row.text : '',
        imageDataUrl: img,
        createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
      }
    }).filter((row) => row.hostUsername && row.cleanerUsername && row.senderUsername && row.recipientUsername)
  } catch {
    return []
  }
}

function saveChatMessages(messages: CleaningChatMessage[]) {
  writeScopedStorage(CHAT_STORAGE_KEY, JSON.stringify(messages))
}

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function newTaskBoard(
  apartmentId: string,
  apartmentName: string,
  month: string,
  frequency: TaskFrequency,
  provider: string,
  ownerUsername?: string,
): CleaningTaskBoard {
  const now = new Date().toISOString()
  return {
    id: randomId(),
    apartmentId,
    apartmentName,
    month,
    ownerUsername: (ownerUsername || '').trim().toLowerCase(),
    frequency,
    provider: provider.trim(),
    tasks: [],
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
      cadence: t.cadence === 'weekly' || t.cadence === 'monthly' ? t.cadence : row.frequency,
      done: Boolean(t.done),
      doneAt: typeof t.doneAt === 'string' ? t.doneAt : undefined,
      weeklyChecks:
        Array.isArray(t.weeklyChecks) && t.weeklyChecks.length === 4
          ? (t.weeklyChecks.map((v) => Boolean(v)) as [boolean, boolean, boolean, boolean])
          : [false, false, false, false],
      weeklyDoneAt:
        Array.isArray(t.weeklyDoneAt) && t.weeklyDoneAt.length === 4
          ? (t.weeklyDoneAt.map((v) => (typeof v === 'string' ? v : undefined)) as [
              string?,
              string?,
              string?,
              string?,
            ])
          : [undefined, undefined, undefined, undefined],
    }))
  return {
    id: typeof row.id === 'string' ? row.id : randomId(),
    apartmentId: row.apartmentId,
    apartmentName: typeof row.apartmentName === 'string' ? row.apartmentName : '',
    month: row.month,
    ownerUsername: typeof row.ownerUsername === 'string' ? row.ownerUsername.trim().toLowerCase() : undefined,
    frequency: row.frequency,
    provider: typeof row.provider === 'string' ? row.provider : '',
    tasks,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
  }
}

function readTaskBoards(): CleaningTaskBoard[] {
  try {
    const raw = readScopedStorage(TASK_BOARDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((r) => normalizeTaskBoard(r)).filter(Boolean) as CleaningTaskBoard[]
  } catch {
    return []
  }
}

function saveTaskBoards(boards: CleaningTaskBoard[]) {
  writeScopedStorage(TASK_BOARDS_KEY, JSON.stringify(boards))
}

function readProviderAssignments(): Record<string, string> {
  return readProviderAssignmentsMap()
}

function saveProviderAssignments(map: Record<string, string>) {
  writeScopedStorage(PROVIDER_ASSIGNMENTS_KEY, JSON.stringify(map))
  notifyCleaningProviderAssignmentsUpdated()
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
    const raw = readScopedStorage(SUIVI_STORAGE_KEY)
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
  writeScopedStorage(SUIVI_STORAGE_KEY, JSON.stringify(map))
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
  const ui = cleaningUiCopy[locale] || cleaningUiCopy.en
  const l = (fr: string, en: string, es: string, de: string, it: string) =>
    ({ fr, en, es, de, it }[locale] || en)
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
  const [chatCleanerUsername, setChatCleanerUsername] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [pendingChatImage, setPendingChatImage] = useState<string | null>(null)
  const [chatImageError, setChatImageError] = useState('')
  const chatFileRef = useRef<HTMLInputElement>(null)

  const [taskBoards, setTaskBoards] = useState<CleaningTaskBoard[]>(() => readTaskBoards())
  const [apartments, setApartments] = useState<ConnectedApartment[]>(() => getConnectedApartmentsFromStorage())
  const [taskApartmentId, setTaskApartmentId] = useState('')
  const [taskHistoryMonth, setTaskHistoryMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [taskMonthTab, setTaskMonthTab] = useState<'current' | 'history'>('current')
  const [taskFrequency] = useState<TaskFrequency>('monthly')
  const [taskViewerRole, setTaskViewerRole] = useState<'owner' | 'provider'>('owner')
  const [taskViewerProvider, setTaskViewerProvider] = useState('')
  const [taskNewLabel, setTaskNewLabel] = useState('')
  const [taskNewCadence, setTaskNewCadence] = useState<TaskFrequency>('monthly')

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
  const [hasNewInvoiceNotice, setHasNewInvoiceNotice] = useState(false)
  const [pendingChatCount, setPendingChatCount] = useState(0)
  const lastSeenReceivedInvoiceAtRef = useRef(0)
  const lastSeenReceivedChatAtRef = useRef(0)
  /** Recalcul des listes liées à `getStoredAccounts()` (autre onglet, inscription prestataire, etc.). */
  const [accountsRevision, setAccountsRevision] = useState(0)

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
    return getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, identifier))
  }, [currentUser, accountsRevision])
  const currentUsername = (currentAccount?.username || currentUser || '').trim().toLowerCase()
  const currentVatRate = useMemo(
    () => VAT_RATE_BY_COUNTRY[String(currentAccount?.countryCode ?? 'FR').trim().toUpperCase()] ?? 20,
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
  const cleanerHasNoAssignedListings = useMemo(
    () => !isHostSession && cleanerAssignedApartmentNames.length === 0,
    [isHostSession, cleanerAssignedApartmentNames.length],
  )
  const cleanerHostLabel = useMemo(() => {
    const hostUsername = (currentAccount?.hostUsername || '').trim().toLowerCase()
    if (!hostUsername) return 'Votre hôte'
    const host = getStoredAccounts().find((a) => normalizeStoredLoginPiece(a.username) === hostUsername)
    if (!host) return `Votre hôte ${currentAccount?.hostUsername}`
    const full = `${host.firstName || ''} ${host.lastName || ''}`.trim()
    return full ? `Votre hôte ${full}` : `Votre hôte ${host.username}`
  }, [currentAccount])
  const cleanerInviteLink =
    cleanerInviteCode && currentUsername
      ? `${window.location.origin}/inscription?role=cleaner&inviteCode=${encodeURIComponent(cleanerInviteCode)}&host=${encodeURIComponent(currentUsername)}`
      : ''
  const inscriptionSignupBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/inscription`
  }, [])
  const cleanerInviteLinkDisplayed = cleanerInviteLink || inscriptionSignupBaseUrl

  async function copyInscriptionLinkToClipboard() {
    const url = cleanerInviteLink || inscriptionSignupBaseUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        /* ignore */
      }
    }
  }

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
      .map(
        (a) =>
          `${String(a.firstName ?? '')} ${String(a.lastName ?? '')}`.trim() || String(a.username ?? '').trim(),
      )
      .filter(Boolean)
    const uniq = Array.from(new Set([...fromInvoices, ...fromAccounts]))
    return uniq.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }, [invoices, accountsRevision])
  const hasRegisteredProviders = providerOptions.length > 0
  const cleanerInvoiceProviderName = cleanerDisplayName.trim() || safeAccountText(currentAccount?.username) || ''
  const effectiveInvoiceProvider = isHostSession ? provider.trim() : cleanerInvoiceProviderName
  const hostCleanerAccounts = useMemo(() => {
    if (!isHostSession) return []
    const keys = new Set<string>()
    const addKey = (raw: string | undefined) => {
      const n = normalizeStoredLoginPiece(raw || '')
      if (n) keys.add(n)
    }
    addKey(currentUsername)
    addKey(currentUser)
    if (currentAccount) {
      addKey(currentAccount.username)
      addKey(currentAccount.email)
    }
    if (!keys.size) return []
    return getStoredAccounts().filter((a) => {
      if ((a.role || 'host') !== 'cleaner') return false
      const hostRef = normalizeStoredLoginPiece(a.hostUsername || '')
      if (!hostRef) return false
      return keys.has(hostRef)
    })
  }, [isHostSession, currentUser, currentUsername, currentAccount, accountsRevision])
  const hostCleanerOptions = useMemo(() => {
    return hostCleanerAccounts
      .map((a) => ({
        username: String(a.username ?? '').trim(),
        label: `${String(a.firstName ?? '')} ${String(a.lastName ?? '')}`.trim() || String(a.username ?? '').trim(),
      }))
      .filter((r) => r.username && r.label)
  }, [hostCleanerAccounts])
  const assignableCleanerOptions = useMemo(
    () => hostCleanerOptions.slice().sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })),
    [hostCleanerOptions],
  )
  const chatCleanerOptions = assignableCleanerOptions
  const currentHostUsername = isHostSession ? currentUsername : (currentAccount?.hostUsername || '').trim().toLowerCase()
  const currentCleanerUsername = isHostSession ? chatCleanerUsername : currentUsername
  const selectedChatProvider = useMemo(() => {
    const username = (isHostSession ? currentCleanerUsername : currentHostUsername).trim().toLowerCase()
    if (!username) return ''
    const account = getStoredAccounts().find((a) => normalizeStoredLoginPiece(a.username) === username)
    if (!account) return username
    return `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.username
  }, [isHostSession, currentCleanerUsername, currentHostUsername, accountsRevision])
  const hostDisplayName = useMemo(() => {
    const hostUsername = (currentAccount?.hostUsername || '').trim().toLowerCase()
    if (!hostUsername) return ''
    const host = getStoredAccounts().find((a) => normalizeStoredLoginPiece(a.username) === hostUsername)
    if (!host) return currentAccount?.hostUsername || ''
    return `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.username
  }, [currentAccount, accountsRevision])
  const usernameLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    getStoredAccounts().forEach((a) => {
      const key = normalizeStoredLoginPiece(a.username)
      if (!key) return
      const label =
        `${String(a.firstName ?? '')} ${String(a.lastName ?? '')}`.trim() || String(a.username ?? '')
      map.set(key, label)
    })
    return map
  }, [accountsRevision])
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
        if (!currentUsername) return false
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

  useEffect(() => {
    if (!isHostSession) {
      setChatCleanerUsername('')
      return
    }
    if (chatCleanerUsername && chatCleanerOptions.some((o) => o.username.trim().toLowerCase() === chatCleanerUsername)) return
    setChatCleanerUsername(chatCleanerOptions[0]?.username.trim().toLowerCase() || '')
  }, [isHostSession, chatCleanerUsername, chatCleanerOptions])

  const filteredChatMessages = useMemo(() => {
    if (!currentHostUsername || !currentCleanerUsername) return []
    return chatMessages
      .filter(
        (msg) =>
          msg.hostUsername === currentHostUsername &&
          msg.cleanerUsername === currentCleanerUsername,
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [chatMessages, currentHostUsername, currentCleanerUsername])

  const receivedInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          (inv.ownerUsername || '').trim().toLowerCase() === currentUsername &&
          inv.direction === 'received',
      ),
    [invoices, currentUsername],
  )
  const receivedChatMessages = useMemo(
    () =>
      chatMessages.filter((msg) => msg.recipientUsername === currentUsername),
    [chatMessages, currentUsername],
  )

  useEffect(() => {
    if (!currentUsername) return
    const latestReceivedInvoiceAt = receivedInvoices.reduce((max, inv) => {
      const ts = new Date(inv.createdAt).getTime()
      return Number.isFinite(ts) && ts > max ? ts : max
    }, 0)
    const latestReceivedChatAt = receivedChatMessages.reduce((max, msg) => {
      const ts = new Date(msg.createdAt).getTime()
      return Number.isFinite(ts) && ts > max ? ts : max
    }, 0)
    lastSeenReceivedInvoiceAtRef.current = latestReceivedInvoiceAt
    lastSeenReceivedChatAtRef.current = latestReceivedChatAt
    setHasNewInvoiceNotice(false)
    setPendingChatCount(0)
  }, [currentUsername])

  useEffect(() => {
    if (!currentUsername) return
    const latestReceivedInvoiceAt = receivedInvoices.reduce((max, inv) => {
      const ts = new Date(inv.createdAt).getTime()
      return Number.isFinite(ts) && ts > max ? ts : max
    }, 0)
    if (activePanel === 'invoices') {
      lastSeenReceivedInvoiceAtRef.current = latestReceivedInvoiceAt
      setHasNewInvoiceNotice(false)
      return
    }
    setHasNewInvoiceNotice(latestReceivedInvoiceAt > lastSeenReceivedInvoiceAtRef.current)
  }, [activePanel, currentUsername, receivedInvoices])

  useEffect(() => {
    if (!currentUsername) return
    const latestReceivedChatAt = receivedChatMessages.reduce((max, msg) => {
      const ts = new Date(msg.createdAt).getTime()
      return Number.isFinite(ts) && ts > max ? ts : max
    }, 0)
    if (activePanel === 'chat') {
      lastSeenReceivedChatAtRef.current = latestReceivedChatAt
      setPendingChatCount(0)
      return
    }
    const unread = receivedChatMessages.filter(
      (msg) => new Date(msg.createdAt).getTime() > lastSeenReceivedChatAtRef.current,
    )
    setPendingChatCount(unread.length)
  }, [activePanel, currentUsername, receivedChatMessages])

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

  useEffect(() => {
    const bump = () => setAccountsRevision((n) => n + 1)
    window.addEventListener('staypilot-session-changed', bump)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'staypilot_accounts' || e.key === null) bump()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('staypilot-session-changed', bump)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    if (!isHostSession) return
    const hostInviteOwner = (currentAccount?.username || currentUser || '').trim().toLowerCase()
    if (!hostInviteOwner) return
    ensureCleanerInvite(hostInviteOwner)
    refreshCleanerInviteState(hostInviteOwner)
  }, [currentUser, currentAccount?.username, isHostSession, accountsRevision])

  useEffect(() => {
    if (!isHostSession || !cleanerInviteCode || !isServerAccountsMandatory()) return
    const acc = getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, currentUser))
    if (!acc?.id || !acc.password) return
    if (String(acc.role || 'host').trim().toLowerCase() === 'cleaner') return
    const codeUp = cleanerInviteCode.trim().toUpperCase()
    const inv = readCleanerInvites().find((i) => String(i.code || '').trim().toUpperCase() === codeUp)
    if (!inv) return
    if (normalizeStoredLoginPiece(inv.hostUsername) !== normalizeStoredLoginPiece(acc.username)) return
    void fetch('/api/cleaner-invite-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: acc.id,
        password: acc.password,
        code: inv.code,
        hostUsername: acc.username,
      }),
    }).catch(() => {})
  }, [isHostSession, cleanerInviteCode, currentUser])

  useEffect(() => {
    const sync = () => {
      setInvoices(readInvoices())
      setChatMessages(readChatMessages())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    saveProviderAssignments(providerAssignments)
  }, [providerAssignments])

  useEffect(() => {
    setApartments(getConnectedApartmentsFromStorage())
    const sync = () => setApartments(getConnectedApartmentsFromStorage())
    window.addEventListener('storage', sync)
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, sync)
    }
  }, [])

  useEffect(() => {
    if (!apartments.length) return
    setTaskApartmentId((prev) => {
      if (prev && apartments.some((a) => a.id === prev)) return prev
      return apartments[0].id
    })
  }, [apartments])

  const effectiveTaskApartmentId = taskApartmentId || apartments[0]?.id || ''
  const selectedTaskListingLabel = useMemo(() => {
    const a = apartments.find((x) => x.id === effectiveTaskApartmentId)
    if (!a) return ''
    return a.address ? `${a.name} — ${a.address}` : a.name
  }, [apartments, effectiveTaskApartmentId])
  const scopedTaskBoards = useMemo(() => {
    const owner = currentUsername.trim().toLowerCase() || 'anonymous'
    return taskBoards.filter((b) => {
      const rowOwner = (b.ownerUsername || '').trim().toLowerCase()
      if (!rowOwner) return owner === 'anonymous'
      return rowOwner === owner
    })
  }, [taskBoards, currentUsername])
  const taskMonthHistoryOptions = useMemo(() => {
    const values = new Set<string>()
    const now = new Date()
    values.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    scopedTaskBoards.forEach((b) => {
      if (b.apartmentId === effectiveTaskApartmentId && b.month) values.add(b.month)
    })
    return Array.from(values)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => {
        const [y, m] = value.split('-')
        const dt = new Date(Number(y), Math.max(0, Number(m) - 1), 1)
        const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(dt)
        return { value, label }
      })
  }, [scopedTaskBoards, effectiveTaskApartmentId])
  const currentTaskMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])
  useEffect(() => {
    if (taskMonthTab === 'current' && taskHistoryMonth !== currentTaskMonth) {
      setTaskHistoryMonth(currentTaskMonth)
    }
  }, [taskMonthTab, taskHistoryMonth, currentTaskMonth])
  const isArchivedTaskMonth = taskHistoryMonth < currentTaskMonth
  const isTaskBoardReadOnly = taskMonthTab === 'history' || isArchivedTaskMonth

  const currentTaskBoard = useMemo(() => {
    if (!effectiveTaskApartmentId) return undefined
    return scopedTaskBoards.find((b) => b.apartmentId === effectiveTaskApartmentId && b.month === taskHistoryMonth)
  }, [scopedTaskBoards, effectiveTaskApartmentId, taskHistoryMonth])

  const canProviderToggleTasks = useMemo(() => {
    if (!currentTaskBoard) return false
    if (isHostSession && taskViewerRole === 'owner') return true
    return taskViewerRole === 'provider'
  }, [currentTaskBoard, taskViewerRole, isHostSession])
  /** L'hôte conserve la gestion des tâches depuis sa session (sinon le bouton Ajouter disparaît). */
  const canOwnerManageTasks = isHostSession && !isTaskBoardReadOnly
  const taskFrequencyLabel = (frequency: TaskFrequency) =>
    frequency === 'weekly'
      ? l('Hebdomadaire', 'Weekly', 'Semanal', 'Wochentlich', 'Settimanale')
      : l('Mensuel', 'Monthly', 'Mensual', 'Monatlich', 'Mensile')

  useEffect(() => {
    if (isHostSession) {
      setTaskViewerRole('owner')
      return
    }
    if (cleanerDisplayName) setTaskViewerProvider(cleanerDisplayName)
    setTaskViewerRole('provider')
  }, [isHostSession, cleanerDisplayName])

  function addTaskRow() {
    if (!canOwnerManageTasks || !effectiveTaskApartmentId) return
    const label = taskNewLabel.trim()
    if (!label) return
    const apt = apartments.find((a) => a.id === effectiveTaskApartmentId)
    if (!apt) return
    const ownerKey = currentUsername.trim().toLowerCase() || 'anonymous'
    const existingIndex = taskBoards.findIndex(
      (b) => b.apartmentId === apt.id && b.month === taskHistoryMonth,
    )
    const newItem = {
      id: randomId(),
      label,
      cadence: taskNewCadence,
      done: false,
      weeklyChecks: [false, false, false, false] as [boolean, boolean, boolean, boolean],
      weeklyDoneAt: [undefined, undefined, undefined, undefined] as [string?, string?, string?, string?],
    }
    let nextBoards: CleaningTaskBoard[]
    if (existingIndex >= 0) {
      nextBoards = taskBoards.map((b, i) =>
        i === existingIndex
          ? {
              ...b,
              apartmentName: apt.name,
              ownerUsername: (b.ownerUsername || ownerKey).trim().toLowerCase() || ownerKey,
              tasks: [...b.tasks, newItem],
              updatedAt: new Date().toISOString(),
            }
          : b,
      )
    } else {
      const board = newTaskBoard(apt.id, apt.name, taskHistoryMonth, taskFrequency, '', currentUsername)
      nextBoards = [
        ...taskBoards,
        {
          ...board,
          tasks: [newItem],
          updatedAt: new Date().toISOString(),
        },
      ]
    }
    setTaskBoards(nextBoards)
    saveTaskBoards(nextBoards)
    setTaskNewLabel('')
  }

  function updateTaskCadence(taskId: string, cadence: TaskFrequency) {
    if (!currentTaskBoard || !canOwnerManageTasks) return
    const nextBoards = taskBoards.map((b) =>
      b.id === currentTaskBoard.id
        ? {
            ...b,
            ownerUsername: (b.ownerUsername || currentUsername).trim().toLowerCase(),
            tasks: b.tasks.map((t) => {
              if (t.id !== taskId) return t
              if (cadence === 'weekly') {
                return {
                  ...t,
                  cadence,
                  done: false,
                  doneAt: undefined,
                  weeklyChecks: t.weeklyChecks || [false, false, false, false],
                  weeklyDoneAt: t.weeklyDoneAt || [undefined, undefined, undefined, undefined],
                }
              }
              const weeklyDoneAt = t.weeklyDoneAt || [undefined, undefined, undefined, undefined]
              const latestDoneAt = weeklyDoneAt.filter(Boolean).sort().slice(-1)[0]
              return {
                ...t,
                cadence,
                done: t.done || (t.weeklyChecks || []).some(Boolean),
                doneAt: t.doneAt || latestDoneAt,
              }
            }),
            updatedAt: new Date().toISOString(),
          }
        : b,
    )
    setTaskBoards(nextBoards)
    saveTaskBoards(nextBoards)
  }

  function removeTaskRow(taskId: string, taskLabel?: string) {
    if (!currentTaskBoard || !canOwnerManageTasks) return
    const confirmationMessage = taskLabel
      ? l(
          `Confirmez-vous la suppression de la tâche "${taskLabel}" ?`,
          `Do you confirm deleting task "${taskLabel}"?`,
          `¿Confirma la eliminación de la tarea "${taskLabel}"?`,
          `Möchten Sie die Aufgabe "${taskLabel}" wirklich löschen?`,
          `Confermi l'eliminazione dell'attività "${taskLabel}"?`,
        )
      : l(
          'Confirmez-vous la suppression de cette tâche ?',
          'Do you confirm deleting this task?',
          '¿Confirma la eliminación de esta tarea?',
          'Möchten Sie diese Aufgabe wirklich löschen?',
          "Confermi l'eliminazione di questa attività?",
        )
    if (!window.confirm(confirmationMessage)) return
    const nextBoards = taskBoards.map((b) =>
      b.id === currentTaskBoard.id
        ? {
            ...b,
            ownerUsername: (b.ownerUsername || currentUsername).trim().toLowerCase(),
            tasks: b.tasks.filter((t) => t.id !== taskId),
            updatedAt: new Date().toISOString(),
          }
        : b,
    )
    setTaskBoards(nextBoards)
    saveTaskBoards(nextBoards)
  }

  function toggleTaskDone(taskId: string, weeklySlotIndex?: number) {
    if (!currentTaskBoard || !canProviderToggleTasks || isTaskBoardReadOnly) return
    const nextBoards = taskBoards.map((b) => {
      if (b.id !== currentTaskBoard.id) return b
      return {
        ...b,
        ownerUsername: (b.ownerUsername || currentUsername).trim().toLowerCase(),
        tasks: b.tasks.map((t) => {
          if (t.id !== taskId) return t
          if (t.cadence === 'weekly') {
            const idx = typeof weeklySlotIndex === 'number' ? weeklySlotIndex : 0
            const checks = [...(t.weeklyChecks || [false, false, false, false])] as [
              boolean,
              boolean,
              boolean,
              boolean,
            ]
            const doneAt = [...(t.weeklyDoneAt || [undefined, undefined, undefined, undefined])] as [
              string?,
              string?,
              string?,
              string?,
            ]
            checks[idx] = !checks[idx]
            doneAt[idx] = checks[idx] ? new Date().toISOString() : undefined
            return {
              ...t,
              weeklyChecks: checks,
              weeklyDoneAt: doneAt,
              done: checks.every(Boolean),
              doneAt: doneAt.filter(Boolean).sort().slice(-1)[0],
            }
          }
          return {
            ...t,
            done: !t.done,
            doneAt: t.done ? undefined : new Date().toISOString(),
          }
        }),
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
    const hostRecipient = safeAccountText(currentAccount?.hostUsername)
    const selectedCleaner = hostCleanerOptions.find((o) => o.label === provider.trim())
    const recipientUsername = isHostSession ? (selectedCleaner?.username || '').trim() : hostRecipient
    if (!recipientUsername) return
    const recipientDisplayName = isHostSession ? (provider.trim() || effectiveInvoiceProvider) : hostDisplayName || hostRecipient
    const senderDisplayName = isHostSession
      ? `${currentAccount?.firstName || ''} ${currentAccount?.lastName || ''}`.trim() || currentAccount?.username || 'Hôte'
      : cleanerInvoiceProviderName
    const confirmTarget = recipientDisplayName || recipientUsername
    const ok = window.confirm(
      l(
        `Confirmez-vous l'envoi de cette facture à ${confirmTarget} ?`,
        `Do you confirm sending this invoice to ${confirmTarget}?`,
        `¿Confirma el envío de esta factura a ${confirmTarget}?`,
        `Bestätigen Sie den Versand dieser Rechnung an ${confirmTarget}?`,
        `Confermi l'invio di questa fattura a ${confirmTarget}?`,
      ),
    )
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

  function sendChatMessage() {
    const text = chatInput.trim()
    const imageDataUrl = pendingChatImage ?? undefined
    if (!currentHostUsername || !currentCleanerUsername || !currentUsername || (!text && !imageDataUrl)) return
    const sender = isHostSession ? 'manager' : 'provider'
    const recipientUsername = isHostSession ? currentCleanerUsername : currentHostUsername
    const nextMessage: CleaningChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      hostUsername: currentHostUsername,
      cleanerUsername: currentCleanerUsername,
      senderUsername: currentUsername,
      recipientUsername,
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

  const canSendChat = Boolean(currentHostUsername && currentCleanerUsername && (chatInput.trim() || pendingChatImage))

  const suiviCheckoutEvents = useMemo(() => getOfficialCheckoutEventsForSuivi(apartments), [apartments])

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
    if (!cleanerHasNoAssignedListings || activePanel === 'overview') return
    setActivePanel('overview')
  }, [cleanerHasNoAssignedListings, activePanel])

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

  function linkProviderToApartment() {
    const selectedProvider = selectedProviderLink.trim()
    if (!selectedProvider) {
      setProviderLinkMsg(
        l(
          "Sélectionnez d'abord une prestataire dans la liste (compte créé avec votre code d'invitation).",
          'Select a provider from the list first (account created with your invitation code).',
          'Primero elige una proveedora de la lista (cuenta creada con tu código de invitación).',
          'Wählen Sie zuerst eine Dienstleisterin aus der Liste (Konto mit Ihrem Einladungscode erstellt).',
          "Seleziona prima una fornitore dall'elenco (account creato con il tuo codice invito).",
        ),
      )
      return
    }
    if (!assignableCleanerOptions.some((opt) => opt.label === selectedProvider)) {
      setProviderLinkMsg(
        l(
          'Choisissez une prestataire qui apparaît dans la liste après inscription.',
          'Choose a provider who appears in the list after they have signed up.',
          'Elige una proveedora que aparezca en la lista tras registrarse.',
          'Wählen Sie eine Dienstleisterin, die nach der Registrierung in der Liste erscheint.',
          'Scegli una fornitore che compare in elenco dopo essersi registrata.',
        ),
      )
      return
    }
    if (!selectedApartmentLink.trim()) {
      setProviderLinkMsg('Selectionnez ensuite un logement.')
      return
    }
    setProviderAssignments((prev) => ({ ...prev, [selectedApartmentLink]: selectedProvider }))
    const apt = apartments.find((a) => a.id === selectedApartmentLink)
    setProviderLinkMsg(
      `${l('Attribution enregistrée', 'Assignment saved', 'Asignación guardada', 'Zuweisung gespeichert', 'Assegnazione salvata')} : ${selectedProvider} ${l('sur', 'to', 'en', 'für', 'su')} ${apt?.name || l('ce logement', 'this listing', 'este alojamiento', 'diese Unterkunft', 'questo alloggio')}.`,
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
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{ui.cleanerProviderTitle}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {activePanel === 'overview'
                ? ui.cleanerWorkspaceTitle
                : activePanel === 'providers'
                  ? ui.cleanerProviderTitle
                : activePanel === 'invoices'
                  ? cc.invoicesTitle
                  : activePanel === 'chat'
                    ? ui.cleanerChatTitle
                    : activePanel === 'tasks'
                      ? ui.cleanerTasksTitle
                      : ui.cleanerTrackingTitle}
            </h1>
            <p className="mt-2 text-sm text-zinc-700">
              {activePanel === 'overview'
                ? cleanerHasNoAssignedListings
                  ? l(
                      "Aucun logement ne vous est encore attribué. Planning, tâches, factures, messagerie et suivi ménage restent fermés jusqu'à ce que votre hôte vous assigne sur au moins un logement depuis son compte (Prestataire ménage).",
                      'No listing is assigned to you yet. Planning, tasks, invoices, chat and cleaning tracking stay closed until your host assigns you to at least one listing from their account (Cleaning provider).',
                      'Aún no tienes ningún alojamiento asignado. Planificación, tareas, facturas, chat y seguimiento permanecen cerrados hasta que tu anfitrión te asigne al menos un alojamiento desde su cuenta.',
                      'Ihnen ist noch keine Unterkunft zugewiesen. Planung, Aufgaben, Rechnungen, Chat und Nachverfolgung bleiben geschlossen, bis Ihr Gastgeber Sie in seinem Konto mindestens einer Unterkunft zuweist.',
                      'Nessun alloggio ti è ancora stato assegnato. Pianificazione, attività, fatture, chat e monitoraggio restano chiusi finché il tuo host non ti assegna almeno un alloggio dal suo account.',
                    )
                  : l(
                      'Retrouvez ici les outils liés au ménage : commencez par la vue d’ensemble, puis ouvrez l’onglet factures quand vous en avez besoin.',
                      'Find all cleaning tools here: start with the overview, then open the invoices tab when needed.',
                      'Encuentra aquí las herramientas de limpieza: empieza por la vista general y abre la pestaña de facturas cuando la necesites.',
                      'Hier finden Sie alle Reinigungswerkzeuge: Starten Sie mit der Übersicht und öffnen Sie bei Bedarf den Rechnungsbereich.',
                      'Trovi qui tutti gli strumenti pulizie: inizia dalla panoramica e apri la scheda fatture quando serve.',
                    )
                : activePanel === 'providers'
                  ? l(
                      "Seules les prestataires déjà inscrites avec votre code d'invitation apparaissent dans la liste. Choisissez-en une, puis le logement à attribuer.",
                      'Only providers who have already signed up with your invitation code appear in the list. Pick one, then the listing to assign.',
                      'Solo aparecen en la lista las proveedoras que ya se registraron con tu código. Elige una y luego el alojamiento.',
                      'In der Liste erscheinen nur Dienstleisterinnen, die sich bereits mit Ihrem Code registriert haben. Wählen Sie eine aus, dann die Unterkunft.',
                      "In elenco compaiono solo le fornitrici già registrate con il tuo codice. Scegli una dall'elenco, poi l'alloggio.",
                    )
                : activePanel === 'invoices'
                  ? cc.invoicesSubtitle
                  : activePanel === 'chat'
                    ? l(
                        'Discutez avec votre prestataire et sélectionnez le nom du prestataire ménage si vous en avez plusieurs.',
                        'Chat with your provider and select the provider name if you have several.',
                        'Habla con tu proveedor y selecciona su nombre si tienes varios.',
                        'Chatten Sie mit Ihrem Dienstleister und wählen Sie den Namen aus, wenn Sie mehrere haben.',
                        'Chatta con il fornitore e seleziona il nome se ne hai più di uno.',
                      )
                    : activePanel === 'tasks'
                      ? l(
                          'Listes par logement et par mois : la prestataire assignée peut cocher ce qui est fait selon les accès de son compte.',
                          'Listing/month checklists: the assigned provider can tick completed tasks based on their account access.',
                          'Listas por alojamiento y mes: el proveedor asignado puede marcar lo realizado según los accesos de su cuenta.',
                          'Listen pro Unterkunft und Monat: der zugewiesene Dienstleister kann Erledigtes entsprechend seinen Kontorechten abhaken.',
                          'Checklist per alloggio e mese: il fornitore assegnato può spuntare le attività svolte in base agli accessi del suo account.',
                        )
                      : l(
                          'Une fiche s’ouvre pour chaque départ voyageur réel détecté via le channel manager. La prestataire ménage renseigne constats, photos et horaires.',
                          'A report opens for each real guest checkout detected via the channel manager. The cleaning provider fills observations, photos, and timing.',
                          'Se abre una ficha para cada salida real detectada por el channel manager. El proveedor de limpieza completa observaciones, fotos y horarios.',
                          'Für jeden echten, über den Channel Manager erkannten Check-out wird ein Bericht geöffnet. Der Reinigungsdienst ergänzt Hinweise, Fotos und Zeiten.',
                          'Si apre una scheda per ogni check-out reale rilevato tramite channel manager. Il fornitore pulizie inserisce note, foto e orari.',
                        )}
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
                      <p className="text-base font-semibold text-zinc-900">{ui.cleanerProviderTitle}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {l(
                          "Après inscription de la prestataire avec votre code, son nom apparaît dans la liste : choisissez-la puis le logement.",
                          'After your provider signs up with your code, their name appears in the list: pick them, then the listing.',
                          'Cuando la proveedora se registre con tu código, su nombre aparece en la lista: elígela y luego el alojamiento.',
                          'Nach der Registrierung mit Ihrem Code erscheint der Name in der Liste: Person wählen, dann Unterkunft.',
                          'Dopo la registrazione con il tuo codice il nome compare in elenco: scegli la fornitore e poi l alloggio.',
                        )}
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
                          : l('Aucun logement pour le moment', 'No listing for now', 'Ningún alojamiento por ahora', 'Derzeit keine Unterkunft', 'Nessun alloggio al momento')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {cleanerHasNoAssignedListings ? null : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setActivePanel('invoices')}
                    className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                  >
                    <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                      <Receipt className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-base font-semibold text-zinc-900">{cc.invoicesTitle}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {l(
                        'Ajouter, filtrer par mois/prestataire et exporter en PDF.',
                        'Add, filter by month/provider, and export to PDF.',
                        'Añade, filtra por mes/proveedor y exporta en PDF.',
                        'Hinzufügen, nach Monat/Dienstleister filtern und als PDF exportieren.',
                        'Aggiungi, filtra per mese/fornitore ed esporta in PDF.',
                      )}
                    </p>
                    {hasNewInvoiceNotice ? (
                      <p className="mt-2 text-xs font-semibold text-rose-600">
                        {l(
                          'Une nouvelle facture a été enregistrée.',
                          'A new invoice has been edited.',
                          'Se ha editado una nueva factura.',
                          'Eine neue Rechnung wurde bearbeitet.',
                          'Una nuova fattura e stata modificata.',
                        )}
                      </p>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePanel('chat')}
                    className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                  >
                    <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                      <Send className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-base font-semibold text-zinc-900">{ui.cleanerChatTitle}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {l(
                        'Sélectionnez le nom du prestataire ménage et échangez des messages dans un espace dédié.',
                        'Select the provider name and exchange messages in a dedicated area.',
                        'Selecciona el nombre del proveedor y envía mensajes en un espacio dedicado.',
                        'Wählen Sie den Namen des Dienstleisters und tauschen Sie Nachrichten in einem eigenen Bereich aus.',
                        'Seleziona il nome del fornitore e scambia messaggi in uno spazio dedicato.',
                      )}
                    </p>
                    {pendingChatCount > 0 ? (
                      <p className="mt-2 text-xs font-semibold text-rose-600">
                        {pendingChatCount === 1
                          ? l(
                              '1 message en attente',
                              '1 message pending',
                              '1 mensaje en espera',
                              '1 ausstehende Nachricht',
                              '1 messaggio in attesa',
                            )
                          : l(
                              `${pendingChatCount} messages en attente`,
                              `${pendingChatCount} messages pending`,
                              `${pendingChatCount} mensajes en espera`,
                              `${pendingChatCount} ausstehende Nachrichten`,
                              `${pendingChatCount} messaggi in attesa`,
                            )}
                      </p>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePanel('tasks')}
                    className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-pm-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-pm-md"
                  >
                    <span className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                      <ClipboardList className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-base font-semibold text-zinc-900">{ui.cleanerTasksTitle}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {l(
                        'Checklist par logement et par mois (vitres, plinthes…). Coches réservées à la prestataire assignée.',
                        'Checklist by listing and month (windows, baseboards...). Checkboxes reserved for the assigned provider.',
                        'Checklist por alojamiento y por mes (ventanas, zócalos...). Casillas reservadas al proveedor asignado.',
                        'Checkliste pro Unterkunft und Monat (Fenster, Sockelleisten ...). Häkchen nur für den zugewiesenen Dienstleister.',
                        'Checklist per alloggio e per mese (vetri, battiscopa...). Spunte riservate al fornitore assegnato.',
                      )}
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
                    <p className="text-base font-semibold text-zinc-900">{ui.cleanerTrackingTitle}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {l(
                        'Après chaque check-out : compte rendu, photos avant/après, clé en boîte, horaires sur le logement.',
                        'After each checkout: report, before/after photos, key box, and listing timing.',
                        'Después de cada check-out: informe, fotos antes/después, llave en caja y horarios del alojamiento.',
                        'Nach jedem Check-out: Bericht, Vorher/Nachher-Fotos, Schlüsselbox und Zeiten zur Unterkunft.',
                        'Dopo ogni check-out: report, foto prima/dopo, cassetta chiavi e orari sull alloggio.',
                      )}
                    </p>
                  </button>
                </div>
              )}

              <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3">
                {isHostSession ? (
                  <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-900">
                          <Link2 className="h-4 w-4" aria-hidden />
                          {l(
                            "Lien d'inscription prestataire ménage",
                            'Cleaning provider signup link',
                            'Enlace de registro del proveedor de limpieza',
                            'Anmeldelink für Reinigungsdienst',
                            'Link iscrizione fornitore pulizie',
                          )}
                        </p>
                        <p className="mt-1 break-all text-xs text-sky-800">
                          {cleanerInviteLinkDisplayed ||
                            l(
                              'Impossible de générer le lien : connectez-vous avec un compte hôte enregistré.',
                              'Unable to generate link: log in with a registered host account.',
                              'No se puede generar el enlace: inicia sesión con una cuenta de anfitrión registrada.',
                              'Link kann nicht erstellt werden: Melden Sie sich mit einem registrierten Gastgeberkonto an.',
                              'Impossibile generare il link: accedi con un account host registrato.',
                            )}
                        </p>
                        <p className="mt-1 text-[11px] text-sky-700">
                          {l('Code hote unique:', 'Unique host code:', 'Código único de anfitrión:', 'Eindeutiger Gastgebercode:', 'Codice host univoco:')}{' '}
                          <strong>{cleanerInviteCode || '...'}</strong>{' '}
                          {l(
                            '(le meme code peut servir a inviter plusieurs prestataires menage)',
                            '(the same code can be used to invite multiple cleaning providers)',
                            '(el mismo código puede servir para invitar a varios proveedores de limpieza)',
                            '(derselbe Code kann verwendet werden, um mehrere Reinigungsdienste einzuladen)',
                            '(lo stesso codice può essere usato per invitare più fornitori di pulizia)',
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void copyInscriptionLinkToClipboard()}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                          Copier
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {cleanerHasNoAssignedListings ? (
                  <p className="text-sm text-zinc-700">
                    {l(
                      "Demandez à votre hôte de vous attribuer au moins un logement dans StayPilot (Prestataire ménage) : vos outils s'ouvriront automatiquement après l'attribution.",
                      'Ask your host to assign you to at least one listing in StayPilot (Cleaning provider): your tools open automatically after assignment.',
                      'Pide a tu anfitrión que te asigne al menos un alojamiento en StayPilot (Proveedor de limpieza): tus herramientas se abrirán solas tras la asignación.',
                      'Bitten Sie Ihren Gastgeber, Sie in StayPilot (Reinigungsdienst) mindestens einer Unterkunft zuzuweisen: Danach werden Ihre Tools automatisch freigeschaltet.',
                      'Chiedi al tuo host di assegnarti almeno un alloggio in StayPilot (Fornitore pulizie): gli strumenti si aprono automaticamente dopo l’assegnazione.',
                    )}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-zinc-800">{cc.importantInfo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">{cc.importantInfoBody}</p>
                  </>
                )}
              </div>
            </div>
          ) : null}

          <div
            className={
              activePanel !== 'providers' || cleanerHasNoAssignedListings
                ? 'hidden px-5 py-5 sm:px-6 sm:py-6'
                : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {ui.backToCleaningTools}
            </button>

            <div className="mt-4 rounded-xl border-2 border-sky-200 bg-zinc-50 p-4 sm:p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
                {l(
                  'Selection prestataire / logement',
                  'Provider / listing selection',
                  'Seleccion proveedor / alojamiento',
                  'Auswahl Dienstleister / Unterkunft',
                  'Selezione fornitore / alloggio',
                )}
              </p>
              <p className="text-sm font-semibold text-zinc-900">
                {l(
                  'Assigner ce logement a :',
                  'Assign this listing to:',
                  'Asignar este alojamiento a:',
                  'Diese Unterkunft zuweisen an:',
                  'Assegna questo alloggio a:',
                )}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-zinc-700">
                  {l('Logement disponible', 'Available listing', 'Alojamiento disponible', 'Verfugbare Unterkunft', 'Alloggio disponibile')}
                  <select
                    value={selectedApartmentLink}
                    onChange={(e) => setSelectedApartmentLink(e.target.value)}
                    disabled={!apartments.length}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  >
                    {apartments.length === 0 ? (
                      <option value="">{l('Aucun logement connecte', 'No connected apartment', 'Ningun alojamiento conectado', 'Keine verbundene Unterkunft', 'Nessun alloggio collegato')}</option>
                    ) : (
                      <>
                        <option value="">{l('Choisir un logement', 'Choose an apartment', 'Elegir un alojamiento', 'Unterkunft auswahlen', 'Scegli un alloggio')}</option>
                        {apartments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </label>
                <label className="text-xs font-semibold text-zinc-700">
                  {l(
                    'Prestataire menage disponible',
                    'Available cleaning provider',
                    'Proveedor de limpieza disponible',
                    'Verfugbarer Reinigungsdienst',
                    'Fornitore pulizie disponibile',
                  )}
                  <select
                    value={selectedProviderLink}
                    onChange={(e) => setSelectedProviderLink(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">
                      {assignableCleanerOptions.length > 0
                        ? l(
                            'Choisir une prestataire ménage',
                            'Choose a cleaning provider',
                            'Elegir una proveedora de limpieza',
                            'Reinigungsdienst wählen',
                            'Scegli una fornitore pulizie',
                          )
                        : ui.noProviderYet}
                    </option>
                    {assignableCleanerOptions.map((opt) => (
                      <option key={opt.username} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {assignableCleanerOptions.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-600">
                  {l(
                    "Aucune prestataire n'est encore liée à votre compte. Partagez le lien ou le code d'inscription : dès qu'elle aura créé son compte StayPilot, son nom apparaîtra ici et vous pourrez lui attribuer un logement. Si elle s'est inscrite sur un autre appareil, déconnectez-vous puis reconnectez-vous pour rafraîchir la liste.",
                    'No provider is linked to your account yet. Share the signup link or invitation code: once they create their StayPilot account, their name appears here and you can assign a listing. If they signed up on another device, sign out and sign back in to refresh the list.',
                    'Ninguna proveedora está vinculada a tu cuenta todavía. Comparte el enlace o el código: cuando cree su cuenta StayPilot, su nombre aparecerá aquí. Si se registró en otro dispositivo, cierra sesión y vuelve a entrar para actualizar la lista.',
                    'Noch keine Dienstleisterin verknüpft. Teilen Sie Link oder Code: Nach der StayPilot-Registrierung erscheint der Name hier. Wenn die Registrierung auf einem anderen Gerät erfolgte, abmelden und wieder anmelden, um die Liste zu aktualisieren.',
                    'Nessuna fornitore collegata. Condividi link o codice: dopo la registrazione StayPilot il nome compare qui. Se si è registrata su un altro dispositivo, esci e rientra per aggiornare l’elenco.',
                  )}
                </p>
              ) : null}
              {selectedApartmentLink && selectedProviderLink ? (
                <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
                  {l('Attribution en preparation :', 'Assignment in progress:', 'Asignacion en preparacion:', 'Zuordnung in Vorbereitung:', 'Assegnazione in preparazione:')}{' '}
                  <strong>{apartments.find((a) => a.id === selectedApartmentLink)?.name || selectedApartmentLink}</strong>{' '}
                  {l('a', 'to', 'a', 'an', 'a')} <strong>{selectedProviderLink}</strong>
                </p>
              ) : null}

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
                <p className="text-xs font-semibold text-zinc-900">{l('Attributions actuelles', 'Current assignments', 'Asignaciones actuales', 'Aktuelle Zuordnungen', 'Assegnazioni attuali')}</p>
                {apartments.length === 0 ? (
                  <p className="mt-1 text-xs text-zinc-600">{l('Aucun logement connecte pour le moment.', 'No connected apartment for now.', 'Ningun alojamiento conectado por ahora.', 'Aktuell keine verbundene Unterkunft.', 'Nessun alloggio collegato al momento.')}</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-zinc-700">
                    {apartments.map((a) => (
                      <li key={`assign-${a.id}`}>
                        {a.name}:{' '}
                        <strong>
                          {providerAssignments[a.id] ||
                            l(
                              'Aucune prestataire assignée',
                              'No provider assigned',
                              'Ningún proveedor asignado',
                              'Kein Dienstleister zugewiesen',
                              'Nessun fornitore assegnato',
                            )}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div
            className={`grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.1fr_1fr] ${
              activePanel !== 'invoices' || cleanerHasNoAssignedListings ? 'hidden' : ''
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
                    placeholder={l('Ex: Menage appartement A', 'Ex: Apartment A cleaning', 'Ej: Limpieza apartamento A', 'Bsp: Reinigung Wohnung A', 'Es: Pulizia appartamento A')}
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
                  placeholder={l('Precisions utiles (periode, nombre de passages, remarques...)', 'Useful details (period, number of visits, notes...)', 'Detalles utiles (periodo, numero de visitas, observaciones...)', 'Nutzliche Angaben (Zeitraum, Anzahl Einsatze, Hinweise...)', 'Dettagli utili (periodo, numero interventi, note...)')}
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

          <div
            className={
              activePanel !== 'chat' || cleanerHasNoAssignedListings
                ? 'hidden px-5 py-5 sm:px-6 sm:py-6'
                : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {ui.backToCleaningTools}
            </button>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                {isHostSession ? (
                  <>
                    <p className="text-sm font-semibold text-zinc-900">{l('Choisir le prestataire menage', 'Choose the cleaning provider', 'Elegir el proveedor de limpieza', 'Reinigungsdienst auswahlen', 'Scegli il fornitore pulizie')}</p>
                    <select
                      value={chatCleanerUsername}
                      onChange={(e) => setChatCleanerUsername(e.target.value.trim().toLowerCase())}
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      {chatCleanerOptions.length === 0 ? (
                        <option value="">{ui.noProviderYet}</option>
                      ) : (
                        chatCleanerOptions.map((cleaner) => (
                          <option key={cleaner.username} value={cleaner.username.trim().toLowerCase()}>
                            {cleaner.label}
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
                    const senderName = msg.senderUsername === currentUsername ? 'Vous' : selectedChatProvider
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
                    <p className="text-sm text-zinc-600">{l('Aucun message pour l instant avec ce prestataire.', 'No message yet with this provider.', 'Aun no hay mensajes con este proveedor.', 'Noch keine Nachricht mit diesem Dienstleister.', 'Nessun messaggio per ora con questo fornitore.')}</p>
                  )
                ) : isHostSession ? null : (
                  <p className="text-sm text-zinc-600">{l('Aucun message pour l instant avec votre hote.', 'No message yet with your host.', 'Aun no hay mensajes con tu anfitrion.', 'Noch keine Nachricht mit Ihrem Gastgeber.', 'Nessun messaggio per ora con il tuo host.')}</p>
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
                  placeholder={ui.photoPlaceholder}
                  rows={3}
                  disabled={!currentHostUsername || !currentCleanerUsername}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                />
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    disabled={!currentHostUsername || !currentCleanerUsername}
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
                        aria-label={ui.removePhotoAria}
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
                    onClick={() => sendChatMessage()}
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
              activePanel !== 'tasks' || cleanerHasNoAssignedListings
                ? 'hidden px-5 py-5 sm:px-6 sm:py-6'
                : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {ui.backToCleaningTools}
            </button>

            <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
                {isHostSession
                  ? 'Vue hôte : configuration des tâches'
                  : 'Vue prestataire : cochez les tâches réalisées'}
              </div>

              {taskViewerRole === 'provider' && isHostSession ? (
                <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-zinc-900">{l('Qui consulte la checklist ?', 'Who is viewing the checklist?', 'Quien consulta la checklist?', 'Wer sieht die Checkliste?', 'Chi consulta la checklist?')}</p>
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
                      <option value="">{l('Choisir ma fiche prestataire', 'Choose my provider profile', 'Elegir mi perfil de proveedor', 'Mein Dienstleisterprofil auswahlen', 'Scegli il mio profilo fornitore')}</option>
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
                      placeholder={l('Votre nom (identique a l assignation sur le logement)', 'Your name (must match apartment assignment)', 'Tu nombre (igual a la asignacion del alojamiento)', 'Ihr Name (muss der Unterkunftszuweisung entsprechen)', 'Il tuo nome (deve corrispondere all assegnazione alloggio)')}
                      className="mt-2 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  )}
                </div>
              ) : null}
              {isHostSession ? (
                <div className="rounded-lg border-2 border-sky-200 bg-sky-50 px-3 py-3">
                  <p className="text-sm font-semibold text-zinc-900">
                    {l(
                      'Assigner ce logement a une prestataire menage',
                      'Assign this listing to a cleaning provider',
                      'Asignar este alojamiento a un proveedor de limpieza',
                      'Diese Unterkunft einem Reinigungsdienst zuweisen',
                      'Assegna questo alloggio a un fornitore pulizie',
                    )}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
                    <label className="text-sm text-zinc-700">
                      {l('Logement', 'Listing', 'Alojamiento', 'Unterkunft', 'Alloggio')}
                      <select
                        value={selectedApartmentLink}
                        onChange={(e) => setSelectedApartmentLink(e.target.value)}
                        disabled={!apartments.length}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                      >
                        {apartments.length === 0 ? (
                          <option value="">{l('Aucun logement connecte', 'No connected apartment', 'Ningun alojamiento conectado', 'Keine verbundene Unterkunft', 'Nessun alloggio collegato')}</option>
                        ) : (
                          <>
                            <option value="">{l('Choisir un logement', 'Choose a listing', 'Elegir un alojamiento', 'Unterkunft auswahlen', 'Scegli un alloggio')}</option>
                            {apartments.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </label>
                    <label className="text-sm text-zinc-700">
                      {l('Prestataire', 'Provider', 'Proveedor', 'Dienstleister', 'Fornitore')}
                      <select
                        value={selectedProviderLink}
                        onChange={(e) => setSelectedProviderLink(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="">
                          {assignableCleanerOptions.length > 0
                            ? l('Choisir une prestataire', 'Choose a provider', 'Elegir proveedor', 'Dienstleister wählen', 'Scegli fornitore')
                            : ui.noProviderYet}
                        </option>
                        {assignableCleanerOptions.map((opt) => (
                          <option key={opt.username} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={linkProviderToApartment}
                      className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                    >
                      {l('Assigner', 'Assign', 'Asignar', 'Zuweisen', 'Assegna')}
                    </button>
                    <button
                      type="button"
                      onClick={unlinkProviderFromApartment}
                      disabled={!selectedApartmentLink || !providerAssignments[selectedApartmentLink]}
                      className="inline-flex rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {l('Retirer', 'Unassign', 'Quitar', 'Entfernen', 'Rimuovi')}
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-sm text-zinc-700">
                  {l('Historique / mois', 'History / month', 'Historial / mes', 'Verlauf / Monat', 'Storico / mese')}
                  <div className="mt-1 rounded-lg border border-zinc-200 bg-white p-2">
                    <div className="mb-2 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                      <button
                        type="button"
                        onClick={() => setTaskMonthTab('current')}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          taskMonthTab === 'current' ? 'bg-sky-600 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {l('Mois en cours', 'Current month', 'Mes en curso', 'Aktueller Monat', 'Mese corrente')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskMonthTab('history')}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          taskMonthTab === 'history' ? 'bg-sky-600 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {l('Historique', 'History', 'Historial', 'Verlauf', 'Storico')}
                      </button>
                    </div>
                    {taskMonthTab === 'history' ? (
                      <select
                        value={taskHistoryMonth}
                        onChange={(e) => setTaskHistoryMonth(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      >
                        {taskMonthHistoryOptions.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="rounded-md bg-sky-50 px-2.5 py-2 text-xs font-medium text-sky-800">
                        {l('Affichage verrouille sur le mois en cours.', 'View locked to current month.', 'Vista bloqueada en el mes en curso.', 'Ansicht auf aktuellen Monat fixiert.', 'Vista bloccata sul mese corrente.')}
                      </p>
                    )}
                  </div>
                </label>
              </div>
              {currentTaskBoard ? (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">
                          {l('Intitulé de la tâche', 'Task label', 'Título de la tarea', 'Aufgabentitel', 'Titolo attività')}
                        </th>
                        <th className="px-3 py-2">
                          {l('Tous les combien', 'How often', 'Cada cuánto', 'Wie oft', 'Frequenza')}
                        </th>
                        <th className="px-3 py-2">{l('Fait', 'Done', 'Hecho', 'Erledigt', 'Fatto')}</th>
                        <th className="px-3 py-2">{l('Date', 'Date', 'Fecha', 'Datum', 'Data')}</th>
                        {canOwnerManageTasks ? (
                          <th className="px-3 py-2">{l('Supprimer', 'Delete', 'Eliminar', 'Löschen', 'Elimina')}</th>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {currentTaskBoard.tasks.map((item) => (
                        <tr key={item.id}>
                          <td className={`px-3 py-2 ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                            {item.label}
                          </td>
                          <td className="px-3 py-2 text-zinc-700">
                            {canOwnerManageTasks ? (
                              <select
                                value={item.cadence}
                                onChange={(e) => updateTaskCadence(item.id, e.target.value as TaskFrequency)}
                                className="w-full min-w-[150px] rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                              >
                                <option value="weekly">{l('Hebdomadaire', 'Weekly', 'Semanal', 'Wochentlich', 'Settimanale')}</option>
                                <option value="monthly">{l('Mensuel', 'Monthly', 'Mensual', 'Monatlich', 'Mensile')}</option>
                              </select>
                            ) : (
                              taskFrequencyLabel(item.cadence)
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {item.cadence === 'weekly' ? (
                              <div className="flex flex-wrap gap-2">
                                {([0, 1, 2, 3] as const).map((slotIndex) => (
                                  <label
                                    key={`${item.id}-week-${slotIndex}`}
                                    className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
                                  >
                                    <span>{`S${slotIndex + 1}`}</span>
                                    <input
                                      type="checkbox"
                                      checked={Boolean((item.weeklyChecks || [false, false, false, false])[slotIndex])}
                                      disabled={!canProviderToggleTasks || isTaskBoardReadOnly}
                                      onChange={() => toggleTaskDone(item.id, slotIndex)}
                                      className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={item.done}
                                disabled={!canProviderToggleTasks || isTaskBoardReadOnly}
                                onChange={() => toggleTaskDone(item.id)}
                                className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-600">
                            {item.cadence === 'weekly' ? (
                              <div className="space-y-1">
                                {([0, 1, 2, 3] as const).map((slotIndex) => {
                                  const slotDoneAt = (item.weeklyDoneAt || [undefined, undefined, undefined, undefined])[slotIndex]
                                  return (
                                    <p key={`${item.id}-date-${slotIndex}`}>
                                      <span className="font-semibold">{`S${slotIndex + 1}: `}</span>
                                      {slotDoneAt
                                        ? formatChatMessageTitle(slotDoneAt)
                                        : l('Non fait', 'Not done', 'No hecho', 'Nicht erledigt', 'Non fatto')}
                                    </p>
                                  )
                                })}
                              </div>
                            ) : item.doneAt ? (
                              formatChatMessageTitle(item.doneAt)
                            ) : (
                              l('Non fait', 'Not done', 'No hecho', 'Nicht erledigt', 'Non fatto')
                            )}
                          </td>
                          {canOwnerManageTasks ? (
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeTaskRow(item.id, item.title)}
                                disabled={isTaskBoardReadOnly}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                              >
                                {l('Supprimer', 'Delete', 'Eliminar', 'Löschen', 'Elimina')}
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  {isHostSession
                    ? l(
                        "Aucune tâche pour ce logement sur ce mois. Utilisez la ligne 'Créer une liste pour' pour ajouter vos tâches.",
                        "No task for this apartment in this month yet. Use the 'Create a list for' row to add tasks.",
                        "No hay tareas para este alojamiento en este mes. Usa la línea 'Crear una lista para' para añadir tareas.",
                        "Für diese Unterkunft gibt es in diesem Monat noch keine Aufgaben. Nutzen Sie die Zeile 'Liste erstellen für'.",
                        "Nessuna attività per questo alloggio in questo mese. Usa la riga 'Crea una lista per' per aggiungere attività.",
                      )
                    : l(
                        "Votre hôte n'a pas encore mis ces options en place pour ce logement.",
                        'Your host has not configured these options for this apartment yet.',
                        'Tu anfitrión todavía no ha configurado estas opciones para este alojamiento.',
                        'Ihr Gastgeber hat diese Optionen für diese Unterkunft noch nicht eingerichtet.',
                        'Il tuo host non ha ancora configurato queste opzioni per questo alloggio.',
                      )}
                </p>
              )}
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
              {isTaskBoardReadOnly ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {taskMonthTab === 'history'
                    ? l(
                        'Mode historique : cette feuille est en lecture seule et ne peut pas etre modifiee.',
                        'History mode: this sheet is read-only and cannot be edited.',
                        'Modo historial: esta hoja es de solo lectura y no se puede modificar.',
                        'Verlaufmodus: Dieses Blatt ist schreibgeschutzt und kann nicht bearbeitet werden.',
                        'Modalita storico: questo foglio e in sola lettura e non puo essere modificato.',
                      )
                    : l(
                        'Mois archive : cette feuille est en lecture seule et ne peut plus etre modifiee.',
                        'Archived month: this sheet is read-only and can no longer be edited.',
                        'Mes archivado: esta hoja es de solo lectura y ya no se puede modificar.',
                        'Archivierter Monat: Dieses Blatt ist schreibgeschutzt und kann nicht mehr bearbeitet werden.',
                        'Mese archiviato: questo foglio e in sola lettura e non puo piu essere modificato.',
                      )}
                </div>
              ) : null}

              <label className="mt-3 block text-sm text-zinc-700">
                {l('Logement', 'Apartment', 'Alojamiento', 'Unterkunft', 'Alloggio')}
                <select
                  value={effectiveTaskApartmentId}
                  onChange={(e) => setTaskApartmentId(e.target.value)}
                  disabled={!apartments.length}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                >
                  {apartments.length === 0 ? (
                    <option value="">{l('Aucun logement connecte', 'No connected apartment', 'Ningun alojamiento conectado', 'Keine verbundene Unterkunft', 'Nessun alloggio collegato')}</option>
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

              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-sm font-semibold text-zinc-900">
                  {l(
                    'Créer une liste pour :',
                    'Create a list for:',
                    'Crear una lista para:',
                    'Liste erstellen für:',
                    'Crea una lista per:',
                  )}{' '}
                  {selectedTaskListingLabel ? (
                    <span className="text-sky-800">{selectedTaskListingLabel}</span>
                  ) : (
                    <span className="font-normal text-zinc-500">
                      {l('(choisir un logement)', '(pick a listing)', '(elige un alojamiento)', '(Unterkunft wählen)', '(scegli un alloggio)')}
                    </span>
                  )}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
                  <label className="text-sm text-zinc-700">
                    {l('Nom de la tâche', 'Task name', 'Nombre de la tarea', 'Aufgabenname', 'Nome attività')}
                    <input
                      value={taskNewLabel}
                      onChange={(e) => setTaskNewLabel(e.target.value)}
                      disabled={isTaskBoardReadOnly}
                      placeholder={l(
                        'Ex: Nettoyer les vitres',
                        'Ex: Clean windows',
                        'Ej: Limpiar los cristales',
                        'Bsp: Fenster reinigen',
                        'Es: Pulire i vetri',
                      )}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    {l('Fréquence', 'Frequency', 'Frecuencia', 'Frequenz', 'Frequenza')}
                    <select
                      value={taskNewCadence}
                      onChange={(e) => setTaskNewCadence(e.target.value as TaskFrequency)}
                      disabled={isTaskBoardReadOnly}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="monthly">{l('Mensuel', 'Monthly', 'Mensual', 'Monatlich', 'Mensile')}</option>
                      <option value="weekly">{l('Semaine', 'Weekly', 'Semanal', 'Wöchentlich', 'Settimanale')}</option>
                    </select>
                  </label>
                  {canOwnerManageTasks ? (
                    <button
                      type="button"
                      onClick={addTaskRow}
                      disabled={!effectiveTaskApartmentId || !taskNewLabel.trim() || isTaskBoardReadOnly}
                      className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {l('Ajouter', 'Add', 'Añadir', 'Hinzufügen', 'Aggiungi')}
                    </button>
                  ) : null}
                </div>
              </div>

            </div>
          </div>

          <div
            className={
              activePanel !== 'suivi' || cleanerHasNoAssignedListings
                ? 'hidden px-5 py-5 sm:px-6 sm:py-6'
                : 'px-5 py-5 sm:px-6 sm:py-6'
            }
          >
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {ui.backToCleaningTools}
            </button>

            <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <p className="text-xs text-zinc-600">
                {l(
                  'Les départs affichés proviennent uniquement des réservations réelles détectées sur vos logements connectés au channel manager.',
                  'Displayed departures come only from real bookings detected on your listings connected to the channel manager.',
                  'Las salidas mostradas provienen solo de reservas reales detectadas en tus alojamientos conectados al channel manager.',
                  'Die angezeigten Abreisen stammen nur aus echten Buchungen, die für Ihre mit dem Channel Manager verbundenen Unterkünfte erkannt wurden.',
                  'Le partenze mostrate provengono solo da prenotazioni reali rilevate sugli alloggi collegati al channel manager.',
                )}
              </p>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">{l('Logement', 'Apartment', 'Alojamiento', 'Unterkunft', 'Alloggio')}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {l(
                      'Choisissez le logement concerné ou « Tous » pour voir tous les départs.',
                      'Choose the apartment or "All" to display every departure.',
                      'Elige el alojamiento o "Todos" para ver todas las salidas.',
                      'Wählen Sie die Unterkunft oder "Alle", um alle Abreisen zu sehen.',
                      'Scegli l alloggio o "Tutti" per vedere tutte le partenze.',
                    )}
                  </p>
                  <select
                    value={suiviLogementTab === 'all' ? 'all' : String(suiviLogementTab)}
                    onChange={(e) =>
                      setSuiviLogementTab(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="mt-2 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="all">{l('Tous les logements', 'All apartments', 'Todos los alojamientos', 'Alle Unterkunfte', 'Tutti gli alloggi')}</option>
                    {apartments.map((_, i) => (
                      <option key={i} value={String(i)}>
                        {suiviApartmentLabel(i)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="shrink-0 lg:max-w-xs">
                  <p className="text-sm font-semibold text-zinc-900 lg:text-right">{l('Check-outs', 'Check-outs', 'Check-outs', 'Check-outs', 'Check-outs')}</p>
                  <p className="mt-0.5 text-xs text-zinc-600 lg:text-right">
                    {l(
                      "Filtrer par date de départ (par rapport à aujourd’hui).",
                      'Filter by checkout date (relative to today).',
                      'Filtrar por fecha de salida (respecto a hoy).',
                      'Nach Abreisedatum filtern (relativ zu heute).',
                      'Filtra per data di check-out (rispetto a oggi).',
                    )}
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
                      {l('Check-outs passés', 'Past check-outs', 'Check-outs pasados', 'Vergangene Check-outs', 'Check-out passati')}
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
                      {l('Check-outs à venir', 'Upcoming check-outs', 'Próximos check-outs', 'Bevorstehende Check-outs', 'Prossimi check-out')}
                    </button>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-semibold text-zinc-900">
                {l('Check-out à traiter', 'Check-out to process', 'Check-out a procesar', 'Zu bearbeitender Check-out', 'Check-out da gestire')}
                {!isHostSession ? (
                  <p className="mt-0.5 text-xs font-medium text-zinc-600">
                    {l(
                      'Vue prestataire : les détails de réservation sont masqués.',
                      'Provider view: booking details are hidden.',
                      'Vista proveedor: los detalles de reserva están ocultos.',
                      'Dienstleisteransicht: Buchungsdetails sind ausgeblendet.',
                      'Vista fornitore: i dettagli della prenotazione sono nascosti.',
                    )}
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
                          ? l('Aucun check-out passé', 'No past check-outs', 'No hay check-outs pasados', 'Keine vergangenen Check-outs', 'Nessun check-out passato')
                          : l(
                              'Aucun check-out passé pour ce logement',
                              'No past check-outs for this apartment',
                              'No hay check-outs pasados para este alojamiento',
                              'Keine vergangenen Check-outs für diese Unterkunft',
                              'Nessun check-out passato per questo alloggio',
                            )
                        : suiviLogementTab === 'all'
                          ? l('Aucun check-out à venir', 'No upcoming check-outs', 'No hay próximos check-outs', 'Keine bevorstehenden Check-outs', 'Nessun check-out in arrivo')
                          : l(
                              'Aucun check-out à venir pour ce logement',
                              'No upcoming check-outs for this apartment',
                              'No hay próximos check-outs para este alojamiento',
                              'Keine bevorstehenden Check-outs für diese Unterkunft',
                              'Nessun check-out in arrivo per questo alloggio',
                            )}
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
                          ? ` — ${ev.guest} (${ev.channel === 'airbnb' ? 'Airbnb' : ev.channel === 'booking' ? 'Booking' : 'Channel manager'}) — ${ev.reservationId}`
                          : ''}
                        {' — '}
                        [{suiviEventStatus(ev, suiviReports[ev.id]).label}]
                      </option>
                    ))
                  )}
                </select>
                {suiviFilteredCheckoutEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-600">
                    {suiviHorizonTab === 'past'
                      ? suiviLogementTab === 'all'
                        ? l(
                            'Aucun check-out passé à afficher pour le moment.',
                            'No past check-outs to display at the moment.',
                            'No hay check-outs pasados para mostrar por el momento.',
                            'Derzeit keine vergangenen Check-outs zum Anzeigen.',
                            'Nessun check-out passato da mostrare al momento.',
                          )
                        : l(
                            'Aucun check-out passé pour ce logement pour le moment.',
                            'No past check-outs for this apartment at the moment.',
                            'No hay check-outs pasados para este alojamiento por el momento.',
                            'Derzeit keine vergangenen Check-outs für diese Unterkunft.',
                            'Nessun check-out passato per questo alloggio al momento.',
                          )
                      : suiviLogementTab === 'all'
                        ? l(
                            'Aucun check-out à venir à afficher pour le moment.',
                            'No upcoming check-outs to display at the moment.',
                            'No hay próximos check-outs para mostrar por el momento.',
                            'Derzeit keine bevorstehenden Check-outs zum Anzeigen.',
                            'Nessun check-out in arrivo da mostrare al momento.',
                          )
                        : l(
                            'Aucun check-out à venir pour ce logement pour le moment.',
                            'No upcoming check-outs for this apartment at the moment.',
                            'No hay próximos check-outs para este alojamiento por el momento.',
                            'Derzeit keine bevorstehenden Check-outs für diese Unterkunft.',
                            'Nessun check-out in arrivo per questo alloggio al momento.',
                          )}
                  </p>
                ) : null}
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
                    <label className="text-sm font-semibold text-zinc-900">{l('Remarques / incidents', 'Notes / incidents', 'Notas / incidencias', 'Hinweise / Vorfalle', 'Note / incidenti')}</label>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Laissez vide ou indiquez « Rien à signaler ». Ex. : vaisselle cassée, tache sur le canapé…
                    </p>
                    <textarea
                      value={suiviDraft.note}
                      onChange={(e) => setSuiviDraft((d) => ({ ...d, note: e.target.value }))}
                      placeholder={l('Rien a signaler', 'Nothing to report', 'Nada que reportar', 'Nichts zu melden', 'Niente da segnalare')}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-sm font-semibold text-zinc-900">{l('Photos avant menage', 'Photos before cleaning', 'Fotos antes de la limpieza', 'Fotos vor der Reinigung', 'Foto prima della pulizia')}</p>
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
                        {ui.addPhotos}
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suiviDraft.photosBefore.map((src, i) => (
                          <div key={`b-${i}`} className="relative">
                            <img src={src} alt="" className="h-20 w-20 rounded-md border border-zinc-200 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSuiviPhoto('before', i)}
                              className="absolute -right-1 -top-1 rounded-full border border-zinc-200 bg-white p-0.5 text-zinc-600 shadow-sm"
                              aria-label={ui.removePhotoAria}
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-sm font-semibold text-zinc-900">{l('Photos apres menage', 'Photos after cleaning', 'Fotos despues de la limpieza', 'Fotos nach der Reinigung', 'Foto dopo la pulizia')}</p>
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
                        {ui.addPhotos}
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suiviDraft.photosAfter.map((src, i) => (
                          <div key={`a-${i}`} className="relative">
                            <img src={src} alt="" className="h-20 w-20 rounded-md border border-zinc-200 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSuiviPhoto('after', i)}
                              className="absolute -right-1 -top-1 rounded-full border border-zinc-200 bg-white p-0.5 text-zinc-600 shadow-sm"
                              aria-label={ui.removePhotoAria}
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
                        {ui.notProvided}
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
                <p className="text-sm font-semibold text-zinc-800">{cc.importantInfo}</p>
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
