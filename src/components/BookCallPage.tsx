import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

export function BookCallPage() {
  const { locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const c = {
    fr: {
      slotReserved: 'Créneau réservé dans Calendly',
      validationError: 'Complétez le formulaire et réservez un créneau Calendly avant validation.',
      sendError: "Impossible d'envoyer la demande pour le moment.",
      sendSuccess: 'Demande envoyée. Vérifiez votre e-mail : confirmation transmise.',
      backHome: "Retour à l'accueil",
      title: 'Réserver un appel visio',
      steps: "1) Remplissez le formulaire. 2) Réservez sur Calendly. 3) Validez l'envoi.",
      frenchOnly: "À l'heure actuelle, seuls les appels en français sont disponibles.",
      afterSend: 'Après envoi, vous recevez une confirmation et nous recevons la demande.',
      unlockCalendly: "Complétez d'abord le formulaire à droite pour déverrouiller Calendly.",
      requiredInfo: 'Informations nécessaires',
      requiredInfoHint: "Décrivez vos attentes. Ces infos nous aident à préparer l'appel.",
      fullName: 'Nom complet',
      email: 'E-mail',
      phoneOptional: 'Téléphone (optionnel)',
      companyOptional: 'Société (optionnel)',
      listingsCount: 'Nombre de logements',
      expectations: 'Présentation de vos attentes',
      expectationsPlaceholder: "Décrivez vos objectifs, vos difficultés, et ce que vous attendez de l'appel.",
      selectedSlot: 'Créneau choisi dans Calendly',
      selectedSlotPlaceholder: 'Se remplit automatiquement après réservation Calendly',
      calendlyConfirmed: 'Créneau confirmé dans Calendly. Vous pouvez envoyer la demande.',
      calendlyRequired: 'Réservation Calendly obligatoire avant envoi.',
      sending: 'Envoi...',
      sendRequest: 'Envoyer la demande',
    },
    en: {
      slotReserved: 'Slot booked in Calendly',
      validationError: 'Complete the form and book a Calendly slot before submitting.',
      sendError: 'Unable to send the request right now.',
      sendSuccess: 'Request sent. Check your email: confirmation delivered.',
      backHome: 'Back to home',
      title: 'Book a video call',
      steps: '1) Fill in the form. 2) Book on Calendly. 3) Submit.',
      frenchOnly: 'At this time, calls are available in French only.',
      afterSend: 'After sending, you receive a confirmation and we receive your request.',
      unlockCalendly: 'Fill in the form on the right first to unlock Calendly.',
      requiredInfo: 'Required information',
      requiredInfoHint: 'Describe your expectations. This helps us prepare the call.',
      fullName: 'Full name',
      email: 'Email',
      phoneOptional: 'Phone (optional)',
      companyOptional: 'Company (optional)',
      listingsCount: 'Number of listings',
      expectations: 'Your expectations',
      expectationsPlaceholder: 'Describe your goals, challenges, and what you expect from the call.',
      selectedSlot: 'Chosen Calendly slot',
      selectedSlotPlaceholder: 'Auto-filled after Calendly booking',
      calendlyConfirmed: 'Calendly slot confirmed. You can send the request.',
      calendlyRequired: 'Calendly booking required before sending.',
      sending: 'Sending...',
      sendRequest: 'Send request',
    },
    es: {
      slotReserved: 'Franja reservada en Calendly',
      validationError: 'Completa el formulario y reserva una franja en Calendly antes de enviar.',
      sendError: 'No se puede enviar la solicitud por ahora.',
      sendSuccess: 'Solicitud enviada. Revisa tu correo: confirmación enviada.',
      backHome: 'Volver al inicio',
      title: 'Reservar una videollamada',
      steps: '1) Completa el formulario. 2) Reserva en Calendly. 3) Envía.',
      frenchOnly: 'Por ahora, las llamadas solo están disponibles en francés.',
      afterSend: 'Tras el envío, recibes confirmación y nosotros recibimos la solicitud.',
      unlockCalendly: 'Primero completa el formulario de la derecha para desbloquear Calendly.',
      requiredInfo: 'Información necesaria',
      requiredInfoHint: 'Describe tus expectativas. Esto nos ayuda a preparar la llamada.',
      fullName: 'Nombre completo',
      email: 'Correo electrónico',
      phoneOptional: 'Teléfono (opcional)',
      companyOptional: 'Empresa (opcional)',
      listingsCount: 'Número de alojamientos',
      expectations: 'Presentación de tus expectativas',
      expectationsPlaceholder: 'Describe tus objetivos, dificultades y lo que esperas de la llamada.',
      selectedSlot: 'Franja elegida en Calendly',
      selectedSlotPlaceholder: 'Se completa automáticamente tras reservar en Calendly',
      calendlyConfirmed: 'Franja confirmada en Calendly. Puedes enviar la solicitud.',
      calendlyRequired: 'Reserva en Calendly obligatoria antes de enviar.',
      sending: 'Enviando...',
      sendRequest: 'Enviar solicitud',
    },
    de: {
      slotReserved: 'Termin in Calendly gebucht',
      validationError: 'Bitte Formular ausfüllen und einen Calendly-Termin buchen, bevor Sie senden.',
      sendError: 'Anfrage kann derzeit nicht gesendet werden.',
      sendSuccess: 'Anfrage gesendet. Bitte E-Mail prüfen: Bestätigung gesendet.',
      backHome: 'Zur Startseite',
      title: 'Videocall buchen',
      steps: '1) Formular ausfüllen. 2) In Calendly buchen. 3) Senden.',
      frenchOnly: 'Derzeit sind Anrufe nur auf Französisch verfügbar.',
      afterSend: 'Nach dem Senden erhalten Sie eine Bestätigung und wir erhalten Ihre Anfrage.',
      unlockCalendly: 'Bitte zuerst das Formular rechts ausfüllen, um Calendly freizuschalten.',
      requiredInfo: 'Benötigte Informationen',
      requiredInfoHint: 'Beschreiben Sie Ihre Erwartungen. Das hilft uns bei der Vorbereitung.',
      fullName: 'Vollständiger Name',
      email: 'E-Mail',
      phoneOptional: 'Telefon (optional)',
      companyOptional: 'Unternehmen (optional)',
      listingsCount: 'Anzahl Unterkünfte',
      expectations: 'Ihre Erwartungen',
      expectationsPlaceholder: 'Beschreiben Sie Ihre Ziele, Schwierigkeiten und Erwartungen an den Call.',
      selectedSlot: 'Gewählter Calendly-Termin',
      selectedSlotPlaceholder: 'Wird nach der Calendly-Buchung automatisch ausgefüllt',
      calendlyConfirmed: 'Calendly-Termin bestätigt. Sie können die Anfrage senden.',
      calendlyRequired: 'Calendly-Buchung vor dem Senden erforderlich.',
      sending: 'Wird gesendet...',
      sendRequest: 'Anfrage senden',
    },
    it: {
      slotReserved: 'Slot prenotato in Calendly',
      validationError: "Compila il modulo e prenota uno slot Calendly prima dell'invio.",
      sendError: 'Impossibile inviare la richiesta in questo momento.',
      sendSuccess: 'Richiesta inviata. Controlla la tua email: conferma inviata.',
      backHome: 'Torna alla home',
      title: 'Prenota una videochiamata',
      steps: "1) Compila il modulo. 2) Prenota su Calendly. 3) Invia.",
      frenchOnly: 'Al momento, le chiamate sono disponibili solo in francese.',
      afterSend: 'Dopo l invio ricevi una conferma e noi riceviamo la richiesta.',
      unlockCalendly: 'Compila prima il modulo a destra per sbloccare Calendly.',
      requiredInfo: 'Informazioni necessarie',
      requiredInfoHint: 'Descrivi le tue aspettative. Ci aiuta a preparare la chiamata.',
      fullName: 'Nome completo',
      email: 'Email',
      phoneOptional: 'Telefono (opzionale)',
      companyOptional: 'Azienda (opzionale)',
      listingsCount: 'Numero di alloggi',
      expectations: 'Presentazione delle tue aspettative',
      expectationsPlaceholder: 'Descrivi i tuoi obiettivi, le difficoltà e cosa ti aspetti dalla chiamata.',
      selectedSlot: 'Slot scelto in Calendly',
      selectedSlotPlaceholder: 'Compilato automaticamente dopo la prenotazione Calendly',
      calendlyConfirmed: 'Slot confermato in Calendly. Puoi inviare la richiesta.',
      calendlyRequired: "Prenotazione Calendly obbligatoria prima dell'invio.",
      sending: 'Invio...',
      sendRequest: 'Invia richiesta',
    },
  }[ll]
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
        setSlotLabel(c.slotReserved)
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
      setMessage(c.validationError)
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
        setMessage(c.sendError)
        return
      }
      setMessage(c.sendSuccess)
      setSlotLabel('')
    } catch {
      setMessage(c.sendError)
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
          {c.backHome}
        </a>

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{c.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{c.steps}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {c.frenchOnly}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">{c.afterSend}</p>

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
                    {c.unlockCalendly}
                  </p>
                </div>
              ) : null}
            </div>
            <form onSubmit={(e) => void submitRequest(e)} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">{c.requiredInfo}</p>
              <p className="mt-1 text-xs text-zinc-600">{c.requiredInfoHint}</p>

              <label className="mt-3 block text-sm text-zinc-700">
                {c.fullName}
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                {c.email}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                {c.phoneOptional}
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                {c.companyOptional}
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                {c.listingsCount}
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
                {c.expectations}
                <textarea
                  required
                  rows={4}
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  placeholder={c.expectationsPlaceholder}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="mt-3 block text-sm text-zinc-700">
                {c.selectedSlot}
                <input
                  value={slotLabel}
                  readOnly
                  placeholder={c.selectedSlotPlaceholder}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <p className={`mt-2 text-xs font-semibold ${calendlyBooked ? 'text-emerald-700' : 'text-amber-700'}`}>
                {calendlyBooked
                  ? c.calendlyConfirmed
                  : c.calendlyRequired}
              </p>

              <button
                type="submit"
                disabled={sending || !isFormReadyForCalendly || !calendlyBooked}
                className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              >
                {sending ? c.sending : c.sendRequest}
              </button>
              {message ? <p className="mt-2 text-xs font-medium text-zinc-700">{message}</p> : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
