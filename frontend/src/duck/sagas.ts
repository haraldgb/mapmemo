import { all, call, put, takeLatest } from 'redux-saga/effects'
import { mapmemoActions, DEFAULT_GAME_SETTINGS } from './reducer'
import type { GameSettings } from '../game/settings/settingsTypes'
import type { CityInfo } from '../api/cityApi'
import { fetchCityInfo } from '../api/cityApi'
import { loadGameSettings, saveGameSettings } from './sagaUtils'
import { DELBYDELER_GEOJSON_URL } from '../game/consts'
import {
  buildAllSubAreaNames,
  buildAreaOptionsFromGeoJson,
  type OsloGeoJson,
} from '../game/utils'

function* handleInitializeApp() {
  try {
    const storedSettings: GameSettings | null = yield call(loadGameSettings)
    if (storedSettings) {
      // reducer has default values if none are found.
      yield put(mapmemoActions.setGameSettings(storedSettings))
      if (storedSettings.selectedCity !== null) {
        const cityInfo: CityInfo = yield call(
          fetchCityInfo,
          storedSettings.selectedCity.id,
        )
        yield put(mapmemoActions.setCityInfo(cityInfo))
      }
    }
  } catch {
    yield put(mapmemoActions.setGameSettings(DEFAULT_GAME_SETTINGS))
  } finally {
    yield put(mapmemoActions.setAppInitialized(true))
  }
}

function* handleLoadAreaOptions() {
  try {
    yield put(mapmemoActions.setAreaOptionsLoading(true))
    const response: Response = yield call(fetch, DELBYDELER_GEOJSON_URL)
    if (!response.ok) {
      const text: string = yield call([response, response.text])
      throw new Error('Failed to load Oslo GeoJSON, response: ' + text)
    }
    // SAFETY: Oslo-specific cast until multi-city GeoJSON support is added.
    const geojson = (yield call([response, response.json])) as OsloGeoJson
    const areaOptions = buildAreaOptionsFromGeoJson(geojson)
    const allSubAreaNames = buildAllSubAreaNames(geojson)
    yield put(mapmemoActions.setAreaOptions(areaOptions))
    yield put(mapmemoActions.setAllSubAreaNames(allSubAreaNames))
  } catch {
    // TODO: add silent error logging to sentry/similar
    yield put(mapmemoActions.setAreaOptionsLoadFailed(true))
  } finally {
    yield put(mapmemoActions.setAreaOptionsLoading(false))
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
    takeLatest(mapmemoActions.loadAreaOptions.type, handleLoadAreaOptions),
  ])
}
