import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { GMap } from '../components/GMap'
import { GameHUD } from './GameHUD.tsx'
import { useFeaturesInPlay } from './hooks/useFeaturesInPlay.ts'
import { useGameState } from './useGameState'
import { GameSettingsButton } from './settings/GameSettingsButton.tsx'

type MapContext = {
  map: google.maps.Map
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
} | null

export const Game = () => {
  const { modeCount, selectedAreas } = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const featuresInPlay = useFeaturesInPlay({
    gameState: { modeCount, selectedAreas },
  })
  const [isGMapReady, setIsGMapReady] = useState(false)
  const [mapContext, setMapContext] = useState<MapContext>(null)
  const gameState = useGameState({ features: featuresInPlay, mapContext })

  const handleMapReady = (payload: MapContext) => {
    setMapContext(payload)
    setIsGMapReady(true)
  }

  return (
    <section className={s_section}>
      <GMap
        spinUntilReady
        features={featuresInPlay}
        onFeatureClick={gameState.onFeatureClick}
        onFeatureHover={gameState.onFeatureHover}
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
