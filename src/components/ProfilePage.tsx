import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { getStoredAccounts, saveStoredAccounts } from '../lib/accounts'
import { useStaypilotSessionLoggedIn } from '../hooks/useStaypilotSessionLoggedIn'
import { pricingPlansTranslations } from '../i18n/pricingPlans'
import { MOCK_BOOKINGS } from '../data/demoCalendarBookings'
import { getConnectedApartmentsFromStorage } from '../utils/connectedApartments'
import { CONTACT_EMAIL } from '../i18n/contactPage'
import { appendHostPublishedReview } from '../utils/hostPublishedReviews'
import { moderateHostReviewQuote } from '../utils/reviewModeration'

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

export function ProfilePage() {
  const loggedIn = useStaypilotSessionLoggedIn()
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')
  const currentRole = (localStorage.getItem(LS_CURRENT_ROLE) || '').trim().toLowerCase()
  const isCleanerSession = currentRole === 'cleaner'
  const pricing = pricingPlansTranslations.fr

  const accounts = useMemo(() => getStoredAccounts(), [])
  const userKey = (localStorage.getItem(LS_CURRENT_USER) ?? localStorage.getItem(LS_IDENTIFIER) ?? '')
  const currentUser = userKey.trim().toLowerCase()
  const accountIndex = accounts.findIndex(
    (a) => a.email.trim().toLowerCase() === currentUser || a.username.trim().toLowerCase() === currentUser,
  )
  const account = accountIndex >= 0 ? accounts[accountIndex] : undefined
  const mailLocale = (account?.preferredLocale || localStorage.getItem('staypilot_locale') || 'fr').slice(0, 2)
  const activePlan = localStorage.getItem(LS_CURRENT_PLAN)?.trim() || account?.plan || 'Gratuit'

  const [firstName, setFirstName] = useState(account?.firstName || '')
  const [lastName, setLastName] = useState(account?.lastName || '')
  const [username, setUsername] = useState(account?.username || '')
  const [email, setEmail] = useState(account?.email || '')
  const [phone, setPhone] = useState(account?.phone || '')
  const [company, setCompany] = useState(account?.company || '')
  const [saveMsg, setSaveMsg] = useState('')
  const [reviewStars, setReviewStars] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewPublicNameOk, setReviewPublicNameOk] = useState(false)
  const [reviewPublishError, setReviewPublishError] = useState('')
  const [reviewPublishOk, setReviewPublishOk] = useState('')
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
      paymentMethodValid: true,
      nextDueIso: computeUpcomingBillingDue(planStartDateIso()).toISOString(),
      lastNotifiedAttempt: 0,
    }
  })
  const initialPlan = (activePlan || 'Starter').trim()
  const [currentPlan, setCurrentPlan] = useState(initialPlan)
  const [planSelection, setPlanSelection] = useState(initialPlan)
  const planChangeAccountKey = (account?.id || currentUser || 'guest').trim().toLowerCase()
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
  const [paymentCardNumber, setPaymentCardNumber] = useState('4242 4242 4242 4242')
  const [paymentExpiry, setPaymentExpiry] = useState('12/29')
  const [paymentHolder, setPaymentHolder] = useState(() => `${firstName} ${lastName}`.trim())
  const [paymentCvc, setPaymentCvc] = useState('123')
  const [invoiceClientType, setInvoiceClientType] = useState<'b2b' | 'b2c'>(
    account?.clientType === 'b2b' && account?.vatVerified ? 'b2b' : 'b2c',
  )
  const [invoiceCountryCode, setInvoiceCountryCode] = useState((account?.countryCode || 'FR').toUpperCase())

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
      const parsed = JSON.parse(raw) as { cardNumber?: string; expiry?: string; holder?: string; cvc?: string }
      if (parsed.cardNumber) setPaymentCardNumber(parsed.cardNumber)
      if (parsed.expiry) setPaymentExpiry(parsed.expiry)
      if (parsed.holder) setPaymentHolder(parsed.holder)
      if (parsed.cvc) setPaymentCvc(parsed.cvc)
    } catch {
      // ignore invalid local data
    }
  }, [])

  useEffect(() => {
    const targetEmail = (email || account?.email || '').trim()
    if (!targetEmail) return
    const dueAt = computeUpcomingBillingDue(planStartDateIso(), new Date())
    const y = dueAt.getFullYear()
    const m = String(dueAt.getMonth() + 1).padStart(2, '0')
    const periodKey = `${y}-${m}`
    const planLabel = (currentPlan || 'Starter').trim()
    const amountByPlan: Record<string, number> = { starter: 19.99, pro: 59.99, scale: 99.99 }
    const amountEur = amountByPlan[planLabel.toLowerCase()] ?? 19.99
    const vatRateByCountry: Record<string, number> = {
      FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21, PT: 23, IE: 23, LU: 17, AT: 20,
      SE: 25, DK: 25, FI: 24, PL: 23, CZ: 21, RO: 19, BG: 20, GR: 24, HR: 25, HU: 27,
      SK: 20, SI: 22, LT: 21, LV: 21, EE: 22,
    }
    const normalizedCountry = invoiceCountryCode.trim().toUpperCase() || 'FR'
    const isVerifiedB2b = invoiceClientType === 'b2b' && account?.vatVerified === true
    const vatRate = isVerifiedB2b ? 0 : vatRateByCountry[normalizedCountry] ?? 20
    const taxMode = isVerifiedB2b ? 'reverse_charge' : 'vat_collected'
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
        issuedAtIso: new Date().toISOString(),
        dueAtIso: dueAt.toISOString(),
      }
      return [invoice, ...prev].slice(0, 24)
    })
  }, [account?.email, account?.vatVerified, currentPlan, email, firstName, invoiceClientType, invoiceCountryCode, lastName, username])

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
        'Mercredi montre deja de la traction: maintenez un prix moderement competitif plutot qu une forte remise pour proteger le revenu moyen.',
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
    const accountKey = (account?.id || toEmail || 'guest').trim().toLowerCase()
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
    const effectiveAt = new Date(planPolicy.effectiveAtIso)
    if (Date.now() < effectiveAt.getTime()) return
    localStorage.setItem(LS_CURRENT_PLAN, planPolicy.toPlan)
    if (accountIndex >= 0) {
      const next = [...accounts]
      next[accountIndex] = { ...next[accountIndex], plan: planPolicy.toPlan }
      saveStoredAccounts(next)
    }
    localStorage.removeItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`)
    setCurrentPlan(planPolicy.toPlan)
    setPlanSelection(planPolicy.toPlan)
    setPlanPolicy(null)
    setSaveMsg(`Nouveau forfait actif: ${planPolicy.toPlan}.`)
  }, [accountIndex, accounts, planChangeAccountKey, planPolicy])

  function savePlanSelection() {
    const nextPlan = planSelection.trim() || 'Starter'
    if (nextPlan === currentPlan) {
      setSaveMsg('Aucun changement detecte sur le forfait.')
      return
    }
    if (planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime()) {
      setSaveMsg(
        `Un changement est deja programme (${planPolicy.fromPlan} -> ${planPolicy.toPlan}). Nouvelle modification possible apres le ${fmtLongDate(
          planPolicy.effectiveAtIso,
        )}.`,
      )
      return
    }
    setPlanChangeConfirmOpen(true)
  }

  async function confirmPlanSelectionChange() {
    const nextPlan = planSelection.trim() || 'Starter'
    if (nextPlan === currentPlan) {
      setPlanChangeConfirmOpen(false)
      return
    }
    if (planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime()) {
      setPlanChangeConfirmOpen(false)
      setSaveMsg(
        `Un changement est deja programme (${planPolicy.fromPlan} -> ${planPolicy.toPlan}). Nouvelle modification possible apres le ${fmtLongDate(
          planPolicy.effectiveAtIso,
        )}.`,
      )
      return
    }
    setPlanChangeLoading(true)
    const oldPlan = currentPlan
    const effectiveAtIso = computeUpcomingBillingDue(planStartDateIso(), new Date()).toISOString()
    const policyPayload: PlanChangePolicyState = {
      requestedAtIso: new Date().toISOString(),
      effectiveAtIso,
      fromPlan: oldPlan,
      toPlan: nextPlan,
    }
    localStorage.setItem(`${LS_PLAN_CHANGE_POLICY_PREFIX}${planChangeAccountKey}`, JSON.stringify(policyPayload))
    setPlanPolicy(policyPayload)

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
    setPlanChangeLoading(false)
    setPlanChangeConfirmOpen(false)
    setSaveMsg(
      mailSent
        ? `Changement programme (${oldPlan} -> ${nextPlan}). Merci ! E-mail de confirmation envoye. Nouveau tarif applique le ${fmtLongDate(
            effectiveAtIso,
          )}.`
        : `Changement programme (${oldPlan} -> ${nextPlan}). Nouveau tarif applique le ${fmtLongDate(effectiveAtIso)}.`,
    )
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

  function computeUpcomingBillingDue(startIso: string, now = new Date()) {
    const start = new Date(startIso)
    const startDay = start.getDate()
    const y = now.getFullYear()
    const m = now.getMonth()
    const daysInThisMonth = new Date(y, m + 1, 0).getDate()
    const thisMonthDue = new Date(y, m, Math.min(startDay, daysInThisMonth), 9, 0, 0, 0)
    if (now <= thisMonthDue) return thisMonthDue
    const nextY = m === 11 ? y + 1 : y
    const nextM = (m + 1) % 12
    const daysInNextMonth = new Date(nextY, nextM + 1, 0).getDate()
    return new Date(nextY, nextM, Math.min(startDay, daysInNextMonth), 9, 0, 0, 0)
  }

  function fmtLongDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
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
          ? '3e echec de prelevement detecte. Compte suspendu tant que les coordonnees bancaires ne sont pas mises a jour.'
          : `Prelevement echoue (${expectedAttempts}/3). Une alerte client a ete envoyee.`,
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
      mailSent
        ? `Résiliation confirmée. Un e-mail de confirmation a été envoyé depuis support@staypilot.fr à ${targetEmail}. Votre abonnement prendra fin le ${fmtLongDate(endAtIso)}.`
        : `Résiliation confirmée. Envoi e-mail impossible pour le moment (configuration SMTP manquante). Votre abonnement prendra fin le ${fmtLongDate(endAtIso)}.`,
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
    doc.text(`Date echeance: ${dueLabel}`, 14, 102)
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
      "Paiement: le changement de forfait n'est pas debite immediatement. Le nouveau tarif s'applique a la prochaine echeance.",
      14,
      140,
    )

    doc.setFont('helvetica', 'bold')
    doc.text('Merci pour votre confiance.', 14, 154)

    const out = `facture-client-${invoice.clientName.toLowerCase().replace(/\s+/g, '-')}-${invoice.id}.pdf`
    doc.save(out)
  }

  function savePaymentDetails() {
    const digits = paymentCardNumber.replace(/\D/g, '')
    if (digits.length < 13 || digits.length > 19) {
      setSaveMsg('Veuillez saisir un numero de carte valide.')
      return
    }
    const cvcDigits = paymentCvc.replace(/\D/g, '')
    if (cvcDigits.length !== 3) {
      setSaveMsg('Veuillez saisir un code de securite a 3 chiffres.')
      return
    }
    if (!paymentExpiry.trim() || !paymentHolder.trim()) {
      setSaveMsg('Veuillez completer les coordonnees bancaires (carte + titulaire + expiration + code securite).')
      return
    }
    const normalizedNumber = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
    localStorage.setItem(
      LS_PAYMENT_DETAILS,
      JSON.stringify({
        cardNumber: normalizedNumber,
        expiry: paymentExpiry.trim(),
        holder: paymentHolder.trim(),
        cvc: cvcDigits,
      }),
    )
    setPaymentCardNumber(normalizedNumber)
    setPaymentCvc(cvcDigits)
    setSaveMsg('Coordonnees bancaires mises a jour.')
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
    if (flow === 'change') setPasswordOtpSending(true)
    else setForgotOtpSending(true)
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
      setSaveMsg(`Code de verification envoye a ${targetEmail}.`)
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
      setSaveMsg('Veuillez demander un code de verification a 6 chiffres.')
      return
    }
    if (!/^\d{6}$/.test(passwordOtpInput.trim())) {
      setSaveMsg('Veuillez saisir un code de verification a 6 chiffres.')
      return
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
        ? `Mot de passe mis a jour. E-mail de confirmation envoye a ${targetEmail}.`
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
      setSaveMsg('Veuillez demander un code de verification a 6 chiffres.')
      return
    }
    if (!/^\d{6}$/.test(forgotOtpInput.trim())) {
      setSaveMsg('Veuillez saisir un code de verification a 6 chiffres.')
      return
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
        ? `Mot de passe reinitialise. E-mail de confirmation envoye a ${targetEmail}.`
        : 'Mot de passe reinitialise. Envoi e-mail non disponible pour le moment.',
    )
  }

  function validatePasswordOtp(flow: 'change' | 'forgot') {
    const targetEmail = (email || account?.email || '').trim()
    if (!targetEmail) {
      setSaveMsg("Adresse e-mail manquante pour verifier le code.")
      return
    }
    const input = flow === 'change' ? passwordOtpInput : forgotOtpInput
    if (!/^\d{6}$/.test(input.trim())) {
      setSaveMsg('Veuillez saisir un code de verification a 6 chiffres.')
      return
    }
    if (!verifyOtpForEmail(targetEmail, input)) {
      setSaveMsg('Code invalide ou expire. Demandez un nouveau code.')
      return
    }
    if (flow === 'change') setPasswordOtpValidated(true)
    else setForgotOtpValidated(true)
    setSaveMsg('Code valide. Vous pouvez maintenant modifier le mot de passe.')
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
                <p className="mt-1 text-lg font-bold text-sky-900">{currentPlan}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Modifier mon plan</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Validation obligatoire avant changement. Anti-abus actif: des qu un changement est programme, il est
                  verrouille jusqu a la prochaine echeance de facturation.
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-600">
                  En cas de changement aujourd hui, vous gardez votre tarif actuel jusqu a la prochaine echeance. Le
                  nouveau montant est debite uniquement le mois prochain.
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
                    disabled={Boolean(planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime())}
                    className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime()
                      ? 'Changement deja programme'
                      : 'Valider le changement'}
                  </button>
                </div>
              </div>
              {planPolicy && Date.now() < new Date(planPolicy.effectiveAtIso).getTime() ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <p className="font-semibold">Changement deja programme</p>
                  <p className="mt-1">
                    {planPolicy.fromPlan} vers {planPolicy.toPlan} (prise d effet le{' '}
                    <strong>{fmtLongDate(planPolicy.effectiveAtIso)}</strong>).
                  </p>
                  <p className="mt-1 text-xs">
                    Modification supplementaire bloquee jusqu a cette date pour eviter les changements opportunistes.
                  </p>
                </div>
              ) : null}
              {planChangeConfirmOpen ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Validation finale du changement de forfait</p>
                  <p className="mt-1">
                    Vous passez de <strong>{currentPlan}</strong> a <strong>{planSelection}</strong>. Le nouveau montant
                    sera debite uniquement a la prochaine echeance mensuelle.
                  </p>
                  <p className="mt-1 text-xs">
                    Une fois confirme, ce changement est verrouille jusqu a la prochaine echeance de facturation.
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
                    <p className="mt-1 text-2xl font-bold text-sky-800">{(19.99 / 1.2).toFixed(2)}€ HT</p>
                    <p className="mt-0.5 text-xs text-zinc-500">19.99€ TTC / mois</p>
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
                    <p className="mt-1 text-2xl font-bold">{(59.99 / 1.2).toFixed(2)}€ HT</p>
                    <p className="mt-0.5 text-xs text-blue-100">59.99€ TTC / mois</p>
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
                    <p className="mt-1 text-2xl font-bold text-violet-800">{(99.99 / 1.2).toFixed(2)}€ HT</p>
                    <p className="mt-0.5 text-xs text-zinc-500">99.99€ TTC / mois</p>
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
                <p className="text-sm font-semibold text-zinc-900">Dernière facture</p>
                <p className="mt-1 text-sm text-zinc-700">
                  Plan {activePlan} — 49 EUR — Émise le 01/{new Date().getMonth() + 1}/{new Date().getFullYear()}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Mode de paiement</p>
                <p className="mt-1 text-sm text-zinc-700">Carte enregistree : {paymentCardNumber}</p>
                <p className="mt-1 text-xs text-zinc-500">Prochaine échéance automatique : {fmtLongDate(billingAutopay.nextDueIso)}</p>
                <p className="mt-1 text-xs font-medium text-zinc-600">
                  Prochaine echeance possible : {fmtLongDate(billingAutopay.nextDueIso)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Fiscalite: B2B = autoliquidation sur facture. B2C = TVA adaptee selon le pays client.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">Coordonnees bancaires</p>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Espace securise
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Mettez a jour votre moyen de paiement pour eviter les echecs de prelevement et les interruptions de
                  service.
                </p>
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  Moyen actuel : carte <strong>{paymentCardNumber}</strong> - expiration{' '}
                  <strong>{paymentExpiry}</strong>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <InputField
                    label="Numero de carte"
                    value={paymentCardNumber}
                    onChange={setPaymentCardNumber}
                    onFocus={() => {
                      if (paymentCardNumber.trim()) setPaymentCardNumber('')
                    }}
                    inputClassName="text-transparent [text-shadow:0_0_0_#9ca3af] focus:text-zinc-900 focus:[text-shadow:none]"
                  />
                  <InputField
                    label="Date d expiration (MM/AA)"
                    value={paymentExpiry}
                    onChange={setPaymentExpiry}
                    onFocus={() => {
                      if (paymentExpiry.trim()) setPaymentExpiry('')
                    }}
                    inputClassName="text-transparent [text-shadow:0_0_0_#9ca3af] focus:text-zinc-900 focus:[text-shadow:none]"
                  />
                  <InputField label="Nom du titulaire" value={paymentHolder} onChange={setPaymentHolder} />
                  <InputField
                    label="Code de securite (CVC 3 chiffres)"
                    value={paymentCvc}
                    onChange={setPaymentCvc}
                    onFocus={() => {
                      if (paymentCvc.trim()) setPaymentCvc('')
                    }}
                    inputClassName="text-transparent [text-shadow:0_0_0_#9ca3af] focus:text-zinc-900 focus:[text-shadow:none]"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={savePaymentDetails}
                    className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Enregistrer les nouvelles coordonnees
                  </button>
                  <p className="text-xs text-zinc-500">
                    Le nouveau moyen de paiement sera utilise a la prochaine echeance.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">Facturation clients automatique</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Les factures se creent automatiquement selon l offre active du client. Le client ne cree rien
                  manuellement.
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
                            {inv.clientName} - {inv.planLabel} - {inv.amountEur.toFixed(2)} EUR - echeance{' '}
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
                    Aucune facture encore. Une facture sera creee automatiquement pour la prochaine echeance active.
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
                Activer les e-mails de synthese (hebdomadaire/mensuel)
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
                  Un e-mail de synthese est envoye automatiquement selon la frequence choisie (hebdomadaire ou
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
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-xs text-zinc-700">
                  Nouveau mot de passe
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-xs text-zinc-700">
                  Confirmer le nouveau mot de passe
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
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
                    onClick={() => validatePasswordOtp('change')}
                    disabled={!passwordOtpRequested}
                    className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Valider le code
                  </button>
                </div>
                {passwordOtpValidated ? <p className="mt-1 text-xs font-semibold text-emerald-700">Code valide.</p> : null}
              </div>
              <p className="text-xs text-zinc-500">
                Un e-mail de confirmation est envoye automatiquement apres chaque changement de mot de passe.
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
                      onClick={() => validatePasswordOtp('forgot')}
                      disabled={!forgotOtpRequested}
                      className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Valider le code
                    </button>
                  </div>
                  {forgotOtpValidated ? <p className="text-xs font-semibold text-emerald-700">Code valide.</p> : null}
                  <label className="text-xs text-zinc-700">
                    Nouveau mot de passe
                    <input
                      type="password"
                      value={forgotNewPasswordInput}
                      onChange={(e) => setForgotNewPasswordInput(e.target.value)}
                      disabled={!forgotOtpValidated}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                  <label className="text-xs text-zinc-700">
                    Confirmer le nouveau mot de passe
                    <input
                      type="password"
                      value={forgotConfirmPasswordInput}
                      onChange={(e) => setForgotConfirmPasswordInput(e.target.value)}
                      disabled={!forgotOtpValidated}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
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
                  Votre retour guide notre roadmap et rassure les autres hebergeurs. Prenez quelques secondes pour
                  partager ce qui compte pour vous.
                </p>
              </div>

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
                <p className="text-sm font-semibold text-zinc-900">3. Publier sur la page d accueil</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Votre texte est verifie automatiquement (gros mots, propos degradants, spam). S il est respectueux et
                  assez detaille, il apparait dans la section avis du site, sur cet appareil et ce navigateur.
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
                      ? `${firstName.trim()} ${lastName.trim()}`.trim() || 'Hote verifie StayPilot'
                      : 'Hote verifie StayPilot'
                    const roleLine = company.trim() ? company.trim() : 'Hebergeur – compte verifie'
                    const stars = Math.min(5, Math.max(1, reviewStars)) as 1 | 2 | 3 | 4 | 5
                    const res = appendHostPublishedReview({
                      stars,
                      quote: text,
                      name: displayName,
                      role: roleLine,
                      accountKey: (email.trim() || currentUser || 'anon').toLowerCase(),
                    })
                    if (!res.ok) {
                      setReviewPublishError(res.error)
                      return
                    }
                    setReviewPublishOk(
                      'Merci ! Votre avis est publie sur la page d accueil (bloc temoignages) apres verification automatique.',
                    )
                    setReviewText('')
                    setReviewStars(0)
                  }}
                  className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Publier mon avis (moderation automatique)
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
  onFocus,
  inputClassName = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  onFocus?: () => void
  inputClassName?: string
}) {
  return (
    <label className="text-sm text-zinc-700">
      {label}
      {!required ? <span className="ml-1 text-xs font-medium text-zinc-500">(facultatif)</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
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

