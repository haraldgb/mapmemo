import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { GMap } from '../components/GMap'
import { GameHUD } from './GameHUD.tsx'
import { useFeaturesInPlay } from './hooks/useFeaturesInPlay.ts'
import { useGameState } from './useGameState'
import { useGameStyling } from './hooks/useGameStyling'
import { useFeatureLabels } from './hooks/useFeatureLabels'
import { GameSettingsButton } from './settings/GameSettingsButton.tsx'
import type { MapContext } from './types.ts'

export const Game = () => {
  const { modeCount, selectedAreas } = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const featuresInPlay = useFeaturesInPlay({
    gameState: { modeCount, selectedAreas },
  })
  const [isGMapReady, setIsGMapReady] = useState(false)
  const [mapContext, setMapContext] = useState<MapContext>(null)
  const gameState = useGameState({ features: featuresInPlay })
  const gameStyling = useGameStyling({ gameState, mapContext })
  useFeatureLabels({ gameState, mapContext, features: featuresInPlay })

  const handleMapReady = (payload: MapContext) => {
    setMapContext(payload)
    setIsGMapReady(true)
  }

  return (
    <section className={s_section}>
      <GMap
        spinUntilReady
        features={featuresInPlay}
        onFeatureClick={gameState.registerFeatureClick}
        onFeatureHover={gameStyling.registerFeatureHover}
        onMapReady={(payload) => handleMapReady(payload)}
      >
        {isGMapReady && (
          <>
            <GameHUD gameState={gameState} />
            <div className={s_settings_overlay}>
              <GameSettingsButton isGameActive={true} />
            </div>
          </>
        )}
      </GMap>
    </section>
  )
}

const s_section = 'flex min-h-0 flex-1'
const s_settings_overlay =
  'pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2'
