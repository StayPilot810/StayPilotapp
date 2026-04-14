import nodemailer from 'nodemailer'

function envPick(env, key) {
  const v = env?.[key]
  return typeof v === 'string' ? v.trim() : ''
}

function fmtLongDateFr(iso) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export async function sendCancellationConfirmationEmail(payload, env = process.env) {
  const to = (payload?.to || '').trim()
  const endAtIso = (payload?.endAtIso || '').trim()
  if (!to || !endAtIso) {
    return { ok: false, status: 400, error: 'invalid_payload' }
  }

  const host = envPick(env, 'SMTP_HOST')
  const user = envPick(env, 'SMTP_USER')
  const pass = envPick(env, 'SMTP_PASS')
  const from = envPick(env, 'SUPPORT_FROM_EMAIL') || 'support@staypilot.fr'
  const portRaw = envPick(env, 'SMTP_PORT')
  const port = Number(portRaw || '587')

  if (!host || !user || !pass || !Number.isFinite(port)) {
    return { ok: false, status: 503, error: 'email_not_configured' }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const endLabel = fmtLongDateFr(endAtIso)
  const subject = 'Confirmation de résiliation de votre abonnement StayPilot'
  const text =
    `Bonjour,\n\n` +
    `Votre résiliation est confirmée.\n` +
    `Votre abonnement StayPilot prendra fin le ${endLabel}.\n\n` +
    `Jusqu’à cette date, votre accès reste actif.\n\n` +
    `Besoin d’aide ? Répondez à cet e-mail ou contactez support@staypilot.fr.\n\n` +
    `— L’équipe StayPilot`

  await transporter.sendMail({
    from,
    to,
    replyTo: from,
    subject,
    text,
  })

  return { ok: true, status: 200 }
}

