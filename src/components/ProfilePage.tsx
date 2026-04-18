import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { getStoredAccounts, saveStoredAccounts, type StoredAccount } from '../lib/accounts'
import { useStaypilotSessionLoggedIn } from '../hooks/useStaypilotSessionLoggedIn'
import { pricingPlansTranslations } from '../i18n/pricingPlans'
import { MOCK_BOOKINGS } from '../data/demoCalendarBookings'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { CONTACT_EMAIL } from '../i18n/contactPage'
import {
  appendHostPublishedReview,
  getHostReviewForAccount,
  HOST_REVIEWS_UPDATED_EVENT,
  removeHostPublishedReviewForAccount,
  type StoredHostReview,
} from '../utils/hostPublishedReviews'
import { moderateHostReviewQuote } from '../utils/reviewModeration'
import { computeHtFromTtc, formatEuroForLocale, getPlanMonthlyTtcEur } from '../utils/planPricing'

const LS_IDENTIFIER = 'staypilot_login_identifier'
const LS_CURRENT_PLAN = 'staypilot_current_plan'
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_PROFILE_PREFS = 'staypilot_profile_prefs_v1'
const LS_BILLING_CANCELLATION = 'staypilot_billing_cancellation_v1'
const LS_BILLING_RECOVERY = 'staypilot_billing_recovery_v1'
const LS_BILLING_AUTOPAY = 'staypilot_billing_autopay_v1'
const LS_PLAN_CHANGE_POLICY_PREFIX = 'staypilot_plan_change_policy_v1_'
const LS_CLIENT_AUTO_INVOICES = 'staypilot_client_auto_invoices_v1'
const LS_PAYMENT_DETAILS = 'staypilot_payment_details_v1'
const LS_DIGEST_LAST_SENT_PREFIX = 'staypilot_digest_last_sent_v1_'
const LS_RESERVATION_ACCESS = 'staypilot_reservation_access'
const LS_SUPPLIES_ROWS = 'staypilot_supplies_rows_v1'
const LS_CLEANING_INVOICES = 'staypilot_cleaning_invoices_v1'
const LS_CLEANING_TASK_BOARDS = 'staypilot_cleaning_task_boards_v1'
const LS_WATCH_INTEL_SUMMARY = 'staypilot_watch_intel_summary_v1'
const LS_PASSWORD_OTP_PREFIX = 'staypilot_password_otp_v1_'
const LS_CURRENT_ROLE = 'staypilot_current_role'

type IcalEvent = { start: Date; end: Date; cancelled: boolean }

