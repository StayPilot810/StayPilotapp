/**
 * Politique « un compte = un compte partout » : en production, les comptes
 * doivent être stockés côté serveur (Vercel KV), pas uniquement en localStorage.
 *
 * En dev, le repli local reste possible sauf si VITE_REQUIRE_SERVER_ACCOUNTS=true.
 */

export function isServerAccountsMandatory(): boolean {
  if (import.meta.env.VITE_REQUIRE_SERVER_ACCOUNTS === 'true') return true
  return import.meta.env.PROD === true
}

/** Message affiché quand KV n’est pas branché alors qu’il est obligatoire. */
export function serverAccountsConfigErrorMessage(): string {
  return "Synchronisation des comptes indisponible : le stockage serveur (Vercel KV) n'est pas configuré. Sur Vercel, ajoutez l'intégration KV puis les variables KV_REST_API_URL et KV_REST_API_TOKEN."
}

export function serverAccountsNetworkErrorMessage(): string {
  return 'Connexion impossible : le serveur de comptes ne répond pas. Vérifiez votre réseau et réessayez.'
}
