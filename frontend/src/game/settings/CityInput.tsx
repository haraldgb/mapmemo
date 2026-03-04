import { useEffect, useState } from 'react'
import { AutoCompleteInput } from '../../components/AutoCompleteInput'
import type { CityListItem } from '../../api/cityApi'
import { fetchCities } from '../../api/cityApi'
import type { SelectedCity } from './settingsTypes'

type Props = {
  selectedCity: SelectedCity | null
  onSelect: (city: SelectedCity) => void
}

export const CityInput = ({ selectedCity, onSelect }: Props) => {
  const [cities, setCities] = useState<CityListItem[]>([])
  const [typedValue, setTypedValue] = useState(selectedCity?.name ?? '')
  const [shake, setShake] = useState(false)
  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  useEffect(function loadCities() {
    fetchCities()
      .then(setCities)
      .catch(() => {
        // Cities list unavailable — autocomplete will be empty
      })
  }, [])

  const filteredSuggestions = typedValue.trim()
    ? cities
        .filter((c) => c.name.toLowerCase().includes(typedValue.toLowerCase()))
        .map((c) => c.name)
    : cities.map((c) => c.name)

  const handleSelect = (cityName: string) => {
    const city = cities.find((c) => c.name === cityName)
    if (!city) {
      return
    }
    setTypedValue(city.name)
    onSelect({ id: city.id, name: city.name })
  }

  return (
    <div className={s_container}>
      <AutoCompleteInput
        suggestions={filteredSuggestions}
        value={typedValue}
        onChange={setTypedValue}
        onSelect={handleSelect}
        onBlur={() => {
          const validValue = selectedCity?.name ?? ''
          if (typedValue !== validValue) {
            setTypedValue(validValue)
            triggerShake()
          }
        }}
        placeholder='Search city...'
        containerClassName={sf_autocomplete_container(shake)}
        inputClassName={s_input}
      />
    </div>
  )
}

const s_container = 'mt-2'
const sf_autocomplete_container = (isShaking: boolean) =>
  `relative ${isShaking ? 'animate-shake' : ''}`
const s_input =
  'w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
