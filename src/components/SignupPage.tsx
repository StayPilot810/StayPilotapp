import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, CircleCheck, TrendingUp, Users } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import {
  accountExistsByEmailOrUsername,
  clearStoredAccounts,
  createAccount,
  getStoredAccounts,
} from '../lib/accounts'

const CLEANER_INVITES_KEY = 'staypilot_cleaner_invites_v1'

type CleanerInvite = {
  code: string
  hostUsername: string
  createdAt: string
}

function readCleanerInvites(): CleanerInvite[] {
  try {
    const raw = localStorage.getItem(CLEANER_INVITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CleanerInvite[]) : []
  } catch {
    return []
  }
}

function extractInviteCode(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed)
    return (parsed.searchParams.get('inviteCode') || '').trim().toUpperCase()
  } catch {
    return trimmed.toUpperCase()
  }
}

const LS_SIGNUP_EMAIL_OTP_PREFIX = 'staypilot_signup_email_otp_v1_'

function signupEmailLooksValid(value: string) {
  const trimmed = value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function signupOtpStorageKey(targetEmail: string) {
  return `${LS_SIGNUP_EMAIL_OTP_PREFIX}${targetEmail.trim().toLowerCase()}`
}

function createSixDigitSignupCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function storeSignupEmailOtp(targetEmail: string, code: string) {
  localStorage.setItem(
    signupOtpStorageKey(targetEmail),
    JSON.stringify({ code, expiresAt: Date.now() + 10 * 60 * 1000 }),
  )
}

function verifySignupEmailOtp(targetEmail: string, codeInput: string) {
  const raw = localStorage.getItem(signupOtpStorageKey(targetEmail))
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as { code?: string; expiresAt?: number }
    if (!parsed.code || !parsed.expiresAt) return false
    if (Date.now() > parsed.expiresAt) return false
    return parsed.code === codeInput.trim()
  } catch {
    return false
  }
}

function clearSignupEmailOtp(targetEmail: string) {
  localStorage.removeItem(signupOtpStorageKey(targetEmail))
}

function emailAlreadyRegisteredForSignup(emailNorm: string) {
  return getStoredAccounts().some((a) => a.email.trim().toLowerCase() === emailNorm)
}

function planToPlanKey(plan: string): 'starter' | 'pro' | 'scale' {
  const value = plan.trim().toLowerCase()
  if (value === 'starter') return 'starter'
  if (value === 'scale') return 'scale'
  return 'pro'
}

