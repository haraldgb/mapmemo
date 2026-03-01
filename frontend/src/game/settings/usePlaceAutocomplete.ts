import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { RouteAddress } from '../route/types'
import type { CityInfo } from '../../api/cityApi'

// The gmp-select event type is not yet in @types/google.maps. At runtime the
// event carries a `placePrediction` getter on its prototype (minified as `mh`).
// Destructuring reads the getter correctly even though Object.keys() misses it.
type PlaceSelectEvent = {
  placePrediction: google.maps.places.PlacePrediction | null
}

const extractRouteComponent = (
  components: google.maps.places.AddressComponent[],
): string => components.find((c) => c.types.includes('route'))?.longText ?? ''

type Options = {
  containerRef: RefObject<HTMLDivElement | null>
  placesLibrary: google.maps.PlacesLibrary | null
  cityInfo: CityInfo | null
  addresses: RouteAddress[]
  onAddressesChange: (addresses: RouteAddress[]) => void
}

type Result = {
  validationError: string | null
  validationErrorLevel: 'warning' | 'error'
}

/**
 * Manages a `PlaceAutocompleteElement` imperatively inside `containerRef`.
 * The element is created once (per `cityInfo` change or after each selection)
 * and destroyed in the effect cleanup.
 *
 * Two selection paths are handled:
 *  1. Dropdown click / keyboard select → fires `gmp-select` with a PlacePrediction.
 *  2. Enter with inline ghost-text completion → `gmp-select` does NOT fire; a
 *     100 ms debounce falls back to `Geocoder` if gmp-select hasn't handled it.
 */
export const usePlaceAutocomplete = ({
  containerRef,
  placesLibrary,
  cityInfo,
  addresses,
  onAddressesChange,
}: Options): Result => {
  // stateRef keeps the latest addresses + callback so that event handlers
  // created inside the effect closure never stale-close over old values.
  // We cannot list addresses/onAddressesChange as effect deps because that
  // would tear down and recreate the element on every change.
  const stateRef = useRef({ addresses, onAddressesChange })

  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationErrorLevel, setValidationErrorLevel] = useState<
    'warning' | 'error'
  >('warning')

  // Incrementing this key is how we clear the autocomplete input after a
  // successful selection — it triggers cleanup + recreation of the element.
  const [autocompleteKey, setAutocompleteKey] = useState(0)

  useEffect(
    function updateStateRef() {
      stateRef.current = { addresses, onAddressesChange }
    },
    [addresses, onAddressesChange],
  )

  useEffect(
    function initAutocompleteElement() {
      if (!placesLibrary || !containerRef.current) {
        return
      }
      // Safety: prevent double-mount if cleanup didn't clear the container
      if (containerRef.current.childElementCount > 0) {
        return
      }

      const bounds =
        cityInfo?.minLat != null &&
        cityInfo.minLon != null &&
        cityInfo.maxLat != null &&
        cityInfo.maxLon != null
          ? ({
              south: cityInfo.minLat,
              west: cityInfo.minLon,
              north: cityInfo.maxLat,
              east: cityInfo.maxLon,
            } satisfies google.maps.LatLngBoundsLiteral)
          : undefined

      const element = new google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: 'no' },
        ...(bounds ? { locationRestriction: bounds } : {}),
      })

      element.style.width = '100%'
      // PlaceAutocompleteElement uses a shadow DOM; it does not inherit the
      // page's color-scheme, so dark-mode systems would render it dark.
      element.style.colorScheme = 'light'
      containerRef.current.appendChild(element)

      // Prevents double-add when both gmp-select and the Enter fallback fire for
      // the same keypress (e.g. inline ghost-text selection with Enter).
      let gmpHandledCurrentEnter = false

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
        const { addresses: current, onAddressesChange: onChange } =
          stateRef.current
        if (current.some((a) => a.roadName === roadName)) {
          setValidationError('Addresses on the same road cannot be added.')
          setValidationErrorLevel('error')
          const container = containerRef.current
          if (container) {
            container.classList.add('animate-shake')
            setTimeout(() => container.classList.remove('animate-shake'), 400)
          }
          setAutocompleteKey((k) => k + 1)
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
        // Increment key to clear the input by destroying + recreating the element
        setAutocompleteKey((k) => k + 1)
      }

      // Path 1: user picks from dropdown or keyboard-selects a prediction
      const handlePlaceChanged = (event: Event) => {
        gmpHandledCurrentEnter = true
        void (async () => {
          const { placePrediction } = event as unknown as PlaceSelectEvent
          if (!placePrediction) {
            return
          }

          const place = placePrediction.toPlace()
          await place.fetchFields({
            fields: [
              'location',
              'addressComponents',
              'formattedAddress',
              'displayName',
            ],
          })

          if (!place.location) {
            return
          }

          const lat = place.location.lat()
          const lng = place.location.lng()
          const roadName = extractRouteComponent(place.addressComponents ?? [])
          const label = place.displayName ?? place.formattedAddress ?? ''
          const streetAddress = place.formattedAddress ?? label
          addAddress(lat, lng, roadName, label, streetAddress)
        })()
      }

      // Path 2: Enter key with inline ghost-text (no dropdown selection).
      // capture: true is required — the element's shadow DOM handlers consume
      // the event before it reaches the bubble phase.
      // The 100 ms delay lets gmp-select fire first if it's going to; if it does,
      // gmpHandledCurrentEnter will be true and the geocoder path is skipped.
      const handleKeyDown = (event: Event) => {
        const ke = event as KeyboardEvent
        if (ke.key !== 'Enter') {
          return
        }
        gmpHandledCurrentEnter = false
        setTimeout(() => {
          if (gmpHandledCurrentEnter) {
            return
          }
          // SAFETY: PlaceAutocompleteElement exposes `value` at runtime but
          // @types/google.maps omits it. We use it here because the clear button
          // clears the input without firing an `input` event, making any cached
          // value stale. Reading element.value at timeout time is the only
          // reliable way to know whether the input is still populated.
          const query = (element as unknown as { value: string }).value.trim()
          if (!query) {
            return
          }
          const geocoder = new google.maps.Geocoder()
          void geocoder.geocode({ address: query }, (results, status) => {
            if (status !== 'OK' || !results?.length) {
              setValidationError('Try selecting from the dropdown.')
              return
            }
            const result = results[0]
            const location = result.geometry.location
            const lat = location.lat()
            const lng = location.lng()
            // GeocoderAddressComponent uses long_name (not longText like Places API)
            const routeComponent = result.address_components?.find((c) =>
              c.types.includes('route'),
            )
            const roadName = routeComponent?.long_name ?? ''
            const label = result.formatted_address ?? query
            const streetAddress = result.formatted_address ?? query
            addAddress(lat, lng, roadName, label, streetAddress)
          })
        }, 100)
      }

      element.addEventListener('gmp-select', handlePlaceChanged)
      element.addEventListener('keydown', handleKeyDown, { capture: true })

      return () => {
        element.removeEventListener('gmp-select', handlePlaceChanged)
        element.removeEventListener('keydown', handleKeyDown, { capture: true })
        // React 19 sets refs to null before cleanup runs, so we cannot use
        // containerRef.current?.removeChild(element) — it would be a no-op and
        // leave the element in the DOM. element.remove() works unconditionally.
        element.remove()
      }
    },
    [placesLibrary, cityInfo, autocompleteKey, containerRef],
  )

  return { validationError, validationErrorLevel }
}
