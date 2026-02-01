import type { GameSettings } from './settings/settingsTypes'

export const OSLO_CENTER = { lat: 59.91, lng: 10.73 }

export const DELBYDELER_GEOJSON_URL = '/Delbydeler_1854838652447253595.geojson'

// Key for the sub area label property in the GeoJSON data for Oslo.
export const SUB_AREA_KEY = 'DELBYDELSN'
// Keys for the area properties in the GeoJSON data for Oslo.
export const AREA_KEY = 'BYDEL'
export const AREA_NAME_KEY = 'BYDELSNAVN'

export const OUTLINE_STYLE: google.maps.Data.StyleOptions = {
  strokeColor: '#6f2dbd',
  strokeOpacity: 0.9,
  strokeWeight: 1.5,
  fillColor: '#6f2dbd',
  fillOpacity: 0,
}

export const HOVER_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  fillColor: '#9b9b9b',
  fillOpacity: 0.35,
}

export const CORRECT_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#2f9e44',
  fillColor: '#2f9e44',
  fillOpacity: 0.45,
}

export const LATE_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#f2c94c',
  fillColor: '#f2c94c',
  fillOpacity: 0.55,
}

export const FLASH_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#f2c94c',
  fillColor: '#f2c94c',
  fillOpacity: 0.55,
}

export const MODE_OPTIONS = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: 'Alle (99)', value: 99 },
] as const

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  modeCount: MODE_OPTIONS[0]?.value ?? 10,
  selectedAreas: [],
}
