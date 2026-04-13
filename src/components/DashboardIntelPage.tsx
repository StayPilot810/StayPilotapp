import { useMemo, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'

type CityPoint = {
  id: string
  name: string
  country: string
  address: string
  lat: number
  lng: number
  x: number
  y: number
}

export function DashboardIntelPage() {
  const { t, locale } = useLanguage()
  const copy = {
    fr: {
      searchLabel: 'Recherche adresse / coordonnees GPS',
      searchPlaceholder: 'Ex: Paris ou 48.8566,2.3522',
      noResult: 'Aucun resultat pour cette recherche.',
      clickHint: 'Cliquez sur une ville sur la carte pour voir les details.',
      selectedCity: 'Ville selectionnee',
      coordinates: 'Coordonnees',
    },
    en: {
      searchLabel: 'Address / GPS coordinates search',
      searchPlaceholder: 'Ex: Paris or 48.8566,2.3522',
      noResult: 'No result for this search.',
      clickHint: 'Click a city on the map to see details.',
      selectedCity: 'Selected city',
      coordinates: 'Coordinates',
    },
    es: {
      searchLabel: 'Busqueda direccion / coordenadas GPS',
      searchPlaceholder: 'Ej: Paris o 48.8566,2.3522',
      noResult: 'Sin resultados para esta busqueda.',
      clickHint: 'Haz clic en una ciudad del mapa para ver detalles.',
      selectedCity: 'Ciudad seleccionada',
      coordinates: 'Coordenadas',
    },
    de: {
      searchLabel: 'Suche Adresse / GPS-Koordinaten',
      searchPlaceholder: 'Bsp: Paris oder 48.8566,2.3522',
      noResult: 'Kein Ergebnis fur diese Suche.',
      clickHint: 'Klicken Sie auf eine Stadt in der Karte, um Details zu sehen.',
      selectedCity: 'Ausgewahlte Stadt',
      coordinates: 'Koordinaten',
    },
    it: {
      searchLabel: 'Ricerca indirizzo / coordinate GPS',
      searchPlaceholder: 'Es: Parigi o 48.8566,2.3522',
      noResult: 'Nessun risultato per questa ricerca.',
      clickHint: 'Clicca una citta sulla mappa per vedere i dettagli.',
      selectedCity: 'Citta selezionata',
      coordinates: 'Coordinate',
    },
  }[locale]

  const [query, setQuery] = useState('')
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const cities: CityPoint[] = [
    { id: 'paris', name: 'Paris', country: 'France', address: '10 Rue de Rivoli, 75001 Paris', lat: 48.8566, lng: 2.3522, x: 45, y: 39 },
    { id: 'london', name: 'London', country: 'England', address: 'Westminster, London SW1A', lat: 51.5074, lng: -0.1278, x: 41, y: 30 },
    { id: 'madrid', name: 'Madrid', country: 'Spain', address: 'Centro, 28013 Madrid', lat: 40.4168, lng: -3.7038, x: 39, y: 58 },
    { id: 'rome', name: 'Rome', country: 'Italy', address: 'Centro Storico, Roma RM', lat: 41.9028, lng: 12.4964, x: 56, y: 54 },
    { id: 'berlin', name: 'Berlin', country: 'Germany', address: 'Mitte, 10117 Berlin', lat: 52.52, lng: 13.405, x: 56, y: 29 },
    { id: 'barcelona', name: 'Barcelona', country: 'Spain', address: 'Ciutat Vella, 08002 Barcelona', lat: 41.3874, lng: 2.1686, x: 46, y: 56 },
    { id: 'milan', name: 'Milan', country: 'Italy', address: 'Centro, Milano MI', lat: 45.4642, lng: 9.19, x: 53, y: 47 },
  ]

  const filteredCities = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return cities

    const coords = value.split(',').map((v) => Number(v.trim()))
    const hasCoordSearch = coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])

    return cities.filter((city) => {
      if (hasCoordSearch) {
        return Math.abs(city.lat - coords[0]) < 0.8 && Math.abs(city.lng - coords[1]) < 0.8
      }
      return (
        city.name.toLowerCase().includes(value) ||
        city.country.toLowerCase().includes(value) ||
        city.address.toLowerCase().includes(value)
      )
    })
  }, [query])

  const selectedCity =
    cities.find((city) => city.id === selectedCityId) ??
    (filteredCities.length === 1 ? filteredCities[0] : null)

  return (
    <section className="min-h-screen flex-1 bg-white px-4 py-6 sm:px-6">
      <a
        href="/dashboard"
        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
      >
        {t.dashboardBackToHub}
      </a>

      <div className="mx-auto mt-6 max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{t.dashboardTabIntel}</h1>
        <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-pm-sm sm:p-5">
          <label className="mb-2 block text-sm font-semibold text-zinc-800">{copy.searchLabel}</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[#4a86f7] focus:ring-2 focus:ring-[#4a86f7]/20"
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
            <div className="relative">
              <img
                src="https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74393/europe_gebco_lrg.jpg"
                alt="Carte interactive de l Europe"
                className="h-[320px] w-full object-cover sm:h-[440px]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => setSelectedCityId(city.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                    selectedCity?.id === city.id
                      ? 'border-blue-900 bg-blue-600'
                      : 'border-white bg-[#4a86f7]'
                  } h-4 w-4 shadow-[0_0_0_4px_rgba(74,134,247,0.22)] transition`}
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  aria-label={city.name}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 text-sm">
            {selectedCity ? (
              <div className="space-y-1 text-zinc-700">
                <p className="font-semibold text-zinc-900">
                  {copy.selectedCity}: {selectedCity.name} ({selectedCity.country})
                </p>
                <p>{selectedCity.address}</p>
                <p>
                  {copy.coordinates}: {selectedCity.lat}, {selectedCity.lng}
                </p>
              </div>
            ) : filteredCities.length === 0 ? (
              <p className="font-medium text-rose-600">{copy.noResult}</p>
            ) : (
              <p className="text-zinc-600">{copy.clickHint}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

