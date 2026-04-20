import { useLanguage } from '../hooks/useLanguage'
import { deactivateGuestDemoSession } from '../utils/guestDemo'

export function GuestDemoStrip() {
  const { t } = useLanguage()
  return (
    <div className="border-b border-amber-200/90 bg-amber-50 px-4 py-2.5 text-center text-[13px] font-medium text-amber-950 sm:text-sm">
      <span className="mr-1.5 inline-flex items-center rounded-full border border-amber-300/80 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
        {t.guestDemoBadge}
      </span>
      <span className="text-amber-900/90">{t.guestDemoStripHint}</span>{' '}
      <button
        type="button"
        onClick={() => {
          deactivateGuestDemoSession()
          window.location.href = '/'
        }}
        className="font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:text-amber-900"
      >
        {t.guestDemoExit}
      </button>
    </div>
  )
}
