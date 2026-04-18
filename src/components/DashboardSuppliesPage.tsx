import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { getStoredAccounts, storedAccountMatchesNormalizedId } from '../lib/accounts'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { readScopedStorage, writeScopedStorage } from '../utils/sessionStorageScope'
import { isTestModeEnabled } from '../utils/testMode'

type SupplyRow = {
  id: string
  apartment: string
  item: string
  category: string
  stock: number
  minStock: number
  status: 'En stock' | 'À réapprovisionner' | 'Rupture'
  updatedAt: string
}

const STORAGE_ROWS_KEY = 'staypilot_supplies_rows_v1'
const CONNECTIONS_UPDATED_EVENT = 'sm-connections-updated'
const EMPTY_LISTING_KEYS: string[] = []
/** Valeur stockée pour le mode « sans logement » ; le libellé affiché est traduit via `c.testListingLabel`. */
const TEST_LISTING_PLACEHOLDER = 'Logement test'
const LS_CURRENT_ROLE = 'staypilot_current_role'
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_LOGIN_IDENTIFIER = 'staypilot_login_identifier'

function todayFrDate() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
}

function computeSupplyStatus(stock: number, minStock: number): SupplyRow['status'] {
  if (stock <= 0) return 'Rupture'
  if (stock <= minStock) return 'À réapprovisionner'
  return 'En stock'
}

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
    category: 'Hygiène',
    stock: 8,
    minStock: 6,
    status: 'En stock',
    updatedAt: '13/04/2026',
  },
  {
    id: '2',
    apartment: 'Logement',
    item: 'Capsules café',
    category: 'Cuisine',
    stock: 12,
    minStock: 10,
    status: 'En stock',
    updatedAt: '13/04/2026',
  },
  {
    id: '3',
    apartment: 'Logement',
    item: 'Savon pour les mains',
    category: 'Hygiène',
    stock: 2,
    minStock: 4,
    status: 'À réapprovisionner',
    updatedAt: '12/04/2026',
  },
  {
    id: '4',
    apartment: 'Logement',
    item: 'Sacs poubelle',
    category: 'Entretien',
    stock: 1,
    minStock: 3,
    status: 'À réapprovisionner',
    updatedAt: '12/04/2026',
  },
  {
    id: '5',
    apartment: 'Logement',
    item: 'Liquide vaisselle',
    category: 'Cuisine',
    stock: 3,
    minStock: 2,
    status: 'En stock',
    updatedAt: '11/04/2026',
  },
]

