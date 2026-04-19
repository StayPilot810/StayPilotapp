/**
 * Supprime le blob de comptes dans Upstash / Vercel KV.
 * Usage : depuis la racine du repo, avec les variables KV chargées :
 *   node --env-file=.env.local scripts/purge-staypilot-kv-accounts.mjs
 *
 * Pour aussi supprimer inscriptions en attente, facturation Stripe KV et OTP :
 *   node --env-file=.env.local scripts/purge-staypilot-kv-full-reset.mjs
 */
import { kv } from '@vercel/kv'

const ACCOUNTS_KEY = 'staypilot_accounts_blob_v1'

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN (ex.: vercel env pull .env.local)')
  process.exit(1)
}

await kv.del(ACCOUNTS_KEY)
console.log('OK — deleted KV key:', ACCOUNTS_KEY)
