/**
 * Remet à zéro les données « comptes / sessions » côté KV (hôtes + prestataires).
 * Usage : node --env-file=.env.local scripts/purge-staypilot-kv-full-reset.mjs
 *
 * Efface aussi le navigateur : voir la liste affichée en fin de script (localStorage / sessionStorage).
 */
import { kv } from '@vercel/kv'

const ACCOUNTS_KEY = 'staypilot_accounts_blob_v1'

const SCAN_PATTERNS = [
  'staypilot_host_checkout_pending_v1:*',
  'staypilot_stripe_billing_v1:*',
  'staypilot_pw_otp_v1:*',
  'staypilot_cleaner_invite_code_v1:*',
]

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN (ex.: vercel env pull .env.local)')
  process.exit(1)
}

async function deleteKeysMatching(match) {
  let n = 0
  for await (const key of kv.scanIterator({ match, count: 500 })) {
    await kv.del(key)
    n += 1
  }
  return n
}

await kv.del(ACCOUNTS_KEY)
console.log('OK — deleted:', ACCOUNTS_KEY)

for (const pattern of SCAN_PATTERNS) {
  const n = await deleteKeysMatching(pattern)
  console.log(`OK — deleted ${n} key(s) matching ${pattern}`)
}

console.log(`
--- Côté navigateur (à faire sur chaque machine / profil Safari) ---
Ouvrez la console développeur → Application → Stockage local → site StayPilot, puis supprimez au minimum :
  staypilot_accounts
  staypilot_current_user
  staypilot_login_identifier
  staypilot_session_active
  staypilot_current_plan
  staypilot_current_role
  staypilot_remember_me
  staypilot_cleaner_invites_v1
  staypilot_billing_recovery_v1
Ou : « Effacer les données du site web » pour ce domaine.
Les clés sessionStorage staypilot_host_checkout_done_* peuvent aussi être effacées.
`)
