import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { GMap } from '../components/GMap'
import { GameHUD } from './GameHUD.tsx'
import { useFeaturesInPlay } from './hooks/useFeaturesInPlay.ts'
import { useGameState } from './hooks/useGameState.ts'
import { useAreaGameStyling } from './hooks/useAreaGameStyling'
import { useFeatureLabels } from './hooks/useFeatureLabels'
import { GameUI } from './GameUI.tsx'
import type { MapContext } from './types.ts'

export const AreaGame = () => {
  const { areaSubMode, areaCount, selectedAreas, mode } = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const featuresInPlay = useFeaturesInPlay({
    gameState: { areaSubMode, areaCount, selectedAreas },
  })
  const [isGMapReady, setIsGMapReady] = useState(false)
  const [mapContext, setMapContext] = useState<MapContext>(null)
  const gameState = useGameState({
    features: featuresInPlay,
    isMapReady: isGMapReady,
  })

  if (gameState.mode === 'route') {
    throw new Error('AreaGame rendered in route mode')
  }

  const { areaGameState } = gameState

  const gameStyling = useAreaGameStyling({
    areaGameState,
    mapContext,
  })
  useFeatureLabels({
    areaGameState: areaGameState,
    mapContext,
    features: featuresInPlay,
  })

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
          mode === 'click' ? areaGameState.registerFeatureClick : undefined
        }
        onFeatureHover={gameStyling.registerFeatureHover}
        onMapReady={handleMapReady}
      >
        {isGMapReady && (
          <>
            <GameHUD gameState={gameState} />
            <GameUI gameState={gameState} />
          </>
        )}
      </GMap>
    </section>
  )
}

const s_section = 'flex min-h-0 flex-1'
