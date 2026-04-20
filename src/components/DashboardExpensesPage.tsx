import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { buildGuestDemoMonthBookings, DEMO_BASE_YEAR } from '../utils/demoCalendarData'
import {
  buildChannelExpenseRowsForMonth,
  buildChannelRevenueRowsFromSync,
} from '../utils/channelExpensesFromSync'
import { isGuestDemoRoutingActive, isGuestDemoSession } from '../utils/guestDemo'
import { readOfficialChannelSyncData } from '../utils/officialChannelData'
import { readScopedStorage, writeScopedStorage } from '../utils/sessionStorageScope'
import { isTestModeEnabled } from '../utils/testMode'

const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'

type ExpenseStatus = 'A payer' | 'Paye' | 'Prelevement automatique'
type ScopeMode = 'global' | 'by_apartment'

type ExpenseRow = {
  id: string
  apartment: string
  label: string
  category: string
  amount: number
  dueDate: string
  status: ExpenseStatus
  attachmentName?: string
  attachmentDataUrl?: string
}

type FixedCharge = {
  id: string
  apartment: string
  label: string
  category: string
  amount: number
  dayOfMonth: number
  status: ExpenseStatus
  startYear: number
  startMonth: number
  endYear?: number
  endMonth?: number
  attachmentName?: string
  attachmentDataUrl?: string
}

type FixedChargeTemplate = {
  label: string
  category: string
  amountBase: number
  dayOfMonth: number
  status: ExpenseStatus
}

function getConnectedApartmentOptions() {
  const fromConnected = getConnectedApartmentsFromStorage().map((apt) => apt.name)
  if (fromConnected.length > 0) return fromConnected
  if (isTestModeEnabled()) return ['Logement test 1', 'Logement test 2']
  return []
}

