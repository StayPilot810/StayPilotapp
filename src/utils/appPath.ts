/** Chemin d’URL utilisé pour le routage « maison » (hors React Router). */
export function normalizeAppPathname(pathname: string): string {
  try {
    let p = decodeURIComponent(pathname)
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)

    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''
    if (base && p.startsWith(base)) {
      p = p.slice(base.length) || '/'
    }
    if (!p.startsWith('/')) p = `/${p}`
    return p
  } catch {
    return '/'
  }
}

export function getAppPathname(): string {
  if (typeof window === 'undefined') return '/'
  return normalizeAppPathname(window.location.pathname)
}
