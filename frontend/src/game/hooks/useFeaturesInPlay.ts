import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DELBYDELER_GEOJSON_URL } from '../consts'
import type { AreaSubMode } from '../settings/settingsTypes'
import {
  getAreaId,
  buildAreaOptionsFromGeoJson,
  buildAllSubAreaNames,
  type OsloGeoJson,
} from '../utils'
import { fetchWithSessionRetry } from '../../api/utils'
import { mapmemoActions } from '../../duck/reducer'
import type { AppDispatch, RootState } from '../../store'

type GeoJsonObject = {
  type: string
  features?: unknown[]
  crs?: {
    type?: string
    properties?: {
      name?: string
    }
  }
  [key: string]: unknown
}

const getGeoJsonType = (geojson: GeoJsonObject): 'EPSG:3857' | 'unknown' => {
  const crsName = geojson.crs?.properties?.name ?? ''
  return crsName.toUpperCase().includes('EPSG:3857') ? 'EPSG:3857' : 'unknown'
}

const mercatorToLatLng = (x: number, y: number) => {
  const originShift = 20037508.34
  const lon = (x / originShift) * 180
  const lat =
    (Math.atan(Math.exp((y / originShift) * Math.PI)) * 2 - Math.PI / 2) *
    (180 / Math.PI)
  return [lon, lat]
}

const convertGeoJsonToLatLng = (geojson: GeoJsonObject) => {
  const visitCoords = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) {
      return coords
    }
    if (
      coords.length === 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      return mercatorToLatLng(coords[0], coords[1])
    }
    return coords.map(visitCoords)
  }

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    geojson.features = geojson.features.map((feature) => {
      const geometry = (feature as { geometry?: { coordinates?: unknown } })
        .geometry
      if (geometry?.coordinates) {
        geometry.coordinates = visitCoords(geometry.coordinates)
      }
      return feature
    })
  } else if (geojson.type === 'Feature') {
    const geometry = (geojson as { geometry?: { coordinates?: unknown } })
      .geometry
    if (geometry?.coordinates) {
      geometry.coordinates = visitCoords(geometry.coordinates)
    }
  } else if ((geojson as { coordinates?: unknown }).coordinates) {
    geojson = {
      ...geojson,
      coordinates: visitCoords(
        (geojson as { coordinates?: unknown }).coordinates,
      ),
    }
  }

  return geojson
}

type Props = {
  gameState: {
    areaSubMode: AreaSubMode
    areaCount: number
    selectedAreas: string[]
  }
}

export const useFeaturesInPlay = ({ gameState }: Props) => {
  const mapsLibrary = useMapsLibrary('maps')
  const [allFeatures, setAllFeatures] = useState<google.maps.Data.Feature[]>([])
  const dispatch = useDispatch<AppDispatch>()
  const areaOptionsLoaded = useSelector(
    (state: RootState) => state.mapmemo.areaOptions.length > 0,
  )

  useEffect(
    function loadOsloGeoJson() {
      if (!mapsLibrary || typeof google?.maps?.Data !== 'function') {
        return
      }
      let isActive = true
      const controller = new AbortController()

      const loadGeoJson = async () => {
        if (!isActive) {
          return
        }

        const response = await fetchWithSessionRetry(DELBYDELER_GEOJSON_URL, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load Oslo GeoJSON')
        }
        // SAFETY: Oslo-specific cast until multi-city GeoJSON support is added.
        const rawGeojson = (await response.json()) as OsloGeoJson &
          GeoJsonObject
        if (!isActive) {
          return
        }

        if (!areaOptionsLoaded) {
          // settings uses area options.
          const areaOptions = buildAreaOptionsFromGeoJson(rawGeojson)
          const allSubAreaNames = buildAllSubAreaNames(rawGeojson)
          dispatch(mapmemoActions.setAreaOptions(areaOptions))
          dispatch(mapmemoActions.setAllSubAreaNames(allSubAreaNames))
        }

        let geojson: GeoJsonObject = rawGeojson
        if (getGeoJsonType(geojson) === 'EPSG:3857') {
          geojson = convertGeoJsonToLatLng(geojson)
        }

        const dataLayer = new google.maps.Data()
        const loadedFeatures = dataLayer.addGeoJson(geojson)
        if (!isActive) {
          return
        }
        setAllFeatures(loadedFeatures)
      }

      void loadGeoJson().catch((error) => {
        if (error?.name === 'AbortError' && controller.signal.aborted) {
          return
        }
        throw error
      })

      return () => {
        isActive = false
        controller.abort()
      }
    },
    [mapsLibrary],
  )

  if (gameState.areaSubMode === 'areaCount') {
    const maxCount = Math.min(gameState.areaCount, allFeatures.length)
    return allFeatures.slice(0, maxCount)
  }

  if (gameState.selectedAreas.length === 0) {
    return allFeatures
  }

  return allFeatures.filter((feature) => {
    const areaId = getAreaId(feature)
    return areaId ? gameState.selectedAreas.includes(areaId) : false
  })
}