const STORAGE_KEY = 'staypilot_expenses_rows_v1'
const STORAGE_FIXED_KEY = 'staypilot_fixed_charges_v1'
const MONTHS = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
} as const
const PIE_COLORS = ['#4a86f7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
const DEFICIT_PIE_FILL = '#e11d48'

const DEFAULT_FIXED_CHARGE_TEMPLATES: FixedChargeTemplate[] = [
  { label: 'Loyer', category: 'Financement', amountBase: 680, dayOfMonth: 3, status: 'Prelevement automatique' },
  { label: 'Assurance habitation', category: 'Assurance', amountBase: 42, dayOfMonth: 7, status: 'Prelevement automatique' },
  { label: 'Internet', category: 'Services', amountBase: 29, dayOfMonth: 10, status: 'A payer' },
]
function isRemovedSampleLabel(label: string) {
  return label.trim().toLowerCase().startsWith('remplacement kit serviettes')
}

/** Mois calendaire suivant (ex. pour démarrer une charge fixe « à partir du mois prochain »). */
function getNextCalendarMonth(from: Date): { year: number; month: number } {
  const cur = from.getMonth() + 1
  if (cur === 12) return { year: from.getFullYear() + 1, month: 1 }
  return { year: from.getFullYear(), month: cur + 1 }
}

function getStatusSelectClass(status: ExpenseStatus) {
  if (status === 'Paye') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'A payer') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function buildDefaultFixedCharges(apartmentNames: string[], baseYear: number): FixedCharge[] {
  if (apartmentNames.length === 0) return []
  return apartmentNames.flatMap((apartment, aptIdx) =>
    DEFAULT_FIXED_CHARGE_TEMPLATES.map((tpl, tplIdx) => ({
      id: `default-fixed-${aptIdx}-${tplIdx}`,
      apartment,
      label: tpl.label,
      category: tpl.category,
      amount: tpl.amountBase + aptIdx * 12 + tplIdx * 3,
      dayOfMonth: tpl.dayOfMonth,
      status: tpl.status,
      startYear: baseYear,
      startMonth: 1,
    })),
  )
}

export function DashboardExpensesPage() {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const c = {
    fr: {
      subtitle: 'Vue simple des charges avec edition ligne par ligne.',
      connectPrompt: "Connecte d'abord tes logements pour acceder au tableau des charges.",
      connectMyListings: 'Connecter mes logements',
      addVariableCharge: 'Ajouter une charge variable',
      saveAll: 'Enregistrer tout',
      remove: 'Supprimer',
      addFixedExpense: 'Ajouter une charge fixe',
      monthlyResult: 'Resultat mensuel apres deduction des charges',
      netResult: 'Resultat net (EUR)',
      allApartments: 'Tous les appartements',
      totalExpenses: 'Total charges',
      dueNow: 'À payer',
      fixedChargesTitle: 'Charges fixes mensuelles',
      fixedChargesHint:
        'Définis ici des montants qui se répètent chaque mois (loyer prêt, abonnement…). Une nouvelle règle s’applique à partir du mois calendaire suivant la date du jour, puis chaque mois à la même date.',
      variableBlockTitle: 'Charges variables (mois affiché)',
      variableBlockHint:
        'Ajoute ici les frais ponctuels du mois sélectionné (facture, achat, intervention…). Elles ne se recopient pas d’un mois sur l’autre : pour un coût récurrent, utilise les charges fixes ci-dessus.',
      statusToPay: 'A payer',
      statusPaid: 'Paye',
      statusAuto: 'Prelevement automatique',
      pieTitle: 'Repartition des charges (camembert)',
      noExpense: 'Aucune charge a afficher pour cette periode.',
      noResult: 'Aucune donnee de resultat disponible pour ce mois.',
      global: 'Global',
      byApartment: 'Appartement / appartement',
      rows: 'Lignes',
      labelCol: 'Libelle',
      categoryCol: 'Categorie',
      amountCol: 'Montant',
      dayOfMonthCol: 'Jour du mois',
      statusCol: 'Statut',
      attachmentCol: 'Piece jointe',
      actionCol: 'Action',
      effectiveFromCol: 'Debut (1re application)',
      dueDateCol: 'Echeance',
      amountEurCol: 'Montant (EUR)',
      attach: 'Joindre',
      open: 'Ouvrir',
      removeAttachment: 'Suppr. PJ',
      pieHoverHint: 'Survole un segment pour voir le pourcentage.',
      monthlyRevenueHint:
        'Le CA affiche ici est le CA net encaisse (reservation + frais de menage + frais supplementaires, commissions plateforme deja deduites).',
      apartmentCol: 'Appartement',
      netRevenueCol: 'CA net encaisse (EUR)',
      chargesCol: 'Charges (EUR)',
      globalResult: 'Global resultat',
      legendNote:
        'Legende: les commissions des plateformes ne sont pas affichees comme charge separee ici, car elles sont deja integrees dans le CA net encaisse.',
      chargesWithoutRevenueLabel: 'Sans reservations (charges du mois)',
      pieDeficitTitle: 'Sorties sans CA reservations (vue deficit)',
      pieDeficitHint:
        'Aucun encaissement net lie aux reservations pour ce mois dans le channel manager : le diagramme represente uniquement vos charges comme sortie.',
      pieDeficitChargesSlice: 'Total des charges du mois',
      channelLabelMenage: 'Frais de ménage (réservations — données channel)',
      channelLabelAutres: 'Autres frais voyageur (channel)',
      channelLabelPlatform: 'Commission plateforme / OTA (channel)',
      channelLabelTaxes: 'Taxes / TVA (channel)',
      channelCategory: 'Channel (sync)',
      selectApartmentToAdd:
        'Pour ajouter des charges (fixes ou variables), passez en « Appartement / appartement » et choisissez un logement. La vue globale résume tout sans saisie.',
    },
    en: {
      subtitle: 'Simple expense view with line-by-line editing.',
      connectPrompt: 'Connect your listings first to access the expense dashboard.',
      connectMyListings: 'Connect my listings',
      addVariableCharge: 'Add variable expense',
      saveAll: 'Save all',
      remove: 'Delete',
      addFixedExpense: 'Add fixed expense',
      monthlyResult: 'Monthly result after expense deduction',
      netResult: 'Net result (EUR)',
      allApartments: 'All apartments',
      totalExpenses: 'Total expenses',
      dueNow: 'Due now',
      fixedChargesTitle: 'Monthly fixed expenses',
      fixedChargesHint:
        'Set amounts that repeat every month (loan, subscription…). A new rule starts from the next calendar month after today, then repeats on the same day each month.',
      variableBlockTitle: 'Variable expenses (selected month)',
      variableBlockHint:
        'Add one-off costs for the selected month (invoice, purchase, repair…). They do not roll forward: for recurring costs, use fixed charges above.',
      statusToPay: 'To pay',
      statusPaid: 'Paid',
      statusAuto: 'Automatic debit',
      pieTitle: 'Expense breakdown (pie chart)',
      noExpense: 'No expense to display for this period.',
      noResult: 'No result data available for this month.',
      global: 'Global',
      byApartment: 'Apartment by apartment',
      rows: 'Rows',
      labelCol: 'Label',
      categoryCol: 'Category',
      amountCol: 'Amount',
      dayOfMonthCol: 'Day of month',
      statusCol: 'Status',
      attachmentCol: 'Attachment',
      actionCol: 'Action',
      effectiveFromCol: 'Starts (first month)',
      dueDateCol: 'Due date',
      amountEurCol: 'Amount (EUR)',
      attach: 'Attach',
      open: 'Open',
      removeAttachment: 'Remove file',
      pieHoverHint: 'Hover over a segment to view percentage.',
      monthlyRevenueHint:
        'Revenue shown here is net collected revenue (reservation + cleaning fees + extra fees, platform commissions already deducted).',
      apartmentCol: 'Apartment',
      netRevenueCol: 'Net collected revenue (EUR)',
      chargesCol: 'Expenses (EUR)',
      globalResult: 'Global result',
      legendNote:
        'Note: platform commissions are not displayed as a separate expense here because they are already included in net collected revenue.',
      chargesWithoutRevenueLabel: 'Expenses (no bookings this month)',
      pieDeficitTitle: 'Outflows with no booking revenue (deficit view)',
      pieDeficitHint:
        'There is no net booking revenue for this month in the channel manager: the chart shows your expenses as the only outflow for the period.',
      pieDeficitChargesSlice: 'Total expenses for the month',
      channelLabelMenage: 'Cleaning fees (bookings — channel sync)',
      channelLabelAutres: 'Guest extra fees (channel sync)',
      channelLabelPlatform: 'Platform / OTA commission (channel sync)',
      channelLabelTaxes: 'Taxes / VAT (channel sync)',
      channelCategory: 'Channel (sync)',
      selectApartmentToAdd:
        'To add expenses (fixed or variable), switch to “Apartment by apartment” and pick a listing. Global view summarizes everything without adding lines.',
    },
    es: {
      subtitle: 'Vista simple de gastos con edición línea por línea.',
      connectPrompt: 'Conecta primero tus alojamientos para acceder al panel de gastos.',
      connectMyListings: 'Conectar mis alojamientos',
      addVariableCharge: 'Añadir gasto variable',
      saveAll: 'Guardar todo',
      remove: 'Eliminar',
      addFixedExpense: 'Añadir gasto fijo',
      monthlyResult: 'Resultado mensual después de deducir gastos',
      netResult: 'Resultado neto (EUR)',
      allApartments: 'Todos los apartamentos',
      totalExpenses: 'Total gastos',
      dueNow: 'Por pagar',
      fixedChargesTitle: 'Gastos fijos mensuales',
      fixedChargesHint:
        'Define gastos que se repiten cada mes (prestamo, suscripcion…). Una regla nueva empieza el mes calendario siguiente a hoy y se repite el mismo dia cada mes.',
      variableBlockTitle: 'Gastos variables (mes mostrado)',
      variableBlockHint:
        'Añade gastos puntuales del mes seleccionado (factura, compra…). No se copian al mes siguiente: para costes recurrentes, usa los gastos fijos de arriba.',
      statusToPay: 'Por pagar',
      statusPaid: 'Pagado',
      statusAuto: 'Débito automático',
      pieTitle: 'Reparto de gastos (gráfico circular)',
      noExpense: 'No hay gastos para mostrar en este período.',
      noResult: 'No hay datos de resultado disponibles para este mes.',
      global: 'Global',
      byApartment: 'Apartamento por apartamento',
      rows: 'Filas',
      labelCol: 'Etiqueta',
      categoryCol: 'Categoría',
      amountCol: 'Importe',
      dayOfMonthCol: 'Día del mes',
      statusCol: 'Estado',
      attachmentCol: 'Adjunto',
      actionCol: 'Acción',
      effectiveFromCol: 'Inicio (1er mes)',
      dueDateCol: 'Vencimiento',
      amountEurCol: 'Importe (EUR)',
      attach: 'Adjuntar',
      open: 'Abrir',
      removeAttachment: 'Quitar adjunto',
      pieHoverHint: 'Pasa el cursor sobre un segmento para ver el porcentaje.',
      monthlyRevenueHint:
        'Los ingresos mostrados aquí son ingresos netos cobrados (reserva + limpieza + extras, comisiones de plataforma ya deducidas).',
      apartmentCol: 'Apartamento',
      netRevenueCol: 'Ingreso neto cobrado (EUR)',
      chargesCol: 'Gastos (EUR)',
      globalResult: 'Resultado global',
      legendNote:
        'Nota: las comisiones de plataforma no se muestran como gasto separado aquí porque ya están incluidas en el ingreso neto cobrado.',
      chargesWithoutRevenueLabel: 'Sin reservas (gastos del mes)',
      pieDeficitTitle: 'Salidas sin ingresos por reservas (vista deficit)',
      pieDeficitHint:
        'No hay ingreso neto por reservas para este mes en el channel manager: el grafico muestra solo los gastos como salida.',
      pieDeficitChargesSlice: 'Total gastos del mes',
      channelLabelMenage: 'Tasas de limpieza (reservas — sync canal)',
      channelLabelAutres: 'Otros cargos al huésped (sync canal)',
      channelLabelPlatform: 'Comisión plataforma / OTA (sync canal)',
      channelLabelTaxes: 'Impuestos / IVA (sync canal)',
      channelCategory: 'Canal (sync)',
      selectApartmentToAdd:
        'Para añadir gastos (fijos o variables), cambia a «Apartamento por apartamento» y elige un alojamiento. La vista global resume todo sin añadir líneas.',
    },
    de: {
      subtitle: 'Einfache Kostenübersicht mit zeilenweiser Bearbeitung.',
      connectPrompt: 'Verbinden Sie zuerst Ihre Unterkünfte, um das Kostenboard zu nutzen.',
      connectMyListings: 'Meine Unterkünfte verbinden',
      addVariableCharge: 'Variable Ausgabe hinzufügen',
      saveAll: 'Alles speichern',
      remove: 'Löschen',
      addFixedExpense: 'Fixe Ausgabe hinzufügen',
      monthlyResult: 'Monatsergebnis nach Abzug der Kosten',
      netResult: 'Nettoergebnis (EUR)',
      allApartments: 'Alle Apartments',
      totalExpenses: 'Gesamtkosten',
      dueNow: 'Fällig',
      fixedChargesTitle: 'Monatliche Fixkosten',
      fixedChargesHint:
        'Betrag, der sich jeden Monat wiederholt (Darlehen, Abo…). Neue Regeln gelten ab dem nächsten Kalendermonat ab heute, dann monatlich am gleichen Tag.',
      variableBlockTitle: 'Variable Kosten (angezeigter Monat)',
      variableBlockHint:
        'Einmalige Kosten für den gewählten Monat (Rechnung, Einkauf…). Sie werden nicht übernommen: für wiederkehrende Kosten nutzen Sie die Fixkosten oben.',
      statusToPay: 'Zu zahlen',
      statusPaid: 'Bezahlt',
      statusAuto: 'Automatische Abbuchung',
      pieTitle: 'Kostenaufteilung (Kreisdiagramm)',
      noExpense: 'Für diesen Zeitraum sind keine Kosten vorhanden.',
      noResult: 'Für diesen Monat sind keine Ergebnisdaten verfügbar.',
      global: 'Global',
      byApartment: 'Wohnung für Wohnung',
      rows: 'Zeilen',
      labelCol: 'Bezeichnung',
      categoryCol: 'Kategorie',
      amountCol: 'Betrag',
      dayOfMonthCol: 'Tag des Monats',
      statusCol: 'Status',
      attachmentCol: 'Anhang',
      actionCol: 'Aktion',
      effectiveFromCol: 'Start (erster Monat)',
      dueDateCol: 'Fälligkeitsdatum',
      amountEurCol: 'Betrag (EUR)',
      attach: 'Anhängen',
      open: 'Öffnen',
      removeAttachment: 'Anhang entfernen',
      pieHoverHint: 'Bewegen Sie den Mauszeiger über ein Segment, um den Prozentsatz zu sehen.',
      monthlyRevenueHint:
        'Hier wird der netto vereinnahmte Umsatz angezeigt (Buchung + Reinigungsgebühren + Zusatzgebühren, Plattformprovisionen bereits abgezogen).',
      apartmentCol: 'Wohnung',
      netRevenueCol: 'Netto vereinnahmter Umsatz (EUR)',
      chargesCol: 'Kosten (EUR)',
      globalResult: 'Gesamtergebnis',
      legendNote:
        'Hinweis: Plattformprovisionen werden hier nicht als separate Kosten gezeigt, da sie bereits im netto vereinnahmten Umsatz enthalten sind.',
      chargesWithoutRevenueLabel: 'Ohne Buchungen (Kosten des Monats)',
      pieDeficitTitle: 'Ausgaben ohne Buchungsumsatz (Defizitansicht)',
      pieDeficitHint:
        'Für diesen Monat gibt es keinen netto vereinnahmten Buchungsumsatz im Channel-Manager: das Diagramm zeigt nur Ihre Kosten als Abfluss.',
      pieDeficitChargesSlice: 'Gesamtkosten des Monats',
      channelLabelMenage: 'Reinigungsgebühren (Buchungen — Channel-Sync)',
      channelLabelAutres: 'Sonstige Gastgebühren (Channel-Sync)',
      channelLabelPlatform: 'Plattform-/OTA-Provision (Channel-Sync)',
      channelLabelTaxes: 'Steuern / MwSt. (Channel-Sync)',
      channelCategory: 'Channel (Sync)',
      selectApartmentToAdd:
        'Um Ausgaben (fix oder variabel) hinzuzufügen, wechseln Sie zu „Wohnung für Wohnung“ und wählen Sie eine Unterkunft. Die Gesamtansicht fasst alles zusammen, ohne neue Zeilen.',
    },
    it: {
      subtitle: 'Vista semplice dei costi con modifica riga per riga.',
      connectPrompt: 'Collega prima i tuoi alloggi per accedere al pannello costi.',
      connectMyListings: 'Collega i miei alloggi',
      addVariableCharge: 'Aggiungi costo variabile',
      saveAll: 'Salva tutto',
      remove: 'Elimina',
      addFixedExpense: 'Aggiungi costo fisso',
      monthlyResult: 'Risultato mensile dopo la deduzione dei costi',
      netResult: 'Risultato netto (EUR)',
      allApartments: 'Tutti gli appartamenti',
      totalExpenses: 'Totale spese',
      dueNow: 'Da pagare',
      fixedChargesTitle: 'Spese fisse mensili',
      fixedChargesHint:
        'Importi che si ripetono ogni mese (mutuo, abbonamento…). Una nuova regola vale dal mese solare successivo a oggi, poi ogni mese nello stesso giorno.',
      variableBlockTitle: 'Spese variabili (mese selezionato)',
      variableBlockHint:
        'Aggiungi costi una tantum per il mese scelto (fattura, acquisto…). Non si propagano: per costi ricorrenti usa le spese fisse sopra.',
      statusToPay: 'Da pagare',
      statusPaid: 'Pagato',
      statusAuto: 'Addebito automatico',
      pieTitle: 'Ripartizione delle spese (grafico a torta)',
      noExpense: 'Nessuna spesa da mostrare per questo periodo.',
      noResult: 'Nessun dato risultato disponibile per questo mese.',
      global: 'Globale',
      byApartment: 'Appartamento per appartamento',
      rows: 'Righe',
      labelCol: 'Etichetta',
      categoryCol: 'Categoria',
      amountCol: 'Importo',
      dayOfMonthCol: 'Giorno del mese',
      statusCol: 'Stato',
      attachmentCol: 'Allegato',
      actionCol: 'Azione',
      effectiveFromCol: 'Inizio (1° mese)',
      dueDateCol: 'Scadenza',
      amountEurCol: 'Importo (EUR)',
      attach: 'Allega',
      open: 'Apri',
      removeAttachment: 'Rimuovi allegato',
      pieHoverHint: 'Passa il mouse su un segmento per vedere la percentuale.',
      monthlyRevenueHint:
        'Il ricavo mostrato qui è il ricavo netto incassato (prenotazione + pulizie + extra, commissioni piattaforma già detratte).',
      apartmentCol: 'Appartamento',
      netRevenueCol: 'Ricavo netto incassato (EUR)',
      chargesCol: 'Spese (EUR)',
      globalResult: 'Risultato globale',
      legendNote:
        'Nota: le commissioni delle piattaforme non sono mostrate come costo separato qui perché sono già incluse nel ricavo netto incassato.',
      chargesWithoutRevenueLabel: 'Senza prenotazioni (spese del mese)',
      pieDeficitTitle: 'Uscite senza ricavi da prenotazioni (vista deficit)',
      pieDeficitHint:
        'Nessun ricavo netto da prenotazioni per questo mese nel channel manager: il grafico mostra solo le spese come uscita.',
      pieDeficitChargesSlice: 'Totale spese del mese',
      channelLabelMenage: 'Spese pulizie (prenotazioni — sync channel)',
      channelLabelAutres: 'Altri oneri ospite (sync channel)',
      channelLabelPlatform: 'Commissione piattaforma / OTA (sync channel)',
      channelLabelTaxes: 'Tasse / IVA (sync channel)',
      channelCategory: 'Channel (sync)',
      selectApartmentToAdd:
        'Per aggiungere costi (fissi o variabili), passa a «Appartamento per appartamento» e scegli un alloggio. La vista globale riassume tutto senza inserire righe.',
    },
  }[ll]
  const monthLabels = MONTHS[ll]
  const now = new Date()
  const guestDemoActive = isGuestDemoSession() || isGuestDemoRoutingActive()
  const effectiveToday = guestDemoActive ? new Date(DEMO_BASE_YEAR, now.getMonth(), now.getDate()) : now
  const [connectedApartments] = useState<string[]>(() => getConnectedApartmentOptions())
  const hasConnectedApartments = connectedApartments.length > 0
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(guestDemoActive ? DEMO_BASE_YEAR : now.getFullYear())
  const [scopeMode, setScopeMode] = useState<ScopeMode>('global')
  const [selectedApartment, setSelectedApartment] = useState<string>(() => connectedApartments[0] ?? '')

  const [rows, setRows] = useState<ExpenseRow[]>(() => {
    try {
      const raw = readScopedStorage(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Array<Partial<ExpenseRow>>
      return parsed
        .map((row) => ({
          id: String(row.id ?? Date.now()),
          apartment: row.apartment ?? c.allApartments,
          label: row.label ?? '',
          category: row.category ?? '',
          amount: Number(row.amount ?? 0),
          dueDate: row.dueDate ?? '',
          status: (row.status as ExpenseStatus) ?? 'A payer',
          attachmentName: row.attachmentName ?? '',
          attachmentDataUrl: row.attachmentDataUrl ?? '',
        }))
        .filter((row) => !isRemovedSampleLabel(row.label))
    } catch {
      return []
    }
  })

  const [fixedCharges, setFixedCharges] = useState<FixedCharge[]>(() => {
    try {
      const raw = readScopedStorage(STORAGE_FIXED_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Partial<FixedCharge>>
        const currentYear = new Date().getFullYear()
        return parsed.map((charge) => ({
          id: String(charge.id ?? Date.now()),
          apartment: charge.apartment ?? c.allApartments,
          label: charge.label ?? '',
          category: charge.category ?? 'Financement',
          amount: Number(charge.amount ?? 0),
          dayOfMonth: Number(charge.dayOfMonth ?? 1),
          status: (charge.status as ExpenseStatus) ?? 'A payer',
          startYear: Number(charge.startYear ?? currentYear),
          startMonth: Number(charge.startMonth ?? 1),
          endYear: charge.endYear,
          endMonth: charge.endMonth,
          attachmentName: charge.attachmentName ?? '',
          attachmentDataUrl: charge.attachmentDataUrl ?? '',
        }))
      }
      return buildDefaultFixedCharges(connectedApartments, guestDemoActive ? DEMO_BASE_YEAR : now.getFullYear())
    } catch {
      return buildDefaultFixedCharges(connectedApartments, guestDemoActive ? DEMO_BASE_YEAR : now.getFullYear())
    }
  })

  const [channelDataTick, setChannelDataTick] = useState(0)
  useEffect(() => {
    const bump = () => setChannelDataTick((n) => n + 1)
    window.addEventListener('storage', bump)
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, bump)
    return () => {
      window.removeEventListener('storage', bump)
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, bump)
    }
  }, [])

  useEffect(() => {
    setRows((prev) => prev.filter((row) => !isRemovedSampleLabel(row.label)))
  }, [])

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!row.dueDate) return false
        const date = new Date(`${row.dueDate}T00:00:00`)
        if (Number.isNaN(date.getTime())) return false
        const inMonth = date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth
        if (!inMonth) return false
        if (scopeMode === 'global') return true
        return row.apartment === selectedApartment || row.apartment === c.allApartments
      }),
    [rows, selectedMonth, selectedYear, scopeMode, selectedApartment],
  )

  const autoVariableRows = useMemo<ExpenseRow[]>(() => {
    // In future months, variable expenses are unknown and therefore hidden.
    const currentYear = effectiveToday.getFullYear()
    const currentMonth = effectiveToday.getMonth() + 1
    const selectedYm = selectedYear * 100 + selectedMonth
    const currentYm = currentYear * 100 + currentMonth
    if (selectedYm > currentYm) return []

    const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth
    const isLastDayOfCurrentMonth =
      isCurrentMonth && effectiveToday.getDate() === new Date(currentYear, currentMonth, 0).getDate()

    const apartments =
      scopeMode === 'by_apartment'
        ? selectedApartment
          ? [selectedApartment]
          : []
        : connectedApartments

    if (apartments.length === 0) return []

    const templates: Array<{ label: string; category: string; amountBase: number; dueDay: number }> = [
      { label: 'Electricite / Eau', category: 'Utilities', amountBase: 78, dueDay: 5 },
      { label: 'Internet / Telecom', category: 'Services', amountBase: 36, dueDay: 11 },
      { label: 'Produits entretien', category: 'Entretien', amountBase: 24, dueDay: 20 },
    ]

    return apartments.flatMap((apartment, aptIdx) =>
      templates.map((tpl, tplIdx) => {
        const amount = tpl.amountBase + aptIdx * 3 + (selectedMonth % 3)
        const dueDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(Math.min(tpl.dueDay, new Date(selectedYear, selectedMonth, 0).getDate())).padStart(2, '0')}`
        const shouldRemainUnpaid =
          isCurrentMonth && !isLastDayOfCurrentMonth && (tplIdx + aptIdx) % 2 === 0 && tpl.dueDay >= effectiveToday.getDate()
        const status: ExpenseStatus = shouldRemainUnpaid ? 'A payer' : 'Paye'
        return {
          id: `av-${selectedYear}-${selectedMonth}-${aptIdx}-${tplIdx}`,
          apartment,
          label: tpl.label,
          category: tpl.category,
          amount,
          dueDate,
          status,
        }
      }),
    )
  }, [effectiveToday, selectedYear, selectedMonth, scopeMode, selectedApartment, connectedApartments])

  const fixedRowsForSelectedMonth = useMemo<ExpenseRow[]>(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const selectedYm = selectedYear * 100 + selectedMonth
    return fixedCharges
      .map((charge) => {
        const startYm = charge.startYear * 100 + charge.startMonth
        const endYm = charge.endYear != null && charge.endMonth != null ? charge.endYear * 100 + charge.endMonth : null
        const activeForMonth = selectedYm >= startYm && (endYm == null || selectedYm <= endYm)
        if (!activeForMonth) return null
        const day = Math.min(Math.max(1, charge.dayOfMonth), daysInMonth)
        const dueDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return {
          id: `fixed-${charge.id}-${selectedYear}-${selectedMonth}`,
          apartment: charge.apartment,
          label: `${charge.label} (fixe mensuel)`,
          category: charge.category,
          amount: charge.amount,
          dueDate,
          status: charge.status,
          attachmentName: charge.attachmentName ?? '',
          attachmentDataUrl: charge.attachmentDataUrl ?? '',
        }
      })
      .filter((row): row is ExpenseRow => row != null)
      .filter((row) => (scopeMode === 'global' ? true : row.apartment === selectedApartment || row.apartment === c.allApartments))
  }, [fixedCharges, selectedMonth, selectedYear, scopeMode, selectedApartment])

  /** Toutes les règles à éditer (pas filtrées par le mois affiché), sinon une règle qui démarre le mois prochain disparaît du tableau. */
  const visibleFixedCharges = useMemo(() => {
    return fixedCharges.filter((charge) => {
      if (scopeMode === 'global') return true
      return charge.apartment === selectedApartment || charge.apartment === c.allApartments
    })
  }, [fixedCharges, scopeMode, selectedApartment, c.allApartments])

  const channelRevenueRows = useMemo(() => {
    if (guestDemoActive) {
      const apartmentNames =
        connectedApartments.length > 0
          ? connectedApartments
          : Array.from({ length: 5 }, (_, idx) => `Appartement ${idx + 1}`)
      const demoRows: Array<{
        apartment: string
        year: number
        month: number
        reservationAmount: number
        cleaningFees: number
        extraFees: number
        platformCommission: number
      }> = []
      for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
        const month = monthIndex + 1
        const daysInMonth = new Date(DEMO_BASE_YEAR, month, 0).getDate()
        const byApartment = new Map<string, { reservationAmount: number; cleaningFees: number; extraFees: number; platformCommission: number }>()
        buildGuestDemoMonthBookings(daysInMonth, monthIndex)
          .filter((b) => b.status === 'reserved')
          .forEach((b) => {
            const apartment = apartmentNames[b.apt] ?? `Appartement ${b.apt + 1}`
            const current =
              byApartment.get(apartment) || { reservationAmount: 0, cleaningFees: 0, extraFees: 0, platformCommission: 0 }
            current.reservationAmount += b.totalGuestEur
            current.cleaningFees += b.cleaningEur
            current.extraFees += 0
            current.platformCommission += b.platformFeeEur
            byApartment.set(apartment, current)
          })
        byApartment.forEach((totals, apartment) => {
          demoRows.push({
            apartment,
            year: DEMO_BASE_YEAR,
            month,
            reservationAmount: Math.round(totals.reservationAmount * 100) / 100,
            cleaningFees: Math.round(totals.cleaningFees * 100) / 100,
            extraFees: Math.round(totals.extraFees * 100) / 100,
            platformCommission: Math.round(totals.platformCommission * 100) / 100,
          })
        })
      }
      return demoRows
    }
    const data = readOfficialChannelSyncData()
    if (!data?.bookings?.length) return []
    return buildChannelRevenueRowsFromSync(data)
  }, [channelDataTick, guestDemoActive, connectedApartments])

  const channelExpenseRows = useMemo((): ExpenseRow[] => {
    if (guestDemoActive) {
      const apartmentNames =
        connectedApartments.length > 0
          ? connectedApartments
          : Array.from({ length: 5 }, (_, idx) => `Appartement ${idx + 1}`)
      const dueDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(new Date(selectedYear, selectedMonth, 0).getDate()).padStart(2, '0')}`
      const byApartment = new Map<string, { menage: number; plateforme: number }>()
      const daysInMonth = new Date(DEMO_BASE_YEAR, selectedMonth, 0).getDate()
      buildGuestDemoMonthBookings(daysInMonth, selectedMonth - 1)
        .filter((b) => b.status === 'reserved')
        .forEach((b) => {
          const apartment = apartmentNames[b.apt] ?? `Appartement ${b.apt + 1}`
          const current = byApartment.get(apartment) || { menage: 0, plateforme: 0 }
          current.menage += b.cleaningEur
          current.plateforme += b.platformFeeEur
          byApartment.set(apartment, current)
        })
      const out: ExpenseRow[] = []
      byApartment.forEach((agg, apartment) => {
        if (agg.menage > 0) {
          out.push({
            id: `ch-demo-${apartment}-${selectedYear}-${selectedMonth}-menage`,
            apartment,
            label: c.channelLabelMenage,
            category: c.channelCategory,
            amount: Math.round(agg.menage * 100) / 100,
            dueDate,
            status: 'Paye',
          })
        }
        if (agg.plateforme > 0) {
          out.push({
            id: `ch-demo-${apartment}-${selectedYear}-${selectedMonth}-plateforme`,
            apartment,
            label: c.channelLabelPlatform,
            category: c.channelCategory,
            amount: Math.round(agg.plateforme * 100) / 100,
            dueDate,
            status: 'Paye',
          })
        }
      })
      return out
    }
    const data = readOfficialChannelSyncData()
    if (!data?.bookings?.length) return []
    const built = buildChannelExpenseRowsForMonth(data, selectedYear, selectedMonth, {
      labelMenage: c.channelLabelMenage,
      labelAutres: c.channelLabelAutres,
      labelPlateforme: c.channelLabelPlatform,
      labelTaxes: c.channelLabelTaxes,
      categoryChannel: c.channelCategory,
    })
    return built.map((r) => ({ ...r, status: r.status as ExpenseStatus }))
  }, [channelDataTick, selectedYear, selectedMonth, c.channelCategory, c.channelLabelAutres, c.channelLabelMenage, c.channelLabelPlatform, c.channelLabelTaxes, guestDemoActive, connectedApartments])

  const displayedRows = useMemo(
    () => [...channelExpenseRows, ...autoVariableRows, ...filteredRows, ...fixedRowsForSelectedMonth],
    [channelExpenseRows, autoVariableRows, filteredRows, fixedRowsForSelectedMonth],
  )

  // KPI : même périmètre que le mois affiché (variables + fixes du mois + channel), aligné sur le tableau et le camembert.
  const statsRows = useMemo(
    () => [
      ...channelExpenseRows,
      ...autoVariableRows,
      ...filteredRows,
      ...fixedRowsForSelectedMonth.map((row) => ({
        amount: Number.isFinite(row.amount) ? row.amount : 0,
        status: row.status,
      })),
    ],
    [channelExpenseRows, autoVariableRows, filteredRows, fixedRowsForSelectedMonth],
  )

  const canAddCharges = scopeMode === 'by_apartment' && Boolean(selectedApartment)

  const yearOptions = useMemo(() => {
    const fromRows = rows
      .map((row) => (row.dueDate ? new Date(`${row.dueDate}T00:00:00`).getFullYear() : null))
      .filter((year): year is number => typeof year === 'number' && !Number.isNaN(year))
    const fromChannel = channelRevenueRows.map((r) => r.year)
    const fromFixed = fixedCharges.flatMap((fc) => [fc.startYear, fc.endYear].filter((y): y is number => typeof y === 'number'))
    const set = new Set<number>([now.getFullYear(), now.getFullYear() + 1, ...fromRows, ...fromChannel, ...fromFixed])
    return Array.from(set).sort((a, b) => a - b)
  }, [rows, now, channelRevenueRows, fixedCharges])

  const total = useMemo(() => statsRows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0), [statsRows])
  const unpaid = useMemo(
    () => statsRows.filter((r) => r.status === 'A payer').reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [statsRows],
  )
  const pieData = useMemo(() => {
    const byCategory = displayedRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.category?.trim() || 'Autres'
      acc[key] = (acc[key] ?? 0) + (Number.isFinite(row.amount) ? row.amount : 0)
      return acc
    }, {})
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [displayedRows])

  const pieTotal = useMemo(
    () => pieData.reduce((sum, slice) => sum + (Number.isFinite(slice.value) ? slice.value : 0), 0),
    [pieData],
  )

  const netRevenueByApartment = useMemo(() => {
    const relevant = channelRevenueRows.filter((row) => {
      const monthMatch = row.year === selectedYear && row.month === selectedMonth
      if (!monthMatch) return false
      if (scopeMode === 'global') return true
      return row.apartment === selectedApartment
    })
    return relevant.reduce<Record<string, number>>((acc, row) => {
      const netReceived = row.reservationAmount + row.cleaningFees + row.extraFees - row.platformCommission
      acc[row.apartment] = (acc[row.apartment] ?? 0) + netReceived
      return acc
    }, {})
  }, [channelRevenueRows, selectedYear, selectedMonth, scopeMode, selectedApartment])

  const chargesByApartment = useMemo(() => {
    return displayedRows.reduce<Record<string, number>>((acc, row) => {
      if (row.apartment === c.allApartments) return acc
      acc[row.apartment] = (acc[row.apartment] ?? 0) + (Number.isFinite(row.amount) ? row.amount : 0)
      return acc
    }, {})
  }, [displayedRows])

  const sharedCharges = useMemo(
    () => displayedRows.filter((row) => row.apartment === c.allApartments).reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [displayedRows],
  )

  const monthlyResultRows = useMemo(() => {
    const shareAmong = (count: number) => (count > 0 ? sharedCharges / count : 0)

    if (scopeMode === 'by_apartment') {
      const apt = selectedApartment
      if (!apt) return []
      const netRevenue = netRevenueByApartment[apt] ?? 0
      const denom = Math.max(1, connectedApartments.length)
      const share = shareAmong(denom)
      const apartmentCharges = (chargesByApartment[apt] ?? 0) + share
      return [{ apartment: apt, netRevenue, charges: apartmentCharges, result: netRevenue - apartmentCharges }]
    }

    // Vue globale : une ligne par logement connecté (union CA / charges du mois)
    const keys = new Set<string>(connectedApartments)
    Object.keys(netRevenueByApartment).forEach((k) => keys.add(k))
    Object.keys(chargesByApartment).forEach((k) => keys.add(k))
    const apartments = Array.from(keys)
      .filter((a) => a && a !== c.allApartments)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

    if (apartments.length === 0) {
      const chargeKeys = Object.keys(chargesByApartment).filter((k) => (chargesByApartment[k] ?? 0) > 0)
      if (chargeKeys.length === 0 && sharedCharges <= 0) return []
      if (chargeKeys.length === 0) {
        return [
          {
            apartment: c.chargesWithoutRevenueLabel,
            netRevenue: 0,
            charges: sharedCharges,
            result: -sharedCharges,
          },
        ]
      }
      const sh = shareAmong(chargeKeys.length)
      return chargeKeys.map((apartment) => {
        const apartmentCharges = (chargesByApartment[apartment] ?? 0) + sh
        return { apartment, netRevenue: 0, charges: apartmentCharges, result: -apartmentCharges }
      })
    }

    const share = shareAmong(apartments.length)
    return apartments.map((apartment) => {
      const netRevenue = netRevenueByApartment[apartment] ?? 0
      const apartmentCharges = (chargesByApartment[apartment] ?? 0) + share
      return { apartment, netRevenue, charges: apartmentCharges, result: netRevenue - apartmentCharges }
    })
  }, [
    scopeMode,
    selectedApartment,
    connectedApartments,
    netRevenueByApartment,
    chargesByApartment,
    sharedCharges,
    c.allApartments,
    c.chargesWithoutRevenueLabel,
  ])

  const monthlyResultTotal = useMemo(
    () =>
      monthlyResultRows.reduce(
        (acc, row) => ({
          netRevenue: acc.netRevenue + row.netRevenue,
          charges: acc.charges + row.charges,
          result: acc.result + row.result,
        }),
        { netRevenue: 0, charges: 0, result: 0 },
      ),
    [monthlyResultRows],
  )

  const showDeficitPie =
    Object.keys(netRevenueByApartment).length === 0 &&
    monthlyResultRows.length > 0 &&
    monthlyResultTotal.charges > 0

  const updateRow = (id: string, patch: Partial<ExpenseRow>) => {
    if (id.startsWith('ch-') || id.startsWith('av-')) return
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }
  const removeRow = (id: string) => {
    if (id.startsWith('ch-') || id.startsWith('av-')) return
    setRows((prev) => prev.filter((row) => row.id !== id))
  }
  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('file_read_error'))
      reader.readAsDataURL(file)
    })

  const onExpenseAttachmentChange = async (id: string, file?: File) => {
    if (id.startsWith('ch-') || id.startsWith('av-')) return
    if (!file) {
      updateRow(id, { attachmentName: '', attachmentDataUrl: '' })
      return
    }
    try {
      const dataUrl = await toDataUrl(file)
      updateRow(id, { attachmentName: file.name, attachmentDataUrl: dataUrl })
    } catch {
      updateRow(id, { attachmentName: file.name, attachmentDataUrl: '' })
    }
  }

  const addRow = () => {
    if (!canAddCharges) return
    const defaultDueDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    setRows((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        apartment: selectedApartment,
        label: '',
        category: 'Variable',
        amount: 0,
        dueDate: defaultDueDate,
        status: 'A payer',
      },
    ])
  }

  const updateFixedCharge = (id: string, patch: Partial<FixedCharge>) =>
    setFixedCharges((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  const onFixedAttachmentChange = async (id: string, file?: File) => {
    if (!file) {
      updateFixedCharge(id, { attachmentName: '', attachmentDataUrl: '' })
      return
    }
    try {
      const dataUrl = await toDataUrl(file)
      updateFixedCharge(id, { attachmentName: file.name, attachmentDataUrl: dataUrl })
    } catch {
      updateFixedCharge(id, { attachmentName: file.name, attachmentDataUrl: '' })
    }
  }

  const addFixedCharge = () => {
    if (!canAddCharges) return
    const { year: startYear, month: startMonth } = getNextCalendarMonth(new Date())
    setFixedCharges((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        apartment: selectedApartment,
        label: '',
        category: 'Financement',
        amount: 0,
        dayOfMonth: 5,
        status: 'A payer',
        startYear,
        startMonth,
      },
    ])
  }

  const removeFixedCharge = (id: string) => {
    const selectedYm = selectedYear * 100 + selectedMonth
    setFixedCharges((prev) =>
      prev.flatMap((row) => {
        if (row.id !== id) return row
        const startYm = row.startYear * 100 + row.startMonth
        // If stopped before or at its start month, remove the rule entirely.
        if (selectedYm <= startYm) {
          return []
        }
        // Stop only from the selected month onward: keep previous months.
        const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
        const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
        return { ...row, endYear: prevYear, endMonth: prevMonth }
      }),
    )
  }
  const saveAll = () => {
    writeScopedStorage(STORAGE_KEY, JSON.stringify(rows))
    writeScopedStorage(STORAGE_FIXED_KEY, JSON.stringify(fixedCharges))
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a href="/dashboard" className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900">
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-6xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabExpenses}</h1>
          <p className="mt-2 text-sm text-zinc-600">{c.subtitle}</p>
        </div>

        {!hasConnectedApartments ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5">
            <p className="text-sm font-semibold text-zinc-900">
              {c.connectPrompt}
            </p>
            <a
              href="/dashboard/connecter-logements"
              className="mt-3 inline-flex rounded-lg bg-[#4a86f7] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              {c.connectMyListings}
            </a>
          </div>
        ) : (
          <>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
            <button type="button" onClick={() => setScopeMode('global')} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${scopeMode === 'global' ? 'bg-[#4a86f7] text-white' : 'text-zinc-600'}`}>
              {c.global}
            </button>
            <button type="button" onClick={() => setScopeMode('by_apartment')} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${scopeMode === 'by_apartment' ? 'bg-[#4a86f7] text-white' : 'text-zinc-600'}`}>
              {c.byApartment}
            </button>
          </div>
          {scopeMode === 'by_apartment' ? (
            <select value={selectedApartment} onChange={(e) => setSelectedApartment(e.target.value)} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-[#4a86f7]">
              {connectedApartments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : null}
          {scopeMode === 'global' ? (
            <p className="max-w-xl text-xs text-zinc-600">{c.selectApartmentToAdd}</p>
          ) : null}
          <button
            type="button"
            onClick={addRow}
            disabled={!canAddCharges}
            title={!canAddCharges ? c.selectApartmentToAdd : undefined}
            className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {c.addVariableCharge}
          </button>
          <button type="button" onClick={saveAll} className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
            {c.saveAll}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-[#4a86f7]">
              {monthLabels.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-[#4a86f7]">
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{c.totalExpenses}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{total.toFixed(2)} EUR</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{c.dueNow}</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{unpaid.toFixed(2)} EUR</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{c.rows}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{statsRows.length}</p>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{c.fixedChargesTitle}</p>
          <p className="mt-1 text-xs text-zinc-600">{c.fixedChargesHint}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-zinc-50">
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-semibold">{c.labelCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.categoryCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.amountCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.dayOfMonthCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.effectiveFromCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.statusCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.attachmentCol}</th>
                  <th className="px-3 py-2 font-semibold">{c.actionCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
                {visibleFixedCharges.map((charge) => (
                  <tr key={charge.id}>
                    <td className="px-3 py-2">
                      <input value={charge.label} onChange={(e) => updateFixedCharge(charge.id, { label: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 outline-none focus:border-[#4a86f7]" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={charge.category} onChange={(e) => updateFixedCharge(charge.id, { category: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 outline-none focus:border-[#4a86f7]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={charge.amount} onChange={(e) => updateFixedCharge(charge.id, { amount: Number(e.target.value) })} className="w-32 rounded-lg border border-zinc-200 px-2 py-1.5 outline-none focus:border-[#4a86f7]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={1} max={31} value={charge.dayOfMonth} onChange={(e) => updateFixedCharge(charge.id, { dayOfMonth: Number(e.target.value) })} className="w-28 rounded-lg border border-zinc-200 px-2 py-1.5 outline-none focus:border-[#4a86f7]" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          value={charge.startMonth}
                          onChange={(e) => updateFixedCharge(charge.id, { startMonth: Number(e.target.value) })}
                          className="max-w-[8.5rem] rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-[#4a86f7]"
                        >
                          {monthLabels.map((label, idx) => (
                            <option key={label} value={idx + 1}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={charge.startYear}
                          onChange={(e) => updateFixedCharge(charge.id, { startYear: Number(e.target.value) })}
                          className="w-[4.5rem] rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-[#4a86f7]"
                        >
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={charge.status}
                        onChange={(e) => updateFixedCharge(charge.id, { status: e.target.value as ExpenseStatus })}
                        className={`rounded-lg border px-2 py-1.5 outline-none focus:border-[#4a86f7] ${getStatusSelectClass(charge.status)}`}
                      >
                        <option value="A payer">{c.statusToPay}</option>
                        <option value="Paye">{c.statusPaid}</option>
                        <option value="Prelevement automatique">{c.statusAuto}</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                        {c.attach}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            void onFixedAttachmentChange(charge.id, e.target.files?.[0])
                          }}
                        />
                      </label>
                      {charge.attachmentName ? (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="max-w-[12rem] truncate text-[11px] text-zinc-500">{charge.attachmentName}</p>
                          {charge.attachmentDataUrl ? (
                            <a
                              href={charge.attachmentDataUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              {c.open}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => updateFixedCharge(charge.id, { attachmentName: '', attachmentDataUrl: '' })}
                            className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50"
                          >
                            {c.removeAttachment}
                          </button>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeFixedCharge(charge.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                        {c.remove}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addFixedCharge}
            disabled={!canAddCharges}
            title={!canAddCharges ? c.selectApartmentToAdd : undefined}
            className="mt-3 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {c.addFixedExpense}
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{c.variableBlockTitle}</p>
          <p className="mt-1 text-xs text-zinc-600">{c.variableBlockHint}</p>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-zinc-50">
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">{c.labelCol}</th>
                  <th className="px-4 py-3 font-semibold">{c.categoryCol}</th>
                  <th className="px-4 py-3 font-semibold">{c.amountEurCol}</th>
                  <th className="px-4 py-3 font-semibold">{c.dueDateCol}</th>
                  <th className="px-4 py-3 font-semibold">{c.statusCol}</th>
                  <th className="px-4 py-3 font-semibold">{c.attachmentCol}</th>
                  <th className="px-4 py-3 font-semibold">{c.actionCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
                {displayedRows.map((row) => {
                  const readOnly = row.id.startsWith('fixed-') || row.id.startsWith('ch-') || row.id.startsWith('av-')
                  return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <input value={row.label} onChange={(e) => updateRow(row.id, { label: e.target.value })} disabled={readOnly} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.category} onChange={(e) => updateRow(row.id, { category: e.target.value })} disabled={readOnly} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={row.amount} onChange={(e) => updateRow(row.id, { amount: Number(e.target.value) })} disabled={readOnly} className="w-36 rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="date" value={row.dueDate} onChange={(e) => updateRow(row.id, { dueDate: e.target.value })} disabled={readOnly} className="rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        onChange={(e) => updateRow(row.id, { status: e.target.value as ExpenseStatus })}
                        disabled={readOnly}
                        className={`rounded-lg border px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500 ${getStatusSelectClass(row.status)}`}
                      >
                        <option value="A payer">{c.statusToPay}</option>
                        <option value="Paye">{c.statusPaid}</option>
                        <option value="Prelevement automatique">{c.statusAuto}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 ${readOnly ? 'pointer-events-none opacity-50' : ''}`}>
                        {c.attach}
                        <input
                          type="file"
                          className="hidden"
                          disabled={readOnly}
                          onChange={(e) => {
                            void onExpenseAttachmentChange(row.id, e.target.files?.[0])
                          }}
                        />
                      </label>
                      {row.attachmentName ? (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="max-w-[12rem] truncate text-[11px] text-zinc-500">{row.attachmentName}</p>
                          {row.attachmentDataUrl ? (
                            <a
                              href={row.attachmentDataUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              {c.open}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => updateRow(row.id, { attachmentName: '', attachmentDataUrl: '' })}
                            disabled={readOnly}
                            className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {c.removeAttachment}
                          </button>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeRow(row.id)} disabled={readOnly} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">
                        {c.remove}
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-semibold text-zinc-900">{c.pieTitle}</p>
          <p className="mt-1 text-xs text-zinc-600">{c.pieHoverHint}</p>
          {pieData.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">{c.noExpense}</p>
          ) : (
            <div className="mt-3 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const safeTotal = pieTotal > 0 ? pieTotal : total > 0 ? total : 1
                      const percent = ((value / safeTotal) * 100).toFixed(1)
                      return [`${value.toFixed(2)} EUR (${percent}%)`, name]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-semibold text-zinc-900">{c.monthlyResult}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {c.monthlyRevenueHint}
          </p>
          {monthlyResultRows.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">{c.noResult}</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-zinc-50">
                    <tr className="text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-4 py-3 font-semibold">{c.apartmentCol}</th>
                      <th className="px-4 py-3 font-semibold">{c.netRevenueCol}</th>
                      <th className="px-4 py-3 font-semibold">{c.chargesCol}</th>
                      <th className="px-4 py-3 font-semibold">{c.netResult}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
                    {monthlyResultRows.map((row) => (
                      <tr key={row.apartment}>
                        <td className="px-4 py-3 font-medium text-zinc-900">{row.apartment}</td>
                        <td className="px-4 py-3">{row.netRevenue.toFixed(2)}</td>
                        <td className="px-4 py-3">{row.charges.toFixed(2)}</td>
                        <td className={`px-4 py-3 font-semibold ${row.result >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {row.result.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50">
                      <td className="px-4 py-3 font-semibold text-zinc-900">{c.globalResult}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900">{monthlyResultTotal.netRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900">{monthlyResultTotal.charges.toFixed(2)}</td>
                      <td className={`px-4 py-3 font-semibold ${monthlyResultTotal.result >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {monthlyResultTotal.result.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {showDeficitPie ? (
                <div className="mt-6 rounded-xl border border-rose-200/80 bg-rose-50/50 p-4">
                  <p className="text-sm font-semibold text-rose-900">{c.pieDeficitTitle}</p>
                  <p className="mt-1 text-xs text-rose-800/90">{c.pieDeficitHint}</p>
                  <div className="mt-3 h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ name: c.pieDeficitChargesSlice, value: monthlyResultTotal.charges }]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={88}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <Cell fill={DEFICIT_PIE_FILL} />
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            const v = Number.isFinite(value) ? value : 0
                            return [
                              `${v.toFixed(2)} EUR — ${c.netResult}: ${monthlyResultTotal.result.toFixed(2)} EUR`,
                              name,
                            ]
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1 text-center text-sm font-bold text-rose-700">
                    {monthlyResultTotal.result.toFixed(2)} EUR
                  </p>
                </div>
              ) : null}
            </>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            {c.legendNote}
          </p>
        </div>
          </>
        )}
      </div>
    </section>
  )
}
