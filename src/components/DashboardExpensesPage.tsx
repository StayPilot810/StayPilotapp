import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { isTestModeEnabled } from '../utils/testMode'

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

function getConnectedApartmentOptions() {
  const fromConnected = getConnectedApartmentsFromStorage().map((apt) => apt.name)
  if (fromConnected.length > 0) return fromConnected
  if (isTestModeEnabled()) return ['Logement test 1', 'Logement test 2']
  return []
}

const INITIAL_ROWS: ExpenseRow[] = [
  { id: '1', apartment: 'Logement Airbnb 1', label: 'Facture prestataire menage', category: 'Operationnel', amount: 180, dueDate: '2026-04-05', status: 'Paye' },
  { id: '2', apartment: 'Logement Booking 1', label: 'Achat capsules de cafe', category: 'Consommables', amount: 42, dueDate: '2026-04-08', status: 'Paye' },
  { id: '3', apartment: 'Logement Channel Manager 1', label: 'Reapprovisionnement papier toilette', category: 'Consommables', amount: 36, dueDate: '2026-04-10', status: 'A payer' },
  { id: '4', apartment: 'Tous les appartements', label: 'Facture electricite', category: 'Charges', amount: 145, dueDate: '2026-04-12', status: 'A payer' },
  { id: '5', apartment: 'Tous les appartements', label: 'Abonnement internet', category: 'Charges', amount: 39, dueDate: '2026-04-14', status: 'Paye' },
  { id: '7', apartment: 'Tous les appartements', label: 'Mensualite pret bancaire', category: 'Financement', amount: 980, dueDate: '2026-04-20', status: 'Prelevement automatique' },
]

