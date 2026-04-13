import { useEffect, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { isTestModeEnabled } from '../utils/testMode'

type SupplyRow = {
  id: string
  apartment: string
  item: string
  category: string
  stock: number
  minStock: number
  unit: string
  status: 'OK' | 'A reapprovisionner' | 'Rupture'
  updatedAt: string
}

const STORAGE_ROWS_KEY = 'sm_supplies_rows_v1'

function getApartmentOptionsFromConnections() {
  const fromConnected = getConnectedApartmentsFromStorage().map((apt) => apt.name)
  if (fromConnected.length > 0) return fromConnected
  if (isTestModeEnabled()) return ['Logement test 1', 'Logement test 2']
  return []
}

const SUPPLIES_V1: SupplyRow[] = [
  {
    id: '1',
    apartment: 'Logement',
    item: 'Papier toilette',
    category: 'Hygiene',
    stock: 8,
    minStock: 6,
    unit: 'rouleaux',
    status: 'OK',
    updatedAt: '13/04/2026',
  },
  {
    id: '2',
    apartment: 'Logement',
    item: 'Capsules cafe',
    category: 'Cuisine',
    stock: 12,
    minStock: 10,
    unit: 'capsules',
    status: 'OK',
    updatedAt: '13/04/2026',
  },
  {
    id: '3',
    apartment: 'Logement',
    item: 'Savon mains',
    category: 'Hygiene',
    stock: 2,
    minStock: 4,
    unit: 'flacons',
    status: 'A reapprovisionner',
    updatedAt: '12/04/2026',
  },
  {
    id: '4',
    apartment: 'Logement',
    item: 'Sacs poubelle',
    category: 'Entretien',
    stock: 1,
    minStock: 3,
    unit: 'paquets',
    status: 'A reapprovisionner',
    updatedAt: '12/04/2026',
  },
  {
    id: '5',
    apartment: 'Logement',
    item: 'Liquide vaisselle',
    category: 'Cuisine',
    stock: 3,
    minStock: 2,
    unit: 'flacons',
    status: 'OK',
    updatedAt: '11/04/2026',
  },
]

export function DashboardSuppliesPage() {
  const { t } = useLanguage()
  const [apartmentOptions] = useState<string[]>(() => getApartmentOptionsFromConnections())
  const hasConnectedApartments = apartmentOptions.length > 0
  const [selectedApartment, setSelectedApartment] = useState<string>(() => apartmentOptions[0] ?? '')
  const [rows, setRows] = useState<SupplyRow[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ROWS_KEY)
      if (!raw) return SUPPLIES_V1
      return JSON.parse(raw) as SupplyRow[]
    } catch {
      return SUPPLIES_V1
    }
  })
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({ rows: SUPPLIES_V1 }))
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  useEffect(() => {
    try {
      const rawRows = localStorage.getItem(STORAGE_ROWS_KEY)
      const initialRows = rawRows ? (JSON.parse(rawRows) as SupplyRow[]) : SUPPLIES_V1
      setSavedSnapshot(JSON.stringify({ rows: initialRows }))
      setHasPendingChanges(false)
    } catch {
      setSavedSnapshot(JSON.stringify({ rows: SUPPLIES_V1 }))
      setHasPendingChanges(false)
    }
  }, [])

  const currentSnapshot = JSON.stringify({ rows })
  const isDirty = hasPendingChanges || currentSnapshot !== savedSnapshot

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [isDirty])

  const updateRow = (id: string, patch: Partial<SupplyRow>) => {
    setHasPendingChanges(true)
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    if (apartmentOptions.length === 0) return
    setHasPendingChanges(true)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const today = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
    const id = String(Date.now())
    setRows((prev) => {
      const apartmentCounts = apartmentOptions.map((name) => ({
        name,
        count: prev.filter((row) => row.apartment === name).length,
      }))
      apartmentCounts.sort((a, b) => a.count - b.count)
      const nextApartment = apartmentCounts[0]?.name ?? apartmentOptions[0]
      return [
        ...prev,
        {
          id,
          apartment: nextApartment,
          item: '',
          category: '',
          stock: 0,
          minStock: 0,
          unit: '',
          status: 'OK',
          updatedAt: today,
        },
      ]
    })
  }

  const removeRow = (id: string) => {
    setHasPendingChanges(true)
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  const badgeClass: Record<SupplyRow['status'], string> = {
    OK: 'bg-emerald-100 text-emerald-700',
    'A reapprovisionner': 'bg-amber-100 text-amber-700',
    Rupture: 'bg-rose-100 text-rose-700',
  }

  const visibleRows = rows.filter((row) => row.apartment === selectedApartment)

  const saveAll = () => {
    localStorage.setItem(STORAGE_ROWS_KEY, JSON.stringify(rows))
    setSavedSnapshot(JSON.stringify({ rows }))
    setHasPendingChanges(false)
  }

  return (
    <section className="min-h-screen flex-1 bg-white px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        onClick={(e) => {
          if (!isDirty) return
          e.preventDefault()
          window.alert("Enregistre d'abord les modifications avant de quitter la page.")
        }}
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabSupplies}</h1>
        <p className="mt-2 text-sm text-zinc-600">V1 editable: toutes les cellules sont modifiables.</p>

        {!hasConnectedApartments ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5">
            <p className="text-sm font-semibold text-zinc-900">Connecte d'abord tes logements pour accéder à la liste des consommables.</p>
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
          <button
            type="button"
            onClick={addRow}
            className="rounded-xl bg-[#4a86f7] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Ajouter un consommable
          </button>
          <button
            type="button"
            onClick={saveAll}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Enregistrer tout
          </button>
          <span className={`text-xs font-semibold ${isDirty ? 'text-rose-600' : 'text-emerald-700'}`}>
            {isDirty ? 'Modifications non enregistrées' : 'Tout est enregistré'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-600">Logement</label>
            <select
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            >
              {apartmentOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">
          <div>
            <table className="w-full table-fixed text-left">
              <thead className="bg-zinc-50">
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Logement</th>
                  <th className="px-4 py-3 font-semibold">Consommable</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Unité</th>
                  <th className="px-4 py-3 font-semibold">Seuil min</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Maj</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white text-sm text-zinc-700">
                {visibleRows.map((row) => {
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3 align-top">
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm font-medium text-zinc-700">
                          {row.apartment}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <textarea
                          value={row.item}
                          onChange={(e) => updateRow(row.id, { item: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm whitespace-normal break-words outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <textarea
                          value={row.category}
                          onChange={(e) => updateRow(row.id, { category: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm whitespace-normal break-words outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.stock}
                          onChange={(e) => updateRow(row.id, { stock: Number(e.target.value) })}
                          className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <textarea
                          value={row.unit}
                          onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm whitespace-normal break-words outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.minStock}
                          onChange={(e) => updateRow(row.id, { minStock: Number(e.target.value) })}
                          className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="inline-block max-w-full overflow-hidden rounded-full">
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(row.id, { status: e.target.value as SupplyRow['status'] })}
                            className={`w-full max-w-full rounded-full px-2.5 py-1 text-xs font-semibold outline-none ${badgeClass[row.status]}`}
                          >
                            <option value="OK">OK</option>
                            <option value="A reapprovisionner">A reapprovisionner</option>
                            <option value="Rupture">Rupture</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-500">
                        <input
                          value={row.updatedAt}
                          onChange={(e) => updateRow(row.id, { updatedAt: e.target.value })}
                          className="w-full max-w-[9rem] rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={addRow}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            title="Ajouter une ligne"
          >
            Ajouter une ligne
          </button>
          <p className="mt-1 text-xs text-zinc-500">Ajoute une nouvelle ligne de consommable (horizontale).</p>
        </div>
          </>
        )}
      </div>
    </section>
  )
}
