import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { GMap } from '../components/GMap'
import { GameHUD } from './GameHUD.tsx'
import { useFeaturesInPlay } from './hooks/useFeaturesInPlay.ts'
import { useGame } from './hooks/useGame.ts'
import { useGameStyling } from './hooks/useGameStyling'
import { useFeatureLabels } from './hooks/useFeatureLabels'
import { GameUI } from './GameUI.tsx'
import type { MapContext } from './types.ts'

export const Game = () => {
  const { areaCount, selectedAreas, mode } = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const featuresInPlay = useFeaturesInPlay({
    gameState: { areaCount, selectedAreas },
  })
  const [isGMapReady, setIsGMapReady] = useState(false)
  const [mapContext, setMapContext] = useState<MapContext>(null)
  const gameState = useGame({
    features: featuresInPlay,
    isMapReady: isGMapReady,
  })
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
        onFeatureClick={
          mode === 'click' ? gameState.registerFeatureClick : undefined
        }
        onFeatureHover={gameStyling.registerFeatureHover}
        onMapReady={(payload) => handleMapReady(payload)}
      >
        {isGMapReady && (
          <>
            <GameHUD
              gameState={gameState}
              formattedTime={gameState.formattedTime}
            />
            <GameUI
              gameState={gameState}
              resetGameState={gameState.resetGame}
            />
          </>
        )}
      </GMap>
    </section>
  )
}

const s_section = 'flex min-h-0 flex-1'
