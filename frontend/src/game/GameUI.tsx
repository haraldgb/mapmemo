import { GameSettingsButton } from './settings/GameSettingsButton.tsx'

type Props = {
  isGameActive: boolean
  resetGameState: () => void
}

export const GameUI = ({ isGameActive, resetGameState }: Props) => {
  return (
    <div className={s_ui}>
      <GameSettingsButton
        isGameActive={isGameActive}
        resetGameState={resetGameState}
      />
    </div>
  )
}

const s_ui =
  'pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2'
