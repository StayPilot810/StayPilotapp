import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
  clearLocalAccountsIfRemoteServerEmpty,
  findAccountForLogin,
  getStoredAccounts,
  normalizeStoredLoginPiece,
  saveStoredAccounts,
  storedAccountMatchesNormalizedId,
  type StoredAccount,
} from '../lib/accounts'
import {
  isServerAccountsMandatory,
  serverAccountsConfigErrorMessage,
  serverAccountsNetworkErrorMessage,
} from '../lib/serverAccountsPolicy'
import { useLanguage } from '../hooks/useLanguage'

const LS_REMEMBER = 'staypilot_remember_me'
const LS_IDENTIFIER = 'staypilot_login_identifier'
const LS_SESSION_ACTIVE = 'staypilot_session_active'
const LS_CURRENT_PLAN = 'staypilot_current_plan'
const LS_CURRENT_USER = 'staypilot_current_user'
const LS_CURRENT_ROLE = 'staypilot_current_role'
const LS_PASSWORD_OTP_PREFIX = 'staypilot_password_otp_v1_'

export function LoginPage() {
  const { t } = useLanguage()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'host' | 'cleaner'>('host')
  const [rememberMe, setRememberMe] = useState(false)
  const [autoConnected, setAutoConnected] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [forgotCodeInput, setForgotCodeInput] = useState('')
  const [forgotCodeValidated, setForgotCodeValidated] = useState(false)
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotSendingCode, setForgotSendingCode] = useState(false)
  const [forgotResetting, setForgotResetting] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)
  const [remoteKvOk, setRemoteKvOk] = useState<boolean | null>(() =>
    isServerAccountsMandatory() ? null : true,
  )

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
    const remembered = localStorage.getItem(LS_REMEMBER) === 'true'
    const savedIdentifier = localStorage.getItem(LS_IDENTIFIER) ?? ''
    const sessionActive = localStorage.getItem(LS_SESSION_ACTIVE) === 'true'

    if (remembered && savedIdentifier) setIdentifier(savedIdentifier)
    else setIdentifier('')
    setRememberMe(remembered)

    if (remembered && savedIdentifier && sessionActive) {
      setAutoConnected(true)
      setConnected(true)
    }
  }, [])

  const canSubmit = useMemo(
    () => identifier.trim().length > 0 && password.trim().length > 0,
    [identifier, password],
  )

  function applyLoginSuccess(account: StoredAccount) {
    const accountRole = account.role || 'host'
    if (accountRole !== role) {
      setConnected(false)
      setAutoConnected(false)
      setLoginError("Le rôle sélectionné ne correspond pas à ce compte. Vérifiez 'Hôte' ou 'Prestataire ménage'.")
      return false
    }
    setLoginError('')
    localStorage.setItem(LS_SESSION_ACTIVE, 'true')
    localStorage.setItem(LS_CURRENT_PLAN, account.plan || 'Pro')
    localStorage.setItem(LS_CURRENT_USER, account.username.trim())
    localStorage.setItem(LS_CURRENT_ROLE, accountRole)
    localStorage.setItem(LS_IDENTIFIER, account.username.trim())
    if (account.preferredLocale) localStorage.setItem('staypilot_locale', account.preferredLocale)
    if (rememberMe) {
      localStorage.setItem(LS_REMEMBER, 'true')
    } else {
      localStorage.setItem(LS_REMEMBER, 'false')
    }
    window.dispatchEvent(new Event('staypilot-session-changed'))
    setConnected(true)
    setAutoConnected(false)
    window.location.href = '/dashboard'
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return

    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (isServerAccountsMandatory() && !st.remoteAuth) {
        setConnected(false)
        setAutoConnected(false)
        setLoginError(serverAccountsConfigErrorMessage())
        return
      }
      if (st.remoteAuth) {
        const res = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim(), password }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data.accounts)) {
          saveStoredAccounts(data.accounts as StoredAccount[])
          const idNorm = normalizeStoredLoginPiece(identifier)
          const account = (data.accounts as StoredAccount[]).find((a) =>
            storedAccountMatchesNormalizedId(a, idNorm),
          )
          if (account) {
            applyLoginSuccess(account)
            return
          }
        }
        if (res.status === 503 && isServerAccountsMandatory()) {
          setConnected(false)
          setAutoConnected(false)
          setLoginError('Connexion temporairement indisponible. Réessayez dans un instant.')
          return
        }
        if (res.status !== 503) {
          setConnected(false)
          setAutoConnected(false)
          setLoginError(t.loginError)
          return
        }
      }
    } catch {
      if (isServerAccountsMandatory()) {
        setConnected(false)
        setAutoConnected(false)
        setLoginError(serverAccountsNetworkErrorMessage())
        return
      }
    }

    if (isServerAccountsMandatory()) {
      setConnected(false)
      setAutoConnected(false)
      setLoginError(serverAccountsConfigErrorMessage())
      return
    }

    const account = findAccountForLogin(identifier, password)
    if (!account) {
      setConnected(false)
      setAutoConnected(false)
      setLoginError(t.loginError)
      return
    }
    applyLoginSuccess(account)
  }

  function findAccountByIdentifier(rawIdentifier: string) {
    return getStoredAccounts().find((a) => storedAccountMatchesNormalizedId(a, rawIdentifier))
  }

  function otpStorageKeyForEmail(targetEmail: string) {
    return `${LS_PASSWORD_OTP_PREFIX}${targetEmail.trim().toLowerCase()}`
  }

  function createSixDigitCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
  }

  function storeOtpForEmail(targetEmail: string, code: string) {
    localStorage.setItem(
      otpStorageKeyForEmail(targetEmail),
      JSON.stringify({
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
      }),
    )
  }

  function verifyOtpForEmail(targetEmail: string, codeInput: string) {
    const raw = localStorage.getItem(otpStorageKeyForEmail(targetEmail))
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

  async function sendForgotPasswordCode() {
    setForgotSendingCode(true)
    setForgotMessage('')
    try {
      try {
        const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
        if (isServerAccountsMandatory() && !st.remoteAuth) {
          setForgotMessage(serverAccountsConfigErrorMessage())
          return
        }
        if (st.remoteAuth) {
          const res = await fetch('/api/auth-password-otp-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
          })
          if (res.status === 404) {
            setForgotMessage('Compte introuvable avec cet e-mail / identifiant.')
            return
          }
          if (!res.ok) {
            setForgotMessage("Impossible d'envoyer le code pour le moment.")
            return
          }
          setForgotCodeValidated(false)
          setForgotMessage('Code envoyé. Vérifiez votre boîte e-mail (et les spams).')
          return
        }
      } catch {
        /* fallback local */
      }
      const account = findAccountByIdentifier(forgotIdentifier)
      if (!account) {
        setForgotMessage('Compte introuvable avec cet e-mail / identifiant.')
        return
      }
      const code = createSixDigitCode()
      try {
        const res = await fetch('/api/cancel-subscription-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'password_verification_code',
            to: account.email,
            firstName: account.firstName || '',
            locale: account.preferredLocale || 'fr',
            code,
          }),
        })
        if (!res.ok) {
          setForgotMessage("Impossible d'envoyer le code pour le moment.")
          return
        }
        storeOtpForEmail(account.email, code)
        setForgotCodeValidated(false)
        setForgotMessage(`Code envoyé à ${account.email}.`)
      } catch {
        setForgotMessage("Impossible d'envoyer le code pour le moment.")
      }
    } finally {
      setForgotSendingCode(false)
    }
  }

  async function resetForgotPassword() {
    if (forgotNewPassword.length < 8) {
      setForgotMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage('La confirmation du nouveau mot de passe ne correspond pas.')
      return
    }
    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (isServerAccountsMandatory() && !st.remoteAuth) {
        setForgotMessage(serverAccountsConfigErrorMessage())
        return
      }
      if (st.remoteAuth) {
        if (!/^\d{6}$/.test(forgotCodeInput.trim())) {
          setForgotMessage('Veuillez saisir un code à 6 chiffres.')
          return
        }
        setForgotResetting(true)
        const res = await fetch('/api/auth-forgot-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: forgotIdentifier.trim(),
            code: forgotCodeInput.trim(),
            newPassword: forgotNewPassword,
          }),
        })
        const data = await res.json().catch(() => ({}))
        setForgotResetting(false)
        if (!res.ok) {
          setForgotMessage(
            data?.error === 'invalid_code' || data?.error === 'otp_expired'
              ? 'Code invalide ou expiré. Demandez un nouveau code.'
              : 'Réinitialisation impossible pour le moment.',
          )
          return
        }
        if (Array.isArray(data.accounts)) saveStoredAccounts(data.accounts as StoredAccount[])
        setForgotCodeInput('')
        setForgotNewPassword('')
        setForgotConfirmPassword('')
        setForgotCodeValidated(false)
        setForgotMessage('Mot de passe réinitialisé. Vous pouvez vous connecter.')
        return
      }
    } catch {
      /* fallback local */
    }
    const account = findAccountByIdentifier(forgotIdentifier)
    if (!account) {
      setForgotMessage('Compte introuvable avec cet e-mail / identifiant.')
      return
    }
    if (!forgotCodeValidated) {
      setForgotMessage('Veuillez valider le code à 6 chiffres avant de modifier le mot de passe.')
      return
    }
    setForgotResetting(true)
    const accounts = getStoredAccounts()
    const nextAccounts = accounts.map((a) =>
      a.id === account.id ? { ...a, password: forgotNewPassword } : a,
    )
    saveStoredAccounts(nextAccounts)
    clearOtpForEmail(account.email)
    let mailSent = false
    try {
      const res = await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'password_reset_confirmation',
          to: account.email,
          firstName: account.firstName || '',
          locale: account.preferredLocale || 'fr',
          resetAtIso: new Date().toISOString(),
        }),
      })
      mailSent = res.ok
    } catch {
      mailSent = false
    } finally {
      setForgotResetting(false)
    }
    setForgotCodeInput('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotMessage(
      mailSent
        ? `Mot de passe réinitialisé. Confirmation envoyée à ${account.email}.`
        : 'Mot de passe réinitialisé. Envoi e-mail de confirmation indisponible.',
    )
  }

  async function validateForgotPasswordCode() {
    if (!/^\d{6}$/.test(forgotCodeInput.trim())) {
      setForgotMessage('Veuillez saisir un code à 6 chiffres.')
      return
    }
    try {
      const st = await fetch('/api/auth-status', { method: 'GET' }).then((r) => r.json().catch(() => ({})))
      if (isServerAccountsMandatory() && !st.remoteAuth) {
        setForgotMessage(serverAccountsConfigErrorMessage())
        return
      }
      if (st.remoteAuth) {
        const res = await fetch('/api/auth-verify-password-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: forgotIdentifier.trim(), code: forgotCodeInput.trim() }),
        })
        if (!res.ok) {
          setForgotMessage('Code invalide ou expiré. Demandez un nouveau code.')
          return
        }
        setForgotCodeValidated(true)
        setForgotMessage('Code valide. Vous pouvez maintenant réinitialiser le mot de passe.')
        return
      }
    } catch {
      /* fallback local */
    }
    const account = findAccountByIdentifier(forgotIdentifier)
    if (!account) {
      setForgotMessage('Compte introuvable avec cet e-mail / identifiant.')
      return
    }
    if (!verifyOtpForEmail(account.email, forgotCodeInput)) {
      setForgotMessage('Code invalide ou expiré. Demandez un nouveau code.')
      return
    }
    setForgotCodeValidated(true)
    setForgotMessage('Code valide. Vous pouvez maintenant réinitialiser le mot de passe.')
  }

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden border-t border-zinc-200/50 bg-[linear-gradient(180deg,#fdfefe_0%,#f5f8ff_55%,#f2f6ff_100%)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_68%_58%_at_16%_10%,rgba(79,134,247,0.14),transparent_68%),radial-gradient(ellipse_62%_52%_at_85%_90%,rgba(59,130,246,0.12),transparent_72%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1400' height='900' viewBox='0 0 1400 900'%3E%3Cg fill='none' stroke='%234a86f7' stroke-opacity='0.35'%3E%3Crect x='160' y='120' width='340' height='220' rx='24'/%3E%3Cpath d='M210 290c48-48 106-72 174-72s126 24 174 72'/%3E%3Crect x='910' y='170' width='300' height='190' rx='22'/%3E%3Cpath d='M950 305h220M950 272h156M950 239h184'/%3E%3Crect x='500' y='520' width='400' height='210' rx='24'/%3E%3Cpath d='M550 680l58-40 56 24 74-66 58 36 54-48'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-blue-200/40 bg-white/25 opacity-60 blur-xl">
        <div className="absolute left-6 right-6 top-6 h-10 rounded-xl bg-blue-200/35" />
        <div className="absolute left-6 top-24 h-40 w-[44%] rounded-2xl bg-blue-300/25" />
        <div className="absolute right-6 top-24 h-28 w-[44%] rounded-2xl bg-indigo-300/20" />
        <div className="absolute bottom-8 left-6 right-6 h-36 rounded-2xl bg-blue-400/20" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-white/35" />

      <div className="relative w-full max-w-[560px] overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/95 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
        <div className="p-6 sm:p-8 lg:p-10">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            {t.loginBack}
          </a>
          <h1 className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-[2rem]">{t.loginTitle}</h1>

          {autoConnected ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {t.loginAutoConnected}
            </div>
          ) : null}

          {connected ? (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {t.loginConnected}
            </div>
          ) : null}

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

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800" htmlFor="identifier">
                {t.loginIdentifierLabel}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                placeholder={t.loginIdentifierPlaceholder}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800" htmlFor="password">
                {t.loginPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-base text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  placeholder={t.loginPasswordPlaceholder}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                  aria-label={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showLoginPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-zinc-800" htmlFor="role">
                Vous êtes
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole((e.target.value as 'host' | 'cleaner') || 'host')}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
              >
                <option value="host">Hôte</option>
                <option value="cleaner">Prestataire ménage</option>
              </select>
            </div>

            <label className="flex select-none items-center gap-2.5 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-[#4a86f7] focus:ring-[#4a86f7]/30"
              />
              {t.loginRemember}
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotOpen((v) => !v)
                setForgotMessage('')
              }}
              className="block w-full text-center text-sm font-semibold text-[#4a86f7] transition-colors hover:text-[#3c78ee]"
            >
              {t.loginForgot}
            </button>
            {forgotOpen ? (
              <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-600">
                  Vérification sécurisée : recevez un code 6 chiffres par e-mail avant réinitialisation.
                </p>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className={`rounded-md border px-2 py-1 text-center font-semibold ${forgotIdentifier.trim() ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                    1. Identifiant
                  </div>
                  <div className={`rounded-md border px-2 py-1 text-center font-semibold ${forgotCodeValidated ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                    2. Code valide
                  </div>
                  <div className={`rounded-md border px-2 py-1 text-center font-semibold ${forgotCodeValidated ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                    3. Nouveau mot de passe
                  </div>
                </div>
                <input
                  value={forgotIdentifier}
                  onChange={(e) => {
                    setForgotIdentifier(e.target.value)
                    setForgotCodeValidated(false)
                  }}
                  placeholder="Votre e-mail ou identifiant"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void sendForgotPasswordCode()}
                    disabled={forgotSendingCode}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotSendingCode ? 'Envoi code...' : 'Envoyer le code'}
                  </button>
                  <input
                    value={forgotCodeInput}
                    onChange={(e) => {
                      setForgotCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setForgotCodeValidated(false)
                    }}
                    placeholder="Code 6 chiffres"
                    className="w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                  <button
                    type="button"
                    onClick={validateForgotPasswordCode}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Valider le code
                  </button>
                </div>
                {forgotCodeValidated ? (
                  <p className="text-xs font-semibold text-emerald-700">Code valide : étape 3 débloquée.</p>
                ) : (
                  <p className="text-xs font-medium text-zinc-500">Validez le code pour débloquer le changement de mot de passe.</p>
                )}
                <div className="relative">
                  <input
                    type={showForgotNewPassword ? 'text' : 'password'}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    disabled={!forgotCodeValidated}
                    placeholder="Nouveau mot de passe"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-11 text-sm outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword((v) => !v)}
                    disabled={!forgotCodeValidated}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                    aria-label={showForgotNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showForgotNewPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showForgotConfirmPassword ? 'text' : 'password'}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    disabled={!forgotCodeValidated}
                    placeholder="Confirmer le nouveau mot de passe"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-11 text-sm outline-none focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPassword((v) => !v)}
                    disabled={!forgotCodeValidated}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                    aria-label={showForgotConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                  >
                    {showForgotConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void resetForgotPassword()}
                  disabled={forgotResetting || !forgotCodeValidated}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forgotResetting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
                {forgotMessage ? <p className="text-xs font-medium text-zinc-700">{forgotMessage}</p> : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || remoteKvOk !== true}
              className="mx-auto inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-[#4a86f7] px-6 py-3 text-sm font-semibold text-white shadow-pm-cta transition-[filter,opacity] hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.loginSubmit}
            </button>
            {loginError ? <p className="text-center text-sm font-medium text-rose-600">{loginError}</p> : null}
            <p className="text-center text-xs font-medium text-zinc-500 sm:text-sm">
              {t.loginTrust}
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