const STORAGE_KEY = 'sm_expenses_rows_v1'
const STORAGE_FIXED_KEY = 'sm_fixed_charges_v1'
const MONTHS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Decembre']
const PIE_COLORS = ['#4a86f7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
function isRemovedSampleLabel(label: string) {
  return label.trim().toLowerCase().startsWith('remplacement kit serviettes')
}

function getStatusSelectClass(status: ExpenseStatus) {
  if (status === 'Paye') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'A payer') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

type RevenueRow = {
  apartment: string
  year: number
  month: number
  reservationAmount: number
  cleaningFees: number
  extraFees: number
  platformCommission: number
}

const REVENUE_MOCK: RevenueRow[] = [
  { apartment: 'Logement Airbnb 1', year: 2026, month: 4, reservationAmount: 3200, cleaningFees: 240, extraFees: 90, platformCommission: 530 },
  { apartment: 'Logement Booking 1', year: 2026, month: 4, reservationAmount: 2800, cleaningFees: 190, extraFees: 65, platformCommission: 470 },
  { apartment: 'Logement Airbnb 2', year: 2026, month: 4, reservationAmount: 1500, cleaningFees: 120, extraFees: 30, platformCommission: 255 },
  { apartment: 'Logement Channel Manager 1', year: 2026, month: 4, reservationAmount: 3600, cleaningFees: 280, extraFees: 110, platformCommission: 620 },
  { apartment: 'Logement Airbnb 1', year: 2026, month: 5, reservationAmount: 3400, cleaningFees: 260, extraFees: 75, platformCommission: 560 },
  { apartment: 'Logement Booking 1', year: 2026, month: 5, reservationAmount: 2950, cleaningFees: 210, extraFees: 80, platformCommission: 495 },
  { apartment: 'Logement Airbnb 2', year: 2026, month: 5, reservationAmount: 1700, cleaningFees: 130, extraFees: 35, platformCommission: 290 },
  { apartment: 'Logement Channel Manager 1', year: 2026, month: 5, reservationAmount: 3900, cleaningFees: 300, extraFees: 120, platformCommission: 675 },
]

export function DashboardExpensesPage() {
  const { t } = useLanguage()
  const now = new Date()
  const [connectedApartments] = useState<string[]>(() => getConnectedApartmentOptions())
  const hasConnectedApartments = connectedApartments.length > 0
  const apartmentOptions = ['Tous les appartements', ...connectedApartments]
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [scopeMode, setScopeMode] = useState<ScopeMode>('global')
  const [selectedApartment, setSelectedApartment] = useState<string>(() => connectedApartments[0] ?? '')

  const [rows, setRows] = useState<ExpenseRow[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return INITIAL_ROWS
      const parsed = JSON.parse(raw) as Array<Partial<ExpenseRow>>
      return parsed
        .map((row) => ({
          id: String(row.id ?? Date.now()),
          apartment: row.apartment ?? 'Tous les appartements',
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
      return INITIAL_ROWS
    }
  })

  const [fixedCharges, setFixedCharges] = useState<FixedCharge[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FIXED_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Partial<FixedCharge>>
        const currentYear = new Date().getFullYear()
        return parsed.map((charge) => ({
          id: String(charge.id ?? Date.now()),
          apartment: charge.apartment ?? 'Tous les appartements',
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
      return [
        {
          id: 'f1',
          apartment: 'Tous les appartements',
          label: 'Mensualite pret bancaire',
          category: 'Financement',
          amount: 980,
          dayOfMonth: 20,
          status: 'Prelevement automatique',
          startYear: now.getFullYear(),
          startMonth: 1,
        },
      ]
    } catch {
      return [
        {
          id: 'f1',
          apartment: 'Tous les appartements',
          label: 'Mensualite pret bancaire',
          category: 'Financement',
          amount: 980,
          dayOfMonth: 20,
          status: 'Prelevement automatique',
          startYear: now.getFullYear(),
          startMonth: 1,
        },
      ]
    }
  })

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
        return row.apartment === selectedApartment || row.apartment === 'Tous les appartements'
      }),
    [rows, selectedMonth, selectedYear, scopeMode, selectedApartment],
  )

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
      .filter((row) => (scopeMode === 'global' ? true : row.apartment === selectedApartment || row.apartment === 'Tous les appartements'))
  }, [fixedCharges, selectedMonth, selectedYear, scopeMode, selectedApartment])

  const visibleFixedCharges = useMemo(() => {
    const selectedYm = selectedYear * 100 + selectedMonth
    return fixedCharges.filter((charge) => {
      const startYm = charge.startYear * 100 + charge.startMonth
      const endYm = charge.endYear != null && charge.endMonth != null ? charge.endYear * 100 + charge.endMonth : null
      const activeForMonth = selectedYm >= startYm && (endYm == null || selectedYm <= endYm)
      if (!activeForMonth) return false
      return scopeMode === 'global' ? true : charge.apartment === selectedApartment || charge.apartment === 'Tous les appartements'
    })
  }, [fixedCharges, selectedMonth, selectedYear, scopeMode, selectedApartment])

  const displayedRows = useMemo(() => [...filteredRows, ...fixedRowsForSelectedMonth], [filteredRows, fixedRowsForSelectedMonth])

  const yearOptions = useMemo(() => {
    const fromRows = rows
      .map((row) => (row.dueDate ? new Date(`${row.dueDate}T00:00:00`).getFullYear() : null))
      .filter((year): year is number => typeof year === 'number' && !Number.isNaN(year))
    const set = new Set<number>([now.getFullYear(), ...fromRows])
    return Array.from(set).sort((a, b) => a - b)
  }, [rows, now])

  const total = useMemo(() => displayedRows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0), [displayedRows])
  const unpaid = useMemo(
    () => displayedRows.filter((r) => r.status === 'A payer').reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [displayedRows],
  )
  const pieData = useMemo(() => {
    const byCategory = displayedRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.category?.trim() || 'Autres'
      acc[key] = (acc[key] ?? 0) + (Number.isFinite(row.amount) ? row.amount : 0)
      return acc
    }, {})
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [displayedRows])

  const netRevenueByApartment = useMemo(() => {
    const relevant = REVENUE_MOCK.filter((row) => {
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
  }, [selectedYear, selectedMonth, scopeMode, selectedApartment])

  const chargesByApartment = useMemo(() => {
    return displayedRows.reduce<Record<string, number>>((acc, row) => {
      if (row.apartment === 'Tous les appartements') return acc
      acc[row.apartment] = (acc[row.apartment] ?? 0) + (Number.isFinite(row.amount) ? row.amount : 0)
      return acc
    }, {})
  }, [displayedRows])

  const sharedCharges = useMemo(
    () => displayedRows.filter((row) => row.apartment === 'Tous les appartements').reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [displayedRows],
  )

  const monthlyResultRows = useMemo(() => {
    const apartments = Object.keys(netRevenueByApartment)
    if (apartments.length === 0) return []
    const share = apartments.length > 0 ? sharedCharges / apartments.length : 0
    return apartments.map((apartment) => {
      const netRevenue = netRevenueByApartment[apartment] ?? 0
      const apartmentCharges = (chargesByApartment[apartment] ?? 0) + share
      const result = netRevenue - apartmentCharges
      return { apartment, netRevenue, charges: apartmentCharges, result }
    })
  }, [netRevenueByApartment, chargesByApartment, sharedCharges])

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

  const updateRow = (id: string, patch: Partial<ExpenseRow>) => setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  const removeRow = (id: string) => setRows((prev) => prev.filter((row) => row.id !== id))
  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('file_read_error'))
      reader.readAsDataURL(file)
    })

  const onExpenseAttachmentChange = async (id: string, file?: File) => {
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
    const defaultDueDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    setRows((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        apartment: scopeMode === 'global' ? 'Tous les appartements' : selectedApartment,
        label: '',
        category: 'Fixe',
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

  const addFixedCharge = () =>
    setFixedCharges((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        apartment: scopeMode === 'global' ? 'Tous les appartements' : selectedApartment,
        label: '',
        category: 'Financement',
        amount: 0,
        dayOfMonth: 5,
        status: 'A payer',
        startYear: selectedYear,
        startMonth: selectedMonth,
      },
    ])

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
    localStorage.setItem(STORAGE_FIXED_KEY, JSON.stringify(fixedCharges))
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a href="/dashboard" className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900">
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-6xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabExpenses}</h1>
          <p className="mt-2 text-sm text-zinc-600">Vue simple des charges avec edition ligne par ligne.</p>
        </div>

        {!hasConnectedApartments ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5">
            <p className="text-sm font-semibold text-zinc-900">
              Connecte d'abord tes logements pour acceder au tableau des charges.
            </p>
            <a
              href="/dashboard/connecter-logements"
              className="mt-3 inline-flex rounded-lg bg-[#4a86f7] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Connecter mes logements
            </a>
          </div>
        ) : (
          <>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
            <button type="button" onClick={() => setScopeMode('global')} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${scopeMode === 'global' ? 'bg-[#4a86f7] text-white' : 'text-zinc-600'}`}>
              Global
            </button>
            <button type="button" onClick={() => setScopeMode('by_apartment')} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${scopeMode === 'by_apartment' ? 'bg-[#4a86f7] text-white' : 'text-zinc-600'}`}>
              Appartement / appartement
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
          <button type="button" onClick={addRow} className="rounded-xl bg-[#4a86f7] px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
            Ajouter une charge
          </button>
          <button type="button" onClick={saveAll} className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
            Enregistrer tout
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-[#4a86f7]">
              {MONTHS.map((month, index) => (
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
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total charges</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{total.toFixed(2)} EUR</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">A payer</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{unpaid.toFixed(2)} EUR</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Lignes</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{displayedRows.length}</p>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Charges fixes mensuelles</p>
          <p className="mt-1 text-xs text-zinc-600">Renseigne ici tes charges fixes. Elles seront ajoutees automatiquement dans chaque mois a venir.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-zinc-50">
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 font-semibold">Libelle</th>
                  <th className="px-3 py-2 font-semibold">Categorie</th>
                  <th className="px-3 py-2 font-semibold">Montant</th>
                  <th className="px-3 py-2 font-semibold">Jour du mois</th>
                  <th className="px-3 py-2 font-semibold">Statut</th>
                  <th className="px-3 py-2 font-semibold">Piece jointe</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
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
                      <select
                        value={charge.status}
                        onChange={(e) => updateFixedCharge(charge.id, { status: e.target.value as ExpenseStatus })}
                        className={`rounded-lg border px-2 py-1.5 outline-none focus:border-[#4a86f7] ${getStatusSelectClass(charge.status)}`}
                      >
                        <option value="A payer">A payer</option>
                        <option value="Paye">Paye</option>
                        <option value="Prelevement automatique">Prelevement automatique</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                        Joindre
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
                              Ouvrir
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => updateFixedCharge(charge.id, { attachmentName: '', attachmentDataUrl: '' })}
                            className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50"
                          >
                            Suppr. PJ
                          </button>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeFixedCharge(charge.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addFixedCharge} className="mt-3 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            Ajouter une charge fixe
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-zinc-50">
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Libelle</th>
                  <th className="px-4 py-3 font-semibold">Categorie</th>
                  <th className="px-4 py-3 font-semibold">Montant (EUR)</th>
                  <th className="px-4 py-3 font-semibold">Echeance</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Piece jointe</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm text-zinc-700">
                {displayedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <input value={row.label} onChange={(e) => updateRow(row.id, { label: e.target.value })} disabled={row.id.startsWith('fixed-')} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.category} onChange={(e) => updateRow(row.id, { category: e.target.value })} disabled={row.id.startsWith('fixed-')} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={row.amount} onChange={(e) => updateRow(row.id, { amount: Number(e.target.value) })} disabled={row.id.startsWith('fixed-')} className="w-36 rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="date" value={row.dueDate} onChange={(e) => updateRow(row.id, { dueDate: e.target.value })} disabled={row.id.startsWith('fixed-')} className="rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500" />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        onChange={(e) => updateRow(row.id, { status: e.target.value as ExpenseStatus })}
                        disabled={row.id.startsWith('fixed-')}
                        className={`rounded-lg border px-2.5 py-1.5 outline-none focus:border-[#4a86f7] disabled:bg-zinc-100 disabled:text-zinc-500 ${getStatusSelectClass(row.status)}`}
                      >
                        <option value="A payer">A payer</option>
                        <option value="Paye">Paye</option>
                        <option value="Prelevement automatique">Prelevement automatique</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 ${row.id.startsWith('fixed-') ? 'pointer-events-none opacity-50' : ''}`}>
                        Joindre
                        <input
                          type="file"
                          className="hidden"
                          disabled={row.id.startsWith('fixed-')}
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
                              Ouvrir
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => updateRow(row.id, { attachmentName: '', attachmentDataUrl: '' })}
                            disabled={row.id.startsWith('fixed-')}
                            className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Suppr. PJ
                          </button>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeRow(row.id)} disabled={row.id.startsWith('fixed-')} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-semibold text-zinc-900">Repartition des charges (camembert)</p>
          <p className="mt-1 text-xs text-zinc-600">Survole un segment pour voir le pourcentage.</p>
          {pieData.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Aucune charge a afficher pour cette periode.</p>
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
                      const safeTotal = total > 0 ? total : 1
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
          <p className="text-sm font-semibold text-zinc-900">Resultat mensuel apres deduction des charges</p>
          <p className="mt-1 text-xs text-zinc-600">
            Le CA affiche ici est le CA net encaisse (reservation + frais de menage + frais supplementaires, commissions plateforme deja deduites).
          </p>
          {monthlyResultRows.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Aucune donnee de resultat disponible pour ce mois.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-zinc-50">
                  <tr className="text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3 font-semibold">Appartement</th>
                    <th className="px-4 py-3 font-semibold">CA net encaisse (EUR)</th>
                    <th className="px-4 py-3 font-semibold">Charges (EUR)</th>
                    <th className="px-4 py-3 font-semibold">Resultat net (EUR)</th>
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
                    <td className="px-4 py-3 font-semibold text-zinc-900">Global resultat</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{monthlyResultTotal.netRevenue.toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{monthlyResultTotal.charges.toFixed(2)}</td>
                    <td className={`px-4 py-3 font-semibold ${monthlyResultTotal.result >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {monthlyResultTotal.result.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Legende: les commissions des plateformes ne sont pas affichees comme charge separee ici, car elles sont deja integrees dans le CA net encaisse.
          </p>
        </div>
          </>
        )}
      </div>
    </section>
  )
}
