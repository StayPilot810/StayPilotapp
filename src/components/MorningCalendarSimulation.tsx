import { CalendarDays, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

type CalendarBooking = {
  id: string
  apartment: string
  guest: string
  source: 'airbnb' | 'booking'
  startDay: number
  nights: number
  code: string
}

const CALENDAR_APARTMENTS = ['Appartement 1', 'Appartement 2', 'Appartement 3', 'Appartement 4']
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
const CALENDAR_BOOKINGS: CalendarBooking[] = [
  { id: 'b1', apartment: 'Appartement 1', guest: 'Sarah Johnson', source: 'airbnb', startDay: 1, nights: 5, code: 'HUA89X9KL' },
  { id: 'b2', apartment: 'Appartement 1', guest: 'Marc Dubois', source: 'booking', startDay: 7, nights: 4, code: '572918346' },
  { id: 'b3', apartment: 'Appartement 1', guest: 'Lucas Martin', source: 'booking', startDay: 14, nights: 5, code: '4287193560' },
  { id: 'b4', apartment: 'Appartement 1', guest: 'Alex Turner', source: 'airbnb', startDay: 25, nights: 4, code: '29BX9NT3' },
  { id: 'b5', apartment: 'Appartement 2', guest: 'Emma Dubois', source: 'booking', startDay: 3, nights: 6, code: '591238746' },
  { id: 'b6', apartment: 'Appartement 2', guest: 'Julia Novak', source: 'airbnb', startDay: 11, nights: 3, code: 'PEM90L' },
  { id: 'b7', apartment: 'Appartement 2', guest: 'James Wilson', source: 'airbnb', startDay: 20, nights: 5, code: 'BV7H4M42CX' },
  { id: 'b8', apartment: 'Appartement 2', guest: 'Sofia Rossi', source: 'booking', startDay: 25, nights: 5, code: '8839201746' },
  { id: 'b9', apartment: 'Appartement 3', guest: 'Marie Laurent', source: 'airbnb', startDay: 1, nights: 4, code: 'LXJ9H6FS9W' },
  { id: 'b10', apartment: 'Appartement 3', guest: 'Paul Klein', source: 'booking', startDay: 13, nights: 4, code: 'SUIT0PA' },
  { id: 'b11', apartment: 'Appartement 3', guest: 'Nina Patel', source: 'booking', startDay: 16, nights: 5, code: '1928737469' },
  { id: 'b12', apartment: 'Appartement 3', guest: 'Tom Hansen', source: 'airbnb', startDay: 22, nights: 5, code: 'ZNX9VBNM10' },
  { id: 'b13', apartment: 'Appartement 4', guest: 'Léa Bernard', source: 'booking', startDay: 3, nights: 3, code: '3849Z' },
  { id: 'b14', apartment: 'Appartement 4', guest: 'Oliver Smith', source: 'booking', startDay: 6, nights: 6, code: '7465328190' },
  { id: 'b15', apartment: 'Appartement 4', guest: 'Clara Müller', source: 'airbnb', startDay: 16, nights: 7, code: 'ASDF6H3KL' },
  { id: 'b16', apartment: 'Appartement 4', guest: 'Chris Leo', source: 'airbnb', startDay: 28, nights: 3, code: 'OHER6_' },
]

function weekdayLabel(day: number) {
  const jsDay = new Date(2026, 3, day).getDay()
  const labels = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
  return labels[jsDay]
}

export function MorningCalendarSimulation() {
  const { locale } = useLanguage()
  const ll = locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'en'
  const c = {
    fr: {
      title: 'Calendrier des réservations',
      thisMonth: 'Ce mois',
      lastMonth: 'Mois dernier',
      nextMonth: 'Mois prochain',
      customDates: 'Dates personnalisées',
      allApartments: 'Tous les appartements',
      filterAria: 'Filtrer',
      occupancy: "Taux d'occupation",
      totalBookings: 'Total des réservations',
      bookedNights: 'Nuits réservées',
      nights: 'nuits',
      ref: 'ref',
    },
    en: {
      title: 'Reservation calendar',
      thisMonth: 'This month',
      lastMonth: 'Last month',
      nextMonth: 'Next month',
      customDates: 'Custom dates',
      allApartments: 'All listings',
      filterAria: 'Filter',
      occupancy: 'Occupancy rate',
      totalBookings: 'Total bookings',
      bookedNights: 'Booked nights',
      nights: 'nights',
      ref: 'ref',
    },
    es: {
      title: 'Calendario de reservas',
      thisMonth: 'Este mes',
      lastMonth: 'Mes anterior',
      nextMonth: 'Mes siguiente',
      customDates: 'Fechas personalizadas',
      allApartments: 'Todos los alojamientos',
      filterAria: 'Filtrar',
      occupancy: 'Tasa de ocupación',
      totalBookings: 'Total de reservas',
      bookedNights: 'Noches reservadas',
      nights: 'noches',
      ref: 'ref',
    },
    de: {
      title: 'Reservierungskalender',
      thisMonth: 'Diesen Monat',
      lastMonth: 'Letzter Monat',
      nextMonth: 'Nächster Monat',
      customDates: 'Benutzerdefinierte Daten',
      allApartments: 'Alle Unterkünfte',
      filterAria: 'Filtern',
      occupancy: 'Belegungsrate',
      totalBookings: 'Reservierungen gesamt',
      bookedNights: 'Gebuchte Nächte',
      nights: 'Nächte',
      ref: 'Ref',
    },
    it: {
      title: 'Calendario prenotazioni',
      thisMonth: 'Questo mese',
      lastMonth: 'Mese scorso',
      nextMonth: 'Mese prossimo',
      customDates: 'Date personalizzate',
      allApartments: 'Tutti gli alloggi',
      filterAria: 'Filtra',
      occupancy: 'Tasso di occupazione',
      totalBookings: 'Prenotazioni totali',
      bookedNights: 'Notti prenotate',
      nights: 'notti',
      ref: 'rif',
    },
  }[ll]
  const [hoveredBooking, setHoveredBooking] = useState<CalendarBooking | null>(null)

  const stats = useMemo(() => {
    const totalReservations = CALENDAR_BOOKINGS.length
    const reservedNights = CALENDAR_BOOKINGS.reduce((sum, b) => sum + b.nights, 0)
    const totalNights = CALENDAR_APARTMENTS.length * CALENDAR_DAYS.length
    const occupancy = Math.round((reservedNights / totalNights) * 100)
    const airbnbCount = CALENDAR_BOOKINGS.filter((b) => b.source === 'airbnb').length
    const bookingCount = CALENDAR_BOOKINGS.filter((b) => b.source === 'booking').length
    return { totalReservations, reservedNights, totalNights, occupancy, airbnbCount, bookingCount }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[30px] font-bold leading-none tracking-tight text-zinc-900">{c.title}</h3>
            <p className="mt-2 text-sm text-zinc-500">Avril 2026</p>
          </div>
          <div className="flex items-center gap-4 pt-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> Airbnb
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1d6fe9]" /> Booking.com
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-4 sm:px-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2">
            <button className="rounded-md bg-[#4a86f7] px-3 py-1.5 text-sm font-semibold text-white">{c.thisMonth}</button>
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100">{c.lastMonth}</button>
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100">{c.nextMonth}</button>
            <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100">
              <CalendarDays className="h-3.5 w-3.5" />
              {c.customDates}
            </button>
          </div>
          <div className="inline-flex items-center gap-2">
            <button className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 shadow-sm">
              {c.allApartments} <span className="text-[10px] text-zinc-400">▼</span>
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              aria-label={c.filterAria}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="mb-2 grid grid-cols-[140px_repeat(30,minmax(0,1fr))] items-center gap-1">
              <div />
              {CALENDAR_DAYS.map((day) => (
                <div key={`d-head-${day}`} className="text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">{weekdayLabel(day)}</p>
                  <p className="text-xs font-semibold text-zinc-700">{day}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {CALENDAR_APARTMENTS.map((apartment) => (
                <div key={apartment} className="grid grid-cols-[140px_repeat(30,minmax(0,1fr))] items-center gap-1">
                  <div className="text-sm font-semibold text-zinc-600">{apartment}</div>
                  {CALENDAR_DAYS.map((day) => (
                    <div key={`${apartment}-${day}`} className="h-12 rounded-sm border-l border-zinc-100 bg-zinc-50/60 first:border-l-0" />
                  ))}
                  <div className="pointer-events-none col-start-2 col-end-[-1] row-start-1 row-end-2 relative h-12">
                    {CALENDAR_BOOKINGS.filter((b) => b.apartment === apartment).map((b) => (
                      <div
                        key={b.id}
                        onMouseEnter={() => setHoveredBooking(b)}
                        onMouseLeave={() => setHoveredBooking((current) => (current?.id === b.id ? null : current))}
                        className={`pointer-events-auto absolute top-[1px] h-[46px] cursor-pointer rounded-md px-2 py-1 text-white shadow-sm ${
                          b.source === 'airbnb' ? 'bg-[#ef4444]' : 'bg-[#1d6fe9]'
                        }`}
                        style={{
                          left: `${((b.startDay - 1) / 30) * 100}%`,
                          width: `${(b.nights / 30) * 100}%`,
                        }}
                      >
                        <p className="truncate text-[11px] font-semibold leading-tight">{b.guest}</p>
                        <p className="truncate text-[10px] opacity-90">
                          {b.nights} {c.nights} · {b.code}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 text-sm font-semibold text-zinc-700">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
              {c.occupancy} <span className="text-[#1d6fe9]">{stats.occupancy}%</span>
            </span>
            <span>{c.totalBookings} : {stats.totalReservations}</span>
            <span>
              {c.bookedNights} : {stats.reservedNights} / {stats.totalNights}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> Airbnb : {stats.airbnbCount}
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1d6fe9]" /> Booking.com : {stats.bookingCount}
            </span>
          </div>
        </div>
        {hoveredBooking ? (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-sm">
            <span className="font-semibold text-zinc-900">{hoveredBooking.guest}</span> · {hoveredBooking.apartment} ·{' '}
            {hoveredBooking.nights} {c.nights} · {hoveredBooking.source === 'airbnb' ? 'Airbnb' : 'Booking.com'} · {c.ref} {hoveredBooking.code}
          </div>
        ) : null}
      </div>
    </div>
  )
}
