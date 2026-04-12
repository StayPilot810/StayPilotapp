import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import { transitionTap } from './premium'

type MotionAnchorProps = {
  href: string
  className?: string
  style?: CSSProperties
  children: ReactNode
  onClick?: () => void
  /** Hover / tap plus discrets pour liens texte */
  variant?: 'cta' | 'subtle'
}

/**
 * Lien avec micro-scale au survol (style Stripe / Linear).
 * `subtle` : presque statique pour liens secondaires.
 */
export function MotionAnchor({
  href,
  className,
  style,
  children,
  onClick,
  variant = 'cta',
}: MotionAnchorProps) {
  const reduce = useReducedMotion()
  const scale = variant === 'cta' ? 1.02 : 1.01
  const tap = variant === 'cta' ? 0.98 : 0.99

  return (
    <motion.a
      href={href}
      className={className}
      style={style}
      onClick={onClick}
      transition={transitionTap}
      whileHover={reduce ? undefined : { scale }}
      whileTap={reduce ? undefined : { scale: tap }}
    >
      {children}
    </motion.a>
  )
}
