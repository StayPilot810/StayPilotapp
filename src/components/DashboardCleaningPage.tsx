import { ClipboardList, FileText, ImagePlus, Inbox, ListChecks, Receipt, Send, Wallet, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_APARTMENT_ROW_COUNT, DEMO_MONTH_INDEX, DEMO_YEAR } from '../data/demoCalendarBookings'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage, type ConnectedApartment } from '../utils/connectedApartments'
import { isTestModeEnabled } from '../utils/testMode'
import { getDemoCheckoutEventsForSuivi } from '../utils/suiviMenageCheckouts'

type InvoiceDirection = 'received' | 'sent'
type InvoiceStatus = 'pending' | 'paid'
type CleaningPanel = 'overview' | 'invoices' | 'chat' | 'tasks' | 'suivi'
type TaskFrequency = 'weekly' | 'monthly'

type CleaningInvoice = {
  id: string
  direction: InvoiceDirection
  label: string
  provider: string
  month: string
  amountEur: number
  status: InvoiceStatus
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
const MAX_CHAT_IMAGE_DATA_URL_LEN = 500_000

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

function downloadInvoicePdf(invoice: CleaningInvoice) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const createdLabel = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(invoice.createdAt))
  const amount = `${invoice.amountEur.toFixed(2)} EUR`

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
  doc.text(`Montant: ${amount}`, 16, 60)
  doc.text(`Statut: ${invoice.status === 'paid' ? 'Payée' : 'En attente'}`, 16, 66)

  if (invoice.note) {
    const wrapped = doc.splitTextToSize(`Note: ${invoice.note}`, 178)
    doc.text(wrapped, 16, 74)
  }

  const outName = `${invoice.fileName || `facture-menage-${invoice.month}-${invoice.id}`}.pdf`
  doc.save(outName)
}

