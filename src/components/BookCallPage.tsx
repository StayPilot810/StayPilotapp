import { FormEvent, useEffect, useMemo, useState } from 'react'

export function BookCallPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [listingsCount, setListingsCount] = useState('')
  const [expectations, setExpectations] = useState('')
  const [slotLabel, setSlotLabel] = useState('')
  const [calendlyBooked, setCalendlyBooked] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  const calendlyUrl =
    (import.meta.env.VITE_CALENDLY_URL as string | undefined)?.trim() ||
    'https://calendly.com/staypilot/appel-visio'
  const meetUrl =
    (import.meta.env.VITE_MEET_CALL_URL as string | undefined)?.trim() ||
    'https://meet.google.com/'

  const isFormReadyForCalendly =
    !!name.trim() && !!email.trim() && !!listingsCount.trim() && !!expectations.trim()

  const calendlyEmbedUrl = useMemo(() => {
    try {
      const url = new URL(calendlyUrl)
      if (name.trim()) url.searchParams.set('name', name.trim())
      if (email.trim()) url.searchParams.set('email', email.trim())
      return url.toString()
    } catch {
      return calendlyUrl
    }
  }, [calendlyUrl, email, name])

  useEffect(() => {
    function onCalendlyEvent(event: MessageEvent) {
      const data = event.data
      if (!data || typeof data !== 'object') return
      const eventName = (data as { event?: string }).event
      if (eventName !== 'calendly.event_scheduled') return
      const payload = (data as { payload?: { event?: { start_time?: string } } }).payload
      const start = payload?.event?.start_time
      if (typeof start === 'string' && start.trim()) {
        const dt = new Date(start)
        if (!Number.isNaN(dt.getTime())) {
          const pretty = new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short',
          }).format(dt)
          setSlotLabel(pretty)
        } else {
          setSlotLabel(start)
        }
      } else if (!slotLabel.trim()) {
        setSlotLabel('Créneau réservé dans Calendly')
      }
      setCalendlyBooked(true)
      setMessage('')
    }
    window.addEventListener('message', onCalendlyEvent)
    return () => window.removeEventListener('message', onCalendlyEvent)
  }, [slotLabel])

  useEffect(() => {
    setCalendlyBooked(false)
    setSlotLabel('')
  }, [name, email, listingsCount, expectations])

  async function submitRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isFormReadyForCalendly || !calendlyBooked || !slotLabel.trim()) {
      setMessage('Complétez le formulaire et réservez un créneau Calendly avant validation.')
      return
    }
    setSending(true)
    setMessage('')
    try {
      const res = await fetch('/api/cancel-subscription-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'call_booking_confirmation',
          firstName: name.trim(),
          to: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          listingsCount: listingsCount.trim(),
          expectations: expectations.trim(),
          slotLabel: slotLabel.trim(),
          meetUrl,
          locale: (localStorage.getItem('staypilot_locale') || 'fr').slice(0, 2),
        }),
      })
      if (!res.ok) {
        setMessage("Impossible d'envoyer la demande pour le moment.")
        return
      }
      setMessage('Demande envoyée. Vérifiez votre e-mail : confirmation transmise.')
      setSlotLabel('')
    } catch {
      setMessage("Impossible d'envoyer la demande pour le moment.")
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="min-h-screen flex-1 bg-[#f8fafc] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <a
          href="/"
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          Retour à l&apos;accueil
        </a>

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Réserver un appel visio</h1>
          <p className="mt-1 text-sm text-zinc-600">1) Remplissez le formulaire. 2) Réservez sur Calendly. 3) Validez l&apos;envoi.</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            À l&apos;heure actuelle, seuls les appels en français sont disponibles.
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">Après envoi, vous recevez une confirmation et nous recevons la demande.</p>

          <div className="mt-4 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <iframe
                title="Calendly booking"
                src={calendlyEmbedUrl}
                className={`h-[780px] w-full rounded-lg border border-zinc-200 bg-white ${!isFormReadyForCalendly ? 'pointer-events-none opacity-50 grayscale' : ''}`}
              />
              {!isFormReadyForCalendly ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 p-6 text-center">
                  <p className="max-w-md rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm">
                    Complétez d&apos;abord le formulaire à droite pour déverrouiller Calendly.
                  </p>
                </div>
              ) : null}
            </div>
            <form onSubmit={(e) => void submitRequest(e)} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">Informations nécessaires</p>
              <p className="mt-1 text-xs text-zinc-600">Décrivez vos attentes. Ces infos nous aident à préparer l’appel.</p>

              <label className="mt-3 block text-sm text-zinc-700">
                Nom complet
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                E-mail
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                Téléphone (optionnel)
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                Société (optionnel)
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                Nombre de logements
                <input
                  type="number"
                  min={1}
                  required
                  value={listingsCount}
                  onChange={(e) => setListingsCount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                Présentation de vos attentes
                <textarea
                  required
                  rows={4}
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  placeholder="Décrivez vos objectifs, vos difficultés, et ce que vous attendez de l'appel."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                Créneau choisi dans Calendly
                <input
                  value={slotLabel}
                  readOnly
                  placeholder="Se remplit automatiquement après réservation Calendly"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <p className={`mt-2 text-xs font-semibold ${calendlyBooked ? 'text-emerald-700' : 'text-amber-700'}`}>
                {calendlyBooked
                  ? 'Créneau confirmé dans Calendly. Vous pouvez envoyer la demande.'
                  : 'Réservation Calendly obligatoire avant envoi.'}
              </p>

              <button
                type="submit"
                disabled={sending || !isFormReadyForCalendly || !calendlyBooked}
                className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Envoyer la demande'}
              </button>
              {message ? <p className="mt-2 text-xs font-medium text-zinc-700">{message}</p> : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
