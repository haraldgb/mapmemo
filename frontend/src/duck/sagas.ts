import { all, call, put, takeLatest } from 'redux-saga/effects'
import { mapmemoActions } from './reducer'
import type { GameSettings } from '../game/settings/settingsTypes'
import { loadGameSettings, saveGameSettings } from './sagaUtils'
import { DELBYDELER_GEOJSON_URL } from '../game/consts'
import {
  buildAllSubAreaNames,
  buildAreaOptionsFromGeoJson,
  type OsloGeoJson,
} from '../game/utils'

function* loadAreaOptionsFromOsloGeoJson() {
  // TODO: move Oslo specific stuff to their own file / areas of files.
  const response: Response = yield call(fetch, DELBYDELER_GEOJSON_URL)
  if (!response.ok) {
    throw new Error('Failed to load Oslo GeoJSON, response: ' + response.text)
  }
  // TODO: Disallow casting as soon as more geojson data is added.
  const geojson = (yield call([response, response.json])) as OsloGeoJson
  const areaOptions = buildAreaOptionsFromGeoJson(geojson)
  const allSubAreaNames = buildAllSubAreaNames(geojson)
  yield put(mapmemoActions.setAreaOptions(areaOptions))
  yield put(mapmemoActions.setAllSubAreaNames(allSubAreaNames))
}

function* handleInitializeApp() {
  try {
    const storedSettings: GameSettings | null = yield call(loadGameSettings)
    if (storedSettings) {
      // reducer has default values if none are found.
      yield put(mapmemoActions.setGameSettings(storedSettings))
    }
    yield call(loadAreaOptionsFromOsloGeoJson)
  } finally {
    yield put(mapmemoActions.setAppInitialized(true))
  }
}

function* handleGameSettingsChange(
  action: ReturnType<typeof mapmemoActions.setGameSettings>,
) {
  try {
    yield call(saveGameSettings, action.payload)
  } catch {
    // TODO: add silent error logging to sentry/similar
  }
}

export function* mapmemoSaga() {
  yield all([
    takeLatest(mapmemoActions.initializeApp.type, handleInitializeApp),
    takeLatest(mapmemoActions.setGameSettings.type, handleGameSettingsChange),
  ])
}
