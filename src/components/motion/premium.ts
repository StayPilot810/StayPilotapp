/** Courbe type produit (proche ease-out « premium »). */
export const easePremium = [0.22, 1, 0.36, 1] as const

export const duration = {
  fast: 0.22,
  base: 0.42,
  /** Entre sections / blocs */
  section: 0.5,
} as const

export const transitionReveal = {
  duration: duration.base,
  ease: easePremium,
} as const

export const transitionTap = {
  type: 'tween' as const,
  duration: duration.fast,
  ease: easePremium,
}

export const transitionHoverCard = {
  type: 'tween' as const,
  duration: 0.28,
  ease: easePremium,
}

export const viewportReveal = {
  once: true,
  margin: '-48px 0px -32px 0px',
  amount: 0.2,
} as const
