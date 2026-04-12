import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, Globe, Menu, X } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { LANGUAGE_MENU_LABELS, LOCALES, LOCALE_FLAGS } from '../i18n/navbar'

const primary = '#4a86f7'

const linkGray =
  'text-[15px] font-medium text-[#666666] transition-colors hover:text-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40 focus-visible:ring-offset-2 rounded-sm'

type LanguageMenuProps = {
  align?: 'left' | 'right'
  className?: string
}

function LanguageMenu({ align = 'right', className = '' }: LanguageMenuProps) {
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

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.languagesTab}: ${LANGUAGE_MENU_LABELS[locale]}`}
        className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-1.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40 focus-visible:ring-offset-2 sm:gap-2.5 sm:pr-2"
      >
        <Globe className="h-[18px] w-[18px] shrink-0 text-[#666666]" strokeWidth={2} aria-hidden />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[11px] font-medium text-[#9ca3af] sm:text-[12px]">{t.languagesTab}</span>
          <span className="text-[14px] font-semibold text-[#1a1a1a] sm:text-[15px]">
            {LANGUAGE_MENU_LABELS[locale]}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#9ca3af] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.languagesTab}
          className={`absolute top-full z-50 mt-2 min-w-[200px] rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg ${
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
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                  code === locale ? 'font-semibold text-[#1a1a1a]' : 'font-medium text-[#666666]'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {LOCALE_FLAGS[code]}
                </span>
                {LANGUAGE_MENU_LABELS[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Logo() {
  const { t } = useLanguage()
  return (
    <a
      href="/"
      className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40 focus-visible:ring-offset-2 rounded-lg"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: primary }}
      >
        <Calendar className="h-[18px] w-[18px] text-white" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="text-[17px] font-bold tracking-tight text-[#1a1a1a]">{t.brand}</span>
    </a>
  )
}

/** Liens + « Réserver un appel » + Langues (alignés au centre) */
function DesktopNavAndLang() {
  const { t } = useLanguage()
  return (
    <nav
      className="flex items-center gap-5 xl:gap-7"
      aria-label={t.navMainLabel}
    >
      <a href="#" className={linkGray}>
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
      <a
        href="#"
        className="shrink-0 text-[15px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40 focus-visible:ring-offset-2 rounded-sm"
        style={{ color: primary }}
      >
        {t.bookCall}
      </a>
      <div className="flex shrink-0 items-center pl-1 xl:pl-2">
        <LanguageMenu align="left" />
      </div>
    </nav>
  )
}

/** Droite : Se connecter + Inscription, alignés à droite */
function DesktopAuthRight() {
  const { t } = useLanguage()
  return (
    <div className="flex shrink-0 items-center justify-end gap-6">
      <a
        href="#"
        className="text-[15px] font-medium text-[#1a1a1a] transition-colors hover:text-[#4a86f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40 focus-visible:ring-offset-2 rounded-sm whitespace-nowrap"
      >
        {t.login}
      </a>
      <a
        href="#"
        className="rounded-full px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(74,134,247,0.35)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/50 focus-visible:ring-offset-2 whitespace-nowrap"
        style={{ backgroundColor: primary }}
      >
        {t.signup}
      </a>
    </div>
  )
}

export function Navbar() {
  const { t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
      <div className="mx-auto h-[72px] max-w-[1200px] px-5 sm:px-6 lg:px-8">
        {/* Mobile & tablette */}
        <div className="flex h-full w-full items-center justify-between lg:hidden">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageMenu align="right" />
            <a
              href="#"
              className="hidden text-[14px] font-medium text-[#1a1a1a] hover:text-[#4a86f7] md:inline whitespace-nowrap"
            >
              {t.login}
            </a>
            <a
              href="#"
              className="rounded-full px-3 py-2 text-[13px] font-semibold text-white sm:px-4 sm:text-[14px] whitespace-nowrap"
              style={{ backgroundColor: primary }}
            >
              {t.signup}
            </a>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? t.closeMenu : t.openMenu}
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg p-2 text-[#1a1a1a] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40"
            >
              {mobileOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Desktop : logo | centre (nav + langues) | auth alignée à droite */}
        <div className="hidden h-full w-full items-center gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center justify-start">
            <Logo />
          </div>
          <div className="flex justify-center">
            <DesktopNavAndLang />
          </div>
          <div className="flex min-w-0 justify-end">
            <DesktopAuthRight />
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="border-t border-gray-100 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)] lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4 sm:px-6"
            aria-label={t.navMobileLabel}
          >
            <a href="#" onClick={closeMobile} className={`${linkGray} rounded-lg px-2 py-3`}>
              {t.features}
            </a>
            <a href="#avis" onClick={closeMobile} className={`${linkGray} rounded-lg px-2 py-3`}>
              {t.reviews}
            </a>
            <a href="#tarifs" onClick={closeMobile} className={`${linkGray} rounded-lg px-2 py-3`}>
              {t.pricing}
            </a>
            <a href="#faq" onClick={closeMobile} className={`${linkGray} rounded-lg px-2 py-3`}>
              {t.faq}
            </a>
            <a href="#" onClick={closeMobile} className={`${linkGray} rounded-lg px-2 py-3`}>
              {t.support}
            </a>
            <a
              href="#"
              onClick={closeMobile}
              className="rounded-lg px-2 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
              style={{ color: primary }}
            >
              {t.bookCall}
            </a>
            <div className="my-2 border-t border-gray-100" />
            <a href="#" onClick={closeMobile} className={`${linkGray} rounded-lg px-2 py-3 text-[#1a1a1a]`}>
              {t.login}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
