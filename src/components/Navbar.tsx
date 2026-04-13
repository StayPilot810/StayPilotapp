import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, Globe, Menu, X } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { LANGUAGE_MENU_LABELS, LOCALES, LOCALE_FLAGS } from '../i18n/navbar'
import { easePremium, MotionAnchor } from './motion'

const primary = '#4a86f7'

const linkGray =
  'whitespace-nowrap text-[15px] font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2 rounded-lg'

function NavDivider() {
  return <span className="h-5 w-px shrink-0 bg-zinc-200" aria-hidden />
}

const linkBookCall =
  'shrink-0 rounded-lg text-[14px] font-medium text-[#4a86f7] transition-colors duration-200 hover:text-[#3b78f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2 xl:text-[15px] whitespace-nowrap'

type LanguageMenuProps = {
  align?: 'left' | 'right'
  className?: string
  /** Compact (desktop nav) — sans zone tactile 44px */
  dense?: boolean
  /** Une ligne : globe + drapeau + nom de langue + chevron (maquette 1) */
  variant?: 'default' | 'compact'
}

function LanguageMenu({ align = 'right', className = '', dense = false, variant = 'default' }: LanguageMenuProps) {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const chevronClass =
    `h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.languagesTab}: ${LANGUAGE_MENU_LABELS[locale]}`}
        className={
          variant === 'compact'
            ? 'flex items-center gap-1.5 rounded-lg py-1.5 pl-1.5 pr-1.5 text-left transition-colors duration-200 hover:bg-zinc-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2'
            : `flex items-center gap-2 rounded-xl text-left transition-colors duration-200 hover:bg-zinc-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2 ${
                dense
                  ? 'gap-2.5 py-1.5 pl-1 pr-2'
                  : 'min-h-[44px] gap-2 py-2 pl-1.5 pr-2 sm:gap-2.5'
              }`
        }
      >
        <Globe className="h-[17px] w-[17px] shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
        {variant === 'compact' ? (
          <>
            <span className="text-[14px] leading-none" aria-hidden>
              {LOCALE_FLAGS[locale]}
            </span>
            <span className="text-[15px] font-medium tracking-tight text-zinc-900">
              {LANGUAGE_MENU_LABELS[locale]}
            </span>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="text-[11px] font-medium text-[#9ca3af] sm:text-[12px]">{t.languagesTab}</span>
              <span className="text-[14px] font-semibold text-zinc-900 sm:text-[15px]">
                {LANGUAGE_MENU_LABELS[locale]}
              </span>
            </div>
          </>
        )}
        <ChevronDown className={chevronClass} strokeWidth={2} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t.languagesTab}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easePremium }}
            className={`absolute top-full z-50 mt-2 min-w-[200px] rounded-xl border border-zinc-200/80 bg-white/95 py-1.5 shadow-pm-lg backdrop-blur-md ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {LOCALES.map((code) => (
              <li key={code} role="option" aria-selected={code === locale}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(code)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors duration-150 hover:bg-zinc-50 ${
                    code === locale ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-600'
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {LOCALE_FLAGS[code]}
                  </span>
                  {LANGUAGE_MENU_LABELS[code]}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function Logo() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  return (
    <motion.a
      href="/"
      className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2"
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: 'tween', duration: 0.2, ease: easePremium }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-pm-sm"
        style={{ backgroundColor: primary }}
      >
        <Calendar className="h-[18px] w-[18px] text-white" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="text-[17px] font-bold leading-none tracking-tight text-zinc-900">{t.brand}</span>
    </motion.a>
  )
}

/** Centre desktop : liens section uniquement */
function DesktopNavCenter() {
  const { t } = useLanguage()
  return (
    <nav
      className="flex shrink-0 items-center justify-center gap-4 xl:gap-6 2xl:gap-7"
      aria-label={t.navMainLabel}
    >
      <a href="#fonctionnalites" className={linkGray}>
        {t.features}
      </a>
      <a href="#avis" className={linkGray}>
        {t.reviews}
      </a>
      <a href="#tarifs" className={linkGray}>
        {t.pricing}
      </a>
      <a href="#faq" className={linkGray}>
        {t.faq}
      </a>
      <a href="#" className={linkGray}>
        {t.support}
      </a>
    </nav>
  )
}

/** Droite desktop : | Réserver → langue | Se connecter → CTA */
function DesktopRightActions() {
  const { t } = useLanguage()
  return (
    <div className="flex shrink-0 items-center gap-3 xl:gap-4 2xl:gap-5">
      <NavDivider />
      <a href="#" className={linkBookCall}>
        {t.bookCall}
      </a>
      <LanguageMenu align="right" variant="compact" className="shrink-0" />
      <NavDivider />
      <a
        href="#"
        className="rounded-lg text-[14px] font-medium text-zinc-900 transition-colors duration-200 hover:text-[#4a86f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35 focus-visible:ring-offset-2 xl:text-[15px] whitespace-nowrap"
      >
        {t.login}
      </a>
      <MotionAnchor
        href="#"
        className="shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white shadow-pm-cta transition-[filter] duration-200 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/45 focus-visible:ring-offset-2 xl:px-5 xl:text-[15px] whitespace-nowrap"
        style={{ backgroundColor: primary }}
      >
        {t.signup}
      </MotionAnchor>
    </div>
  )
}

export function Navbar() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white">
      <div className="mx-auto h-[64px] max-w-[1200px] px-4 sm:h-[72px] sm:px-6 lg:px-8">
        {/* Mobile & tablette */}
        <div className="flex h-full w-full items-center justify-between lg:hidden">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageMenu align="right" />
            <a
              href="#"
              className="hidden rounded-lg text-[14px] font-medium text-zinc-900 transition-colors duration-200 hover:text-[#4a86f7] md:inline whitespace-nowrap"
            >
              {t.login}
            </a>
            <MotionAnchor
              href="#"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2.5 text-[14px] font-semibold text-white shadow-pm-cta sm:px-5 sm:text-[15px] whitespace-nowrap"
              style={{ backgroundColor: primary }}
            >
              {t.signup}
            </MotionAnchor>
            <motion.button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? t.closeMenu : t.openMenu}
              onClick={() => setMobileOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-zinc-800 hover:bg-zinc-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35"
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: 'tween', duration: 0.15, ease: easePremium }}
            >
              {mobileOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
            </motion.button>
          </div>
        </div>

        {/* Desktop : logo fixe | nav centrée dans l’espace restant | actions fixes (pas de chevauchement) */}
        <div className="hidden h-full w-full min-w-0 items-center gap-3 lg:flex lg:gap-4 xl:gap-6">
          <div className="shrink-0">
            <Logo />
          </div>
          <div className="flex min-w-0 max-w-full flex-1 items-center justify-center overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <DesktopNavCenter />
          </div>
          <div className="shrink-0">
            <DesktopRightActions />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: easePremium }}
            className="border-t border-zinc-200/60 bg-white/95 shadow-pm-lg backdrop-blur-md lg:hidden"
          >
            <nav
              className="mx-auto flex max-w-[1200px] flex-col gap-0.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3 sm:gap-1 sm:px-6 sm:pb-4 sm:pt-4"
              aria-label={t.navMobileLabel}
            >
              <a href="#pourquoi-nous" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5`}>
                {t.whyUs}
              </a>
              <a href="#fonctionnalites" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5`}>
                {t.features}
              </a>
              <a href="#avis" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5`}>
                {t.reviews}
              </a>
              <a href="#tarifs" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5`}>
                {t.pricing}
              </a>
              <a href="#faq" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5`}>
                {t.faq}
              </a>
              <a href="#" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5`}>
                {t.support}
              </a>
              <MotionAnchor
                href="#"
                variant="subtle"
                onClick={closeMobile}
                className="rounded-lg px-3 py-3.5 text-[15px] font-semibold transition-opacity duration-200 hover:opacity-90"
                style={{ color: primary }}
              >
                {t.bookCall}
              </MotionAnchor>
              <div className="my-2 border-t border-zinc-200/70" />
              <a href="#" onClick={closeMobile} className={`${linkGray} rounded-lg px-3 py-3.5 text-zinc-900`}>
                {t.login}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