export function DashboardCleaningPage() {
  const { t } = useLanguage()
  const [activePanel, setActivePanel] = useState<CleaningPanel>('overview')
  const [invoices, setInvoices] = useState<CleaningInvoice[]>(() => readInvoices())
  const [tab, setTab] = useState<InvoiceDirection>('received')
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
  const [status, setStatus] = useState<InvoiceStatus>('pending')
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

  const providerOptions = useMemo(() => {
    const uniq = Array.from(new Set(invoices.map((i) => i.provider.trim()).filter(Boolean)))
    return uniq.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }, [invoices])
  const hasRegisteredProviders = providerOptions.length > 0
  const chatProviderOptions = providerOptions

  const filtered = useMemo(() => {
    return invoices
      .filter((i) => i.direction === tab)
      .filter((i) => i.month === monthFilter)
      .filter((i) => (providerFilter === 'all' ? true : i.provider === providerFilter))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, tab, monthFilter, providerFilter])

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
    const a = taskViewerProvider.trim().toLowerCase()
    const b = currentTaskBoard.provider.trim().toLowerCase()
    return Boolean(a && b && a === b)
  }, [currentTaskBoard, taskViewerRole, taskViewerProvider])

  useEffect(() => {
    if (currentTaskBoard) setTaskAssignedProvider(currentTaskBoard.provider)
  }, [currentTaskBoard?.id])

  function saveTaskBoardConfig() {
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
    if (!currentTaskBoard || taskViewerRole !== 'owner') return
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
    if (!currentTaskBoard || taskViewerRole !== 'owner') return
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
    if (!label.trim() || !provider.trim() || !month || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return
    const next: CleaningInvoice = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      direction: tab,
      label: label.trim(),
      provider: provider.trim(),
      month,
      amountEur: Math.round(parsedAmount * 100) / 100,
      status,
      fileName: fileName.trim().replace(/\.[^.]+$/, ''),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }
    const merged = [next, ...invoices]
    setInvoices(merged)
    saveInvoices(merged)
    setLabel('')
    setProvider('')
    setMonth('')
    setAmountEur('')
    setStatus('pending')
    setFileName('')
    setNote('')
    downloadInvoicePdf(next)
  }

  function togglePaid(id: string) {
    const next = invoices.map((inv) =>
      inv.id === id ? { ...inv, status: inv.status === 'paid' ? 'pending' : 'paid' } : inv,
    )
    setInvoices(next)
    saveInvoices(next)
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
                : activePanel === 'invoices'
                  ? 'Gérer les factures'
                  : activePanel === 'chat'
                    ? 'Tchat prestataire ménage'
                    : activePanel === 'tasks'
                      ? 'Tâches ménage (hebdomadaire / mensuel)'
                      : 'Suivi ménage'}
            </h1>
            <p className="mt-2 text-sm text-zinc-700">
              {activePanel === 'overview'
                ? 'Retrouvez ici les outils liés au ménage : commencez par la vue d’ensemble, puis ouvrez l’onglet factures quand vous en avez besoin.'
                : activePanel === 'invoices'
                  ? 'Créez, suivez et exportez en PDF vos factures de ménage (reçues ou émises).'
                  : activePanel === 'chat'
                    ? 'Discutez avec votre prestataire et sélectionnez le nom du prestataire ménage si vous en avez plusieurs.'
                    : activePanel === 'tasks'
                      ? 'Listes par logement et par mois : la prestataire assignée peut cocher ce qui est fait (accès simulé par profil).'
                      : `Une fiche s’ouvre à chaque départ voyageur détecté sur le calendrier (démo ${suiviDemoMonthLabel}). La prestataire ménage renseigne constats, photos et horaires.`}
            </p>
          </div>

          {activePanel === 'overview' ? (
            <div className="px-5 py-6 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    Ajouter, filtrer par mois/prestataire, suivre les statuts et exporter en PDF.
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
                <p className="text-sm font-semibold text-zinc-800">Information importante</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                  Cet espace sert à créer, centraliser et suivre vos factures de ménage (statut, mois, prestataire,
                  PDF). Le règlement financier n’est pas géré dans StayPilot : le paiement doit être effectué hors
                  plateforme (virement, espèces ou autre moyen convenu entre vous).
                </p>
              </div>
            </div>
          ) : null}

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
                ← Retour aux outils prestataire ménage
              </button>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-zinc-900">Ajouter une facture</p>
              <p className="mt-1 text-xs text-zinc-600">
                Choisissez si la facture est reçue du prestataire ménage ou envoyée par vous.
              </p>

              <div className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setTab('received')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    tab === 'received' ? 'bg-sky-100 text-sky-700' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Inbox className="h-3.5 w-3.5" aria-hidden />
                    Factures reçues
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('sent')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    tab === 'sent' ? 'bg-sky-100 text-sky-700' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Factures envoyées
                  </span>
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-700">
                  Libellé
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ex: Ménage appartement A"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-zinc-700">
                  Prestataire ménage
                  {hasRegisteredProviders ? (
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">Sélectionner un prestataire</option>
                      {providerOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      placeholder="Nom du prestataire"
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  )}
                </label>
                <label className="text-sm text-zinc-700">
                  Mois
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
                  Montant (EUR)
                  <input
                    value={amountEur}
                    onChange={(e) => setAmountEur(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-zinc-700">
                  Statut
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="pending">En attente</option>
                    <option value="paid">Payée</option>
                  </select>
                </label>
                <label className="text-sm text-zinc-700">
                  Fichier facture (optionnel)
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm text-zinc-700">
                Note (optionnel)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Précisions utiles (période, nombre de passages, remarques...)"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              {tab === 'sent' ? (
                <button
                  type="button"
                  onClick={addInvoice}
                  disabled={!provider.trim()}
                  className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                >
                  Envoyer à : {provider.trim() || (hasRegisteredProviders ? 'Sélectionner un prestataire' : 'Indiquer le prestataire')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addInvoice}
                  disabled={!provider.trim()}
                  className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                >
                  Ajouter la facture
                </button>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">
                  {tab === 'received' ? 'Factures reçues' : 'Factures envoyées'}
                </p>
                <p className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600">
                  <Wallet className="h-3.5 w-3.5" aria-hidden />
                  Total: {totalAmount.toFixed(2)} EUR
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-xs font-semibold text-zinc-600">Mois affiché</label>
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  ← Précédent
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
                  Suivant →
                </button>
                <span className="text-xs font-semibold text-zinc-500">({monthLabel})</span>

                <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />

                <label className="text-xs font-semibold text-zinc-600">Prestataire ménage</label>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="all">Tous les prestataires</option>
                  {providerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 space-y-2">
                {filtered.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                    Aucune facture pour l'instant.
                  </p>
                ) : (
                  filtered.map((inv) => (
                    <article key={inv.id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{inv.label}</p>
                          <p className="text-xs text-zinc-600">
                            {inv.provider} • {inv.month} • {inv.amountEur.toFixed(2)} EUR
                          </p>
                          {inv.fileName ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-600">
                              <FileText className="h-3.5 w-3.5" aria-hidden />
                              {inv.fileName}
                            </p>
                          ) : null}
                          {inv.note ? <p className="mt-1 text-xs text-zinc-600">{inv.note}</p> : null}
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {inv.status === 'paid' ? 'Payée' : 'En attente'}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => togglePaid(inv.id)}
                          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                        >
                          {inv.status === 'paid' ? 'Marquer en attente' : 'Marquer payée'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeInvoice(inv.id)}
                          className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Supprimer
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
              </div>

              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
                {selectedChatProvider ? (
                  filteredChatMessages.length > 0 ? (
                    filteredChatMessages.map((msg) => (
                      <article
                        key={msg.id}
                        title={formatChatMessageTitle(msg.createdAt)}
                        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                          msg.sender === 'manager'
                            ? 'ml-auto bg-sky-100 text-sky-900'
                            : 'mr-auto bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold">{msg.sender === 'manager' ? 'Vous' : selectedChatProvider}</p>
                          <time
                            dateTime={msg.createdAt}
                            className="shrink-0 text-[11px] font-medium tabular-nums opacity-75"
                          >
                            {formatChatMessageTime(msg.createdAt)}
                          </time>
                        </div>
                        {msg.imageDataUrl ? (
                          <img
                            src={msg.imageDataUrl}
                            alt=""
                            className="mt-2 max-h-48 w-full max-w-xs rounded-md border border-black/10 object-contain"
                          />
                        ) : null}
                        {msg.text ? <p className={msg.imageDataUrl ? 'mt-1.5' : 'mt-0.5'}>{msg.text}</p> : null}
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600">Aucun message pour l’instant avec ce prestataire.</p>
                  )
                ) : (
                  <p className="text-sm text-zinc-600">
                    Ajoutez d’abord un prestataire via les factures pour ouvrir le tchat.
                  </p>
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
                  <button
                    type="button"
                    onClick={() => sendChatMessage('provider')}
                    disabled={!canSendChat}
                    className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Simuler réponse prestataire
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTaskViewerRole('owner')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    taskViewerRole === 'owner'
                      ? 'bg-sky-600 text-white'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  Propriétaire (configuration)
                </button>
                <button
                  type="button"
                  onClick={() => setTaskViewerRole('provider')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    taskViewerRole === 'provider'
                      ? 'bg-sky-600 text-white'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  Prestataire (cocher les tâches)
                </button>
              </div>

              {taskViewerRole === 'provider' ? (
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
                {taskViewerRole === 'owner' ? (
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
                  Connectez d’abord un logement dans{' '}
                  <a href="/dashboard/connecter-logements" className="font-semibold underline">
                    Connecter vos logements
                  </a>
                  .
                </p>
              ) : null}

              {taskViewerRole === 'owner' ? (
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

              {currentTaskBoard && taskViewerRole === 'owner' ? (
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
                      {taskViewerRole === 'owner' ? (
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
                  Aucune checklist pour ce logement, ce mois et cette fréquence. Passez en mode Propriétaire et cliquez
                  sur « Créer la checklist ».
                </p>
              )}

              {taskViewerRole === 'owner' && currentTaskBoard ? (
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSuiviLogementTab('all')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        suiviLogementTab === 'all'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      Tous les logements
                    </button>
                    {Array.from({ length: suiviApartmentCount }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSuiviLogementTab(i)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          suiviLogementTab === i
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {suiviApartmentLabel(i)}
                      </button>
                    ))}
                  </div>
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
                        {formatSuiviCheckoutLabel(ev.checkoutIso)}
                        {suiviLogementTab === 'all' ? ` — ${suiviApartmentLabel(ev.aptIndex)}` : ''} — {ev.guest} (
                        {ev.channel === 'airbnb' ? 'Airbnb' : 'Booking'}) — {ev.reservationId}
                      </option>
                    ))
                  )}
                </select>
              </label>

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
