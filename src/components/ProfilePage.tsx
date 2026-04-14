import { useMemo, useState } from 'react'
import { getStoredAccounts, saveStoredAccounts } from '../lib/accounts'
import { useStaypilotSessionLoggedIn } from '../hooks/useStaypilotSessionLoggedIn'

const LS_IDENTIFIER = 'staypilot_login_identifier'
const LS_CURRENT_PLAN = 'staypilot_current_plan'
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_PROFILE_PREFS = 'staypilot_profile_prefs_v1'
const LS_BILLING_CANCELLATION = 'staypilot_billing_cancellation_v1'

type ProfileTab = 'personal' | 'plan' | 'billing' | 'preferences' | 'security'

export function ProfilePage() {
  const loggedIn = useStaypilotSessionLoggedIn()
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')

  const accounts = useMemo(() => getStoredAccounts(), [])
  const userKey = (localStorage.getItem(LS_CURRENT_USER) ?? localStorage.getItem(LS_IDENTIFIER) ?? '')
  const currentUser = userKey.trim().toLowerCase()
  const accountIndex = accounts.findIndex(
    (a) => a.email.trim().toLowerCase() === currentUser || a.username.trim().toLowerCase() === currentUser,
  )
  const account = accountIndex >= 0 ? accounts[accountIndex] : undefined
  const activePlan = localStorage.getItem(LS_CURRENT_PLAN)?.trim() || account?.plan || 'Gratuit'

  const [firstName, setFirstName] = useState(account?.firstName || '')
  const [lastName, setLastName] = useState(account?.lastName || '')
  const [username, setUsername] = useState(account?.username || '')
  const [email, setEmail] = useState(account?.email || '')
  const [phone, setPhone] = useState(account?.phone || '')
  const [company, setCompany] = useState(account?.company || '')
  const [saveMsg, setSaveMsg] = useState('')
  const personalFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0

  const prefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_PROFILE_PREFS)
      if (!raw) return { timezone: 'Europe/Paris', notifications: true, digest: 'weekly' }
      return JSON.parse(raw) as { timezone: string; notifications: boolean; digest: string }
    } catch {
      return { timezone: 'Europe/Paris', notifications: true, digest: 'weekly' }
    }
  }, [])
  const [timezone, setTimezone] = useState(prefs.timezone)
  const [notifications, setNotifications] = useState(Boolean(prefs.notifications))
  const [digest, setDigest] = useState(prefs.digest || 'weekly')
  const [showCancelFunnel, setShowCancelFunnel] = useState(false)
  const [cancelStep, setCancelStep] = useState<1 | 2>(1)
  const [cancelLoading, setCancelLoading] = useState(false)
  const cancellationInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_BILLING_CANCELLATION)
      if (!raw) return null
      return JSON.parse(raw) as { endAtIso: string; requestedAtIso: string; email: string }
    } catch {
      return null
    }
  }, [])
  const [billingCancellation, setBillingCancellation] = useState(cancellationInfo)

  function savePersonalInfo() {
    if (accountIndex < 0 || !personalFormValid) return
    const next = [...accounts]
    next[accountIndex] = {
      ...next[accountIndex],
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
    }
    saveStoredAccounts(next)
    localStorage.setItem(LS_CURRENT_USER, username.trim() || email.trim())
    localStorage.setItem(LS_IDENTIFIER, username.trim() || email.trim())
    setSaveMsg('Informations personnelles enregistrées.')
  }

  function savePreferences() {
    localStorage.setItem(
      LS_PROFILE_PREFS,
      JSON.stringify({ timezone: timezone.trim(), notifications, digest }),
    )
    setSaveMsg('Préférences enregistrées.')
  }

  function planStartDateIso() {
    if (account?.createdAt) return account.createdAt
    return new Date().toISOString()
  }

  function computeEndDateForCancellation(startIso: string, now = new Date()) {
    const start = new Date(startIso)
    const startDay = start.getDate()
    const y = now.getFullYear()
    const m = now.getMonth()
    const daysInThisMonth = new Date(y, m + 1, 0).getDate()
    const thisMonthTarget = new Date(y, m, Math.min(startDay, daysInThisMonth))
    if (now < thisMonthTarget) return thisMonthTarget
    const nextY = m === 11 ? y + 1 : y
    const nextM = (m + 1) % 12
    const daysInNextMonth = new Date(nextY, nextM + 1, 0).getDate()
    return new Date(nextY, nextM, Math.min(startDay, daysInNextMonth))
  }

  function fmtLongDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  async function confirmCancelBilling() {
    const endDate = computeEndDateForCancellation(planStartDateIso())
    const endAtIso = endDate.toISOString()
    const targetEmail = (email || account?.email || '').trim() || ''
    if (!targetEmail) {
      setSaveMsg("Impossible d'envoyer l'e-mail : adresse e-mail manquante.")
      return
    }
    setCancelLoading(true)
    let mailSent = false
    try {
      const res = await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: targetEmail, endAtIso }),
      })
      mailSent = res.ok
    } catch {
      mailSent = false
    }

    const payload = {
      endAtIso,
      requestedAtIso: new Date().toISOString(),
      email: targetEmail,
    }
    localStorage.setItem(LS_BILLING_CANCELLATION, JSON.stringify(payload))
    setBillingCancellation(payload)
    setShowCancelFunnel(false)
    setCancelStep(1)
    setSaveMsg(
      mailSent
        ? `Résiliation confirmée. Un e-mail de confirmation a été envoyé depuis support@staypilot.fr à ${targetEmail}. Votre abonnement prendra fin le ${fmtLongDate(endAtIso)}.`
        : `Résiliation confirmée. Envoi e-mail impossible pour le moment (configuration SMTP manquante). Votre abonnement prendra fin le ${fmtLongDate(endAtIso)}.`,
    )
    setCancelLoading(false)
  }

  if (!loggedIn) {
    return (
      <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-zinc-900">Profil</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Connectez-vous pour voir vos informations personnelles enregistrées.
          </p>
          <a
            href="/connexion"
            className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            Aller à la connexion
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <a
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Retour au dashboard
        </a>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Mon profil</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Espace compte : informations personnelles, plan, préférences et sécurité.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <TabButton label="Informations personnelles" active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
            <TabButton label="Plan" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
            <TabButton label="Facture" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
            <TabButton label="Préférences" active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} />
            <TabButton label="Sécurité" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          </div>

          {activeTab === 'personal' ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InputField label="Prénom" value={firstName} onChange={setFirstName} />
              <InputField label="Nom" value={lastName} onChange={setLastName} />
              <InputField label="Nom d'utilisateur" value={username} onChange={setUsername} />
              <InputField label="E-mail" value={email} onChange={setEmail} />
              <InputField label="Téléphone" value={phone} onChange={setPhone} required />
              <InputField label="Société" value={company} onChange={setCompany} required={false} />
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Tous les champs sont obligatoires sauf « Société ».
                </p>
                <button
                  type="button"
                  onClick={savePersonalInfo}
                  disabled={!personalFormValid}
                  className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Enregistrer les informations personnelles
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'plan' ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Plan actif</p>
                <p className="mt-1 text-lg font-bold text-sky-900">{activePlan}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Statut paiement : {billingCancellation ? 'Résiliation programmée' : 'Actif'}
              </div>

              {billingCancellation ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Résiliation enregistrée</p>
                  <p className="mt-1">
                    Votre abonnement restera actif jusqu’au <strong>{fmtLongDate(billingCancellation.endAtIso)}</strong>.
                  </p>
                  <p className="mt-1 text-xs">
                    E-mail envoyé à <strong>{billingCancellation.email}</strong> avec confirmation de résiliation.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setShowCancelFunnel((v) => !v)
                  setCancelStep(1)
                }}
                className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Annuler le paiement
              </button>

              {showCancelFunnel ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  {cancelStep === 1 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-zinc-900">Avant de confirmer, êtes-vous sûr ?</p>
                      <p className="text-sm text-zinc-700">
                        On veut être transparent : en résiliant, vous gardez l’accès jusqu’à la fin de votre période,
                        puis vous perdez l’accès aux modules avancés (dashboard premium, suivi opérationnel complet,
                        automatisations IA, etc.).
                      </p>
                      <ul className="space-y-1 text-sm text-zinc-700">
                        <li>• Vous pouvez continuer à utiliser StayPilot jusqu’au jour de fin.</li>
                        <li>• Aucune facturation supplémentaire après cette date.</li>
                        <li>• Vos données locales restent visibles sur votre navigateur.</li>
                      </ul>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setCancelStep(2)}
                          className="inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                        >
                          Oui, je veux continuer
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelFunnel(false)}
                          className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                        >
                          Non, je garde mon abonnement
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-zinc-900">Confirmation finale</p>
                      <p className="text-sm text-zinc-700">
                        Votre abonnement prendra fin le{' '}
                        <strong>{fmtLongDate(computeEndDateForCancellation(planStartDateIso()).toISOString())}</strong>.
                      </p>
                      <p className="text-sm text-zinc-700">
                        Exemple de règle : abonnement démarré le 8 novembre, demande le 23 novembre → fin le 8
                        décembre.
                      </p>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                        Un e-mail de confirmation sera envoyé avec la date de fin d’abonnement.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={confirmCancelBilling}
                          disabled={cancelLoading}
                          className="inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancelLoading ? 'Envoi en cours...' : 'Confirmer la résiliation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelStep(1)}
                          className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                        >
                          Retour
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {billingCancellation ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  <p className="font-semibold">E-mail de confirmation (aperçu)</p>
                  <p className="mt-1">Objet : Confirmation de résiliation de votre abonnement StayPilot</p>
                  <p className="mt-1">
                    Bonjour, votre résiliation est confirmée. Votre abonnement prendra fin le{' '}
                    <strong>{fmtLongDate(billingCancellation.endAtIso)}</strong>. Jusqu’à cette date, votre accès reste
                    actif.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'billing' ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Dernière facture</p>
                <p className="mt-1 text-sm text-zinc-700">
                  Plan {activePlan} — 49 EUR — Émise le 01/{new Date().getMonth() + 1}/{new Date().getFullYear()}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Mode de paiement</p>
                <p className="mt-1 text-sm text-zinc-700">Carte enregistrée •••• 4242 (démo)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Télécharger la facture PDF
                </button>
                <button
                  type="button"
                  className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  Mettre à jour le paiement
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'preferences' ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InputField label="Fuseau horaire" value={timezone} onChange={setTimezone} />
              <label className="text-sm text-zinc-700">
                Fréquence récap e-mail
                <select
                  value={digest}
                  onChange={(e) => setDigest(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </label>
              <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                />
                Recevoir les notifications compte et opérations
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={savePreferences}
                  className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'security' ? (
            <div className="mt-5 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Sécurité du compte</p>
              <p>Mot de passe : ••••••••</p>
              <p>Dernière connexion : session locale active</p>
              <a
                href="/connexion"
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 font-semibold text-zinc-800 hover:bg-zinc-100"
              >
                Changer mon mot de passe
              </a>
            </div>
          ) : null}

          {saveMsg ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {saveMsg}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function InputField({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <label className="text-sm text-zinc-700">
      {label}
      {!required ? <span className="ml-1 text-xs font-medium text-zinc-500">(facultatif)</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-sky-600 text-white shadow-sm' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      {label}
    </button>
  )
}

