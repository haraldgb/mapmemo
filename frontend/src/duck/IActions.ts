export interface SetMessagePayload {
  message: string
}

export type MapmemoActionType =
  | 'mapmemo/setMessage'
  | 'mapmemo/resetMessage'
  | 'mapmemo/setGameSettings'
  | 'mapmemo/initializeApp'
  | 'mapmemo/setGameInitialized'