export function SignupPage() {
  const { t, locale } = useLanguage()
  const requireEmailOtp = import.meta.env.VITE_REQUIRE_EMAIL_OTP === 'true'
  const [plan, setPlan] = useState('Pro')
  const [role, setRole] = useState<'host' | 'cleaner'>('host')
  const [invitationCode, setInvitationCode] = useState('')
  const [clientType, setClientType] = useState<'b2b' | 'b2c'>('b2c')
  const [countryCode, setCountryCode] = useState('FR')
  const [vatNumber, setVatNumber] = useState('')
  const [vatVerified, setVatVerified] = useState(false)
  const [vatChecking, setVatChecking] = useState(false)
  const [vatStatusMsg, setVatStatusMsg] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [emailVerifySending, setEmailVerifySending] = useState(false)
  const [emailVerifyRequested, setEmailVerifyRequested] = useState(false)
  const [emailVerifyValidated, setEmailVerifyValidated] = useState(false)
  const [emailVerifyInput, setEmailVerifyInput] = useState('')
  const [emailVerifyMsg, setEmailVerifyMsg] = useState('')
  const [accountsCount, setAccountsCount] = useState(() => getStoredAccounts().length)
  const [accountsPreview, setAccountsPreview] = useState(() => getStoredAccounts())

  const selectedPlanPricing =
    plan === 'Starter'
      ? `${t.starterPrice}${t.starterPriceSuffix}`
      : plan === 'Scale'
        ? `${t.scalePrice}${t.scalePriceSuffix}`
        : `${t.proPrice}${t.proPriceSuffix}`
  const starterHt = (19.99 / 1.2).toFixed(2)
  const proHt = (59.99 / 1.2).toFixed(2)
  const scaleHt = (99.99 / 1.2).toFixed(2)
  const vatRateByCountry: Record<string, number> = {
    FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21, PT: 23, IE: 23, LU: 17, AT: 20,
    SE: 25, DK: 25, FI: 24, PL: 23, CZ: 21, RO: 19, BG: 20, GR: 24, HR: 25, HU: 27,
    SK: 20, SI: 22, LT: 21, LV: 21, EE: 22,
  }
  const normalizedCountry = countryCode.trim().toUpperCase() || 'FR'
  const vatRate = clientType === 'b2b' && vatVerified ? 0 : vatRateByCountry[normalizedCountry] ?? 20
  const priceNumeric =
    plan === 'Starter' ? 19.99 : plan === 'Scale' ? 99.99 : 59.99
  const priceTtc = priceNumeric
  const priceHt = vatRate > 0 ? priceTtc / (1 + vatRate / 100) : priceTtc

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const roleParam = (params.get('role') || '').toLowerCase()
    const inviteCodeParam = params.get('inviteCode') || params.get('invite')
    if (roleParam === 'cleaner') setRole('cleaner')
    if (inviteCodeParam) setInvitationCode(inviteCodeParam.toUpperCase())
  }, [])

  useEffect(() => {
    setEmailVerifyRequested(false)
    setEmailVerifyValidated(false)
    setEmailVerifyInput('')
    setEmailVerifyMsg('')
  }, [email])

  function getValidCleanerInvite(): CleanerInvite | null {
    if (role !== 'cleaner') return null
    const code = extractInviteCode(invitationCode)
    if (!code) return null
    const invite = readCleanerInvites().find((i) => i.code === code)
    if (!invite) return null
    const hostExists = getStoredAccounts().some(
      (a) => (a.role || 'host') === 'host' && a.username.trim().toLowerCase() === invite.hostUsername.trim().toLowerCase(),
    )
    return hostExists ? invite : null
  }

  const canSubmit = useMemo(
    () =>
      (!requireEmailOtp || emailVerifyValidated) &&
      (role === 'cleaner' || plan.trim().length > 0) &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      (role === 'cleaner' ? Boolean(getValidCleanerInvite()) : true),
    [
      plan,
      role,
      firstName,
      lastName,
      username,
      email,
      password,
      invitationCode,
      emailVerifyValidated,
      requireEmailOtp,
    ],
  )

  async function verifyVat() {
    if (clientType !== 'b2b') {
      setVatStatusMsg('Verification TVA reservee au mode B2B.')
      return
    }
    const cc = countryCode.trim().toUpperCase()
    const vat = vatNumber.trim().toUpperCase().replace(/\s+/g, '')
    if (cc.length !== 2 || vat.length < 4) {
      setVatStatusMsg('Renseignez un pays (2 lettres) et un numero de TVA valide.')
      setVatVerified(false)
      return
    }
    setVatChecking(true)
    try {
      const res = await fetch('/api/verify-vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: cc, vatNumber: vat }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setVatVerified(false)
        setVatStatusMsg('Verification TVA indisponible. Facturation TTC appliquee.')
      } else if (data.verified) {
        setVatVerified(true)
        setVatStatusMsg('Numero de TVA verifie officiellement (VIES).')
      } else {
        setVatVerified(false)
        setVatStatusMsg('Numero de TVA non valide. Facturation TTC appliquee.')
      }
    } catch {
      setVatVerified(false)
      setVatStatusMsg('Verification TVA indisponible. Facturation TTC appliquee.')
    } finally {
      setVatChecking(false)
    }
  }

  async function requestSignupEmailCode() {
    const em = email.trim()
    setEmailVerifyMsg('')
    if (!signupEmailLooksValid(em)) {
      setEmailVerifyMsg(t.signupEmailInvalidFormat)
      return
    }
    if (emailAlreadyRegisteredForSignup(em.toLowerCase())) {
      setEmailVerifyMsg(t.signupEmailAlreadyUsed)
      return
    }
    setEmailVerifySending(true)
    const code = createSixDigitSignupCode()
    try {
      const res = await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'signup_email_verification_code',
          to: em,
          firstName: firstName.trim(),
          locale,
          code,
        }),
      })
      if (!res.ok) {
        setEmailVerifyMsg(t.signupEmailVerifySendError)
        return
      }
      storeSignupEmailOtp(em, code)
      setEmailVerifyRequested(true)
      setEmailVerifyValidated(false)
      setEmailVerifyInput('')
      setEmailVerifyMsg(t.signupEmailVerifySent)
    } catch {
      setEmailVerifyMsg(t.signupEmailVerifySendError)
    } finally {
      setEmailVerifySending(false)
    }
  }

  function validateSignupEmailCode() {
    const em = email.trim()
    setEmailVerifyMsg('')
    if (!/^\d{6}$/.test(emailVerifyInput.trim())) {
      setEmailVerifyMsg(t.signupEmailVerifyInvalid)
      return
    }
    if (!verifySignupEmailOtp(em, emailVerifyInput)) {
      setEmailVerifyMsg(t.signupEmailVerifyInvalid)
      return
    }
    setEmailVerifyValidated(true)
    setEmailVerifyMsg(t.signupEmailVerifyValidBadge)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    if (requireEmailOtp && !emailVerifyValidated) {
      setSubmitError(t.signupEmailVerifyInvalid)
      return
    }

    if (accountExistsByEmailOrUsername(email, username)) {
      setSubmitError(t.signupDuplicateError)
      return
    }

    const validInvite = role === 'cleaner' ? getValidCleanerInvite() : null
    if (role === 'cleaner' && !validInvite) {
      setSubmitError("Code d'invitation invalide. Verifiez le code envoye par votre hote.")
      return
    }

    createAccount({
      plan: role === 'cleaner' ? 'Gratuit' : plan,
      role,
      hostUsername: role === 'cleaner' && validInvite ? validInvite.hostUsername : undefined,
      clientType: role === 'cleaner' ? undefined : clientType,
      countryCode: role === 'cleaner' ? undefined : normalizedCountry,
      vatNumber: role === 'cleaner' ? undefined : vatNumber.trim() || undefined,
      vatVerified: role === 'cleaner' ? undefined : clientType === 'b2b' ? vatVerified : false,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      company: role === 'cleaner' || clientType === 'b2c' ? undefined : company.trim() || undefined,
      phone: phone.trim() || undefined,
      promoCode: role === 'host' && promoCode.trim() ? promoCode.trim() : undefined,
      preferredLocale: locale,
      emailVerified: true,
    })
    clearSignupEmailOtp(email.trim())
    const updatedAccounts = getStoredAccounts()
    setAccountsCount(updatedAccounts.length)
    setAccountsPreview(updatedAccounts)
    setSubmitError('')
    localStorage.setItem('staypilot_current_user', username.trim())
    localStorage.setItem('staypilot_login_identifier', username.trim())
    localStorage.setItem('staypilot_session_active', 'true')
    localStorage.setItem('staypilot_current_plan', role === 'cleaner' ? 'Gratuit' : plan)
    localStorage.setItem('staypilot_current_role', role)
    window.dispatchEvent(new Event('staypilot-session-changed'))
    if (role === 'host') {
      try {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planKey: planToPlanKey(plan),
            email: email.trim(),
            locale,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.url) {
          window.location.href = data.url
          return
        }
      } catch {
        // fallback below
      }
    }
    window.location.href = '/dashboard'
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
    setPromoCode('')
    setClientType('b2c')
    setRole('host')
    setInvitationCode('')
    setCountryCode('FR')
    setVatNumber('')
    setVatVerified(false)
    setVatStatusMsg('')
    setCardHolder('')
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
    setSubmitError('')
    setEmailVerifySending(false)
    setEmailVerifyRequested(false)
    setEmailVerifyValidated(false)
    setEmailVerifyInput('')
    setEmailVerifyMsg('')
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
            {t.signupBack}
          </a>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-[2rem]">
            {t.signupTitle}
          </h1>
          {role === 'cleaner' ? (
            <p className="mt-1.5 text-sm font-medium text-zinc-600">
              Inscription prestataire ménage gratuite. Renseignez vos informations et le code d&apos;invitation envoyé
              par votre hôte.
            </p>
          ) : (
            <>
              <p className="mt-1.5 text-sm font-medium text-zinc-600">
                {t.signupTrialPrefix} {selectedPlanPricing} {t.signupTrialSuffix}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-600">
                Prix affiche: <strong>{priceHt.toFixed(2)} EUR HT</strong> (grand) -{' '}
                <span className="text-zinc-500">{priceTtc.toFixed(2)} EUR TTC</span>{' '}
                {clientType === 'b2b' && vatVerified ? '(autoliquidation B2B)' : `(TVA ${vatRate}%)`}
              </p>
            </>
          )}
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {accountsCount > 0
              ? `${accountsCount} ${t.signupAccountsSome}`
              : t.signupAccountsNone}
          </p>

          <form className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            {role === 'host' ? (
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="sm:col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              >
                <option value="Starter">{t.signupPlanStarter}</option>
                <option value="Pro">{t.signupPlanPro}</option>
                <option value="Scale">{t.signupPlanScale}</option>
              </select>
            ) : null}
            <label className="sm:col-span-2 text-xs text-zinc-700">
              Vous etes
              <select
                value={role}
                onChange={(e) => setRole((e.target.value as 'host' | 'cleaner') || 'host')}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              >
                <option value="host">Hote</option>
                <option value="cleaner">Prestataire ménage</option>
              </select>
            </label>
            {role === 'host' ? (
              <>
                <label className="text-xs text-zinc-700">
                  Type de client
                  <select
                    value={clientType}
                    onChange={(e) => {
                      const next = (e.target.value as 'b2b' | 'b2c') || 'b2c'
                      setClientType(next)
                      if (next === 'b2c') {
                        setVatVerified(false)
                        setVatNumber('')
                        setCompany('')
                        setVatStatusMsg('Mode B2C: TVA appliquee selon le pays client.')
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  >
                    <option value="b2c">B2C</option>
                    <option value="b2b">B2B</option>
                  </select>
                </label>
                <label className="text-xs text-zinc-700">
                  Pays du client (ISO)
                  <input
                    type="text"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="FR"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                </label>
                {clientType === 'b2b' ? (
                  <label className="sm:col-span-2 text-xs text-zinc-700">
                    Numero de TVA (B2B)
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={vatNumber}
                        onChange={(e) => {
                          setVatNumber(e.target.value.toUpperCase())
                          setVatVerified(false)
                        }}
                        placeholder="FR12345678901"
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                      />
                      <button
                        type="button"
                        onClick={() => void verifyVat()}
                        disabled={vatChecking || clientType !== 'b2b'}
                        className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {vatChecking ? 'Verification...' : 'Verifier TVA'}
                      </button>
                    </div>
                    {vatStatusMsg ? (
                      <p className={`mt-1 ${vatVerified ? 'text-emerald-700' : 'text-amber-700'}`}>{vatStatusMsg}</p>
                    ) : null}
                  </label>
                ) : null}
              </>
            ) : (
              <label className="sm:col-span-2 text-xs text-zinc-700">
                Code d&apos;invitation envoyé par l&apos;hôte
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="SPM-AB12CD"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Entrez le code reçu de votre hôte.
                </p>
              </label>
            )}
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t.signupFirstName}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t.signupLastName}
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.signupUsername}
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.signupEmail}
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.signupPassword}
              className="sm:col-span-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
            />
            <div className="sm:col-span-2 rounded-xl border border-sky-200/80 bg-sky-50/50 p-3.5">
              <p className="text-sm font-semibold text-zinc-900">{t.signupEmailVerifyTitle}</p>
              <p className="mt-1 text-xs text-zinc-600">{t.signupEmailVerifyExplain}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => void requestSignupEmailCode()}
                  disabled={emailVerifySending}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-sky-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-sky-900 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emailVerifySending ? t.signupEmailVerifySending : t.signupEmailVerifySendCode}
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={emailVerifyInput}
                  onChange={(e) => {
                    setEmailVerifyInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setEmailVerifyValidated(false)
                  }}
                  placeholder={t.signupEmailVerifyPlaceholder}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <button
                  type="button"
                  onClick={validateSignupEmailCode}
                  disabled={!emailVerifyRequested}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.signupEmailVerifyValidate}
                </button>
              </div>
              {emailVerifyMsg ? (
                <p
                  className={`mt-2 text-xs font-medium ${
                    emailVerifyValidated ? 'text-emerald-700' : 'text-amber-800'
                  }`}
                >
                  {emailVerifyMsg}
                </p>
              ) : null}
            </div>
            {role === 'host' && clientType === 'b2b' ? (
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t.signupCompanyOptional}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
            ) : null}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.signupPhone}
              className={`${role === 'host' ? '' : 'sm:col-span-2 '}w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20`}
            />

            {role === 'host' ? (
              <label className="sm:col-span-2 text-xs text-zinc-700">
                {t.signupPromoCodeLabel}
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t.signupPromoCodePlaceholder}
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <p className="mt-1 text-[11px] text-zinc-500">{t.signupPromoCodeHint}</p>
              </label>
            ) : null}

            {role === 'host' ? (
              <div className="sm:col-span-2 mt-1 rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-3.5">
                <p className="text-sm font-semibold text-zinc-800">{t.signupCardTitle}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {t.signupCardSubtitle}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder={t.signupCardHolder}
                    className="sm:col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder={t.signupCardNumber}
                    className="sm:col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder={t.signupCardExpiry}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder={t.signupCardCvc}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="sm:col-span-2 inline-flex w-full items-center justify-center rounded-xl bg-[#4a86f7] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_-10px_rgba(74,134,247,0.8)] transition-all hover:scale-[1.01] hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.signupSubmit}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('staypilot_session_active', 'true')
                localStorage.setItem('staypilot_current_plan', 'Gratuit')
                localStorage.setItem('staypilot_current_role', role)
                localStorage.removeItem('staypilot_current_user')
                window.dispatchEvent(new Event('staypilot-session-changed'))
                window.location.href = '/dashboard'
              }}
              className="sm:col-span-2 inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Acces gratuit
            </button>
            {submitError ? (
              <p className="sm:col-span-2 text-sm font-medium text-rose-600">{submitError}</p>
            ) : null}
          </form>

          <p className="mt-3 text-center text-xs font-medium text-zinc-500 sm:text-sm">
            {t.signupAlready} <a href="/connexion" className="font-semibold text-[#4a86f7]">{t.signupLoginLink}</a>
          </p>

          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-800">{t.signupAdminTitle}</p>
              <button
                type="button"
                onClick={onResetTestData}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {t.signupAdminReset}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              {accountsPreview.length > 0
                ? `${accountsPreview.length} ${t.signupAdminCount}`
                : t.signupAdminNone}
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

        {role === 'host' ? <aside className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">{t.signupTrustTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600">{t.signupTrustSubtitle}</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <TrendingUp className="h-4 w-4 text-[#4a86f7]" />
                {t.signupTrustRevenue}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                {t.signupTrustCalendar}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                {t.signupTrustCleaning}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                {t.signupTrustSupplies}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                {t.signupTrustHours}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <Users className="h-4 w-4 text-[#4a86f7]" />
                {t.signupTrustUsers}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-blue-200/70 bg-blue-50/70 p-3.5 text-sm text-blue-900">
            {t.signupTrustQuote}
          </div>
        </aside> : null}
        </div>

        {role === 'host' ? <div className="mt-8 border-t border-zinc-200/70 pt-6 sm:mt-10 sm:pt-8">
          <h2 className="text-center text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {t.signupPlansTitle}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            {t.signupPlansSubtitle}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-pm-sm">
              <p className="text-lg font-bold text-zinc-900">{t.starterName}</p>
              <p className="mt-1 text-sm text-zinc-600">{t.starterRange}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-800">{t.starterOutcome}</p>
              <p className="mt-3 text-3xl font-bold text-zinc-900">
                {starterHt}€
                <span className="ml-1 text-base font-medium text-zinc-600">HT {t.starterPriceSuffix}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">19.99€ TTC</p>
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
                {proHt}€
                <span className="ml-1 text-base font-medium text-white/90">HT {t.proPriceSuffix}</span>
              </p>
              <p className="mt-1 text-xs text-white/80">59.99€ TTC</p>
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
                {scaleHt}€
                <span className="ml-1 text-base font-medium text-zinc-600">HT {t.scalePriceSuffix}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">99.99€ TTC</p>
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
        </div> : null}
      </div>
    </section>
  )
}