function parseIcalDate(raw: string) {
  const v = String(raw || '').trim()
  const m = v.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function parseIcalEvents(icalText: string): IcalEvent[] {
  return icalText
    .split('BEGIN:VEVENT')
    .slice(1)
    .map((block) => {
      const s = block.match(/DTSTART(?:;[^:\n]+)?:([^\r\n]+)/i)?.[1]
      const e = block.match(/DTEND(?:;[^:\n]+)?:([^\r\n]+)/i)?.[1]
      const start = s ? parseIcalDate(s) : null
      const end = e ? parseIcalDate(e) : null
      if (!start || !end || end <= start) return null
      return { start, end, cancelled: /STATUS:CANCELLED/i.test(block) }
    })
    .filter((r): r is IcalEvent => Boolean(r))
}

function nightsBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

function profileSaveMessageLooksLikeError(msg: string): boolean {
  const t = msg.trim()
  if (!t) return false
  return /refus|invalide|impossible|erreur|échou|veuillez|stripe|indisponible|incorrect|expir|manquant|correspond|introuvable|bloqu/i.test(
    t,
  )
}

type ProfileTab = 'personal' | 'plan' | 'billing' | 'preferences' | 'review' | 'security'
type BillingRecoveryState = {
  firstFailedAtIso: string
  retryAttempts: number
  suspended: boolean
  lastAttemptAtIso?: string
}
type BillingAutopayState = {
  paymentMethodValid: boolean
  nextDueIso: string
  lastNotifiedAttempt: number
}
type PlanChangePolicyState = {
  requestedAtIso: string
  effectiveAtIso: string
  fromPlan: string
  toPlan: string
  changeKind?: 'upgrade' | 'downgrade'
}
type ClientAutoInvoice = {
  id: string
  clientName: string
  clientEmail: string
  apartment: string
  amountEur: number
  planLabel: string
  periodKey: string
  clientType: 'b2b' | 'b2c'
  countryCode: string
  vatRate: number
  taxMode: 'reverse_charge' | 'vat_collected'
  issuedAtIso: string
  dueAtIso: string
}

function normalizePlanLabel(raw: string) {
  const normalized = String(raw || '').trim().toLowerCase()
  if (normalized === 'starter') return 'Starter'
  if (normalized === 'pro') return 'Pro'
  if (normalized === 'scale') return 'Scale'
  return 'Starter'
}

function addDays(baseIso: string, days: number) {
  const d = new Date(baseIso)
  if (!Number.isFinite(d.getTime())) return new Date()
  d.setDate(d.getDate() + days)
  return d
}

function computePlanAmountByTaxMode(planLabel: string, taxMode: 'reverse_charge' | 'vat_collected', vatRate: number) {
  const ttcByPlan: Record<string, number> = { starter: 19.99, pro: 59.99, scale: 99.99 }
  const ttc = ttcByPlan[planLabel.trim().toLowerCase()] ?? 19.99
  if (taxMode === 'reverse_charge') {
    const fallbackVat = Number.isFinite(vatRate) && vatRate > 0 ? vatRate : 20
    return ttc / (1 + fallbackVat / 100)
  }
  return ttc
}

function formatCardNumberInput(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiryInput(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function formatCvcInput(raw: string) {
  return String(raw || '').replace(/\D/g, '').slice(0, 3)
}

function luhnCheck(cardDigits: string) {
  const digits = String(cardDigits || '').replace(/\D/g, '')
  if (!digits) return false
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i])
    if (!Number.isFinite(d)) return false
    if (shouldDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

function expiryIsValid(expiry: string) {
  const m = String(expiry || '').match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const month = Number(m[1])
  const year2 = Number(m[2])
  if (!Number.isFinite(month) || month < 1 || month > 12) return false
  const now = new Date()
  const currentYear2 = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1
  if (year2 < currentYear2) return false
  if (year2 === currentYear2 && month < currentMonth) return false
  return true
}

function maskCardNumberDisplay(cardFormatted: string) {
  const digits = String(cardFormatted || '').replace(/\D/g, '')
  if (digits.length < 13) return cardFormatted.trim() || '—'
  return `•••• •••• •••• ${digits.slice(-4)}`
}

export function ProfilePage() {
  const loggedIn = useStaypilotSessionLoggedIn()
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')
  const currentRole = (localStorage.getItem(LS_CURRENT_ROLE) || '').trim().toLowerCase()
  const isCleanerSession = currentRole === 'cleaner'
  const accounts = useMemo(() => getStoredAccounts(), [])
  const userKey = (localStorage.getItem(LS_CURRENT_USER) ?? localStorage.getItem(LS_IDENTIFIER) ?? '')
  const currentUser = userKey.trim().toLowerCase()
  const accountIndex = accounts.findIndex((a) => {
    const em = String(a.email ?? '').trim().toLowerCase()
    const un = String(a.username ?? '').trim().toLowerCase()
    return em === currentUser || un === currentUser
  })
  const account = accountIndex >= 0 ? accounts[accountIndex] : undefined
  const mailLocale = String(account?.preferredLocale || localStorage.getItem('staypilot_locale') || 'fr').slice(0, 2)
  const pricingLocale = ['fr', 'en', 'es', 'de', 'it'].includes(mailLocale) ? (mailLocale as 'fr' | 'en' | 'es' | 'de' | 'it') : 'fr'
  const pricing = pricingPlansTranslations[pricingLocale]
  const activePlan = localStorage.getItem(LS_CURRENT_PLAN)?.trim() || account?.plan || 'Gratuit'
  const starterTtc = getPlanMonthlyTtcEur('starter')
  const proTtc = getPlanMonthlyTtcEur('pro')
  const scaleTtc = getPlanMonthlyTtcEur('scale')
  const starterHt = computeHtFromTtc(starterTtc, 20)
  const proHt = computeHtFromTtc(proTtc, 20)
  const scaleHt = computeHtFromTtc(scaleTtc, 20)

  const [firstName, setFirstName] = useState(account?.firstName || '')
  const [lastName, setLastName] = useState(account?.lastName || '')
  const [username, setUsername] = useState(account?.username || '')
  const [email, setEmail] = useState(account?.email || '')
  const [phone, setPhone] = useState(account?.phone || '')
  const [company, setCompany] = useState(account?.company || '')
  const [saveMsg, setSaveMsg] = useState('')
  const [paymentSaveLoading, setPaymentSaveLoading] = useState(false)
  const [cardStripeVerifiedAtIso, setCardStripeVerifiedAtIso] = useState<string | null>(null)
  const [reviewStars, setReviewStars] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewPublicNameOk, setReviewPublicNameOk] = useState(false)
  const [reviewPublishError, setReviewPublishError] = useState('')
  const [reviewPublishOk, setReviewPublishOk] = useState('')
  const reviewAccountKey = useMemo(
    () => (email.trim() || currentUser || 'anon').toLowerCase(),
    [email, currentUser],
  )
  const [existingHostReview, setExistingHostReview] = useState<StoredHostReview | null>(null)
  const personalFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0

  const prefs = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_PROFILE_PREFS)
      if (!raw) {
        return {
          timezone: 'Europe/Paris',
          notifications: true,
          digest: 'weekly',
          digestEmailsEnabled: true,
        }
      }
      const parsed = JSON.parse(raw) as {
        timezone: string
        notifications: boolean
        digest: string
        digestEmailsEnabled?: boolean
      }
      return {
        ...parsed,
        digestEmailsEnabled: parsed.digestEmailsEnabled ?? true,
      }
    } catch {
      return {
        timezone: 'Europe/Paris',
        notifications: true,
        digest: 'weekly',
        digestEmailsEnabled: true,
      }
    }
  }, [])
  const [timezone, setTimezone] = useState(prefs.timezone)
  const [notifications, setNotifications] = useState(Boolean(prefs.notifications))
  const [digest, setDigest] = useState(prefs.digest === 'monthly' ? 'monthly' : 'weekly')
  const [digestEmailsEnabled, setDigestEmailsEnabled] = useState(
    prefs.digestEmailsEnabled !== false,
  )
  const [currentPasswordInput, setCurrentPasswordInput] = useState('')
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')
  const [passwordOtpInput, setPasswordOtpInput] = useState('')
  const [passwordOtpRequested, setPasswordOtpRequested] = useState(false)
  const [passwordOtpSending, setPasswordOtpSending] = useState(false)
  const [passwordOtpValidated, setPasswordOtpValidated] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotNewPasswordInput, setForgotNewPasswordInput] = useState('')
  const [forgotConfirmPasswordInput, setForgotConfirmPasswordInput] = useState('')
  const [forgotOtpInput, setForgotOtpInput] = useState('')
  const [forgotOtpRequested, setForgotOtpRequested] = useState(false)
  const [forgotOtpSending, setForgotOtpSending] = useState(false)
  const [forgotOtpValidated, setForgotOtpValidated] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)
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
  const [billingRecovery, setBillingRecovery] = useState<BillingRecoveryState | null>(() => {
    try {
      const raw = localStorage.getItem(LS_BILLING_RECOVERY)
      if (!raw) return null
      return JSON.parse(raw) as BillingRecoveryState
    } catch {
      return null
    }
  })
  const [billingAutopay, setBillingAutopay] = useState<BillingAutopayState>(() => {
    try {
      const raw = localStorage.getItem(LS_BILLING_AUTOPAY)
      if (raw) return JSON.parse(raw) as BillingAutopayState
    } catch {
      // ignore and rebuild defaults below
    }
    return {
      paymentMethodValid: false,
      nextDueIso: computeUpcomingBillingDue(planStartDateIso()).toISOString(),
      lastNotifiedAttempt: 0,
    }
  })
  const initialPlan = normalizePlanLabel(activePlan || 'Starter')
  const [currentPlan, setCurrentPlan] = useState(initialPlan)
  const [planSelection, setPlanSelection] = useState(initialPlan)
  const planChangeAccountKey =
    String(account?.id ?? '').trim().toLowerCase() || currentUser || 'guest'
  const [planPolicy, setPlanPolicy] = useState<PlanChangePolicyState | null>(() => {
    try {
      const raw = localStorage.getItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
      if (!raw) return null
      return JSON.parse(raw) as PlanChangePolicyState
    } catch {
      return null
    }
  })
  const [planChangeConfirmOpen, setPlanChangeConfirmOpen] = useState(false)
  const [planChangeLoading, setPlanChangeLoading] = useState(false)
  const [clientInvoices, setClientInvoices] = useState<ClientAutoInvoice[]>(() => {
    try {
      const raw = localStorage.getItem(LS_CLIENT_AUTO_INVOICES)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as ClientAutoInvoice[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const trialEnd = addDays(planStartDateIso(), 14)
    setClientInvoices((prev) =>
      prev.filter((inv) => {
        const issuedAt = new Date(inv.issuedAtIso)
        return Number.isFinite(issuedAt.getTime()) && issuedAt >= trialEnd
      }),
    )
  }, [account?.createdAt])
  const [paymentCardNumber, setPaymentCardNumber] = useState('4242 4242 4242 4242')
  const [paymentExpiry, setPaymentExpiry] = useState('12/29')
  const [paymentHolder, setPaymentHolder] = useState(() => `${firstName} ${lastName}`.trim())
  const [paymentCvc, setPaymentCvc] = useState('123')
  const [invoiceClientType, setInvoiceClientType] = useState<'b2b' | 'b2c'>(
    account?.clientType === 'b2b' && account?.vatVerified ? 'b2b' : 'b2c',
  )
  const [invoiceCountryCode, setInvoiceCountryCode] = useState((account?.countryCode || 'FR').toUpperCase())

  useEffect(() => {
    const sync = () => setExistingHostReview(getHostReviewForAccount(reviewAccountKey))
    sync()
    window.addEventListener(HOST_REVIEWS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(HOST_REVIEWS_UPDATED_EVENT, sync)
  }, [reviewAccountKey])

  useEffect(() => {
    if (activeTab !== 'review') return
    if (!existingHostReview) return
    setReviewStars(existingHostReview.stars)
    setReviewText(existingHostReview.quote)
  }, [activeTab, existingHostReview?.id])

  useEffect(() => {
    if (!isCleanerSession) return
    if (activeTab !== 'personal' && activeTab !== 'security') setActiveTab('personal')
  }, [activeTab, isCleanerSession])

  useEffect(() => {
    localStorage.setItem(LS_BILLING_AUTOPAY, JSON.stringify(billingAutopay))
  }, [billingAutopay])

  useEffect(() => {
    localStorage.setItem(LS_CLIENT_AUTO_INVOICES, JSON.stringify(clientInvoices))
  }, [clientInvoices])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PAYMENT_DETAILS)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        cardNumber?: string
        expiry?: string
        holder?: string
        cvc?: string
        stripeVerifiedAt?: string
      }
      const digits = String(parsed.cardNumber || '').replace(/\D/g, '')
      const exp = String(parsed.expiry || '').trim()
      const holder = String(parsed.holder || '').trim()
      const stripeOk = Boolean(String(parsed.stripeVerifiedAt || '').trim())
      const locallyOk =
        digits.length >= 13 &&
        digits.length <= 19 &&
        luhnCheck(digits) &&
        expiryIsValid(exp) &&
        holder.length >= 3
      if (!locallyOk) {
        localStorage.removeItem(LS_PAYMENT_DETAILS)
        setPaymentCardNumber('')
        setPaymentExpiry('')
        setPaymentHolder(`${(account?.firstName || '').trim()} ${(account?.lastName || '').trim()}`.trim())
        setPaymentCvc('')
        setCardStripeVerifiedAtIso(null)
        setBillingAutopay((prev) => ({ ...prev, paymentMethodValid: false }))
        return
      }
      if (parsed.cardNumber) setPaymentCardNumber(parsed.cardNumber)
      if (parsed.expiry) setPaymentExpiry(parsed.expiry)
      if (parsed.holder) setPaymentHolder(parsed.holder)
      if (parsed.cvc) setPaymentCvc(parsed.cvc)
      setBillingAutopay((prev) => ({ ...prev, paymentMethodValid: stripeOk }))
      setCardStripeVerifiedAtIso(stripeOk && parsed.stripeVerifiedAt ? String(parsed.stripeVerifiedAt).trim() : null)
    } catch {
      // ignore invalid local data
    }
  }, [])

  const paymentDigits = useMemo(() => paymentCardNumber.replace(/\D/g, ''), [paymentCardNumber])
  const paymentCvcDigits = useMemo(() => paymentCvc.replace(/\D/g, ''), [paymentCvc])

  const { paymentCanSubmitLocal, paymentLocalIssues } = useMemo(() => {
    const issues: string[] = []
    const digits = paymentDigits
    const exp = paymentExpiry.trim()
    const cvc = paymentCvcDigits
    const holder = paymentHolder.trim()

    if (!digits.length) issues.push('Numéro de carte : saisissez 13 à 19 chiffres.')
    else if (digits.length < 13) issues.push('Numéro incomplet : il manque des chiffres.')
    else if (digits.length > 19) issues.push('Numéro trop long (maximum 19 chiffres).')
    else if (!luhnCheck(digits)) issues.push('Numéro invalide : vérifiez les chiffres (clé de contrôle).')

    if (!/^\d{2}\/\d{2}$/.test(exp)) issues.push("Date d'expiration au format MM/AA (ex. 06/28).")
    else if (!expiryIsValid(exp)) issues.push("Carte expirée ou date d'expiration invalide.")

    if (holder.length < 3) issues.push('Nom du titulaire : au moins 3 caractères.')

    if (cvc.length !== 3) issues.push('Code de sécurité : exactement 3 chiffres.')

    return { paymentCanSubmitLocal: issues.length === 0, paymentLocalIssues: issues }
  }, [paymentDigits, paymentExpiry, paymentHolder, paymentCvcDigits])

  useEffect(() => {
    const digits = paymentCardNumber.replace(/\D/g, '')
    const ok =
      digits.length >= 13 &&
      digits.length <= 19 &&
      luhnCheck(digits) &&
      expiryIsValid(paymentExpiry.trim()) &&
      paymentHolder.trim().length >= 3 &&
      paymentCvc.replace(/\D/g, '').length === 3
    if (!ok) {
      setBillingAutopay((p) => (p.paymentMethodValid ? { ...p, paymentMethodValid: false } : p))
      setCardStripeVerifiedAtIso(null)
      try {
        const raw = localStorage.getItem(LS_PAYMENT_DETAILS)
        if (!raw) return
        const parsed = JSON.parse(raw) as { stripeVerifiedAt?: string; [k: string]: unknown }
        if (parsed.stripeVerifiedAt) {
          const rest = { ...parsed }
          delete rest.stripeVerifiedAt
          localStorage.setItem(LS_PAYMENT_DETAILS, JSON.stringify(rest))
        }
      } catch {
        // ignore
      }
    }
  }, [paymentCardNumber, paymentExpiry, paymentHolder, paymentCvc])

  useEffect(() => {
    const targetEmail = (email || account?.email || '').trim()
    if (!targetEmail) return
    const trialEnd = addDays(planStartDateIso(), 14)
    const now = new Date()
    if (now < trialEnd) return
    if (!billingAutopay.paymentMethodValid) return
    const dueAt = new Date(billingAutopay.nextDueIso)
    if (!Number.isFinite(dueAt.getTime()) || now < dueAt) return
    const y = dueAt.getFullYear()
    const m = String(dueAt.getMonth() + 1).padStart(2, '0')
    const periodKey = `${y}-${m}`
    const planLabel = normalizePlanLabel(currentPlan || 'Starter')
    const vatRateByCountry: Record<string, number> = {
      FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21, PT: 23, IE: 23, LU: 17, AT: 20,
      SE: 25, DK: 25, FI: 24, PL: 23, CZ: 21, RO: 19, BG: 20, GR: 24, HR: 25, HU: 27,
      SK: 20, SI: 22, LT: 21, LV: 21, EE: 22,
    }
    const normalizedCountry = invoiceCountryCode.trim().toUpperCase() || 'FR'
    const isVerifiedB2b = invoiceClientType === 'b2b' && account?.vatVerified === true
    const vatRate = isVerifiedB2b ? 0 : vatRateByCountry[normalizedCountry] ?? 20
    const taxMode = isVerifiedB2b ? 'reverse_charge' : 'vat_collected'
    const amountEur = computePlanAmountByTaxMode(planLabel, taxMode, vatRateByCountry[normalizedCountry] ?? 20)
    const customerName =
      `${firstName.trim()} ${lastName.trim()}`.trim() || username.trim() || targetEmail.split('@')[0] || 'Client'

    setClientInvoices((prev) => {
      const already = prev.some(
        (inv) => inv.periodKey === periodKey && inv.clientEmail.toLowerCase() === targetEmail.toLowerCase(),
      )
      if (already) return prev
      const invoice: ClientAutoInvoice = {
        id: `${Date.now()}`,
        clientName: customerName,
        clientEmail: targetEmail,
        apartment: 'Portefeuille principal',
        amountEur,
        planLabel,
        periodKey,
        clientType: invoiceClientType,
        countryCode: normalizedCountry,
        vatRate,
        taxMode,
        issuedAtIso: now.toISOString(),
        dueAtIso: dueAt.toISOString(),
      }
      return [invoice, ...prev].slice(0, 24)
    })
    const nextDue = computeUpcomingBillingDue(planStartDateIso(), new Date(dueAt.getTime() + 24 * 60 * 60 * 1000))
    setBillingAutopay((prev) => ({ ...prev, nextDueIso: nextDue.toISOString(), lastNotifiedAttempt: 0 }))
    readAndSyncBillingRecovery(null)
  }, [account?.email, account?.vatVerified, billingAutopay.nextDueIso, billingAutopay.paymentMethodValid, currentPlan, email, firstName, invoiceClientType, invoiceCountryCode, lastName, username])

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
      JSON.stringify({
        timezone: timezone.trim(),
        notifications,
        digest,
        digestEmailsEnabled,
      }),
    )
    setSaveMsg('Préférences enregistrées.')
  }

  function digestCadenceMs(value: string) {
    if (value === 'monthly') return 30 * 24 * 60 * 60 * 1000
    return 7 * 24 * 60 * 60 * 1000
  }

  function parisNowParts() {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    }).formatToParts(now)
    const byType = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    const weekdayRaw = byType('weekday').toLowerCase()
    const weekdayMap: Record<string, number> = {
      mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
      lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 7,
    }
    return {
      year: Number(byType('year')),
      month: Number(byType('month')),
      day: Number(byType('day')),
      hour: Number(byType('hour')),
      minute: Number(byType('minute')),
      second: Number(byType('second')),
      weekdayIso: weekdayMap[weekdayRaw.slice(0, 3)] ?? 0,
    }
  }

  function digestScheduleSlot(cadence: string) {
    const paris = parisNowParts()
    const atOrAfterEight = paris.hour > 8 || (paris.hour === 8 && (paris.minute > 0 || paris.second >= 0))
    if (cadence === 'monthly') {
      const due = paris.day === 1 && atOrAfterEight
      const slot = `${paris.year}-${String(paris.month).padStart(2, '0')}-M1-0800`
      return { due, slot }
    }
    const due = paris.weekdayIso === 1 && atOrAfterEight
    const slot = `${paris.year}-${String(paris.month).padStart(2, '0')}-${String(paris.day).padStart(2, '0')}-MON-0800`
    return { due, slot }
  }

  function summarizeActivity(periodMs: number) {
    const now = new Date()
    const from = new Date(now.getTime() - periodMs)
    const prevFrom = new Date(from.getTime() - periodMs)
    const thisYear = now.getFullYear()
    const currentMonthIndex = now.getMonth()
    const previousMonthIndex = (currentMonthIndex + 11) % 12
    const previousMonthYear = currentMonthIndex === 0 ? thisYear - 1 : thisYear
    const reservations = MOCK_BOOKINGS.filter((booking) => {
      const startDate = new Date(thisYear, currentMonthIndex, booking.start)
      return startDate >= from && startDate <= now
    })
    const previousReservations = MOCK_BOOKINGS.filter((booking) => {
      const startDate = new Date(previousMonthYear, previousMonthIndex, booking.start)
      return startDate >= prevFrom && startDate < from
    })
    const reservationsCount = reservations.length
    const checkInCount = reservationsCount
    const checkOutCount = reservations.length
    const newReservationsCount = reservationsCount
    const nightsCount = reservations.reduce((sum, b) => sum + Number(b.nights || 0), 0)
    const grossRevenueEur = reservations.reduce((sum, b) => sum + Number(b.totalGuestEur || 0), 0)
    const netPayoutEur = reservations.reduce((sum, b) => sum + Number(b.netPayoutEur || 0), 0)
    const avgStayNights = reservationsCount > 0 ? nightsCount / reservationsCount : 0
    const previousReservationsCount = previousReservations.length
    const previousCheckInCount = previousReservationsCount
    const previousCheckOutCount = previousReservationsCount
    const previousNewReservationsCount = previousReservationsCount
    const deltaPercent = (current: number, previous: number) => {
      if (previous <= 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }
    const periodLabel = `${fmtLongDate(from.toISOString())} -> ${fmtLongDate(now.toISOString())}`
    const upcomingTo = new Date(now.getTime() + periodMs)
    const daysInUpcomingPeriod = Math.max(1, Math.ceil((upcomingTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    const upcomingReservations = MOCK_BOOKINGS.filter((booking) => {
      const startDate = new Date(thisYear, currentMonthIndex, booking.start)
      return startDate >= now && startDate <= upcomingTo
    })
    const upcomingNights = upcomingReservations.reduce((sum, b) => sum + Number(b.nights || 0), 0)
    const estimatedUnits = 4
    const maxNightsCapacity = estimatedUnits * daysInUpcomingPeriod
    const upcomingOccupancyPct = maxNightsCapacity > 0 ? (upcomingNights / maxNightsCapacity) * 100 : 0
    const apartmentCount = Math.max(1, 1 + MOCK_BOOKINGS.reduce((max, b) => Math.max(max, b.apt), 0))
    const apartmentNights = Array.from({ length: apartmentCount }, () => 0)
    for (const booking of upcomingReservations) {
      const idx = Number(booking.apt || 0)
      if (idx >= 0 && idx < apartmentNights.length) apartmentNights[idx] += Number(booking.nights || 0)
    }
    const apartmentBreakdown = apartmentNights.map((nights, idx) => {
      const capacity = Math.max(1, daysInUpcomingPeriod)
      const occupancy = (nights / capacity) * 100
      return {
        apt: idx + 1,
        nights,
        occupancy,
      }
    })
    const mostFilled = [...apartmentBreakdown].sort((a, b) => b.occupancy - a.occupancy)[0]
    const mostEmpty = [...apartmentBreakdown].sort((a, b) => a.occupancy - b.occupancy)[0]
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    const dayDemand = [0, 0, 0, 0, 0, 0, 0]
    for (const booking of upcomingReservations) {
      const d = new Date(thisYear, currentMonthIndex, booking.start)
      dayDemand[d.getDay()] += 1
    }
    const wednesdayLoad = dayDemand[3]
    const fridayLoad = dayDemand[5]
    const globalLowDemand = upcomingOccupancyPct < 45
    const globalHighDemand = upcomingOccupancyPct > 78
    const recommendationLines: string[] = []
    if (globalLowDemand) {
      recommendationLines.push(
        "Semaine/mois a venir plutot vide: baissez legerement vos prix (-5% a -10%) pour relancer la demande et remonter rapidement l'occupation.",
      )
    } else if (globalHighDemand) {
      recommendationLines.push(
        'Periode tres remplie: vous pouvez augmenter progressivement les prix (+5% a +12%) pour maximiser la marge sans casser le taux de remplissage.',
      )
    } else {
      recommendationLines.push(
        'Periode equilibree: gardez un prix stable, puis ajustez finement jour par jour selon le pick-up de reservations.',
      )
    }
    if (fridayLoad >= 1 || globalHighDemand) {
      recommendationLines.push(
        "Vendredi soir est strategique: augmentez le tarif ce jour-la (demande loisirs plus forte, meilleur potentiel de conversion rentable).",
      )
    } else {
      recommendationLines.push(
        'Vendredi soir encore faible: gardez un prix neutre pour accelerer les reservations last-minute puis montez le tarif des que le remplissage progresse.',
      )
    }
    if (wednesdayLoad === 0 || globalLowDemand) {
      recommendationLines.push(
        'Mercredi est plus sensible au prix: appliquez une reduction ciblee ce jour-la pour combler le milieu de semaine et lisser les trous du planning.',
      )
    } else {
      recommendationLines.push(
        'Mercredi montre déjà de la traction : maintenez un prix modérément compétitif plutôt qu’une forte remise pour protéger le revenu moyen.',
      )
    }
    const apartmentInsights = apartmentBreakdown.map(
      (item) =>
        `Appartement ${item.apt}: ${item.nights} nuits projetees (${item.occupancy.toFixed(1)}% d'occupation)`,
    )
    if (mostEmpty && mostEmpty.occupancy < 35) {
      recommendationLines.push(
        `Appartement ${mostEmpty.apt} est le plus creux: lancez une action prix/promo ciblee dessus pour combler ce logement en priorite.`,
      )
    }
    if (mostFilled && mostFilled.occupancy > 80) {
      recommendationLines.push(
        `Appartement ${mostFilled.apt} est le plus rempli: vous pouvez augmenter legerement le prix sur ce logement pour capter plus de marge.`,
      )
    }
    const outlookLabel = periodMs >= 28 * 24 * 60 * 60 * 1000 ? 'mois a venir' : 'semaine a venir'
    const watchRaw = localStorage.getItem(LS_WATCH_INTEL_SUMMARY)
    const watch = watchRaw ? (JSON.parse(watchRaw) as { summaryLines?: string[]; analyzedAddress?: string; monthLabel?: string }) : null
    return {
      reservationsCount,
      newReservationsCount,
      checkInCount,
      checkOutCount,
      nightsCount,
      grossRevenueEur,
      netPayoutEur,
      avgStayNights,
      periodLabel,
      newReservationsDeltaPct: deltaPercent(newReservationsCount, previousNewReservationsCount),
      checkInDeltaPct: deltaPercent(checkInCount, previousCheckInCount),
      checkOutDeltaPct: deltaPercent(checkOutCount, previousCheckOutCount),
      upcomingOccupancyPct,
      upcomingNights,
      upcomingPeriodLabel: `${fmtLongDate(now.toISOString())} -> ${fmtLongDate(upcomingTo.toISOString())}`,
      upcomingOutlookLabel: outlookLabel,
      upcomingRecommendations: recommendationLines,
      fridayDemand: fridayLoad,
      wednesdayDemand: wednesdayLoad,
      demandByDayLabel: dayDemand.map((count, idx) => `${dayNames[idx]}:${count}`).join(', '),
      apartmentInsights,
      mostFilledAptLabel: mostFilled
        ? `Appartement ${mostFilled.apt} (${mostFilled.occupancy.toFixed(1)}%)`
        : '',
      mostEmptyAptLabel: mostEmpty
        ? `Appartement ${mostEmpty.apt} (${mostEmpty.occupancy.toFixed(1)}%)`
        : '',
      watchIntelSummaryLines: Array.isArray(watch?.summaryLines) ? watch?.summaryLines?.slice(0, 4) : [],
      watchIntelAddress: watch?.analyzedAddress || '',
      watchIntelMonthLabel: watch?.monthLabel || '',
    }
  }

  async function summarizeActivityFromConnectedData(periodMs: number) {
    const apartments = getConnectedApartmentsFromStorage()
    if (!apartments.length) return null
    const accessRaw = localStorage.getItem(LS_RESERVATION_ACCESS)
    const access = accessRaw
      ? (JSON.parse(accessRaw) as Record<string, { ical?: string; nightlyRate?: string; commissionRate?: string }>)
      : {}
    const now = new Date()
    const from = new Date(now.getTime() - periodMs)
    const prevFrom = new Date(from.getTime() - periodMs)
    const upcomingTo = new Date(now.getTime() + periodMs)

    const allRows: Array<{ apartment: string; start: Date; end: Date; cancelled: boolean; net: number }> = []
    for (const apt of apartments) {
      const cfg = access[apt.platform]
      const icalUrl = String(cfg?.ical || '').trim()
      if (!icalUrl) continue
      try {
        const res = await fetch(`/api/ical?url=${encodeURIComponent(icalUrl)}`)
        if (!res.ok) continue
        const text = await res.text()
        const events = parseIcalEvents(text)
        const nightlyRate = Math.max(0, Number(cfg?.nightlyRate || 120))
        const commissionRate = Math.max(0, Math.min(100, Number(cfg?.commissionRate || 15)))
        events.forEach((ev) => {
          const nights = nightsBetween(ev.start, ev.end)
          const gross = nights * nightlyRate
          const net = gross * (1 - commissionRate / 100)
          allRows.push({ apartment: apt.name, start: ev.start, end: ev.end, cancelled: ev.cancelled, net })
        })
      } catch {
        // ignore one connector failure
      }
    }
    if (!allRows.length) return null

    const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= b
    const current = allRows.filter((r) => !r.cancelled && inRange(r.start, from, now))
    const previous = allRows.filter((r) => !r.cancelled && inRange(r.start, prevFrom, from))
    const upcoming = allRows.filter((r) => !r.cancelled && inRange(r.start, now, upcomingTo))
    const reservationsCount = current.length
    const checkInCount = current.length
    const checkOutCount = current.length
    const newReservationsCount = current.length
    const nightsCount = current.reduce((sum, r) => sum + nightsBetween(r.start, r.end), 0)
    const netPayoutEur = current.reduce((sum, r) => sum + r.net, 0)
    const grossRevenueEur = netPayoutEur
    const avgStayNights = reservationsCount > 0 ? nightsCount / reservationsCount : 0
    const deltaPercent = (currentVal: number, previousVal: number) => {
      if (previousVal <= 0) return currentVal > 0 ? 100 : 0
      return ((currentVal - previousVal) / previousVal) * 100
    }
    const upcomingNights = upcoming.reduce((sum, r) => sum + nightsBetween(r.start, r.end), 0)
    const daysInUpcomingPeriod = Math.max(1, Math.ceil((upcomingTo.getTime() - now.getTime()) / 86400000))
    const maxNightsCapacity = Math.max(1, apartments.length) * daysInUpcomingPeriod
    const upcomingOccupancyPct = (upcomingNights / maxNightsCapacity) * 100
    const byApartment = apartments.map((apt) => {
      const aptUpcomingNights = upcoming
        .filter((row) => row.apartment === apt.name)
        .reduce((sum, row) => sum + nightsBetween(row.start, row.end), 0)
      const aptCurrentReservations = current.filter((row) => row.apartment === apt.name).length
      const aptCurrentNights = current
        .filter((row) => row.apartment === apt.name)
        .reduce((sum, row) => sum + nightsBetween(row.start, row.end), 0)
      const aptCurrentRevenue = current
        .filter((row) => row.apartment === apt.name)
        .reduce((sum, row) => sum + row.net, 0)
      return {
        apt: apt.name,
        nights: aptUpcomingNights,
        occupancy: (aptUpcomingNights / Math.max(1, daysInUpcomingPeriod)) * 100,
        currentReservations: aptCurrentReservations,
        currentNights: aptCurrentNights,
        currentRevenue: aptCurrentRevenue,
      }
    })
    const mostFilled = [...byApartment].sort((a, b) => b.occupancy - a.occupancy)[0]
    const mostEmpty = [...byApartment].sort((a, b) => a.occupancy - b.occupancy)[0]
    const recommendations = [
      upcomingOccupancyPct < 45
        ? "Periode a venir faible: baisse ciblee des prix sur les logements creux pour accelerer le pick-up."
        : 'Periode solide: protegez le revenu moyen avec des hausses progressives sur les jours forts.',
      mostFilled ? `Logement fort: ${mostFilled.apt} - montez legerement le prix sur ce bien.` : '',
      mostEmpty ? `Logement faible: ${mostEmpty.apt} - activez promo/last-minute et minimum stay plus flexible.` : '',
    ].filter(Boolean)
    const apartmentScoring = byApartment.map((row) => {
      const score =
        row.occupancy >= 80 ? 'A' : row.occupancy >= 50 ? 'B' : 'C'
      const scoreReason =
        score === 'A'
          ? 'forte traction: demande solide, potentiel marge'
          : score === 'B'
            ? 'equilibre correct: optimisation fine recommandee'
            : 'sous-performance: priorite remplissage'
      const actionPrice =
        score === 'A'
          ? '+6% a +12% sur jours premium (ven/sam), +3% sur reste'
          : score === 'B'
            ? 'prix stable, micro-ajustements +/-3% selon pick-up'
            : '-8% a -12% en milieu de semaine + promo last-minute'
      const actionLos =
        score === 'A'
          ? 'minimum stay 2 nuits (3 nuits en ponts/evenements)'
          : score === 'B'
            ? 'minimum stay flexible (1-2 nuits)'
            : 'minimum stay 1 nuit pour reduire les trous calendrier'
      const actionPromo =
        score === 'A'
          ? 'eviter remises fortes, privilegier optimisation ADR'
          : score === 'B'
            ? 'promo legere ponctuelle (-5%) sur dates froides'
            : 'promo dynamique (-10% a -15%) sur dates proches non remplies'
      return {
        apartment: row.apt,
        score,
        scoreReason,
        actionPrice,
        actionLos,
        actionPromo,
      }
    })

    const suppliesRaw = localStorage.getItem(LS_SUPPLIES_ROWS)
    const supplies = suppliesRaw ? (JSON.parse(suppliesRaw) as Array<{ status?: string }>) : []
    const lowStockCount = supplies.filter((row) => (row?.status || '') !== 'OK').length
    const invoicesRaw = localStorage.getItem(LS_CLEANING_INVOICES)
    const invoices = invoicesRaw ? (JSON.parse(invoicesRaw) as Array<{ status?: string }>) : []
    const unpaidInvoicesCount = invoices.filter((row) => (row?.status || '') !== 'paid').length
    const tasksRaw = localStorage.getItem(LS_CLEANING_TASK_BOARDS)
    const taskBoards = tasksRaw ? (JSON.parse(tasksRaw) as Array<{ tasks?: Array<{ done?: boolean }> }>) : []
    const allTasks = taskBoards.flatMap((b) => (Array.isArray(b.tasks) ? b.tasks : []))
    const doneTasks = allTasks.filter((t) => t?.done).length
    const cleaningCompletionPct = allTasks.length ? (doneTasks / allTasks.length) * 100 : 0
    const watchRaw = localStorage.getItem(LS_WATCH_INTEL_SUMMARY)
    const watch = watchRaw
      ? (JSON.parse(watchRaw) as { summaryLines?: string[]; analyzedAddress?: string; monthLabel?: string })
      : null

    return {
      reservationsCount,
      newReservationsCount,
      checkInCount,
      checkOutCount,
      nightsCount,
      grossRevenueEur,
      netPayoutEur,
      avgStayNights,
      periodLabel: `${fmtLongDate(from.toISOString())} -> ${fmtLongDate(now.toISOString())}`,
      newReservationsDeltaPct: deltaPercent(newReservationsCount, previous.length),
      checkInDeltaPct: deltaPercent(checkInCount, previous.length),
      checkOutDeltaPct: deltaPercent(checkOutCount, previous.length),
      upcomingOccupancyPct,
      upcomingNights,
      upcomingPeriodLabel: `${fmtLongDate(now.toISOString())} -> ${fmtLongDate(upcomingTo.toISOString())}`,
      upcomingOutlookLabel: periodMs >= 28 * 24 * 60 * 60 * 1000 ? 'mois a venir' : 'semaine a venir',
      upcomingRecommendations: recommendations,
      demandByDayLabel: '',
      apartmentInsights: byApartment.map(
        (row) => `${row.apt}: ${row.nights} nuits projetees (${row.occupancy.toFixed(1)}% d'occupation)`,
      ),
      apartmentScoring,
      mostFilledAptLabel: mostFilled ? `${mostFilled.apt} (${mostFilled.occupancy.toFixed(1)}%)` : '',
      mostEmptyAptLabel: mostEmpty ? `${mostEmpty.apt} (${mostEmpty.occupancy.toFixed(1)}%)` : '',
      connectedApartmentsCount: apartments.length,
      dataConfidenceLabel: 'Donnees connectees (iCal + parametrage logement)',
      lowStockCount,
      unpaidInvoicesCount,
      cleaningCompletionPct,
      watchIntelSummaryLines: Array.isArray(watch?.summaryLines) ? watch?.summaryLines?.slice(0, 4) : [],
      watchIntelAddress: watch?.analyzedAddress || '',
      watchIntelMonthLabel: watch?.monthLabel || '',
    }
  }

  async function sendActivityDigestIfDue() {
    const toEmail = (email || account?.email || '').trim()
    if (!toEmail || !notifications || !digestEmailsEnabled) return
    const cadence = String(digest || 'weekly')
    const accountKey =
      String(account?.id ?? '').trim().toLowerCase() ||
      String(toEmail || '').trim().toLowerCase() ||
      'guest'
    const schedule = digestScheduleSlot(cadence)
    if (!schedule.due) return
    const storageKey = `${LS_DIGEST_LAST_SENT_PREFIX}${accountKey}_${cadence}_${schedule.slot}`
    const alreadySentForSlot = localStorage.getItem(storageKey) === '1'
    if (alreadySentForSlot) return

    const summary =
      (await summarizeActivityFromConnectedData(digestCadenceMs(cadence))) ??
      summarizeActivity(digestCadenceMs(cadence))
    try {
      const res = await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'activity_digest',
          to: toEmail,
          firstName: firstName.trim(),
          locale: mailLocale,
          cadence,
          ...summary,
        }),
      })
      if (res.ok) localStorage.setItem(storageKey, '1')
    } catch {
      // no-op
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
      setPlanPolicy(raw ? (JSON.parse(raw) as PlanChangePolicyState) : null)
    } catch {
      setPlanPolicy(null)
    }
  }, [planChangeAccountKey])

  useEffect(() => {
    if (!planPolicy) return
    const nextPlan = normalizePlanLabel(planPolicy.toPlan)
    const effectiveAt = new Date(planPolicy.effectiveAtIso)
    if (!Number.isFinite(effectiveAt.getTime()) || !nextPlan) {
      localStorage.removeItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
      setPlanPolicy(null)
      return
    }
    if (Date.now() < effectiveAt.getTime()) return
    localStorage.setItem(LS_CURRENT_PLAN, nextPlan)
    if (accountIndex >= 0) {
      const next = [...accounts]
      next[accountIndex] = { ...next[accountIndex], plan: nextPlan }
      saveStoredAccounts(next)
    }
    localStorage.removeItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
    setCurrentPlan(nextPlan)
    setPlanSelection(nextPlan)
    setPlanPolicy(null)
    setSaveMsg(`Nouveau forfait actif : ${nextPlan}.`)
  }, [accountIndex, accounts, planChangeAccountKey, planPolicy])

  function savePlanSelection() {
    const nextPlan = normalizePlanLabel(planSelection)
    if (nextPlan === currentPlan && planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime()) {
      localStorage.removeItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
      setPlanPolicy(null)
      setSaveMsg('Demande de changement annulée. Vous conservez votre forfait actuel.')
      return
    }
    if (nextPlan === currentPlan) {
      setSaveMsg('Aucun changement détecté sur le forfait.')
      return
    }
    if (billingCancellation) {
      localStorage.removeItem(LS_BILLING_CANCELLATION)
      setBillingCancellation(null)
      setShowCancelFunnel(false)
      setCancelStep(1)
      setSaveMsg(
        "Résiliation programmée annulée : vous restez abonné. Confirmez ci-dessous le changement de forfait (Starter, Pro ou Scale).",
      )
    }
    setPlanChangeConfirmOpen(true)
  }

  async function confirmPlanSelectionChange() {
    const nextPlan = normalizePlanLabel(planSelection)
    if (nextPlan === currentPlan) {
      setPlanChangeConfirmOpen(false)
      return
    }
    setPlanChangeLoading(true)
    try {
      if (billingCancellation) {
        localStorage.removeItem(LS_BILLING_CANCELLATION)
        setBillingCancellation(null)
        setShowCancelFunnel(false)
        setCancelStep(1)
      }
      const oldPlan = currentPlan
      const oldTier = getPlanTierFromValue(oldPlan)
      const nextTier = getPlanTierFromValue(nextPlan)
      const tierRank: Record<'starter' | 'pro' | 'scale', number> = { starter: 1, pro: 2, scale: 3 }
      const isUpgrade = tierRank[nextTier] > tierRank[oldTier]
      const billingDue = computeUpcomingBillingDue(planStartDateIso(), new Date())
      const effectiveAtIso = Number.isFinite(billingDue.getTime())
        ? billingDue.toISOString()
        : new Date().toISOString()
      if (isUpgrade) {
        localStorage.removeItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
        setPlanPolicy(null)
        localStorage.setItem(LS_CURRENT_PLAN, nextPlan)
        if (accountIndex >= 0) {
          const next = [...accounts]
          next[accountIndex] = { ...next[accountIndex], plan: nextPlan }
          saveStoredAccounts(next)
        }
        setCurrentPlan(nextPlan)
        setPlanSelection(nextPlan)
      } else {
        const policyPayload: PlanChangePolicyState = {
          requestedAtIso: new Date().toISOString(),
          effectiveAtIso,
          fromPlan: oldPlan,
          toPlan: nextPlan,
          changeKind: 'downgrade',
        }
        localStorage.setItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`, JSON.stringify(policyPayload))
        setPlanPolicy(policyPayload)
      }

      const targetEmail = (email || account?.email || '').trim()
      let mailSent = false
      if (targetEmail) {
        try {
          const res = await fetch('/api/cancel-subscription-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'plan_change_confirmation',
              to: targetEmail,
              firstName: firstName.trim(),
              locale: mailLocale,
              oldPlan,
              newPlan: nextPlan,
              nextBillingIso: effectiveAtIso,
            }),
          })
          mailSent = res.ok
        } catch {
          mailSent = false
        }
      }
      setSaveMsg(
        isUpgrade
          ? mailSent
            ? `Upgrade appliqué immédiatement (${oldPlan} -> ${nextPlan}). E-mail de confirmation envoyé. Nouveau tarif facturé à partir du ${fmtLongDate(
                effectiveAtIso,
              )}.`
            : `Upgrade appliqué immédiatement (${oldPlan} -> ${nextPlan}). Nouveau tarif facturé à partir du ${fmtLongDate(effectiveAtIso)}.`
          : mailSent
            ? `Downgrade programmé (${oldPlan} -> ${nextPlan}). Vous gardez vos accès actuels jusqu'au ${fmtLongDate(
                effectiveAtIso,
              )}. E-mail de confirmation envoyé.`
            : `Downgrade programmé (${oldPlan} -> ${nextPlan}). Vous gardez vos accès actuels jusqu'au ${fmtLongDate(effectiveAtIso)}.`,
      )
      // Force session refresh to avoid stale UI state after plan switch.
      window.dispatchEvent(new Event('staypilot-session-changed'))
    } catch {
      setSaveMsg("Erreur inattendue lors du changement de forfait. Réessayez s'il vous plaît.")
    } finally {
      setPlanChangeLoading(false)
      setPlanChangeConfirmOpen(false)
    }
  }

  function planStartDateIso() {
    const raw = account?.createdAt
    if (raw && Number.isFinite(new Date(raw).getTime())) return raw
    return new Date().toISOString()
  }

  function computeEndDateForCancellation(startIso: string, now = new Date()) {
    if (!Number.isFinite(new Date(startIso).getTime())) return addDays(new Date().toISOString(), 14)
    const trialEnd = addDays(startIso, 14)
    if (now < trialEnd) return trialEnd
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

  function computeUpcomingBillingDue(startIso: string, now = new Date()) {
    const start = new Date(startIso)
    if (!Number.isFinite(start.getTime())) {
      const y = now.getFullYear()
      const m = now.getMonth()
      const d = Math.min(now.getDate(), new Date(y, m + 1, 0).getDate())
      return new Date(y, m, d, 9, 0, 0, 0)
    }
    const startDay = start.getDate()
    const y = now.getFullYear()
    const m = now.getMonth()
    const daysInThisMonth = new Date(y, m + 1, 0).getDate()
    const thisMonthDue = new Date(y, m, Math.min(startDay, daysInThisMonth), 9, 0, 0, 0)
    if (Number.isFinite(thisMonthDue.getTime()) && now <= thisMonthDue) return thisMonthDue
    const nextY = m === 11 ? y + 1 : y
    const nextM = (m + 1) % 12
    const daysInNextMonth = new Date(nextY, nextM + 1, 0).getDate()
    const nextDue = new Date(nextY, nextM, Math.min(startDay, daysInNextMonth), 9, 0, 0, 0)
    return Number.isFinite(nextDue.getTime()) ? nextDue : thisMonthDue
  }

  function fmtLongDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  function fmtDateTimeFr(iso: string) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  function accessCutoffDateIso(endAtIso: string) {
    const d = new Date(endAtIso)
    d.setDate(d.getDate() + 1)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }

  function readAndSyncBillingRecovery(next: BillingRecoveryState | null) {
    if (!next) {
      localStorage.removeItem(LS_BILLING_RECOVERY)
      setBillingRecovery(null)
      return
    }
    localStorage.setItem(LS_BILLING_RECOVERY, JSON.stringify(next))
    setBillingRecovery(next)
  }

  function runBillingRecoveryEngine() {
    if (billingAutopay.paymentMethodValid) return
    const now = new Date()
    const dueDate = new Date(billingAutopay.nextDueIso)
    if (now < dueDate) return

    const elapsedMs = now.getTime() - dueDate.getTime()
    const dayIndex = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
    const expectedAttempts = Math.min(3, Math.max(1, dayIndex + 1))
    const currentRecovery =
      billingRecovery ??
      ({
        firstFailedAtIso: dueDate.toISOString(),
        retryAttempts: 0,
        suspended: false,
      } satisfies BillingRecoveryState)

    if (expectedAttempts > currentRecovery.retryAttempts) {
      const nextState: BillingRecoveryState = {
        ...currentRecovery,
        retryAttempts: expectedAttempts,
        suspended: expectedAttempts >= 3,
        lastAttemptAtIso: now.toISOString(),
      }
      readAndSyncBillingRecovery(nextState)
    }

    const suspendAtIso = suspensionDateFromFailure(dueDate.toISOString()).toISOString()
    const toEmail = (email || account?.email || '').trim()
    const attemptsToNotify = expectedAttempts - billingAutopay.lastNotifiedAttempt
    if (toEmail && attemptsToNotify > 0) {
      for (let attempt = billingAutopay.lastNotifiedAttempt + 1; attempt <= expectedAttempts; attempt += 1) {
        void sendFailedPaymentAlert(attempt, toEmail, suspendAtIso)
      }
    }

    const suspended = expectedAttempts >= 3
    if (attemptsToNotify > 0) {
      setBillingAutopay((prev) => ({
        ...prev,
        lastNotifiedAttempt: Math.max(prev.lastNotifiedAttempt, expectedAttempts),
        paymentMethodValid: suspended ? false : prev.paymentMethodValid,
      }))
      setSaveMsg(
        suspended
          ? '3e échec de prélèvement détecté. Compte suspendu tant que les coordonnées bancaires ne sont pas mises à jour.'
          : `Prélèvement échoué (${expectedAttempts}/3). Une alerte client a été envoyée.`,
      )
    }
  }

  function suspensionDateFromFailure(firstFailedAtIso: string) {
    const d = new Date(firstFailedAtIso)
    d.setDate(d.getDate() + 2)
    return d
  }

  async function sendFailedPaymentAlert(attempt: number, toEmail: string, suspendAtIso: string) {
    try {
      await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'payment_failed_alert',
          to: toEmail,
          locale: mailLocale,
          attempt,
          suspendAtIso,
        }),
      })
    } catch {
      // no-op: UI state still updates even if mail transport fails
    }
  }

  useEffect(() => {
    runBillingRecoveryEngine()
  }, [account?.email, billingAutopay, billingRecovery, email])

  useEffect(() => {
    void sendActivityDigestIfDue()
  }, [account?.email, digest, digestEmailsEnabled, email, firstName, notifications])

  function revokeScheduledCancellation() {
    localStorage.removeItem(LS_BILLING_CANCELLATION)
    setBillingCancellation(null)
    setShowCancelFunnel(false)
    setCancelStep(1)
    setSaveMsg(
      "Abonnement réactivé : la fin d'abonnement programmée a été annulée. Vous pouvez à nouveau modifier votre forfait ou lancer une nouvelle résiliation si besoin.",
    )
  }

  async function confirmCancelBilling() {
    if (planPolicy) {
      localStorage.removeItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
      setPlanPolicy(null)
    }
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
        body: JSON.stringify({ to: targetEmail, endAtIso, locale: mailLocale }),
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
      new Date() < addDays(planStartDateIso(), 14)
        ? mailSent
          ? `Résiliation confirmée pendant l'essai gratuit. Aucun débit ne sera effectué. Votre abonnement prendra fin le ${fmtLongDate(
              endAtIso,
            )}.`
          : `Résiliation confirmée pendant l'essai gratuit. Aucun débit ne sera effectué. Votre abonnement prendra fin le ${fmtLongDate(
              endAtIso,
            )}.`
        : mailSent
          ? `Résiliation confirmée. Un e-mail de confirmation a été envoyé depuis support@staypilot.fr à ${targetEmail}. Votre abonnement prendra fin le ${fmtLongDate(
              endAtIso,
            )}.`
          : `Résiliation confirmée. Envoi e-mail impossible pour le moment (configuration SMTP manquante). Votre abonnement prendra fin le ${fmtLongDate(
              endAtIso,
            )}.`,
    )
    setCancelLoading(false)
  }

  function companyInvoiceIdentity() {
    return {
      name: 'REVENDIA LLC',
      address: 'Sharjah Media City (Shams), Sharjah, UAE',
      formationNo: '2542019',
      licenseNo: '2542019.01',
    }
  }

  function generateClientInvoicePdf(invoice: ClientAutoInvoice) {
    const company = companyInvoiceIdentity()
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const issueLabel = fmtLongDate(invoice.issuedAtIso)
    const dueLabel = fmtLongDate(invoice.dueAtIso)
    const ttc = invoice.amountEur
    const ht = invoice.taxMode === 'reverse_charge' ? ttc : ttc / (1 + invoice.vatRate / 100)
    const vat = invoice.taxMode === 'reverse_charge' ? 0 : ttc - ht
    const amountHtLabel = `${ht.toFixed(2)} EUR`
    const vatLabel = `${vat.toFixed(2)} EUR`
    const amountTtcLabel = `${ttc.toFixed(2)} EUR`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.text('FACTURE CLIENT - STAYPILOT', 14, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Societe: ${company.name}`, 14, 28)
    doc.text(`Adresse: ${company.address}`, 14, 34)
    doc.text(`Formation: ${company.formationNo} | Licence: ${company.licenseNo}`, 14, 40)

    doc.setFont('helvetica', 'bold')
    doc.text('Facture pour', 14, 52)
    doc.setFont('helvetica', 'normal')
    doc.text(`Client: ${invoice.clientName}`, 14, 58)
    doc.text(`E-mail: ${invoice.clientEmail}`, 14, 64)
    doc.text(`Bien: ${invoice.apartment}`, 14, 70)

    doc.setFont('helvetica', 'bold')
    doc.text('Ligne de facturation', 14, 84)
    doc.setFont('helvetica', 'normal')
    doc.text(`Description: Abonnement StayPilot - ${invoice.planLabel}`, 14, 90)
    doc.text(`Date emission: ${issueLabel}`, 14, 96)
    doc.text(`Date échéance: ${dueLabel}`, 14, 102)
    doc.text(`Montant HT: ${amountHtLabel}`, 14, 108)
    doc.text(`TVA (${invoice.vatRate}%): ${vatLabel}`, 14, 114)
    doc.text(`Montant TTC: ${amountTtcLabel}`, 14, 120)
    doc.text(`Type client: ${invoice.clientType.toUpperCase()} - Pays: ${invoice.countryCode}`, 14, 126)
    doc.text(
      invoice.taxMode === 'reverse_charge'
        ? 'Mention fiscale: Autoliquidation de la TVA (B2B).'
        : `Mention fiscale: TVA collectee selon le taux ${invoice.vatRate}% (${invoice.countryCode}).`,
      14,
      132,
    )

    doc.setFontSize(10)
    doc.text(
      "Paiement : le changement de forfait n'est pas débité immédiatement. Le nouveau tarif s'applique à la prochaine échéance.",
      14,
      140,
    )

    doc.setFont('helvetica', 'bold')
    doc.text('Merci pour votre confiance.', 14, 154)

    const out = `facture-client-${invoice.clientName.toLowerCase().replace(/\s+/g, '-')}-${invoice.id}.pdf`
    doc.save(out)
  }

  async function savePaymentDetails() {
    if (paymentSaveLoading) return
    if (!paymentCanSubmitLocal) {
      setSaveMsg('Complétez correctement tous les champs avant la vérification Stripe.')
      return
    }
    setPaymentSaveLoading(true)
    try {
      const digits = paymentCardNumber.replace(/\D/g, '')
      if (digits.length < 13 || digits.length > 19) {
        setSaveMsg('Veuillez saisir un numero de carte valide.')
        return
      }
      if (!luhnCheck(digits)) {
        setSaveMsg('Numero de carte invalide. Verifiez les chiffres saisis.')
        return
      }
      const cvcDigits = paymentCvc.replace(/\D/g, '')
      if (cvcDigits.length !== 3) {
        setSaveMsg('Veuillez saisir un code de securite a 3 chiffres.')
        return
      }
      if (!expiryIsValid(paymentExpiry.trim()) || !paymentHolder.trim()) {
        setSaveMsg('Veuillez completer les coordonnees bancaires (carte + titulaire + expiration + code securite).')
        return
      }
      if (paymentHolder.trim().length < 3) {
        setSaveMsg('Nom du titulaire invalide.')
        return
      }
      try {
        const verifyRes = await fetch('/api/verify-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: digits,
            expiry: paymentExpiry.trim(),
            cvc: cvcDigits,
          }),
        })
        if (!verifyRes.ok) {
          let errorCode = 'card_verification_failed'
          try {
            const payload = (await verifyRes.json()) as { error?: string }
            if (payload?.error) errorCode = payload.error
          } catch {
            errorCode = 'card_verification_failed'
          }
          setSaveMsg(`Carte refusée par Stripe (${errorCode}). Utilisez une carte valide.`)
          return
        }
      } catch {
        setSaveMsg('Vérification bancaire indisponible pour le moment. Réessayez.')
        return
      }
      const normalizedNumber = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
      const verifiedAt = new Date().toISOString()
      localStorage.setItem(
        LS_PAYMENT_DETAILS,
        JSON.stringify({
          cardNumber: normalizedNumber,
          expiry: paymentExpiry.trim(),
          holder: paymentHolder.trim(),
          stripeVerifiedAt: verifiedAt,
        }),
      )
      setPaymentCardNumber(normalizedNumber)
      setPaymentExpiry(formatExpiryInput(paymentExpiry))
      setPaymentCvc(cvcDigits)
      setCardStripeVerifiedAtIso(verifiedAt)
      setBillingAutopay((prev) => ({ ...prev, paymentMethodValid: true }))
      readAndSyncBillingRecovery(null)
      setSaveMsg(
        `Carte validée par Stripe le ${fmtDateTimeFr(verifiedAt)}. Elle sera utilisée pour les prochains prélèvements.`,
      )
    } finally {
      setPaymentSaveLoading(false)
    }
  }

  function otpStorageKeyForEmail(targetEmail: string) {
    return `${LS_PASSWORD_OTP_PREFIX}${targetEmail.trim().toLowerCase()}`
  }

  function createSixDigitCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
  }

  function storeOtpForEmail(targetEmail: string, code: string) {
    const key = otpStorageKeyForEmail(targetEmail)
    localStorage.setItem(
      key,
      JSON.stringify({
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
      }),
    )
  }

  function verifyOtpForEmail(targetEmail: string, codeInput: string) {
    const key = otpStorageKeyForEmail(targetEmail)
    const raw = localStorage.getItem(key)
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

  function clearOtpForEmail(targetEmail: string) {
    localStorage.removeItem(otpStorageKeyForEmail(targetEmail))
  }

  async function requestPasswordOtp(flow: 'change' | 'forgot') {
    const targetEmail = (email || account?.email || '').trim()
    if (!targetEmail) {
      setSaveMsg("Adresse e-mail manquante pour envoyer le code.")
      return
    }
    if (!account?.username?.trim()) {
      setSaveMsg('Compte incomplet (identifiant manquant).')
      return
    }
    if (flow === 'change') setPasswordOtpSending(true)
    else setForgotOtpSending(true)
    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (st.remoteAuth) {
        const res = await fetch('/api/auth-password-otp-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: account.username.trim() }),
        })
        if (res.status === 404) {
          setSaveMsg('Compte introuvable.')
          return
        }
        if (!res.ok) {
          setSaveMsg("Impossible d'envoyer le code pour le moment.")
          return
        }
        if (flow === 'change') {
          setPasswordOtpRequested(true)
          setPasswordOtpInput('')
          setPasswordOtpValidated(false)
        } else {
          setForgotOtpRequested(true)
          setForgotOtpInput('')
          setForgotOtpValidated(false)
        }
        setSaveMsg(`Code de vérification envoyé à ${targetEmail}.`)
        return
      }
    } catch {
      /* local fallback */
    }
    const code = createSixDigitCode()
    try {
      const res = await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'password_verification_code',
          to: targetEmail,
          firstName: firstName.trim(),
          locale: mailLocale,
          code,
        }),
      })
      if (!res.ok) {
        setSaveMsg("Impossible d'envoyer le code pour le moment.")
        return
      }
      storeOtpForEmail(targetEmail, code)
      if (flow === 'change') {
        setPasswordOtpRequested(true)
        setPasswordOtpInput('')
        setPasswordOtpValidated(false)
      } else {
        setForgotOtpRequested(true)
        setForgotOtpInput('')
        setForgotOtpValidated(false)
      }
      setSaveMsg(`Code de vérification envoyé à ${targetEmail}.`)
    } catch {
      setSaveMsg("Impossible d'envoyer le code pour le moment.")
    } finally {
      if (flow === 'change') setPasswordOtpSending(false)
      else setForgotOtpSending(false)
    }
  }

  async function changePassword() {
    if (accountIndex < 0 || !account) {
      setSaveMsg('Compte introuvable.')
      return
    }
    if (!currentPasswordInput.trim() || !newPasswordInput.trim() || !confirmPasswordInput.trim()) {
      setSaveMsg('Veuillez remplir tous les champs de securite.')
      return
    }
    if (currentPasswordInput !== account.password) {
      setSaveMsg('Mot de passe actuel incorrect.')
      return
    }
    if (newPasswordInput.length < 8) {
      setSaveMsg('Le nouveau mot de passe doit contenir au moins 8 caracteres.')
      return
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setSaveMsg('La confirmation du nouveau mot de passe ne correspond pas.')
      return
    }
    const targetEmail = (email || account.email || '').trim()
    if (!passwordOtpRequested || !passwordOtpValidated) {
      setSaveMsg('Veuillez demander un code de vérification à 6 chiffres.')
      return
    }
    if (!/^\d{6}$/.test(passwordOtpInput.trim())) {
      setSaveMsg('Veuillez saisir un code de vérification à 6 chiffres.')
      return
    }
    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (st.remoteAuth) {
        setPasswordLoading(true)
        let res: Response
        try {
          res = await fetch('/api/auth-update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: account.username.trim(),
              oldPassword: currentPasswordInput,
              newPassword: newPasswordInput,
            }),
          })
        } catch {
          setPasswordLoading(false)
          setSaveMsg('Mise à jour impossible pour le moment.')
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setPasswordLoading(false)
          if (res.status === 401) setSaveMsg('Mot de passe actuel incorrect.')
          else setSaveMsg('Mise à jour impossible pour le moment.')
          return
        }
        if (Array.isArray(data.accounts)) saveStoredAccounts(data.accounts as StoredAccount[])
        let mailSent = false
        if (targetEmail) {
          try {
            const mailRes = await fetch('/api/cancel-subscription-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: 'password_changed_confirmation',
                to: targetEmail,
                firstName: firstName.trim(),
                locale: mailLocale,
                changedAtIso: new Date().toISOString(),
              }),
            })
            mailSent = mailRes.ok
          } catch {
            mailSent = false
          }
        }
        setCurrentPasswordInput('')
        setNewPasswordInput('')
        setConfirmPasswordInput('')
        setPasswordOtpInput('')
        setPasswordOtpRequested(false)
        setPasswordOtpValidated(false)
        setPasswordLoading(false)
        setSaveMsg(
          mailSent
            ? `Mot de passe mis à jour. E-mail de confirmation envoyé à ${targetEmail}.`
            : 'Mot de passe mis a jour. Envoi e-mail non disponible pour le moment.',
        )
        return
      }
    } catch {
      /* local fallback */
    }
    if (!verifyOtpForEmail(targetEmail, passwordOtpInput)) {
      setSaveMsg('Code invalide ou expire. Demandez un nouveau code.')
      return
    }
    setPasswordLoading(true)
    const next = [...accounts]
    next[accountIndex] = { ...next[accountIndex], password: newPasswordInput }
    saveStoredAccounts(next)
    clearOtpForEmail(targetEmail)
    let mailSent = false
    if (targetEmail) {
      try {
        const res = await fetch('/api/cancel-subscription-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'password_changed_confirmation',
            to: targetEmail,
            firstName: firstName.trim(),
            locale: mailLocale,
            changedAtIso: new Date().toISOString(),
          }),
        })
        mailSent = res.ok
      } catch {
        mailSent = false
      }
    }
    setCurrentPasswordInput('')
    setNewPasswordInput('')
    setConfirmPasswordInput('')
    setPasswordOtpInput('')
    setPasswordOtpRequested(false)
    setPasswordLoading(false)
    setSaveMsg(
      mailSent
        ? `Mot de passe mis à jour. E-mail de confirmation envoyé à ${targetEmail}.`
        : 'Mot de passe mis a jour. Envoi e-mail non disponible pour le moment.',
    )
  }

  async function resetPasswordFromForgot() {
    if (accountIndex < 0 || !account) {
      setSaveMsg('Compte introuvable.')
      return
    }
    if (!forgotNewPasswordInput.trim() || !forgotConfirmPasswordInput.trim()) {
      setSaveMsg('Veuillez remplir les champs de reinitialisation.')
      return
    }
    if (forgotNewPasswordInput.length < 8) {
      setSaveMsg('Le nouveau mot de passe doit contenir au moins 8 caracteres.')
      return
    }
    if (forgotNewPasswordInput !== forgotConfirmPasswordInput) {
      setSaveMsg('La confirmation du nouveau mot de passe ne correspond pas.')
      return
    }
    const targetEmail = (email || account.email || '').trim()
    if (!forgotOtpRequested || !forgotOtpValidated) {
      setSaveMsg('Veuillez demander un code de vérification à 6 chiffres.')
      return
    }
    if (!/^\d{6}$/.test(forgotOtpInput.trim())) {
      setSaveMsg('Veuillez saisir un code de vérification à 6 chiffres.')
      return
    }
    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (st.remoteAuth) {
        setForgotPasswordLoading(true)
        let res: Response
        try {
          res = await fetch('/api/auth-forgot-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: account.username.trim(),
              code: forgotOtpInput.trim(),
              newPassword: forgotNewPasswordInput,
            }),
          })
        } catch {
          setForgotPasswordLoading(false)
          setSaveMsg('Reinitialisation impossible pour le moment.')
          return
        }
        const data = await res.json().catch(() => ({}))
        setForgotPasswordLoading(false)
        if (!res.ok) {
          setSaveMsg(
            data?.error === 'invalid_code' || data?.error === 'otp_expired'
              ? 'Code invalide ou expire. Demandez un nouveau code.'
              : 'Reinitialisation impossible pour le moment.',
          )
          return
        }
        if (Array.isArray(data.accounts)) saveStoredAccounts(data.accounts as StoredAccount[])
        let mailSent = false
        if (targetEmail) {
          try {
            const mailRes = await fetch('/api/cancel-subscription-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: 'password_reset_confirmation',
                to: targetEmail,
                firstName: firstName.trim(),
                locale: mailLocale,
                resetAtIso: new Date().toISOString(),
              }),
            })
            mailSent = mailRes.ok
          } catch {
            mailSent = false
          }
        }
        setForgotNewPasswordInput('')
        setForgotConfirmPasswordInput('')
        setForgotOtpInput('')
        setForgotOtpRequested(false)
        setForgotOtpValidated(false)
        setForgotPasswordOpen(false)
        setSaveMsg(
          mailSent
            ? `Mot de passe réinitialisé. E-mail de confirmation envoyé à ${targetEmail}.`
            : 'Mot de passe réinitialisé. Envoi e-mail non disponible pour le moment.',
        )
        return
      }
    } catch {
      /* local fallback */
    }
    if (!verifyOtpForEmail(targetEmail, forgotOtpInput)) {
      setSaveMsg('Code invalide ou expire. Demandez un nouveau code.')
      return
    }

    setForgotPasswordLoading(true)
    const next = [...accounts]
    next[accountIndex] = { ...next[accountIndex], password: forgotNewPasswordInput }
    saveStoredAccounts(next)
    clearOtpForEmail(targetEmail)
    let mailSent = false
    if (targetEmail) {
      try {
        const res = await fetch('/api/cancel-subscription-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'password_reset_confirmation',
            to: targetEmail,
            firstName: firstName.trim(),
            locale: mailLocale,
            resetAtIso: new Date().toISOString(),
          }),
        })
        mailSent = res.ok
      } catch {
        mailSent = false
      }
    }
    setForgotNewPasswordInput('')
    setForgotConfirmPasswordInput('')
    setForgotOtpInput('')
    setForgotOtpRequested(false)
    setForgotOtpValidated(false)
    setForgotPasswordOpen(false)
    setForgotPasswordLoading(false)
    setSaveMsg(
      mailSent
        ? `Mot de passe réinitialisé. E-mail de confirmation envoyé à ${targetEmail}.`
        : 'Mot de passe réinitialisé. Envoi e-mail non disponible pour le moment.',
    )
  }

  async function validatePasswordOtp(flow: 'change' | 'forgot') {
    const targetEmail = (email || account?.email || '').trim()
    if (!targetEmail) {
      setSaveMsg("Adresse e-mail manquante pour vérifier le code.")
      return
    }
    if (!account?.username?.trim()) {
      setSaveMsg('Compte incomplet (identifiant manquant).')
      return
    }
    const input = flow === 'change' ? passwordOtpInput : forgotOtpInput
    if (!/^\d{6}$/.test(input.trim())) {
      setSaveMsg('Veuillez saisir un code de vérification à 6 chiffres.')
      return
    }
    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (st.remoteAuth) {
        const res = await fetch('/api/auth-verify-password-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: account.username.trim(), code: input.trim() }),
        })
        if (!res.ok) {
          setSaveMsg('Code invalide ou expire. Demandez un nouveau code.')
          return
        }
        if (flow === 'change') setPasswordOtpValidated(true)
        else setForgotOtpValidated(true)
        setSaveMsg('Code valide. Vous pouvez maintenant modifier le mot de passe.')
        return
      }
    } catch {
      /* local fallback */
    }
    if (!verifyOtpForEmail(targetEmail, input)) {
      setSaveMsg('Code invalide ou expire. Demandez un nouveau code.')
      return
    }
    if (flow === 'change') setPasswordOtpValidated(true)
    else setForgotOtpValidated(true)
    setSaveMsg('Code valide. Vous pouvez maintenant modifier le mot de passe.')
  }

  const trialEndDate = addDays(planStartDateIso(), 14)
  const isTrialActive = new Date() < trialEndDate
  const latestInvoice = clientInvoices[0]

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
            Espace compte : informations personnelles, plan, préférences, avis et sécurité.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <TabButton label="Informations personnelles" active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
            {!isCleanerSession ? (
              <>
                <TabButton label="Plan" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
                <TabButton label="Facture" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
                <TabButton label="Préférences" active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} />
                <TabButton label="Ajouter un avis" active={activeTab === 'review'} onClick={() => setActiveTab('review')} />
              </>
            ) : null}
            <TabButton label="Sécurité" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          </div>

          {saveMsg ? (
            <div
              className={`mt-4 rounded-lg border px-3 py-2 text-sm font-semibold ${
                profileSaveMessageLooksLikeError(saveMsg)
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
              role="status"
              aria-live="polite"
            >
              {saveMsg}
            </div>
          ) : null}

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
              {billingCancellation ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <p className="font-semibold">Résiliation déjà programmée</p>
                  <p className="mt-1">
                    Votre abonnement est en cours de résiliation et prendra fin le{' '}
                    <strong>{fmtLongDate(billingCancellation.endAtIso)}</strong>.
                  </p>
                  <p className="mt-1 text-xs">
                    Tant qu’une fin d’abonnement est programmée, évitez de cumuler d’autres actions contradictoires. Vous
                    pouvez <strong>réactiver</strong> ci-dessous, ou lancer un <strong>changement de forfait</strong> :
                    dans ce cas la résiliation programmée est annulée automatiquement pour rester cohérent avec Stripe.
                  </p>
                  <button
                    type="button"
                    onClick={revokeScheduledCancellation}
                    className="mt-3 inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                  >
                    Réactiver mon abonnement (annuler la résiliation)
                  </button>
                </div>
              ) : null}
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Plan actif</p>
                <p className="mt-1 text-lg font-bold text-sky-900">{currentPlan}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Modifier mon plan</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Validation obligatoire avant changement. Si un changement est déjà programmé, vous pouvez le modifier
                  ou l'annuler à tout moment avant la prochaine échéance.
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-600">
                  En cas de changement aujourd’hui, vous gardez votre tarif actuel jusqu’à la prochaine échéance. Le
                  nouveau montant est débité uniquement le mois prochain.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={planSelection}
                    onChange={(e) => setPlanSelection(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="Starter">Plan 1 - Starter</option>
                    <option value="Pro">Plan 2 - Pro</option>
                    <option value="Scale">Plan 3 - Scale</option>
                  </select>
                  <button
                    type="button"
                    onClick={savePlanSelection}
                    className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Valider le changement
                  </button>
                </div>
              </div>
              {planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime() ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <p className="font-semibold">Changement déjà programmé</p>
                  <p className="mt-1">
                    {planPolicy.fromPlan} vers {planPolicy.toPlan} (prise d’effet le{' '}
                    <strong>{fmtLongDate(planPolicy.effectiveAtIso)}</strong>).
                  </p>
                  {planPolicy.changeKind === 'downgrade' ? (
                    <p className="mt-1 text-xs">
                      Les accès du forfait actuel restent actifs jusqu'à cette date, puis les accès seront alignés sur le
                      forfait inférieur.
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs">
                    Vous pouvez encore modifier cette demande ou revenir au forfait actuel avant cette date.
                  </p>
                </div>
              ) : null}
              {planChangeConfirmOpen ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Validation finale du changement de forfait</p>
                  <p className="mt-1">
                    Vous passez de <strong>{currentPlan}</strong> à <strong>{planSelection}</strong>. Le nouveau montant
                    sera débité uniquement à la prochaine échéance mensuelle.
                  </p>
                  {(() => {
                    const currentTier = getPlanTierFromValue(currentPlan)
                    const targetTier = getPlanTierFromValue(planSelection)
                    const rank: Record<'starter' | 'pro' | 'scale', number> = { starter: 1, pro: 2, scale: 3 }
                    const upgrading = rank[targetTier] > rank[currentTier]
                    return (
                      <p className="mt-1 text-xs">
                        {upgrading
                          ? "Accès au forfait supérieur activés immédiatement. La facturation du nouveau montant démarre à la prochaine échéance."
                          : "En cas de downgrade, vous gardez les accès actuels jusqu'à la prochaine échéance puis les accès passent au forfait inférieur."}
                      </p>
                    )
                  })()}
                  <p className="mt-1 text-xs">
                    Une fois confirmé, ce changement est verrouillé jusqu’à la prochaine échéance de facturation.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={confirmPlanSelectionChange}
                      disabled={planChangeLoading}
                      className="inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {planChangeLoading ? 'Validation...' : 'Confirmer le changement'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanChangeConfirmOpen(false)}
                      className="inline-flex rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">Comparer les 3 offres</p>
                <p className="mt-1 text-xs text-zinc-500">Version premium inspiree des cartes de l accueil</p>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50 to-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Plan 1</p>
                    <p className="mt-1 text-lg font-bold text-zinc-900">{pricing.starterName}</p>
                    <p className="mt-1 text-2xl font-bold text-sky-800">{formatEuroForLocale(pricingLocale, starterHt)} HT</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatEuroForLocale(pricingLocale, starterTtc)} TTC / mois</p>
                    <p className="mt-1 text-xs text-zinc-500">{pricing.starterRange}</p>
                    <ul className="mt-3 space-y-1.5 text-xs text-zinc-700">
                      {pricing.starterFeatures.map((feature, index) => (
                        <li key={`starter-${index}`}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative rounded-2xl border border-blue-300/60 bg-gradient-to-b from-[#4a86f7] to-[#3b76e8] p-4 text-white shadow-[0_16px_34px_-14px_rgba(59,118,232,0.85)] ring-1 ring-blue-300/60">
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                      Le plus choisi
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Plan 2</p>
                    <p className="mt-1 text-lg font-bold">{pricing.proName}</p>
                    <p className="mt-1 text-2xl font-bold">{formatEuroForLocale(pricingLocale, proHt)} HT</p>
                    <p className="mt-0.5 text-xs text-blue-100">{formatEuroForLocale(pricingLocale, proTtc)} TTC / mois</p>
                    <p className="mt-1 text-xs text-blue-100">{pricing.proRange}</p>
                    <ul className="mt-3 space-y-1.5 text-xs text-white/95">
                      {pricing.proFeatures.map((feature, index) => (
                        <li key={`pro-${index}`}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50 to-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Plan 3</p>
                    <p className="mt-1 text-lg font-bold text-zinc-900">{pricing.scaleName}</p>
                    <p className="mt-1 text-2xl font-bold text-violet-800">{formatEuroForLocale(pricingLocale, scaleHt)} HT</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatEuroForLocale(pricingLocale, scaleTtc)} TTC / mois</p>
                    <p className="mt-1 text-xs text-zinc-500">{pricing.scaleRange}</p>
                    <ul className="mt-3 space-y-1.5 text-xs text-zinc-700">
                      {pricing.scaleFeatures.map((feature, index) => (
                        <li key={`scale-${index}`}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Statut paiement :{' '}
                {billingRecovery?.suspended
                  ? 'Suspendu (coordonnees bancaires requises)'
                  : billingCancellation
                    ? 'Résiliation programmée'
                    : 'Actif'}
              </div>

              {billingRecovery ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    billingRecovery.suspended
                      ? 'border border-rose-200 bg-rose-50 text-rose-900'
                      : 'border border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <p className="font-semibold">
                    {billingRecovery.suspended
                      ? 'Compte suspendu apres 3 echecs de prelevement'
                      : `Prelevement en recouvrement (${billingRecovery.retryAttempts}/3)`}
                  </p>
                  <p className="mt-1">
                    {billingRecovery.suspended
                      ? 'L acces est bloque jusqu a la mise a jour des coordonnees bancaires.'
                      : `Nouvelle tentative automatique chaque jour. Suspension au 3e echec.`}
                  </p>
                </div>
              ) : null}

              {billingCancellation ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Résiliation enregistrée</p>
                  <p className="mt-1">
                    Votre abonnement restera actif jusqu’au <strong>{fmtLongDate(billingCancellation.endAtIso)}</strong>.
                  </p>
                  <p className="mt-1">
                    A partir du <strong>{fmtLongDate(accessCutoffDateIso(billingCancellation.endAtIso))}</strong>,
                    vous n aurez plus acces aux services premium.
                  </p>
                  <p className="mt-1 text-xs">
                    E-mail envoyé à <strong>{billingCancellation.email}</strong> avec confirmation de résiliation.
                  </p>
                  <button
                    type="button"
                    onClick={revokeScheduledCancellation}
                    className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                  >
                    Réactiver mon abonnement
                  </button>
                  <p className="mt-2 text-xs text-amber-950/80">
                    Après réactivation, vous pouvez changer de forfait (Starter, Pro ou Scale) avec « Modifier mon plan »
                    ci-dessus.
                  </p>
                </div>
              ) : null}

              {billingCancellation ? (
                <p className="text-xs text-zinc-600">
                  Une résiliation est déjà programmée. Utilisez d&apos;abord <strong>Réactiver mon abonnement</strong>{' '}
                  ci-dessus si vous souhaitez lancer une nouvelle demande de fin d&apos;abonnement.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelFunnel((v) => !v)
                    setCancelStep(1)
                  }}
                  className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Annuler mon abonnement
                </button>
              )}

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
                      {new Date() < addDays(planStartDateIso(), 14) ? (
                        <p className="text-sm text-zinc-700">
                          Résiliation pendant essai gratuit : <strong>aucun débit ne sera effectué</strong>.
                        </p>
                      ) : null}
                      <p className="text-sm text-zinc-700">
                        Règle appliquée automatiquement aujourd hui : abonnement demarre le{' '}
                        <strong>{fmtLongDate(planStartDateIso())}</strong>, demande faite le{' '}
                        <strong>{fmtLongDate(new Date().toISOString())}</strong> puis fin le{' '}
                        <strong>{fmtLongDate(computeEndDateForCancellation(planStartDateIso()).toISOString())}</strong>.
                      </p>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                        Un e-mail de confirmation sera envoyé avec la date de fin d abonnement et la date exacte de
                        perte d acces.
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
                  <p className="mt-1">
                    A partir du <strong>{fmtLongDate(accessCutoffDateIso(billingCancellation.endAtIso))}</strong>, vous
                    n aurez plus acces aux services premium.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'billing' ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Statut de facturation</p>
                {isTrialActive ? (
                  <p className="mt-1 text-sm text-zinc-700">
                    Essai gratuit actif jusqu&apos;au <strong>{fmtLongDate(trialEndDate.toISOString())}</strong>. Aucune
                    facture disponible avant le premier paiement.
                  </p>
                ) : latestInvoice ? (
                  <p className="mt-1 text-sm text-zinc-700">
                    Dernière facture: plan <strong>{latestInvoice.planLabel}</strong> —{' '}
                    <strong>{latestInvoice.amountEur.toFixed(2)} EUR</strong> — émise le{' '}
                    <strong>{fmtLongDate(latestInvoice.issuedAtIso)}</strong>.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-700">
                    Aucun paiement validé pour le moment. Les factures apparaîtront automatiquement après paiement.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Mode de paiement</p>
                {billingAutopay.paymentMethodValid ? (
                  <div className="mt-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-800">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                      Carte acceptée par Stripe
                    </p>
                    <p className="text-sm text-zinc-700">
                      <span className="font-mono tabular-nums">{maskCardNumberDisplay(paymentCardNumber)}</span>
                      {' — expiration '}
                      <strong>{paymentExpiry}</strong>
                    </p>
                    {cardStripeVerifiedAtIso ? (
                      <p className="text-xs text-zinc-600">
                        Confirmation enregistrée le <strong>{fmtDateTimeFr(cardStripeVerifiedAtIso)}</strong>.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-amber-900">
                    Aucune carte vérifiée par Stripe pour le moment. Complétez le formulaire (numéro complet, date
                    valide, CVC), puis cliquez sur <strong>Enregistrer</strong>. Si la carte est acceptée, une pastille
                    verte « Carte acceptée par Stripe » apparaît ici avec la date et l&apos;heure de confirmation.
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  Prochaine échéance automatique : {fmtLongDate(billingAutopay.nextDueIso)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Fiscalité : B2B = autoliquidation sur facture. B2C = TVA adaptée selon le pays client.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">Coordonnées bancaires</p>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Espace sécurisé
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Mettez à jour votre moyen de paiement pour éviter les échecs de prélèvement et les interruptions de
                  service.
                </p>
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  {billingAutopay.paymentMethodValid ? (
                    <p>
                      Moyen enregistré (vérifié Stripe) : carte{' '}
                      <strong className="font-mono tabular-nums">{maskCardNumberDisplay(paymentCardNumber)}</strong> —
                      expiration <strong>{paymentExpiry}</strong>
                      {cardStripeVerifiedAtIso ? (
                        <>
                          {' '}
                          — validée le <strong>{fmtDateTimeFr(cardStripeVerifiedAtIso)}</strong>
                        </>
                      ) : null}
                    </p>
                  ) : (
                    <p>
                      Aucun moyen de paiement enregistré pour le moment : ce qui est saisi dans le formulaire
                      n&apos;est <strong>pas</strong> considéré comme actif tant que l&apos;enregistrement Stripe n&apos;a
                      pas réussi (une fausse carte ou un refus Stripe ne crée donc pas de « moyen actuel »).
                    </p>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <InputField
                    label="Numéro de carte"
                    value={paymentCardNumber}
                    onChange={(v) => setPaymentCardNumber(formatCardNumberInput(v))}
                    onFocus={() => {
                      if (paymentCardNumber.trim()) setPaymentCardNumber('')
                    }}
                    autoComplete="cc-number"
                    inputMode="numeric"
                    inputClassName="text-transparent [text-shadow:0_0_0_#9ca3af] focus:text-zinc-900 focus:[text-shadow:none]"
                  />
                  <InputField
                    label="Date d'expiration (MM/AA)"
                    value={paymentExpiry}
                    onChange={(v) => setPaymentExpiry(formatExpiryInput(v))}
                    onFocus={() => {
                      if (paymentExpiry.trim()) setPaymentExpiry('')
                    }}
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    inputClassName="text-transparent [text-shadow:0_0_0_#9ca3af] focus:text-zinc-900 focus:[text-shadow:none]"
                  />
                  <InputField
                    label="Nom du titulaire"
                    value={paymentHolder}
                    onChange={setPaymentHolder}
                    autoComplete="cc-name"
                  />
                  <InputField
                    label="Code de sécurité (CVC, 3 chiffres)"
                    value={paymentCvc}
                    onChange={(v) => setPaymentCvc(formatCvcInput(v))}
                    onFocus={() => {
                      if (paymentCvc.trim()) setPaymentCvc('')
                    }}
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    inputClassName="text-transparent [text-shadow:0_0_0_#9ca3af] focus:text-zinc-900 focus:[text-shadow:none]"
                  />
                </div>
                {paymentLocalIssues.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                    <p className="font-semibold">À corriger avant enregistrement</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {paymentLocalIssues.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    Vérification locale (format, date, CVC), puis validation Stripe au clic sur Enregistrer.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={paymentSaveLoading || !paymentCanSubmitLocal}
                    title={!paymentCanSubmitLocal ? 'Remplissez tous les champs correctement pour activer la vérification Stripe.' : undefined}
                    onClick={() => {
                      void savePaymentDetails()
                    }}
                    className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentSaveLoading ? 'Vérification Stripe en cours…' : 'Enregistrer les nouvelles coordonnées'}
                  </button>
                  <p className="text-xs text-zinc-500">
                    Le nouveau moyen de paiement sera utilisé à la prochaine échéance.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">Facturation clients automatique</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Les factures sont générées automatiquement uniquement après paiement réussi. Aucune facture n&apos;est
                  disponible pendant les 14 jours d&apos;essai gratuit.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-zinc-700">
                    Type de client
                    <select
                      value={invoiceClientType}
                      onChange={(e) => setInvoiceClientType((e.target.value as 'b2b' | 'b2c') || 'b2c')}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="b2c">B2C (TVA selon pays)</option>
                      <option value="b2b">B2B (autoliquidation)</option>
                    </select>
                  </label>
                  <label className="text-xs text-zinc-700">
                    Pays du client (code ISO)
                    <input
                      value={invoiceCountryCode}
                      onChange={(e) => setInvoiceCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="FR"
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                </div>
                {clientInvoices.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs font-semibold text-zinc-700">Dernieres factures generees</p>
                    <div className="mt-2 space-y-1 text-xs text-zinc-600">
                      {clientInvoices.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5">
                          <p>
                            {inv.clientName} - {inv.planLabel} - {inv.amountEur.toFixed(2)} EUR - échéance{' '}
                            {fmtLongDate(inv.dueAtIso)} - {inv.clientType.toUpperCase()}{' '}
                            {inv.taxMode === 'reverse_charge' ? '(autoliquidation)' : `(TVA ${inv.vatRate}%)`}
                          </p>
                          <button
                            type="button"
                            onClick={() => generateClientInvoicePdf(inv)}
                            className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                          >
                            PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                    Aucune facture encore. Une facture sera créée automatiquement pour la prochaine échéance active.
                  </div>
                )}
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
              <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={digestEmailsEnabled}
                  onChange={(e) => setDigestEmailsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                />
                Activer les e-mails de synthèse (hebdomadaire/mensuel)
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={savePreferences}
                  className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Enregistrer les préférences
                </button>
                <p className="mt-2 text-xs text-zinc-500">
                  Un e-mail de synthèse est envoyé automatiquement selon la fréquence choisie (hebdomadaire ou
                  mensuel), avec un recap reservations, nuits, revenu estime et recommandations prix calendrier.
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === 'security' ? (
            <div className="mt-5 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Sécurité du compte</p>
              <p>Dernière connexion : session locale active</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-zinc-700 sm:col-span-2">
                  Mot de passe actuel
                  <div className="relative mt-1">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                      aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                </label>
                <label className="text-xs text-zinc-700">
                  Nouveau mot de passe
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                      aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                </label>
                <label className="text-xs text-zinc-700">
                  Confirmer le nouveau mot de passe
                  <div className="relative mt-1">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                      aria-label={showConfirmNewPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                    >
                      {showConfirmNewPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={() => void changePassword()}
                disabled={passwordLoading || !passwordOtpValidated}
                className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? 'Mise a jour...' : 'Changer mon mot de passe'}
              </button>
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-xs font-medium text-zinc-700">
                  Verification 2FA par e-mail (code 6 chiffres) obligatoire avant changement.
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div className={`rounded-md border px-2 py-1 text-center font-semibold ${passwordOtpRequested ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                    1. Envoyer le code
                  </div>
                  <div className={`rounded-md border px-2 py-1 text-center font-semibold ${passwordOtpValidated ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                    2. Valider le code
                  </div>
                  <div className={`rounded-md border px-2 py-1 text-center font-semibold ${passwordOtpValidated ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                    3. Changer le mot de passe
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void requestPasswordOtp('change')}
                    disabled={passwordOtpSending}
                    className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passwordOtpSending ? 'Envoi code...' : 'Envoyer le code'}
                  </button>
                  <input
                    value={passwordOtpInput}
                    onChange={(e) => {
                      setPasswordOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setPasswordOtpValidated(false)
                    }}
                    placeholder="Code 6 chiffres"
                    className="w-40 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => void validatePasswordOtp('change')}
                    disabled={!passwordOtpRequested}
                    className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Valider le code
                  </button>
                </div>
                {passwordOtpValidated ? <p className="mt-1 text-xs font-semibold text-emerald-700">Code valide.</p> : null}
              </div>
              <p className="text-xs text-zinc-500">
                Un e-mail de confirmation est envoyé automatiquement après chaque changement de mot de passe.
              </p>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen((v) => !v)}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                {forgotPasswordOpen ? 'Fermer' : 'Mot de passe oublie ?'}
              </button>
              {forgotPasswordOpen ? (
                <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
                  <p className="text-xs text-zinc-600">
                    Reinitialisation locale du mot de passe. Une confirmation est envoyee par e-mail.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className={`rounded-md border px-2 py-1 text-center font-semibold ${forgotOtpRequested ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                      1. Envoyer le code
                    </div>
                    <div className={`rounded-md border px-2 py-1 text-center font-semibold ${forgotOtpValidated ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                      2. Valider le code
                    </div>
                    <div className={`rounded-md border px-2 py-1 text-center font-semibold ${forgotOtpValidated ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                      3. Reinitialiser
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void requestPasswordOtp('forgot')}
                      disabled={forgotOtpSending}
                      className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {forgotOtpSending ? 'Envoi code...' : 'Envoyer le code'}
                    </button>
                    <input
                      value={forgotOtpInput}
                      onChange={(e) => {
                        setForgotOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                        setForgotOtpValidated(false)
                      }}
                      placeholder="Code 6 chiffres"
                      className="w-40 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => void validatePasswordOtp('forgot')}
                      disabled={!forgotOtpRequested}
                      className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Valider le code
                    </button>
                  </div>
                  {forgotOtpValidated ? <p className="text-xs font-semibold text-emerald-700">Code valide.</p> : null}
                  <label className="text-xs text-zinc-700">
                    Nouveau mot de passe
                    <div className="relative mt-1">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        value={forgotNewPasswordInput}
                        onChange={(e) => setForgotNewPasswordInput(e.target.value)}
                        disabled={!forgotOtpValidated}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword((v) => !v)}
                        disabled={!forgotOtpValidated}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                        aria-label={showForgotNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showForgotNewPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      </button>
                    </div>
                  </label>
                  <label className="text-xs text-zinc-700">
                    Confirmer le nouveau mot de passe
                    <div className="relative mt-1">
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        value={forgotConfirmPasswordInput}
                        onChange={(e) => setForgotConfirmPasswordInput(e.target.value)}
                        disabled={!forgotOtpValidated}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword((v) => !v)}
                        disabled={!forgotOtpValidated}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                        aria-label={showForgotConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                      >
                        {showForgotConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      </button>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => void resetPasswordFromForgot()}
                    disabled={forgotPasswordLoading || !forgotOtpValidated}
                    className="inline-flex rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotPasswordLoading ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'review' && !isCleanerSession ? (
            <div className="mt-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Ajouter un avis</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Votre retour guide notre roadmap et rassure les autres hébergeurs.{' '}
                  <strong>Un seul avis par compte</strong> : vous pouvez le modifier en republiant, ou le retirer à tout
                  moment sur cet appareil.
                </p>
              </div>

              {existingHostReview ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
                  <p className="font-semibold text-emerald-900">Votre avis actuellement affiché sur le site</p>
                  <p className="mt-2 text-lg font-bold text-emerald-950">{existingHostReview.stars}/5</p>
                  <p className="mt-2 leading-relaxed text-emerald-950/95">
                    &ldquo;{existingHostReview.quote}&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-emerald-900/85">
                    Publié le {fmtLongDate(existingHostReview.submittedAtIso)} — {existingHostReview.name},{' '}
                    {existingHostReview.role}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Retirer votre avis public ? Il disparaîtra du site sur cet appareil et ce navigateur.',
                        )
                      ) {
                        return
                      }
                      setReviewPublishError('')
                      setReviewPublishOk('')
                      if (removeHostPublishedReviewForAccount(reviewAccountKey)) {
                        setReviewStars(0)
                        setReviewText('')
                        setReviewPublishOk('Votre avis a été retiré du site.')
                      }
                    }}
                    className="mt-3 inline-flex rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
                  >
                    Retirer mon avis
                  </button>
                  <p className="mt-2 text-xs text-emerald-900/80">
                    Pour le modifier sans le supprimer : changez la note ou le texte ci-dessous puis cliquez sur
                    « Mettre à jour mon avis ».
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
                <p className="font-semibold text-sky-900">Pourquoi une evaluation enthousiaste change tout</p>
                <p className="mt-2 text-sm leading-relaxed text-sky-900/90">
                  Sur les annuaires et boutiques logicielles, ce sont surtout les avis complets et les meilleures notes
                  qui remontent en tete de liste — exactement comme pour vos fiches les mieux notees sur les OTA. Si
                  StayPilot a tenu le meme niveau de fiabilite pour votre activite, vous nous aidez enormement en
                  refletant cette satisfaction dans votre note.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-semibold text-zinc-900">1. Votre note globale</p>
                <p className="mt-1 text-xs text-zinc-500">Cliquez sur les etoiles (obligatoire pour envoyer).</p>
                <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Note sur 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewStars(n)}
                      className={`rounded-lg px-2 py-1 text-2xl leading-none transition ${
                        reviewStars >= n ? 'text-amber-400' : 'text-zinc-200 hover:text-zinc-300'
                      }`}
                      aria-label={`${n} sur 5`}
                    >
                      ★
                    </button>
                  ))}
                  {reviewStars > 0 ? (
                    <span className="ml-2 text-sm font-medium text-zinc-700">
                      {reviewStars}/5 — merci, cela nous aide a rester visibles.
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-semibold text-zinc-900">2. Racontez votre experience</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Qu avez-vous gagne au quotidien ? (synchronisation channel manager, calendrier, moins de doubles
                  resas, temps sur le pilotage des prix…)
                </p>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={6}
                  placeholder="Ex. : depuis que tout passe par StayPilot, je dors mieux — le calendrier est propre et je vois le revenu net en un clin d oeil. Je recommande chaudement aux proprietaires multi-plateformes."
                  className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={reviewPublicNameOk}
                    onChange={(e) => setReviewPublicNameOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    J autorise StayPilot a associer mon prenom ou mon initiale a cet avis s il est cite publiquement
                    (facultatif).
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">
                  3. {existingHostReview ? 'Mettre à jour ou remplacer votre avis' : "Publier sur la page d'accueil"}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Votre texte est vérifié automatiquement (gros mots, propos dégradants, spam). S’il est respectueux et
                  assez détaillé, il apparaît dans la section avis du site, sur cet appareil et ce navigateur. Un nouvel
                  envoi remplace votre avis précédent pour ce compte.
                </p>
                <button
                  type="button"
                  disabled={reviewStars === 0}
                  onClick={() => {
                    setReviewPublishError('')
                    setReviewPublishOk('')
                    if (reviewStars === 0) return
                    const text = reviewText.trim()
                    const mod = moderateHostReviewQuote(text)
                    if (!mod.ok) {
                      setReviewPublishError(mod.reason)
                      return
                    }
                    const displayName = reviewPublicNameOk
                      ? `${firstName.trim()} ${lastName.trim()}`.trim() || 'Hôte vérifié StayPilot'
                      : 'Hôte vérifié StayPilot'
                    const roleLine = company.trim() ? company.trim() : 'Hébergeur – compte vérifié'
                    const stars = Math.min(5, Math.max(1, reviewStars)) as 1 | 2 | 3 | 4 | 5
                    const res = appendHostPublishedReview({
                      stars,
                      quote: text,
                      name: displayName,
                      role: roleLine,
                      accountKey: reviewAccountKey,
                    })
                    if (!res.ok) {
                      setReviewPublishError(res.error)
                      return
                    }
                    setReviewPublishOk(
                      res.replaced
                        ? "Merci ! Votre avis a été mis à jour sur la page d'accueil (bloc témoignages)."
                        : "Merci ! Votre avis est publié sur la page d'accueil (bloc témoignages) après vérification automatique.",
                    )
                    setExistingHostReview(getHostReviewForAccount(reviewAccountKey))
                  }}
                  className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {existingHostReview
                    ? 'Mettre à jour mon avis (modération automatique)'
                    : 'Publier mon avis (modération automatique)'}
                </button>
                {reviewPublishError ? (
                  <p className="mt-2 text-xs font-medium text-rose-600">{reviewPublishError}</p>
                ) : null}
                {reviewPublishOk ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">{reviewPublishOk}</p>
                ) : null}
                <p className="mt-4 text-xs font-semibold text-zinc-700">Optionnel : envoyer aussi par e-mail</p>
                <button
                  type="button"
                  disabled={reviewStars === 0}
                  onClick={() => {
                    if (reviewStars === 0) return
                    const head = `Avis hebergeur StayPilot — ${reviewStars}/5 etoiles\n`
                    const consent = reviewPublicNameOk
                      ? `Publication du prenom / initiale : oui\n`
                      : `Publication du prenom / initiale : non (anonyme)\n`
                    const accountLine = `Compte : ${email.trim() || currentUser || 'non renseigne'}\n\n`
                    const body = `${head}${consent}${accountLine}${reviewText.trim() || '(pas de commentaire texte)'}\n`
                    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Avis hebergeur StayPilot')}&body=${encodeURIComponent(body)}`
                  }}
                  className="mt-2 inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Envoyer mon avis par e-mail
                </button>
                {reviewStars === 0 ? (
                  <p className="mt-2 text-xs text-rose-600">Selectionnez d abord une note (etoiles) pour publier.</p>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">
                    Astuce : sur une page publique d avis, une note alignee avec votre experience aide d autres
                    hebergeurs a choisir un outil serieux.
                  </p>
                )}
              </div>
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
  onFocus,
  inputClassName = '',
  autoComplete,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  onFocus?: () => void
  inputClassName?: string
  autoComplete?: string
  inputMode?: 'numeric' | 'text' | 'search' | 'none' | 'email' | 'tel' | 'url' | 'decimal'
}) {
  return (
    <label className="text-sm text-zinc-700">
      {label}
      {!required ? <span className="ml-1 text-xs font-medium text-zinc-500">(facultatif)</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${inputClassName}`}
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

