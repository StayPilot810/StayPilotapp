import { FormEvent, useMemo, useState } from 'react'
import { Check, CircleCheck, TrendingUp, Users } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import {
  accountExistsByEmailOrUsername,
  clearStoredAccounts,
  createAccount,
  getStoredAccounts,
} from '../lib/accounts'

export function SignupPage() {
  const { t } = useLanguage()
  const [plan, setPlan] = useState('Pro')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [accountsCount, setAccountsCount] = useState(() => getStoredAccounts().length)
  const [accountsPreview, setAccountsPreview] = useState(() => getStoredAccounts())

  const selectedPlanPricing =
    plan === 'Starter'
      ? `${t.starterPrice}${t.starterPriceSuffix}`
      : plan === 'Scale'
        ? `${t.scalePrice}${t.scalePriceSuffix}`
        : `${t.proPrice}${t.proPriceSuffix}`

  const canSubmit = useMemo(
    () =>
      plan.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      cardHolder.trim().length > 0 &&
      cardNumber.trim().length >= 14 &&
      cardExpiry.trim().length >= 4 &&
      cardCvc.trim().length >= 3,
    [plan, firstName, lastName, username, email, password, cardHolder, cardNumber, cardExpiry, cardCvc],
  )

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return

    if (accountExistsByEmailOrUsername(email, username)) {
      setSubmitError("Un compte existe déjà avec cet email ou ce nom d'utilisateur.")
      return
    }

    createAccount({
      plan,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
    })
    const updatedAccounts = getStoredAccounts()
    setAccountsCount(updatedAccounts.length)
    setAccountsPreview(updatedAccounts)
    setSubmitError('')
    window.location.href = '/connexion'
  }

  function onResetTestData() {
    clearStoredAccounts()
    setAccountsCount(0)
    setAccountsPreview([])
    setFirstName('')
    setLastName('')
    setUsername('')
    setEmail('')
    setPassword('')
    setCompany('')
    setPhone('')
    setCardHolder('')
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
    setSubmitError('')
  }

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden border-t border-zinc-200/50 bg-[linear-gradient(180deg,#fdfefe_0%,#f5f8ff_55%,#f2f6ff_100%)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_68%_58%_at_16%_10%,rgba(79,134,247,0.14),transparent_68%),radial-gradient(ellipse_62%_52%_at_85%_90%,rgba(59,130,246,0.12),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-white/35" />

      <div className="relative w-full max-w-[1120px] rounded-3xl border border-zinc-200/70 bg-white/95 p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] sm:p-7 lg:p-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6">
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            ← Retour au menu principal
          </a>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-[2rem]">
            Commencez à optimiser vos locations
          </h1>
          <p className="mt-1.5 text-sm font-medium text-zinc-600">
            14 jours gratuits puis {selectedPlanPricing} selon le plan choisi
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {accountsCount > 0
              ? `${accountsCount} compte(s) déjà créé(s) sur cette application`
              : 'Aucun compte créé pour le moment'}
          </p>

          <form className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            >
              <option value="Starter">Plan Starter</option>
              <option value="Pro">Plan Pro</option>
              <option value="Scale">Plan Scale</option>
            </select>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Société (facultatif)"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Numéro de téléphone"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />

            <div className="sm:col-span-2 mt-1 rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3.5">
              <p className="text-sm font-semibold text-zinc-800">Carte bancaire (activation après 14 jours gratuits)</p>
              <p className="mt-1 text-xs text-zinc-600">
                Votre carte est utilisée pour démarrer automatiquement l’abonnement à la fin de l’essai.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Nom sur la carte"
                  className="sm:col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Numéro de carte"
                  className="sm:col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/AA"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="CVC"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="sm:col-span-2 inline-flex w-full items-center justify-center rounded-xl bg-[#4a86f7] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_-10px_rgba(74,134,247,0.8)] transition-all hover:scale-[1.01] hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Créer mon compte
            </button>
            {submitError ? (
              <p className="sm:col-span-2 text-sm font-medium text-rose-600">{submitError}</p>
            ) : null}
          </form>

          <p className="mt-3 text-center text-xs font-medium text-zinc-500 sm:text-sm">
            Déjà un compte ? <a href="/connexion" className="font-semibold text-[#4a86f7]">Se connecter</a>
          </p>

          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-800">Admin test — comptes créés</p>
              <button
                type="button"
                onClick={onResetTestData}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Reset page / données
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              {accountsPreview.length > 0
                ? `${accountsPreview.length} compte(s) listé(s) pour vos tests`
                : 'Aucun compte de test enregistré'}
            </p>
            {accountsPreview.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-zinc-700">
                {accountsPreview.slice(0, 5).map((account) => (
                  <li key={account.id} className="rounded-md bg-white px-2 py-1">
                    {account.firstName} {account.lastName} — {account.email}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <aside className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Pourquoi les clients restent ?</h2>
          <p className="mt-1 text-sm text-zinc-600">Des résultats concrets, rapidement visibles sur le terrain.</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <TrendingUp className="h-4 w-4 text-[#4a86f7]" />
                +18% de revenus en moyenne sur les périodes clés
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                Moins d’erreurs de calendrier et de doubles réservations
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                Gestion des ménages avec checklists, photos et suivi par logement
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                Gestion des consommables et achats pour éviter les ruptures
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                Jusqu’à 8h gagnées par semaine sur l’administratif et les relances
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <Users className="h-4 w-4 text-[#4a86f7]" />
                +500 propriétaires utilisent déjà StayManager
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-blue-200/70 bg-blue-50/70 p-3.5 text-sm text-blue-900">
            “On a réduit les imprévus et gagné du temps chaque semaine. Enfin une vue claire sur notre rentabilité.”
          </div>
        </aside>
        </div>

        <div className="mt-8 border-t border-zinc-200/70 pt-6 sm:mt-10 sm:pt-8">
          <h2 className="text-center text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Choisissez votre plan
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Sélectionnez l’offre la plus adaptée avant de créer votre compte.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-pm-sm">
              <p className="text-lg font-bold text-zinc-900">{t.starterName}</p>
              <p className="mt-1 text-sm text-zinc-600">{t.starterRange}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-800">{t.starterOutcome}</p>
              <p className="mt-3 text-3xl font-bold text-zinc-900">
                {t.starterPrice}
                <span className="ml-1 text-base font-medium text-zinc-600">{t.starterPriceSuffix}</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-600">{t.planTrial}</p>
              <ul className="mt-4 space-y-2">
                {t.starterFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-blue-300/80 bg-[#4a86f7] p-5 shadow-pm-featured ring-1 ring-blue-200/60">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-white">{t.proName}</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t.popularBadge}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/90">{t.proRange}</p>
              <p className="mt-2 text-sm font-semibold text-white">{t.proOutcome}</p>
              <p className="mt-3 text-4xl font-bold text-white">
                {t.proPrice}
                <span className="ml-1 text-base font-medium text-white/90">{t.proPriceSuffix}</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{t.planTrial}</p>
              <ul className="mt-4 space-y-2">
                {t.proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/95">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-pm-sm">
              <p className="text-lg font-bold text-zinc-900">{t.scaleName}</p>
              <p className="mt-1 text-sm text-zinc-600">{t.scaleRange}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-800">{t.scaleOutcome}</p>
              <p className="mt-3 text-3xl font-bold text-zinc-900">
                {t.scalePrice}
                <span className="ml-1 text-base font-medium text-zinc-600">{t.scalePriceSuffix}</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-600">{t.planTrial}</p>
              <ul className="mt-4 space-y-2">
                {t.scaleFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
