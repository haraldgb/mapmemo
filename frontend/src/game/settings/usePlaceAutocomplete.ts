import { useEffect, useRef, useState } from 'react'
import type { CityInfo } from '../../api/cityApi'
import { checkRoad } from '../../api/roadData'
import type { RouteAddress } from '../route/types'

const extractRouteComponent = (
  components: google.maps.places.AddressComponent[],
): string => components.find((c) => c.types.includes('route'))?.longText ?? ''

const AUTO_ACCEPT_THRESHOLD = 0.85

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
  isValidatingRoadName: boolean
  clearValidationError: () => void
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
  const [isValidatingRoadName, setIsValidatingRoadName] = useState(false)

  // All props in ref — hook closures only close over stable values (setState fns,
  // refs) so the React Compiler can memoize every function returned from this hook.
  const stateRef = useRef<StateRef>({
    addresses,
    onAddressesChange,
    cityInfo,
    placesLibrary,
    disabled,
  })
  useEffect(function syncStateRef() {
    stateRef.current = {
      addresses,
      onAddressesChange,
      cityInfo,
      placesLibrary,
      disabled,
    }
  })

  const predictionsMapRef = useRef(
    new Map<string, google.maps.places.PlacePrediction>(),
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(function cancelDebounceOnUnmount() {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const clearInput = () => {
    setInputValue('')
    setSuggestions([])
    predictionsMapRef.current.clear()
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
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
    if (
      current.some((a) => a.roadName.toLowerCase() === roadName.toLowerCase())
    ) {
      setValidationError('Addresses sharing road cannot be added.')
      setValidationErrorLevel('error')
      triggerShake()
      clearInput()
      return
    }
    setValidationError(null)
    setValidationErrorLevel('warning')
    onChange([...current, { label, streetAddress, roadName, lat, lng }])
    clearInput()
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (!value.trim()) {
      setSuggestions([])
      predictionsMapRef.current.clear()
      return
    }
    debounceRef.current = setTimeout(() => {
      // call to outside function keeps arguments stable
      void runAutocomplete(value, stateRef, predictionsMapRef, setSuggestions)
    }, 300)
  }

  const handleSelect = (label: string) => {
    const prediction = predictionsMapRef.current.get(label)
    if (!prediction) {
      setValidationError('Try selecting from the dropdown.')
      setValidationErrorLevel('warning')
      return
    }
    setInputValue(label)
    // call to outside function keeps arguments stable
    void runSelect(label, prediction, stateRef, {
      setValidationError,
      setValidationErrorLevel,
      setIsValidatingRoadName,
      addAddress,
      triggerShake,
      clearInput,
    })
  }

  const clearValidationError = () => {
    setValidationError(null)
    setValidationErrorLevel('warning')
  }

  return {
    inputValue,
    suggestions,
    handleInputChange,
    handleSelect,
    validationError,
    validationErrorLevel,
    shake,
    isValidatingRoadName,
    clearValidationError,
  }
}

// All props stored in a ref so async handlers always see current values.
// Kept at module scope so its shape is visible to the module-level helpers below.
type StateRef = {
  addresses: RouteAddress[]
  onAddressesChange: (addresses: RouteAddress[]) => void
  cityInfo: CityInfo | null
  placesLibrary: google.maps.PlacesLibrary | null
  disabled: boolean
}

type SelectHandlers = {
  setValidationError: (e: string | null) => void
  setValidationErrorLevel: (l: 'warning' | 'error') => void
  setIsValidatingRoadName: (v: boolean) => void
  addAddress: (
    lat: number,
    lng: number,
    roadName: string,
    label: string,
    streetAddress: string,
  ) => void
  triggerShake: () => void
  clearInput: () => void
}

// These two functions live outside the hook because the React Compiler bails on
// try-catch blocks, preventing memoization of any closures that contain them.
// Moving try-catch to module scope lets the compiler freely memoize the hook's
// internal functions, which only close over stable setState fns and refs.

const runAutocomplete = async (
  value: string,
  stateRef: { current: StateRef },
  predictionsMapRef: {
    current: Map<string, google.maps.places.PlacePrediction>
  },
  setSuggestions: (s: string[]) => void,
): Promise<void> => {
  const { cityInfo, disabled, placesLibrary } = stateRef.current
  if (disabled || !placesLibrary) {
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

  try {
    const { suggestions: rawSuggestions } =
      await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        {
          input: value,
          includedRegionCodes: ['no'],
          ...(locationRestriction ? { locationRestriction } : {}),
        },
      )
    predictionsMapRef.current.clear()
    const labels: string[] = []
    for (const s of rawSuggestions) {
      if (s.placePrediction) {
        const label = s.placePrediction.text.text
        predictionsMapRef.current.set(label, s.placePrediction)
        labels.push(label)
      }
    }
    setSuggestions(labels)
  } catch {
    setSuggestions([])
    predictionsMapRef.current.clear()
  }
}

const runSelect = async (
  label: string,
  prediction: google.maps.places.PlacePrediction,
  stateRef: { current: StateRef },
  handlers: SelectHandlers,
): Promise<void> => {
  const {
    setValidationError,
    setValidationErrorLevel,
    setIsValidatingRoadName,
    addAddress,
    triggerShake,
    clearInput,
  } = handlers

  setIsValidatingRoadName(true)
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
    const displayLabel = place.displayName ?? place.formattedAddress ?? label
    const streetAddress = place.formattedAddress ?? displayLabel

    if (!roadName) {
      setValidationError('Try selecting from the dropdown.')
      setValidationErrorLevel('warning')
      return
    }

    const cityId = stateRef.current.cityInfo?.id
    if (!cityId) {
      setValidationError('Select a city first.')
      setValidationErrorLevel('error')
      return
    }

    try {
      const result = await checkRoad(cityId, roadName)

      if (result.found && result.canonicalName) {
        addAddress(lat, lng, result.canonicalName, displayLabel, streetAddress)
        return
      }

      const topSuggestions = result.suggestions.slice(0, 3)
      const best = topSuggestions[0]

      if (best && best.score >= AUTO_ACCEPT_THRESHOLD) {
        addAddress(lat, lng, best.name, displayLabel, streetAddress)
        setValidationError(
          `Used closest OSM name match: \n"${roadName}" - ${best.name}(${Math.round(best.score * 100)}%)`,
        )
        setValidationErrorLevel('warning')
        return
      }

      if (topSuggestions.length > 0) {
        const suggestionLines = topSuggestions
          .map(
            (s) => `"${roadName}" - ${s.name} (${Math.round(s.score * 100)}%)`,
          )
          .join('\n')
        setValidationError(
          `Road name of address not found in OSM data.\nSome similar options to try:\n${suggestionLines}`,
        )
        setValidationErrorLevel('error')
        triggerShake()
        clearInput()
        return
      }

      setValidationError('Could not find matching road name in OSM-data')
      setValidationErrorLevel('error')
      triggerShake()
      clearInput()
    } catch {
      // Check failed (network/server error) — add as-is rather than blocking user
      addAddress(lat, lng, roadName, displayLabel, streetAddress)
    }
  } catch {
    setValidationError('Try selecting from the dropdown.')
    setValidationErrorLevel('warning')
  } finally {
    setIsValidatingRoadName(false)
  }
}
