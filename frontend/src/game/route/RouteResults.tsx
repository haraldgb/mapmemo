import { useEffect, useRef, useState } from 'react'
import { computeRouteResult } from '../../api/computeRoutes'
import { Spinner } from '../../components/Spinner'
import type { LatLng, RouteResult } from './types'

type RouteResultsWithPolylines = RouteResult & {
  optimalPolyline: string
  playerPolyline: string
}

interface RouteResultsProps {
  startPosition: LatLng
  endPosition: LatLng
  playerWaypoints: LatLng[]
  gameTimeSeconds: number
  mapContext: {
    map: google.maps.Map
  } | null
  onPlayAgain: () => void
}

const formatDuration = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  if (mins === 0) {
    return `${secs}s`
  }
  return `${mins}m ${secs}s`
}

const formatGameTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const RouteResults = ({
  startPosition,
  endPosition,
  playerWaypoints,
  gameTimeSeconds,
  mapContext,
  onPlayAgain,
}: RouteResultsProps) => {
  const [result, setResult] = useState<RouteResultsWithPolylines | null>(null)
  const [error, setError] = useState<string | null>(null)
  const polylinesRef = useRef<google.maps.Polyline[]>([])

  // Fetch route results on mount
  useEffect(
    function fetchRouteResults() {
      let cancelled = false
      computeRouteResult(
        startPosition,
        endPosition,
        playerWaypoints,
        gameTimeSeconds,
      )
        .then(function onRouteResult(data) {
          if (!cancelled) {
            setResult(data)
          }
        })
        .catch(function onRouteError(err: unknown) {
          if (!cancelled) {
            const message =
              err instanceof Error ? err.message : 'Failed to compute routes'
            setError(message)
          }
        })
      return function cleanup() {
        cancelled = true
      }
    },
    [startPosition, endPosition, playerWaypoints, gameTimeSeconds],
  )

  // Draw polylines on the map when results arrive
  useEffect(
    function drawResultPolylines() {
      if (!result || !mapContext) {
        return
      }

      const playerPath = google.maps.geometry?.encoding?.decodePath(
        result.playerPolyline,
      )
      const optimalPath = google.maps.geometry?.encoding?.decodePath(
        result.optimalPolyline,
      )

      const newPolylines: google.maps.Polyline[] = []

      if (playerPath) {
        newPolylines.push(
          new google.maps.Polyline({
            map: mapContext.map,
            path: playerPath,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            zIndex: 30,
          }),
        )
      }

      if (optimalPath) {
        newPolylines.push(
          new google.maps.Polyline({
            map: mapContext.map,
            path: optimalPath,
            strokeColor: '#22c55e',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            zIndex: 29,
          }),
        )
      }

      polylinesRef.current = newPolylines

      return function cleanupPolylines() {
        for (const pl of newPolylines) {
          pl.setMap(null)
        }
        polylinesRef.current = []
      }
    },
    [result, mapContext],
  )

  if (error) {
    return (
      <div className={s_panel}>
        <div className={s_title}>Route Complete</div>
        <div className={s_error}>{error}</div>
        <button
          type='button'
          onClick={onPlayAgain}
          className={s_play_again}
        >
          Play again
        </button>
      </div>
    )
  }

  if (!result) {
    return (
      <div className={s_panel}>
        <div className={s_title}>Calculating routes...</div>
        <Spinner />
      </div>
    )
  }

  const isOptimal = result.difference === 0
  const differenceLabel = isOptimal
    ? 'Optimal!'
    : `+${formatDuration(result.difference)}`

  return (
    <div className={s_panel}>
      <div className={s_title}>Route Complete</div>
      <div className={s_stats}>
        <div className={s_stat_row}>
          <span className={s_stat_label}>Your route</span>
          <span className={s_stat_value_blue}>
            {formatDuration(result.playerRouteTime)}
          </span>
        </div>
        <div className={s_stat_row}>
          <span className={s_stat_label}>Optimal route</span>
          <span className={s_stat_value_green}>
            {formatDuration(result.optimalTime)}
          </span>
        </div>
        <div className={s_divider} />
        <div className={s_stat_row}>
          <span className={s_stat_label}>Difference</span>
          <span className={sf_difference(isOptimal)}>{differenceLabel}</span>
        </div>
        <div className={s_stat_row}>
          <span className={s_stat_label}>Time spent</span>
          <span className={s_stat_value}>
            {formatGameTime(result.gameTime)}
          </span>
        </div>
      </div>
      <div className={s_legend}>
        <div className={s_legend_item}>
          <div className={s_legend_swatch_blue} />
          <span>Your route</span>
        </div>
        <div className={s_legend_item}>
          <div className={s_legend_swatch_green} />
          <span>Optimal route</span>
        </div>
      </div>
      <button
        type='button'
        onClick={onPlayAgain}
        className={s_play_again}
      >
        Play again
      </button>
    </div>
  )
}

const s_panel =
  'pointer-events-auto absolute bottom-4 right-4 z-30 flex w-72 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-lg'
const s_title = 'text-lg font-bold text-slate-900'
const s_error = 'text-sm text-red-600'
const s_stats = 'flex flex-col gap-2'
const s_stat_row = 'flex items-center justify-between'
const s_stat_label = 'text-sm text-slate-500'
const s_stat_value = 'text-sm font-semibold tabular-nums text-slate-700'
const s_stat_value_blue = 'text-sm font-semibold tabular-nums text-blue-600'
const s_stat_value_green = 'text-sm font-semibold tabular-nums text-green-600'
const sf_difference = (isOptimal: boolean) =>
  `text-sm font-bold tabular-nums ${isOptimal ? 'text-green-600' : 'text-amber-600'}`
const s_divider = 'border-t border-slate-100'
const s_legend = 'flex gap-4 text-xs text-slate-500'
const s_legend_item = 'flex items-center gap-1.5'
const s_legend_swatch_blue = 'h-2.5 w-5 rounded-sm bg-blue-500'
const s_legend_swatch_green = 'h-2.5 w-5 rounded-sm bg-green-500'
const s_play_again =
  'rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700 active:scale-95'
