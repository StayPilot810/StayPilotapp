import {
  sendCancellationConfirmationEmail,
  sendFailedPaymentAlertEmail,
  sendPlanChangeConfirmationEmail,
  sendPasswordChangedConfirmationEmail,
  sendPasswordResetConfirmationEmail,
  sendPasswordVerificationCodeEmail,
  sendSignupEmailVerificationCodeEmail,
  sendWelcomeOnboardingEmail,
  sendActivityDigestEmail,
  sendCallBookingConfirmationEmail,
} from '../server/cancellationEmail.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  } catch {
    res.status(400).json({ error: 'invalid_json' })
    return
  }

  try {
    const mode = (body?.mode || 'cancellation').trim()
    const result =
      mode === 'payment_failed_alert'
        ? await sendFailedPaymentAlertEmail(body)
        : mode === 'plan_change_confirmation'
          ? await sendPlanChangeConfirmationEmail(body)
        : mode === 'password_changed_confirmation'
          ? await sendPasswordChangedConfirmationEmail(body)
        : mode === 'password_reset_confirmation'
          ? await sendPasswordResetConfirmationEmail(body)
        : mode === 'password_verification_code'
          ? await sendPasswordVerificationCodeEmail(body)
        : mode === 'signup_email_verification_code'
          ? await sendSignupEmailVerificationCodeEmail(body)
        : mode === 'welcome_onboarding'
          ? await sendWelcomeOnboardingEmail(body)
        : mode === 'activity_digest'
          ? await sendActivityDigestEmail(body)
        : mode === 'call_booking_confirmation'
          ? await sendCallBookingConfirmationEmail(body)
        : await sendCancellationConfirmationEmail(body)
    if (!result.ok) {
      res.status(result.status || 500).json({ error: result.error || 'email_error' })
      return
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({
      error: 'email_send_failed',
      message: e instanceof Error ? e.message : "Erreur d'envoi d'e-mail",
    })
  }
}

