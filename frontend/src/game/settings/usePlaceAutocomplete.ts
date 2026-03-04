import { useEffect, useRef, useState } from 'react'
import type { CityInfo } from '../../api/cityApi'
import { checkRoad } from '../../api/roadData'
import type { RouteAddress } from '../route/types'

const extractRouteComponent = (
  components: google.maps.places.AddressComponent[],
): string => components.find((c) => c.types.includes('route'))?.longText ?? ''

const AUTO_ACCEPT_THRESHOLD = 0.9

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
    // Reject if another address already uses the same road
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
    // Guard: prediction must exist in the map (user must pick from dropdown)
    const prediction = predictionsMapRef.current.get(label)
    if (!prediction) {
      setValidationError('Try selecting from the dropdown.')
      setValidationErrorLevel('warning')
      return
    }
    setInputValue(label)

    void (async () => {
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
        // Guard: place must resolve to a geographic location
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

        // Guard: place must contain a named road component
        if (!roadName) {
          setValidationError('Try selecting from the dropdown.')
          setValidationErrorLevel('warning')
          return
        }

        // Skip OSM check if no city is selected — add as-is
        const cityId = cityInfo?.id
        if (!cityId) {
          addAddress(lat, lng, roadName, displayLabel, streetAddress)
          return
        }

        try {
          const result = await checkRoad(cityId, roadName)

          // Exact (case-insensitive) match — use canonical OSM name
          if (result.found && result.canonicalName) {
            addAddress(
              lat,
              lng,
              result.canonicalName,
              displayLabel,
              streetAddress,
            )
            return
          }

          const topSuggestions = result.suggestions.slice(0, 3)
          const best = topSuggestions[0]

          // Best fuzzy match is close enough — silently correct to OSM name
          if (best && best.score >= AUTO_ACCEPT_THRESHOLD) {
            const suggestionLines = topSuggestions
              .map((s) => `- ${s.name} (${Math.round(s.score * 100)}%)`)
              .join('\n')
            setValidationError(
              `Used OSM name: ${best.name}\n${suggestionLines}`,
            )
            setValidationErrorLevel('warning')
            addAddress(lat, lng, best.name, displayLabel, streetAddress)
            return
          }

          // Fuzzy matches exist but none are close enough — show suggestions, reject
          if (topSuggestions.length > 0) {
            const suggestionLines = topSuggestions
              .map((s) => `- ${s.name} (${Math.round(s.score * 100)}%)`)
              .join('\n')
            setValidationError(
              `Road name not found in OSM data\n${suggestionLines}`,
            )
            setValidationErrorLevel('error')
            triggerShake()
            clearInput()
            return
          }

          // No match and no similar roads found
          setValidationError('Could not find matching road name in OSM-data')
          setValidationErrorLevel('error')
          triggerShake()
          clearInput()
        } catch {
          // Check failed (network/server error) — add as-is rather than blocking user
          addAddress(lat, lng, roadName, displayLabel, streetAddress)
        } finally {
          setIsValidatingRoadName(false)
        }
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
    isValidatingRoadName,
  }
}
