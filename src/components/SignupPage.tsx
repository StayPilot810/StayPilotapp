import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, CircleCheck, Eye, EyeOff, TrendingUp, Users } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import {
  accountExistsByEmailOrUsernameAsync,
  clearLocalAccountsIfRemoteServerEmpty,
  createAccount,
  getStoredAccounts,
  normalizeStoredLoginPiece,
  saveStoredAccounts,
  type StoredAccount,
} from '../lib/accounts'
import { isServerAccountsMandatory, serverAccountsConfigErrorMessage } from '../lib/serverAccountsPolicy'
import { computeHtFromTtc, formatEuroForLocale, getPlanMonthlyTtcEur, type PlanKey } from '../utils/planPricing'
import { readScopedStorage } from '../utils/sessionStorageScope'

const CLEANER_INVITES_KEY = 'staypilot_cleaner_invites_v1'

type CleanerInvite = {
  code: string
  hostUsername: string
  createdAt: string
}

function readCleanerInvites(): CleanerInvite[] {
  try {
    const raw = localStorage.getItem(CLEANER_INVITES_KEY) || readScopedStorage(CLEANER_INVITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CleanerInvite[]) : []
  } catch {
    return []
  }
}

function inviteCodeFormatLooksValid(code: string) {
  const c = String(code || '').trim().toUpperCase()
  return /^SPM-[A-Z0-9]{5,12}$/.test(c)
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

function formatStripeCheckoutClientError(data: { message?: string }, fallback: string) {
  const detail = (data?.message || '').trim()
  if (!detail) return fallback
  return `${fallback} — ${detail}`
}

function emailAlreadyRegisteredForSignup(emailNorm: string) {
  const want = normalizeStoredLoginPiece(emailNorm)
  return getStoredAccounts().some((a) => normalizeStoredLoginPiece(a.email) === want)
}

function planToPlanKey(plan: string): PlanKey {
  const value = plan.trim().toLowerCase()
  if (value === 'starter') return 'starter'
  if (value === 'scale') return 'scale'
  return 'pro'
}

/** Pays proposés à l'inscription hôte (UE + Royaume-Uni), codes ISO 3166-1 alpha-2. */
const SIGNUP_CLIENT_COUNTRY_CODES = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'GB',
] as const

const SIGNUP_CLIENT_COUNTRY_SET = new Set<string>(SIGNUP_CLIENT_COUNTRY_CODES)

function sortSignupCountryOptions(locale: string): { code: string; label: string }[] {
  const regionNames = new Intl.DisplayNames([locale, 'en'], { type: 'region' })
  return [...SIGNUP_CLIENT_COUNTRY_CODES]
    .map((code) => ({ code, label: regionNames.of(code) || code }))
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }))
}

