import type { OfficialChannelSyncData, OfficialSyncedBooking } from './officialChannelData'

export type ChannelRevenueAggregateRow = {
  apartment: string
  year: number
  month: number
  reservationAmount: number
  cleaningFees: number
  extraFees: number
  platformCommission: number
}

export type ChannelExpenseAggregateInput = {
  labelMenage: string
  labelAutres: string
  labelPlateforme: string
  labelTaxes: string
  categoryChannel: string
}

function checkoutYearMonth(b: OfficialSyncedBooking): { y: number; m: number } | null {
  const raw = (b.checkOut || '').trim()
  const iso = raw.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (iso) return { y: Number(iso[1]), m: Number(iso[2]) }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

function lastDayOfMonth(y: number, m: number): string {
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

/**
 * CA mensuel par logement (mois du check-out), à partir des montants financiers du channel manager.
 */
export function buildChannelRevenueRowsFromSync(data: OfficialChannelSyncData): ChannelRevenueAggregateRow[] {
  const nameByProperty = new Map(data.properties.map((p) => [p.id, p.name]))
  const acc = new Map<string, ChannelRevenueAggregateRow>()

  for (const b of data.bookings) {
    const ym = checkoutYearMonth(b)
    if (!ym) continue
    const apartment = nameByProperty.get(b.propertyId) || `Logement ${b.propertyId}`
    const key = `${b.propertyId}|${ym.y}|${ym.m}`
    const cur =
      acc.get(key) ||
      ({
        apartment,
        year: ym.y,
        month: ym.m,
        reservationAmount: 0,
        cleaningFees: 0,
        extraFees: 0,
        platformCommission: 0,
      } satisfies ChannelRevenueAggregateRow)
    cur.reservationAmount += Number(b.prixTotalVoyageur?.amount ?? 0)
    cur.cleaningFees += Number(b.fraisMenage?.amount ?? 0)
    cur.extraFees += Number(b.autresFrais?.amount ?? 0)
    cur.platformCommission += Number(b.fraisPlateforme?.amount ?? 0)
    acc.set(key, cur)
  }
  return [...acc.values()]
}

type FeeAgg = { propertyId: string; apartment: string; menage: number; autres: number; plateforme: number; taxes: number }

/**
 * Lignes de charges agrégées pour un mois (check-out dans ce mois), issues du sync channel.
 */
export function buildChannelExpenseRowsForMonth(
  data: OfficialChannelSyncData,
  year: number,
  month: number,
  labels: ChannelExpenseAggregateInput,
): Array<{
  id: string
  apartment: string
  label: string
  category: string
  amount: number
  dueDate: string
  status: 'Paye'
}> {
  const nameByProperty = new Map(data.properties.map((p) => [p.id, p.name]))
  const byProp = new Map<string, FeeAgg>()

  for (const b of data.bookings) {
    const ym = checkoutYearMonth(b)
    if (!ym || ym.y !== year || ym.m !== month) continue
    const pid = (b.propertyId || '').trim()
    if (!pid) continue
    const apartment = nameByProperty.get(pid) || `Logement ${pid}`
    const cur = byProp.get(pid) || { propertyId: pid, apartment, menage: 0, autres: 0, plateforme: 0, taxes: 0 }
    cur.menage += Number(b.fraisMenage?.amount ?? 0)
    cur.autres += Number(b.autresFrais?.amount ?? 0)
    cur.plateforme += Number(b.fraisPlateforme?.amount ?? 0)
    cur.taxes += Number(b.taxesTva?.totalTaxes ?? 0)
    byProp.set(pid, cur)
  }

  const dueDate = lastDayOfMonth(year, month)
  const out: Array<{
    id: string
    apartment: string
    label: string
    category: string
    amount: number
    dueDate: string
    status: 'Paye'
  }> = []

  for (const agg of byProp.values()) {
    const base = `ch-${agg.propertyId}-${year}-${String(month).padStart(2, '0')}`
    const push = (suffix: string, label: string, amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return
      out.push({
        id: `${base}-${suffix}`,
        apartment: agg.apartment,
        label,
        category: labels.categoryChannel,
        amount: Math.round(amount * 100) / 100,
        dueDate,
        status: 'Paye',
      })
    }
    push('menage', labels.labelMenage, agg.menage)
    push('autres', labels.labelAutres, agg.autres)
    push('plateforme', labels.labelPlateforme, agg.plateforme)
    push('taxes', labels.labelTaxes, agg.taxes)
  }
  return out
}
