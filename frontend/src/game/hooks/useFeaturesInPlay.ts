import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store'
import { mapmemoActions } from '../../duck/reducer'
import { DELBYDELER_GEOJSON_URL } from '../consts'
import { areAreaOptionsEqual, buildAreaOptions, getAreaId } from '../utils'

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
    modeCount: number
    selectedAreas: string[]
  }
}

export const useFeaturesInPlay = ({ gameState }: Props) => {
  const dispatch = useDispatch<AppDispatch>()
  const mapsLibrary = useMapsLibrary('maps')
  const areaOptions = useSelector(
    (state: RootState) => state.mapmemo.areaOptions,
  )
  const [allFeatures, setAllFeatures] = useState<google.maps.Data.Feature[]>([])

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

        const response = await fetch(DELBYDELER_GEOJSON_URL, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load Oslo GeoJSON')
        }
        let geojson = (await response.json()) as GeoJsonObject
        if (getGeoJsonType(geojson) === 'EPSG:3857') {
          geojson = convertGeoJsonToLatLng(geojson)
        }
        // TODO: is this the correct way to do it with new 3rd party library?
        const dataLayer = new google.maps.Data()
        const loadedFeatures = dataLayer.addGeoJson(geojson)
        if (!isActive) {
          return
        }
        setAllFeatures(loadedFeatures)
      }

      void loadGeoJson()

      return () => {
        isActive = false
        controller.abort()
      }
    },
    [mapsLibrary],
  )

  useEffect(
    function updateAreaOptionsEffect() {
      if (allFeatures.length === 0) {
        return
      }
      const nextAreaOptions = buildAreaOptions(allFeatures)
      if (!areAreaOptionsEqual(areaOptions, nextAreaOptions)) {
        dispatch(mapmemoActions.setAreaOptions(nextAreaOptions))
      }
    },
    [allFeatures, areaOptions, dispatch],
  )

  if (gameState.selectedAreas.length === 0) {
    const maxCount = Math.min(gameState.modeCount, allFeatures.length)
    return allFeatures.slice(0, maxCount)
  }
  return allFeatures.filter((feature) => {
    const areaId = getAreaId(feature)
    return areaId ? gameState.selectedAreas.includes(areaId) : false
  })
}