export function SignupPage() {
  const { t, locale } = useLanguage()
  // OTP email verification is always required for signup.
  const requireEmailOtp = true
  const [plan, setPlan] = useState('Pro')
  const [role, setRole] = useState<'host' | 'cleaner'>('host')
  const [invitationCode, setInvitationCode] = useState('')
  /** Identifiant hôte passé dans le lien d’invitation (prestataire sans entrée locale dans staypilot_cleaner_invites_v1). */
  const [cleanerInviteHostFromUrl, setCleanerInviteHostFromUrl] = useState('')
  /** Résolution SPM-… via KV (code seul suffit si l’hôte a synchronisé depuis le dashboard). */
  const [serverResolvedInvite, setServerResolvedInvite] = useState<{ code: string; hostUsername: string } | null>(null)
  const [clientType, setClientType] = useState<'b2b' | 'b2c'>('b2b')
  const [countryCode, setCountryCode] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [vatVerified, setVatVerified] = useState(false)
  const [vatChecking, setVatChecking] = useState(false)
  const [vatStatusMsg, setVatStatusMsg] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [emailVerifySending, setEmailVerifySending] = useState(false)
  const [emailVerifyRequested, setEmailVerifyRequested] = useState(false)
  const [emailVerifyValidated, setEmailVerifyValidated] = useState(false)
  const [emailVerifyInput, setEmailVerifyInput] = useState('')
  const [emailVerifyMsg, setEmailVerifyMsg] = useState('')
  const [remoteKvOk, setRemoteKvOk] = useState<boolean | null>(() =>
    isServerAccountsMandatory() ? null : true,
  )

  const starterTtc = getPlanMonthlyTtcEur('starter')
  const proTtc = getPlanMonthlyTtcEur('pro')
  const scaleTtc = getPlanMonthlyTtcEur('scale')
  const starterHt = computeHtFromTtc(starterTtc, 20)
  const proHt = computeHtFromTtc(proTtc, 20)
  const scaleHt = computeHtFromTtc(scaleTtc, 20)
  const vatRateByCountry: Record<string, number> = {
    FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21, PT: 23, IE: 23, LU: 17, AT: 20,
    SE: 25, DK: 25, FI: 24, PL: 23, CZ: 21, RO: 19, BG: 20, GR: 24, EL: 24, HR: 25, HU: 27,
    SK: 20, SI: 22, LT: 21, LV: 21, EE: 22, CY: 19, MT: 18,
  }
  const normalizedCountryRaw = countryCode.trim().toUpperCase()
  const normalizedCountry =
    normalizedCountryRaw.length === 2 && SIGNUP_CLIENT_COUNTRY_SET.has(normalizedCountryRaw)
      ? normalizedCountryRaw
      : ''
  const vatRate =
    clientType === 'b2b' && vatVerified
      ? 0
      : normalizedCountry
        ? (vatRateByCountry[normalizedCountry] ?? 20)
        : 20
  const selectedPlanKey = planToPlanKey(plan)
  const priceTtc = getPlanMonthlyTtcEur(selectedPlanKey)
  const priceHt = vatRate > 0 ? priceTtc / (1 + vatRate / 100) : priceTtc

  useEffect(() => {
    if (!isServerAccountsMandatory()) {
      setRemoteKvOk(true)
      return
    }
    let cancelled = false
    fetch('/api/auth-status', { method: 'GET' })
      .then((r) => r.json().catch(() => ({})))
      .then((j: { remoteAuth?: boolean }) => {
        if (!cancelled) setRemoteKvOk(Boolean(j?.remoteAuth))
      })
      .catch(() => {
        if (!cancelled) setRemoteKvOk(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (remoteKvOk !== true) return
    void clearLocalAccountsIfRemoteServerEmpty()
  }, [remoteKvOk])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const roleParam = (params.get('role') || '').toLowerCase()
    const inviteCodeParam = params.get('inviteCode') || params.get('invite')
    const hostParam = (params.get('host') || params.get('hostUsername') || '').trim()
    if (roleParam === 'cleaner') setRole('cleaner')
    if (inviteCodeParam) setInvitationCode(inviteCodeParam.toUpperCase())
    if (hostParam) setCleanerInviteHostFromUrl(hostParam)
  }, [])

  useEffect(() => {
    setEmailVerifyRequested(false)
    setEmailVerifyValidated(false)
    setEmailVerifyInput('')
    setEmailVerifyMsg('')
  }, [email])

  useEffect(() => {
    if (role !== 'cleaner' || !isServerAccountsMandatory() || remoteKvOk !== true) {
      setServerResolvedInvite(null)
      return
    }
    const code = extractInviteCode(invitationCode)
    if (!code || !inviteCodeFormatLooksValid(code)) {
      setServerResolvedInvite(null)
      return
    }
    if (readCleanerInvites().some((i) => String(i.code || '').trim().toUpperCase() === code)) {
      setServerResolvedInvite(null)
      return
    }
    if (cleanerInviteHostFromUrl.trim()) {
      setServerResolvedInvite(null)
      return
    }
    let cancelled = false
    const tid = window.setTimeout(() => {
      void (async () => {
        try {
          const r = await fetch(`/api/cleaner-invite-lookup?code=${encodeURIComponent(code)}`)
          const j = (await r.json().catch(() => ({}))) as { hostUsername?: string }
          if (cancelled) return
          if (r.ok && typeof j.hostUsername === 'string' && j.hostUsername.trim()) {
            setServerResolvedInvite({ code, hostUsername: j.hostUsername.trim() })
          } else {
            setServerResolvedInvite(null)
          }
        } catch {
          if (!cancelled) setServerResolvedInvite(null)
        }
      })()
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(tid)
    }
  }, [role, invitationCode, cleanerInviteHostFromUrl, remoteKvOk])

  function getValidCleanerInvite(): CleanerInvite | null {
    if (role !== 'cleaner') return null
    const code = extractInviteCode(invitationCode)
    if (!code || !inviteCodeFormatLooksValid(code)) return null
    const stored = readCleanerInvites().find((i) => String(i.code || '').trim().toUpperCase() === code)
    if (stored) {
      if (isServerAccountsMandatory()) return stored
      const hostNorm = normalizeStoredLoginPiece(stored.hostUsername)
      const hostExists = getStoredAccounts().some(
        (a) => (a.role || 'host') === 'host' && normalizeStoredLoginPiece(a.username) === hostNorm,
      )
      return hostExists ? stored : null
    }
    if (serverResolvedInvite && serverResolvedInvite.code === code) {
      const hu =
        normalizeStoredLoginPiece(serverResolvedInvite.hostUsername) || serverResolvedInvite.hostUsername.trim()
      return { code, hostUsername: hu, createdAt: new Date().toISOString() }
    }
    const hostHint = cleanerInviteHostFromUrl.trim()
    if (!hostHint) return null
    const synthetic: CleanerInvite = {
      code,
      hostUsername: normalizeStoredLoginPiece(hostHint) || hostHint.trim(),
      createdAt: new Date().toISOString(),
    }
    if (isServerAccountsMandatory()) return synthetic
    const hostNorm = normalizeStoredLoginPiece(hostHint)
    const hostExists = getStoredAccounts().some(
      (a) => (a.role || 'host') === 'host' && normalizeStoredLoginPiece(a.username) === hostNorm,
    )
    return hostExists ? synthetic : null
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
      confirmPassword.trim().length > 0 &&
      password === confirmPassword &&
      (role === 'cleaner'
        ? Boolean(getValidCleanerInvite())
        : Boolean(normalizedCountry) &&
            (clientType === 'b2c' || (vatNumber.trim().length > 0 && vatVerified))),
    [
      plan,
      role,
      firstName,
      lastName,
      username,
      email,
      password,
      confirmPassword,
      invitationCode,
      clientType,
      countryCode,
      vatNumber,
      vatVerified,
      emailVerifyValidated,
      requireEmailOtp,
      normalizedCountry,
      cleanerInviteHostFromUrl,
      serverResolvedInvite,
    ],
  )

  const signupCountryOptions = useMemo(() => sortSignupCountryOptions(locale), [locale])

  const signupCountryPlaceholder = useMemo(() => {
    switch (locale) {
      case 'en':
        return 'Select client country…'
      case 'es':
        return 'Seleccione el país del cliente…'
      case 'de':
        return 'Kundenland wählen…'
      case 'it':
        return 'Seleziona il paese del cliente…'
      default:
        return 'Choisissez le pays du client…'
    }
  }, [locale])

  const vatNoPrefixHint = useMemo(() => {
    switch (locale) {
      case 'en':
        return 'Enter the VAT number without the country prefix (FR, ES…); country is selected above.'
      case 'es':
        return 'Introduzca el NIF-IVA sin el prefijo del país (FR, ES…); el país figura arriba.'
      case 'de':
        return 'USt-IdNr. ohne Länderpräfix (FR, ES…); das Land steht oben.'
      case 'it':
        return 'Inserisci la P. IVA senza prefisso paese (FR, ES…); il paese è sopra.'
      default:
        return 'Sans le préfixe pays (FR, ES…) : le pays est celui indiqué ci-dessus.'
    }
  }, [locale])

  async function verifyVat() {
    if (clientType !== 'b2b') {
      setVatStatusMsg('Vérification TVA réservée au mode B2B.')
      return
    }
    const cc = countryCode.trim().toUpperCase()
    const vat = vatNumber.trim().toUpperCase().replace(/\s+/g, '')
    if (cc.length !== 2 || vat.length < 4) {
      setVatStatusMsg('Sélectionnez le pays du client, puis un numéro de TVA valide.')
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
        setVatStatusMsg(
          cc === 'GB' || cc === 'UK'
            ? 'Vérification TVA UK indisponible pour le moment. Réessayez.'
            : 'Vérification TVA indisponible pour le moment. Réessayez.',
        )
      } else if (data.verified) {
        setVatVerified(true)
        const resolvedCc = String((data as { countryCode?: string }).countryCode || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .slice(0, 2)
        if (resolvedCc.length === 2) {
          const forSelect = resolvedCc === 'EL' ? 'GR' : resolvedCc
          if (SIGNUP_CLIENT_COUNTRY_SET.has(forSelect)) {
            setCountryCode(forSelect)
          }
        }
        setVatStatusMsg(
          data?.verificationSource === 'uk_hmrc'
            ? 'Numéro de TVA UK vérifié officiellement (HMRC).'
            : 'Numéro de TVA vérifié officiellement (VIES).',
        )
      } else {
        setVatVerified(false)
        setVatStatusMsg(
          data?.verificationSource === 'uk_hmrc'
            ? 'Numéro de TVA UK non valide (HMRC).'
            : 'Numéro de TVA non valide.',
        )
      }
    } catch {
      setVatVerified(false)
      setVatStatusMsg('Vérification TVA indisponible pour le moment. Réessayez.')
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
        setEmailVerifyRequested(false)
        setEmailVerifyValidated(false)
        setEmailVerifyInput('')
        setEmailVerifyMsg(t.signupEmailVerifySendError)
        return
      }
      storeSignupEmailOtp(em, code)
      setEmailVerifyRequested(true)
      setEmailVerifyValidated(false)
      setEmailVerifyInput('')
      setEmailVerifyMsg(t.signupEmailVerifySent)
    } catch {
      setEmailVerifyRequested(false)
      setEmailVerifyValidated(false)
      setEmailVerifyInput('')
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
    if (!canSubmit) {
      if (!firstName.trim() || !lastName.trim()) {
        setSubmitError('Inscription impossible : prénom et nom sont obligatoires.')
        return
      }
      if (!username.trim()) {
        setSubmitError("Inscription impossible : nom d'utilisateur manquant.")
        return
      }
      if (!email.trim()) {
        setSubmitError('Inscription impossible : adresse e-mail manquante.')
        return
      }
      if (!password.trim()) {
        setSubmitError('Inscription impossible : mot de passe manquant.')
        return
      }
      if (!confirmPassword.trim()) {
        setSubmitError('Inscription impossible : confirmation du mot de passe manquante.')
        return
      }
      if (password !== confirmPassword) {
        setSubmitError('Inscription impossible : les deux mots de passe ne sont pas identiques.')
        return
      }
      if (role === 'cleaner' && !getValidCleanerInvite()) {
        setSubmitError("Inscription impossible : code d'invitation ménage invalide.")
        return
      }
      if (role === 'host' && !plan.trim()) {
        setSubmitError('Inscription impossible : forfait non sélectionné.')
        return
      }
      if (role === 'host' && !normalizedCountry) {
        setSubmitError('Inscription impossible : pays du client manquant ou invalide.')
        return
      }
      if (requireEmailOtp && !emailVerifyValidated) {
        setSubmitError('Inscription impossible : adresse e-mail non vérifiée.')
        return
      }
      setSubmitError("Inscription impossible : informations manquantes ou invalides.")
      return
    }
    if (requireEmailOtp && !emailVerifyValidated) {
      setSubmitError(t.signupEmailVerifyInvalid)
      return
    }

    const remoteStatus = await fetch('/api/auth-status', { method: 'GET' })
      .then((r) => r.json().catch(() => ({})))
      .catch(() => ({}))
    if (isServerAccountsMandatory() && !remoteStatus.remoteAuth) {
      setSubmitError(serverAccountsConfigErrorMessage())
      return
    }

    if (await accountExistsByEmailOrUsernameAsync(email, username)) {
      setSubmitError(t.signupDuplicateError)
      return
    }
    if (password !== confirmPassword) {
      setSubmitError('Inscription impossible : les deux mots de passe ne sont pas identiques.')
      return
    }
    if (role === 'host' && !normalizedCountry) {
      setSubmitError('Inscription impossible : pays du client manquant ou invalide.')
      return
    }
    if (role === 'host' && clientType === 'b2b' && (!vatNumber.trim() || !vatVerified)) {
      setSubmitError('Inscription impossible : numéro de TVA B2B manquant ou non valide.')
      return
    }

    const validInvite = role === 'cleaner' ? getValidCleanerInvite() : null
    if (role === 'cleaner' && !validInvite) {
      setSubmitError("Code d'invitation invalide. Vérifiez le code envoyé par votre hôte.")
      return
    }

    const accountPayload = {
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
      emailVerified: emailVerifyValidated,
    }

    if (role === 'cleaner') {
      if (remoteStatus.remoteAuth) {
        const res = await fetch('/api/auth-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: accountPayload }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.status === 409) {
          setSubmitError(t.signupDuplicateError)
          return
        }
        if (!res.ok || !Array.isArray(data.accounts)) {
          setSubmitError("Inscription impossible : le serveur de comptes est indisponible. Réessayez plus tard.")
          return
        }
        saveStoredAccounts(data.accounts)
        const uNorm = username.trim().toLowerCase()
        const found = data.accounts.find(
          (a: { username?: unknown }) => normalizeStoredLoginPiece(a.username) === uNorm,
        )
        if (!found) {
          setSubmitError("Inscription impossible : compte non retrouvé après création.")
          return
        }
      } else {
        if (isServerAccountsMandatory()) {
          setSubmitError(serverAccountsConfigErrorMessage())
          return
        }
        createAccount(accountPayload)
      }
      try {
        await fetch('/api/cancel-subscription-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'welcome_onboarding',
            to: email.trim(),
            firstName: firstName.trim(),
            locale,
            role,
          }),
        })
      } catch {
        // Non-blocking
      }
      clearSignupEmailOtp(email.trim())
      setSubmitError('')
      localStorage.setItem('staypilot_current_user', username.trim())
      localStorage.setItem('staypilot_login_identifier', username.trim())
      localStorage.setItem('staypilot_session_active', 'true')
      localStorage.setItem('staypilot_current_plan', 'Gratuit')
      localStorage.setItem('staypilot_current_role', role)
      window.dispatchEvent(new Event('staypilot-session-changed'))
      window.location.href = '/dashboard'
      return
    }

    if (remoteStatus.remoteAuth && role === 'host') {
      try {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planKey: planToPlanKey(plan),
            clientType,
            email: email.trim(),
            locale,
            pendingHostAccount: accountPayload,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; message?: string }
        if (res.status === 409 || data?.error === 'duplicate_account') {
          setSubmitError(t.signupDuplicateError)
          return
        }
        if (data?.error === 'pending_host_requires_kv') {
          setSubmitError(serverAccountsConfigErrorMessage())
          return
        }
        if (res.ok && data?.url) {
          clearSignupEmailOtp(email.trim())
          setSubmitError('')
          window.location.href = data.url
          return
        }
        if (data?.error === 'missing_plan_price_id') {
          setSubmitError(
            'Configuration Stripe incomplète (identifiant de prix manquant pour ce forfait). Contactez le support.',
          )
          return
        }
        if (data?.error === 'invalid_plan') {
          setSubmitError('Forfait invalide. Sélectionnez Starter, Pro ou Scale puis réessayez.')
          return
        }
        setSubmitError(
          formatStripeCheckoutClientError(
            data,
            "Impossible d'ouvrir la page de paiement sécurisée Stripe. Réessayez dans un instant. Votre compte ne sera créé qu'après validation du paiement sur Stripe.",
          ),
        )
      } catch {
        setSubmitError(
          "Impossible d'ouvrir la page de paiement Stripe (réseau). Réessayez. Votre compte ne sera créé qu'après validation du paiement sur Stripe.",
        )
      }
      return
    }

    let createdAccount: StoredAccount
    if (isServerAccountsMandatory()) {
      setSubmitError(serverAccountsConfigErrorMessage())
      return
    }
    createdAccount = createAccount(accountPayload)
    try {
      await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'welcome_onboarding',
          to: email.trim(),
          firstName: firstName.trim(),
          locale,
          role,
        }),
      })
    } catch {
      // Non-blocking: signup flow must continue even if email transport is unavailable.
    }
    clearSignupEmailOtp(email.trim())
    setSubmitError('')

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: planToPlanKey(plan),
          clientType,
          accountId: createdAccount.id,
          email: email.trim(),
          locale,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; message?: string }
      if (res.ok && data?.url) {
        localStorage.setItem('staypilot_current_user', username.trim())
        localStorage.setItem('staypilot_login_identifier', username.trim())
        localStorage.setItem('staypilot_session_active', 'true')
        localStorage.setItem('staypilot_current_plan', plan)
        localStorage.setItem('staypilot_current_role', role)
        window.dispatchEvent(new Event('staypilot-session-changed'))
        window.location.href = data.url
        return
      }
      if (data?.error === 'missing_plan_price_id') {
        setSubmitError(
          'Configuration Stripe incomplète (identifiant de prix manquant pour ce forfait). Contactez le support.',
        )
        return
      }
      if (data?.error === 'invalid_plan') {
        setSubmitError('Forfait invalide. Sélectionnez Starter, Pro ou Scale puis réessayez.')
        return
      }
      setSubmitError(
        formatStripeCheckoutClientError(
          data,
          "Impossible d'ouvrir la page de paiement sécurisée Stripe. Réessayez dans un instant. Si le compte a été créé, vous pouvez vous connecter puis compléter le paiement depuis votre espace.",
        ),
      )
    } catch {
      setSubmitError(
        "Impossible d'ouvrir la page de paiement Stripe (réseau). Réessayez. Si le compte a été créé, connectez-vous avec vos identifiants.",
      )
    }
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
            <p className="mt-1 text-xs font-medium text-zinc-600">
              {clientType === 'b2c' ? (
                <>
                  Prix affiché : <strong>{formatEuroForLocale(locale, priceTtc)} TTC</strong>{' '}
                  <span className="text-zinc-500">(TVA {vatRate}%)</span>
                </>
              ) : (
                <>
                  Prix affiché : <strong>{formatEuroForLocale(locale, priceHt)} HT</strong> -{' '}
                  <span className="text-zinc-500">{formatEuroForLocale(locale, priceTtc)} TTC</span>{' '}
                  {vatVerified ? '(autoliquidation B2B)' : `(TVA ${vatRate}%)`}
                </>
              )}
            </p>
          )}

          {isServerAccountsMandatory() && remoteKvOk !== true ? (
            <div
              className={`mt-4 rounded-xl border px-3 py-2 text-sm font-medium ${
                remoteKvOk === null
                  ? 'border-zinc-200 bg-zinc-50 text-zinc-700'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {remoteKvOk === null
                ? 'Vérification du service de comptes…'
                : serverAccountsConfigErrorMessage()}
            </div>
          ) : null}

          <form className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <p className="sm:col-span-2 text-xs text-zinc-700">Champs requis (obligatoire)</p>
            {role === 'host' ? (
              <div className="sm:col-span-2">
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                >
                  <option value="Starter">{t.signupPlanStarter}</option>
                  <option value="Pro">{t.signupPlanPro}</option>
                  <option value="Scale">{t.signupPlanScale}</option>
                </select>
                <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
              </div>
            ) : null}
            <label className="sm:col-span-2 text-xs text-zinc-700">
              Vous êtes
              <select
                value={role}
                onChange={(e) => setRole((e.target.value as 'host' | 'cleaner') || 'host')}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              >
                <option value="host">Hôte</option>
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
                      const next = (e.target.value as 'b2b' | 'b2c') || 'b2b'
                      setClientType(next)
                      setVatVerified(false)
                      setVatStatusMsg('')
                    }}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  >
                    <option value="b2b">B2B</option>
                    <option value="b2c">B2C</option>
                  </select>
                </label>
                <label className="text-xs text-zinc-700">
                  Pays du client (ISO)
                  <select
                    value={countryCode}
                    required
                    onChange={(e) => {
                      setCountryCode(e.target.value.toUpperCase())
                      setVatVerified(false)
                      setVatStatusMsg('')
                    }}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  >
                    <option value="">{signupCountryPlaceholder}</option>
                    {signupCountryOptions.map(({ code, label }) => (
                      <option key={code} value={code}>
                        {label} ({code})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
                </label>
                {clientType === 'b2b' ? (
                  <label className="sm:col-span-2 text-xs text-zinc-700">
                    Numéro de TVA (B2B)
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={vatNumber}
                        onChange={(e) => {
                          setVatNumber(e.target.value.toUpperCase())
                          setVatVerified(false)
                        }}
                        placeholder="12345678901"
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                      />
                      <button
                        type="button"
                        onClick={() => void verifyVat()}
                        disabled={vatChecking}
                        className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {vatChecking ? 'Vérification...' : 'Vérifier TVA'}
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">{vatNoPrefixHint}</p>
                    {vatStatusMsg ? (
                      <p className={`mt-1 ${vatVerified ? 'text-emerald-700' : 'text-amber-700'}`}>{vatStatusMsg}</p>
                    ) : null}
                  </label>
                ) : (
                  <p className="sm:col-span-2 text-xs text-zinc-600">
                    Facturation B2C appliquée en TTC selon le pays client (TVA incluse).
                  </p>
                )}
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
                <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
              </label>
            )}
            {role === 'cleaner' && extractInviteCode(invitationCode) && !getValidCleanerInvite() ? (
              <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950">
                {t.signupCleanerInviteLinkHelp}
              </p>
            ) : null}
            <div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t.signupFirstName}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
              <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
            </div>
            <div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t.signupLastName}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
              <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.signupUsername}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
              <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
            </div>
            <div className="sm:col-span-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.signupEmail}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              />
              <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
            </div>
            <div className="sm:col-span-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.signupPassword}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 pr-11 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
            </div>
            <div className="sm:col-span-2">
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 pr-11 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
            </div>
            {requireEmailOtp && !emailVerifyValidated ? (
              <p className="sm:col-span-2 rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-xs font-medium text-sky-950">
                {t.signupEmailVerifyScrollHint}
              </p>
            ) : null}
            {requireEmailOtp ? (
              <div
                id="signup-email-verify"
                className="sm:col-span-2 scroll-mt-24 rounded-xl border border-sky-200/80 bg-sky-50/50 p-3.5"
              >
                <p className="text-sm font-semibold text-zinc-900">{t.signupEmailVerifyTitle}</p>
                <p className="mt-1 text-xs text-zinc-600">{t.signupEmailVerifyExplain}</p>
                <p className="mt-1 text-xs text-zinc-700">(obligatoire)</p>
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
                {role === 'host' ? (
                  <p className="mt-2 text-[11px] font-normal text-zinc-500">
                    Channel manager obligatoire pour acceder a StayPilot : Beds24, Hostaway, Guesty, Lodgify ou SuperHote.
                  </p>
                ) : null}
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
            ) : null}
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
              <div className="sm:col-span-2 mt-1 rounded-xl border border-sky-200/90 bg-sky-50/70 p-3.5">
                <p className="text-sm font-semibold text-sky-950">{t.signupCardTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-sky-900/90">{t.signupCardSubtitle}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || remoteKvOk !== true}
              aria-disabled={!canSubmit || remoteKvOk !== true}
              className="sm:col-span-2 inline-flex w-full items-center justify-center rounded-xl bg-[#4a86f7] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_-10px_rgba(74,134,247,0.8)] transition-all hover:scale-[1.01] hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.signupSubmit}
            </button>
            {submitError ? (
              <p className="sm:col-span-2 text-sm font-medium text-rose-600">{submitError}</p>
            ) : null}
          </form>

          <p className="mt-3 text-center text-xs font-medium text-zinc-500 sm:text-sm">
            {t.signupAlready} <a href="/connexion" className="font-semibold text-[#4a86f7]">{t.signupLoginLink}</a>
          </p>

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
                {formatEuroForLocale(locale, starterHt)}
                <span className="ml-1 text-base font-medium text-zinc-600">HT {t.starterPriceSuffix}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">{formatEuroForLocale(locale, starterTtc)} TTC</p>
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
                {formatEuroForLocale(locale, proHt)}
                <span className="ml-1 text-base font-medium text-white/90">HT {t.proPriceSuffix}</span>
              </p>
              <p className="mt-1 text-xs text-white/80">{formatEuroForLocale(locale, proTtc)} TTC</p>
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
                {formatEuroForLocale(locale, scaleHt)}
                <span className="ml-1 text-base font-medium text-zinc-600">HT {t.scalePriceSuffix}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">{formatEuroForLocale(locale, scaleTtc)} TTC</p>
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