function cloneSuppliesTemplateForApartment(apartment: string): SupplyRow[] {
  const now = todayFrDate()
  return SUPPLIES_V1.map((template, idx) => ({
    ...template,
    id: `seed-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    apartment,
    updatedAt: now,
  }))
}

/** Rattache les anciennes lignes (ex. « Logement ») au 1er logement connu, puis crée un jeu d’exemple par logement sans aucune ligne. */
function syncRowsToConnectedListings(prev: SupplyRow[], listingNames: string[]): SupplyRow[] {
  if (listingNames.length === 0) return prev
  const optSet = new Set(listingNames)
  let next = prev.map((row) => {
    const apt = (row.apartment || '').trim()
    if (optSet.has(apt)) return row
    return { ...row, apartment: listingNames[0] }
  })
  for (const apt of listingNames) {
    if (!next.some((r) => r.apartment === apt)) {
      next = [...next, ...cloneSuppliesTemplateForApartment(apt)]
    }
  }
  return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
}

function initialSuppliesState(): { rows: SupplyRow[]; snapshot: string } {
  try {
    const raw = readScopedStorage(STORAGE_ROWS_KEY)
    const base = raw ? (JSON.parse(raw) as SupplyRow[]) : SUPPLIES_V1
    const opts = getApartmentOptionsFromConnections()
    const rows = opts.length ? syncRowsToConnectedListings(base, opts) : base
    return { rows, snapshot: JSON.stringify({ rows }) }
  } catch {
    const opts = getApartmentOptionsFromConnections()
    const rows = opts.length ? syncRowsToConnectedListings(SUPPLIES_V1, opts) : SUPPLIES_V1
    return { rows, snapshot: JSON.stringify({ rows }) }
  }
}

export function DashboardSuppliesPage() {
  const { t, locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const c = {
    fr: {
      editableV1: 'V1 éditable : toutes les cellules sont modifiables.',
      connectPrompt: "Connecte d'abord tes logements pour accéder à la liste des consommables.",
      connectMyListings: 'Connecter mes logements',
      testModeNoListing: 'Ouvrir en mode test sans logement',
      addSupply: 'Ajouter un consommable',
      saveAll: 'Enregistrer tout',
      unsaved: 'Modifications non enregistrées',
      saved: 'Tout est enregistré',
      listing: 'Logement',
      supply: 'Consommable',
      category: 'Catégorie',
      remove: 'Supprimer',
      addRowTitle: 'Ajouter une ligne',
      addRow: 'Ajouter une ligne',
      cleanerMode: 'Mode prestataire : vous pouvez uniquement saisir le stock restant.',
      addRowHint: 'Ajoute une nouvelle ligne de consommable (horizontale).',
      noRowsForListing:
        'Aucune ligne pour ce logement. Utilise « Ajouter un consommable » ou choisis un autre logement.',
      saveBeforeLeave: "Enregistre d'abord les modifications avant de quitter la page.",
      colStock: 'Stock',
      colMin: 'Seuil min.',
      colStatus: 'Statut',
      colUpdated: 'Màj.',
      colAction: 'Action',
      statusInStock: 'En stock',
      statusLow: 'À réapprovisionner',
      statusOut: 'Rupture',
      testListingLabel: 'Logement test',
    },
    en: {
      editableV1: 'Editable V1: all cells can be edited.',
      connectPrompt: 'Connect your listings first to access the supplies list.',
      connectMyListings: 'Connect my listings',
      testModeNoListing: 'Open test mode without a listing',
      addSupply: 'Add supply',
      saveAll: 'Save all',
      unsaved: 'Unsaved changes',
      saved: 'Everything is saved',
      listing: 'Listing',
      supply: 'Supply',
      category: 'Category',
      remove: 'Delete',
      addRowTitle: 'Add row',
      addRow: 'Add row',
      cleanerMode: 'Cleaner mode: you can only enter remaining stock.',
      addRowHint: 'Add a new supply row (horizontal).',
      noRowsForListing:
        'No rows for this listing. Use "Add supply" or choose another listing.',
      saveBeforeLeave: 'Save your changes before leaving this page.',
      colStock: 'Stock',
      colMin: 'Min. threshold',
      colStatus: 'Status',
      colUpdated: 'Updated',
      colAction: 'Action',
      statusInStock: 'In stock',
      statusLow: 'Reorder soon',
      statusOut: 'Out of stock',
      testListingLabel: 'Test listing',
    },
    es: {
      editableV1: 'V1 editable: todas las celdas son editables.',
      connectPrompt: 'Conecta primero tus alojamientos para acceder a los consumibles.',
      connectMyListings: 'Conectar mis alojamientos',
      testModeNoListing: 'Abrir modo prueba sin alojamiento',
      addSupply: 'Añadir consumible',
      saveAll: 'Guardar todo',
      unsaved: 'Cambios no guardados',
      saved: 'Todo está guardado',
      listing: 'Alojamiento',
      supply: 'Consumible',
      category: 'Categoría',
      remove: 'Eliminar',
      addRowTitle: 'Añadir línea',
      addRow: 'Añadir línea',
      cleanerMode: 'Modo proveedor: solo puedes indicar el stock restante.',
      addRowHint: 'Añade una nueva línea de consumible (horizontal).',
      noRowsForListing:
        'No hay filas para este alojamiento. Usa «Añadir consumible» o elige otro alojamiento.',
      saveBeforeLeave: 'Guarda los cambios antes de salir de esta página.',
      colStock: 'Stock',
      colMin: 'Umbral mín.',
      colStatus: 'Estado',
      colUpdated: 'Actualiz.',
      colAction: 'Acción',
      statusInStock: 'En stock',
      statusLow: 'A reponer',
      statusOut: 'Agotado',
      testListingLabel: 'Alojamiento de prueba',
    },
    de: {
      editableV1: 'Bearbeitbare V1: alle Zellen sind editierbar.',
      connectPrompt: 'Verbinden Sie zuerst Ihre Unterkünfte, um Verbrauchsmaterial zu sehen.',
      connectMyListings: 'Meine Unterkünfte verbinden',
      testModeNoListing: 'Testmodus ohne Unterkunft öffnen',
      addSupply: 'Verbrauchsmaterial hinzufügen',
      saveAll: 'Alles speichern',
      unsaved: 'Ungespeicherte Änderungen',
      saved: 'Alles ist gespeichert',
      listing: 'Unterkunft',
      supply: 'Verbrauchsmaterial',
      category: 'Kategorie',
      remove: 'Löschen',
      addRowTitle: 'Zeile hinzufügen',
      addRow: 'Zeile hinzufügen',
      cleanerMode: 'Dienstleister-Modus: Sie können nur den Restbestand erfassen.',
      addRowHint: 'Fügen Sie eine neue Verbrauchszeile hinzu.',
      noRowsForListing:
        'Keine Zeilen für diese Unterkunft. Nutzen Sie „Verbrauchsmaterial hinzufügen“ oder wählen Sie eine andere Unterkunft.',
      saveBeforeLeave: 'Speichern Sie Ihre Änderungen, bevor Sie diese Seite verlassen.',
      colStock: 'Bestand',
      colMin: 'Mindestbest.',
      colStatus: 'Status',
      colUpdated: 'Aktualisiert',
      colAction: 'Aktion',
      statusInStock: 'Auf Lager',
      statusLow: 'Nachbestellen',
      statusOut: 'Leer',
      testListingLabel: 'Testunterkunft',
    },
    it: {
      editableV1: 'V1 modificabile: tutte le celle sono modificabili.',
      connectPrompt: 'Collega prima i tuoi alloggi per vedere i consumabili.',
      connectMyListings: 'Collega i miei alloggi',
      testModeNoListing: 'Apri modalità test senza alloggio',
      addSupply: 'Aggiungi consumabile',
      saveAll: 'Salva tutto',
      unsaved: 'Modifiche non salvate',
      saved: 'Tutto salvato',
      listing: 'Alloggio',
      supply: 'Consumabile',
      category: 'Categoria',
      remove: 'Elimina',
      addRowTitle: 'Aggiungi riga',
      addRow: 'Aggiungi riga',
      cleanerMode: 'Modalità fornitore: puoi inserire solo lo stock residuo.',
      addRowHint: 'Aggiungi una nuova riga di consumabile.',
      noRowsForListing:
        'Nessuna riga per questo alloggio. Usa «Aggiungi consumabile» o scegli un altro alloggio.',
      saveBeforeLeave: 'Salva le modifiche prima di uscire da questa pagina.',
      colStock: 'Stock',
      colMin: 'Soglia min.',
      colStatus: 'Stato',
      colUpdated: 'Agg.',
      colAction: 'Azione',
      statusInStock: 'Disponibile',
      statusLow: 'Da riordinare',
      statusOut: 'Esaurito',
      testListingLabel: 'Alloggio di prova',
    },
  }[ll]
  const displayListingName = (name: string) =>
    name === TEST_LISTING_PLACEHOLDER ? c.testListingLabel : name
  const labelForStatus = (status: SupplyRow['status']) => {
    if (status === 'En stock') return c.statusInStock
    if (status === 'À réapprovisionner') return c.statusLow
    return c.statusOut
  }
  const isCleanerSession = (() => {
    const explicitRole = (localStorage.getItem(LS_CURRENT_ROLE) || '').trim().toLowerCase()
    if (explicitRole === 'cleaner' || explicitRole === 'host') return explicitRole === 'cleaner'
    const identifier = (
      localStorage.getItem(LS_CURRENT_USER) || localStorage.getItem(LS_LOGIN_IDENTIFIER) || ''
    )
      .trim()
      .toLowerCase()
    if (!identifier) return false
    const account = getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, identifier))
    return (account?.role || 'host') === 'cleaner'
  })()
  const init = useMemo(() => initialSuppliesState(), [])
  const [listingOptions, setListingOptions] = useState<string[]>(() => getApartmentOptionsFromConnections())
  const [testViewWithoutApartment, setTestViewWithoutApartment] = useState(false)
  const hasConnectedApartments = listingOptions.length > 0
  const effectiveApartmentOptions =
    hasConnectedApartments || testViewWithoutApartment
      ? listingOptions.length > 0
        ? listingOptions
        : [TEST_LISTING_PLACEHOLDER]
      : []
  const [selectedApartment, setSelectedApartment] = useState<string>(
    () => getApartmentOptionsFromConnections()[0] ?? TEST_LISTING_PLACEHOLDER,
  )
  const [rows, setRows] = useState(() => init.rows)
  const [savedSnapshot, setSavedSnapshot] = useState(() => init.snapshot)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  useEffect(() => {
    const bump = () => setListingOptions(getApartmentOptionsFromConnections())
    bump()
    window.addEventListener('storage', bump)
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, bump)
    return () => {
      window.removeEventListener('storage', bump)
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, bump)
    }
  }, [])

  const listingKeysForSync = useMemo(() => {
    if (listingOptions.length > 0) return listingOptions
    if (testViewWithoutApartment) return [TEST_LISTING_PLACEHOLDER]
    return EMPTY_LISTING_KEYS
  }, [listingOptions, testViewWithoutApartment])

  useEffect(() => {
    if (listingKeysForSync.length === 0) return
    setRows((prev) => syncRowsToConnectedListings(prev, listingKeysForSync))
  }, [listingKeysForSync])

  useEffect(() => {
    if (!effectiveApartmentOptions.includes(selectedApartment)) {
      setSelectedApartment(effectiveApartmentOptions[0] ?? '')
    }
  }, [effectiveApartmentOptions, selectedApartment])

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
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? (() => {
              const nextRow = { ...row, ...patch }
              return {
                ...nextRow,
                status: computeSupplyStatus(Number(nextRow.stock) || 0, Number(nextRow.minStock) || 0),
                updatedAt: todayFrDate(),
              }
            })()
          : row,
      ),
    )
  }

  const addRow = () => {
    if (effectiveApartmentOptions.length === 0) return
    setHasPendingChanges(true)
    const today = todayFrDate()
    const id = String(Date.now())
    setRows((prev) => {
      const nextApartment = selectedApartment || effectiveApartmentOptions[0]
      return [
        ...prev,
        {
          id,
          apartment: nextApartment,
          item: '',
          category: '',
          stock: 0,
          minStock: 0,
          status: computeSupplyStatus(0, 0),
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
    'En stock': 'bg-emerald-100 text-emerald-700',
    'À réapprovisionner': 'bg-amber-100 text-amber-700',
    Rupture: 'bg-rose-100 text-rose-700',
  }

  const visibleRows = useMemo(
    () => rows.filter((row) => row.apartment === selectedApartment),
    [rows, selectedApartment],
  )

  const saveAll = () => {
    writeScopedStorage(STORAGE_ROWS_KEY, JSON.stringify(rows))
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
          window.alert(c.saveBeforeLeave)
        }}
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabSupplies}</h1>
        <p className="mt-2 text-sm text-zinc-600">{c.editableV1}</p>

        {!hasConnectedApartments && !testViewWithoutApartment ? (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5">
            <p className="text-sm font-semibold text-zinc-900">{c.connectPrompt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/dashboard/connecter-logements"
                className="inline-flex rounded-lg bg-[#4a86f7] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                {c.connectMyListings}
              </a>
              <button
                type="button"
                onClick={() => setTestViewWithoutApartment(true)}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                {c.testModeNoListing}
              </button>
            </div>
          </div>
        ) : (
          <>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            disabled={isCleanerSession}
            className="rounded-xl bg-[#4a86f7] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            {c.addSupply}
          </button>
          <button
            type="button"
            onClick={saveAll}
            disabled={isCleanerSession}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            {c.saveAll}
          </button>
          <span className={`text-xs font-semibold ${isDirty ? 'text-rose-600' : 'text-emerald-700'}`}>
            {isDirty ? c.unsaved : c.saved}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-600">{c.listing}</label>
            <select
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            >
              {effectiveApartmentOptions.map((name) => (
                <option key={name} value={name}>
                  {displayListingName(name)}
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
                  <th className="px-4 py-3 font-semibold">{c.listing}</th>
                  <th className="px-4 py-3 font-semibold">{c.supply}</th>
                  <th className="px-4 py-3 font-semibold">{c.category}</th>
                  <th className="px-4 py-3 font-semibold">{c.colStock}</th>
                  <th className="px-4 py-3 font-semibold">{c.colMin}</th>
                  <th className="px-4 py-3 font-semibold">{c.colStatus}</th>
                  <th className="px-4 py-3 font-semibold">{c.colUpdated}</th>
                  <th className="px-4 py-3 font-semibold">{c.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white text-sm text-zinc-700">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-500">
                      {c.noRowsForListing}
                    </td>
                  </tr>
                ) : null}
                {visibleRows.map((row) => {
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3 align-top">
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm font-medium text-zinc-700">
                          {displayListingName(row.apartment)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <textarea
                          value={row.item}
                          onChange={(e) => updateRow(row.id, { item: e.target.value })}
                          rows={2}
                          disabled={isCleanerSession}
                          className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm whitespace-normal break-words outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <textarea
                          value={row.category}
                          onChange={(e) => updateRow(row.id, { category: e.target.value })}
                          rows={2}
                          disabled={isCleanerSession}
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
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={row.minStock}
                          onChange={(e) => updateRow(row.id, { minStock: Number(e.target.value) })}
                          disabled={isCleanerSession}
                          className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1.5 outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            badgeClass[computeSupplyStatus(row.stock, row.minStock)]
                          }`}
                        >
                          {labelForStatus(computeSupplyStatus(row.stock, row.minStock))}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-500">
                        <div className="w-full max-w-[9rem] rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm font-medium text-zinc-600">
                          {row.updatedAt}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={isCleanerSession}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
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

        <div className="mt-4">
          <button
            type="button"
            onClick={addRow}
            disabled={isCleanerSession}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            title={c.addRowTitle}
          >
            {c.addRow}
          </button>
          <p className="mt-1 text-xs text-zinc-500">
            {isCleanerSession
              ? c.cleanerMode
              : c.addRowHint}
          </p>
        </div>
          </>
        )}
      </div>
    </section>
  )
}
