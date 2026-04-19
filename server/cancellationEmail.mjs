import nodemailer from 'nodemailer'

function envPick(env, key) {
  const v = env?.[key]
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeLocale(input) {
  const v = String(input || '').trim().toLowerCase()
  if (v.startsWith('fr')) return 'fr'
  if (v.startsWith('es')) return 'es'
  if (v.startsWith('de')) return 'de'
  if (v.startsWith('it')) return 'it'
  return 'en'
}

function L(locale, values) {
  return values[locale] || values.en || values.fr
}

function fmtLongDate(iso, locale) {
  const lang = normalizeLocale(locale)
  const bcp = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : lang === 'it' ? 'it-IT' : 'en-US'
  try {
    return new Intl.DateTimeFormat(bcp, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function buildTransportConfig(env) {
  const host = envPick(env, 'SMTP_HOST')
  const user = envPick(env, 'SMTP_USER')
  const pass = envPick(env, 'SMTP_PASS')
  const from = envPick(env, 'SUPPORT_FROM_EMAIL') || 'support@staypilot.fr'
  const portRaw = envPick(env, 'SMTP_PORT')
  const port = Number(portRaw || '587')
  if (!host || !user || !pass || !Number.isFinite(port)) return null
  return { host, user, pass, from, port }
}

export async function sendCancellationConfirmationEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const endAtIso = (payload?.endAtIso || '').trim()
  const locale = normalizeLocale(payload?.locale)
  if (!to || !endAtIso) {
    return { ok: false, status: 400, error: 'invalid_payload' }
  }

  const smtp = buildTransportConfig(env)
  if (!smtp) {
    return { ok: false, status: 503, error: 'email_not_configured' }
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const endLabel = fmtLongDate(endAtIso, locale)
  const subject = L(locale, {
    fr: 'Confirmation de résiliation de votre abonnement StayPilot',
    en: 'Confirmation of your StayPilot subscription cancellation',
    es: 'Confirmación de cancelación de su suscripción StayPilot',
    de: 'Bestätigung der Kündigung Ihres StayPilot-Abonnements',
    it: 'Conferma di annullamento del vostro abbonamento StayPilot',
  })
  const hello = L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Ciao,' })
  const team = L(locale, { fr: "— L'équipe StayPilot", en: '— The StayPilot team', es: '— El equipo StayPilot', de: '— Das StayPilot-Team', it: '— Il team StayPilot' })
  const supportCta = L(locale, { fr: 'Contacter le support', en: 'Contact support', es: 'Contactar soporte', de: 'Support kontaktieren', it: 'Contatta il supporto' })
  const text =
    `${hello}\n\n` +
    `${L(locale, { fr: 'Votre résiliation est confirmée.', en: 'Your cancellation is confirmed.', es: 'Su cancelación está confirmada.', de: 'Ihre Kündigung wurde bestätigt.', it: 'La vostra cancellazione è confermata.' })}\n` +
    `${L(locale, { fr: 'Votre abonnement StayPilot prendra fin le', en: 'Your StayPilot subscription will end on', es: 'Su suscripción StayPilot finalizará el', de: 'Ihr StayPilot-Abonnement endet am', it: 'Il vostro abbonamento StayPilot terminerà il' })} ${endLabel}.\n\n` +
    `${L(locale, { fr: 'Jusqu’à cette date, votre accès reste actif.', en: 'Until that date, your access remains active.', es: 'Hasta esa fecha, su acceso seguirá activo.', de: 'Bis zu diesem Datum bleibt Ihr Zugang aktiv.', it: 'Fino a tale data, il vostro accesso resta attivo.' })}\n\n` +
    `${L(locale, { fr: 'Besoin d’aide ? Répondez à cet e-mail ou contactez support@staypilot.fr.', en: 'Need help? Reply to this email or contact support@staypilot.fr.', es: '¿Necesita ayuda? Responda a este correo o contacte a support@staypilot.fr.', de: 'Brauchen Sie Hilfe? Antworten Sie auf diese E-Mail oder kontaktieren Sie support@staypilot.fr.', it: 'Serve aiuto? Rispondete a questa e-mail o contattate support@staypilot.fr.' })}\n\n` +
    `${team}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f9ff;padding:24px;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#2563eb,#0ea5e9);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          StayPilot
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${L(locale, { fr: 'Votre résiliation est confirmée.', en: 'Your cancellation is confirmed.', es: 'Su cancelación está confirmada.', de: 'Ihre Kündigung wurde bestätigt.', it: 'La vostra cancellazione è confermata.' })}</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe">
            <p style="margin:0;font-size:14px;color:#1e3a8a">${L(locale, { fr: "Votre accès StayPilot reste actif jusqu'au :", en: 'Your StayPilot access remains active until:', es: 'Su acceso a StayPilot permanece activo hasta:', de: 'Ihr StayPilot-Zugang bleibt aktiv bis:', it: 'Il vostro accesso StayPilot resta attivo fino al:' })}</p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#1d4ed8">${endLabel}</p>
          </div>
          <p style="margin:0 0 14px;font-size:14px;color:#334155">${L(locale, { fr: "Jusqu'à cette date, vous conservez l'ensemble de vos accès.", en: 'Until that date, you keep full access.', es: 'Hasta esa fecha, mantiene todo su acceso.', de: 'Bis zu diesem Datum behalten Sie den vollen Zugriff.', it: "Fino a tale data, mantenete l'accesso completo." })}</p>
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">${supportCta}</a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${team}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })

  return { ok: true, status: 200 }
}

export async function sendFailedPaymentAlertEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const attempt = Number(payload?.attempt || 1)
  const suspendAtIso = (payload?.suspendAtIso || '').trim()
  const locale = normalizeLocale(payload?.locale)
  if (!to || !Number.isFinite(attempt) || attempt < 1 || attempt > 3 || !suspendAtIso) {
    return { ok: false, status: 400, error: 'invalid_payload' }
  }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const suspensionDate = fmtLongDate(suspendAtIso, locale)
  const isFinalAttempt = attempt >= 3
  const subject = isFinalAttempt
    ? L(locale, {
        fr: 'Action requise : compte StayPilot suspendu (paiement non valide)',
        en: 'Action required: StayPilot account suspended (invalid payment)',
        es: 'Acción requerida: cuenta StayPilot suspendida (pago no válido)',
        de: 'Aktion erforderlich: StayPilot-Konto gesperrt (ungültige Zahlung)',
        it: 'Azione richiesta: account StayPilot sospeso (pagamento non valido)',
      })
    : L(locale, {
        fr: `Action requise : tentative de prélèvement ${attempt}/3 échouée`,
        en: `Action required: payment attempt ${attempt}/3 failed`,
        es: `Acción requerida: intento de cobro ${attempt}/3 fallido`,
        de: `Aktion erforderlich: Abbuchungsversuch ${attempt}/3 fehlgeschlagen`,
        it: `Azione richiesta: tentativo di addebito ${attempt}/3 non riuscito`,
      })
  const hello = L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Salve,' })
  const team = L(locale, {
    fr: "— L'équipe StayPilot",
    en: '— The StayPilot team',
    es: '— El equipo StayPilot',
    de: '— Das StayPilot-Team',
    it: '— Il team StayPilot',
  })
  const cta = L(locale, {
    fr: 'Mettre à jour mes coordonnées',
    en: 'Update my payment details',
    es: 'Actualizar mis datos de pago',
    de: 'Zahlungsdaten aktualisieren',
    it: 'Aggiorna i miei dati di pagamento',
  })
  const title = L(locale, {
    fr: 'Alerte paiement StayPilot',
    en: 'StayPilot payment alert',
    es: 'Alerta de pago StayPilot',
    de: 'StayPilot-Zahlungshinweis',
    it: 'Avviso di pagamento StayPilot',
  })
  const text = isFinalAttempt
    ? `${hello}\n\n${L(locale, {
        fr: `Votre 3e tentative de prélèvement a échoué. Votre compte StayPilot est suspendu.\n\nMettez à jour vos coordonnées bancaires depuis votre profil pour réactiver l'accès.\n\nSupport : support@staypilot.fr`,
        en: `Your 3rd payment attempt failed. Your StayPilot account is suspended.\n\nUpdate your payment details in your profile to restore access.\n\nSupport: support@staypilot.fr`,
        es: `Su 3.er intento de cobro ha fallado. Su cuenta StayPilot está suspendida.\n\nActualice sus datos de pago en su perfil para reactivar el acceso.\n\nSoporte: support@staypilot.fr`,
        de: `Ihr 3. Abbuchungsversuch ist fehlgeschlagen. Ihr StayPilot-Konto ist gesperrt.\n\nAktualisieren Sie Ihre Zahlungsdaten im Profil, um den Zugang wiederherzustellen.\n\nSupport: support@staypilot.fr`,
        it: `Il 3° tentativo di addebito non è riuscito. Il suo account StayPilot è sospeso.\n\nAggiorni i dati di pagamento nel profilo per riattivare l'accesso.\n\nSupporto: support@staypilot.fr`,
      })}\n\n${team}`
    : `${hello}\n\n${L(locale, {
        fr: `La tentative de prélèvement ${attempt}/3 a échoué.\n\nMettez à jour vos coordonnées bancaires pour éviter une suspension automatique le ${suspensionDate}.\n\nSupport : support@staypilot.fr`,
        en: `Payment attempt ${attempt}/3 failed.\n\nUpdate your payment details to avoid automatic suspension on ${suspensionDate}.\n\nSupport: support@staypilot.fr`,
        es: `El intento de cobro ${attempt}/3 ha fallado.\n\nActualice sus datos de pago para evitar la suspensión automática el ${suspensionDate}.\n\nSoporte: support@staypilot.fr`,
        de: `Abbuchungsversuch ${attempt}/3 fehlgeschlagen.\n\nAktualisieren Sie Ihre Zahlungsdaten, um eine automatische Sperre am ${suspensionDate} zu vermeiden.\n\nSupport: support@staypilot.fr`,
        it: `Tentativo di addebito ${attempt}/3 non riuscito.\n\nAggiorni i dati di pagamento per evitare la sospensione automatica il ${suspensionDate}.\n\nSupporto: support@staypilot.fr`,
      })}\n\n${team}`

  const p1 = isFinalAttempt
    ? L(locale, {
        fr: 'Votre 3e tentative de prélèvement a échoué. Votre compte est suspendu.',
        en: 'Your 3rd payment attempt failed. Your account is suspended.',
        es: 'Su 3.er intento de cobro ha fallado. Su cuenta está suspendida.',
        de: 'Ihr 3. Abbuchungsversuch ist fehlgeschlagen. Ihr Konto ist gesperrt.',
        it: 'Il 3° tentativo di addebito non è riuscito. Il suo account è sospeso.',
      })
    : L(locale, {
        fr: `La tentative de prélèvement ${attempt}/3 a échoué.`,
        en: `Payment attempt ${attempt}/3 failed.`,
        es: `El intento de cobro ${attempt}/3 ha fallado.`,
        de: `Abbuchungsversuch ${attempt}/3 fehlgeschlagen.`,
        it: `Tentativo di addebito ${attempt}/3 non riuscito.`,
      })
  const p2 = isFinalAttempt
    ? L(locale, {
        fr: 'Mettez vos coordonnées bancaires à jour pour réactiver votre accès immédiatement.',
        en: 'Update your payment details to restore access immediately.',
        es: 'Actualice sus datos de pago para reactivar el acceso de inmediato.',
        de: 'Aktualisieren Sie Ihre Zahlungsdaten, um den Zugang sofort wiederherzustellen.',
        it: 'Aggiorni i dati di pagamento per riattivare subito l’accesso.',
      })
    : L(locale, {
        fr: `Sans mise à jour, suspension automatique le ${suspensionDate}.`,
        en: `Without an update, automatic suspension on ${suspensionDate}.`,
        es: `Sin actualización, suspensión automática el ${suspensionDate}.`,
        de: `Ohne Aktualisierung automatische Sperre am ${suspensionDate}.`,
        it: `Senza aggiornamento, sospensione automatica il ${suspensionDate}.`,
      })

  const html = `
    <div style="font-family:Arial,sans-serif;background:#fff7ed;padding:24px;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #fed7aa;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#ea580c,#f97316);padding:16px 24px;color:#fff;font-weight:700;font-size:19px">
          ${title}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${p1}</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#fff7ed;border:1px solid #fdba74">
            <p style="margin:0;font-size:14px;color:#9a3412">${p2}</p>
          </div>
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#9a3412;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">${cta}</a>
          <p style="margin:18px 0 0;font-size:13px;color:#7c2d12">${team}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendPlanChangeConfirmationEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const oldPlan = (payload?.oldPlan || '').trim()
  const newPlan = (payload?.newPlan || '').trim()
  const nextBillingIso = (payload?.nextBillingIso || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const locale = normalizeLocale(payload?.locale)
  if (!to || !oldPlan || !newPlan || !nextBillingIso) {
    return { ok: false, status: 400, error: 'invalid_payload' }
  }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const nextBillingLabel = fmtLongDate(nextBillingIso, locale)
  const hello = firstName
    ? L(locale, {
        fr: `Bonjour ${firstName},`,
        en: `Hello ${firstName},`,
        es: `Hola ${firstName},`,
        de: `Hallo ${firstName},`,
        it: `Salve ${firstName},`,
      })
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Salve,' })
  const team = L(locale, {
    fr: "— L'équipe StayPilot",
    en: '— The StayPilot team',
    es: '— El equipo StayPilot',
    de: '— Das StayPilot-Team',
    it: '— Il team StayPilot',
  })
  const supportCta = L(locale, {
    fr: 'Contacter le support',
    en: 'Contact support',
    es: 'Contactar soporte',
    de: 'Support kontaktieren',
    it: 'Contatta il supporto',
  })
  const subject = L(locale, {
    fr: `Merci — votre changement de forfait StayPilot est confirmé (${newPlan})`,
    en: `Thank you — your StayPilot plan change is confirmed (${newPlan})`,
    es: `Gracias — su cambio de plan StayPilot está confirmado (${newPlan})`,
    de: `Vielen Dank — Ihr StayPilot-Tarifwechsel ist bestätigt (${newPlan})`,
    it: `Grazie — la modifica del piano StayPilot è confermata (${newPlan})`,
  })
  const headTitle = L(locale, {
    fr: 'StayPilot — Changement de forfait confirmé',
    en: 'StayPilot — Plan change confirmed',
    es: 'StayPilot — Cambio de plan confirmado',
    de: 'StayPilot — Tarifwechsel bestätigt',
    it: 'StayPilot — Modifica del piano confermata',
  })
  const intro = L(locale, {
    fr: 'Merci pour votre confiance. Votre changement de forfait est bien confirmé.',
    en: 'Thank you for your trust. Your plan change is confirmed.',
    es: 'Gracias por su confianza. Su cambio de plan está confirmado.',
    de: 'Vielen Dank für Ihr Vertrauen. Ihr Tarifwechsel ist bestätigt.',
    it: 'Grazie per la fiducia. La modifica del piano è confermata.',
  })
  const oldLbl = L(locale, {
    fr: 'Ancien forfait',
    en: 'Previous plan',
    es: 'Plan anterior',
    de: 'Bisheriger Tarif',
    it: 'Piano precedente',
  })
  const newLbl = L(locale, {
    fr: 'Nouveau forfait',
    en: 'New plan',
    es: 'Nuevo plan',
    de: 'Neuer Tarif',
    it: 'Nuovo piano',
  })
  const billingNote = L(locale, {
    fr: `Important : vous ne serez pas débité immédiatement du nouveau montant. Le nouveau tarif s’appliquera à partir de votre prochaine échéance, le ${nextBillingLabel}.`,
    en: `Important: you will not be charged the new amount immediately. The new price applies from your next billing date, ${nextBillingLabel}.`,
    es: `Importante: no se le cobrará de inmediato el nuevo importe. El nuevo precio se aplicará a partir de su próxima fecha de facturación, el ${nextBillingLabel}.`,
    de: `Wichtig: Der neue Betrag wird nicht sofort abgebucht. Der neue Preis gilt ab Ihrem nächsten Abrechnungsdatum, dem ${nextBillingLabel}.`,
    it: `Importante: non verrà addebitato subito il nuovo importo. Il nuovo prezzo si applica dalla prossima data di fatturazione, il ${nextBillingLabel}.`,
  })
  const billingNoteHtml = L(locale, {
    fr: `Important : vous ne serez pas débité immédiatement du nouveau montant. Le nouveau tarif s’appliquera à partir du <strong>${nextBillingLabel}</strong>.`,
    en: `Important: you will not be charged the new amount immediately. The new price applies from <strong>${nextBillingLabel}</strong>.`,
    es: `Importante: no se le cobrará de inmediato el nuevo importe. El nuevo precio se aplicará a partir del <strong>${nextBillingLabel}</strong>.`,
    de: `Wichtig: Der neue Betrag wird nicht sofort abgebucht. Der neue Preis gilt ab dem <strong>${nextBillingLabel}</strong>.`,
    it: `Importante: non verrà addebitato subito il nuovo importo. Il nuovo prezzo si applica dal <strong>${nextBillingLabel}</strong>.`,
  })
  const helpLine = L(locale, {
    fr: "Besoin d’aide ? Répondez à cet e-mail ou contactez support@staypilot.fr.",
    en: 'Need help? Reply to this email or contact support@staypilot.fr.',
    es: '¿Necesita ayuda? Responda a este correo o contacte a support@staypilot.fr.',
    de: 'Brauchen Sie Hilfe? Antworten Sie auf diese E-Mail oder kontaktieren Sie support@staypilot.fr.',
    it: 'Serve aiuto? Rispondete a questa e-mail o contattate support@staypilot.fr.',
  })
  const text =
    `${hello}\n\n` +
    `${intro}\n` +
    `${oldLbl}: ${oldPlan}\n` +
    `${newLbl}: ${newPlan}\n\n` +
    `${billingNote}\n\n` +
    `${helpLine}\n\n` +
    `${team}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#2563eb,#3b82f6);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          ${headTitle}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${intro}</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe">
            <p style="margin:0;font-size:14px;color:#1e3a8a">${oldLbl} : <strong>${oldPlan}</strong></p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">${newLbl} : <strong>${newPlan}</strong></p>
          </div>
          <p style="margin:0 0 12px;font-size:14px;color:#334155">
            ${billingNoteHtml}
          </p>
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">${supportCta}</a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${team}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendPasswordChangedConfirmationEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const changedAtIso = (payload?.changedAtIso || '').trim() || new Date().toISOString()
  const locale = normalizeLocale(payload?.locale)
  if (!to) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const changedLabel = fmtLongDate(changedAtIso, locale)
  const hello = firstName
    ? L(locale, {
        fr: `Bonjour ${firstName},`,
        en: `Hello ${firstName},`,
        es: `Hola ${firstName},`,
        de: `Hallo ${firstName},`,
        it: `Salve ${firstName},`,
      })
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Salve,' })
  const team = L(locale, {
    fr: "— L'équipe StayPilot",
    en: '— The StayPilot team',
    es: '— El equipo StayPilot',
    de: '— Das StayPilot-Team',
    it: '— Il team StayPilot',
  })
  const supportCta = L(locale, {
    fr: 'Contacter le support',
    en: 'Contact support',
    es: 'Contactar soporte',
    de: 'Support kontaktieren',
    it: 'Contatta il supporto',
  })
  const subject = L(locale, {
    fr: 'Confirmation de changement de mot de passe StayPilot',
    en: 'StayPilot password change confirmation',
    es: 'Confirmación de cambio de contraseña StayPilot',
    de: 'Bestätigung: StayPilot-Passwort geändert',
    it: 'Conferma modifica password StayPilot',
  })
  const headTitle = L(locale, {
    fr: 'StayPilot — Sécurité du compte',
    en: 'StayPilot — Account security',
    es: 'StayPilot — Seguridad de la cuenta',
    de: 'StayPilot — Kontosicherheit',
    it: 'StayPilot — Sicurezza dell\u2019account',
  })
  const mainP = L(locale, {
    fr: `Votre mot de passe a été modifié avec succès le ${changedLabel}.`,
    en: `Your password was successfully changed on ${changedLabel}.`,
    es: `Su contraseña se modificó correctamente el ${changedLabel}.`,
    de: `Ihr Passwort wurde am ${changedLabel} erfolgreich geändert.`,
    it: `La password è stata modificata con successo il ${changedLabel}.`,
  })
  const mainPHtml = L(locale, {
    fr: `Votre mot de passe a été modifié avec succès le <strong>${changedLabel}</strong>.`,
    en: `Your password was successfully changed on <strong>${changedLabel}</strong>.`,
    es: `Su contraseña se modificó correctamente el <strong>${changedLabel}</strong>.`,
    de: `Ihr Passwort wurde am <strong>${changedLabel}</strong> erfolgreich geändert.`,
    it: `La password è stata modificata con successo il <strong>${changedLabel}</strong>.`,
  })
  const warnP = L(locale, {
    fr: 'Si ce changement ne vient pas de vous, contactez immédiatement support@staypilot.fr.',
    en: 'If you did not make this change, contact support@staypilot.fr immediately.',
    es: 'Si usted no realizó este cambio, contacte de inmediato a support@staypilot.fr.',
    de: 'Wenn Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie umgehend support@staypilot.fr.',
    it: 'Se non avete effettuato questa modifica, contattate subito support@staypilot.fr.',
  })
  const text = `${hello}\n\n${mainP}\n${warnP}\n\n${team}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#0f172a,#334155);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          ${headTitle}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${mainPHtml}</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #cbd5e1">
            <p style="margin:0;font-size:13px;color:#334155">${warnP}</p>
          </div>
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">${supportCta}</a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${team}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendPasswordResetConfirmationEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const resetAtIso = (payload?.resetAtIso || '').trim() || new Date().toISOString()
  const locale = normalizeLocale(payload?.locale)
  if (!to) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const resetLabel = fmtLongDate(resetAtIso, locale)
  const hello = firstName
    ? L(locale, {
        fr: `Bonjour ${firstName},`,
        en: `Hello ${firstName},`,
        es: `Hola ${firstName},`,
        de: `Hallo ${firstName},`,
        it: `Salve ${firstName},`,
      })
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Salve,' })
  const team = L(locale, {
    fr: "— L'équipe StayPilot",
    en: '— The StayPilot team',
    es: '— El equipo StayPilot',
    de: '— Das StayPilot-Team',
    it: '— Il team StayPilot',
  })
  const supportCta = L(locale, {
    fr: 'Contacter le support',
    en: 'Contact support',
    es: 'Contactar soporte',
    de: 'Support kontaktieren',
    it: 'Contatta il supporto',
  })
  const subject = L(locale, {
    fr: 'Confirmation de réinitialisation du mot de passe StayPilot',
    en: 'StayPilot password reset confirmation',
    es: 'Confirmación de restablecimiento de contraseña StayPilot',
    de: 'Bestätigung: StayPilot-Passwort zurückgesetzt',
    it: 'Conferma reimpostazione password StayPilot',
  })
  const headTitle = L(locale, {
    fr: 'StayPilot — Réinitialisation du mot de passe',
    en: 'StayPilot — Password reset',
    es: 'StayPilot — Restablecimiento de contraseña',
    de: 'StayPilot — Passwort zurückgesetzt',
    it: 'StayPilot — Reimpostazione password',
  })
  const mainP = L(locale, {
    fr: `Votre mot de passe a été réinitialisé avec succès le ${resetLabel}.`,
    en: `Your password was successfully reset on ${resetLabel}.`,
    es: `Su contraseña se restableció correctamente el ${resetLabel}.`,
    de: `Ihr Passwort wurde am ${resetLabel} erfolgreich zurückgesetzt.`,
    it: `La password è stata reimpostata con successo il ${resetLabel}.`,
  })
  const mainPHtml = L(locale, {
    fr: `Votre mot de passe a été réinitialisé avec succès le <strong>${resetLabel}</strong>.`,
    en: `Your password was successfully reset on <strong>${resetLabel}</strong>.`,
    es: `Su contraseña se restableció correctamente el <strong>${resetLabel}</strong>.`,
    de: `Ihr Passwort wurde am <strong>${resetLabel}</strong> erfolgreich zurückgesetzt.`,
    it: `La password è stata reimpostata con successo il <strong>${resetLabel}</strong>.`,
  })
  const warnP = L(locale, {
    fr: 'Si cette action ne vient pas de vous, contactez immédiatement support@staypilot.fr.',
    en: 'If you did not perform this action, contact support@staypilot.fr immediately.',
    es: 'Si usted no realizó esta acción, contacte de inmediato a support@staypilot.fr.',
    de: 'Wenn Sie diese Aktion nicht ausgeführt haben, kontaktieren Sie umgehend support@staypilot.fr.',
    it: 'Se non avete effettuato questa operazione, contattate subito support@staypilot.fr.',
  })
  const text = `${hello}\n\n${mainP}\n${warnP}\n\n${team}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#0f172a,#334155);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          ${headTitle}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${mainPHtml}</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #cbd5e1">
            <p style="margin:0;font-size:13px;color:#334155">${warnP}</p>
          </div>
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">${supportCta}</a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${team}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendPasswordVerificationCodeEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const code = String(payload?.code || '').trim()
  const locale = normalizeLocale(payload?.locale)
  if (!to || !/^\d{6}$/.test(code)) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const hello = firstName
    ? L(locale, {
        fr: `Bonjour ${firstName},`,
        en: `Hello ${firstName},`,
        es: `Hola ${firstName},`,
        de: `Hallo ${firstName},`,
        it: `Salve ${firstName},`,
      })
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Salve,' })
  const subject = L(locale, {
    fr: 'Code de vérification StayPilot (mot de passe)',
    en: 'StayPilot verification code (password)',
    es: 'Código de verificación StayPilot (contraseña)',
    de: 'StayPilot-Bestätigungscode (Passwort)',
    it: 'Codice di verifica StayPilot (password)',
  })
  const team = L(locale, {
    fr: "— L'équipe StayPilot",
    en: '— The StayPilot team',
    es: '— El equipo StayPilot',
    de: '— Das StayPilot-Team',
    it: '— Il team StayPilot',
  })
  const headTitle = L(locale, {
    fr: 'StayPilot — Vérification de sécurité',
    en: 'StayPilot — Security verification',
    es: 'StayPilot — Verificación de seguridad',
    de: 'StayPilot — Sicherheitsprüfung',
    it: 'StayPilot — Verifica di sicurezza',
  })
  const instruct = L(locale, {
    fr: 'Utilisez ce code pour confirmer la modification du mot de passe :',
    en: 'Use this code to confirm your password change:',
    es: 'Use este código para confirmar el cambio de contraseña:',
    de: 'Verwenden Sie diesen Code, um die Passwortänderung zu bestätigen:',
    it: 'Usi questo codice per confermare la modifica della password:',
  })
  const codeLine = L(locale, {
    fr: `Voici votre code de vérification à 6 chiffres : ${code}`,
    en: `Your 6-digit verification code is: ${code}`,
    es: `Su código de verificación de 6 dígitos es: ${code}`,
    de: `Ihr 6-stelliger Bestätigungscode lautet: ${code}`,
    it: `Il codice di verifica a 6 cifre è: ${code}`,
  })
  const valid10 = L(locale, {
    fr: 'Ce code est valable 10 minutes.',
    en: 'This code is valid for 10 minutes.',
    es: 'Este código es válido durante 10 minutos.',
    de: 'Dieser Code ist 10 Minuten gültig.',
    it: 'Questo codice è valido per 10 minuti.',
  })
  const ignoreLine = L(locale, {
    fr: 'Si cette demande ne vient pas de vous, ignorez cet e-mail et contactez support@staypilot.fr.',
    en: 'If you did not request this, ignore this email and contact support@staypilot.fr.',
    es: 'Si no realizó esta solicitud, ignore este correo y contacte a support@staypilot.fr.',
    de: 'Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail und kontaktieren Sie support@staypilot.fr.',
    it: 'Se non avete richiesto questa operazione, ignorate questa e-mail e contattate support@staypilot.fr.',
  })
  const text = `${hello}\n\n${codeLine}\n${valid10}\n${ignoreLine}\n\n${team}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#0f172a,#334155);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          ${headTitle}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155">${instruct}</p>
          <div style="margin:10px 0 14px;padding:14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center">
            <p style="margin:0;font-size:30px;letter-spacing:4px;font-weight:700;color:#1d4ed8">${code}</p>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#475569">${valid10}</p>
          <p style="margin:0;font-size:13px;color:#475569">${ignoreLine}</p>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${team}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendSignupEmailVerificationCodeEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const code = String(payload?.code || '').trim()
  const locale = normalizeLocale(payload?.locale)
  if (!to || !/^\d{6}$/.test(code)) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const hello = firstName ? `${L(locale, { fr: 'Bonjour', en: 'Hello', es: 'Hola', de: 'Hallo', it: 'Ciao' })} ${firstName},` : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Ciao,' })
  const subject = L(locale, {
    fr: 'Code de vérification StayPilot (adresse e-mail)',
    en: 'StayPilot verification code (email address)',
    es: 'Codigo de verificacion StayPilot (correo electronico)',
    de: 'StayPilot-Bestätigungscode (E-Mail-Adresse)',
    it: 'Codice di verifica StayPilot (indirizzo email)',
  })
  const intro = L(locale, {
    fr: 'Utilisez ce code pour confirmer votre adresse e-mail lors de la création de votre compte StayPilot.',
    en: 'Use this code to confirm your email address while creating your StayPilot account.',
    es: 'Use este codigo para confirmar su correo al crear su cuenta StayPilot.',
    de: 'Nutzen Sie diesen Code, um Ihre E-Mail-Adresse bei der StayPilot-Kontoerstellung zu bestatigen.',
    it: 'Usa questo codice per confermare la tua email durante la creazione del account StayPilot.',
  })
  const codeLine = L(locale, {
    fr: `Voici votre code de vérification à 6 chiffres : ${code}`,
    en: `Your 6-digit verification code: ${code}`,
    es: `Su codigo de verificacion de 6 digitos: ${code}`,
    de: `Ihr 6-stelliger Bestatigungscode: ${code}`,
    it: `Il tuo codice di verifica a 6 cifre: ${code}`,
  })
  const footer = L(locale, {
    fr: `Ce code est valable 10 minutes.\nSi vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail et contactez support@staypilot.fr.\n\n- L'équipe StayPilot`,
    en: `This code is valid for 10 minutes.\nIf you did not start this signup, ignore this email and contact support@staypilot.fr.\n\n- The StayPilot team`,
    es: `Este codigo es valido 10 minutos.\nSi no ha iniciado este registro, ignore este correo y contacte support@staypilot.fr.\n\n- El equipo StayPilot`,
    de: `Dieser Code ist 10 Minuten gultig.\nWenn Sie diese Registrierung nicht gestartet haben, ignorieren Sie diese E-Mail und kontaktieren Sie support@staypilot.fr.\n\n- Ihr StayPilot-Team`,
    it: `Questo codice e valido per 10 minuti.\nSe non avete avviato questa registrazione, ignorate questa email e contattate support@staypilot.fr.\n\n- Il team StayPilot`,
  })
  const text = `${hello}\n\n${intro}\n\n${codeLine}\n\n${footer}`

  const htmlIntro = L(locale, {
    fr: 'Utilisez ce code pour confirmer votre adresse e-mail lors de la création de votre compte :',
    en: 'Use this code to confirm your email address while creating your account:',
    es: 'Use este codigo para confirmar su correo al crear su cuenta:',
    de: 'Nutzen Sie diesen Code, um Ihre E-Mail-Adresse bei der Kontoerstellung zu bestatigen:',
    it: 'Usa questo codice per confermare la tua email durante la creazione del account:',
  })
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#0f172a,#334155);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          StayPilot - Vérification e-mail
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155">${htmlIntro}</p>
          <div style="margin:10px 0 14px;padding:14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;text-align:center">
            <p style="margin:0;font-size:30px;letter-spacing:4px;font-weight:700;color:#1d4ed8">${code}</p>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#475569">${L(locale, { fr: 'Ce code est valable 10 minutes.', en: 'This code is valid for 10 minutes.', es: 'Este codigo es valido 10 minutos.', de: 'Dieser Code ist 10 Minuten gultig.', it: 'Questo codice e valido per 10 minuti.' })}</p>
          <p style="margin:0;font-size:13px;color:#475569">${L(locale, { fr: "Si cette demande ne vient pas de vous, ignorez cet e-mail et contactez support@staypilot.fr.", en: 'If you did not request this, ignore this email and contact support@staypilot.fr.', es: 'Si no lo solicito, ignore este correo y contacte support@staypilot.fr.', de: 'Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail und kontaktieren Sie support@staypilot.fr.', it: 'Se non avete richiesto questo, ignorate questa email e contattate support@staypilot.fr.' })}</p>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">- L'équipe StayPilot</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendWelcomeOnboardingEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const role = String(payload?.role || 'host').trim().toLowerCase()
  const locale = normalizeLocale(payload?.locale)
  if (!to) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const hello = firstName
    ? `${L(locale, { fr: 'Bonjour', en: 'Hello', es: 'Hola', de: 'Hallo', it: 'Ciao' })} ${firstName},`
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Ciao,' })
  const subject = L(locale, {
    fr: 'Bienvenue sur StayPilot',
    en: 'Welcome to StayPilot',
    es: 'Bienvenido a StayPilot',
    de: 'Willkommen bei StayPilot',
    it: 'Benvenuto su StayPilot',
  })
  const roleLine = role === 'cleaner'
    ? L(locale, {
      fr: 'Votre compte prestataire ménage est actif.',
      en: 'Your cleaning provider account is now active.',
      es: 'Su cuenta de proveedor de limpieza ya esta activa.',
      de: 'Ihr Dienstleister-Konto ist jetzt aktiv.',
      it: 'Il vostro account fornitore pulizie e ora attivo.',
    })
    : L(locale, {
      fr: 'Votre compte hôte est actif et prêt à connecter vos logements.',
      en: 'Your host account is active and ready to connect your listings.',
      es: 'Su cuenta de anfitrion esta activa y lista para conectar alojamientos.',
      de: 'Ihr Gastgeberkonto ist aktiv und bereit, Unterkunfte zu verbinden.',
      it: 'Il vostro account host e attivo e pronto a collegare gli alloggi.',
    })
  const text =
    `${hello}\n\n` +
    `${L(locale, { fr: 'Merci pour votre inscription sur StayPilot.', en: 'Thank you for signing up to StayPilot.', es: 'Gracias por registrarse en StayPilot.', de: 'Danke fur Ihre Registrierung bei StayPilot.', it: 'Grazie per esservi registrati su StayPilot.' })}\n` +
    `${roleLine}\n\n` +
    `${L(locale, { fr: 'Vous pouvez maintenant accéder à votre dashboard et finaliser votre configuration.', en: 'You can now access your dashboard and complete your setup.', es: 'Ahora puede acceder al panel y completar su configuracion.', de: 'Sie konnen jetzt auf Ihr Dashboard zugreifen und die Einrichtung abschliessen.', it: 'Ora potete accedere alla dashboard e completare la configurazione.' })}\n\n` +
    `${L(locale, { fr: "Besoin d'aide ? Répondez à cet e-mail ou contactez support@staypilot.fr.", en: 'Need help? Reply to this email or contact support@staypilot.fr.', es: 'Necesita ayuda? Responda a este correo o contacte support@staypilot.fr.', de: 'Brauchen Sie Hilfe? Antworten Sie auf diese E-Mail oder kontaktieren Sie support@staypilot.fr.', it: 'Serve aiuto? Rispondete a questa e-mail o contattate support@staypilot.fr.' })}\n\n` +
    `${L(locale, { fr: "- L'équipe StayPilot", en: '- The StayPilot team', es: '- El equipo StayPilot', de: '- Das StayPilot-Team', it: '- Il team StayPilot' })}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#2563eb,#0ea5e9);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          StayPilot
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${L(locale, { fr: 'Merci pour votre inscription sur StayPilot.', en: 'Thank you for signing up to StayPilot.', es: 'Gracias por registrarse en StayPilot.', de: 'Danke fur Ihre Registrierung bei StayPilot.', it: 'Grazie per esservi registrati su StayPilot.' })}</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe">
            <p style="margin:0;font-size:14px;color:#1e3a8a">${roleLine}</p>
          </div>
          <p style="margin:0 0 12px;font-size:14px;color:#334155">${L(locale, { fr: 'Vous pouvez maintenant accéder à votre dashboard et finaliser votre configuration.', en: 'You can now access your dashboard and complete your setup.', es: 'Ahora puede acceder al panel y completar su configuracion.', de: 'Sie konnen jetzt auf Ihr Dashboard zugreifen und die Einrichtung abschliessen.', it: 'Ora potete accedere alla dashboard e completare la configurazione.' })}</p>
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">${L(locale, { fr: 'Contacter le support', en: 'Contact support', es: 'Contactar soporte', de: 'Support kontaktieren', it: 'Contatta il supporto' })}</a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${L(locale, { fr: "- L'équipe StayPilot", en: '- The StayPilot team', es: '- El equipo StayPilot', de: '- Das StayPilot-Team', it: '- Il team StayPilot' })}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendActivityDigestEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const cadence = (payload?.cadence || 'weekly').trim()
  const periodLabel = (payload?.periodLabel || '').trim() || 'période récente'
  const reservationsCount = Number(payload?.reservationsCount || 0)
  const newReservationsCount = Number(payload?.newReservationsCount || 0)
  const checkInCount = Number(payload?.checkInCount || 0)
  const checkOutCount = Number(payload?.checkOutCount || 0)
  const newReservationsDeltaPct = Number(payload?.newReservationsDeltaPct || 0)
  const checkInDeltaPct = Number(payload?.checkInDeltaPct || 0)
  const checkOutDeltaPct = Number(payload?.checkOutDeltaPct || 0)
  const nightsCount = Number(payload?.nightsCount || 0)
  const grossRevenueEur = Number(payload?.grossRevenueEur || 0)
  const netPayoutEur = Number(payload?.netPayoutEur || 0)
  const avgStayNights = Number(payload?.avgStayNights || 0)
  const upcomingOccupancyPct = Number(payload?.upcomingOccupancyPct || 0)
  const upcomingNights = Number(payload?.upcomingNights || 0)
  const upcomingPeriodLabel = (payload?.upcomingPeriodLabel || '').trim() || 'période à venir'
  const upcomingOutlookLabel = (payload?.upcomingOutlookLabel || 'période à venir').trim()
  const upcomingRecommendations = Array.isArray(payload?.upcomingRecommendations)
    ? payload.upcomingRecommendations.map((v) => String(v || '').trim()).filter(Boolean)
    : []
  const demandByDayLabel = (payload?.demandByDayLabel || '').trim()
  const apartmentInsights = Array.isArray(payload?.apartmentInsights)
    ? payload.apartmentInsights.map((v) => String(v || '').trim()).filter(Boolean)
    : []
  const apartmentScoring = Array.isArray(payload?.apartmentScoring)
    ? payload.apartmentScoring
        .map((row) => ({
          apartment: String(row?.apartment || '').trim(),
          score: String(row?.score || '').trim(),
          scoreReason: String(row?.scoreReason || '').trim(),
          actionPrice: String(row?.actionPrice || '').trim(),
          actionLos: String(row?.actionLos || '').trim(),
          actionPromo: String(row?.actionPromo || '').trim(),
        }))
        .filter((row) => row.apartment && row.score)
    : []
  const watchIntelSummaryLines = Array.isArray(payload?.watchIntelSummaryLines)
    ? payload.watchIntelSummaryLines.map((v) => String(v || '').trim()).filter(Boolean)
    : []
  const watchIntelAddress = (payload?.watchIntelAddress || '').trim()
  const watchIntelMonthLabel = (payload?.watchIntelMonthLabel || '').trim()
  const mostFilledAptLabel = (payload?.mostFilledAptLabel || '').trim()
  const mostEmptyAptLabel = (payload?.mostEmptyAptLabel || '').trim()
  const connectedApartmentsCount = Number(payload?.connectedApartmentsCount || 0)
  const dataConfidenceLabel = (payload?.dataConfidenceLabel || '').trim()
  const lowStockCount = Number(payload?.lowStockCount || 0)
  const unpaidInvoicesCount = Number(payload?.unpaidInvoicesCount || 0)
  const cleaningCompletionPct = Number(payload?.cleaningCompletionPct || 0)
  const locale = normalizeLocale(payload?.locale)
  if (!to) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const hello = firstName
    ? `${L(locale, { fr: 'Bonjour', en: 'Hello', es: 'Hola', de: 'Hallo', it: 'Ciao' })} ${firstName},`
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Ciao,' })
  const cadenceLabel =
    cadence === 'monthly'
      ? L(locale, { fr: 'mensuelle', en: 'monthly', es: 'mensual', de: 'monatlich', it: 'mensile' })
      : cadence === 'daily'
        ? L(locale, { fr: 'quotidienne', en: 'daily', es: 'diaria', de: 'täglich', it: 'giornaliera' })
        : L(locale, { fr: 'hebdomadaire', en: 'weekly', es: 'semanal', de: 'wöchentlich', it: 'settimanale' })
  const comparisonLabel =
    cadence === 'monthly'
      ? 'mois -1'
      : cadence === 'daily'
        ? 'jour -1'
        : 'semaine -1'
  const subject = L(locale, {
    fr: `Votre synthèse ${cadenceLabel} StayPilot`,
    en: `Your ${cadenceLabel} StayPilot summary`,
    es: `Su resumen ${cadenceLabel} de StayPilot`,
    de: `Ihre ${cadenceLabel} StayPilot-Zusammenfassung`,
    it: `Il vostro riepilogo ${cadenceLabel} StayPilot`,
  })
  const text =
    `${hello}\n\n` +
    `Voici votre synthèse ${cadenceLabel} (${periodLabel}).\n\n` +
    (dataConfidenceLabel ? `Niveau de données : ${dataConfidenceLabel}\n` : '') +
    (connectedApartmentsCount > 0 ? `Logements analyses: ${connectedApartmentsCount}\n` : '') +
    `\n` +
    `Les pourcentages sont comparés à la période précédente (${comparisonLabel}).\n\n` +
    `- Reservations: ${reservationsCount}\n` +
    `- Nouvelles reservations: ${newReservationsCount} (${newReservationsDeltaPct >= 0 ? '+' : ''}${newReservationsDeltaPct.toFixed(1)}%)\n` +
    `- Check-in: ${checkInCount} (${checkInDeltaPct >= 0 ? '+' : ''}${checkInDeltaPct.toFixed(1)}%)\n` +
    `- Check-out: ${checkOutCount} (${checkOutDeltaPct >= 0 ? '+' : ''}${checkOutDeltaPct.toFixed(1)}%)\n` +
    `- Nuits réservées: ${nightsCount}\n` +
    `- Chiffre d'affaires brut: ${grossRevenueEur.toFixed(2)} EUR\n` +
    `- Encaisse net estime: ${netPayoutEur.toFixed(2)} EUR\n` +
    `- Duree moyenne de sejour: ${avgStayNights.toFixed(1)} nuits\n\n` +
    `- Alertes stock consommables: ${lowStockCount}\n` +
    `- Factures menage en attente: ${unpaidInvoicesCount}\n` +
    `- Completion taches menage: ${cleaningCompletionPct.toFixed(1)}%\n\n` +
    `Prevision (${upcomingOutlookLabel}) - ${upcomingPeriodLabel}\n` +
    `- Taux d'occupation previsionnel: ${upcomingOccupancyPct.toFixed(1)}%\n` +
    `- Nuits déjà réservées: ${upcomingNights}\n` +
    (mostFilledAptLabel ? `- Logement le plus rempli: ${mostFilledAptLabel}\n` : '') +
    (mostEmptyAptLabel ? `- Logement le plus creux: ${mostEmptyAptLabel}\n` : '') +
    (demandByDayLabel ? `- Intensite par jour: ${demandByDayLabel}\n` : '') +
    (apartmentInsights.length > 0
      ? `- Detail par appartement:\n${apartmentInsights.map((line) => `  • ${line}`).join('\n')}\n`
      : '') +
    (apartmentScoring.length > 0
      ? `- Scoring & plan d'action:\n${apartmentScoring
          .map(
            (row) =>
              `  • ${row.apartment} | Score ${row.score} (${row.scoreReason})\n    - Prix: ${row.actionPrice}\n    - Minimum stay: ${row.actionLos}\n    - Promo: ${row.actionPromo}`,
          )
          .join('\n')}\n`
      : '') +
    (watchIntelSummaryLines.length > 0
      ? `- Veille informationnelle (${watchIntelMonthLabel || 'période locale'})${watchIntelAddress ? ` - ${watchIntelAddress}` : ''}:\n${watchIntelSummaryLines.map((line) => `  • ${line}`).join('\n')}\n`
      : '') +
    `${upcomingRecommendations.length > 0 ? `\nConseils pricing:\n${upcomingRecommendations.map((line) => `- ${line}`).join('\n')}\n\n` : '\n'}` +
    `Support: support@staypilot.fr\n\n` +
    `- L'équipe StayPilot`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#1d4ed8,#2563eb);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          StayPilot - Synthese ${cadenceLabel}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:14px;color:#334155">Periode analysee: <strong>${periodLabel}</strong></p>
          ${
            dataConfidenceLabel || connectedApartmentsCount > 0
              ? `<p style="margin:0 0 12px;font-size:13px;color:#475569">
                  ${dataConfidenceLabel ? `Niveau de données : <strong>${dataConfidenceLabel}</strong>. ` : ''}
                  ${connectedApartmentsCount > 0 ? `Logements analyses: <strong>${connectedApartmentsCount}</strong>.` : ''}
                </p>`
              : ''
          }
          <p style="margin:0 0 12px;font-size:13px;color:#475569">Les pourcentages sont comparés à la période précédente (<strong>${comparisonLabel}</strong>).</p>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe">
            <p style="margin:0;font-size:14px;color:#1e3a8a">Reservations: <strong>${reservationsCount}</strong></p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">Nouvelles reservations: <strong>${newReservationsCount}</strong> (${newReservationsDeltaPct >= 0 ? '+' : ''}${newReservationsDeltaPct.toFixed(1)}%)</p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">Check-in: <strong>${checkInCount}</strong> (${checkInDeltaPct >= 0 ? '+' : ''}${checkInDeltaPct.toFixed(1)}%)</p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">Check-out: <strong>${checkOutCount}</strong> (${checkOutDeltaPct >= 0 ? '+' : ''}${checkOutDeltaPct.toFixed(1)}%)</p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">Nuits réservées: <strong>${nightsCount}</strong></p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">CA brut: <strong>${grossRevenueEur.toFixed(2)} EUR</strong></p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">Encaisse net estime: <strong>${netPayoutEur.toFixed(2)} EUR</strong></p>
            <p style="margin:6px 0 0;font-size:14px;color:#1e3a8a">Duree moyenne de sejour: <strong>${avgStayNights.toFixed(1)} nuits</strong></p>
            <p style="margin:6px 0 0;font-size:13px;color:#334155">Alertes stock consommables: <strong>${lowStockCount}</strong></p>
            <p style="margin:6px 0 0;font-size:13px;color:#334155">Factures menage en attente: <strong>${unpaidInvoicesCount}</strong></p>
            <p style="margin:6px 0 0;font-size:13px;color:#334155">Completion taches menage: <strong>${cleaningCompletionPct.toFixed(1)}%</strong></p>
          </div>
          <div style="margin:14px 0;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #cbd5e1">
            <p style="margin:0;font-size:14px;color:#0f172a"><strong>Projection ${upcomingOutlookLabel}</strong> (${upcomingPeriodLabel})</p>
            <p style="margin:6px 0 0;font-size:14px;color:#334155">Taux d occupation previsionnel: <strong>${upcomingOccupancyPct.toFixed(1)}%</strong></p>
            <p style="margin:6px 0 0;font-size:14px;color:#334155">Nuits déjà réservées: <strong>${upcomingNights}</strong></p>
            ${mostFilledAptLabel ? `<p style="margin:6px 0 0;font-size:13px;color:#334155">Logement le plus rempli: <strong>${mostFilledAptLabel}</strong></p>` : ''}
            ${mostEmptyAptLabel ? `<p style="margin:6px 0 0;font-size:13px;color:#334155">Logement le plus creux: <strong>${mostEmptyAptLabel}</strong></p>` : ''}
            ${
              demandByDayLabel
                ? `<p style="margin:6px 0 0;font-size:13px;color:#475569">Intensite par jour: ${demandByDayLabel}</p>`
                : ''
            }
            ${
              apartmentInsights.length > 0
                ? `<div style="margin-top:8px">
                    ${apartmentInsights
                      .map(
                        (line) =>
                          `<p style="margin:0 0 4px;font-size:12px;color:#475569">- ${line}</p>`,
                      )
                      .join('')}
                  </div>`
                : ''
            }
            ${
              apartmentScoring.length > 0
                ? `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #cbd5e1">
                    <p style="margin:0 0 8px;font-size:13px;color:#334155"><strong>Scoring logements & plan d'action</strong></p>
                    ${apartmentScoring
                      .map(
                        (row) => `<div style="margin:0 0 8px">
                          <p style="margin:0;font-size:12px;color:#0f172a"><strong>${row.apartment}</strong> - Score ${row.score} (${row.scoreReason})</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#475569">Prix: ${row.actionPrice}</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#475569">Minimum stay: ${row.actionLos}</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#475569">Promo: ${row.actionPromo}</p>
                        </div>`,
                      )
                      .join('')}
                  </div>`
                : ''
            }
            ${
              watchIntelSummaryLines.length > 0
                ? `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #cbd5e1">
                    <p style="margin:0 0 8px;font-size:13px;color:#334155"><strong>Veille informationnelle ${
                      watchIntelMonthLabel ? `(${watchIntelMonthLabel})` : ''
                    }</strong>${watchIntelAddress ? ` - ${watchIntelAddress}` : ''}</p>
                    ${watchIntelSummaryLines
                      .map((line) => `<p style="margin:0 0 6px;font-size:12px;color:#475569">- ${line}</p>`)
                      .join('')}
                  </div>`
                : ''
            }
          </div>
          ${
            upcomingRecommendations.length > 0
              ? `<div style="margin:14px 0;padding:14px;border-radius:10px;background:#ecfeff;border:1px solid #a5f3fc">
                  <p style="margin:0 0 8px;font-size:14px;color:#0c4a6e"><strong>Actions recommandees</strong></p>
                  ${upcomingRecommendations
                    .map(
                      (line) =>
                        `<p style="margin:0 0 6px;font-size:13px;color:#155e75">- ${line}</p>`,
                    )
                    .join('')}
                </div>`
              : ''
          }
          <a href="mailto:support@staypilot.fr" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">Contacter le support</a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">- L'équipe StayPilot</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  return { ok: true, status: 200 }
}

export async function sendCallBookingConfirmationEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const firstName = (payload?.firstName || '').trim()
  const phone = (payload?.phone || '').trim()
  const company = (payload?.company || '').trim()
  const listingsCount = String(payload?.listingsCount || '').trim()
  const expectations = String(payload?.expectations || '').trim()
  const meetUrl = (payload?.meetUrl || '').trim()
  const slotLabel = (payload?.slotLabel || '').trim()
  const locale = normalizeLocale(payload?.locale)
  if (!to || !meetUrl) return { ok: false, status: 400, error: 'invalid_payload' }

  const smtp = buildTransportConfig(env)
  if (!smtp) return { ok: false, status: 503, error: 'email_not_configured' }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const hello = firstName
    ? `${L(locale, { fr: 'Bonjour', en: 'Hello', es: 'Hola', de: 'Hallo', it: 'Ciao' })} ${firstName},`
    : L(locale, { fr: 'Bonjour,', en: 'Hello,', es: 'Hola,', de: 'Hallo,', it: 'Ciao,' })

  const subject = L(locale, {
    fr: 'Confirmation de votre appel visio StayPilot',
    en: 'Confirmation of your StayPilot video call',
    es: 'Confirmación de su videollamada StayPilot',
    de: 'Bestätigung Ihres StayPilot-Videoanrufs',
    it: 'Conferma della vostra videochiamata StayPilot',
  })

  const text =
    `${hello}\n\n` +
    `${L(locale, { fr: 'Votre réservation d’appel est bien enregistrée.', en: 'Your call booking has been recorded.', es: 'Su reserva de llamada ha sido registrada.', de: 'Ihre Anrufbuchung wurde erfasst.', it: 'La vostra prenotazione chiamata è stata registrata.' })}\n` +
    (slotLabel
      ? `${L(locale, { fr: 'Créneau', en: 'Time slot', es: 'Franja horaria', de: 'Zeitfenster', it: 'Fascia oraria' })}: ${slotLabel}\n`
      : '') +
    `${L(locale, { fr: 'Lien Google Meet', en: 'Google Meet link', es: 'Enlace de Google Meet', de: 'Google Meet-Link', it: 'Link Google Meet' })}: ${meetUrl}\n\n` +
    `${L(locale, { fr: "Besoin d'aide ? Contactez support@staypilot.fr.", en: 'Need help? Contact support@staypilot.fr.', es: '¿Necesita ayuda? Contacte a support@staypilot.fr.', de: 'Brauchen Sie Hilfe? Kontaktieren Sie support@staypilot.fr.', it: 'Serve aiuto? Contattate support@staypilot.fr.' })}\n\n` +
    `${L(locale, { fr: "- L'équipe StayPilot", en: '- The StayPilot team', es: '- El equipo StayPilot', de: '- Das StayPilot-Team', it: '- Il team StayPilot' })}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(90deg,#0ea5e9,#2563eb);padding:18px 24px;color:#fff;font-weight:700;font-size:20px">
          StayPilot - ${L(locale, { fr: 'Appel visio confirmé', en: 'Video call confirmed', es: 'Videollamada confirmada', de: 'Videoanruf bestätigt', it: 'Videochiamata confermata' })}
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px;font-size:15px">${hello}</p>
          <p style="margin:0 0 12px;font-size:15px">${L(locale, { fr: 'Votre réservation d’appel est bien enregistrée.', en: 'Your call booking has been recorded.', es: 'Su reserva de llamada ha sido registrada.', de: 'Ihre Anrufbuchung wurde erfasst.', it: 'La vostra prenotazione chiamata è stata registrata.' })}</p>
          ${
            slotLabel
              ? `<p style="margin:0 0 10px;font-size:14px;color:#334155"><strong>${L(locale, { fr: 'Créneau', en: 'Time slot', es: 'Franja horaria', de: 'Zeitfenster', it: 'Fascia oraria' })} :</strong> ${slotLabel}</p>`
              : ''
          }
          <a href="${meetUrl}" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#fff;text-decoration:none;border-radius:9px;font-size:13px;font-weight:600">
            ${L(locale, { fr: 'Rejoindre la visio (Google Meet)', en: 'Join video call (Google Meet)', es: 'Unirse a la videollamada (Google Meet)', de: 'Videoanruf beitreten (Google Meet)', it: 'Partecipa alla videochiamata (Google Meet)' })}
          </a>
          <p style="margin:18px 0 0;font-size:13px;color:#475569">${L(locale, { fr: "- L'équipe StayPilot", en: '- The StayPilot team', es: '- El equipo StayPilot', de: '- Das StayPilot-Team', it: '- Il team StayPilot' })}</p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: smtp.from,
    subject,
    text,
    html,
  })
  const internalTo = envPick(env, 'CALL_BOOKING_NOTIFY_TO')
  if (internalTo) {
    const internalSubject = `Nouveau RDV appel StayPilot - ${firstName || to}`
    const internalText =
      `Nouveau lead appel visio.\n\n` +
      `Nom: ${firstName || '(non renseigné)'}\n` +
      `Email: ${to}\n` +
      `Téléphone: ${phone || '(non renseigné)'}\n` +
      `Société: ${company || '(non renseignée)'}\n` +
      `Nombre de logements: ${listingsCount || '(non renseigné)'}\n` +
      `Créneau choisi: ${slotLabel || '(non renseigné)'}\n` +
      `Attentes:\n${expectations || '(non renseignées)'}\n\n` +
      `Lien Meet: ${meetUrl}`
    await transporter.sendMail({
      from: smtp.from,
      to: internalTo,
      replyTo: to,
      subject: internalSubject,
      text: internalText,
    })
  }
  return { ok: true, status: 200 }
}

