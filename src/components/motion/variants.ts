import type { Variants } from 'framer-motion'
import { easePremium, duration } from './premium'

function reduced(reduce: boolean | null): boolean {
  return reduce === true
}

export function staggerContainer(reduce: boolean | null, stagger = 0.055): Variants {
  return {
    hidden: {},
    visible: reduced(reduce)
      ? {}
      : {
          transition: {
            staggerChildren: stagger,
            delayChildren: 0.03,
          },
        },
  }
}

export function staggerItem(reduce: boolean | null, y = 16): Variants {
  return {
    hidden: reduced(reduce) ? { opacity: 1, y: 0 } : { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.base, ease: easePremium },
    },
  }
}
