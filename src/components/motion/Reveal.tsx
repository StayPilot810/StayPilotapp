import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { transitionReveal, viewportReveal } from './premium'
import { staggerContainer } from './variants'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** Décalage vertical initial (px) */
  y?: number
}

/** Fade + léger slide-up à l’entrée dans le viewport. */
export function Reveal({ children, className, delay = 0, y = 18 }: RevealProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={viewportReveal}
      transition={{ ...transitionReveal, delay }}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  stagger?: number
}

/** Grille / liste : enfants en motion.* avec variants={staggerItem(...)}. */
export function StaggerReveal({ children, className, stagger = 0.055 }: StaggerProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={staggerContainer(reduceMotion, stagger)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportReveal}
    >
      {children}
    </motion.div>
  )
}
