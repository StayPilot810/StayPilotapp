import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  const envDir = process.cwd()

  return {
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ical-proxy',
      configureServer(server) {
        server.middlewares.use('/api/ical', async (req, res) => {
          try {
            const url = new URL(req.url ?? '', 'http://localhost')
            const target = url.searchParams.get('url')?.trim()
            if (!target) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing url parameter' }))
              return
            }
            const targetUrl = new URL(target)
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid protocol' }))
              return
            }
            const response = await fetch(targetUrl.toString())
            if (!response.ok) {
              res.statusCode = response.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Unable to fetch iCal' }))
              return
            }
            const text = await response.text()
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
            res.end(text)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Proxy error' }))
          }
        })

        server.middlewares.use('/api/chat', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) {
              chunks.push(chunk)
            }
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            // Relire .env à chaque requête : au démarrage le fichier peut encore être vide
            // si la clé a été collée après le lancement de `npm run dev`.
            const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
            // @ts-ignore runtime import in dev server middleware
            const { handleAiChat } = await import('./server/aiChat.mjs')
            const { status, json } = await handleAiChat(body, {
              OPENAI_API_KEY: liveEnv.OPENAI_API_KEY,
              GROQ_API_KEY: liveEnv.GROQ_API_KEY,
              STAYPILOT_AI_PROVIDER: liveEnv.STAYPILOT_AI_PROVIDER,
              OPENAI_CHAT_MODEL: liveEnv.OPENAI_CHAT_MODEL,
              GROQ_CHAT_MODEL: liveEnv.GROQ_CHAT_MODEL,
              GROQ_VISION_MODEL: liveEnv.GROQ_VISION_MODEL,
              OPENAI_VISION_MODEL: liveEnv.OPENAI_VISION_MODEL,
            })
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(json))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'server_error',
                message: e instanceof Error ? e.message : 'Erreur serveur',
              }),
            )
          }
        })

        server.middlewares.use('/api/channel-sync', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            // @ts-ignore runtime import in dev server middleware
            const { syncOfficialChannelData } = await import('./server/channelSync.mjs')
            let result = await syncOfficialChannelData(body)

            const networkDetail = `${String(result?.error || '')} ${String(result?.message || '')}`.toLowerCase()
            const canRelayRemotely =
              body?.provider === 'beds24' &&
              req.headers['x-staypilot-relay'] !== 'vercel' &&
              (networkDetail.includes('enotfound') ||
                networkDetail.includes('fetch failed') ||
                networkDetail.includes('network') ||
                networkDetail.includes('dns'))

            if (canRelayRemotely) {
              try {
                const relayRes = await fetch('https://stay-pilotapp.vercel.app/api/channel-sync', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-staypilot-relay': 'vercel',
                  },
                  body: JSON.stringify(body),
                })
                const relayJson = await relayRes.json().catch(() => ({}))
                result = {
                  ...(typeof relayJson === 'object' && relayJson ? relayJson : {}),
                  status: relayRes.status,
                }
              } catch {
                // keep local result when relay also fails
              }
            }

            res.statusCode = result.status ?? 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'channel_sync_failed',
                message: e instanceof Error ? e.message : 'Erreur sync channel',
              }),
            )
          }
        })

        server.middlewares.use('/api/verify-vat', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            // @ts-ignore runtime import in dev server middleware
            const { verifyVatNumberOfficial } = await import('./server/vatValidation.mjs')
            const result = await verifyVatNumberOfficial(body)
            res.statusCode = result.status ?? 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.ok ? result : { error: result.error || 'vat_check_failed' }))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'vat_check_failed' }))
          }
        })

        server.middlewares.use('/api/create-checkout-session', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
            // @ts-ignore runtime import in dev server middleware
            const { createStripeCheckoutSession } = await import('./server/stripeBilling.mjs')
            const result = await createStripeCheckoutSession(body, liveEnv)
            if (!result.ok) {
              res.statusCode = result.status ?? 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: result.error || 'checkout_session_failed' }))
              return
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, url: result.url, id: result.id }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'checkout_session_failed',
                message: e instanceof Error ? e.message : 'Erreur Stripe',
              }),
            )
          }
        })

        server.middlewares.use('/api/complete-host-signup', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
            const { handleCompleteHostSignupRequest } = await import('./server/hostCheckoutFinalize.mjs')
            const { status, json } = await handleCompleteHostSignupRequest(body, liveEnv)
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(json))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'complete_host_signup_failed' }))
          }
        })

        server.middlewares.use('/api/stripe-billing-status', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            const { handleStripeBillingStatusRequest } = await import('./server/stripeBillingKv.mjs')
            const { status, json } = await handleStripeBillingStatusRequest(body)
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(json))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'stripe_billing_status_failed' }))
          }
        })

        server.middlewares.use('/api/verify-card', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }
            const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
            // @ts-ignore runtime import in dev server middleware
            const { verifyCardWithStripe } = await import('./server/stripeCardVerification.mjs')
            const result = await verifyCardWithStripe(body, liveEnv)
            res.statusCode = result.status ?? 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.ok ? { ok: true, verified: true } : { error: result.error || 'card_verification_failed' }))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'card_verification_failed' }))
          }
        })

        async function readJsonBodyForMiddleware(req: any): Promise<{ ok: true; body: any } | { ok: false }> {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8')
          try {
            return { ok: true, body: raw ? JSON.parse(raw) : {} }
          } catch {
            return { ok: false }
          }
        }

        function mergeEnvIntoProcess(liveEnv: Record<string, string>) {
          for (const [k, v] of Object.entries(liveEnv)) {
            if (v !== undefined) process.env[k] = v
          }
        }

        server.middlewares.use('/api/auth-status', async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
            mergeEnvIntoProcess(liveEnv)
            // @ts-ignore runtime import in dev server middleware
            const { handleAuthStatus } = await import('./server/authAccounts.mjs')
            const { status, json } = await handleAuthStatus()
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(json))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'server_error',
                message: e instanceof Error ? e.message : 'Erreur serveur',
              }),
            )
          }
        })

        const authPostHandlers: Array<{ path: string; name: string }> = [
          { path: '/api/auth-login', name: 'handleAuthLogin' },
          { path: '/api/auth-register', name: 'handleAuthRegister' },
          { path: '/api/auth-update-password', name: 'handleAuthUpdatePassword' },
          { path: '/api/auth-check-duplicate', name: 'handleAuthCheckDuplicate' },
          { path: '/api/auth-password-otp-request', name: 'handleAuthPasswordOtpRequest' },
          { path: '/api/auth-verify-password-otp', name: 'handleAuthVerifyPasswordOtp' },
          { path: '/api/auth-forgot-reset', name: 'handleAuthForgotReset' },
        ]

        for (const { path, name } of authPostHandlers) {
          server.middlewares.use(path, async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'method_not_allowed' }))
              return
            }
            try {
              const parsed = await readJsonBodyForMiddleware(req)
              if (!parsed.ok) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'invalid_json' }))
                return
              }
              const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
              mergeEnvIntoProcess(liveEnv)
              // @ts-ignore runtime import in dev server middleware
              const mod = await import('./server/authAccounts.mjs')
              const fn = mod[name] as (body: any, env?: NodeJS.ProcessEnv) => Promise<{ status: number; json: unknown }>
              const { status, json } =
                name === 'handleAuthPasswordOtpRequest'
                  ? await fn(parsed.body, { ...process.env, ...liveEnv })
                  : await fn(parsed.body)
              res.statusCode = status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(json))
            } catch (e) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: 'server_error',
                  message: e instanceof Error ? e.message : 'Erreur serveur',
                }),
              )
            }
          })
        }

        server.middlewares.use('/api/cancel-subscription-email', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body: any = {}
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_json' }))
              return
            }

            const liveEnv = loadEnv(server.config.mode, server.config.envDir ?? envDir, '')
            // @ts-ignore runtime import in dev server middleware
            const { sendCancellationConfirmationEmail, sendFailedPaymentAlertEmail, sendPlanChangeConfirmationEmail, sendPasswordChangedConfirmationEmail, sendPasswordResetConfirmationEmail, sendPasswordVerificationCodeEmail, sendSignupEmailVerificationCodeEmail, sendActivityDigestEmail, sendCallBookingConfirmationEmail } = await import('./server/cancellationEmail.mjs')
            const result =
              body?.mode === 'payment_failed_alert'
                ? await sendFailedPaymentAlertEmail(body, {
                    SMTP_HOST: liveEnv.SMTP_HOST,
                    SMTP_PORT: liveEnv.SMTP_PORT,
                    SMTP_USER: liveEnv.SMTP_USER,
                    SMTP_PASS: liveEnv.SMTP_PASS,
                    SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                  })
                : body?.mode === 'plan_change_confirmation'
                  ? await sendPlanChangeConfirmationEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : body?.mode === 'password_changed_confirmation'
                  ? await sendPasswordChangedConfirmationEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : body?.mode === 'password_reset_confirmation'
                  ? await sendPasswordResetConfirmationEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : body?.mode === 'password_verification_code'
                  ? await sendPasswordVerificationCodeEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : body?.mode === 'signup_email_verification_code'
                  ? await sendSignupEmailVerificationCodeEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : body?.mode === 'activity_digest'
                  ? await sendActivityDigestEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : body?.mode === 'call_booking_confirmation'
                  ? await sendCallBookingConfirmationEmail(body, {
                      SMTP_HOST: liveEnv.SMTP_HOST,
                      SMTP_PORT: liveEnv.SMTP_PORT,
                      SMTP_USER: liveEnv.SMTP_USER,
                      SMTP_PASS: liveEnv.SMTP_PASS,
                      SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
                    })
                : await sendCancellationConfirmationEmail(body, {
              SMTP_HOST: liveEnv.SMTP_HOST,
              SMTP_PORT: liveEnv.SMTP_PORT,
              SMTP_USER: liveEnv.SMTP_USER,
              SMTP_PASS: liveEnv.SMTP_PASS,
              SUPPORT_FROM_EMAIL: liveEnv.SUPPORT_FROM_EMAIL,
            })

            res.statusCode = result.status ?? 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.ok ? { ok: true } : { error: result.error || 'email_error' }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'email_send_failed',
                message: e instanceof Error ? e.message : "Erreur d'envoi d'e-mail",
              }),
            )
          }
        })
      },
    },
  ],
  // Les « : » dans le chemin du dossier (ex. SAAS AIRBNB:BOOKING) peuvent casser le watcher natif
  // sur macOS : sans polling, les changements ne se rechargent pas tant qu’on ne redémarre pas le serveur.
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
  }
})
