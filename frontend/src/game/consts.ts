export const SEED_LENGTH = 8
// lowercase alphanumeric
export const SEED_REGEX = /^[a-z0-9]+$/

export const OSLO_CENTER = { lat: 59.91, lng: 10.73 }

export const DELBYDELER_GEOJSON_URL = '/api/oslo-neighboorhoods'

// properties names of Oslo GeoJSON.
export const ID_KEY = 'FID'
export const MUNICIPALITY_KEY = 'kommunenum'
export const SUB_AREA_KEY = 'DELBYDEL'
export const SUB_AREA_NAME_KEY = 'DELBYDELSN'
export const AREA_KEY = 'BYDEL'
export const AREA_NAME_KEY = 'BYDELSNAVN'
export type OsloGeoJsonPropertyKey =
  | typeof ID_KEY
  | typeof MUNICIPALITY_KEY
  | typeof SUB_AREA_KEY
  | typeof SUB_AREA_NAME_KEY
  | typeof AREA_KEY
  | typeof AREA_NAME_KEY

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

export const TARGET_STYLE_DIM: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#3b82f6',
  strokeWeight: 2.5,
  fillColor: '#3b82f6',
  fillOpacity: 0.1,
}

export const TARGET_STYLE_BRIGHT: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#3b82f6',
  strokeWeight: 2.5,
  fillColor: '#3b82f6',
  fillOpacity: 0.3,
}

export const INCORRECT_FLASH_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#ef4444',
  fillColor: '#ef4444',
  fillOpacity: 0.4,
}

export const MODE_OPTIONS = [
  { label: 'Click', value: 'click' },
  { label: 'Name', value: 'name' },
  { label: 'Route', value: 'route' },
] as const

export const MODE_DESCRIPTIONS: Record<string, string> = {
  click: 'Find and click the named area on the map.',
  name: 'Type the name of the highlighted area.',
  route: 'Navigate from A to B through intersections.',
}

export const DIFFICULTY_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
] as const

export const DIFFICULTY_DESCRIPTIONS: Record<string, string> = {
  beginner: 'Suggests only areas in play. Shows before first input',
  easy: 'Suggests only areas in play. Shows after first input.',
  medium: 'Suggests all areas, not only those in play.',
  hard: 'No suggestions',
}

export const AREA_SUB_MODE_OPTIONS = [
  { label: 'Full pool', value: 'areaCount' },
  { label: 'Pick areas', value: 'areaPick' },
] as const

export const AREA_SUB_MODE_DESCRIPTIONS: Record<string, string> = {
  areaCount: 'Play a set number of areas from the full pool.',
  areaPick: 'Choose specific areas to play.',
}

export const AREA_COUNT_OPTIONS = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: 'Alle (99)', value: 99 },
] as const
