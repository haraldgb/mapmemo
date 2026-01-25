import { all, call, put, takeLatest } from 'redux-saga/effects'
import { mapmemoActions } from './reducer'
import type { GameSettings } from '../game/settings/settingsTypes'
import { loadGameSettings, saveGameSettings } from './sagaUtils'

function* handleInitializeApp() {
  try {
    const storedSettings: GameSettings | null = yield call(loadGameSettings)
    if (storedSettings) {
      yield put(mapmemoActions.setGameSettings(storedSettings))
    }
    // reducer has default values if none are found.
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
