import { Building2, Mail, Phone, Save } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

const STORAGE_KEY = 'staypilot_company_profile_v1'

type CompanyProfile = {
  companyName: string
  vatNumber: string
  managerName: string
  billingEmail: string
  billingPhone: string
  address: string
  note: string
}

function readCompanyProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { companyName: '', vatNumber: '', managerName: '', billingEmail: '', billingPhone: '', address: '', note: '' }
    const p = JSON.parse(raw)
    return {
      companyName: String(p?.companyName ?? ''),
      vatNumber: String(p?.vatNumber ?? ''),
      managerName: String(p?.managerName ?? ''),
      billingEmail: String(p?.billingEmail ?? ''),
      billingPhone: String(p?.billingPhone ?? ''),
      address: String(p?.address ?? ''),
      note: String(p?.note ?? ''),
    }
  } catch {
    return { companyName: '', vatNumber: '', managerName: '', billingEmail: '', billingPhone: '', address: '', note: '' }
  }
}

export function DashboardCompanyPage() {
  const { t } = useLanguage()
  const [profile, setProfile] = useState<CompanyProfile>(() => readCompanyProfile())
  const [saved, setSaved] = useState(false)

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Option facultative</p>
            <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              <Building2 className="h-6 w-6 text-indigo-600" aria-hidden />
              {t.dashboardTabCompany}
            </h1>
            <p className="mt-2 text-sm text-zinc-700">
              Renseignez vos informations société pour centraliser votre gestion. Vous pouvez laisser cet onglet vide.
            </p>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
            <label className="text-sm text-zinc-700">
              Nom de la société
              <input
                value={profile.companyName}
                onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Ex: Revendia LLC"
              />
            </label>
            <label className="text-sm text-zinc-700">
              Numéro de TVA / immatriculation
              <input
                value={profile.vatNumber}
                onChange={(e) => setProfile((p) => ({ ...p, vatNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="text-sm text-zinc-700">
              Responsable
              <input
                value={profile.managerName}
                onChange={(e) => setProfile((p) => ({ ...p, managerName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="text-sm text-zinc-700">
              E-mail facturation
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" aria-hidden />
                <input
                  value={profile.billingEmail}
                  onChange={(e) => setProfile((p) => ({ ...p, billingEmail: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </label>
            <label className="text-sm text-zinc-700">
              Téléphone facturation
              <div className="relative mt-1">
                <Phone className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" aria-hidden />
                <input
                  value={profile.billingPhone}
                  onChange={(e) => setProfile((p) => ({ ...p, billingPhone: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </label>
            <label className="text-sm text-zinc-700 sm:col-span-2">
              Adresse de facturation
              <input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="text-sm text-zinc-700 sm:col-span-2">
              Note interne (facultatif)
              <textarea
                value={profile.note}
                onChange={(e) => setProfile((p) => ({ ...p, note: e.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Ex: informations utiles pour les factures, périodicité, consignes..."
              />
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-4 sm:px-6">
            <p className="text-xs text-zinc-600">Cet onglet est facultatif et peut etre complete plus tard.</p>
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              <Save className="h-4 w-4" aria-hidden />
              Enregistrer
            </button>
          </div>
          {saved ? <p className="px-5 pb-4 text-sm font-semibold text-emerald-700 sm:px-6">Informations enregistrées.</p> : null}
        </div>
      </div>
    </section>
  )
}
