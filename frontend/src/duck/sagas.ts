import { all, call, put, takeLatest } from 'redux-saga/effects'
import { mapmemoActions, DEFAULT_GAME_SETTINGS } from './reducer'
import type { GameSettings } from '../game/settings/settingsTypes'
import type { CityInfo } from '../api/cityApi'
import { fetchCityInfo } from '../api/cityApi'
import { loadGameSettings, saveGameSettings } from './sagaUtils'

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
