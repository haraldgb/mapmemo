import { useEffect, useRef, useState } from 'react'
import type { CityInfo } from '../../api/cityApi'
import type { RouteAddress } from '../route/types'

const extractRouteComponent = (
  components: google.maps.places.AddressComponent[],
): string => components.find((c) => c.types.includes('route'))?.longText ?? ''

type Options = {
  placesLibrary: google.maps.PlacesLibrary | null
  cityInfo: CityInfo | null
  addresses: RouteAddress[]
  onAddressesChange: (addresses: RouteAddress[]) => void
  disabled?: boolean
}

type Result = {
  inputValue: string
  suggestions: string[]
  handleInputChange: (value: string) => void
  handleSelect: (label: string) => void
  validationError: string | null
  validationErrorLevel: 'warning' | 'error'
  shake: boolean
}

export const usePlaceAutocomplete = ({
  placesLibrary,
  cityInfo,
  addresses,
  onAddressesChange,
  disabled = false,
}: Options): Result => {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationErrorLevel, setValidationErrorLevel] = useState<
    'warning' | 'error'
  >('warning')
  const [shake, setShake] = useState(false)

  // Keep latest addresses + callback in a ref to avoid stale closures in async handlers
  const stateRef = useRef({ addresses, onAddressesChange })
  useEffect(function syncStateRef() {
    stateRef.current = { addresses, onAddressesChange }
  })

  // Map from suggestion label → PlacePrediction (to call toPlace() on select)
  const predictionsMapRef = useRef(
    new Map<string, google.maps.places.PlacePrediction>(),
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearInput = () => {
    setInputValue('')
    setSuggestions([])
    predictionsMapRef.current.clear()
  }

  const addAddress = (
    lat: number,
    lng: number,
    roadName: string,
    label: string,
    streetAddress: string,
  ) => {
    if (!roadName) {
      setValidationError('Try selecting from the dropdown.')
      setValidationErrorLevel('warning')
      return
    }
    const { addresses: current, onAddressesChange: onChange } = stateRef.current
    if (current.some((a) => a.roadName === roadName)) {
      setValidationError('Addresses sharing road cannot be added.')
      setValidationErrorLevel('error')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      clearInput()
      return
    }
    setValidationError(null)
    setValidationErrorLevel('warning')
    const newAddress: RouteAddress = {
      label,
      streetAddress,
      roadName,
      lat,
      lng,
    }
    onChange([...current, newAddress])
    clearInput()
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim() || disabled || !placesLibrary) {
      setSuggestions([])
      predictionsMapRef.current.clear()
      return
    }

    const locationRestriction: google.maps.LatLngBoundsLiteral | undefined =
      cityInfo?.minLat != null &&
      cityInfo.minLon != null &&
      cityInfo.maxLat != null &&
      cityInfo.maxLon != null
        ? {
            south: cityInfo.minLat,
            west: cityInfo.minLon,
            north: cityInfo.maxLat,
            east: cityInfo.maxLon,
          }
        : undefined

    debounceRef.current = setTimeout(async () => {
      try {
        const { suggestions: rawSuggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: value,
              includedRegionCodes: ['no'],
              ...(locationRestriction ? { locationRestriction } : {}),
            },
          )
        const newMap = new Map<string, google.maps.places.PlacePrediction>()
        const labels: string[] = []
        for (const s of rawSuggestions) {
          if (s.placePrediction) {
            const label = s.placePrediction.text.text
            newMap.set(label, s.placePrediction)
            labels.push(label)
          }
        }
        predictionsMapRef.current = newMap
        setSuggestions(labels)
      } catch {
        setSuggestions([])
        predictionsMapRef.current.clear()
      }
    }, 300)
  }

  const handleSelect = (label: string) => {
    const prediction = predictionsMapRef.current.get(label)
    if (!prediction) {
      setValidationError('Try selecting from the dropdown.')
      setValidationErrorLevel('warning')
      return
    }
    // Show selected label immediately while fetching details
    setInputValue(label)

    void (async () => {
      try {
        const place = prediction.toPlace()
        await place.fetchFields({
          fields: [
            'location',
            'addressComponents',
            'formattedAddress',
            'displayName',
          ],
        })
        if (!place.location) {
          setValidationError('Try selecting from the dropdown.')
          setValidationErrorLevel('warning')
          return
        }
        const lat = place.location.lat()
        const lng = place.location.lng()
        const roadName = extractRouteComponent(place.addressComponents ?? [])
        const displayLabel =
          place.displayName ?? place.formattedAddress ?? label
        const streetAddress = place.formattedAddress ?? displayLabel
        addAddress(lat, lng, roadName, displayLabel, streetAddress)
      } catch {
        setValidationError('Try selecting from the dropdown.')
        setValidationErrorLevel('warning')
      }
    })()
  }

  return {
    inputValue,
    suggestions,
    handleInputChange,
    handleSelect,
    validationError,
    validationErrorLevel,
    shake,
  }
}
